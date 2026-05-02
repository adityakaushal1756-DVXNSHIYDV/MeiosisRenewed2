import { useState, useRef, useEffect } from 'react';
import { Trash2, ChevronDown, Maximize2 } from 'lucide-react';
import { PrescriptionRow as PrescriptionRowType } from '../../types/EMR';
import { MedicineAutocomplete } from './MedicineAutocomplete';

interface PrescriptionRowProps {
  row: PrescriptionRowType;
  onChange: (id: string, field: keyof PrescriptionRowType, value: string) => void;
  onRemove: (id: string) => void;
}

// Meal slot labels: positions 0=Breakfast, 1=Lunch, 2=Dinner, 3=Night
const SLOT_LABELS = ['Breakfast', 'Lunch', 'Dinner', 'Night'] as const;
const EXCLUDED_PATTERNS = new Set(['0011', '0101', '1001', '0111', '1101']);

const NOTE_QUICK_TAGS = [
  'Before meals',
  'After meals',
  'With meals',
  'Empty stomach',
  'With water',
  'Half tablet',
  'At bedtime',
  'Avoid dairy',
  'Avoid alcohol',
  'Chew before swallow',
] as const;

function generatePatterns(count: number): string[] {
  const results: string[] = [];
  for (let i = 0; i < 16; i++) {
    const bits = i.toString(2).padStart(4, '0');
    if (bits.split('').filter((b) => b === '1').length === count && !EXCLUDED_PATTERNS.has(bits))
      results.push(bits);
  }
  return results;
}

function patternLabel(pattern: string): string {
  return pattern
    .split('')
    .map((b, i) => (b === '1' ? SLOT_LABELS[i] : null))
    .filter(Boolean)
    .join(' + ');
}

function isValidPattern(s: string): boolean {
  return /^[01]{4}$/.test(s);
}

export function PrescriptionRow({ row, onChange, onRemove }: PrescriptionRowProps) {
  const currentPattern = isValidPattern(row.frequency) ? row.frequency : '1000';
  const currentCount = currentPattern.split('').filter((b) => b === '1').length;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  // noteOpen: whether the note bar is visible at all
  // noteExpanded: whether the full textarea+tags editor is shown (vs compact pill)
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);

  const [fusedMode, setFusedMode] = useState(false);
  const [fusedText, setFusedText] = useState("");
  const fusedInputRef = useRef<HTMLInputElement>(null);
  const noteBtnRef = useRef<HTMLButtonElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const noteAreaRef = useRef<HTMLDivElement>(null);

  // If row already has a note on mount, show it in compact mode
  useEffect(() => {
    if (row.notes) setNoteOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Collapse pattern dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [dropdownOpen]);

  // Collapse note to compact view on outside click
  useEffect(() => {
    if (!noteExpanded) return;
    function handleOutside(e: MouseEvent) {
      if (noteAreaRef.current && !noteAreaRef.current.contains(e.target as Node)) {
        setNoteExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [noteExpanded]);

  function handleNoteToggle() {
    if (noteOpen) {
      setNoteOpen(false);
      setNoteExpanded(false);
    } else {
      setNoteOpen(true);
      setNoteExpanded(true);
    }
  }

  function handleCountChange(count: number) {
    onChange(row.id, 'frequency', generatePatterns(count)[0]);
  }

  function handlePatternChange(pattern: string) {
    onChange(row.id, 'frequency', pattern);
    setDropdownOpen(false);
  }

  function handleTagClick(tag: string) {
    const active = row.notes.toLowerCase().includes(tag.toLowerCase());
    if (active) {
      const cleaned = row.notes
        .replace(
          new RegExp(`(;\\s*)?${tag}(;\\s*)?`, 'i'),
          (_: string, pre: string, post: string) => (pre && post ? '; ' : ''),
        )
        .trim()
        .replace(/^;\s*/, '')
        .replace(/;\s*$/, '');
      onChange(row.id, 'notes', cleaned);
    } else {
      const separator = row.notes.trim() ? '; ' : '';
      onChange(row.id, 'notes', row.notes.trim() + separator + tag);
    }
  }

  const patternOptions = generatePatterns(currentCount);

  return (
    <div className="rounded-3xl border border-wire/8 bg-slate-950/20 p-4">
      {/* Main row */}
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.6fr_1.5fr_auto_0.7fr_auto]">
        <MedicineAutocomplete
          value={row.medicineName}
          onChange={(val) => onChange(row.id, 'medicineName', val)}
          onSelect={(med) => {
            onChange(row.id, 'medicineId', String(med.id));
            onChange(row.id, 'identifier_brand', med.identifier_brand);
            onChange(row.id, 'generic_name', med.generic_name);
            if (med.substance_identifier) onChange(row.id, 'substance_identifier', med.substance_identifier);
            if (med.route_of_administration) onChange(row.id, 'route_of_administration', med.route_of_administration);
            if (med.dose_form) onChange(row.id, 'dose_form', med.dose_form);
            if (med.therapeutic_role) onChange(row.id, 'therapeutic_role', med.therapeutic_role);
            if (med.iupac_name) onChange(row.id, 'iupac_name', med.iupac_name);
            if (med.molecular_formula) onChange(row.id, 'molecular_formula', med.molecular_formula);
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              setFusedMode(true);
              setTimeout(() => fusedInputRef.current?.focus(), 0);
            }
          }}
          placeholder="Medicine name"
        />
        {fusedMode ? (
          <div className="col-span-2 lg:col-span-2 flex">
            <input
              ref={fusedInputRef}
              className="input-shell w-full py-1.5 text-sm"
              value={fusedText}
              onChange={(e) => setFusedText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  const text = fusedText.trim();
                  const freqMatch = text.match(/[01]{4}/);
                  if (freqMatch) {
                    onChange(row.id, "frequency", freqMatch[0]);
                  }
                  const duration = text.replace(/[01]{4}/, "").trim();
                  if (duration) {
                    onChange(row.id, "duration", duration);
                  }
                  setFusedMode(false);
                  setTimeout(() => noteBtnRef.current?.focus(), 0);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.stopPropagation();
                }
              }}
              placeholder="Type code (e.g. 1101 5 Days)"
            />
          </div>
        ) : (
          <>
            <input
              className="input-shell"
              value={row.dose}
              onChange={(e) => onChange(row.id, 'dose', e.target.value)}
              placeholder="Dose"
            />

            {/* Frequency: count selector + pattern dropdown */}
            <div className="flex flex-col gap-1.5">
              <div className="flex overflow-hidden rounded-xl border border-wire/10">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleCountChange(n)}
                    className={`flex-1 py-1.5 text-xs font-semibold transition ${
                      currentCount === n
                        ? 'bg-neon/20 text-neon'
                        : 'bg-transparent text-mist hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {n}×
                  </button>
                ))}
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-label="Dose timing pattern"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="input-shell flex w-full items-center justify-between gap-2 py-1.5 text-left text-xs"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="shrink-0 font-mono text-[10px] tracking-widest opacity-50">{currentPattern}</span>
                    <span className="truncate">{patternLabel(currentPattern)}</span>
                  </span>
                  <ChevronDown
                    size={13}
                    className={`shrink-0 text-mist transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-black/60 backdrop-blur-sm">
                    {patternOptions.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePatternChange(p)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                          p === currentPattern ? 'bg-neon/15 text-neon' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="w-[34px] shrink-0 font-mono text-[10px] tracking-widest opacity-50">{p}</span>
                        <span>{patternLabel(p)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Note toggle button */}
        <button
          ref={noteBtnRef}
          type="button"
          onClick={handleNoteToggle}
          title={noteOpen ? 'Hide note' : "Add doctor's note"}
          aria-expanded={noteOpen}
          className={`self-center inline-flex h-7 w-7 items-center justify-center rounded-full border text-[15px] font-bold leading-none transition-all duration-150 ${
            noteOpen || row.notes
              ? 'border-neon/40 bg-neon/[0.07] text-neon'
              : 'border-wire/20 text-mist/50 hover:border-neon/30 hover:text-neon'
          }`}
        >
          {noteOpen ? '−' : '+'}
        </button>

        {!fusedMode && (
          <input
            className="input-shell"
            value={row.duration}
            onChange={(e) => onChange(row.id, 'duration', e.target.value)}
            placeholder="Duration"
          />
        )}
        <button
          type="button"
          aria-label="Remove medicine row"
          onClick={() => onRemove(row.id)}
          className="ghost-btn min-h-[52px] px-4"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Note section */}
      {noteOpen && (
        <div ref={noteAreaRef} className="mt-3">
          {noteExpanded ? (
            /* ── Expanded: textarea + quick-tag rail ── */
            <div className="flex gap-2">
              <textarea
                autoFocus
                rows={2}
                className="input-shell flex-1 min-w-0 resize-none py-1.5 text-sm leading-5"
                value={row.notes}
                onChange={(e) => onChange(row.id, 'notes', e.target.value)}
                placeholder="Doctor's note (e.g. take after meals, avoid with dairy…)"
              />
              {/* Quick-tag rail */}
              <div className="flex flex-col gap-[3px] shrink-0 w-[120px]">
                {NOTE_QUICK_TAGS.map((tag) => {
                  const active = row.notes.toLowerCase().includes(tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`rounded-md px-2 py-[3px] text-[10.5px] text-left font-medium leading-[1.35] transition-all duration-200 ease-out border ${
                        active
                          ? 'border-neon/50 bg-neon/[0.12] text-neon scale-[1.02] shadow-[0_0_10px_rgba(0,255,136,0.15)]'
                          : 'border-white/10 bg-white/[0.04] text-white/55 hover:text-white/85 hover:border-white/20 hover:bg-white/[0.07]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Compact: pill preview + expand button ── */
            <div className="flex items-center gap-2">
              <div
                className="flex-1 min-w-0 cursor-text rounded-xl border border-wire/10 bg-white/[0.03] px-3 py-1.5"
                onClick={() => setNoteExpanded(true)}
              >
                {row.notes ? (
                  <p className="truncate text-xs text-white/70">{row.notes}</p>
                ) : (
                  <p className="text-xs text-white/25 italic">Add doctor's note…</p>
                )}
              </div>
              <button
                type="button"
                title="Expand note"
                onClick={() => setNoteExpanded(true)}
                className="shrink-0 flex items-center gap-1 rounded-lg border border-wire/10 bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/40 transition-all hover:border-white/15 hover:text-white/70"
              >
                <Maximize2 size={10} />
                <span>Expand</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
