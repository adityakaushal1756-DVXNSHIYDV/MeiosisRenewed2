import { AlertTriangle, CheckCircle2, Clock3, Play, SkipForward, UserCheck, UserMinus } from 'lucide-react';
import { Appointment } from '../../types/Appointment';
import { Patient } from '../../types/Patient';

const statusStyles: Record<Appointment['status'], string> = {
  READY: 'chip-blue',
  WAITING: 'chip-blue',
  IN_SESSION: 'chip-green',
  COMPLETED: 'chip border-wire/10 bg-white/[0.03] text-white/70',
  LATE: 'chip-amber',
  NO_SHOW: 'chip-red',
  PAUSED: 'chip-amber'
};

const arrivalLabel: Record<Appointment['arrivalStatus'], string> = {
  CHECKED_IN: 'Checked in',
  NOT_ARRIVED: 'Not arrived'
};

interface QueueCardProps {
  appointment: Appointment;
  patient?: Patient;
  active: boolean;
  queueLabel?: string;
  queueWindowLabel?: string;
  onOpen: () => void;
  onStart: () => void;
  onEnd: () => void;
  onSkip: () => void;
  onNoShow: () => void;
}

export function QueueCard({
  appointment,
  patient,
  active,
  queueLabel,
  queueWindowLabel,
  onOpen,
  onStart,
  onEnd,
  onSkip,
  onNoShow
}: QueueCardProps) {
  const statusClass = statusStyles[appointment.status];
  const patientName = patient?.name ?? 'Unknown patient';

  const isLate      = appointment.status === 'LATE';
  const isInSession = appointment.status === 'IN_SESSION';

  return (
    <article
      className={[
        'queue-card rounded-3xl border p-4 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out',
        active       ? 'border-neon/30 bg-neonSoft/40 shadow-[0_0_40px_rgba(82,255,157,0.08)]'
          : isLate   ? 'border-amber-400/30 bg-amber-400/[0.04] card-late-glow'
          : 'border-wire/8 bg-slate-950/24 hover:border-wire/14'
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-wire/10 bg-slate-950/40 text-white">{queueLabel || `Queue ${appointment.queueNumber}`}</span>
            {queueWindowLabel ? <span className="chip border-wire/10 bg-white/[0.02] text-white/70">{queueWindowLabel}</span> : null}
            <span className={`${statusClass} inline-flex items-center gap-1.5`}>
              {isInSession && <span className="live-dot" style={{ width: '6px', height: '6px' }} />}
              {appointment.status.replace('_', ' ')}
            </span>
            <span className={appointment.arrivalStatus === 'CHECKED_IN' ? 'chip chip-green' : 'chip chip-amber'}>{arrivalLabel[appointment.arrivalStatus]}</span>
          </div>

          <button onClick={onOpen} className="mt-3 text-left">
            <h3 className="text-lg font-semibold text-white">{patientName}</h3>
            <p className="mt-1 text-sm text-mist">
              {patient ? `${patient.age} years • ${patient.gender} • ${patient.id}` : 'Patient record unavailable'}
            </p>
          </button>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-wire/8 bg-slate-950/30 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-mist">Appointment</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
                <Clock3 size={14} className="text-neon" />
                {appointment.appointmentTime}
              </div>
            </div>
            <div className="rounded-2xl border border-wire/8 bg-slate-950/30 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-mist">Visit Reason</div>
              <div className="mt-2 text-sm font-medium text-white">{appointment.visitReason}</div>
            </div>
            <div className="rounded-2xl border border-wire/8 bg-slate-950/30 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-mist">Mode</div>
              <div className="mt-2 text-sm font-medium text-white">{appointment.mode}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:min-w-[220px] xl:max-w-[220px] xl:flex-col">
          {(appointment.status === 'WAITING' || appointment.status === 'LATE') && (
            <button onClick={onStart} className="action-btn gap-2">
              <Play size={16} />
              Start Appointment
            </button>
          )}
          {(appointment.status === 'IN_SESSION' || appointment.status === 'PAUSED') && (
            <button onClick={onEnd} className="action-btn gap-2">
              <CheckCircle2 size={16} />
              End Appointment
            </button>
          )}
          {(appointment.status === 'WAITING' || appointment.status === 'LATE') && (
            <button onClick={onSkip} className="ghost-btn gap-2">
              <SkipForward size={16} />
              Skip Patient
            </button>
          )}
          {(appointment.status === 'WAITING' || appointment.status === 'LATE') && (
            <button onClick={onNoShow} className="ghost-btn gap-2">
              <UserMinus size={16} />
              Mark No Show
            </button>
          )}
          {appointment.status === 'COMPLETED' && (
            <div className="rounded-2xl border border-wire/8 bg-slate-950/28 px-4 py-3 text-sm text-mist xl:min-h-[78px]">
              Finished and archived in today&apos;s workflow.
            </div>
          )}
          {appointment.status === 'NO_SHOW' && (
            <div className="rounded-2xl border border-red-400/15 bg-red-500/5 px-4 py-3 text-sm text-red-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} />
                Patient marked no show.
              </div>
            </div>
          )}
          {appointment.status === 'IN_SESSION' && (
            <div className="rounded-2xl border border-neon/15 bg-neonSoft px-4 py-3 text-sm text-neon">
              <div className="flex items-center gap-2">
                <UserCheck size={15} />
                Consultation is live.
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
