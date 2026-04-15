/**
 * MedicalCalendar
 *
 * A "No-Scroll", Apple/Linear-aesthetic in-app medical calendar.
 * Views: Today · Daily (3-day) · Weekly · Monthly
 *
 * Features
 * ─────────
 * • Appointment tiles with patient names (Today / Daily)
 * • Volume dots: red (high) / amber (medium) / green (low) per day
 * • Glassmorphism current-time indicator
 * • Click-to-popover with Framer Motion animation
 * • Full keyboard navigation (Arrow keys + Enter + Escape)
 */

import {
  addDays, addMonths, addWeeks,
  eachDayOfInterval,
  endOfMonth, endOfWeek,
  format, getDay,
  isSameDay, isSameMonth, isToday,
  startOfMonth, startOfWeek, subDays, subMonths, subWeeks,
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft, ChevronRight,
  Clock,
  MapPin,
  Stethoscope,
  Video,
  X,
} from 'lucide-react';
import {
  KeyboardEvent as ReactKeyboardEvent,
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import type { CalendarEvent } from '../../hooks/useCalendarData';
import { useCalendarData } from '../../hooks/useCalendarData';

// ─── Config ───────────────────────────────────────────────────────────────────
const HOUR_H     = 56;   // px per hour on the time grid
const START_HOUR = 7;    // grid starts at 07:00
const END_HOUR   = 20;   // grid ends at 20:00

// ─── Types ────────────────────────────────────────────────────────────────────
type CalView = 'today' | 'daily' | 'weekly' | 'monthly';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toYMD(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function nowMinutes(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function volumeConfig(count: number) {
  if (count === 0) return null;
  if (count <= 4)  return { dot: 'bg-emerald-400',  ring: 'ring-emerald-400/30', glow: '',                             label: 'Low'    };
  if (count <= 9)  return { dot: 'bg-amber-400',    ring: 'ring-amber-400/30',   glow: '',                             label: 'Medium' };
  return             { dot: 'bg-red-400',      ring: 'ring-red-400/30',     glow: 'shadow-[0_0_8px_2px] shadow-red-500/50', label: 'High'   };
}

const STATUS_STYLE: Record<string, string> = {
  WAITING:    'border-sky-400/30   bg-sky-400/10   text-sky-300',
  IN_SESSION: 'border-neon/30      bg-neon/10      text-neon',
  COMPLETED:  'border-white/10     bg-white/[0.04] text-white/40',
  PAUSED:     'border-violet-400/30 bg-violet-400/10 text-violet-300',
  LATE:       'border-amber-400/30 bg-amber-400/10 text-amber-300',
  NO_SHOW:    'border-red-400/20   bg-red-400/[0.07] text-red-400/70',
};

function apptStyle(status: string) {
  return STATUS_STYLE[status] ?? STATUS_STYLE.WAITING;
}

// ─── Volume Dot ───────────────────────────────────────────────────────────────
function VolumeDot({ count }: { count: number }) {
  const cfg = volumeConfig(count);
  if (!cfg) return null;
  return (
    <span
      title={`${cfg.label} volume (${count} patients)`}
      className={`inline-block h-2 w-2 rounded-full ring-2 ${cfg.dot} ${cfg.ring} ${cfg.glow}`}
    />
  );
}

// ─── Appointment Popover ──────────────────────────────────────────────────────
function AppointmentPopover({
  event,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) {
  const style = apptStyle(event.status);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        key="card"
        className="fixed left-1/2 top-1/2 z-50 w-[340px] -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[rgba(10,20,35,0.92)] shadow-2xl shadow-black/60 backdrop-blur-2xl">
          {/* Status bar */}
          <div className={`h-1 w-full ${style.split(' ')[1]}`} />

          <div className="p-5">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                  {event.date} · {event.timeLabel}
                  {event.queueNo && <span className="ml-2 text-neon/70">#{event.queueNo}</span>}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white leading-tight">
                  {event.patientName}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white/40 hover:bg-white/[0.06] hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-2.5">
              <DetailRow icon={<Stethoscope size={13} />} label={event.visitReason} />
              <DetailRow
                icon={event.mode === 'Teleconsult' ? <Video size={13} /> : <MapPin size={13} />}
                label={event.mode}
              />
              <DetailRow icon={<Clock size={13} />} label={event.timeLabel} />
            </div>

            {/* Status chip */}
            <div className={`mt-4 inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-medium ${style}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${style.split(' ')[1]}`} />
              {event.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-white/70">
      <span className="text-white/30">{icon}</span>
      {label}
    </div>
  );
}

// ─── Appointment Tile (for time-grid views) ───────────────────────────────────
function GridTile({
  event,
  slotDuration,
  onClick,
  focused,
  tileRef,
}: {
  event: CalendarEvent;
  slotDuration: number;
  onClick: (e: CalendarEvent) => void;
  focused: boolean;
  tileRef?: React.Ref<HTMLButtonElement>;
}) {
  const top    = ((event.startMinutes - START_HOUR * 60) / 60) * HOUR_H;
  const height = Math.max((slotDuration / 60) * HOUR_H, 22);
  const style  = apptStyle(event.status);

  return (
    <motion.button
      ref={tileRef}
      type="button"
      onClick={() => onClick(event)}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={`absolute left-0.5 right-0.5 overflow-hidden rounded-xl border px-2 py-1 text-left transition-shadow ${style} ${
        focused ? 'ring-2 ring-neon/60 ring-offset-1 ring-offset-transparent' : ''
      }`}
      style={{ top, height }}
    >
      <p className="truncate text-[11px] font-semibold leading-none">{event.patientName}</p>
      {height >= 36 && (
        <p className="mt-0.5 truncate text-[10px] opacity-70">{event.timeLabel}</p>
      )}
    </motion.button>
  );
}

// ─── Time Grid Column ─────────────────────────────────────────────────────────
function TimeGridColumn({
  date,
  events,
  slotDuration,
  onTileClick,
  focusedId,
  onFocus,
}: {
  date: Date;
  events: CalendarEvent[];
  slotDuration: number;
  onTileClick: (e: CalendarEvent) => void;
  focusedId: string | null;
  onFocus: (id: string) => void;
}) {
  const totalH = (END_HOUR - START_HOUR) * HOUR_H;
  const nowM   = nowMinutes();
  const showNow = isToday(date);
  const nowTop = showNow
    ? ((nowM - START_HOUR * 60) / 60) * HOUR_H
    : -1;

  return (
    <div className="relative flex-1 min-w-0" style={{ height: totalH }}>
      {/* Hour lines */}
      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-white/[0.04]"
          style={{ top: i * HOUR_H }}
        />
      ))}

      {/* Appointment tiles */}
      {events.map((ev) => {
        const isFocused = focusedId === ev.id;
        return (
          <GridTile
            key={ev.id}
            event={ev}
            slotDuration={slotDuration}
            onClick={onTileClick}
            focused={isFocused}
            tileRef={(el) => { if (isFocused && el) el.focus({ preventScroll: true }); }}
          />
        );
      })}

      {/* Current time indicator */}
      {showNow && nowTop >= 0 && nowTop <= totalH && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-10 flex items-center gap-1"
          style={{ top: nowTop - 1 }}
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-neon shadow-[0_0_6px_2px] shadow-neon/50 backdrop-blur" />
          <div className="h-px flex-1 bg-neon/50 shadow-[0_0_4px_1px] shadow-neon/30" />
        </div>
      )}
    </div>
  );
}

// ─── Today View ───────────────────────────────────────────────────────────────
function TodayView({
  date,
  events,
  slotDuration,
  onTileClick,
  focusedId,
  onFocus,
}: {
  date: Date;
  events: CalendarEvent[];
  slotDuration: number;
  onTileClick: (e: CalendarEvent) => void;
  focusedId: string | null;
  onFocus: (id: string) => void;
}) {
  const vol = volumeConfig((events || []).length);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Day header */}
      <div className="mb-2 flex items-center gap-3 px-1">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white leading-none">{format(date, 'd')}</span>
          <span className="text-xs text-mist uppercase tracking-widest">{format(date, 'EEEE, MMMM yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {vol && <VolumeDot count={(events || []).length} />}
          <span className="text-xs text-mist">{(events || []).length} appointment{(events || []).length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Time grid */}
      <div className="flex min-h-0 flex-1 overflow-y-auto scroll-skin pr-1">
        {/* Hour labels */}
        <div className="mr-2 shrink-0 w-14" style={{ height: (END_HOUR - START_HOUR) * HOUR_H }}>
          {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
            <div
              key={i}
              className="flex items-start justify-end pr-2 text-[10px] text-mist/50 tabular-nums"
              style={{ height: HOUR_H }}
            >
              {format(new Date().setHours(START_HOUR + i, 0), 'h a')}
            </div>
          ))}
        </div>

        {/* Column */}
        <TimeGridColumn
          date={date}
          events={events}
          slotDuration={slotDuration}
          onTileClick={onTileClick}
          focusedId={focusedId}
          onFocus={onFocus}
        />
      </div>

      {(events || []).length === 0 && (
        <p className="absolute inset-x-0 top-1/2 text-center text-sm text-mist/40 italic">No appointments today</p>
      )}
    </div>
  );
}

// ─── Daily View (3-day) ───────────────────────────────────────────────────────
function DailyView({
  referenceDate,
  eventsByDate,
  slotDuration,
  onTileClick,
  focusedId,
  onFocus,
}: {
  referenceDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  slotDuration: number;
  onTileClick: (e: CalendarEvent) => void;
  focusedId: string | null;
  onFocus: (id: string) => void;
}) {
  const days = [subDays(referenceDate, 1), referenceDate, addDays(referenceDate, 1)];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Day headers */}
      <div className="mb-2 flex gap-1 pl-[3.5rem]">
        {days.map((d) => {
          const ymd = toYMD(d);
          const count = (eventsByDate[ymd] ?? []).length;
          return (
            <div key={ymd} className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 ${isToday(d) ? 'bg-neon/[0.08]' : ''}`}>
              <span className="text-[10px] uppercase tracking-widest text-mist/60">{format(d, 'EEE')}</span>
              <span className={`text-xl font-bold leading-none ${isToday(d) ? 'text-neon' : 'text-white'}`}>{format(d, 'd')}</span>
              <div className="flex items-center gap-1.5">
                <VolumeDot count={count} />
                <span className="text-[10px] text-mist/50">{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex min-h-0 flex-1 overflow-y-auto scroll-skin gap-1">
        {/* Hour labels */}
        <div className="mr-1 shrink-0 w-12" style={{ height: (END_HOUR - START_HOUR) * HOUR_H }}>
          {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
            <div
              key={i}
              className="flex items-start justify-end pr-2 text-[10px] text-mist/50 tabular-nums"
              style={{ height: HOUR_H }}
            >
              {format(new Date().setHours(START_HOUR + i, 0), 'h a')}
            </div>
          ))}
        </div>

        {/* 3 columns */}
        {days.map((d) => {
          const ymd = toYMD(d);
          return (
            <TimeGridColumn
              key={ymd}
              date={d}
              events={eventsByDate[ymd] ?? []}
              slotDuration={slotDuration}
              onTileClick={onTileClick}
              focusedId={focusedId}
              onFocus={onFocus}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly View ──────────────────────────────────────────────────────────────
function WeeklyView({
  referenceDate,
  eventsByDate,
  onTileClick,
}: {
  referenceDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  onTileClick: (e: CalendarEvent) => void;
}) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Week summary strip */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const ymd    = toYMD(d);
          const evts   = eventsByDate?.[ymd] || [];
          const count  = evts.length;
          const vol    = volumeConfig(count);
          const today  = isToday(d);

          return (
            <div
              key={ymd}
              className={`rounded-2xl border p-3 flex flex-col gap-2 ${
                today
                  ? 'border-neon/25 bg-neon/[0.06]'
                  : 'border-wire/10 bg-white/[0.025]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-mist/50">{format(d, 'EEE')}</p>
                  <p className={`text-xl font-bold leading-tight ${today ? 'text-neon' : 'text-white'}`}>{format(d, 'd')}</p>
                </div>
                {vol ? (
                  <div className="flex flex-col items-end gap-1">
                    <VolumeDot count={count} />
                    <span className="text-xs font-semibold text-white/80">{count}</span>
                  </div>
                ) : (
                  <span className="text-xs text-mist/30">—</span>
                )}
              </div>

              {/* Mini list of patient names */}
              <div className="space-y-0.5">
                {evts.slice(0, 4).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onTileClick(ev)}
                    className={`w-full truncate rounded-lg border px-2 py-0.5 text-left text-[10px] transition hover:opacity-100 opacity-80 ${apptStyle(ev.status)}`}
                  >
                    {ev.patientName.split(' ')[0]}
                  </button>
                ))}
                {evts.length > 4 && (
                  <p className="text-[10px] text-mist/40 text-center">+{evts.length - 4} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Monthly View ─────────────────────────────────────────────────────────────
function MonthlyView({
  referenceDate,
  eventsByDate,
  onTileClick,
}: {
  referenceDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  onTileClick: (e: CalendarEvent) => void;
}) {
  const monthStart  = startOfMonth(referenceDate);
  const monthEnd    = endOfMonth(referenceDate);
  const gridStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd     = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays     = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const [popDate, setPopDate] = useState<string | null>(null);

  const popEvents = popDate ? (eventsByDate[popDate] ?? []) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      {/* Week headers */}
      <div className="grid grid-cols-7 gap-px">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-[10px] uppercase tracking-widest text-mist/40 py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {allDays.map((d) => {
          const ymd    = toYMD(d);
          const evts   = eventsByDate?.[ymd] || [];
          const count  = evts.length;
          const inMth  = isSameMonth(d, referenceDate);
          const today  = isToday(d);
          const vol    = volumeConfig(count);

          return (
            <button
              key={ymd}
              type="button"
              onClick={() => { if (count > 0) setPopDate(popDate === ymd ? null : ymd); }}
              className={[
                'flex flex-col items-start gap-1 rounded-xl p-2 text-left transition-all',
                inMth ? '' : 'opacity-25',
                today ? 'bg-neon/[0.08] ring-1 ring-neon/20' : 'hover:bg-white/[0.04]',
                count > 0 ? 'cursor-pointer' : 'cursor-default',
              ].join(' ')}
            >
              <div className="flex w-full items-center justify-between">
                <span className={`text-sm font-semibold ${today ? 'text-neon' : 'text-white/80'}`}>
                  {format(d, 'd')}
                </span>
                {vol && (
                  <div className="flex items-center gap-1">
                    <VolumeDot count={count} />
                    <span className="text-[10px] text-mist/60 tabular-nums">{count}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day detail popover (inline, below grid) */}
      <AnimatePresence>
        {popDate && popEvents.length > 0 && (
          <motion.div
            key={popDate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl border border-wire/10 bg-white/[0.03]"
          >
            <div className="flex items-center justify-between p-3">
              <span className="text-sm font-semibold text-white">
                {format(new Date(popDate + 'T00:00'), 'EEEE, d MMMM')}
                <span className="ml-2 text-xs text-mist/60">{popEvents.length} appointments</span>
              </span>
              <button onClick={() => setPopDate(null)} className="text-mist/40 hover:text-white transition">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 px-3 pb-3">
              {popEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onTileClick(ev)}
                  className={`rounded-xl border px-2.5 py-1 text-[11px] font-medium transition hover:opacity-100 opacity-80 ${apptStyle(ev.status)}`}
                >
                  {ev.patientName} · {ev.timeLabel}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main MedicalCalendar ─────────────────────────────────────────────────────
export function MedicalCalendar({ slotDuration = 15 }: { slotDuration?: number }) {
  const [view, setView]               = useState<CalView>('today');
  const [refDate, setRefDate]         = useState(new Date());
  const [selectedEvt, setSelectedEvt] = useState<CalendarEvent | null>(null);
  const [focusedId, setFocusedId]     = useState<string | null>(null);
  const [slideDir, setSlideDir]       = useState<1 | -1>(1);
  const containerRef                  = useRef<HTMLDivElement>(null);

  // ── Compute visible date range ──────────────────────────────────────────────
  const visibleDates = useMemo((): string[] => {
    switch (view) {
      case 'today':
        return [toYMD(refDate)];
      case 'daily':
        return [toYMD(subDays(refDate, 1)), toYMD(refDate), toYMD(addDays(refDate, 1))];
      case 'weekly': {
        const ws = startOfWeek(refDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => toYMD(addDays(ws, i)));
      }
      case 'monthly': {
        const ms = startOfWeek(startOfMonth(refDate), { weekStartsOn: 1 });
        const me = endOfWeek(endOfMonth(refDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start: ms, end: me }).map(toYMD);
      }
    }
  }, [view, refDate]);

  const { eventsByDate, loading } = useCalendarData(visibleDates);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = useCallback((dir: 1 | -1) => {
    setSlideDir(dir);
    setRefDate((d) => {
      switch (view) {
        case 'today':   return addDays(d, dir);
        case 'daily':   return addDays(d, dir * 3);
        case 'weekly':  return addWeeks(d, dir);
        case 'monthly': return addMonths(d, dir);
      }
    });
  }, [view]);

  const goToday = () => { setSlideDir(1); setRefDate(new Date()); };

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  const allEvents = useMemo(
    () => visibleDates.flatMap((d) => eventsByDate[d] ?? []),
    [visibleDates, eventsByDate]
  );

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (selectedEvt) return; // popover open — let it handle Escape itself

    const idx = allEvents.findIndex((ev) => ev.id === focusedId);

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = allEvents[idx + 1] ?? allEvents[0];
      if (next) setFocusedId(next.id);
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = allEvents[idx - 1] ?? allEvents[allEvents.length - 1];
      if (prev) setFocusedId(prev.id);
    }
    if (e.key === 'Enter' && focusedId) {
      const ev = allEvents.find((ev) => ev.id === focusedId);
      if (ev) setSelectedEvt(ev);
    }
    if (e.key === 'ArrowLeft' && !focusedId) navigate(-1);
    if (e.key === 'ArrowRight' && !focusedId) navigate(1);
  }

  // ── View label ──────────────────────────────────────────────────────────────
  function viewTitle(): string {
    switch (view) {
      case 'today':   return format(refDate, 'EEEE, d MMMM yyyy');
      case 'daily': {
        const s = subDays(refDate, 1);
        const e = addDays(refDate, 1);
        return `${format(s, 'd')}–${format(e, 'd')} ${format(refDate, 'MMMM yyyy')}`;
      }
      case 'weekly': {
        const ws = startOfWeek(refDate, { weekStartsOn: 1 });
        const we = endOfWeek(refDate, { weekStartsOn: 1 });
        return `${format(ws, 'd MMM')} – ${format(we, 'd MMM yyyy')}`;
      }
      case 'monthly': return format(refDate, 'MMMM yyyy');
    }
  }

  const VIEWS: { key: CalView; label: string }[] = [
    { key: 'today',   label: 'Today'   },
    { key: 'daily',   label: 'Daily'   },
    { key: 'weekly',  label: 'Weekly'  },
    { key: 'monthly', label: 'Monthly' },
  ];

  return (
    <div
      ref={containerRef}
      className="glass-card flex h-full min-h-0 flex-col gap-4 p-5 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Icon + title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neon/10 text-neon">
            <Calendar size={15} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-neon/60">Medical Calendar</p>
            <p className="text-sm font-semibold text-white leading-tight">{viewTitle()}</p>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex overflow-hidden rounded-xl border border-wire/10 bg-white/[0.025] ml-auto">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setView(key); setFocusedId(null); }}
              className={`px-3.5 py-1.5 text-xs font-semibold transition ${
                view === key
                  ? 'bg-neon/15 text-neon'
                  : 'text-mist hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Navigation arrows + Today */}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => navigate(-1)} className="ghost-btn p-1.5" aria-label="Previous">
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className={`ghost-btn px-2.5 py-1.5 text-xs ${isToday(refDate) && view === 'today' ? '!text-neon !border-neon/30' : ''}`}
          >
            Today
          </button>
          <button type="button" onClick={() => navigate(1)} className="ghost-btn p-1.5" aria-label="Next">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Loading bar ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full bg-neon/50"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
        </div>
      )}

      {/* ── View body ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${view}-${toYMD(refDate)}`}
          className="relative flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, x: slideDir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: slideDir * -24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {view === 'today' && (
            <TodayView
              date={refDate}
              events={eventsByDate[toYMD(refDate)] ?? []}
              slotDuration={slotDuration}
              onTileClick={setSelectedEvt}
              focusedId={focusedId}
              onFocus={setFocusedId}
            />
          )}
          {view === 'daily' && (
            <DailyView
              referenceDate={refDate}
              eventsByDate={eventsByDate}
              slotDuration={slotDuration}
              onTileClick={setSelectedEvt}
              focusedId={focusedId}
              onFocus={setFocusedId}
            />
          )}
          {view === 'weekly' && (
            <WeeklyView
              referenceDate={refDate}
              eventsByDate={eventsByDate}
              onTileClick={setSelectedEvt}
            />
          )}
          {view === 'monthly' && (
            <MonthlyView
              referenceDate={refDate}
              eventsByDate={eventsByDate}
              onTileClick={setSelectedEvt}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-t border-wire/8 pt-3 text-[10px] text-mist/50">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Low</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Medium</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />High</span>
        <span className="ml-auto">↑↓ Navigate · Enter Open · Esc Close</span>
      </div>

      {/* ── Appointment popover ─────────────────────────────────────────────── */}
      {selectedEvt && (
        <AppointmentPopover event={selectedEvt} onClose={() => setSelectedEvt(null)} />
      )}
    </div>
  );
}
