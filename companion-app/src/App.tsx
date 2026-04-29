import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { QrCode, LogOut, CheckCircle2, AlertCircle, Monitor, Smartphone, Hammer, Construction } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const API_BASE = 'http://' + window.location.hostname + ':5002';
const API_URL = `${API_BASE}/api`;

const getAuthHeader = () => {
  const session = localStorage.getItem('companion_auth');
  if (!session) return {};
  const { token } = JSON.parse(session);
  return { 'Authorization': `Bearer ${token}` };
};

const saveSession = (data: any) => {
  localStorage.setItem('companion_auth', JSON.stringify(data));
};

const clearSession = () => {
  localStorage.removeItem('companion_auth');
};

// --- Components ---

const Login: React.FC<{ onLogin: (data: any) => void }> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { identifier, password });
      if (res.data.account.role !== 'DOCTOR') {
        throw new Error('Only doctors can use the companion app.');
      }
      onLogin(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060b13] p-6 text-white font-['Outfit']">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#52ff9d] text-slate-950 text-3xl font-black">M</div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Companion App</h2>
          <p className="mt-2 text-slate-400">Scan QR codes to update your PC dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Doctor ID or Email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#52ff9d]/50 focus:ring-1 focus:ring-[#52ff9d]/50"
                placeholder="M-001 or doctor@meiosis.health"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#52ff9d]/50 focus:ring-1 focus:ring-[#52ff9d]/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-xl bg-[#52ff9d] py-3 text-sm font-bold text-slate-950 transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Scanner: React.FC<{ doctor: any; onLogout: () => void }> = ({ doctor, onLogout }) => {
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('scanning');
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Socket setup
    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_doctor_room', doctor.doctorId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Scanner setup
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText: string) {
      // Typically the QR contains a full URL: http://.../gateway?data=...&sig=...
      // Or just a patient ID for demo purposes.
      // We'll try to extract data/sig if it's a URL, otherwise treat as ID.
      let patientId = decodedText;
      try {
        const url = new URL(decodedText);
        const data = url.searchParams.get('data');
        if (data) {
          // If it's a complex signed URL, we let the backend handle the verification
          // But for this companion app, we want to extract the patient ID.
          // In a real app, the QR data would be decrypted.
          // For now, let's assume the QR decoded text *is* or contains the ID.
          // Let's check if decodedText is JSON.
          try {
            const parsed = JSON.parse(atob(data));
            patientId = parsed.p_id || patientId;
          } catch(e) {}
        }
      } catch(e) {}

      handleRemoteHighlight(patientId);
    }

    function onScanFailure(error: any) {
      // Too noisy to log failures
    }

    return () => {
      scanner.clear().catch(console.error);
      socket.disconnect();
    };
  }, []);

  const handleRemoteHighlight = async (patientId: string) => {
    setScannedId(patientId);
    setStatus('success');
    
    try {
      await axios.post(
        `${API_URL}/gateway/remote-scan`,
        { patientId, doctorId: doctor.doctorId },
        { headers: getAuthHeader() }
      );
      
      // Auto reset after 3 seconds
      setTimeout(() => {
        setStatus('scanning');
        setScannedId(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to emit remote highlight", err);
      setStatus('error');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#060b13] text-white font-['Outfit']">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#52ff9d] text-slate-950 font-bold">M</div>
          <div>
            <h1 className="text-sm font-bold">Dr. {doctor.name.split(' ')[doctor.name.split(' ').length - 1]}</h1>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${socketConnected ? 'bg-[#52ff9d] shadow-[0_0_8px_#52ff9d]' : 'bg-red-500'}`} />
              <span className="text-[10px] text-slate-400">{socketConnected ? 'Linked to PC' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="relative w-full max-w-[320px]">
          {/* Scanner UI */}
          <div 
            id="reader" 
            className="overflow-hidden rounded-3xl border-2 border-white/10 bg-black/40 shadow-2xl"
            style={{ minHeight: '320px' }}
          ></div>

          {/* Status Overlay */}
          <AnimatePresence>
            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-[#52ff9d]/90 p-6 text-center text-slate-950 backdrop-blur-sm"
              >
                <CheckCircle2 size={64} strokeWidth={2.5} className="mb-4" />
                <h3 className="text-xl font-bold">Patient Scanned!</h3>
                <p className="mt-1 text-sm font-medium opacity-80">PC dashboard is updating...</p>
                <div className="mt-4 rounded-full bg-slate-950/20 px-4 py-1 text-[10px] font-bold uppercase tracking-wider">
                  ID: {scannedId}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Card */}
        <div className="mt-12 w-full max-w-[320px] rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="mb-4 flex justify-center gap-4">
            <Smartphone className="text-[#52ff9d]" size={32} />
            <div className="h-8 w-px bg-white/10" />
            <Monitor className="text-slate-500" size={32} />
          </div>
          <h4 className="text-sm font-bold">How it works</h4>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Scanning a patient's QR code on your phone instantly triggers the "View Records" action on your desktop dashboard.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
          Meiosis Companion System v1.0
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  const [doctor, setDoctor] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('companion_auth');
    if (session) {
      try {
        const { account } = JSON.parse(session);
        setDoctor(account);
      } catch (e) {
        clearSession();
      }
    }
    setInitializing(false);
  }, []);

  const handleLogin = (data: any) => {
    saveSession(data);
    setDoctor(data.account);
  };

  const handleLogout = () => {
    clearSession();
    setDoctor(null);
  };

  if (initializing) return null;

  return (
    <div className="bg-[#060b13] min-h-screen">
      {doctor ? (
        <Scanner doctor={doctor} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}
