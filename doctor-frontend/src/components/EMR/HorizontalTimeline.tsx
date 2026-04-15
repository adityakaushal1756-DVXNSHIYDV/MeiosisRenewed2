import { useEffect, useRef } from 'react';
import {
  CalendarCheck2, FileText, FlaskConical, Minus, Pill, Plus,
} from 'lucide-react';
import type { TimelineEvent } from './EMRTimeline';
import type { PatientPastAppointment, PatientMedicalReport } from '../../types/Patient';

/* ─────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────── */
const ZOOM_LABELS = ['10Y', '3Y', '1Y', '3M'];
const TRACK_WIDTH = 4000;  // fixed px width — zoom changes the TIME WINDOW, not the track width
const ZOOM_RANGE_MS = [
  10 * 365.25 * 24 * 3600 * 1000,  // 10Y
  3  * 365.25 * 24 * 3600 * 1000,  // 3Y
  1  * 365.25 * 24 * 3600 * 1000,  // 1Y
  3  * 30.44  * 24 * 3600 * 1000,  // 3M
];

// px above axis bottom for the BOTTOM edge of each lane's cards
const LANE_HEIGHTS = [14, 130, 250];
const AXIS_BOTTOM = 60;   // px from scroll container bottom
const CARD_W = 158;
const CARD_H_COLLAPSED = 96;
const CARD_H_EXPANDED = 210;

/* ─────────────────────────────────────────────────────────
   Event styling config
───────────────────────────────────────────────────────── */
type Kind = TimelineEvent['kind'];

const NODE_CONFIG: Record<Kind, { icon: React.ReactNode; color: string; label: string }> = {
  appointment: {
    icon: <CalendarCheck2 size={11} />,
    color: '#34d399',
    label: 'Office visit',
  },
  lab: {
    icon: <FlaskConical size={11} />,
    color: '#a78bfa',
    label: 'Lab / Report',
  },
};

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
function oneLiner(event: TimelineEvent): string {
  if (event.kind === 'appointment') {
    const a = event.data as PatientPastAppointment;
    const str = a.diagnosis || a.symptoms || a.purpose || a.doctorName || '';
    return str.length > 36 ? str.slice(0, 36) + '…' : str;
  }
  if (event.kind === 'lab') {
    const l = event.data as PatientMedicalReport;
    return l.title.length > 36 ? l.title.slice(0, 36) + '…' : l.title;
  }
  return '';
}

function isCardiac(event: TimelineEvent): boolean {
  const CARDIAC_KW = ['cardiac', 'heart', 'ecg', 'ekg', 'chest pain', 'angina', 'arrhythmia', 'hypertension', 'bp', 'pulse', 'palpitation'];
  if (event.kind === 'appointment') {
    const a = event.data as PatientPastAppointment;
    const text = [a.chiefComplaint, a.symptoms, a.diagnosis, a.purpose].filter(Boolean).join(' ').toLowerCase();
    return CARDIAC_KW.some(kw => text.includes(kw));
  }
  return false;
}

function isImaging(event: TimelineEvent): boolean {
  if (event.kind === 'lab') {
    return (event.data as PatientMedicalReport).category === 'Imaging';
  }
  return false;
}

/* ─────────────────────────────────────────────────────────
   Lane assignment — greedy: place in lowest available lane
───────────────────────────────────────────────────────── */
function assignLanes(positions: { x: number; event: TimelineEvent; isSelected: boolean }[], cardW: number): number[] {
  const laneEndX: number[] = [0, 0, 0]; // rightmost X used per lane
  const lanes: number[] = [];
  for (const { x, isSelected } of positions) {
    const w = cardW + 12; // gap
    const cardStart = x - cardW / 2;
    // Find first lane where card fits
    let assigned = -1;
    for (let l = 0; l < 3; l++) {
      if (cardStart >= laneEndX[l]) {
        assigned = l;
        break;
      }
    }
    if (assigned === -1) assigned = 0; // fallback
    laneEndX[assigned] = x + cardW / 2 + (isSelected ? CARD_H_EXPANDED : w);
    lanes.push(assigned);
  }
  return lanes;
}

/* ─────────────────────────────────────────────────────────
   Cardiac dot-matrix week grid (7x5, Mo–Fr labels)
───────────────────────────────────────────────────────── */
function CardiacDotGrid() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const rows = 5;
  const cols = 7;
  const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="mt-2">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '3px',
          marginBottom: '3px',
        }}
      >
        {Array.from({ length: rows * cols }).map((_, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          // Fill dots leading up to today's position
          const totalDots = rows * cols;
          const todayDot = (rows - 1) * cols + dayOfWeek;
          const filled = idx <= todayDot && row >= rows - 2;
          return (
            <div
              key={idx}
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: filled ? '#e8e040' : col === dayOfWeek && row === rows - 1 ? '#555' : '#2a2a2a',
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '3px',
        }}
      >
        {DAY_LABELS.map(d => (
          <span key={d} style={{ fontSize: '6px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{d}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Rich content for selected card
───────────────────────────────────────────────────────── */
function RichContent({ event }: { event: TimelineEvent }) {
  const cfg = NODE_CONFIG[event.kind];

  if (isCardiac(event)) {
    return (
      <div className="mt-2">
        <svg viewBox="0 0 110 28" className="w-full h-6">
          <rect width="110" height="28" fill="#0d0d0d" rx="3" />
          <polyline
            points="0,14 8,14 12,6 16,22 20,14 26,14 30,9 34,19 38,14 48,14 52,7 56,21 60,14 70,14 74,11 78,17 82,14 90,14 94,10 98,18 102,14 110,14"
            fill="none"
            stroke="#EF4444"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-[8px] text-white/30 uppercase tracking-[0.15em]">ECG</span>
          <span className="text-[13px] font-bold leading-none" style={{ color: cfg.color }}>62–180 bpm</span>
        </div>
        <CardiacDotGrid />
      </div>
    );
  }

  if (isImaging(event)) {
    return (
      <div className="mt-2 grid grid-cols-2 gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rounded bg-[#111] flex items-center justify-center" style={{ height: '36px' }}>
            <span className="text-[7px] text-white/20 font-mono">MRI</span>
          </div>
        ))}
      </div>
    );
  }

  // Generic: show summary text
  let summary = '';
  if (event.kind === 'appointment') {
    const a = event.data as PatientPastAppointment;
    summary = a.notes || a.diagnosis || a.symptoms || '';
  } else if (event.kind === 'lab') {
    summary = (event.data as PatientMedicalReport).summary || '';
  }

  return (
    <div className="mt-2">
      {summary ? (
        <p className="text-[8.5px] leading-relaxed text-white/50 line-clamp-4">{summary}</p>
      ) : (
        <p className="text-[8.5px] italic text-white/25">No additional details</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   EventCard
───────────────────────────────────────────────────────── */
interface EventCardProps {
  event: TimelineEvent;
  isSelected: boolean;
  onSelect: () => void;
  cardW: number;
  cardHExpanded: number;
}

function EventCard({ event, isSelected, onSelect, cardW, cardHExpanded }: EventCardProps) {
  const cfg = NODE_CONFIG[event.kind];
  const title =
    event.kind === 'appointment'
      ? ((event.data as PatientPastAppointment).diagnosis || (event.data as PatientPastAppointment).purpose || (event.data as PatientPastAppointment).symptoms || 'Consultation')
        : (event.data as PatientMedicalReport).title;

  const d = new Date(event.date);
  const dateStr = `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;

  const h = isSelected ? cardHExpanded : CARD_H_COLLAPSED;

  if (isSelected) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="text-left transition-all duration-200"
        style={{ width: `${cardW}px`, height: `${h}px` }}
      >
        <div
          className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#111111] px-3 py-2.5 shadow-xl"
          style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${cfg.color}22` }}
        >
          <div className="flex items-center gap-1.5 mb-1 flex-shrink-0">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0"
              style={{ backgroundColor: '#e8e040', color: '#1a1a1a' }}
            >
              {cfg.icon}
            </div>
            <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/40">{cfg.label}</span>
            <span className="ml-auto text-[8px] text-white/25">{dateStr}</span>
          </div>
          <div className="text-[10px] font-bold leading-snug text-white line-clamp-2 flex-shrink-0">{title}</div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <RichContent event={event} />
          </div>
        </div>
      </button>
    );
  }

  /* Sub-info for bottom of card */
  let subInfo = '';
  if (event.kind === 'appointment') {
    const a = event.data as PatientPastAppointment;
    subInfo = a.doctorName || a.specialty || '';
  } else if (event.kind === 'lab') {
    subInfo = (event.data as PatientMedicalReport).category || '';
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
      style={{ width: `${cardW}px`, height: `${h}px` }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#e8e3d8] bg-white px-3.5 py-3 shadow-sm hover:shadow-lg hover:border-black/[0.18] transition-all">
        {/* Top row: icon + label + date */}
        <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
          <div
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
          >
            {cfg.icon}
          </div>
          <span
            className="flex-1 text-[9px] font-semibold uppercase tracking-[0.1em] truncate"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
          <span className="text-[9px] text-[#bbb] flex-shrink-0 font-mono">{dateStr}</span>
        </div>
        {/* Title */}
        <div className="text-[11px] font-bold leading-snug text-[#1a1a1a] line-clamp-2 flex-1">
          {title}
        </div>
        {/* Sub info */}
        {subInfo && (
          <div className="mt-1.5 flex-shrink-0 text-[9px] text-[#aaa] truncate border-t border-black/[0.05] pt-1.5">
            {subInfo}
          </div>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────── */
interface HorizontalTimelineProps {
  events: TimelineEvent[];
  selectedEvent: TimelineEvent | null;
  onSelectEvent: (event: TimelineEvent | null) => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
}

export function HorizontalTimeline({
  events, selectedEvent, onSelectEvent, zoomLevel, onZoomChange,
}: HorizontalTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Time window — zoom controls WHAT PERIOD is visible, track width is fixed ── */
  const now = Date.now();
  const rangeMs = ZOOM_RANGE_MS[zoomLevel];
  const maxTs = now + rangeMs * 0.015;        // tiny right padding
  const minTs = maxTs - rangeMs;

  function tsToX(ts: number): number {
    return ((ts - minTs) / rangeMs) * (TRACK_WIDTH - 80) + 40;
  }

  /* ── Only show events within the visible window ── */
  const visibleEvents = events.filter(ev => ev.sortTs >= minTs && ev.sortTs <= maxTs);

  /* ── Ruler: years ── */
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startYear = new Date(minTs).getFullYear();
  const endYear   = new Date(maxTs).getFullYear();

  const rulerYears: { year: number; x: number }[] = [];
  for (let y = startYear; y <= endYear + 1; y++) {
    const ts = new Date(y, 0, 1).getTime();
    if (ts >= minTs && ts <= maxTs) rulerYears.push({ year: y, x: tsToX(ts) });
  }

  /* ── Ruler: months (zoom >= 1) ── */
  const rulerMonths: { label: string; x: number; isJan: boolean }[] = [];
  if (zoomLevel >= 1) {
    for (let y = startYear; y <= endYear + 1; y++) {
      for (let m = 0; m < 12; m++) {
        const ts = new Date(y, m, 1).getTime();
        if (ts >= minTs && ts <= maxTs) {
          rulerMonths.push({ label: MONTHS_SHORT[m], x: tsToX(ts), isJan: m === 0 });
        }
      }
    }
  }

  /* ── Ruler: weeks (zoom 3M only) ── */
  const rulerWeeks: { x: number }[] = [];
  if (zoomLevel === 3) {
    const weekMs = 7 * 24 * 3600 * 1000;
    // start from first Monday >= minTs
    const startMonday = new Date(minTs);
    startMonday.setDate(startMonday.getDate() + ((1 - startMonday.getDay() + 7) % 7));
    let wt = startMonday.getTime();
    while (wt <= maxTs) {
      rulerWeeks.push({ x: tsToX(wt) });
      wt += weekMs;
    }
  }

  /* ── Sort visible events by x for lane assignment ── */
  const sortedByX = [...visibleEvents].sort((a, b) => tsToX(a.sortTs) - tsToX(b.sortTs));
  const posForLane = sortedByX.map(ev => ({
    x: tsToX(ev.sortTs),
    event: ev,
    isSelected: ev === selectedEvent,
  }));
  const laneAssignments = assignLanes(posForLane, CARD_W);
  const laneMap = new Map<TimelineEvent, number>();
  sortedByX.forEach((ev, i) => laneMap.set(ev, laneAssignments[i]));

  /* ── Scroll to far right on mount / zoom change ── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [zoomLevel]);

  /* Empty state */
  if (visibleEvents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center bg-[#e5e0d4]">
        <div className="rounded-2xl border border-black/[0.08] bg-white/60 p-4 text-[#ccc]">
          <FileText size={22} />
        </div>
        <p className="text-xs text-[#aaa] font-medium">No records in this period</p>
        <p className="text-[10px] text-[#ccc]">Try zooming out to see older entries</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#e5e0d4]">

      {/* ── Controls bar ── */}
      <div className="flex flex-shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-3 border-b border-black/[0.05]">
        {/* Legend */}
        <div className="flex items-center gap-3">
          {(Object.entries(NODE_CONFIG) as [Kind, typeof NODE_CONFIG[Kind]][]).map(([kind, cfg]) => (
            <div key={kind} className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-[9px] text-[#aaa]">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          {/* Zoom selector pill */}
          <div className="flex rounded-lg border border-black/[0.1] bg-white p-0.5 shadow-sm">
            {ZOOM_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onZoomChange(i)}
                className={`rounded-md px-2.5 py-1 text-[9px] font-semibold transition-all ${
                  zoomLevel === i
                    ? 'bg-[#1a1a1a] text-white shadow-sm'
                    : 'text-[#aaa] hover:text-[#555]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Minus button — black filled circle */}
          <button
            type="button"
            title="Zoom out"
            onClick={() => onZoomChange(Math.max(0, zoomLevel - 1))}
            disabled={zoomLevel === 0}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus size={10} />
          </button>
          {/* Plus button — black filled circle */}
          <button
            type="button"
            title="Zoom in"
            onClick={() => onZoomChange(Math.min(3, zoomLevel + 1))}
            disabled={zoomLevel === 3}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={10} />
          </button>
        </div>
      </div>

      {/* ── Timeline scroll container ── */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d5d0ca transparent' }}
      >
        <div
          className="relative h-full"
          style={{ width: `${TRACK_WIDTH}px`, minWidth: '100%' }}
        >

          {/* ── Horizontal axis line ── */}
          <div
            className="absolute inset-x-0 h-px bg-[#1a1a1a]/[0.12]"
            style={{ bottom: `${AXIS_BOTTOM}px` }}
          />

          {/* ── Week tick marks (3M zoom) ── */}
          {rulerWeeks.map(({ x }, i) => (
            <div
              key={`wk-${i}`}
              className="absolute"
              style={{ bottom: `${AXIS_BOTTOM + 1}px`, left: `${x}px`, transform: 'translateX(-50%)' }}
            >
              <div className="h-1.5 w-px bg-[#1a1a1a]/10" />
            </div>
          ))}

          {/* ── Month tick marks + labels ── */}
          {rulerMonths.map((m, i) => (
            <div key={`mon-${i}`}>
              {/* tick */}
              <div
                className="absolute"
                style={{ bottom: `${AXIS_BOTTOM + 1}px`, left: `${m.x}px`, transform: 'translateX(-50%)' }}
              >
                <div className={`w-px ${m.isJan ? 'h-3 bg-[#1a1a1a]/30' : 'h-2 bg-[#1a1a1a]/15'}`} />
              </div>
              {/* label */}
              <div
                className="absolute"
                style={{ bottom: `${AXIS_BOTTOM - 16}px`, left: `${m.x}px`, transform: 'translateX(-50%)' }}
              >
                <span className={`text-[9px] font-medium ${m.isJan ? 'text-[#999]' : 'text-[#bbb]'}`}>
                  {m.label}
                </span>
              </div>
            </div>
          ))}

          {/* ── Year labels (shown only at 10Y / 3Y, or as Jan label on others) ── */}
          {(zoomLevel <= 1) && rulerYears.map(({ year, x }) => (
            <div
              key={`yr-${year}`}
              className="absolute"
              style={{ bottom: '34px', left: `${x}px`, transform: 'translateX(-50%)' }}
            >
              <span className="text-[10px] font-bold text-[#888]">{year}</span>
            </div>
          ))}

          {/* ── Today marker ── */}
          {(() => {
            const todayX = tsToX(Date.now());
            if (todayX < 0 || todayX > TRACK_WIDTH) return null;
            return (
              <div
                className="absolute"
                style={{ left: `${todayX}px`, bottom: `${AXIS_BOTTOM - 1}px`, top: '8px' }}
              >
                <div className="h-full w-px bg-[#e8e040]/70" />
                <span
                  className="absolute -top-4 left-1.5 rounded-sm bg-[#e8e040] px-1 py-0.5 text-[8px] font-bold text-[#6a5800]"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Today
                </span>
              </div>
            );
          })()}

          {/* ── Event dots + connector lines + cards ── */}
          {visibleEvents.map((event, i) => {
            const x = tsToX(event.sortTs);
            const lane = laneMap.get(event) ?? 0;
            const laneBottomOffset = LANE_HEIGHTS[lane];
            const isSelected = event === selectedEvent;
            const cardH = isSelected ? CARD_H_EXPANDED : CARD_H_COLLAPSED;

            const connectorGap = 6;
            const cardBottom = AXIS_BOTTOM + laneBottomOffset + connectorGap;
            const lineHeight = laneBottomOffset + connectorGap;

            return (
              <div key={`${event.kind}-${event.date}-${i}`}>
                {/* Axis dot — 5px circle */}
                <div
                  className="absolute rounded-full"
                  style={{
                    bottom: `${AXIS_BOTTOM - 2.5}px`,
                    left: `${x - 2.5}px`,
                    width: '5px',
                    height: '5px',
                    backgroundColor: isSelected ? '#1a1a1a' : NODE_CONFIG[event.kind].color,
                    transition: 'background-color 0.2s',
                  }}
                />

                {/* Vertical connector line */}
                <div
                  className="absolute"
                  style={{
                    bottom: `${AXIS_BOTTOM + 4}px`,
                    left: `${x}px`,
                    width: '1px',
                    height: `${lineHeight}px`,
                    backgroundColor: 'rgba(26,26,26,0.15)',
                    transform: 'translateX(-0.5px)',
                  }}
                />

                {/* Card */}
                <div
                  className="absolute"
                  style={{
                    bottom: `${cardBottom}px`,
                    left: `${x - CARD_W / 2}px`,
                    width: `${CARD_W}px`,
                    height: `${cardH}px`,
                    transition: 'height 0.2s ease, bottom 0.2s ease',
                    zIndex: isSelected ? 20 : 1,
                  }}
                >
                  <EventCard
                    event={event}
                    isSelected={isSelected}
                    onSelect={() => onSelectEvent(isSelected ? null : event)}
                    cardW={CARD_W}
                    cardHExpanded={CARD_H_EXPANDED}
                  />
                </div>
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}
