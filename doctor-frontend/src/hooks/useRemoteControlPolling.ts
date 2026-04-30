import { useEffect, useRef } from 'react';
import axios from 'axios';

interface RemoteControlProps {
  doctorId: string | null;
  onRemoteHighlight: (patientId: string) => void;
}

const API_URL = 'http://' + window.location.hostname + ':5002/api';

function getAuthHeader(): Record<string, string> {
  try {
    const session = localStorage.getItem('meiosis_auth_session_v1');
    if (!session) return {};
    const { token } = JSON.parse(session);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function useRemoteControlPolling({ doctorId, onRemoteHighlight }: RemoteControlProps) {
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Stable ref so the poll callback always sees the latest handler
  // without needing to be in the deps array (avoids re-creating intervals).
  const onRemoteHighlightRef = useRef(onRemoteHighlight);
  onRemoteHighlightRef.current = onRemoteHighlight;

  useEffect(() => {
    if (!doctorId) return;

    // ─── 1. Heartbeat — tells the backend the dashboard is alive ───
    const sendHeartbeat = async () => {
      try {
        await axios.post(
          `${API_URL}/gateway/heartbeat`,
          {},
          { headers: getAuthHeader() }
        );
        console.log('[RemoteControl] Heartbeat sent ✓');
      } catch (err) {
        console.warn('[RemoteControl] Heartbeat failed', err);
      }
    };

    // Fire immediately on mount, then every 30 s (well within the 2-min active window)
    sendHeartbeat();
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30_000);

    // ─── 2. Poll for queued remote commands ──────────────────────
    const pollCommands = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/gateway/remote-commands`,
          { headers: getAuthHeader() }
        );
        if (res.data.command === 'OPEN_PATIENT' && res.data.payload?.patientId) {
          console.log('[RemoteControl] Command received → opening patient:', res.data.payload.patientId);
          onRemoteHighlightRef.current(res.data.payload.patientId);
        }
      } catch (err) {
        // Silently swallow; transient network errors shouldn't spam the console
      }
    };

    // Poll every 2 s for near-real-time response
    pollIntervalRef.current = setInterval(pollCommands, 2_000);

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  // doctorId is the only stable dependency — onRemoteHighlight is tracked via ref
  }, [doctorId]);
}
