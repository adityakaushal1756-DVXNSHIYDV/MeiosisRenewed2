import { useEffect, useRef } from "react";
import { 
  CheckCircle2, 
  FileText, 
  X, 
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";

interface EndConsultationDialogProps {
  patientName: string;
  isSaving: boolean;
  isSuccess: boolean;
  /** When set, the EMR has already been saved. Dialog becomes a success summary. */
  lastSavedPrescriptionPath: string | null;
  /** Called when doctor clicks "End Consultation & Sync" to trigger the actual save */
  onConfirm: () => void;
  /** Called when doctor wants to keep the EMR open (cancel) */
  onCancel: () => void;
  /** Called when doctor clicks "View Prescription" */
  onViewPrescription: (path: string) => void;
  /** Called when doctor clicks "Print" button */
  onPrintPrescription?: (path: string) => void;
  /** Called after a successful save when doctor wants to close/dismiss */
  onClose?: () => void;
}

const SUCCESS_STYLES = `
  @keyframes check-circle-draw {
    from { stroke-dashoffset: 160; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes check-tick-draw {
    from { stroke-dashoffset: 60; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes success-pop {
    0% { transform: scale(0.9) opacity: 0; }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-check-circle {
    stroke-dasharray: 160;
    stroke-dashoffset: 160;
    animation: check-circle-draw 0.7s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }
  .animate-check-tick {
    stroke-dasharray: 60;
    stroke-dashoffset: 60;
    animation: check-tick-draw 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
  }
`;

export function EndConsultationDialog({
  patientName,
  isSaving,
  isSuccess,
  lastSavedPrescriptionPath,
  onConfirm,
  onCancel,
  onViewPrescription,
  onPrintPrescription,
  onClose,
}: EndConsultationDialogProps) {
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSuccess && onClose) {
      autoCloseTimerRef.current = setTimeout(() => {
        onClose();
      }, 2600); // 2.6s total visibility
    }
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isSuccess, onClose]);

  const handleManualAction = (action: () => void) => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    action();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <style>{SUCCESS_STYLES}</style>
      {/* Glass Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[14px]"
        onClick={isSaving ? undefined : onCancel}
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[40px] border border-white/10 bg-[#080d15]/90 shadow-[0_32px_120px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
        
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-neon/8 blur-[100px]" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-48 w-48 rounded-full bg-sky/8 blur-[100px]" />

        <div className="relative p-8 text-center">
          {/* Close button — only when not in the middle of saving */}
          {!isSaving && (
            <button
              onClick={onCancel}
              className="absolute right-6 top-6 rounded-full p-2 text-mist/30 transition hover:bg-white/6 hover:text-white/70"
            >
              <X size={18} />
            </button>
          )}

          {/* Icon — changes between confirm, saving, and success states */}
          <div className="mx-auto mb-7 flex h-[96px] w-[96px] items-center justify-center rounded-[32px] border shadow-[0_0_50px_rgba(82,255,157,0.12)] transition-all duration-500"
            style={{ 
              background: isSuccess ? 'rgba(82,255,157,0.12)' : 'rgba(82,255,157,0.06)', 
              borderColor: isSuccess ? 'rgba(82,255,157,0.4)' : 'rgba(82,255,157,0.18)',
              transform: isSuccess ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            {isSaving ? (
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neon/20 border-t-neon" />
            ) : isSuccess ? (
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="25" stroke="#52ff9d" strokeWidth="2" className="animate-check-circle" />
                <path d="M14 27L22 35L38 19" stroke="#52ff9d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-check-tick" />
              </svg>
            ) : (
              <ShieldCheck size={48} strokeWidth={1.5} className="text-neon" />
            )}
          </div>

          <h2 className="mb-3 text-[28px] font-bold tracking-tight text-white transition-all">
            {isSaving ? "Syncing Records…" : isSuccess ? "Consultation Synced" : "End Consultation?"}
          </h2>
          <p className="px-2 text-[15px] leading-relaxed text-mist/75 mb-8">
            {isSaving
              ? "Securely saving EMR and syncing to the MEIOSIS network."
              : isSuccess
              ? "The EMR has been archived and shared with the patient successfully."
              : <>This will finalize the session for <span className="font-semibold text-white">{patientName}</span> and push all records to the encrypted archive.</>
            }
          </p>

          <div className="space-y-3">
            {/* Primary action — End & Sync / disabled while saving / Hidden on success */}
            {!isSuccess && (
              <button
                onClick={onConfirm}
                disabled={isSaving}
                className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-4 text-[15px] font-bold text-[#020a05] transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #52ff9d 0%, #00e67a 100%)', boxShadow: '0 4px 24px rgba(82,255,157,0.35)' }}
              >
                {isSaving ? (
                  <span>Syncing…</span>
                ) : (
                  <>
                    <Zap size={16} fill="currentColor" />
                    End Consultation & Sync
                  </>
                )}
              </button>
            )}

            {/* View / Print Prescription (shown after a successful save) */}
            {lastSavedPrescriptionPath && (
              <div className="flex flex-col gap-2">
                {onPrintPrescription && (
                  <button
                    onClick={() => handleManualAction(() => onPrintPrescription(lastSavedPrescriptionPath))}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-neon/10 border border-neon/20 px-6 py-4 text-[15px] font-bold text-neon transition hover:bg-neon/20 hover:border-neon/40"
                  >
                    <Zap size={16} fill="currentColor" />
                    Print Prescription
                  </button>
                )}
                
                <button
                  onClick={() => handleManualAction(() => onViewPrescription(lastSavedPrescriptionPath))}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-white/[0.08] hover:border-white/20"
                >
                  <FileText size={17} className="text-mist/70" />
                  View Prescription
                  <ArrowRight size={13} className="ml-auto text-mist/30" />
                </button>
              </div>
            )}

            {/* Dismiss / Keep open */}
            {!isSaving && (
              <button
                onClick={() => handleManualAction(onClose ?? onCancel)}
                className="w-full rounded-xl py-3 text-[13px] font-medium text-mist/50 transition hover:text-mist"
              >
                {isSuccess ? "Close now" : "Keep EMR open"}
              </button>
            )}
          </div>

          {/* Security badge */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-mist/25 font-medium">
            <CheckCircle2 size={10} className="text-neon/40" />
            End-to-end Encrypted · MEIOSIS Secure Sync
          </div>
        </div>
      </div>
    </div>
  );
}
