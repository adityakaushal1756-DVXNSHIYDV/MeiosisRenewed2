import { ShieldOff, X, Activity } from 'lucide-react';
import { SpacetimeSingularity } from './SpacetimeSingularity';
import { AdmissionRecord, AdmissionCard } from '../Shared/AdmissionStatus';

interface AccessDeniedOverlayProps {
  patientName: string;
  onClose: () => void;
  onBuildEMR: () => void;
  isClosing?: boolean;
  singularityModern?: boolean;
  admissionRecord?: AdmissionRecord | null;
}

export function AccessDeniedOverlay({ 
  patientName, 
  onClose, 
  onBuildEMR, 
  isClosing, 
  singularityModern = false,
  admissionRecord
}: AccessDeniedOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm ${
        isClosing ? 'records-backdrop-exit' : 'records-backdrop-enter'
      }`}
      onClick={onClose}
    >
      <div
        className={`absolute overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] ${
          isClosing ? 'records-card-exit' : 'records-card-enter'
        }`}
        style={{ inset: 0, background: '#01050e' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Animation */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-80">
          <SpacetimeSingularity
            coreColorHex="#ff4444"
            edgeColorHex="#010b18"
            modern={singularityModern}
          />
        </div>

        {/* Drag handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 h-[5px] w-12 rounded-full bg-white/20 pointer-events-none" />



        {/* Content Legibility Overlay */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.7)_0%,transparent_60%)] pointer-events-none" />

        {/* Content */}
        <div className="relative z-20 flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
          {/* Shield icon */}
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-red-400/20 bg-red-400/[0.08] backdrop-blur-md">
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

          {/* Admission Info (NEW) */}
          {admissionRecord && (
            <div className="w-full max-w-sm mt-2">
              <AdmissionCard record={admissionRecord} chromeDarkMode={true} />
            </div>
          )}

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
