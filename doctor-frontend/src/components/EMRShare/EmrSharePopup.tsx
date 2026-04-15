import { CheckCircle, FileText, User, X, XCircle } from 'lucide-react';
import { EmrShareRequest } from '../../hooks/useEmrShareNotifications';

interface EmrSharePopupProps {
  requests: EmrShareRequest[];
  onRespond: (shareId: string, accepted: boolean) => void;
}

export function EmrSharePopup({ requests, onRespond }: EmrSharePopupProps) {
  if (requests.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3" style={{ maxWidth: '360px' }}>
      {requests.map(req => (
        <div
          key={req.id}
          className="glass-card flex flex-col gap-3 p-4 shadow-2xl"
          style={{ border: '1px solid rgba(0,255,163,0.25)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-neon/20 bg-neonSoft p-2 text-neon">
                <FileText size={14} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Incoming EMR Share</p>
                <p className="text-[10px] text-mist">{req.transactionId}</p>
              </div>
            </div>
            <button
              onClick={() => onRespond(req.id, false)}
              className="text-mist transition hover:text-red-400"
              title="Reject"
            >
              <X size={14} />
            </button>
          </div>

          {/* Patient info */}
          <div className="flex items-center gap-2 rounded-2xl border border-wire/10 bg-white/[0.03] p-3">
            <div className="rounded-xl border border-wire/10 bg-white/[0.04] p-2 text-white/60">
              <User size={14} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{req.patient.name}</p>
              <p className="text-[10px] text-mist">
                {req.patient.meiosisId} · {req.recordCount} record{req.recordCount !== 1 ? 's' : ''} · {req.scope.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onRespond(req.id, true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neon px-3 py-2 text-xs font-semibold text-ink transition hover:bg-neon/90"
            >
              <CheckCircle size={13} />
              Accept
            </button>
            <button
              onClick={() => onRespond(req.id, false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-wire/15 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition hover:border-red-500/40 hover:text-red-400"
            >
              <XCircle size={13} />
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
