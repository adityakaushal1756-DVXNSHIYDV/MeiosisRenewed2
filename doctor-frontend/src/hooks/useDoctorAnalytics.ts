import { useCallback, useEffect, useState } from 'react';
import { CURRENT_DOCTOR } from '../config/doctorProfile';
import { API_BASE_URL, getAuthHeader } from '../lib/api';
import { saveToCache, loadFromCache } from '../utils/persistentCache';

export interface DoctorCompletedAppointment {
  id: string;
  patientId: string;
  scheduledDate: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCompletedAppointments(data: any[]): DoctorCompletedAppointment[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item) => item && item.id && item.patientId && item.scheduledDate)
    .map((item) => ({
      id: String(item.id),
      patientId: String(item.patientId),
      scheduledDate: String(item.scheduledDate)
    }));
}

export function useDoctorAnalytics() {
  const [completedAppointments, setCompletedAppointments] = useState<DoctorCompletedAppointment[]>(
    () => loadFromCache<DoctorCompletedAppointment[]>('completedAppointments') || []
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshCompletedAppointments = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/appointments?doctorId=${encodeURIComponent(CURRENT_DOCTOR.id)}&status=COMPLETED`,
        { headers: { ...getAuthHeader() } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const mapped = mapCompletedAppointments(data);
      setCompletedAppointments(mapped);
      saveToCache('completedAppointments', mapped);
    } catch {
      // backend offline — leave current analytics state as-is
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshCompletedAppointments();
    const interval = window.setInterval(refreshCompletedAppointments, 60_000);
    return () => window.clearInterval(interval);
  }, [refreshCompletedAppointments]);

  return {
    completedAppointments,
    refreshCompletedAppointments,
    isSyncing
  };
}
