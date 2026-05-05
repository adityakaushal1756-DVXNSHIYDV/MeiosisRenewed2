import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Activity, User, MoreVertical, Stethoscope, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { QueueEntry } from '../../types';
import { useUIStore } from '../../store/useUIStore';

interface QueueEntryCardProps {
  entry: QueueEntry;
  onTriage: (patientId: string) => void;
  onLaunch: (patientId: string) => void;
}

export function QueueEntryCard({ entry, onTriage, onLaunch }: QueueEntryCardProps) {
  const { privacyMode } = useUIStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const statusColors = {
    WAITING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    WITH_DOCTOR: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    NO_SHOW: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  const statusIcons = {
    WAITING: <Clock className="w-3 h-3" />,
    WITH_DOCTOR: <Stethoscope className="w-3 h-3" />,
    COMPLETED: <CheckCircle2 className="w-3 h-3" />,
    NO_SHOW: <AlertCircle className="w-3 h-3" />
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-white/[0.06] hover:border-white/10 ${isDragging ? 'shadow-2xl shadow-black ring-2 ring-purple-500/50' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-mist/20 hover:text-mist/40 transition-colors">
        <GripVertical size={20} />
      </div>

      <div className="flex-none flex flex-col items-center justify-center w-12 h-12 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <span className="text-xl font-black text-purple-400 leading-none">{entry.sequenceNumber}</span>
        <span className="text-[8px] font-bold text-purple-400/50 uppercase mt-1">Order</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className={`font-bold text-white truncate ${privacyMode ? 'blur-md select-none' : ''}`}>
            {entry.patient.name}
          </h4>
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColors[entry.status]}`}>
            {entry.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-mist/30 font-medium">
          <span className="flex items-center gap-1">
            <User size={10} />
            {entry.patient.meiosisId}
          </span>
          <span className="flex items-center gap-1">
            <Activity size={10} />
            Vitals Logged
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onTriage(entry.patient.id)}
          className="p-2 bg-white/5 border border-white/5 rounded-xl text-mist/60 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all tooltip"
          title="Clinical Triage"
        >
          <Activity size={18} />
        </button>
        <button 
          onClick={() => onLaunch(entry.patient.id)}
          className="p-2 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20 hover:bg-purple-600 transition-all"
          title="Launch to Doctor"
        >
          <Play size={18} fill="currentColor" />
        </button>
        <button className="p-2 text-mist/20 hover:text-mist/60 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}

function Clock(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
