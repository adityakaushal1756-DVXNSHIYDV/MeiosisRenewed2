import { useEffect, useRef, useState } from 'react';
import { Search, UserPlus, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface WalkInDialogProps {
  open: boolean;
  onClose: () => void;
  onAddWalkIn: (meiosisId: string, visitReason?: string) => Promise<string | null>;
}

export function WalkInDialog({ open, onClose, onAddWalkIn }: WalkInDialogProps) {
  const [meiosisId, setMeiosisId] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMeiosisId('');
      setVisitReason('');
      setError(null);
      setSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meiosisId.trim()) {
      setError('Please enter a Meiosis ID');
      return;
    }
    setLoading(true);
    setError(null);

    const err = await onAddWalkIn(meiosisId.trim(), visitReason.trim() || undefined);

    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-[28px] border border-white/10 bg-[#011424]/95 backdrop-blur-xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-neon/20 bg-neon/[0.08]">
              <UserPlus size={16} className="text-neon" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Add Walk-in Patient</h2>
              <p className="text-[10px] text-mist/60">Enter the patient's numeric Meiosis ID (8-digits)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-mist/60 transition hover:bg-white/[0.04] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-neon/30 bg-neon/10">
              <CheckCircle2 size={28} className="text-neon" />
            </div>
            <p className="text-sm font-semibold text-neon">Patient added to queue</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Meiosis ID input */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-mist/50">
                Meiosis ID
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist/40" size={14} />
                <input
                  ref={inputRef}
                  value={meiosisId}
                  onChange={(e) => { 
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMeiosisId(val); 
                    setError(null); 
                  }}
                  placeholder="e.g. 99999999"
                  className="w-full rounded-[18px] border border-white/8 bg-slate-950/40 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-mist/30 focus:border-neon/40 focus:ring-2 focus:ring-neon/15 transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Visit reason (optional) */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-mist/50">
                Visit Reason <span className="font-normal lowercase normal-case text-mist/30">(optional)</span>
              </label>
              <input
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
                placeholder="Walk-in consultation"
                className="w-full rounded-[18px] border border-white/8 bg-slate-950/40 py-3 px-4 text-sm text-white outline-none placeholder:text-mist/30 focus:border-neon/40 focus:ring-2 focus:ring-neon/15 transition"
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !meiosisId.trim()}
              className="action-btn w-full gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Verifying patient…
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  Add to Queue
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
