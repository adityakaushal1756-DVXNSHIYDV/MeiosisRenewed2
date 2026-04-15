/**
 * Fuzzy-matches words in a transcribed phrase against a known medicine list
 * and replaces mis-transcribed medicine names with the correct spelling.
 *
 * Algorithm:
 *  - For each token in the text, try exact match (case-insensitive) first.
 *  - Then try Levenshtein distance within a threshold scaled to word length.
 *  - Also tries bigrams (two adjacent words) to catch multi-word medicine names.
 */

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  // Only allocate two rows
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

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function threshold(len: number): number {
  if (len <= 4) return 0;   // short words: exact only
  if (len <= 7) return 1;   // medium: 1 error allowed
  if (len <= 11) return 2;  // longer: 2 errors
  return 3;                  // very long: 3 errors
}

interface Match {
  canonical: string;
  dist: number;
}

function bestMatch(token: string, normMeds: string[], medicines: string[]): Match | null {
  const normToken = normalize(token);
  if (normToken.length < 4) return null;

  let best: Match | null = null;
  const maxDist = threshold(normToken.length);

  for (let i = 0; i < normMeds.length; i++) {
    const normMed = normMeds[i];
    // Skip if length difference alone exceeds threshold
    if (Math.abs(normMed.length - normToken.length) > maxDist + 1) continue;
    const dist = levenshtein(normToken, normMed);
    if (dist <= maxDist && (best === null || dist < best.dist)) {
      best = { canonical: medicines[i], dist };
    }
  }
  return best;
}

export function correctMedicineNames(text: string, medicines: string[]): string {
  if (!medicines.length || !text.trim()) return text;

  const normMeds = medicines.map(normalize);

  // Split into tokens preserving whitespace and punctuation
  const tokens = text.split(/(\s+)/);
  const words = tokens.filter((_, i) => i % 2 === 0); // even indices = words
  const gaps  = tokens.filter((_, i) => i % 2 !== 0); // odd indices = spaces

  const corrected: string[] = [];

  let i = 0;
  while (i < words.length) {
    const word = words[i];
    const clean = word.replace(/[.,;:!?()]/g, '');

    // Try bigram (current + next word) first for multi-word medicine names
    if (i + 1 < words.length) {
      const bigram = clean + ' ' + words[i + 1].replace(/[.,;:!?()]/g, '');
      const normBigram = normalize(bigram);
      let bigramBest: Match | null = null;
      const bigramMax = threshold(normBigram.length);
      for (let j = 0; j < normMeds.length; j++) {
        if (normMeds[j].includes(' ') || normMeds[j].length > 4) {
          const dist = levenshtein(normBigram, normMeds[j]);
          if (dist <= bigramMax && (bigramBest === null || dist < bigramBest.dist)) {
            bigramBest = { canonical: medicines[j], dist };
          }
        }
      }
      if (bigramBest && bigramBest.dist === 0) {
        // Exact bigram match — consume both words
        const suffix = words[i + 1].replace(/^[a-zA-Z0-9\s]*/g, ''); // trailing punct
        corrected.push(bigramBest.canonical + suffix);
        if (i + 1 < gaps.length) corrected.push(gaps[i + 1]);
        i += 2;
        continue;
      }
    }

    // Single word match
    const punct = word.replace(clean, '');
    const m = bestMatch(clean, normMeds, medicines);

    if (m && m.dist === 0) {
      // Exact match — preserve original casing if it already matches
      corrected.push(clean === word ? word : m.canonical + punct);
    } else if (m && m.dist > 0) {
      // Fuzzy match — replace with correct spelling, keep trailing punctuation
      corrected.push(m.canonical + punct);
    } else {
      corrected.push(word);
    }

    if (i < gaps.length) corrected.push(gaps[i]);
    i++;
  }

  return corrected.join('');
}
