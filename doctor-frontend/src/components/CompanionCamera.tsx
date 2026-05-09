import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { Camera, CameraOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanionCameraProps {
  onPatientResolved: (patientId: string) => void;
  active?: boolean;
}

/**
 * Robustly extracts a patient identifier from various QR formats.
 */
function extractPatientIdFromQr(raw: string): string {
  const trimmed = raw.trim();
  
  // Format 0: New Meiosis Secure Token (MEIOSIS:v1:data:sig)
  if (trimmed.startsWith('MEIOSIS:v1:')) return trimmed;

  try {
    const url = new URL(trimmed);
    const dataParam = url.searchParams.get('data');
    if (dataParam) {
      try {
        const decoded = JSON.parse(atob(dataParam.replace(/-/g, '+').replace(/_/g, '/')));
        if (decoded?.p_id) return String(decoded.p_id);
      } catch { /* ignore */ }
    }
    const pId = url.searchParams.get('p_id') || url.searchParams.get('patientId');
    if (pId) return pId;
  } catch { /* ignore */ }

  return trimmed;
}

export const CompanionCamera: React.FC<CompanionCameraProps> = ({ onPatientResolved, active = true }) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [patientName, setPatientName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [active]);

  const startScanner = async () => {
    if (html5QrCodeRef.current) return;
    
    try {
      const html5QrCode = new Html5Qrcode("companion-scanner-region");
      html5QrCodeRef.current = html5QrCode;
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      setStatus('scanning');
      await html5QrCode.start(
        { facingMode: "user" }, 
        config,
        onScanSuccess,
        () => {} // silent on failure
      );
    } catch (err) {
      console.error("[CompanionCamera] Failed to start scanner:", err);
      setStatus('error');
      setErrorMsg("Camera access denied or unavailable.");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (e) {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setStatus('idle');
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setStatus('processing');
    const rawId = extractPatientIdFromQr(decodedText);
    
    try {
      // Resolve patient and log access
      const res = await axios.get(`/api/gateway/resolve-patient?id=${encodeURIComponent(rawId)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const patient = res.data;
      setPatientName(patient.name);
      setStatus('success');
      
      // Auto-navigate in the main UI
      onPatientResolved(patient.id);

      // Reset after a delay
      setTimeout(() => {
        isProcessingRef.current = false;
        setStatus('scanning');
        setPatientName('');
      }, 4000);
      
    } catch (err: any) {
      console.error("[CompanionCamera] Resolve failed:", err);
      setErrorMsg(err.response?.data?.error || "Patient not found.");
      setStatus('error');
      setTimeout(() => {
        isProcessingRef.current = false;
        setStatus('scanning');
      }, 3000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative group ${showPreview ? 'w-64' : 'w-12 h-12'} transition-all duration-500`}
          >
            {/* Background Scanner Region (Must be in DOM but can be hidden) */}
            <div 
              id="companion-scanner-region" 
              className={`rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl transition-all duration-500 ${
                showPreview ? 'h-64 opacity-100' : 'h-0 opacity-0'
              }`}
            />

            {/* Float Button / Status Indicator */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`absolute bottom-0 right-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                status === 'success' ? 'bg-emerald-500 text-white' :
                status === 'error' ? 'bg-red-500 text-white' :
                status === 'processing' ? 'bg-sky-500 text-white' :
                'bg-slate-900 border border-white/10 text-[#52ff9d]'
              }`}
            >
              {status === 'success' ? <CheckCircle2 size={20} /> :
               status === 'error' ? <AlertCircle size={20} /> :
               status === 'processing' ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Camera size={20} /></motion.div> :
               <Camera size={20} />}
            </button>

            {/* Notification Toast */}
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute right-16 bottom-1 bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap shadow-xl"
              >
                Welcome, {patientName.split(' ')[0]}
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute right-16 bottom-1 bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap shadow-xl"
              >
                {errorMsg}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
