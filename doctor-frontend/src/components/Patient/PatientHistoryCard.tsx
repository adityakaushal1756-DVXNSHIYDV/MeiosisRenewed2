import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { HistoryEntry } from '../../types/Patient';

interface PatientHistoryCardProps {
  entry: HistoryEntry;
  expanded: boolean;
  onToggle: () => void;
}

export function PatientHistoryCard({ entry, expanded, onToggle }: PatientHistoryCardProps) {
  return (
    <article className="rounded-3xl border border-wire/8 bg-white/[0.03] p-4">
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-3 text-left">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-neon/70">{entry.date}</div>
          <h3 className="mt-2 text-base font-semibold text-white">{entry.diagnosis}</h3>
          <p className="mt-2 text-sm text-mist">{entry.prescriptionSummary}</p>
        </div>
        <div className="rounded-2xl border border-wire/10 bg-slate-950/30 p-2 text-mist">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-wire/8 pt-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-mist">Chief complaint</div>
            <div className="mt-2 text-sm text-white/85">{entry.chiefComplaint}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-mist">Doctor notes</div>
            <div className="mt-2 text-sm leading-6 text-white/85">{entry.doctorNotes}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-wire/8 bg-slate-950/25 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-mist">Labs</div>
              <ul className="mt-2 space-y-2 text-sm text-white/85">
                {entry.labs.map((lab) => <li key={lab}>• {lab}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-wire/8 bg-slate-950/25 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-mist">
                <FileText size={13} /> Advice
              </div>
              <div className="mt-2 text-sm leading-6 text-white/85">{entry.advice}</div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

