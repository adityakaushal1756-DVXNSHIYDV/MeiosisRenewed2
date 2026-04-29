import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface RemoteControlProps {
  doctorId: string | null;
  onRemoteHighlight: (patientId: string) => void;
}

export const useRemoteControl = ({ doctorId, onRemoteHighlight }: RemoteControlProps) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!doctorId) return;

    // Use the backend URL from env or fallback
    const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
    
    console.log(`[RemoteControl] Connecting to socket at ${socketUrl}`);
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[RemoteControl] Socket connected:', socket.id);
      socket.emit('join_doctor_room', doctorId);
    });

    socket.on('REMOTE_HIGHLIGHT', (data: { patientId: string }) => {
      console.log('[RemoteControl] Received remote highlight:', data);
      onRemoteHighlight(data.patientId);
    });

    socket.on('disconnect', () => {
      console.log('[RemoteControl] Socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [doctorId, onRemoteHighlight]);

  return socketRef.current;
};
