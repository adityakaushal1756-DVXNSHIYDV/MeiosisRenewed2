export interface DailySchedule {
  day: string;
  open: boolean;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
}

interface ScheduleDayEditorProps {
  day: DailySchedule;
  onToggleOpen: (day: string) => void;
  onChange: (day: string, field: keyof Omit<DailySchedule, 'day' | 'open'>, value: string) => void;
}

const DAY_SHORT: Record<string, string> = {
  Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU',
  Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN',
};

function TimeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="time"
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-[100px] rounded-xl border bg-slate-950/50 px-2.5 py-1.5 text-center font-mono text-xs text-white outline-none transition focus:border-neon/40 focus:ring-1 focus:ring-neon/20 disabled:cursor-not-allowed disabled:opacity-30"
      style={{ borderColor: 'rgba(112, 183, 255, 0.12)' }}
    />
  );
}

export function ScheduleDayEditor({ day, onToggleOpen, onChange }: ScheduleDayEditorProps) {
  return (
    <div
      className={[
        'flex items-center gap-4 rounded-2xl border px-5 py-3.5 transition duration-200',
        day.open
          ? 'border-wire/10 bg-white/[0.03]'
          : 'border-wire/5 bg-white/[0.015]',
      ].join(' ')}
    >
      {/* Day label */}
      <div className="w-12 shrink-0 text-center">
        <div
          className={[
            'text-[11px] font-bold tracking-widest transition',
            day.open ? 'text-white' : 'text-white/30',
          ].join(' ')}
        >
          {DAY_SHORT[day.day] ?? day.day.slice(0, 3).toUpperCase()}
        </div>
      </div>

      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={day.open}
        onClick={() => onToggleOpen(day.day)}
        className={[
          'relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-0 p-0 transition-colors duration-200',
          day.open ? 'bg-neon/75' : 'bg-white/10',
        ].join(' ')}
      >
        <span
          className={[
            'absolute left-[3px] top-[3px] block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200',
            day.open ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>

      {/* Divider */}
      <div className="h-6 w-px shrink-0 bg-wire/8" />

      {/* Slots */}
      {!day.open ? (
        <span className="flex-1 text-xs italic text-mist/40">No clinic hours this day</span>
      ) : (
        <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
          {/* Morning */}
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky/10 text-[10px] text-sky">
              ☀
            </span>
            <TimeInput
              value={day.morningStart}
              onChange={(v) => onChange(day.day, 'morningStart', v)}
              disabled={!day.open}
            />
            <span className="text-xs text-mist/50">–</span>
            <TimeInput
              value={day.morningEnd}
              onChange={(v) => onChange(day.day, 'morningEnd', v)}
              disabled={!day.open}
            />
          </div>

          <div className="hidden h-4 w-px bg-wire/10 sm:block" />

          {/* Evening */}
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-400/10 text-[10px] text-violet-300">
              ☽
            </span>
            <TimeInput
              value={day.eveningStart}
              onChange={(v) => onChange(day.day, 'eveningStart', v)}
              disabled={!day.open}
            />
            <span className="text-xs text-mist/50">–</span>
            <TimeInput
              value={day.eveningEnd}
              onChange={(v) => onChange(day.day, 'eveningEnd', v)}
              disabled={!day.open}
            />
          </div>
        </div>
      )}
    </div>
  );
}
