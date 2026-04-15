import { BrainCircuit, ChevronRight, FileClock, FolderOpen, PlusCircle, ShieldAlert, Stethoscope } from 'lucide-react';
import { Appointment } from '../../types/Appointment';
import { Patient } from '../../types/Patient';

interface EMRRecordConsoleProps {
  patient: Patient | null;
  appointment: Appointment | null;
  composerOpen: boolean;
  onOpenComposer: () => void;
}

function buildAiSummary(patient: Patient, appointment: Appointment | null) {
  const latestHistory = patient.history[0];
  const activePrescription = patient.prescriptions.find((item) => item.status === 'Active');
  const alertText = patient.allergies.length ? `Allergy watch: ${patient.allergies.join(', ')}.` : 'No allergy flag in current chart.';
  const followupText = latestHistory ? `Last visit on ${latestHistory.date} documented ${latestHistory.diagnosis.toLowerCase()}.` : 'No prior visit summary available.';
  const prescriptionText = activePrescription
    ? `Current active plan: ${activePrescription.title.toLowerCase()} with ${activePrescription.medicines.length} medication entries.`
    : 'No active prescription plan on record.';
  const queueText = appointment ? `Current visit reason: ${appointment.visitReason.toLowerCase()}.` : `Current visit reason: ${patient.visitReason.toLowerCase()}.`;

  return `${queueText} ${followupText} ${prescriptionText} ${alertText}`;
}

export function EMRRecordConsole({ patient, appointment, composerOpen, onOpenComposer }: EMRRecordConsoleProps) {
  if (!patient) {
    return (
      <section className="glass-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-wire/10 bg-white/[0.04] p-3 text-neon">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h2 className="section-title">EMR Record Console</h2>
            <p className="section-copy">Scan a patient or start a queue consultation to load previous records before opening the builder.</p>
          </div>
        </div>
      </section>
    );
  }

  const latestVisit = patient.history[0];
  const latestReport = patient.medicalReports[0];
  const latestPrescription = patient.prescriptions[0];
  const latestAppointment = patient.pastAppointments[0];
  const aiSummary = buildAiSummary(patient, appointment);

  return (
    <section
      className={`glass-card overflow-hidden transition-all duration-500 ${composerOpen ? 'xl:max-h-[330px]' : 'xl:max-h-[520px]'}`}
    >
      <div className={`scroll-skin space-y-5 overflow-auto p-5 transition-all duration-500 ${composerOpen ? 'max-h-[330px]' : 'max-h-[520px]'}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="chip chip-blue">
                <Stethoscope size={14} />
                {patient.name}
              </span>
              <span className="chip border-wire/10 bg-white/[0.03] text-white/80">{patient.id}</span>
              <span className="chip chip-green">{appointment?.status?.replace('_', ' ') || 'READY'}</span>
            </div>
            <h2 className="section-title">Previous Records First</h2>
            <p className="section-copy">Clinical summary is surfaced before charting so the doctor sees context before writing a new note.</p>
          </div>
          <button onClick={onOpenComposer} className="action-btn gap-2 self-start">
            <PlusCircle size={16} />
            {composerOpen ? 'Consultation Builder Open' : 'Add Consultation'}
          </button>
        </div>

        <article className="rounded-[28px] border border-neon/20 bg-[linear-gradient(135deg,rgba(82,255,157,0.12),rgba(131,212,255,0.08))] p-5 shadow-[0_18px_50px_rgba(82,255,157,0.08)]">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-neon/25 bg-neonSoft p-3 text-neon">
              <BrainCircuit size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.24em] text-neon/80">AI visit summary</div>
              <p className="mt-2 text-sm leading-7 text-white/90">{aiSummary}</p>
            </div>
          </div>
        </article>

        <div className={`grid gap-4 transition-all duration-500 ${composerOpen ? 'xl:grid-cols-4' : 'xl:grid-cols-2'}`}>
          <article className="soft-panel p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl border border-wire/10 bg-slate-950/30 p-3 text-neon">
                <FileClock size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Latest visit</div>
                <div className="text-xs text-mist">{latestVisit?.date || patient.lastVisitDate}</div>
              </div>
            </div>
            <div className="text-sm font-medium text-white">{latestVisit?.diagnosis || patient.visitReason}</div>
            <div className="mt-2 text-sm text-mist">{latestVisit?.doctorNotes || 'Clinical notes will appear here after consultation.'}</div>
          </article>

          <article className="soft-panel p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl border border-wire/10 bg-slate-950/30 p-3 text-neon">
                <ShieldAlert size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Current clinical flags</div>
                <div className="text-xs text-mist">{patient.chronicConditions.length} ongoing condition(s)</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-white/85">
              <div>Allergies: {patient.allergies.length ? patient.allergies.join(', ') : 'None noted'}</div>
              <div>Conditions: {patient.chronicConditions.length ? patient.chronicConditions.join(', ') : 'No chronic history'}</div>
              <div>Vitals: {patient.vitals.bloodPressure} - {patient.vitals.pulse} - SpO2 {patient.vitals.spo2}</div>
            </div>
          </article>

          <article className="soft-panel p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl border border-wire/10 bg-slate-950/30 p-3 text-neon">
                <FolderOpen size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Latest report</div>
                <div className="text-xs text-mist">{latestReport?.reportDate || 'No report date'}</div>
              </div>
            </div>
            <div className="text-sm font-medium text-white">{latestReport?.title || 'No report on file'}</div>
            <div className="mt-2 text-sm text-mist">{latestReport?.summary || 'Report summaries will show here after uploads.'}</div>
          </article>

          <article className="soft-panel p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl border border-wire/10 bg-slate-950/30 p-3 text-neon">
                <ChevronRight size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Previous treatment</div>
                <div className="text-xs text-mist">{latestPrescription?.prescribedOn || latestAppointment?.date || 'No prior treatment'}</div>
              </div>
            </div>
            <div className="text-sm font-medium text-white">{latestPrescription?.title || latestAppointment?.purpose || 'No previous plan'}</div>
            <div className="mt-2 text-sm text-mist">{latestPrescription?.summary || 'Previous prescription summary will show here.'}</div>
          </article>
        </div>
      </div>
    </section>
  );
}
