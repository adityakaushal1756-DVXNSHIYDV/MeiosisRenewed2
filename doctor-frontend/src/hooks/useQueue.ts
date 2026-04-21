import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CURRENT_DOCTOR } from '../config/doctorProfile';
import { API_BASE_URL, getAuthHeader } from '../lib/api';
import { Appointment, QueueStatus } from '../types/Appointment';
import { Patient } from '../types/Patient';
import { saveToCache, loadFromCache } from '../utils/persistentCache';

// ─── Local storage key for live queue state ───────────────────────────────────
const QUEUE_LIVE_STATE_KEY = 'meiosis_queue_live_state_v2';
const QUEUE_SESSION_KEY = 'meiosis_queue_session_v1';

function resequenceQueue(queue: Appointment[]) {
  return queue.map((item, index) => ({ ...item, queueNumber: index + 1 }));
}

function withStatus(item: Appointment, status: QueueStatus): Appointment {
  return { ...item, status };
}

// ─── Persist live queue state to localStorage ─────────────────────────────────
function saveLiveState(queue: Appointment[]) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(QUEUE_LIVE_STATE_KEY, JSON.stringify({ date: today, queue }));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

// ─── Load live queue state from localStorage ──────────────────────────────────
function loadLiveState(): Appointment[] | null {
  try {
    const raw = localStorage.getItem(QUEUE_LIVE_STATE_KEY);
    if (!raw) return null;
    const { date, queue } = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (date !== today) return null; // Stale — different day
    return Array.isArray(queue) ? queue : null;
  } catch {
    return null;
  }
}

// ─── Map backend appointment response to frontend Appointment shape ────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendToQueue(apiAppointments: any[]): { queue: Appointment[]; patients: Patient[] } {
  const queue: Appointment[] = [];
  const patients: Patient[] = [];
  const seenPatientIds = new Set<string>();

  if (!Array.isArray(apiAppointments)) {
    console.error('[Meiosis] apiAppointments is not an array:', apiAppointments);
    return { queue, patients };
  }

  try {
    const sorted = [...apiAppointments].sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    sorted.forEach((apt, index) => {
      if (!apt || apt.status === 'CANCELLED' || apt.queueEntry?.status === 'CANCELLED') return;

      const queueStatus: QueueStatus =
        apt.status === 'COMPLETED' || apt.queueEntry?.status === 'COMPLETED'
          ? 'COMPLETED'
          : 'WAITING';

      try {
        const scheduledAt = new Date(apt.scheduledDate);
        if (Number.isNaN(scheduledAt.getTime())) return;

        queue.push({
          id: apt.id,
          patientId: apt.patientId,
          queueNumber: apt.queueEntry?.queueNo ?? index + 1,
          appointmentTime:
            apt.title === 'Walk-in Consultation'
              ? 'Walk-in'
              : scheduledAt.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }),
          arrivalStatus: 'NOT_ARRIVED',
          status: queueStatus,
          visitReason: apt.purpose || apt.title || 'Consultation',
          mode: apt.mode === 'TELECONSULT' ? 'Teleconsult' : 'In-person'
        });

        if (apt.patient && !seenPatientIds.has(apt.patientId)) {
          seenPatientIds.add(apt.patientId);
          const p = apt.patient;
          patients.push({
            id: p.id,
            meiosisCode: p.universalCode || p.meiosisId || p.id,
            name: p.name || 'Unknown',
            phone: p.phone || '',
            email: p.email || '',
            age: p.age || 0,
            gender: (p.gender || 'Other') as 'Male' | 'Female' | 'Other',
            visitReason: apt.purpose || 'Consultation',
            lastVisitDate: new Date(apt.scheduledDate).toISOString().slice(0, 10),
            allergies: Array.isArray(p.allergies) ? p.allergies : [],
            chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions : [],
            vitals: p.vitals || { bloodPressure: '', pulse: '', temperature: '', spo2: '', height: '', weight: '' },
            history: Array.isArray(p.history) ? p.history : [],
            pastAppointments: Array.isArray(p.pastAppointments) ? p.pastAppointments : [],
            prescriptions: Array.isArray(p.prescriptions) ? p.prescriptions : [],
            medicalReports: Array.isArray(p.medicalReports) ? p.medicalReports : []
          });
        }
      } catch (innerErr) {
        console.warn('[Meiosis] Failed to map single queue item:', innerErr, apt);
      }
    });
  } catch (err) {
    console.error('[Meiosis] Failed to sort queue:', err);
  }

  return { queue, patients };
}

/**
 * Merge DB queue into local live state.
 * - DB wins for COMPLETED and items not in local state.
 * - Local wins for IN_SESSION, PAUSED — doctor is mid-consultation.
 * - New items from DB are appended.
 */
function mergeQueues(localQueue: Appointment[], dbQueue: Appointment[]): Appointment[] {
  const localMap = new Map(localQueue.map(item => [item.id, item]));

  const merged: Appointment[] = dbQueue.map(dbItem => {
    const local = localMap.get(dbItem.id);
    if (!local) return dbItem; // New from DB

    // DB always wins for COMPLETED (canonical state)
    if (dbItem.status === 'COMPLETED') return { ...local, status: 'COMPLETED' };

    // Local wins for in-progress states (mid-consultation)
    const inProgressLocal = local.status === 'IN_SESSION' || local.status === 'PAUSED';
    if (inProgressLocal) return local;

    return dbItem;
  });

  // Append local-only items (walk-ins that are now real DB records will be in DB, so only truly local ones remain — skip)
  return merged;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function useQueue() {
  // Initialise from localStorage snapshot for instant display on refresh
  const [queue, setQueueRaw] = useState<Appointment[]>(() => loadLiveState() || loadFromCache<Appointment[]>('queue') || []);
  const [backendPatients, setBackendPatients] = useState<Patient[]>(() => loadFromCache<Patient[]>('backendPatients') || []);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(QUEUE_SESSION_KEY);
      if (!raw) return null;
      const { date, code } = JSON.parse(raw);
      return date === todayDateString() ? code : null;
    } catch { return null; }
  });

  // Dirty tracking — IDs of appointments whose status changed locally since last DB sync
  const dirtyIds = useRef<Set<string>>(new Set());
  const queueRef = useRef<Appointment[]>(queue);

  // Wrapper so every state write also persists to localStorage and tracks dirty
  const setQueue = useCallback((updater: Appointment[] | ((prev: Appointment[]) => Appointment[])) => {
    setQueueRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveLiveState(next);
      saveToCache('queue', next);
      queueRef.current = next;

      // Mark changed items dirty
      const prevMap = new Map(prev.map(i => [i.id, i]));
      next.forEach(item => {
        const old = prevMap.get(item.id);
        if (old && old.status !== item.status) {
          dirtyIds.current.add(item.id);
        }
      });

      return next;
    });
  }, []);

  // ─── QueueSession bootstrap ──────────────────────────────────────────────────
  const fetchOrCreateSession = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/queue/session?doctorId=${encodeURIComponent(CURRENT_DOCTOR.id)}&date=${todayDateString()}`,
        { headers: getAuthHeader() }
      );
      if (!res.ok) return;
      const session = await res.json();
      setSessionCode(session.sessionCode);
      localStorage.setItem(QUEUE_SESSION_KEY, JSON.stringify({ date: todayDateString(), code: session.sessionCode }));
    } catch (err) {
      console.warn('[Meiosis] Could not fetch/create queue session:', err);
    }
  }, []);

  // ─── Fetch queue from DB ─────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    const date = todayDateString();
    setIsSyncing(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/appointments?doctorId=${encodeURIComponent(CURRENT_DOCTOR.id)}&date=${date}`,
        { headers: { ...getAuthHeader() } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const { queue: dbQueue, patients } = mapBackendToQueue(data);

      setQueue(prev => mergeQueues(prev, dbQueue));
      setBackendPatients(patients);
      saveToCache('backendPatients', patients);
    } catch (err) {
      console.error('[Meiosis] Failed to fetch queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [setQueue]);

  // ─── Dirty batch sync — push only changed items to DB ───────────────────────
  const flushDirtyToDb = useCallback(async (queueSnapshot?: Appointment[]) => {
    const ids = Array.from(dirtyIds.current);
    if (ids.length === 0) return;

    const current = queueSnapshot || queueRef.current;
    const sessionCodeNow = sessionCode;

    const updates = ids
      .map(id => {
        const item = current.find(i => i.id === id);
        if (!item) return null;
        return { appointmentId: id, status: item.status, sessionCode: sessionCodeNow };
      })
      .filter(Boolean);

    if (!updates.length) return;

    try {
      const res = await fetch(`${API_BASE_URL}/queue/batch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ updates })
      });
      if (res.ok) {
        dirtyIds.current.clear();
      }
    } catch (err) {
      console.warn('[Meiosis] Background sync failed — will retry:', err);
    }
  }, [sessionCode]);

  // ─── useEffect: initial load + polling ──────────────────────────────────────
  useEffect(() => {
    fetchOrCreateSession();
    fetchQueue();

    let lastDay = todayDateString();

    // 30s poll for queue updates from DB
    const fetchInterval = setInterval(() => {
      const today = todayDateString();
      if (today !== lastDay) {
        lastDay = today;
        setQueueRaw([]);
        setBackendPatients([]);
        setActiveAppointmentId(null);
        dirtyIds.current.clear();
        saveLiveState([]);
        fetchOrCreateSession();
      }
      fetchQueue();
    }, 30_000);

    // 15-minute dirty sync interval
    const syncInterval = setInterval(() => {
      flushDirtyToDb();
    }, 15 * 60 * 1000);

    // Flush on tab close / navigation away (sendBeacon survives page unload)
    const handleBeforeUnload = () => {
      const ids = Array.from(dirtyIds.current);
      if (!ids.length) return;
      const current = queueRef.current;
      const updates = ids
        .map(id => {
          const item = current.find(i => i.id === id);
          if (!item) return null;
          return { appointmentId: id, status: item.status, sessionCode };
        })
        .filter(Boolean);
      if (!updates.length) return;
      const blob = new Blob([JSON.stringify({ updates })], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE_URL}/queue/batch`, blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(syncInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [fetchQueue, fetchOrCreateSession, flushDirtyToDb, sessionCode]);

  const activeAppointment = useMemo(
    () => queue.find((item) => item.id === activeAppointmentId) ?? null,
    [queue, activeAppointmentId]
  );

  // ─── Queue Actions ───────────────────────────────────────────────────────────

  const startAppointment = (appointmentId: string) => {
    setQueue((current) =>
      current.map((item) => {
        if (item.id === appointmentId) return withStatus(item, 'IN_SESSION');
        if (item.status === 'IN_SESSION' || item.status === 'PAUSED') return withStatus(item, 'WAITING');
        return item;
      })
    );
    setActiveAppointmentId(appointmentId);
  };

  const endAppointment = (appointmentId: string) => {
    let nextActiveId: string | null = null;
    setQueue((current) => {
      const updated = current.map((item) =>
        item.id === appointmentId ? withStatus(item, 'COMPLETED') : item
      );
      nextActiveId =
        updated.find((item) => item.status === 'WAITING' || item.status === 'LATE')?.id ?? null;
      return updated;
    });
    setActiveAppointmentId(nextActiveId);

    // Persist COMPLETED to backend immediately (canonical state change)
    fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    }).catch(() => { /* silently ignore */ });
  };

  const pauseAppointment = (appointmentId: string) => {
    setQueue((current) =>
      current.map((item) => (item.id === appointmentId ? withStatus(item, 'PAUSED') : item))
    );
  };

  const resumeAppointment = (appointmentId: string) => {
    setQueue((current) =>
      current.map((item) => (item.id === appointmentId ? withStatus(item, 'IN_SESSION') : item))
    );
    setActiveAppointmentId(appointmentId);
  };

  const skipPatient = (appointmentId: string) => {
    setQueue((current) => {
      const target = current.find((item) => item.id === appointmentId);
      if (!target) return current;
      const reordered = current
        .filter((item) => item.id !== appointmentId)
        .concat(withStatus(target, 'WAITING'));
      return resequenceQueue(reordered);
    });
    if (activeAppointmentId === appointmentId) setActiveAppointmentId(null);
  };

  const markNoShow = (appointmentId: string) => {
    setQueue((current) =>
      current.map((item) => (item.id === appointmentId ? withStatus(item, 'NO_SHOW') : item))
    );
    if (activeAppointmentId === appointmentId) setActiveAppointmentId(null);
  };

  /**
   * Add walk-in patient via Meiosis ID — creates a real DB appointment.
   * Returns null on success, error string on failure.
   */
  const addWalkInPatient = useCallback(async (meiosisId: string, visitReason?: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/queue/walkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          doctorId: CURRENT_DOCTOR.id,
          meiosisId: meiosisId.trim(),
          visitReason: visitReason || 'Walk-in consultation',
          sessionCode
        })
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Walk-in failed' }));
        return error || 'Failed to add walk-in patient';
      }

      const { appointment, patient } = await res.json();
      const scheduledAt = new Date(appointment.scheduledDate || Date.now());

      // Merge the new walk-in into local queue
      const newItem: Appointment = {
        id: appointment.id,
        patientId: appointment.patientId,
        queueNumber: 0, // Will be recalculated
        appointmentTime: 'Walk-in',
        arrivalStatus: 'CHECKED_IN',
        status: 'WAITING',
        visitReason: appointment.purpose || 'Walk-in consultation',
        mode: 'In-person'
      };

      setQueue(prev => resequenceQueue([...prev, newItem]));

      // Add patient to backendPatients if not already there
      if (patient) {
        setBackendPatients(prev => {
          if (prev.some(p => p.id === patient.id)) return prev;
          return [...prev, {
            id: patient.id,
            meiosisCode: patient.universalCode || patient.meiosisId || patient.id,
            name: patient.name || 'Unknown',
            phone: patient.phone || '',
            email: patient.email || '',
            age: patient.age || 0,
            gender: (patient.gender || 'Other') as 'Male' | 'Female' | 'Other',
            visitReason: appointment.purpose || 'Walk-in consultation',
            lastVisitDate: scheduledAt.toISOString().slice(0, 10),
            allergies: Array.isArray(patient.allergies) ? patient.allergies : [],
            chronicConditions: Array.isArray(patient.chronicConditions) ? patient.chronicConditions : [],
            vitals: patient.vitals || { bloodPressure: '', pulse: '', temperature: '', spo2: '', height: '', weight: '' },
            history: [],
            pastAppointments: [],
            prescriptions: [],
            medicalReports: []
          }];
        });
      }

      return null; // Success
    } catch (err) {
      console.error('[Meiosis] Walk-in failed:', err);
      return 'Network error — please try again';
    }
  }, [sessionCode, setQueue]);

  const syncQueueManual = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Push any local changes to DB first
      await flushDirtyToDb();
      // 2. Fetch latest state from DB
      await fetchQueue();
    } finally {
      setIsSyncing(false);
    }
  }, [flushDirtyToDb, fetchQueue]);

  return {
    queue,
    setQueue,
    backendPatients,
    activeAppointment,
    activeAppointmentId,
    setActiveAppointmentId,
    startAppointment,
    endAppointment,
    pauseAppointment,
    resumeAppointment,
    skipPatient,
    markNoShow,
    addWalkInPatient,
    isSyncing,
    sessionCode,
    refreshQueue: syncQueueManual,
    flushDirtyToDb
  };
}
