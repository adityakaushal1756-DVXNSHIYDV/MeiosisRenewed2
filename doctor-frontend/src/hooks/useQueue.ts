import { useCallback, useEffect, useMemo, useState } from 'react';
import { CURRENT_DOCTOR } from '../config/doctorProfile';
import { API_BASE_URL } from '../lib/api';
import { Appointment, QueueStatus } from '../types/Appointment';
import { Patient } from '../types/Patient';
import { saveToCache, loadFromCache } from '../utils/persistentCache';

function resequenceQueue(queue: Appointment[]) {
  return queue.map((item, index) => ({ ...item, queueNumber: index + 1 }));
}

function withStatus(item: Appointment, status: QueueStatus): Appointment {
  return { ...item, status };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendToQueue(apiAppointments: any[]): { queue: Appointment[]; patients: Patient[] } {
  const queue: Appointment[] = [];
  const patients: Patient[] = [];
  const seenPatientIds = new Set<string>();

  if (!Array.isArray(apiAppointments)) {
    console.error("[Meiosis] apiAppointments is not an array:", apiAppointments);
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
          appointmentTime: scheduledAt.toLocaleTimeString('en-IN', {
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
        console.warn("[Meiosis] Failed to map single queue item:", innerErr, apt);
      }
    });
  } catch (err) {
    console.error("[Meiosis] Failed to sort queue:", err);
  }

  return { queue, patients };
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function useQueue() {
  const [queue, setQueue] = useState<Appointment[]>(() => loadFromCache<Appointment[]>('queue') || []);
  const [backendPatients, setBackendPatients] = useState<Patient[]>(() => loadFromCache<Patient[]>('backendPatients') || []);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchQueue = useCallback(async () => {
    const date = todayDateString();
    setIsSyncing(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/appointments?doctorId=${encodeURIComponent(CURRENT_DOCTOR.id)}&date=${date}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const { queue: mapped, patients } = mapBackendToQueue(data);
      setQueue(mapped);
      setBackendPatients(patients);
      
      // Update cache
      saveToCache('queue', mapped);
      saveToCache('backendPatients', patients);
    } catch (err) {
      console.error("[Meiosis] Failed to fetch queue:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();

    // Poll every 30s; also detect day rollover and reset queue
    let lastDay = todayDateString();
    const interval = setInterval(() => {
      const today = todayDateString();
      if (today !== lastDay) {
        // New day — clear stale queue then fetch fresh
        lastDay = today;
        setQueue([]);
        setBackendPatients([]);
        setActiveAppointmentId(null);
      }
      fetchQueue();
    }, 30_000);

    return () => clearInterval(interval);
  }, [fetchQueue]);

  const activeAppointment = useMemo(
    () => queue.find((item) => item.id === activeAppointmentId) ?? null,
    [queue, activeAppointmentId]
  );

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

    // Persist to backend
    fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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

  const addWalkInPatient = (patientId: string) => {
    setQueue((current) =>
      resequenceQueue([
        ...current,
        {
          id: `walkin-${Date.now()}`,
          patientId,
          queueNumber: current.length + 1,
          appointmentTime: 'Walk-in',
          arrivalStatus: 'CHECKED_IN',
          status: 'WAITING',
          visitReason: 'Walk-in consultation',
          mode: 'In-person'
        }
      ])
    );
  };

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
    refreshQueue: fetchQueue
  };
}
