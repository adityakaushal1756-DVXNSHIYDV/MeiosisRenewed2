import React from 'react';
import { User, Phone, Hash, Clock, ArrowRight, Activity } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Patient } from '../../types';
import { useUIStore } from '../../store/useUIStore';

interface PatientLaunchCardProps {
  patient: Patient;
  appointmentTime?: string;
  isWalkIn?: boolean;
}

export function PatientLaunchCard({ patient, appointmentTime, isWalkIn }: PatientLaunchCardProps) {
  const { privacyMode } = useUIStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `launchpad-${patient.id}`,
    data: { patient, type: 'launchpad' }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative bg-white/[0.03] border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.06] hover:border-white/10 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-2xl shadow-black' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <User size={20} />
          </div>
          <div>
            <h4 className={`font-bold text-white transition-all ${privacyMode ? 'blur-md select-none' : ''}`}>
              {patient.name}
            </h4>
            <p className="text-[10px] text-mist/30 font-medium uppercase tracking-widest flex items-center gap-2">
              <Hash size={10} />
              {patient.meiosisId}
            </p>
          </div>
        </div>
        {appointmentTime ? (
          <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter flex items-center gap-1">
              <Clock size={10} />
              {appointmentTime}
            </span>
          </div>
        ) : isWalkIn ? (
          <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">Walk-in</span>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-mist/40">
          <Phone size={12} />
          <span className={privacyMode ? 'blur-sm select-none' : ''}>{patient.phone}</span>
        </div>
        {patient.bloodGroup && (
          <div className="flex items-center gap-2 text-xs text-mist/40">
            <Activity size={12} />
            <span>Blood Group: {patient.bloodGroup}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-[9px] text-mist/20 font-bold uppercase tracking-widest">Hold to Drag</span>
        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-mist/30 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-all">
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}
