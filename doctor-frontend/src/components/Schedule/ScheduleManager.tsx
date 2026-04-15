import { AlarmClock, CalendarDays, Info, Umbrella } from 'lucide-react';
import { DailySchedule, ScheduleDayEditor } from './ScheduleDayEditor';

interface ScheduleManagerProps {
  days: DailySchedule[];
  vacationNote: string;
  lateStartDate: string;
  lateStartTime: string;
  onToggleOpen: (day: string) => void;
  onChange: (day: string, field: keyof Omit<DailySchedule, 'day' | 'open'>, value: string) => void;
  onVacationNoteChange: (value: string) => void;
  onLateStartDateChange: (value: string) => void;
  onLateStartTimeChange: (value: string) => void;
}

const DAY_SHORT: Record<string, string> = {
  Monday: 'M', Tuesday: 'T', Wednesday: 'W', Thursday: 'T',
  Friday: 'F', Saturday: 'S', Sunday: 'S',
};

export function ScheduleManager({
  days = [],
  vacationNote = "",
  lateStartDate = "",
  lateStartTime = "",
  onToggleOpen,
  onChange,
  onVacationNoteChange,
  onLateStartDateChange,
  onLateStartTimeChange,
}: ScheduleManagerProps) {
  const openCount = (days || []).filter((d) => d?.open).length;

  return (
    <section className="glass-card flex h-full min-h-0 flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title">Schedule Manager</h2>
          <p className="section-copy mt-0.5">Configure clinic hours per weekday and manage date overrides.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="rounded-2xl border border-neon/20 bg-neonSoft px-3.5 py-2 text-center">
            <div className="text-lg font-bold leading-none text-neon">{openCount}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-widest text-neon/60">Open days</div>
          </div>
        </div>
      </div>

      {/* Week overview strip */}
      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-wire/8 bg-white/[0.02] px-4 py-3">
        <CalendarDays size={14} className="shrink-0 text-mist" />
        <div className="flex flex-1 items-center gap-1.5">
          {days.map((d) => (
            <div
              key={d.day}
              title={d.day}
              className={[
                'flex h-8 w-8 flex-1 items-center justify-center rounded-xl text-[11px] font-bold',
                d.open
                  ? 'bg-neon/15 text-neon ring-1 ring-neon/20'
                  : 'bg-white/[0.03] text-white/20',
              ].join(' ')}
            >
              {DAY_SHORT[d.day] ?? d.day[0]}
            </div>
          ))}
        </div>
        <span className="text-xs text-mist/50">{openCount}/7</span>
      </div>

      {/* Main content */}
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_300px]">
        {/* Day rows */}
        <div className="scroll-skin min-h-0 space-y-2 overflow-auto pr-1">
          {days.map((day) => (
            <ScheduleDayEditor
              key={day.day}
              day={day}
              onToggleOpen={onToggleOpen}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Right sidebar — overrides */}
        <div className="scroll-skin min-h-0 space-y-3 overflow-auto">
          {/* Vacation note */}
          <div className="rounded-2xl border border-wire/8 bg-white/[0.025] p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-300/15 bg-amber-400/10 text-amber-200">
                <Umbrella size={14} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Vacation / Leave</div>
                <div className="text-xs text-mist">Override note for absence</div>
              </div>
            </div>
            <textarea
              className="input-shell min-h-[90px] resize-none text-xs"
              value={vacationNote}
              onChange={(e) => onVacationNoteChange(e.target.value)}
              placeholder="e.g. Annual leave Apr 12–15. OPD closed."
            />
          </div>

          {/* Late start override */}
          <div className="rounded-2xl border border-wire/8 bg-white/[0.025] p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-sky/15 bg-sky/10 text-sky">
                <AlarmClock size={14} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Late Start Override</div>
                <div className="text-xs text-mist">One-day delayed opening</div>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="date"
                className="input-shell text-xs"
                value={lateStartDate}
                onChange={(e) => onLateStartDateChange(e.target.value)}
              />
              <input
                type="time"
                className="input-shell text-xs"
                value={lateStartTime}
                onChange={(e) => onLateStartTimeChange(e.target.value)}
              />
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-neon/15 bg-neonSoft/40 p-4">
            <Info size={13} className="mt-0.5 shrink-0 text-neon/60" />
            <p className="text-xs leading-5 text-white/60">
              Closed days disable all bookings. Morning and evening windows generate separate time slots when the backend is connected.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
