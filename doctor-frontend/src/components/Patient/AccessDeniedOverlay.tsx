import { ShieldOff, X } from 'lucide-react';

interface AccessDeniedOverlayProps {
  patientName: string;
  onClose: () => void;
  onBuildEMR: () => void;
  isClosing?: boolean;
}

export function AccessDeniedOverlay({ patientName, onClose, onBuildEMR, isClosing }: AccessDeniedOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm ${
        isClosing ? 'records-backdrop-exit' : 'records-backdrop-enter'
      }`}
      onClick={onClose}
    >
      <div
        className={`absolute rounded-t-[28px] overflow-hidden shadow-[0_-16px_60px_rgba(0,0,0,0.7)] ${
          isClosing ? 'records-card-exit' : 'records-card-enter'
        }`}
        style={{ top: 20, left: 20, right: 20, bottom: 0, background: '#070e1a' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 h-[5px] w-12 rounded-full bg-white/20 pointer-events-none" />

        {/* Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm transition hover:bg-black/60 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          <button
            type="button"
            onClick={onBuildEMR}
            className="flex items-center gap-1.5 rounded-2xl border border-neon/25 bg-neon/10 px-3 py-1.5 text-xs font-medium text-neon backdrop-blur-sm transition hover:bg-neon/20 hover:border-neon/40"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M7 5v4M5 7h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Build EMR
          </button>
        </div>

        {/* Content */}
        <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
          {/* Shield icon */}
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-red-400/20 bg-red-400/[0.08]">
            <ShieldOff size={40} className="text-red-400/70" />
          </div>

          {/* Message */}
          <div className="max-w-sm">
            <h2 className="text-2xl font-semibold text-white">
              Access Restricted
            </h2>
            <p className="mt-3 text-base leading-relaxed text-white/60">
              <span className="font-medium text-white/80">{patientName}</span> has not granted record access to doctors.
            </p>
            <p className="mt-2 text-sm text-white/40">
              The patient can enable access from the Share Controls panel in their Health Records section.
            </p>
          </div>

          {/* Access level grid */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            {[
              { icon: '📋', label: 'Full Records', status: 'blocked' },
              { icon: '🧪', label: 'Lab Reports', status: 'blocked' },
              { icon: '📄', label: 'Summary', status: 'blocked' },
            ].map(({ icon, label, status }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-red-400/10 bg-red-400/[0.04] p-3"
              >
                <span className="text-xl opacity-40">{icon}</span>
                <span className="text-xs font-medium text-white/40">{label}</span>
                <span className="text-[10px] uppercase tracking-wider text-red-400/60">{status}</span>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBuildEMR}
              className="flex items-center gap-2 rounded-2xl border border-neon/30 bg-neon/10 px-6 py-2.5 text-sm font-medium text-neon transition hover:bg-neon/20 hover:text-white"
            >
              Start New Consultation
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
