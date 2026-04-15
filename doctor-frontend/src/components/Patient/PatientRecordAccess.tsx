import { useState } from 'react';
import { ArrowRight, CalendarClock, ClipboardList, FileStack, FolderOpen, LayoutList } from 'lucide-react';
import { Patient } from '../../types/Patient';
import { AppointmentsTimelineModal } from './AppointmentsTimelineModal';

interface PatientRecordAccessProps {
  patient: Patient | null;
  onViewRecords?: (patientId: string) => void;
}

function ViewEMRButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-auto flex items-center gap-1.5 rounded-xl border border-neon/20 bg-neonSoft px-3 py-1.5 text-[11px] font-medium text-neon transition hover:border-neon/40 hover:bg-neon/15"
    >
      View EMR <ArrowRight size={11} />
    </button>
  );
}

export function PatientRecordAccess({ patient, onViewRecords }: PatientRecordAccessProps) {
  const [showApptTimeline, setShowApptTimeline] = useState(false);

  if (!patient) {
    return (
      <section className="glass-card p-5">
        <h2 className="section-title">Record Access</h2>
        <p className="mt-3 text-sm text-mist">Scan a patient QR or open a patient to load appointments and prescription history.</p>
      </section>
    );
  }

  const goToEMR = onViewRecords ? () => onViewRecords(patient.id) : undefined;

  return (
    <>
      {showApptTimeline && (
        <AppointmentsTimelineModal patient={patient} onClose={() => setShowApptTimeline(false)} />
      )}

    <section className="glass-card p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="section-title">Full Record Access</h2>
          <p className="section-copy">Previous appointments and prescriptions exposed the moment the MEIOSIS code is scanned.</p>
        </div>
        <div className="flex items-center gap-3">
          {goToEMR && <ViewEMRButton onClick={goToEMR} />}
          <span className="chip chip-green">QR-linked patient record</span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-wire/8 bg-white/[0.03] p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl border border-wire/10 bg-slate-950/30 p-3 text-neon">
              <CalendarClock size={18} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Previous Appointments</h3>
              <p className="text-sm text-mist">Visit chronology available immediately after scan.</p>
            </div>
            {/* "View Timeline" opens the popup; "View EMR" navigates to EMR page */}
            <button
              type="button"
              onClick={() => setShowApptTimeline(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/8 px-3 py-1.5 text-[11px] font-medium text-emerald-300 transition hover:border-emerald-400/45 hover:bg-emerald-400/15"
            >
              <LayoutList size={11} /> Timeline
            </button>
          </div>
          <div className="space-y-3">
            {patient.pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                onClick={() => setShowApptTimeline(true)}
                className="cursor-pointer rounded-2xl border border-wire/8 bg-slate-950/20 p-4 transition hover:border-emerald-400/25 hover:bg-emerald-400/[0.04]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip border-wire/10 bg-white/[0.04] text-white/80">{appointment.status}</span>
                  <span className="chip chip-blue">{appointment.mode}</span>
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{appointment.date}</div>
                <div className="mt-1 text-sm text-white/85">{appointment.doctorName} - {appointment.specialty}</div>
                <div className="mt-2 text-sm text-mist">{appointment.purpose}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-wire/8 bg-white/[0.03] p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl border border-wire/10 bg-slate-950/30 p-3 text-neon">
              <FileStack size={18} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Prescription History</h3>
              <p className="text-sm text-mist">Every previous prescription plan shown with medicine summary.</p>
            </div>
            {goToEMR && <ViewEMRButton onClick={goToEMR} />}
          </div>
          <div className="space-y-3">
            {patient.prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                onClick={goToEMR}
                className={`rounded-2xl border border-wire/8 bg-slate-950/20 p-4 ${goToEMR ? 'cursor-pointer transition hover:border-neon/20 hover:bg-neon/[0.04]' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${prescription.status === 'Active' ? 'chip-green' : 'chip-blue'}`}>{prescription.status}</span>
                  <span className="chip border-wire/10 bg-white/[0.04] text-white/80">{prescription.prescribedOn}</span>
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{prescription.title}</div>
                <div className="mt-1 text-sm text-white/85">{prescription.doctorName}</div>
                <div className="mt-2 text-sm text-mist">{prescription.summary}</div>
                <div className="mt-3 rounded-2xl border border-wire/8 bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-mist">
                    <ClipboardList size={13} />
                    Medicines
                  </div>
                  <ul className="space-y-2 text-sm text-white/85">
                    {prescription.medicines.map((medicine) => (
                      <li key={medicine}>- {medicine}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="mt-5 rounded-3xl border border-wire/8 bg-white/[0.03] p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl border border-wire/10 bg-slate-950/30 p-3 text-neon">
            <FolderOpen size={18} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Previous Medical Reports</h3>
            <p className="text-sm text-mist">Reports become accessible immediately after patient QR or MEIOSIS scan.</p>
          </div>
          {goToEMR && <ViewEMRButton onClick={goToEMR} />}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {patient.medicalReports.map((report) => (
            <div
              key={report.id}
              onClick={goToEMR}
              className={`rounded-2xl border border-wire/8 bg-slate-950/20 p-4 ${goToEMR ? 'cursor-pointer transition hover:border-neon/20 hover:bg-neon/[0.04]' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-blue">{report.category}</span>
                <span className="chip border-wire/10 bg-white/[0.04] text-white/80">{report.reportDate}</span>
              </div>
              <div className="mt-3 text-sm font-semibold text-white">{report.title}</div>
              <div className="mt-1 text-sm text-white/85">{report.doctorName}</div>
              <div className="mt-2 text-sm text-mist">{report.summary}</div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goToEMR?.(); }}
                className="ghost-btn mt-4 w-full"
              >
                {report.fileLabel}
              </button>
            </div>
          ))}
        </div>
      </article>
    </section>
    </>
  );
}
