export interface MedicineDBRecord {
  id: number; // internal numeric ID
  identifier_brand: string; // numeric SNOMED brand code
  brand_name: string; // human-readable brand name
  generic_name: string; // generic / INN name
  substance_identifier?: string;
  route_of_administration?: string;
  dose_form?: string; // SNOMED code — mapped to label by DOSE_FORM_LABELS below
  dose_form_label?: string; // human-readable resolved label (added client-side)
  therapeutic_role?: string;
  indication?: string;
  substance_name?: string;
  iupac_name?: string;
  molecular_formula?: string;
}

// Common SNOMED dose-form concept codes → readable label
const DOSE_FORM_LABELS: Record<string, string> = {
  "1163573008": "Film-coated Tablet",
  "385055001": "Tablet",
  "385049006": "Capsule",
  "385023001": "Oral Solution",
  "385024007": "Oral Suspension",
  "385025008": "Powder for Solution",
  "385026009": "Granules",
  "385027000": "Effervescent Tablet",
  "385057009": "Modified-release Tablet",
  "385058004": "Dispersible Tablet",
  "385060002": "Sublingual Tablet",
  "420243009": "Powder",
  "385219001": "Injection Solution",
  "385229008": "Infusion",
  "385101003": "Eye Drops",
  "385102005": "Ear Drops",
  "385103000": "Nose Drops",
  "385104006": "Nasal Spray",
  "385108009": "Inhalation Powder",
  "385111005": "Inhalation Solution",
  "385114002": "Cream",
  "385115001": "Ointment",
  "385116000": "Gel",
  "385117009": "Patch",
  "385118004": "Suppository",
  "385119007": "Pessary",
  "385120001": "Foam",
  "385121002": "Shampoo",
  "385122009": "Lotion",
};

// Loaded from Vite env vars (baked in at dev-server start time)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_MEDICINE_URL as
  | string
  | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_MEDICINE_ANON_KEY as
  | string
  | undefined;

if (typeof window !== "undefined") {
  console.log(
    "[MedicineSearch] Supabase URL:",
    SUPABASE_URL ? "✅ " + SUPABASE_URL : "❌ MISSING — restart Vite!",
  );
}

// ── Levenshtein distance (for fuzzy fallback) ─────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Computes the best fuzzy score for a query against a medicine record.
 * Checks full name AND prefix-length window (so "amox" scores well against "amoxicillin").
 */
function fuzzyScore(query: string, item: MedicineDBRecord): number {
  const q = query.toLowerCase();
  const candidates = [
    item.generic_name.toLowerCase(),
    item.brand_name.toLowerCase(),
    (item.substance_name ?? '').toLowerCase(),
  ];
  let best = Infinity;
  for (const c of candidates) {
    if (!c) continue;
    best = Math.min(
      best,
      levenshtein(q, c),
      levenshtein(q, c.substring(0, q.length)), // prefix window
    );
  }
  return best;
}

/**
 * Maximum allowed edit distance for a query of given length.
 * Short queries require a tighter match to avoid noise.
 */
function fuzzyThreshold(len: number): number {
  if (len <= 4) return 1;
  if (len <= 7) return 2;
  if (len <= 11) return 3;
  return 4;
}

// ── Synonym expansion ──────────────────────────────────────────────────────
// Many drugs have multiple internationally recognised names (INN vs. BAN vs.
// USAN). Your database uses INN in generic_name but doctors may type any alias.
// This map ensures typing one name always finds the other.
const SYNONYMS: Record<string, string[]> = {
  paracetamol: ["acetaminophen"],
  acetaminophen: ["paracetamol"],
  adrenaline: ["epinephrine"],
  epinephrine: ["adrenaline"],
  noradrenaline: ["norepinephrine"],
  norepinephrine: ["noradrenaline"],
  frusemide: ["furosemide"],
  furosemide: ["frusemide"],
  salbutamol: ["albuterol"],
  albuterol: ["salbutamol"],
  pethidine: ["meperidine"],
  meperidine: ["pethidine"],
  lignocaine: ["lidocaine"],
  lidocaine: ["lignocaine"],
  ibuprofen: ["ibuprufen"],
  omeprazole: ["omeperazole"],
  amoxicillin: ["amoxycillin"],
  amoxycillin: ["amoxicillin"],
};

/** Expand a query into itself + any known synonyms */
function expandQuery(q: string): string[] {
  const lower = q.toLowerCase().trim();
  const syns = SYNONYMS[lower] ?? [];
  return [lower, ...syns];
}

const SELECT_COLS =
  "id,identifier_brand,brand_name,generic_name,substance_identifier," +
  "route_of_administration,dose_form,therapeutic_role,indication," +
  "substance_name,iupac_name,molecular_formula";

/** Shared headers for every Supabase REST call. */
function supabaseHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    "Accept-Profile": "public",
  };
}

/** Deduplicate raw rows by brand_name and resolve dose_form labels. */
function deduplicateRaw(
  raw: MedicineDBRecord[],
  cap: number,
  seen: Set<string> = new Set(),
): MedicineDBRecord[] {
  const out: MedicineDBRecord[] = [];
  for (const item of raw) {
    const key = item.brand_name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push({
        ...item,
        dose_form_label: item.dose_form
          ? (DOSE_FORM_LABELS[item.dose_form] ?? undefined)
          : undefined,
      });
    }
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Fuzzy fallback: fetch up to 300 candidates whose generic_name or brand_name
 * starts with the first 4 characters of the query, then rank by edit distance.
 * Used when the keyword search returns fewer than 3 results.
 */
async function fuzzyFallback(
  query: string,
  alreadySeen: Set<string>,
): Promise<MedicineDBRecord[]> {
  const q = query.toLowerCase().trim();
  if (q.length < 3) return [];

  const prefix = encodeURIComponent(q.substring(0, Math.min(4, q.length)));
  const fallbackUrl =
    `${SUPABASE_URL}/rest/v1/drug_master` +
    `?select=${SELECT_COLS}` +
    `&limit=300` +
    `&or=(generic_name.ilike.${prefix}*,brand_name.ilike.${prefix}*)`;

  let raw: MedicineDBRecord[] = [];
  try {
    const res = await fetch(fallbackUrl, { headers: supabaseHeaders() });
    if (!res.ok) return [];
    raw = await res.json();
  } catch {
    return [];
  }

  const maxDist = fuzzyThreshold(q.length);

  // Score and filter
  const scored = raw
    .map((item) => ({ item, score: fuzzyScore(q, item) }))
    .filter(({ score }) => score <= maxDist);

  // Sort by score ascending
  scored.sort((a, b) => a.score - b.score);

  // Deduplicate (skip anything already in keyword results)
  return deduplicateRaw(
    scored.map(({ item }) => item),
    15,
    alreadySeen,
  );
}

export async function searchMedicines(
  query: string,
): Promise<MedicineDBRecord[]> {
  const q = query.trim();
  if (!q) return [];

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "[MedicineSearch] ❌ Env vars missing. Restart `npm run dev`.",
    );
    return [];
  }

  try {
    // ── 1. Keyword search (existing behaviour) ────────────────────────────
    const terms = expandQuery(q);

    const orConditions = terms
      .flatMap((t) => {
        const safe = encodeURIComponent(t);
        return [
          `generic_name.ilike.*${safe}*`,
          `brand_name.ilike.*${safe}*`,
          `substance_name.ilike.*${safe}*`,
        ];
      })
      .join(",");

    const fetchUrl =
      `${SUPABASE_URL}/rest/v1/drug_master` +
      `?select=${SELECT_COLS}` +
      `&limit=100` +
      `&or=(${orConditions})`;

    const response = await fetch(fetchUrl, { headers: supabaseHeaders() });

    if (!response.ok) {
      console.warn("[MedicineSearch] Supabase error:", await response.text());
      return [];
    }

    const raw: MedicineDBRecord[] = await response.json();
    const lower = q.toLowerCase();

    const seenKeys = new Set<string>();
    const unique = deduplicateRaw(raw, 20, seenKeys);

    // Sort keyword results by relevance tier
    function relevance(item: MedicineDBRecord): number {
      const gn = item.generic_name.toLowerCase();
      const bn = item.brand_name.toLowerCase();
      if (gn.startsWith(lower)) return 0;
      if (gn.includes(lower)) return 1;
      if (bn.startsWith(lower)) return 2;
      return 3;
    }
    unique.sort((a, b) => relevance(a) - relevance(b));

    // ── 2. Fuzzy fallback when keyword results are thin ───────────────────
    // Triggered when we got fewer than 3 exact/substring matches, which
    // usually means the user typed a near-miss (e.g. "amoxicilin").
    if (unique.length < 3) {
      const fuzzyResults = await fuzzyFallback(q, seenKeys);
      unique.push(...fuzzyResults);
    }

    return unique;
  } catch (err) {
    console.error("[MedicineSearch] Critical failure:", err);
    return [];
  }
}
