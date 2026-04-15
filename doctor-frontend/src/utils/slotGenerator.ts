/**
 * slotGenerator
 *
 * Converts a DailySchedule + a slot duration into an ordered list of
 * time slots for today. Slots are then grouped into configurable queue blocks.
 *
 * Terminology
 * ─────────────
 * slot        – a single appointment window (e.g. 09:00–09:15)
 * queue block – a contiguous time window containing consecutive slots
 *               (e.g. 09:00–11:00 when queueBlockMinutes=120)
 */

import type { DailySchedule } from '../components/Schedule/ScheduleDayEditor';

export interface GeneratedSlot {
  /** Unique key, e.g. "09:00" */
  id: string;
  /** Display label, e.g. "09:00 AM" */
  label: string;
  /** Minutes since midnight */
  startMinutes: number;
  endMinutes: number;
  /** Index within the full day's slot list (0-based) */
  index: number;
}

export interface QueueBlock {
  id: string;
  /** e.g. "Queue Block 1" */
  title: string;
  /** e.g. "09:00 AM – 11:00 AM" */
  label: string;
  /** Start of the window in minutes since midnight */
  windowStart: number;
  /** Duration of this block in minutes */
  windowMinutes: number;
  slots: GeneratedSlot[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeStringToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

function minutesToLabel(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(normalized / 60);
  const m   = normalized % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12   = h24 % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Expand a start→end range into individual slots of `slotMinutes` length */
function expandRange(start: number, end: number, slotMinutes: number): number[] {
  if (end <= start || slotMinutes <= 0) return [];
  const starts: number[] = [];
  for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
    starts.push(t);
  }
  return starts;
}

// ─── Today's day-of-week ────────────────────────────────────────────────────

export function getTodayDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

// ─── Main export ────────────────────────────────────────────────────────────

/**
 * Generate all appointment slots for today given the doctor's schedule and
 * the chosen slot duration, grouped into queue blocks of `queueBlockMinutes`.
 *
 * @param scheduleDays      - the doctor's weekly schedule
 * @param slotMinutes       - minutes per appointment (e.g. 15)
 * @param queueBlockMinutes - minutes per queue block window (e.g. 120); defaults to 120
 */
export function generateTodaySlots(
  scheduleDays: DailySchedule[],
  slotMinutes: number,
  queueBlockMinutes = 120
): { slots: GeneratedSlot[]; blocks: QueueBlock[] } {
  const todayName = getTodayDayName();
  const today = scheduleDays.find((d) => d.day === todayName);

  if (!today || !today.open) return { slots: [], blocks: [] };

  // Build raw minute-start list from morning + evening sessions
  const rawStarts: number[] = [
    ...expandRange(
      timeStringToMinutes(today.morningStart),
      timeStringToMinutes(today.morningEnd),
      slotMinutes
    ),
    ...expandRange(
      timeStringToMinutes(today.eveningStart),
      timeStringToMinutes(today.eveningEnd),
      slotMinutes
    ),
  ].sort((a, b) => a - b);

  // Deduplicate (morning end == evening start edge case)
  const unique = [...new Set(rawStarts)];

  const slots: GeneratedSlot[] = unique.map((start, i) => ({
    id: `slot-${start}`,
    label: minutesToLabel(start),
    startMinutes: start,
    endMinutes: start + slotMinutes,
    index: i,
  }));

  // ── Group into queue blocks ──────────────────────────────────────────────
  // Each block's windowStart is snapped relative to the first slot of the day,
  // so blocks always start at the first appointment rather than at midnight.
  const blockMap = new Map<number, GeneratedSlot[]>();

  if (slots.length > 0) {
    const dayStart = slots[0].startMinutes;
    for (const slot of slots) {
      const offset = slot.startMinutes - dayStart;
      const blockIdx = Math.floor(offset / queueBlockMinutes);
      const blockStart = dayStart + blockIdx * queueBlockMinutes;
      if (!blockMap.has(blockStart)) blockMap.set(blockStart, []);
      blockMap.get(blockStart)!.push(slot);
    }
  }

  const blocks: QueueBlock[] = Array.from(blockMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([windowStart, blockSlots], i) => ({
      id: `block-${windowStart}`,
      title: `Queue Block ${i + 1}`,
      label: `${minutesToLabel(windowStart)} – ${minutesToLabel(windowStart + queueBlockMinutes)}`,
      windowStart,
      windowMinutes: queueBlockMinutes,
      slots: blockSlots,
    }));

  return { slots, blocks };
}
