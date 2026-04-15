import { Pause, Play, Square, Stethoscope } from 'lucide-react';
import { Appointment } from '../../types/Appointment';
import { Patient } from '../../types/Patient';

interface ConsultationPanelProps {
  patient: Patient | null;
  appointment: Appointment | null;
  onStart: () => void;
  onEnd: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function ConsultationPanel({ patient, appointment, onStart, onEnd, onPause, onResume }: ConsultationPanelProps) {
  if (!patient) {
    return (
      <section className="glass-card p-5">
        <h2 className="section-title">Active Consultation</h2>
        <p className="mt-3 text-sm text-mist">No patient is active. Open a queue card, search a patient, or simulate a code scan.</p>
      </section>
    );
  }

  const inSession = appointment?.status === 'IN_SESSION';
  const paused = appointment?.status === 'PAUSED';

  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Consultation Panel</h2>
          <p className="section-copy">Start, pause, resume, and complete the current consult without leaving the chart.</p>
        </div>
        <span className={`chip ${inSession ? 'chip-green' : paused ? 'chip-amber' : 'chip-blue'}`}>
          {appointment?.status?.replace('_', ' ') || 'READY'}
        </span>
      </div>

      <div className="soft-panel p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-neon/20 bg-neonSoft p-3 text-neon">
            <Stethoscope size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{patient.name}</h3>
            <p className="text-sm text-mist">{patient.age} yrs • {patient.gender} • {patient.id}</p>
            <p className="mt-2 text-sm text-white">Visit reason: {appointment?.visitReason || patient.visitReason}</p>
            <p className="mt-1 text-sm text-mist">Mode: {appointment?.mode || 'In-person'} • Arrival: {appointment?.arrivalStatus?.replace('_', ' ') || 'Checked in'}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!inSession && !paused && (
            <button onClick={onStart} className="action-btn gap-2">
              <Play size={16} />
              Start Consultation
            </button>
          )}
          {inSession && (
            <button onClick={onPause} className="ghost-btn gap-2">
              <Pause size={16} />
              Pause Consultation
            </button>
          )}
          {paused && (
            <button onClick={onResume} className="action-btn gap-2">
              <Play size={16} />
              Resume Consultation
            </button>
          )}
          {(inSession || paused) && (
            <button onClick={onEnd} className="ghost-btn gap-2">
              <Square size={16} />
              End Consultation
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

