import { useEffect, useMemo, useState } from 'react';
import { Appointment } from '../../types/Appointment';
import { Patient } from '../../types/Patient';
import { QueueCard } from './QueueCard';
import { QueueSummary } from './QueueSummary';
import { QueueToolbar } from './QueueToolbar';
import { WalkInDialog } from './WalkInDialog';
import { generateTodaySlots } from '../../utils/slotGenerator';
import { DailySchedule } from '../Schedule/ScheduleDayEditor';

function parseAppointmentMinutes(value: string, baseMinutes: number = 0) {
  let minutes = 0;
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hour = Number(match[1]) % 12;
    const min = Number(match[2]);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM') hour += 12;
    minutes = hour * 60 + min;
  } else {
    // Fallback for ISO strings or HH:mm format
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      minutes = date.getHours() * 60 + date.getMinutes();
    } else {
      const hhmm = value.match(/^(\d{2}):(\d{2})$/);
      if (hhmm) {
        minutes = Number(hhmm[1]) * 60 + Number(hhmm[2]);
      } else {
        return Number.MAX_SAFE_INTEGER;
      }
    }
  }

  // If the time is earlier than the clinic base (e.g. 1 AM vs 9 AM start), 
  // it belongs to the "next day" part of the same shift.
  if (baseMinutes > 0 && minutes < baseMinutes) {
    minutes += 1440;
  }
  return minutes;
}

function formatMinutes(totalMinutes: number) {
  const normalized = totalMinutes % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function buildQueueWindows(queue: Appointment[], queueBlockMinutes: number, slotDuration: number, scheduleDays: DailySchedule[] = []) {
  const windows = new Map<number, { label: string; appointments: Appointment[]; endMinutes: number }>();
  
  // 1. Identify the base start time for the clinic day (for relative sorting)
  let baseMinutes = 540; // Default 9:00 AM
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const today = scheduleDays.find((d) => d.day === todayName);

  if (today && today.open) {
    const mStart = parseAppointmentMinutes(today.morningStart);
    const eStart = parseAppointmentMinutes(today.eveningStart);
    baseMinutes = Math.min(mStart, eStart);
  }

  // 2. Use the central generator to build the exact same blocks as the Settings preview
  const { blocks } = generateTodaySlots(scheduleDays, slotDuration, queueBlockMinutes);
  
  blocks.forEach(block => {
    windows.set(block.windowStart, {
      label: block.label,
      appointments: [],
      endMinutes: block.windowStart + block.windowMinutes
    });
  });

  // 3. Map appointments to blocks (and create dynamic blocks for outliers)
  const sortedQueue = [...queue].sort((a, b) => 
    parseAppointmentMinutes(a.appointmentTime, baseMinutes) - parseAppointmentMinutes(b.appointmentTime, baseMinutes)
  );
  
  sortedQueue.forEach((appointment) => {
    const minutes = parseAppointmentMinutes(appointment.appointmentTime, baseMinutes);
    
    // Find if it fits in an existing block
    let assignedKey: number | null = null;
    for (const [key, value] of windows.entries()) {
      if (minutes >= key && minutes < value.endMinutes) {
        assignedKey = key;
        break;
      }
    }

    if (assignedKey !== null) {
      windows.get(assignedKey)?.appointments.push(appointment);
    } else {
      // Create a dynamic block for this outlier
      const relativeMinutes = minutes - baseMinutes;
      const blockStart = baseMinutes + Math.floor(relativeMinutes / queueBlockMinutes) * queueBlockMinutes;
      const blockEnd = blockStart + queueBlockMinutes;
      
      if (!windows.has(blockStart)) {
        windows.set(blockStart, {
          label: `${formatMinutes(blockStart)} - ${formatMinutes(blockEnd)}`,
          appointments: [],
          endMinutes: blockEnd
        });
      }
      windows.get(blockStart)?.appointments.push(appointment);
    }
  });

  // 4. Convert to array and sort by absolute time
  return Array.from(windows.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([key, value], index) => ({
      id: `queue-window-${key}`,
      title: `Queue Block ${index + 1}`,
      label: value.label,
      appointments: value.appointments,
      startTimeMinutes: key
    }));
}

interface QueuePanelProps {
  queue: Appointment[];
  patients: Patient[];
  activeAppointmentId: string | null;
  /** Minutes per queue block window (from Settings slider) */
  queueBlockMinutes: number;
  /** Minutes per appointment slot (for display info) */
  slotDuration: number;
  /** Full schedule to generate blocks matching Settings preview */
  scheduleDays?: DailySchedule[];
  onSelect: (appointmentId: string) => void;
  onStart: (appointmentId: string) => void;
  onEnd: (appointmentId: string) => void;
  onSkip: (appointmentId: string) => void;
  onNoShow: (appointmentId: string) => void;
  onAddWalkIn: (meiosisId: string, visitReason?: string) => Promise<string | null>;
  onRefresh: () => void;
  isSyncing?: boolean;
}

export function QueuePanel(props: QueuePanelProps) {
  const { queue, patients, activeAppointmentId, queueBlockMinutes, slotDuration, scheduleDays = [], onSelect, onStart, onEnd, onSkip, onNoShow, onAddWalkIn, onRefresh, isSyncing } = props;
  const waiting = queue.filter((item) => item.status === 'WAITING').length;
  const inSession = queue.filter((item) => item.status === 'IN_SESSION' || item.status === 'PAUSED').length;
  const completed = queue.filter((item) => item.status === 'COMPLETED').length;
  const late = queue.filter((item) => item.status === 'LATE').length;
  const queueWindows = useMemo(() => buildQueueWindows(queue, queueBlockMinutes, slotDuration, scheduleDays), [queue, queueBlockMinutes, slotDuration, scheduleDays]);
  const patientMap = useMemo(() => new Map(patients.map((patient) => [patient.id, patient])), [patients]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(queueWindows[0]?.id ?? null);

  useEffect(() => {
    if (!queueWindows.length) {
      setActiveWindowId(null);
      return;
    }

    if (!activeWindowId || !queueWindows.some((window) => window.id === activeWindowId)) {
      setActiveWindowId(queueWindows[0].id);
    }
  }, [queueWindows, activeWindowId]);

  const activeWindow = queueWindows.find((window) => window.id === activeWindowId) ?? queueWindows[0] ?? null;
  const [walkInOpen, setWalkInOpen] = useState(false);

  return (
    <>
    <section className="flex h-full min-h-0 flex-col p-4 md:p-6 overflow-hidden rounded-[24px] bg-[#011424]/85 backdrop-blur-md border border-white/5 shadow-2xl queue-shell">
      {/* Header tags removed per request */}

      <QueueToolbar 
        waitingCount={waiting + late} 
        completedCount={completed} 
        queueWindowCount={queueWindows.length} 
        onAddWalkIn={() => setWalkInOpen(true)} 
        onRefresh={onRefresh}
        isSyncing={isSyncing}
      />
      <QueueSummary waiting={waiting} inSession={inSession} completed={completed} late={late} />

      <div className="queue-workspace mt-5 flex min-h-0 flex-1 flex-col rounded-[32px] border border-white/5 bg-slate-950/45 p-3 shadow-inner">
        <div className="rounded-[24px] border border-wire/8 bg-slate-950/28 p-3">
          <div className="queue-window-strip flex gap-2 overflow-x-auto pb-1">
            {queueWindows.map((window) => (
              <button
                key={window.id}
                type="button"
                onClick={() => setActiveWindowId(window.id)}
                className={[
                  'queue-window-pill min-w-[168px] rounded-2xl border px-4 py-2 text-left text-sm transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out',
                  activeWindowId === window.id
                    ? 'border-neon/30 bg-neonSoft text-white shadow-[0_12px_30px_rgba(82,255,157,0.08)]'
                    : 'border-wire/10 bg-white/[0.02] text-white/80 hover:border-wire/20 hover:bg-white/[0.035]'
                ].join(' ')}
              >
                <div className="font-semibold">{window.title}</div>
                <div className="mt-1 text-xs text-mist">{window.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="queue-scroll scroll-skin mt-3 min-h-[360px] flex-1 overflow-auto pr-1">
          {activeWindow ? (
            <div key={activeWindow.id} className="rounded-[26px] border border-wire/8 bg-slate-950/22 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-neon/80">{activeWindow.title}</h3>
                  <p className="text-sm text-mist">{activeWindow.label}</p>
                </div>
                <span className="chip border-wire/10 bg-slate-950/30 text-white/75">{activeWindow.appointments.length} patients</span>
              </div>

              <div key={activeWindow.id} className="queue-card-stack space-y-3">
                {activeWindow.appointments.map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className="queue-wave-item"
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <QueueCard
                      appointment={appointment}
                      patient={patientMap.get(appointment.patientId)}
                      active={activeAppointmentId === appointment.id}
                      queueLabel={`Queue ${index + 1}`}
                      queueWindowLabel={activeWindow.label}
                      onOpen={() => onSelect(appointment.id)}
                      onStart={() => onStart(appointment.id)}
                      onEnd={() => onEnd(appointment.id)}
                      onSkip={() => onSkip(appointment.id)}
                      onNoShow={() => onNoShow(appointment.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-[26px] border border-dashed border-wire/10 bg-white/[0.02] p-6 text-center">
              <div>
                <p className="text-lg font-semibold text-white">No appointments in queue</p>
                <p className="mt-2 text-sm text-mist">Add a walk-in or refresh the schedule to load the latest patient flow.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
    <WalkInDialog
      open={walkInOpen}
      onClose={() => setWalkInOpen(false)}
      onAddWalkIn={onAddWalkIn}
    />
    </>
  );
}
