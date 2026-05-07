import { CalendarClock, Download, FlaskConical, Pill, Stethoscope, X } from 'lucide-react';
import { API_BASE_URL, assetUrl } from '../../lib/api';
import type { TimelineEvent } from './EMRTimeline';
import type { PatientPastAppointment, PatientMedicalReport, PatientPrescriptionRecord } from '../../types/Patient';

function getDoctorPdfTheme(): 'dark' | 'light' {
  const mode = localStorage.getItem('meiosis_doctor_theme_mode_v1') || 'dark';
  if (mode === 'light') return 'light';
  if (mode === 'custom') {
    try {
      const c = JSON.parse(localStorage.getItem('meiosis_doctor_custom_theme_v1') || '{}');
      return Number(c.brightness) >= 112 ? 'light' : 'dark';
    } catch { return 'dark'; }
  }
  return 'dark';
}

const API = API_BASE_URL;

interface DetailPanelProps {
  event: TimelineEvent | null;
  onClose: () => void;
}

/* ── Primitives ── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-mist/38">
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="mt-0.5 text-xs leading-relaxed text-white/72">{value}</p>
    </div>
  );
}

function MedChip({ name, dose, frequency, duration, notes }: {
  name: string; dose?: string; frequency?: string; duration?: string; notes?: string;
}) {
  return (
    <div className="rounded-xl border border-sky/10 bg-sky/[0.04] px-3 py-2">
      <div className="text-xs font-semibold text-white/90">{name}</div>
      {(dose || frequency || duration) && (
        <div className="mt-0.5 text-[10px] text-mist/45">
          {[dose, frequency, duration].filter(Boolean).join(' · ')}
        </div>
      )}
      {notes && (
        <div className="mt-0.5 text-[10px] italic text-mist/35">{notes}</div>
      )}
    </div>
  );
}

/* ── Event type detail renderers ── */

function AppointmentDetail({ a }: { a: PatientPastAppointment }) {
  const hasMeds = (a.medications?.length ?? 0) > 0;
  return (
    <div className="space-y-4">
      {/* Doctor + mode */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-400">
          <Stethoscope size={13} />
        </div>
        <div>
          <div className="text-xs font-semibold text-white/80">{a.doctorName}</div>
          <div className="text-[10px] text-mist/45">{a.specialty} · {a.mode}</div>
        </div>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
          a.status === 'Completed' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'
        }`}>
          {a.status}
        </span>
      </div>

      <div className="h-px bg-white/[0.05]" />

      {/* Symptoms */}
      <div>
        <Label>Symptoms</Label>
        {(a.chiefComplaint || a.symptoms) ? (
          <div className="mt-1 space-y-1">
            {a.chiefComplaint && (
              <p className="text-xs leading-relaxed text-white/72">{a.chiefComplaint}</p>
            )}
            {a.symptoms && a.symptoms !== a.chiefComplaint && (
              <p className="text-xs leading-relaxed text-white/55">{a.symptoms}</p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-xs italic text-mist/28">Not described by patient</p>
        )}
      </div>

      {/* Diagnosis */}
      <div>
        <Label>Diagnosis</Label>
        {a.diagnosis ? (
          <p className="mt-1 text-xs leading-relaxed text-white/72">{a.diagnosis}</p>
        ) : (
          <p className="mt-1 text-xs italic text-mist/28">Assessment not recorded</p>
        )}
      </div>

      {/* Medications */}
      <div>
        <Label>Treatment</Label>
        {hasMeds ? (
          <div className="mt-1.5 space-y-1.5">
            {a.medications!.map((m, i) => (
              <MedChip key={i} name={m.name} dose={m.dose} frequency={m.frequency} duration={m.duration} notes={m.notes} />
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs italic text-mist/28">No medications prescribed</p>
        )}
      </div>

      {/* Notes / plan */}
      <div>
        <Label>Notes</Label>
        {a.notes ? (
          <p className="mt-1 text-xs leading-relaxed text-white/65">{a.notes}</p>
        ) : (
          <p className="mt-1 text-xs italic text-mist/28">No plan noted</p>
        )}
      </div>

      {/* Footer: follow-up + prescription PDF */}
      {(a.followUp || a.documentPath) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
          {a.followUp && (
            <span className="flex items-center gap-1.5 text-[11px] text-amber-200/70">
              <CalendarClock size={10} className="text-amber-400/65" />
              Follow-up {a.followUp}
            </span>
          )}
          {a.documentPath && (
            <button
              type="button"
              onClick={() => alert("PDF generation is disabled pending system redesign.")}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-neon/50 transition hover:text-neon"
            >
              <Download size={10} /> Prescription PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LabDetail({ l }: { l: PatientMedicalReport }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-400/15 bg-violet-400/[0.07] text-violet-400">
          <FlaskConical size={13} />
        </div>
        <div>
          <div className="text-xs font-semibold text-white/80">{l.doctorName}</div>
          <div className="text-[10px] text-mist/45">{l.category} report</div>
        </div>
        <span className="ml-auto rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-300">
          {l.category}
        </span>
      </div>

      <div className="h-px bg-white/[0.05]" />

      {l.summary && l.summary !== l.title && (
        <Field label="Summary" value={l.summary} />
      )}

      {l.documentPath ? (
        <a
          href={assetUrl(l.documentPath)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/15 bg-violet-400/[0.05] px-3 py-2 text-xs font-medium text-violet-300 transition hover:bg-violet-400/[0.1]"
        >
          <Download size={11} /> {l.fileLabel || 'View Report'}
        </a>
      ) : (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs text-mist/38">
          {l.fileLabel || 'Results pending'}
        </div>
      )}
    </div>
  );
}

function PrescriptionDetail({ r }: { r: PatientPrescriptionRecord }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky/15 bg-sky/[0.07] text-sky">
          <Pill size={13} />
        </div>
        <div>
          <div className="text-xs font-semibold text-white/80">{r.doctorName}</div>
          <div className="text-[10px] text-mist/45">{r.prescribedOn}</div>
        </div>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
          r.status === 'Active' ? 'bg-neon/10 text-neon' : 'bg-red-400/10 text-red-300'
        }`}>
          {r.status}
        </span>
      </div>

      <div className="h-px bg-white/[0.05]" />

      <div>
        <Label>Medicines</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {r.medicines.map((m, i) => (
            <span key={i} className="rounded-lg border border-sky/12 bg-sky/[0.05] px-2.5 py-1 text-xs font-medium text-white/85">
              {m}
            </span>
          ))}
        </div>
      </div>

      {r.summary && (
        <Field label="Notes" value={r.summary} />
      )}
    </div>
  );
}

/* ── Main component ── */

export function DetailPanel({ event, onClose }: DetailPanelProps) {
  /* Empty state */
  if (!event) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 rounded-2xl border border-wire/10 bg-white/[0.03] p-4 text-mist/20">
          <Stethoscope size={24} />
        </div>
        <p className="text-xs text-mist/35">Select an event on the timeline to view details</p>
      </div>
    );
  }

  const dateStr = event.date.split('T')[0];

  /* Header info by kind */
  const kindLabel = event.kind === 'appointment' ? 'Consultation' : 'Lab / Report';
  const kindColor = event.kind === 'appointment' ? 'text-emerald-300' : 'text-violet-300';
  const title =
    event.kind === 'appointment' ? (event.data.purpose || event.data.diagnosis || 'Consultation') :
    event.data.title;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex-shrink-0 border-b border-white/[0.05] px-4 pb-3 pt-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${kindColor}`}>
              {kindLabel}
            </div>
            <h3 className="mt-0.5 text-sm font-semibold leading-snug text-white/90 line-clamp-2">
              {title}
            </h3>
            <p className="mt-0.5 text-[10px] text-mist/40">{dateStr}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg border border-wire/12 p-1 text-mist/40 transition hover:bg-white/[0.06] hover:text-white/70"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Scrollable detail body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {event.kind === 'appointment' && <AppointmentDetail a={event.data} />}
        {event.kind === 'lab'         && <LabDetail l={event.data} />}
      </div>
    </div>
  );
}
