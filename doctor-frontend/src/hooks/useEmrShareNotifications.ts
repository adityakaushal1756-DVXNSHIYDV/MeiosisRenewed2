import { useCallback, useEffect, useState } from 'react';
import { CURRENT_DOCTOR } from '../config/doctorProfile';
import { API_BASE_URL, getAuthHeader } from '../lib/api';

export interface EmrShareRequest {
  id: string;
  patientId: string;
  transactionId: string;
  recordCount: number;
  scope: string;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    meiosisId: string;
    universalCode: string;
    phone: string;
  };
}

export function useEmrShareNotifications() {
  const [pending, setPending] = useState<EmrShareRequest[]>([]);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/emr-shares/pending?doctorId=${encodeURIComponent(CURRENT_DOCTOR.id)}`,
        { headers: { ...getAuthHeader() } }
      );
      if (!res.ok) return;
      const data: EmrShareRequest[] = await res.json();
      setPending(data);
    } catch {
      // Backend offline — leave as-is
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 15_000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  const respond = useCallback(async (shareId: string, accepted: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/emr-shares/${shareId}/respond`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ accepted })
      });
      if (!res.ok) throw new Error('respond_failed');
      // Remove from pending list immediately
      setPending(prev => prev.filter(s => s.id !== shareId));
      return await res.json();
    } catch {
      // silently ignore
      return null;
    }
  }, []);

  return { pending, respond, refresh: fetchPending };
}
