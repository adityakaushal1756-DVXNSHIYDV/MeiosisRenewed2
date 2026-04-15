import { X } from 'lucide-react';
import { Patient } from '../../types/Patient';

interface EMRBuilderV2Props {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
}

export function EMRBuilderV2({ open, patient, onClose }: EMRBuilderV2Props) {
  if (!open) return null;

  return (
    <div
      className="emr-backdrop fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="emr-sheet scroll-skin relative w-full max-w-5xl overflow-y-auto max-h-[92vh] rounded-t-[32px] border-x border-t border-wire/10 shadow-[0_-24px_80px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-[5px] w-12 rounded-full bg-white/20" />
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-wire/8 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-2xl border border-wire/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/80 transition hover:border-wire/20 hover:bg-white/[0.07]"
          >
            <X size={14} />
            Close
          </button>

          <h2 className="text-[15px] font-semibold tracking-tight text-white/90">
            New EMR — {patient?.name ?? '—'}
          </h2>

          {/* Placeholder so the title stays centred */}
          <div className="w-[80px]" />
        </div>

        {/* Body — to be built out */}
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-sm text-mist">EMR Builder V2 — coming soon</p>
        </div>
      </div>
    </div>
  );
}
