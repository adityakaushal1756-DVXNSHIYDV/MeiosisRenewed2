/**
 * useCalendarData
 *
 * Fetches appointment data for an array of YYYY-MM-DD date strings.
 * Results are cached in a module-level Map so navigating between months
 * does not re-fetch already-loaded dates.
 */

import { useEffect, useRef, useState } from 'react';
import { CURRENT_DOCTOR } from '../config/doctorProfile';
import { API_BASE_URL, getAuthHeader } from '../lib/api';
import { saveToCache, loadFromCache } from '../utils/persistentCache';

const API = API_BASE_URL;

// ─── Canonical calendar event ─────────────────────────────────────────────────
export interface CalendarEvent {
  id:           string;
  patientId:    string;
  patientName:  string;
  date:         string;   // YYYY-MM-DD
  timeLabel:    string;   // "09:30 AM"
  startMinutes: number;   // minutes since midnight (for grid positioning)
  visitReason:  string;
  mode:         'In-person' | 'Teleconsult';
  status:       string;
  queueNo?:     number;
}

// Module-level cache: date → events
const cache = new Map<string, CalendarEvent[]>(
  Object.entries(loadFromCache<Record<string, CalendarEvent[]>>('calendar_map') || {})
);

function persistCalendarCache() {
  const obj = Object.fromEntries(cache.entries());
  // Limit to last 50 entries to keep localStorage lean
  const keys = Object.keys(obj);
  if (keys.length > 50) {
    keys.slice(0, keys.length - 50).forEach(k => delete obj[k]);
  }
  saveToCache('calendar_map', obj);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRaw(raw: any[]): CalendarEvent[] {
  if (!Array.isArray(raw)) return [];

  const events: CalendarEvent[] = [];
  raw.forEach((a) => {
    if (a.status === 'CANCELLED' || a.queueEntry?.status === 'CANCELLED') return;
    if (!a.scheduledDate) return;

    try {
      const at = new Date(a.scheduledDate);
      if (Number.isNaN(at.getTime())) {
        console.warn(`[Meiosis] Skipping appointment ${a.id} due to invalid date:`, a.scheduledDate);
        return;
      }

      const h = at.getHours();
      const m = at.getMinutes();
      events.push({
        id: a.id,
        patientId: a.patientId,
        patientName: a.patient?.name ?? 'Patient',
        date: at.toISOString().slice(0, 10),
        timeLabel: at.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        startMinutes: h * 60 + m,
        visitReason: a.purpose ?? a.title ?? 'Consultation',
        mode: a.mode === 'TELECONSULT' ? 'Teleconsult' : 'In-person',
        status: a.queueEntry?.status ?? a.status ?? 'WAITING',
        queueNo: a.queueEntry?.queueNo,
      });
    } catch (err) {
      console.error(`[Meiosis] Failed to map appointment ${a.id}:`, err);
    }
  });

  return events;
}

async function fetchDate(date: string): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(
      `${API}/appointments?doctorId=${encodeURIComponent(CURRENT_DOCTOR.id)}&date=${date}`,
      { headers: getAuthHeader() }
    );
    if (!res.ok) return [];
    const raw = await res.json();
    const mapped = mapRaw(Array.isArray(raw) ? raw : []);
    cache.set(date, mapped);
    persistCalendarCache();
    return mapped;
  } catch (err) {
    console.error(`[Meiosis] Failed to fetch calendar for date ${date}:`, err);
    return [];
  }
}

export function useCalendarData(dates: string[]) {
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
  const [loading, setLoading] = useState(false);
  const keyRef = useRef('');

  const key = dates.join(',');

  useEffect(() => {
    if (key === keyRef.current) return;
    keyRef.current = key;

    if (!dates.length) return;

    const missing = dates.filter((d) => !cache.has(d));

    // Serve cache immediately for already-loaded dates
    if (!missing.length) {
      setEventsByDate(Object.fromEntries(dates.map((d) => [d, cache.get(d)!])));
      return;
    }

    setLoading(true);

    // Stagger fetches: batch of 7 at most to avoid flooding
    const BATCH = 7;
    const batches: string[][] = [];
    for (let i = 0; i < missing.length; i += BATCH) {
      batches.push(missing.slice(i, i + BATCH));
    }

    (async () => {
      for (const batch of batches) {
        const results = await Promise.all(batch.map(fetchDate));
        batch.forEach((d, i) => cache.set(d, results[i]));
      }
      setEventsByDate(Object.fromEntries(dates.map((d) => [d, cache.get(d) ?? []])));
      setLoading(false);
    })();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expose a way to invalidate today's cache (e.g. after booking)
  function invalidate(date: string) {
    cache.delete(date);
    persistCalendarCache();
  }

  return { eventsByDate, loading, invalidate };
}
