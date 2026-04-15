import { ArrowRight, History } from 'lucide-react';
import { Patient } from '../../types/Patient';
import { PatientHistoryCard } from './PatientHistoryCard';

interface PatientHistoryProps {
  patient: Patient | null;
  expandedHistoryId: string | null;
  onToggleHistory: (entryId: string) => void;
  onViewRecords?: (patientId: string) => void;
}

export function PatientHistory({ patient, expandedHistoryId, onToggleHistory, onViewRecords }: PatientHistoryProps) {
  return (
    <section className="glass-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Patient History</h2>
          <p className="section-copy">Previous visits, diagnoses, prescriptions, and doctor notes.</p>
        </div>
        <div className="flex items-center gap-2">
          {patient && onViewRecords && (
            <button
              type="button"
              onClick={() => onViewRecords(patient.id)}
              className="flex items-center gap-1.5 rounded-xl border border-neon/20 bg-neonSoft px-3 py-1.5 text-[11px] font-medium text-neon transition hover:border-neon/40 hover:bg-neon/15"
            >
              View EMR <ArrowRight size={11} />
            </button>
          )}
          <div className="rounded-2xl border border-wire/10 bg-white/[0.04] p-3 text-neon">
            <History size={18} />
          </div>
        </div>
      </div>

      {!patient ? (
        <div className="rounded-3xl border border-dashed border-wire/10 bg-white/[0.02] p-6 text-sm text-mist">
          Open a patient to see longitudinal history.
        </div>
      ) : (
        <div className="scroll-skin flex-1 space-y-3 overflow-auto pr-1">
          {patient.history.map((entry) => (
            <PatientHistoryCard
              key={entry.id}
              entry={entry}
              expanded={expandedHistoryId === entry.id}
              onToggle={() => onToggleHistory(entry.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

