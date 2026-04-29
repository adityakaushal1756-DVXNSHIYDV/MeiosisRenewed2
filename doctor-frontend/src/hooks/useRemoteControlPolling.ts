import { useEffect, useRef } from 'react';
import axios from 'axios';

interface RemoteControlProps {
  doctorId: string | null;
  onRemoteHighlight: (patientId: string) => void;
}

const API_URL = 'http://' + window.location.hostname + ':5002/api';

export function useRemoteControlPolling({ doctorId, onRemoteHighlight }: RemoteControlProps) {
  const pollIntervalRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!doctorId) return;

    const getAuthHeader = () => {
      const token = localStorage.getItem('token');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    // 1. Start Heartbeat
    const sendHeartbeat = async () => {
      try {
        await axios.post(`${API_URL}/gateway/heartbeat`, {}, { headers: getAuthHeader() });
      } catch (err) {
        console.error('[RemoteControl] Heartbeat failed', err);
      }
    };

    sendHeartbeat();
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 60000); // Every minute

    // 2. Start Polling for Commands
    const pollCommands = async () => {
      try {
        const res = await axios.get(`${API_URL}/gateway/remote-commands`, { headers: getAuthHeader() });
        if (res.data.command === 'OPEN_PATIENT' && res.data.payload?.patientId) {
          onRemoteHighlight(res.data.payload.patientId);
        }
      } catch (err) {
        console.error('[RemoteControl] Polling failed', err);
      }
    };

    pollIntervalRef.current = setInterval(pollCommands, 3000); // Every 3 seconds

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [doctorId, onRemoteHighlight]);
}
