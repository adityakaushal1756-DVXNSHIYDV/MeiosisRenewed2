import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
      
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => inputRef.current?.focus(), 120);

      return () => {
        document.body.style.overflow = originalOverflow;
      };
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop — Crystal clear with blur, no darkening */}
      <div className="fixed inset-0 bg-white/[0.01] backdrop-blur-[14px] pointer-events-none" />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-[32px] border border-white/10 bg-[#011424]/90 backdrop-blur-3xl shadow-[0_32px_120px_rgba(0,0,0,0.5)] p-6 sm:p-8 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-neon/30 bg-neon/[0.1] shadow-[0_0_15px_rgba(82,255,157,0.15)]">
              <UserPlus size={18} className="text-neon" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Add Walk-in Patient</h2>
              <p className="text-[11px] font-medium text-mist/40 uppercase tracking-wider mt-0.5">Quick Registration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-mist/40 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neon/40 bg-neon/10 shadow-[0_0_30px_rgba(82,255,157,0.2)]">
              <CheckCircle2 size={32} className="text-neon" />
            </div>
            <p className="text-base font-bold text-neon tracking-wide">Patient added successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Meiosis ID input */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-mist/60">
                Patient Meiosis ID
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mist/30" size={16} />
                <input
                  ref={inputRef}
                  value={meiosisId}
                  onChange={(e) => { 
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMeiosisId(val); 
                    setError(null); 
                  }}
                  placeholder="e.g. 99999999"
                  className="w-full rounded-[22px] border border-white/10 bg-slate-950/50 py-3.5 pl-12 pr-4 text-sm text-white outline-none placeholder:text-mist/20 focus:border-neon/50 focus:ring-4 focus:ring-neon/10 transition-all shadow-inner"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Visit reason (optional) */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-mist/60">
                Visit Reason <span className="font-medium lowercase normal-case text-mist/20 italic">(optional)</span>
              </label>
              <input
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
                placeholder="Standard consultation"
                className="w-full rounded-[22px] border border-white/10 bg-slate-950/50 py-3.5 px-5 text-sm text-white outline-none placeholder:text-mist/20 focus:border-neon/50 focus:ring-4 focus:ring-neon/10 transition-all shadow-inner"
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-[20px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-300 animate-in slide-in-from-top-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !meiosisId.trim()}
              className="action-btn w-full gap-2.5 h-12 rounded-[22px] shadow-[0_8px_25px_rgba(82,255,157,0.15)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying ID…
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Register & Queue
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
