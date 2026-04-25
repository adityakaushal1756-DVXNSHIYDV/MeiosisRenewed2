import { useCallback, useEffect, useRef, useState, Fragment } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  FlaskConical,
  HeartPulse,
  LayoutList,
  Pill,
  PlusCircle,
  Stethoscope,
  StickyNote,
  Shield,
  User,
  UserCheck,
  X,
  XCircle
} from 'lucide-react';
import { assetUrl } from '../../lib/api';
import type { Patient, PatientPastAppointment, PatientMedicalReport } from '../../types/Patient';

/* ─────────────────────────────────────────────────────────── */
/*  Data helpers                                               */
/* ─────────────────────────────────────────────────────────── */

export type TimelineEvent =
  | { kind: 'appointment'; date: string; sortTs: number; data: PatientPastAppointment }
  | { kind: 'lab';         date: string; sortTs: number; data: PatientMedicalReport   };

export function toTs(str: string): number {
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

export function buildTimeline(patient: Patient): TimelineEvent[] {
  const appts: TimelineEvent[] = patient.pastAppointments.map((a) => ({
    kind: 'appointment', date: a.date, sortTs: toTs(a.date), data: a
  }));
  const labs: TimelineEvent[] = patient.medicalReports.map((r) => ({
    kind: 'lab', date: r.reportDate, sortTs: toTs(r.reportDate), data: r
  }));
  return [...appts, ...labs].sort((a, b) => b.sortTs - a.sortTs);
}

export function parseDateLabel(str: string): { top: string; bottom: string } {
  const parts = str.trim().split(/\s+/);
  const d = new Date(parts[0]);
  if (isNaN(d.getTime())) return { top: str, bottom: '' };
  const day = d.getDate().toString().padStart(2, '0');
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  const yr  = d.getFullYear();
  const time = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return { top: `${day} ${mon} ${yr}`, bottom: time };
}

/* ─────────────────────────────────────────────────────────── */
/*  Main component                                             */
/* ─────────────────────────────────────────────────────────── */

interface EMRTimelineProps {
  patient: Patient | null;
  onBuildEMR: () => void;
  accessLevel: 'full' | 'lab' | 'summary' | null;
  prescriptionLayout?: 'classic' | 'wide';
}

export function EMRTimeline({ patient, onBuildEMR, accessLevel, prescriptionLayout = 'classic' }: EMRTimelineProps) {
  const [activeIndex,   setActiveIndex]   = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showOverview,  setShowOverview]  = useState(false);
  const [viewKey,       setViewKey]       = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef    = useRef<number>(0);

  const rawTimeline = patient ? buildTimeline(patient) : [];
  const timeline = rawTimeline.filter(ev => {
    if (accessLevel === 'full') return true;
    if (accessLevel === 'lab') return ev.kind === 'lab';
    if (accessLevel === 'summary' || accessLevel === null) return false;
    return true;
  });

  /* ─ Navigation helpers (each increments viewKey to trigger animation) ── */
  const openDetail = useCallback((ev: TimelineEvent) => {
    setViewKey(k => k + 1);
    setSelectedEvent(ev);
  }, []);

  const openOverview = useCallback(() => {
    setViewKey(k => k + 1);
    setShowOverview(true);
  }, []);

  const backToTimeline = useCallback(() => {
    setViewKey(k => k + 1);
    setSelectedEvent(null);
    setShowOverview(false);
  }, []);

  /* ─ Scroll-driven scale + opacity ─────────────────────── */
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
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => { updateScales(); });
    });
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(rafRef.current); };
  }, [timeline.length, updateScales, selectedEvent]);

  /* ─ Empty states ──────────────────────────────────────── */
  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Stethoscope size={36} className="mx-auto mb-4 text-mist/40" />
        <h2 className="text-xl font-semibold text-white">No patient selected</h2>
        <p className="mt-2 text-sm text-mist">Scan a patient NFC code or search by name to load their timeline.</p>
      </div>
    );
  }

  if (!timeline.length) {
    if (accessLevel === null || accessLevel === 'summary') {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shield size={36} className="mx-auto mb-4 text-amber-500/40" />
          <h2 className="text-xl font-semibold text-white">Access Restricted</h2>
          <p className="mt-2 text-sm text-mist max-w-sm mx-auto">
            The patient has restricted access to their historical records. 
            You can still build a new EMR for the current consultation.
          </p>
          <button type="button" onClick={onBuildEMR} className="action-btn mt-6 gap-2">
            <PlusCircle size={16} /> Start Consultation
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <button type="button" onClick={onBuildEMR} className="action-btn mb-4 gap-2">
          <PlusCircle size={16} /> Build EMR
        </button>
        <p className="text-sm text-mist">No appointments or lab reports on record yet.</p>
      </div>
    );
  }

  /* ─ Overview view ─────────────────────────────────────── */
  if (showOverview) {
    return (
      <OverviewPage
        key={viewKey}
        patient={patient}
        timeline={timeline}
        onBack={backToTimeline}
        onBuildEMR={onBuildEMR}
        onSelectEvent={(ev) => { setViewKey(k => k + 1); setShowOverview(false); setSelectedEvent(ev); }}
      />
    );
  }

  const currentEvent = timeline[activeIndex];

  /* ─ Timeline list (always rendered; detail is a modal overlay) ─ */
  return (
    <>
    <div className="page-enter flex flex-col">

      {/* ── Header ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-blue"><Stethoscope size={13} />{patient.name}</span>
          <span className="chip border-wire/10 bg-white/[0.03] text-white/60">{timeline.length} records</span>
          {patient.primaryDoctorName && (
            <span className="chip border-sky/25 bg-sky/10 text-sky text-xs">
              <UserCheck size={12} />
              {patient.primaryDoctorName}
            </span>
          )}
          {currentEvent && (
            <span className={`chip text-xs transition-colors duration-300 ${
              currentEvent.kind === 'appointment'
                ? 'chip-green'
                : 'border-violet-400/30 bg-violet-400/10 text-violet-300'
            }`}>
              {currentEvent.kind === 'appointment' ? 'Appointment' : 'Lab Report'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={openOverview} className="ghost-btn gap-2 py-2 text-sm">
            <LayoutList size={14} /> Overview
          </button>
          <button type="button" onClick={onBuildEMR} className="action-btn gap-2 py-2 text-sm">
            <PlusCircle size={14} /> Build EMR
          </button>
        </div>
      </div>

      {/* ── Boxed scroll area ── */}
      <div className="timeline-box-h relative overflow-hidden rounded-3xl border border-wire/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.01)_100%)]">

        {/* Fade masks */}
        <div className="timeline-fade-top pointer-events-none absolute inset-x-0 top-0 z-10 h-12" />
        <div className="timeline-fade-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12" />

        <div ref={scrollRef} onScroll={onScroll} className="scroll-skin h-full overflow-y-auto">
          <div className="relative px-2">
            <div className="pointer-events-none absolute bottom-0 left-[184px] top-0 w-px bg-white/[0.08]" />

            <div className="h-[10vh]" />

            {timeline.map((event, index) => {
              const isAppt   = event.kind === 'appointment';
              const isActive = index === activeIndex;
              const isLast   = index === timeline.length - 1;
              const label    = parseDateLabel(event.date);

              const apptData = isAppt ? (event as Extract<TimelineEvent,{kind:'appointment'}>).data : null;
              const labData  = !isAppt ? (event as Extract<TimelineEvent,{kind:'lab'}>).data : null;

              const title    = isAppt ? apptData!.doctorName  : labData!.title;
              const subtitle = isAppt ? apptData!.specialty   : labData!.doctorName;
              const badge    = isAppt ? apptData!.status      : labData!.category;
              const detail   = isAppt ? (apptData!.diagnosis || apptData!.purpose) : labData!.summary;

              return (
                <div
                  key={`${event.kind}-${index}`}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  className={`timeline-item-transition flex items-start ${isLast ? 'pb-4' : 'pb-6'}`}
                >
                  {/* DATE — left of line */}
                  <div className="w-36 flex-shrink-0 pr-5 pt-[22px] text-right">
                    <div className={`text-[13px] font-bold leading-snug ${isAppt ? 'text-emerald-300' : 'text-violet-300'}`}>
                      {label.top}
                    </div>
                    {label.bottom && (
                      <div className="mt-0.5 text-[11px] text-mist/70">{label.bottom}</div>
                    )}
                    <div className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${
                      isAppt ? 'text-emerald-400/50' : 'text-violet-400/50'
                    }`}>
                      {isAppt ? 'Visit' : 'Lab'}
                    </div>
                  </div>

                  {/* DOT — on the line */}
                  <div className="relative z-10 flex w-12 flex-shrink-0 justify-center pt-[24px]">
                    <div className={[
                      'rounded-full transition-all duration-300',
                      isActive
                        ? isAppt
                          ? 'h-[16px] w-[16px] bg-emerald-400 shadow-[0_0_20px_6px_rgba(52,211,153,0.55)] ring-2 ring-emerald-400/30'
                          : 'h-[16px] w-[16px] bg-violet-400 shadow-[0_0_20px_6px_rgba(167,139,250,0.55)] ring-2 ring-violet-400/30'
                        : isAppt
                          ? 'h-[10px] w-[10px] bg-emerald-500/40'
                          : 'h-[10px] w-[10px] bg-violet-500/40'
                    ].join(' ')} />
                  </div>

                  {/* CARD — right of line */}
                  <div className="flex-1 pl-5 pr-3">
                    <button
                      type="button"
                      onClick={() => openDetail(event)}
                      className={[
                        'group w-full cursor-pointer rounded-2xl border text-left transition-all duration-300',
                        isActive
                          ? isAppt
                            ? 'border-emerald-400/40 bg-[linear-gradient(135deg,rgba(52,211,153,0.11),rgba(52,211,153,0.03))] shadow-[0_8px_36px_rgba(52,211,153,0.10)]'
                            : 'border-violet-400/40 bg-[linear-gradient(135deg,rgba(167,139,250,0.11),rgba(167,139,250,0.03))] shadow-[0_8px_36px_rgba(167,139,250,0.10)]'
                          : isAppt
                            ? 'border-emerald-400/10 bg-[linear-gradient(135deg,rgba(52,211,153,0.04),rgba(52,211,153,0.01))] hover:border-emerald-400/30 hover:shadow-[0_4px_20px_rgba(52,211,153,0.07)]'
                            : 'border-violet-400/10 bg-[linear-gradient(135deg,rgba(167,139,250,0.04),rgba(167,139,250,0.01))] hover:border-violet-400/30 hover:shadow-[0_4px_20px_rgba(167,139,250,0.07)]'
                      ].join(' ')}
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`mt-0.5 flex-shrink-0 rounded-xl p-3 transition-colors ${
                            isAppt
                              ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-400'
                              : 'border border-violet-400/20 bg-violet-400/10 text-violet-400'
                          }`}>
                            {isAppt ? <CalendarCheck2 size={18} /> : <FlaskConical size={18} />}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[15px] font-semibold text-white">{title}</span>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                isAppt
                                  ? badge === 'Completed' ? 'bg-emerald-400/12 text-emerald-300' : 'bg-red-400/12 text-red-300'
                                  : 'bg-violet-400/12 text-violet-300'
                              }`}>
                                {badge}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[13px] text-mist">{subtitle}</div>
                            {detail && (
                              <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-white/55">{detail}</p>
                            )}
                            {/* Medication preview chips */}
                            {isAppt && apptData!.medications && apptData!.medications.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {apptData!.medications.slice(0, 3).map((m, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 rounded-full border border-sky/15 bg-sky/[0.06] px-2 py-0.5 text-[10px] text-sky/80">
                                    <Pill size={8} />{m.name}
                                  </span>
                                ))}
                                {apptData!.medications.length > 3 && (
                                  <span className="rounded-full border border-wire/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-mist/60">
                                    +{apptData!.medications.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Follow-up badge */}
                            {isAppt && apptData!.followUp && (
                              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-0.5 text-[10px] text-amber-300">
                                <CalendarClock size={9} /> Follow-up: {apptData!.followUp}
                              </div>
                            )}
                          </div>

                          {/* Arrow hint */}
                          <svg
                            className={`mt-1 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                              isAppt ? 'text-emerald-400/45' : 'text-violet-400/45'
                            }`}
                            width="15" height="15" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"
                          >
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="h-[14vh]" />
          </div>
        </div>
      </div>
    </div>

    {/* ── Prescription detail modal ── */}
      {selectedEvent && (
        <PrescriptionModal
          event={selectedEvent}
          patient={patient!}
          layoutMode={prescriptionLayout}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Overview page                                              */
/* ─────────────────────────────────────────────────────────── */

function OverviewPage({
  patient,
  timeline,
  onBack,
  onBuildEMR,
  onSelectEvent,
}: {
  patient: Patient;
  timeline: TimelineEvent[];
  onBack: () => void;
  onBuildEMR: () => void;
  onSelectEvent: (ev: TimelineEvent) => void;
}) {
  const appts     = patient.pastAppointments;
  const labs      = patient.medicalReports;
  const rxs       = patient.prescriptions;
  const completed = appts.filter(a => a.status === 'Completed').length;
  const cancelled = appts.filter(a => a.status === 'Cancelled').length;

  const narrativeParts: string[] = [];
  if (patient.chronicConditions.length)
    narrativeParts.push(`Known conditions: ${patient.chronicConditions.join(', ')}.`);
  if (patient.allergies.length)
    narrativeParts.push(`Allergies: ${patient.allergies.join(', ')}.`);
  if (appts.length) {
    const lastAppt = appts[0];
    narrativeParts.push(
      `Last visited ${lastAppt.doctorName} (${lastAppt.specialty}) on ${parseDateLabel(lastAppt.date).top} — ${lastAppt.purpose}.`
    );
  }
  labs.slice(0, 3).forEach(r => {
    narrativeParts.push(`${parseDateLabel(r.reportDate).top} — ${r.title}: ${r.summary}`);
  });

  return (
    <div className="page-enter flex flex-col">

      {/* Nav bar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="ghost-btn gap-2 py-2 text-sm">
          <ArrowLeft size={15} /> Back to Timeline
        </button>
        <button type="button" onClick={onBuildEMR} className="action-btn gap-2 py-2 text-sm">
          <PlusCircle size={14} /> Build EMR
        </button>
      </div>

      <div className="overview-scroll-h scroll-skin overflow-y-auto pr-1">
        <div className="space-y-4 pb-8">

          {/* ── Patient hero ── */}
          <div className="rounded-3xl border border-wire/10 bg-[linear-gradient(135deg,rgba(82,255,157,0.07),rgba(131,212,255,0.05))] p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon/30 to-sky/20 text-lg font-bold text-white shadow-inner">
                {patient.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{patient.name}</h2>
                <p className="mt-0.5 text-sm text-mist">
                  {patient.age} yrs · {patient.gender} · <span className="font-mono text-neon/70">{patient.id}</span>
                </p>
                <p className="text-xs text-mist/60">{patient.phone} · {patient.email}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {patient.primaryDoctorName && (
                  <span className="chip border-sky/25 bg-sky/10 text-sky text-xs">
                    <UserCheck size={11} /> GP: {patient.primaryDoctorName}
                  </span>
                )}
                {patient.chronicConditions.map(c => (
                  <span key={c} className="chip border-sky/25 bg-sky/10 text-sky text-xs">{c}</span>
                ))}
                {patient.allergies.map(a => (
                  <span key={a} className="chip border-amber-400/25 bg-amber-400/10 text-amber-200 text-xs">
                    <AlertTriangle size={10} />{a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stat Row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_2fr]">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 content-start">
              {[
                { label: 'Total visits',  value: appts.length,  color: 'text-sky',         icon: <CalendarCheck2 size={15} /> },
                { label: 'Completed',     value: completed,     color: 'text-emerald-300', icon: <CheckCircle2 size={15} /> },
                { label: 'Cancelled',     value: cancelled,     color: 'text-red-300',     icon: <XCircle size={15} /> },
                { label: 'Lab reports',   value: labs.length,   color: 'text-violet-300',  icon: <FlaskConical size={15} /> },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="rounded-2xl border border-wire/8 bg-white/[0.02] p-3">
                  <div className={`mb-1.5 ${color}`}>{icon}</div>
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="mt-0.5 text-[11px] text-mist">{label}</div>
                </div>
              ))}
            </div>
            {/* Vitals */}
            <div className="rounded-2xl border border-wire/8 bg-white/[0.02] p-4">
              <OverviewSectionLabel>Latest vitals</OverviewSectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'BP',   value: patient.vitals.bloodPressure, unit: 'mmHg' },
                  { label: 'HR',   value: patient.vitals.pulse,         unit: 'bpm'  },
                  { label: 'Temp', value: patient.vitals.temperature,   unit: '°F'   },
                  { label: 'SpO2', value: patient.vitals.spo2,          unit: '%'    },
                  { label: 'Ht',   value: patient.vitals.height,        unit: 'cm'   },
                  { label: 'Wt',   value: patient.vitals.weight,        unit: 'kg'   },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="rounded-xl border border-wire/8 bg-slate-950/25 p-2.5 text-center">
                    <div className="text-[9px] uppercase tracking-[0.16em] text-mist">{label}</div>
                    <div className="mt-1 text-sm font-bold text-neon">{value || '—'}</div>
                    <div className="text-[9px] text-mist/55">{unit}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Compiled medical narrative ── */}
          <div className="rounded-2xl border border-neon/10 bg-[linear-gradient(135deg,rgba(82,255,157,0.05),rgba(82,255,157,0.01))] px-5 py-4">
            <OverviewSectionLabel>
              <span className="flex items-center gap-2">
                <HeartPulse size={12} className="text-neon" /> Compiled medical summary
              </span>
            </OverviewSectionLabel>
            <div className="space-y-1.5">
              {narrativeParts.length > 0 ? narrativeParts.map((part, i) => (
                <p key={i} className="text-sm leading-6 text-white/80">{part}</p>
              )) : (
                <p className="text-sm text-mist">No medical history compiled yet.</p>
              )}
            </div>
          </div>

          {/* ── Two-column: Lab PDFs (left) + Prescriptions (right) ── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

            {/* ──── Left: Lab Reports ──── */}
            <div className="flex flex-col rounded-3xl border border-violet-400/15 bg-[linear-gradient(135deg,rgba(167,139,250,0.05),rgba(167,139,250,0.01))]">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-violet-400/20 bg-violet-400/10 p-2 text-violet-400">
                    <FlaskConical size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Lab Reports</div>
                    <div className="text-[11px] text-mist/70">{labs.length} document{labs.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-300">
                  PDF
                </span>
              </div>
              <div className="overview-col-h scroll-skin overflow-y-auto px-3 pb-4">
                {labs.length === 0 ? (
                  <div className="py-8 text-center text-sm text-mist/50">No lab reports yet</div>
                ) : (
                  <div className="space-y-2">
                    {labs.map((r) => {
                      const lbl = parseDateLabel(r.reportDate);
                      const labEv = timeline.find(ev => ev.kind === 'lab' && ev.data.id === r.id);
                      return (
                        <div
                          key={r.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => labEv && onSelectEvent(labEv)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); labEv && onSelectEvent(labEv); } }}
                          className="group w-full cursor-pointer rounded-2xl border border-wire/8 bg-slate-950/25 p-3.5 text-left transition hover:border-violet-400/30 hover:bg-violet-400/[0.05]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 rounded-xl border border-violet-400/20 bg-violet-400/[0.08] p-2 text-violet-400">
                              <FileText size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-semibold text-white">{r.title}</span>
                                <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-violet-300">
                                  {r.category}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-4.5 text-mist/75">{r.summary}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-violet-300/70">{lbl.top}</span>
                                {r.documentPath ? (
                                  <a
                                    href={assetUrl(r.documentPath)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-[10px] text-neon/70 hover:text-neon transition-colors"
                                  >
                                    <Download size={10} />{r.fileLabel}
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-mist/50">
                                    <Download size={10} />{r.fileLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ──── Right: Prescriptions ──── */}
            <div className="flex flex-col rounded-3xl border border-sky/15 bg-[linear-gradient(135deg,rgba(131,212,255,0.05),rgba(131,212,255,0.01))]">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-sky/20 bg-sky/10 p-2 text-sky">
                    <FileText size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Prescriptions</div>
                    <div className="text-[11px] text-mist/70">{rxs.length} record{rxs.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <span className="rounded-full border border-sky/20 bg-sky/10 px-2.5 py-0.5 text-[10px] font-semibold text-sky">
                  Rx
                </span>
              </div>
              <div className="overview-col-h scroll-skin overflow-y-auto px-3 pb-4">
                {rxs.length === 0 ? (
                  <div className="py-8 text-center text-sm text-mist/50">No prescriptions yet</div>
                ) : (
                  <div className="space-y-2">
                    {rxs.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-wire/8 bg-slate-950/25 p-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-semibold text-white">{p.title}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                                p.status === 'Active'
                                  ? 'bg-neon/12 text-neon'
                                  : p.status === 'Expired'
                                  ? 'bg-red-400/12 text-red-300'
                                  : 'bg-white/8 text-white/50'
                              }`}>{p.status}</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-mist/70">{p.doctorName}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {p.medicines.map(m => (
                                <span key={m} className="rounded-full border border-sky/15 bg-sky/[0.06] px-2 py-0.5 text-[10px] text-sky/80">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-[10px] text-mist/50">Prescribed</div>
                            <div className="text-[11px] font-semibold text-sky/70">
                              {parseDateLabel(p.prescribedOn).top}
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] leading-4.5 text-white/45 line-clamp-2">{p.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>{/* end two-column */}

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Prescription / detail modal                                */
/* ─────────────────────────────────────────────────────────── */

export function PrescriptionModal({
  event,
  patient,
  onClose,
  layoutMode = 'classic',
}: {
  event: TimelineEvent;
  patient: Patient;
  onClose: () => void;
  layoutMode?: 'classic' | 'wide';
}) {
  /* Notes hidden by default — expanded on click (matches EMR_v2 SidePanel) */
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  function toggleNote(id: string) {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const isAppt = event.kind === 'appointment';
  const label  = parseDateLabel(event.date);

  const appt = isAppt ? (event as Extract<TimelineEvent,{kind:'appointment'}>).data : null;
  const lab  = !isAppt ? (event as Extract<TimelineEvent,{kind:'lab'}>).data : null;

  const title       = appt ? (appt.diagnosis || appt.purpose || 'Consultation Record') : lab!.title;
  const statusLabel = appt ? appt.status : lab!.category;
  const isCompleted = appt ? appt.status === 'Completed' : true;
  const docPath     = appt?.documentPath ?? lab?.documentPath;

  const vitals = patient.vitals;
  const meds   = appt?.medications ?? [];
  const hasNotes = !!(appt?.symptoms || appt?.diagnosis || appt?.notes);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/65 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        layoutId={`emr-card-${appt ? appt.id : (lab ? lab.id : '')}`}
        className={`w-full ${layoutMode === 'wide' ? 'max-w-[1100px]' : 'max-w-[700px]'} overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1520] shadow-[0_32px_100px_rgba(0,0,0,0.75)]`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Hero ── */}
        <div className="relative border-b border-white/[0.07] px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neon/70">
                MEIOSIS PRESCRIPTION
              </p>
              <h3 className="mt-1.5 text-[18px] font-bold leading-snug text-white">{title}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isCompleted ? 'bg-white/[0.07] text-white/55' : 'bg-neon/[0.13] text-neon'
                }`}>
                  {statusLabel}
                </span>
                <span className="text-[12px] text-mist/65">
                  {label.top}{label.bottom ? ` · ${label.bottom}` : ''}
                </span>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {docPath && (
                <a
                  href={assetUrl(docPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn flex items-center justify-center gap-2 !px-4 !py-2 text-xs"
                >
                  <Download size={13} /> Download PDF
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ghost-btn !px-4 !py-2 text-xs flex items-center gap-2"
              >
                <X size={13} /> Close
              </button>
            </div>
          </div>
        </div>

        {layoutMode === 'wide' ? (
          <div className="flex divide-x divide-white/[0.07]">
            {/* ── Left Column: Metrics & Vitals ── */}
            <div className="w-[300px] flex-shrink-0 bg-white/[0.01]">
              {/* Meta Tiles (Vertical) */}
              {appt && (
                <div className="border-b border-white/[0.07] py-2">
                  {[
                    { label: 'DOCTOR',       value: appt.doctorName },
                    { label: 'SPECIALTY',    value: appt.specialty  },
                    { label: 'FOLLOW-UP',    value: appt.followUp ?? '—' },
                    { label: 'MODE',         value: appt.mode       },
                  ].map(({ label: l, value }) => (
                    <div key={l} className="px-5 py-3">
                      <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-mist/55">{l}</p>
                      <p className="mt-1 text-[13px] font-semibold text-white">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Vitals (2-col grid) */}
              <div className="px-5 py-5">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                  🩺 Vitals Telemetry
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { label: 'BP',   value: vitals.bloodPressure },
                    { label: 'HR',   value: vitals.pulse         },
                    { label: 'TEMP', value: vitals.temperature   },
                    { label: 'SPO2', value: vitals.spo2          },
                    { label: 'HT',   value: vitals.height        },
                    { label: 'WT',   value: vitals.weight        },
                  ] as const).map(({ label: vl, value }) => (
                    <div key={vl} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-mist/40">{vl}</p>
                      <p className={`mt-1 text-[12px] font-bold ${value ? 'text-white' : 'text-mist/20'}`}>
                        {value || '--'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Column: Clinical Content ── */}
            <div className="flex-1 min-w-0">
              {/* Main Diagnosis / Complaint at Top */}
              {appt && (
                <div className="border-b border-white/[0.07] bg-white/[0.01] px-6 py-5">
                   <div className="flex flex-col gap-4">
                      {appt.symptoms && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neon/60 mb-1.5">Chief Complaint</p>
                          <p className="text-[14px] font-medium leading-relaxed text-white/90">{appt.symptoms}</p>
                        </div>
                      )}
                      {appt.diagnosis && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neon/60 mb-1.5">Diagnosis / Assessment</p>
                          <p className="text-[14px] font-bold leading-relaxed text-white">{appt.diagnosis}</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {/* Medications in the middle */}
              {appt && (
                <div className="border-b border-white/[0.07] px-6 py-5">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">
                    💊 Prescribed Regimen
                  </p>
                  {meds.length === 0 ? (
                    <p className="text-[13px] italic text-mist/40">No medications in this record.</p>
                  ) : (
                    <div className="space-y-3">
                      {meds.map((med, i) => {
                        const noteKey = `wide-${i}`;
                        return (
                          <div key={noteKey} className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                             <div className="px-4 py-3 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                      <span className="text-[13px] font-bold text-neon">{med.name}</span>
                                      <span className="h-1 w-1 rounded-full bg-white/20" />
                                      <span className="text-[12px] text-white/70">{med.dose || '—'}</span>
                                   </div>
                                   <div className="mt-1 text-[11px] text-mist/60 flex items-center gap-3">
                                      <span className="font-mono">{med.frequency || '—'}</span>
                                      {med.duration && <span>· {med.duration}</span>}
                                   </div>
                                </div>
                                {med.notes && (
                                  <button
                                    type="button"
                                    onClick={() => toggleNote(noteKey)}
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                                      expandedNotes.has(noteKey) 
                                        ? 'border-neon/40 bg-neon/10 text-neon' 
                                        : 'border-white/10 bg-white/5 text-mist/40 hover:text-mist'
                                    }`}
                                  >
                                    <StickyNote size={14} />
                                  </button>
                                )}
                             </div>
                             {expandedNotes.has(noteKey) && med.notes && (
                               <div className="px-4 pb-3 pt-0 border-t border-white/[0.04] bg-black/20">
                                  <p className="text-[11px] leading-5 text-mist/70 pt-2 italic">{med.notes}</p>
                                </div>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Lab / Notes at bottom */}
              {(appt?.notes || lab) && (
                <div className="px-6 py-5">
                  {lab && (
                    <div className="space-y-4">
                       <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">🔬 Diagnostic Findings</p>
                       <div className="grid grid-cols-2 gap-3">
                         {[
                           { label: 'CATEGORY', value: lab.category   },
                           { label: 'FILE',     value: lab.fileLabel  },
                         ].map(({ label: l, value }) => (
                           <div key={l} className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                             <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-mist/55">{l}</p>
                             <p className="mt-1 text-[12px] font-semibold text-white">{value || '—'}</p>
                           </div>
                         ))}
                       </div>
                       {lab.summary && (
                         <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mt-3">
                           <p className="text-[13px] leading-relaxed text-white/80">{lab.summary}</p>
                         </div>
                       )}
                    </div>
                  )}
                  {appt?.notes && (
                    <div className="mt-2">
                       <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 mb-3">📋 Treatment Plan</p>
                       <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] px-4 py-4">
                          <p className="text-[13px] leading-relaxed text-white/80">{appt.notes}</p>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ── Meta tiles (4-up) ── */}
            {appt && (
              <div className="grid grid-cols-4 border-b border-white/[0.07]">
                {[
                  { label: 'DOCTOR',       value: appt.doctorName },
                  { label: 'SPECIALTY',    value: appt.specialty  },
                  { label: 'FOLLOW-UP',    value: appt.followUp ?? '—' },
                  { label: 'MODE',         value: appt.mode       },
                ].map(({ label: l, value }, i) => (
                  <div key={l} className={`bg-white/[0.02] px-4 py-3 ${i > 0 ? 'border-l border-white/[0.07]' : ''}`}>
                    <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-mist/55">{l}</p>
                    <p className="mt-1 text-[13px] font-semibold text-white">{value || '—'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Medications table ── */}
            {appt && (
              <div className="border-b border-white/[0.07] px-5 py-4">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
                  💊 Medications
                </p>
                {meds.length === 0 ? (
                  <p className="text-[13px] italic text-mist/50">No medicines prescribed.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr>
                          {['MEDICINE', 'DOSE', 'TIMING CODE', 'DURATION', ''].map((h) => (
                            <th
                              key={h}
                              className="pb-2 pr-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-mist/55 last:w-7 last:pr-0"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {meds.map((med, i) => {
                          const noteKey = String(i);
                          return (
                            <Fragment key={noteKey}>
                              <tr className="border-t border-white/[0.05]">
                                <td className="py-2 pr-3 font-semibold text-neon">{med.name}</td>
                                <td className="py-2 pr-3 text-white/75">{med.dose || '—'}</td>
                                <td className="py-2 pr-3 text-white/75">
                                  {/^[01]{4}$/.test(med.frequency ?? '') ? (
                                    <span>
                                      <span className="mr-1 font-mono text-[10px] text-white/35">{med.frequency}</span>
                                      {emrPatternLabel(med.frequency)}
                                    </span>
                                  ) : (med.frequency || '—')}
                                </td>
                                <td className="py-2 pr-3 text-white/75">{med.duration || '—'}</td>
                                <td className="py-2 text-right">
                                  {med.notes && (
                                    <button
                                      type="button"
                                      onClick={() => toggleNote(noteKey)}
                                      title={expandedNotes.has(noteKey) ? 'Hide note' : 'Show note'}
                                      aria-expanded={expandedNotes.has(noteKey)}
                                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.15] text-[13px] font-bold leading-none text-mist/50 transition-colors hover:border-neon/40 hover:text-neon"
                                    >
                                      {expandedNotes.has(noteKey) ? '−' : '+'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                              {expandedNotes.has(noteKey) && med.notes && (
                                <tr>
                                  <td colSpan={5} className="pb-3 pt-0">
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                                      <p className="text-[11px] leading-5 text-mist/70">{med.notes}</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Vitals ── */}
            <div className="border-b border-white/[0.07] px-5 py-4">
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
                🩺 Vitals
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { label: 'BLOOD PRESSURE', value: vitals.bloodPressure },
                  { label: 'HEART RATE',     value: vitals.pulse         },
                  { label: 'TEMPERATURE',    value: vitals.temperature   },
                  { label: 'SPO2',           value: vitals.spo2          },
                  { label: 'HEIGHT',         value: vitals.height        },
                  { label: 'WEIGHT',         value: vitals.weight        },
                ] as const).map(({ label: vl, value }) => (
                  <div key={vl} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-mist/55">{vl}</p>
                    <p className={`mt-1 text-[13px] font-semibold ${value ? 'text-white' : 'text-mist/35'}`}>
                      {value || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Clinical Notes ── */}
            {hasNotes && (
              <div className="border-b border-white/[0.07] px-5 py-4">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
                  📋 Clinical Notes
                </p>
                <div className="space-y-3">
                  {appt!.symptoms && (
                    <div className="flex gap-3">
                      <span className="w-[160px] flex-shrink-0 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist/55">Chief Complaint</span>
                      <p className="flex-1 text-[13px] leading-6 text-white/80">{appt!.symptoms}</p>
                    </div>
                  )}
                  {appt!.diagnosis && (
                    <div className="flex gap-3">
                      <span className="w-[160px] flex-shrink-0 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist/55">Diagnosis / Assessment</span>
                      <p className="flex-1 text-[13px] leading-6 text-white/80">{appt!.diagnosis}</p>
                    </div>
                  )}
                  {appt!.notes && (
                    <div className="flex gap-3">
                      <span className="w-[160px] flex-shrink-0 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist/55">Treatment Plan</span>
                      <p className="flex-1 text-[13px] leading-6 text-white/80">{appt!.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Lab report (when event is a lab) ── */}
            {lab && (
              <div className="border-b border-white/[0.07] px-5 py-4 space-y-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">🔬 Lab Report</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'CATEGORY', value: lab.category   },
                    { label: 'DOCTOR',   value: lab.doctorName },
                    { label: 'FILE',     value: lab.fileLabel  },
                  ].map(({ label: l, value }) => (
                    <div key={l} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                      <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-mist/55">{l}</p>
                      <p className="mt-1 text-[13px] font-semibold text-white">{value || '—'}</p>
                    </div>
                  ))}
                </div>
                {lab.summary && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist/50">Summary</p>
                    <p className="text-[13px] leading-[1.65] text-white/80">{lab.summary}</p>
                  </div>
                )}
            </div>
            )}
          </>
        )}

        <div className="h-4" />
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Shared primitives                                          */
/* ─────────────────────────────────────────────────────────── */

function OverviewSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-mist">{children}</div>
  );
}

const TIMING_SLOTS_EMR = ['Breakfast', 'Lunch', 'Dinner', 'Night'] as const;
function emrPatternLabel(code: string | undefined): string {
  if (!code || !/^[01]{4}$/.test(code)) return code || '—';
  const slots = code.split('').map((b, i) => b === '1' ? TIMING_SLOTS_EMR[i] : null).filter(Boolean);
  return slots.length ? slots.join(' + ') : '—';
}

function MetaTile({
  label, value, border, topBorder,
}: {
  label: string; value: string; border?: boolean; topBorder?: boolean;
}) {
  return (
    <div className={`bg-white/[0.02] px-4 py-3 ${border ? 'border-l border-white/[0.07]' : ''} ${topBorder ? 'border-t border-white/[0.07]' : ''}`}>
      <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-mist/55">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-white">{value || '—'}</p>
    </div>
  );
}

function NoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-[160px] flex-shrink-0 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist/55">
        {label}
      </span>
      <p className="flex-1 text-[13px] leading-6 text-white/80">{value}</p>
    </div>
  );
}
