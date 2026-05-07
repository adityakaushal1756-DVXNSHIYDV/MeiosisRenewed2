import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { LogOut, CheckCircle2, AlertCircle, Smartphone, IdCard, Phone, Droplet, Upload, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const getBackendUrl = () => {
  // 1. Check for explicit environment variable (best for separate hosting)
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  const { hostname, protocol, origin } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // 2. Local Dev: Backend is usually on 5002
  if (isLocal) return `${protocol}//${hostname}:5002/api`;

  // 3. Unified Vercel: Backend is at /api on the same domain
  // We assume the companion app is at /companion-app/, so we go to root /api
  return `${origin}/api`;
};

const API_URL = getBackendUrl();

const getAuthHeader = () => {
  try {
    const session = localStorage.getItem('companion_auth');
    if (!session) return {};
    const { token } = JSON.parse(session);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

/**
 * Extracts the best patient identifier from a QR code string.
 * Handles 4 formats:
 *   1. MEIOSIS gateway URL  → ?data=base64({p_id:"..."})
 *   2. Raw gateway URL      → parses any query param named p_id or patientId
 *   3. Plain meiosisId       → e.g. "99999998"
 *   4. Raw DB uuid / universalCode → pass-through
 */
function extractPatientIdFromQr(raw: string): string {
  const trimmed = raw.trim();

  // Try to parse as URL
  try {
    const url = new URL(trimmed);

    // Format 1: ?data=base64(JSON)
    const dataParam = url.searchParams.get('data');
    if (dataParam) {
      try {
        // base64url or standard base64
        const decoded = JSON.parse(atob(dataParam.replace(/-/g, '+').replace(/_/g, '/')));
        if (decoded?.p_id) return String(decoded.p_id);
      } catch { /* not valid base64-JSON, fall through */ }
    }

    // Format 2: explicit query params
    const pId = url.searchParams.get('p_id') || url.searchParams.get('patientId');
    if (pId) return pId;
  } catch { /* not a URL, treat as raw identifier */ }

  // Formats 3 & 4: raw string
  return trimmed;
}

const saveSession = (data: any) => {
  localStorage.setItem('companion_auth', JSON.stringify(data));
};

const clearSession = () => {
  localStorage.removeItem('companion_auth');
};

// --- Types ---
interface PatientData {
  id: string;
  meiosisId: string;
  name: string;
  phone: string;
  bloodGroup: string;
  universalCode: string;
}

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
      if (res.data.user.role !== 'DOCTOR') {
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
          <p className="mt-2 text-slate-400">Scan patient QR codes to identify patients</p>
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
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'loading' | 'success' | 'error'>('scanning');
  const [errorMsg, setErrorMsg] = useState('');
  const [doctorStatus, setDoctorStatus] = useState<'active_doc' | 'inactive_doc' | 'unknown'>('unknown');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initScanner();
    
    // Initial status check
    checkDoctorStatus();
    
    // Poll for status every 30 seconds
    const interval = setInterval(checkDoctorStatus, 30000);
    
    return () => {
      clearInterval(interval);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const checkDoctorStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/gateway/doctor-status`, {
        headers: getAuthHeader()
      });
      setDoctorStatus(res.data.status);
    } catch (err) {
      console.error('[StatusCheck] Failed:', err);
    }
  };

  const initScanner = () => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    scannerRef.current = scanner;
    scanner.render(onScanSuccess, () => {});
  };

  const onScanSuccess = async (decodedText: string) => {
    // Prevent double-firing while already processing
    if (status === 'loading' || status === 'success') return;
    setStatus('loading');

    // ── Step 1: Robustly extract a patient identifier from the QR ──
    const rawId = extractPatientIdFromQr(decodedText);
    console.log('[Scan] QR decoded →', rawId);

    try {
      // ── Step 2: Resolve the patient via the lightweight endpoint ──
      // /gateway/resolve-patient accepts DB id, meiosisId, or universalCode
      const resolveRes = await axios.get(
        `${API_URL}/gateway/resolve-patient?id=${encodeURIComponent(rawId)}`,
        { headers: getAuthHeader() }
      );
      const patientData = resolveRes.data as PatientData;
      setPatient(patientData);
      setStatus('success');

      // ── Step 3: Push OPEN_PATIENT command to the dashboard ──
      // Always use the canonical DB id so the dashboard can match it reliably
      try {
        const remoteRes = await axios.post(
          `${API_URL}/gateway/remote-scan`,
          { patientId: patientData.id, doctorId: doctor.doctorId },
          { headers: getAuthHeader() }
        );
        setDoctorStatus(remoteRes.data.doctorStatus);
        console.log('[Scan] Remote command sent. Dashboard status:', remoteRes.data.doctorStatus);
      } catch (remoteErr: any) {
        // Don't fail the scan if the push fails — patient was still identified
        console.warn('[RemoteSync] Push failed (non-fatal):', remoteErr.message);
      }

      // ── Step 4: Auto-reset after 6 s so the scanner is ready again ──
      setTimeout(() => {
        setPatient(null);
        setStatus('scanning');
        setDoctorStatus('unknown');
      }, 6000);
    } catch (err: any) {
      const msg = err.response?.data?.error === 'patient_not_found'
        ? 'Patient not found in MEIOSIS'
        : err.response?.data?.error || 'Scan failed — please try again';
      console.error('[Scan] Error:', msg, err);
      setErrorMsg(msg);
      setStatus('error');
      setTimeout(() => setStatus('scanning'), 3500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    const html5QrCode = new Html5Qrcode("reader-hidden");
    
    try {
      // Pass 'false' to prevent rendering to the hidden DOM element (which causes 0x0 canvas errors)
      const decodedText = await html5QrCode.scanFile(file, false);
      await onScanSuccess(decodedText);
    } catch (err) {
      setErrorMsg('No QR code found. Please upload a clear image of the QR.');
      setStatus('error');
      setTimeout(() => setStatus('scanning'), 3500);
    } finally {
      try {
        await html5QrCode.clear();
      } catch (e) { /* ignore clear errors */ }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#060b13] text-white font-['Outfit']">
      {/* Hidden element for file scanning */}
      <div id="reader-hidden" className="hidden"></div>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#52ff9d] text-slate-950 font-bold">M</div>
            {doctorStatus !== 'unknown' && (
              <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#060b13] ${
                doctorStatus === 'active_doc' ? 'bg-[#52ff9d] shadow-[0_0_8px_#52ff9d]' : 'bg-red-500'
              }`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold">Dr. {doctor.name.split(' ')[doctor.name.split(' ').length - 1]}</h1>
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                doctorStatus === 'active_doc' ? 'bg-[#52ff9d]/10 text-[#52ff9d]' : 'bg-red-500/10 text-red-400'
              }`}>
                {doctorStatus === 'active_doc' ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Companion Terminal</span>
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
      <main className="flex flex-1 flex-col items-center justify-center p-6 pb-24">
        <div className="relative w-full max-w-[320px]">
          {/* Scanner View */}
          <div 
            id="reader" 
            className="overflow-hidden rounded-3xl border-2 border-white/10 bg-black/40 shadow-2xl"
            style={{ minHeight: '320px' }}
          ></div>

          {/* Overlays */}
          <AnimatePresence>
            {status === 'loading' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-black/80 backdrop-blur-sm"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#52ff9d] border-t-transparent"></div>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#52ff9d]">Identifying...</p>
              </motion.div>
            )}

            {status === 'success' && patient && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-3xl bg-[#52ff9d] p-6 text-slate-950"
              >
                <div className="mb-4 rounded-full bg-slate-950/10 p-3">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black">{patient.name}</h3>
                
                {doctorStatus !== 'unknown' && (
                  <div className={`mt-2 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                    doctorStatus === 'active_doc' 
                      ? 'bg-slate-950/20 text-slate-950' 
                      : 'bg-red-500/20 text-red-700'
                  }`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      doctorStatus === 'active_doc' ? 'bg-slate-950' : 'bg-red-700'
                    }`} />
                    {doctorStatus === 'active_doc' ? 'Dashboard Active' : 'Dashboard Inactive'}
                  </div>
                )}
                
                <div className="mt-6 w-full space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-950/5 p-3">
                    <IdCard size={18} className="opacity-60" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase opacity-60">Meiosis ID</p>
                      <p className="text-sm font-black">{patient.meiosisId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-slate-950/5 p-3">
                    <Droplet size={18} className="opacity-60" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase opacity-60">Blood Group</p>
                      <p className="text-sm font-black">{patient.bloodGroup}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-slate-950/5 p-3">
                    <Phone size={18} className="opacity-60" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase opacity-60">Contact</p>
                      <p className="text-sm font-black">{patient.phone}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-3xl bg-red-500 p-6 text-center text-white"
              >
                <AlertCircle size={64} className="mb-4" />
                <h3 className="text-xl font-bold">Error</h3>
                <p className="mt-2 text-sm font-medium opacity-80">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-8 flex w-full max-w-[320px] gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold transition-all active:scale-95 active:bg-white/10"
          >
            <Upload size={18} className="text-[#52ff9d]" />
            Upload Image
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload}
          />
        </div>

        <div className="mt-8 text-center opacity-40">
          <Smartphone size={24} className="mx-auto mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-widest">
            Scan QR from camera or gallery
          </p>
        </div>
      </main>

      {/* Navigation / Mode */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
           <Camera size={14} />
           Live Scanning Mode
        </div>
      </div>
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
        const { user } = JSON.parse(session);
        setDoctor(user);
      } catch (e) {
        localStorage.removeItem('companion_auth');
      }
    }
    setInitializing(false);
  }, []);

  const handleLogin = (data: any) => {
    saveSession(data);
    setDoctor(data.user);
  };

  const handleLogout = () => {
    clearSession();
    setDoctor(null);
  };

  if (initializing) return null;

  return (
    <div className="bg-[#060b13] min-h-screen selection:bg-[#52ff9d] selection:text-slate-950">
      {doctor ? (
        <Scanner doctor={doctor} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}
