import { useEffect, useRef, useState } from 'react';
import { FileText, Search, SlidersHorizontal, UserRound, X } from 'lucide-react';
import { Patient } from '../../types/Patient';
import { useTranslation } from '../../i18n/LanguageContext';

interface PatientSearchProps {
  query: string;
  patients: Patient[];
  selectedPatientId: string | null;
  viewRecordsPatientId: string | null;
  onQueryChange: (value: string) => void;
  onSelectPatient: (patientId: string) => void;
  onViewRecords: (patientId: string) => void;
  onCloseRecords: () => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const AVATAR_PALETTES = [
  'from-violet-500/80 to-purple-700/80',
  'from-sky-500/80 to-blue-700/80',
  'from-emerald-500/80 to-teal-700/80',
  'from-rose-500/80 to-pink-700/80',
  'from-amber-500/80 to-orange-600/80',
  'from-cyan-500/80 to-sky-600/80',
];

function avatarPalette(id: string) {
  const code = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

export function PatientSearch({
  query = "",
  patients = [],
  selectedPatientId,
  viewRecordsPatientId,
  onQueryChange,
  onSelectPatient,
  onViewRecords,
  onCloseRecords,
}: PatientSearchProps) {
  const { t } = useTranslation();
  const hasQuery = query.trim().length > 0;
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reset keyboard focus when results change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [patients]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0) {
      itemRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  // Use refs so the event listener always sees current values without re-registering
  const patientsRef = useRef(patients);
  const focusedIndexRef = useRef(focusedIndex);
  const selectedPatientIdRef = useRef(selectedPatientId);
  const viewRecordsPatientIdRef = useRef(viewRecordsPatientId);
  const onViewRecordsRef = useRef(onViewRecords);
  const onCloseRecordsRef = useRef(onCloseRecords);
  useEffect(() => { patientsRef.current = patients; }, [patients]);
  useEffect(() => { focusedIndexRef.current = focusedIndex; }, [focusedIndex]);
  useEffect(() => { selectedPatientIdRef.current = selectedPatientId; }, [selectedPatientId]);
  useEffect(() => { viewRecordsPatientIdRef.current = viewRecordsPatientId; }, [viewRecordsPatientId]);
  useEffect(() => { onViewRecordsRef.current = onViewRecords; }, [onViewRecords]);
  useEffect(() => { onCloseRecordsRef.current = onCloseRecords; }, [onCloseRecords]);

  // Global keydown — works regardless of which element is focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const pts = patientsRef.current;
      if (pts.length === 0) return;
      // Don't intercept when user is typing in an input/textarea (except arrow keys which are safe)
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < pts.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === ' ' && !isTyping) {
        e.preventDefault();
        const idx = focusedIndexRef.current >= 0
          ? focusedIndexRef.current
          : pts.findIndex((p) => p.id === selectedPatientIdRef.current);
        if (idx < 0 || idx >= pts.length) return;
        const patient = pts[idx];
        if (viewRecordsPatientIdRef.current === patient.id) {
          onCloseRecordsRef.current();
        } else {
          onViewRecordsRef.current(patient.id);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []); // empty deps — stable via refs

  return (
    <section className="flex h-full min-h-0 flex-col p-6 overflow-hidden rounded-[24px] bg-[#031525]/60 backdrop-blur-md border border-white/5 shadow-2xl">
      {/* Search input + results count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mist"
            size={15}
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('ps.placeholder')}
            className="input-shell pl-10 pr-10"
          />
          {hasQuery && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-0.5 text-mist transition hover:text-white"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {patients.length > 0 && (
          <span className="shrink-0 rounded-full border border-neon/20 bg-neonSoft px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neon">
            {patients.length} {patients.length !== 1 ? t('ps.results') : t('ps.result')}
          </span>
        )}
      </div>

      {/* Keyboard hint */}
      {patients?.length > 0 && (
        <p className="mt-2 text-[10px] text-mist/40 select-none">
          ↑↓ navigate · <kbd className="rounded bg-white/[0.06] px-1 py-0.5 font-mono">space</kbd> open/close records
        </p>
      )}

      {/* Results */}
      <div ref={listRef} className="scroll-skin mt-4 min-h-0 flex-1 space-y-2.5 overflow-auto pr-1">
        {(patients?.length || 0) === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 pb-8 pt-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-wire/10 bg-slate-950/30 text-mist">
              <UserRound size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-white/60">
                {hasQuery ? t('ps.no_results') : t('ps.start_search')}
              </p>
              {hasQuery && (
                <p className="mt-1 text-xs text-mist">{t('ps.try_different')}</p>
              )}
            </div>
          </div>
        ) : (
          patients.map((patient, idx) => {
            const isSelected = selectedPatientId === patient.id;
            const isFocused = focusedIndex === idx;
            const isRecordsOpen = viewRecordsPatientId === patient.id;
            return (
              <div
                key={patient.id}
                ref={(el) => { itemRefs.current[idx] = el; }}
                onClick={() => { onSelectPatient(patient.id); setFocusedIndex(idx); }}
                className={[
                  'group relative w-full cursor-pointer overflow-hidden rounded-3xl border p-4 text-left transition duration-200',
                  isFocused && !isSelected
                    ? 'border-sky-400/30 bg-sky-400/[0.05] shadow-[0_0_0_2px_rgba(56,189,248,0.15)]'
                    : isSelected
                    ? 'border-neon/30 bg-neonSoft/30 shadow-[0_0_0_1px_rgba(82,255,157,0.12)]'
                    : 'border-wire/8 bg-white/[0.025] hover:border-wire/18 hover:bg-white/[0.04]',
                ].join(' ')}
              >
                {/* Selection accent bar */}
                {isSelected && (
                  <div className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-neon/70" />
                )}
                {/* Keyboard focus accent bar */}
                {isFocused && !isSelected && (
                  <div className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-sky-400/70" />
                )}

                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <div
                    className={[
                      'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-bold text-white shadow-sm',
                      avatarPalette(patient.id),
                    ].join(' ')}
                  >
                    {initials(patient.name)}
                    {isSelected && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel bg-neon" />
                    )}
                    {isFocused && !isSelected && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel bg-sky-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    {/* Name + ID row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{patient.name}</span>
                      <span className="rounded-lg border border-wire/10 bg-slate-950/30 px-2 py-0.5 font-mono text-[10px] text-mist">
                        {patient.id}
                      </span>
                    </div>

                    {/* Demographics */}
                    <p className="mt-1 text-xs text-mist">
                      {patient.age} yrs · {patient.gender} · {patient.phone}
                    </p>

                    {/* Visit reason */}
                    <p className="mt-2 line-clamp-1 text-xs text-white/70">{patient.visitReason}</p>

                    {/* Chronic conditions chips */}
                    {patient.chronicConditions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {patient.chronicConditions.slice(0, 3).map((cond) => (
                          <span
                            key={cond}
                            className="rounded-full border border-amber-400/20 bg-amber-400/8 px-2 py-0.5 text-[10px] text-amber-300/80"
                          >
                            {cond}
                          </span>
                        ))}
                        {patient.chronicConditions.length > 3 && (
                          <span className="rounded-full border border-wire/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-mist">
                            +{patient.chronicConditions.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bottom row: MEIOSIS code + action */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-neon/60">
                        {patient.meiosisCode}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isRecordsOpen) {
                            onCloseRecords();
                          } else {
                            onViewRecords(patient.id);
                          }
                        }}
                        className={[
                          'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-medium transition duration-150',
                          isRecordsOpen
                            ? 'border-sky-400/30 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20'
                            : 'border-neon/20 bg-neonSoft text-neon hover:border-neon/40 hover:bg-neon/15 hover:shadow-[0_4px_14px_rgba(82,255,157,0.12)]',
                        ].join(' ')}
                      >
                        <FileText size={12} />
                        {isRecordsOpen ? 'Close Records' : 'View Records'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
