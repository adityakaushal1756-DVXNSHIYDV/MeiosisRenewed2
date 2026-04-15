import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  ChevronDown,
  Pill,
  Stethoscope,
  X,
  XCircle
} from 'lucide-react';
import { Patient, PatientPastAppointment } from '../../types/Patient';

/* ── Helpers ──────────────────────────────────────────────── */

const TIMING_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Night'] as const;
function patternLabel(code: string | undefined): string {
  if (!code || !/^[01]{4}$/.test(code)) return '';
  const slots = code.split('').map((b, i) => b === '1' ? TIMING_SLOTS[i] : null).filter(Boolean);
  return slots.length ? slots.join(' + ') : '';
}

function toTs(str: string): number {
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

function parseDateLabel(str: string): { top: string; bottom: string } {
  const parts = str.trim().split(/\s+/);
  const d = new Date(parts[0]);
  if (isNaN(d.getTime())) return { top: str, bottom: '' };
  const day = d.getDate().toString().padStart(2, '0');
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  const yr  = d.getFullYear();
  const time = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return { top: `${day} ${mon} ${yr}`, bottom: time };
}

/* ── Detail panel shown when a card is expanded ─────────── */

function AppointmentDetail({ appt, onClose }: { appt: PatientPastAppointment; onClose: () => void }) {
  const label = parseDateLabel(appt.date);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const isDone = appt.status === 'Completed';

  function toggleNote(i: number) {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const hasClinical = appt.purpose || appt.symptoms || appt.diagnosis || appt.notes;

  return (
    <div className="page-enter flex h-full flex-col gap-3">
      {/* Back */}
      <button type="button" onClick={onClose} className="ghost-btn gap-2 py-1.5 text-xs self-start">
        <ArrowLeft size={13} /> Back to Timeline
      </button>

      {/* Header */}
      <div className={`rounded-2xl border p-4 ${isDone
        ? 'border-emerald-400/20 bg-[linear-gradient(135deg,rgba(52,211,153,0.08),rgba(52,211,153,0.02))]'
        : 'border-red-400/20 bg-[linear-gradient(135deg,rgba(248,113,113,0.08),rgba(248,113,113,0.02))]'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
            isDone ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400' : 'border-red-400/20 bg-red-400/10 text-red-400'
          }`}>
            <CalendarCheck2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-bold text-white">{appt.doctorName}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                isDone ? 'bg-emerald-400/12 text-emerald-300' : 'bg-red-400/12 text-red-300'
              }`}>{appt.status}</span>
              <span className="chip chip-blue text-[10px]">{appt.mode}</span>
            </div>
            <p className="mt-0.5 text-[12px] text-mist">{appt.specialty} · {label.top}{label.bottom ? ` · ${label.bottom}` : ''}</p>
          </div>
          {appt.followUp && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1 text-[11px] text-amber-300 flex-shrink-0">
              <CalendarClock size={10} /> {appt.followUp}
            </div>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div
        className="scroll-skin grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1"
        style={{ gridTemplateColumns: hasClinical ? '1fr 1.45fr' : '1fr' }}
      >
        {/* ── LEFT: Clinical notes ── */}
        {hasClinical && (
          <div className="space-y-2.5">
            {appt.purpose && (
              <ClipRow label="Visit reason" icon={<Stethoscope size={11} />}>
                <p className="text-[13px] leading-6 text-white/85">{appt.purpose}</p>
              </ClipRow>
            )}
            {appt.symptoms && (
              <ClipRow label="Symptoms" icon={<AlertTriangle size={11} />}>
                <p className="text-[13px] leading-6 text-white/85">{appt.symptoms}</p>
              </ClipRow>
            )}
            {appt.diagnosis && (
              <ClipRow label="Diagnosis" icon={<Activity size={11} />}>
                <p className="text-[13px] leading-6 text-white/85">{appt.diagnosis}</p>
              </ClipRow>
            )}
            {appt.notes && (
              <ClipRow label="Doctor notes" icon={<Stethoscope size={11} />}>
                <p className="text-[13px] leading-6 text-white/80">{appt.notes}</p>
              </ClipRow>
            )}
          </div>
        )}

        {/* ── RIGHT: Medications ── */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Pill size={12} className="text-sky/70" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist/60">
              Medications{appt.medications?.length ? ` · ${appt.medications.length}` : ''}
            </span>
          </div>

          {(!appt.medications || appt.medications.length === 0) ? (
            <p className="text-[12px] italic text-mist/40">No medications prescribed.</p>
          ) : (
            <div className="space-y-2">
              {appt.medications.map((m, i) => {
                const isExpanded = expandedNotes.has(i);
                const noteIsLong = (m.notes?.length ?? 0) > 72;
                return (
                  <div key={i} className="overflow-hidden rounded-2xl border border-sky/12 bg-sky/[0.03]">
                    {/* Medicine header row */}
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3.5 py-2.5">
                      <span className="text-[13px] font-semibold text-sky">{m.name}</span>
                      {m.dose && (
                        <span className="text-[12px] text-white/70">{m.dose}</span>
                      )}
                      {m.frequency && (
                        <span className="text-[11px] text-mist/80">
                          <span className="font-mono">{m.frequency}</span>
                          {patternLabel(m.frequency) && (
                            <span className="text-mist/55"> · {patternLabel(m.frequency)}</span>
                          )}
                        </span>
                      )}
                      {m.duration && (
                        <span className="ml-auto flex-shrink-0 rounded-full border border-wire/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-mist/60">
                          {m.duration}
                        </span>
                      )}
                    </div>

                    {/* Doctor's note — visible by default, collapsible if long */}
                    {m.notes && (
                      <div className="border-t border-sky/10 bg-sky/[0.05] px-3.5 pb-2.5 pt-2">
                        <p className={`text-[12px] leading-[1.6] text-sky/80 ${!isExpanded && noteIsLong ? 'line-clamp-2' : ''}`}>
                          {m.notes}
                        </p>
                        {noteIsLong && (
                          <button
                            type="button"
                            onClick={() => toggleNote(i)}
                            className="mt-1 flex items-center gap-0.5 text-[10px] font-semibold text-sky/50 transition hover:text-sky/80"
                          >
                            <ChevronDown
                              size={10}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClipRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-wire/8 bg-white/[0.02] px-3.5 py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist/55">
        {icon}{label}
      </div>
      {children}
    </div>
  );
}

/* ── Main modal ───────────────────────────────────────────── */

interface AppointmentsTimelineModalProps {
  patient: Patient;
  onClose: () => void;
}

export function AppointmentsTimelineModal({ patient, onClose }: AppointmentsTimelineModalProps) {
  const appointments = [...patient.pastAppointments].sort((a, b) => toTs(b.date) - toTs(a.date));
  const [activeIndex,   setActiveIndex]   = useState(0);
  const [selectedAppt,  setSelectedAppt]  = useState<PatientPastAppointment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef    = useRef<number>(0);

  /* ── Close on Escape ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* ── Scroll-driven scale + opacity (same as EMRTimeline) ── */
  const updateScales = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const focal = container.scrollTop + container.clientHeight * 0.42;
    let nearest = 0, nearestDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const elMid = el.offsetTop + el.offsetHeight / 2;
      const dist  = Math.abs(focal - elMid);
      if (dist < nearestDist) { nearestDist = dist; nearest = i; }
      const horizon = container.clientHeight * 0.50;
      const ratio   = Math.min(dist / horizon, 1);
      el.style.transform = `scale(${(1 - ratio * 0.07).toFixed(4)})`;
      el.style.opacity   = (1 - ratio * 0.52).toFixed(4);
    });
    setActiveIndex(nearest);
  }, []);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateScales);
  }, [updateScales]);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(updateScales));
    return () => { cancelAnimationFrame(id); cancelAnimationFrame(rafRef.current); };
  }, [appointments.length, updateScales, selectedAppt]);

  const completed = appointments.filter(a => a.status === 'Completed').length;
  const cancelled = appointments.filter(a => a.status === 'Cancelled').length;

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* ── Panel ── */}
      <div
        className="relative flex w-full max-w-5xl flex-col rounded-[32px] border border-wire/12 bg-[#080f1c] shadow-[0_32px_100px_rgba(0,0,0,0.8)]"
        style={{ height: 'min(92vh, 860px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close button ── */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-2xl border border-wire/10 bg-white/[0.04] text-mist transition hover:bg-white/[0.08] hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* ── Header ── */}
        <div className="flex-shrink-0 border-b border-wire/8 px-7 py-5">
          <div className="flex flex-wrap items-center gap-3 pr-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-sky/20 text-sm font-bold text-white">
              {patient.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{patient.name}</h2>
              <p className="text-[11px] text-mist">Appointment history</p>
            </div>
            <div className="flex flex-wrap gap-2 ml-2">
              <span className="chip border-wire/10 bg-white/[0.03] text-white/60">{appointments.length} total</span>
              <span className="chip border-emerald-400/20 bg-emerald-400/8 text-emerald-300">{completed} completed</span>
              {cancelled > 0 && (
                <span className="chip border-red-400/20 bg-red-400/8 text-red-300">{cancelled} cancelled</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="min-h-0 flex-1 px-7 py-5">
          {appointments.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <XCircle size={32} className="opacity-20" />
              <p className="text-sm text-mist">No appointments on record yet.</p>
            </div>
          ) : selectedAppt ? (
            <AppointmentDetail appt={selectedAppt} onClose={() => setSelectedAppt(null)} />
          ) : (
            /* ── Timeline ── */
            <div className="relative h-full overflow-hidden rounded-3xl border border-wire/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.008)_100%)]">
              <div className="timeline-fade-top pointer-events-none absolute inset-x-0 top-0 z-10 h-10" />
              <div className="timeline-fade-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10" />

              <div ref={scrollRef} onScroll={onScroll} className="scroll-skin h-full overflow-y-auto">
                <div className="relative px-2">
                  {/* Vertical line */}
                  <div className="pointer-events-none absolute bottom-0 left-[184px] top-0 w-px bg-white/[0.08]" />

                  <div className="h-[8vh]" />

                  {appointments.map((appt, index) => {
                    const isActive = index === activeIndex;
                    const isLast   = index === appointments.length - 1;
                    const label    = parseDateLabel(appt.date);
                    const isDone   = appt.status === 'Completed';

                    return (
                      <div
                        key={appt.id}
                        ref={(el) => { itemRefs.current[index] = el; }}
                        className={`timeline-item-transition flex items-start ${isLast ? 'pb-4' : 'pb-6'}`}
                      >
                        {/* DATE — left of line */}
                        <div className="w-36 flex-shrink-0 pr-5 pt-[22px] text-right">
                          <div className={`text-[13px] font-bold leading-snug ${isDone ? 'text-emerald-300' : 'text-red-300'}`}>
                            {label.top}
                          </div>
                          {label.bottom && (
                            <div className="mt-0.5 text-[11px] text-mist/70">{label.bottom}</div>
                          )}
                          <div className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${isDone ? 'text-emerald-400/50' : 'text-red-400/50'}`}>
                            {appt.mode === 'Teleconsult' ? 'Teleconsult' : 'Visit'}
                          </div>
                        </div>

                        {/* DOT */}
                        <div className="relative z-10 flex w-12 flex-shrink-0 justify-center pt-[24px]">
                          <div className={[
                            'rounded-full transition-all duration-300',
                            isActive
                              ? isDone
                                ? 'h-[16px] w-[16px] bg-emerald-400 shadow-[0_0_20px_6px_rgba(52,211,153,0.55)] ring-2 ring-emerald-400/30'
                                : 'h-[16px] w-[16px] bg-red-400 shadow-[0_0_20px_6px_rgba(248,113,113,0.55)] ring-2 ring-red-400/30'
                              : isDone
                                ? 'h-[10px] w-[10px] bg-emerald-500/40'
                                : 'h-[10px] w-[10px] bg-red-500/40'
                          ].join(' ')} />
                        </div>

                        {/* CARD */}
                        <div className="flex-1 pl-5 pr-3">
                          <button
                            type="button"
                            onClick={() => setSelectedAppt(appt)}
                            className={[
                              'group w-full cursor-pointer rounded-2xl border text-left transition-all duration-300',
                              isActive
                                ? isDone
                                  ? 'border-emerald-400/40 bg-[linear-gradient(135deg,rgba(52,211,153,0.11),rgba(52,211,153,0.03))] shadow-[0_8px_36px_rgba(52,211,153,0.10)]'
                                  : 'border-red-400/35 bg-[linear-gradient(135deg,rgba(248,113,113,0.10),rgba(248,113,113,0.03))] shadow-[0_8px_36px_rgba(248,113,113,0.10)]'
                                : isDone
                                  ? 'border-emerald-400/10 bg-[linear-gradient(135deg,rgba(52,211,153,0.04),rgba(52,211,153,0.01))] hover:border-emerald-400/30 hover:shadow-[0_4px_20px_rgba(52,211,153,0.07)]'
                                  : 'border-red-400/10 bg-[linear-gradient(135deg,rgba(248,113,113,0.04),rgba(248,113,113,0.01))] hover:border-red-400/25 hover:shadow-[0_4px_20px_rgba(248,113,113,0.07)]'
                            ].join(' ')}
                          >
                            <div className="p-5">
                              <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`mt-0.5 flex-shrink-0 rounded-xl p-3 transition-colors ${
                                  isDone
                                    ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-400'
                                    : 'border border-red-400/20 bg-red-400/10 text-red-400'
                                }`}>
                                  <CalendarCheck2 size={18} />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[15px] font-semibold text-white">{appt.doctorName}</span>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                      isDone ? 'bg-emerald-400/12 text-emerald-300' : 'bg-red-400/12 text-red-300'
                                    }`}>{appt.status}</span>
                                    <span className="chip chip-blue text-[10px]">{appt.mode}</span>
                                  </div>
                                  <div className="mt-0.5 text-[13px] text-mist">{appt.specialty}</div>
                                  {(appt.diagnosis || appt.purpose) && (
                                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-white/55">
                                      {appt.diagnosis || appt.purpose}
                                    </p>
                                  )}

                                  {/* Medication chips */}
                                  {appt.medications && appt.medications.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {appt.medications.slice(0, 3).map((m, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 rounded-full border border-sky/15 bg-sky/[0.06] px-2 py-0.5 text-[10px] text-sky/80">
                                          <Pill size={8} />{m.name}
                                        </span>
                                      ))}
                                      {appt.medications.length > 3 && (
                                        <span className="rounded-full border border-wire/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-mist/60">
                                          +{appt.medications.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Follow-up badge */}
                                  {appt.followUp && (
                                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-0.5 text-[10px] text-amber-300">
                                      <CalendarClock size={9} /> Follow-up: {appt.followUp}
                                    </div>
                                  )}
                                </div>

                                {/* Expand hint */}
                                <ChevronDown
                                  size={14}
                                  className={`mt-1.5 flex-shrink-0 transition-transform duration-200 group-hover:translate-y-0.5 ${
                                    isDone ? 'text-emerald-400/45' : 'text-red-400/45'
                                  }`}
                                />
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="h-[10vh]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
