import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Beaker,
  Clock,
  Copy,
  FileText,
  Files,
  RefreshCcw,
  Shield,
  UserCircle,
} from 'lucide-react';
import { apiUrl, getAuthHeader } from '../lib/api';
import type { PatientProfile } from '../types';

interface MyQrPageProps {
  data: PatientProfile;
  patientId: string;
}

interface SignedQrResponse {
  status: 'QR_READY';
  scope: string;
  ttlSeconds: number;
  expiresAt: number;
  gatewayUrl: string;
  data: string;
  sig: string;
  patient: {
    id: string;
    name: string;
    meiosisId?: string;
    universalCode?: string;
  };
}

const durationOptions = [
  { label: '15m', seconds: 15 * 60 },
  { label: '30m', seconds: 30 * 60 },
  { label: '1 hr', seconds: 60 * 60 },
  { label: '2 hrs', seconds: 2 * 60 * 60 },
  { label: '6 hrs', seconds: 6 * 60 * 60 },
];

function formatExpiry(expiresAt?: number) {
  if (!expiresAt) return '--';
  return new Date(expiresAt * 1000).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function compactUrl(url: string) {
  if (!url) return '--';
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}?data=...&sig=...`;
  } catch {
    return url;
  }
}

export function MyQrPage({ data }: MyQrPageProps) {
  const [duration, setDuration] = useState(2);
  const [refreshKey, setRefreshKey] = useState(0);
  const [qrResponse, setQrResponse] = useState<SignedQrResponse | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [activeOtp, setActiveOtp] = useState<{ otp: string; expiresAt: number } | null>(null);

  const selectedDuration = durationOptions[duration];
  const patientCode = data.universalCode || data.meiosisId || data.id;
  const isLive = !!qrResponse?.expiresAt && qrResponse.expiresAt * 1000 > now;

  const summary = useMemo(() => {
    const activePrescriptions = data.prescriptions.filter((item) => item.isActive ?? item.status === 'ACTIVE').length;
    return {
      prescriptions: data.prescriptions.length,
      activePrescriptions,
      labs: data.labReports.length,
      appointments: data.appointments.length,
    };
  }, [data]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    fetch(apiUrl(`/gateway/qr?ttlSeconds=${selectedDuration.seconds}`), {
      headers: getAuthHeader(),
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `QR generation failed with ${res.status}`);
        setQrResponse(body);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setQrResponse(null);
        setQrImage('');
        setError(err.message || 'Unable to generate a secure QR right now.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey, selectedDuration.seconds]);

  useEffect(() => {
    if (!qrResponse?.gatewayUrl) return;
    let cancelled = false;
    QRCode.toDataURL(qrResponse.gatewayUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 288,
      color: {
        dark: '#071225',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrImage(url);
      })
      .catch(() => {
        if (!cancelled) setError('Signed URL was created, but QR rendering failed.');
      });

    return () => {
      cancelled = true;
    };
  }, [qrResponse?.gatewayUrl]);

  // Live OTP Polling
  useEffect(() => {
    let timer: number;
    const poll = async () => {
      try {
        const res = await fetch(apiUrl(`/otp/current?patientId=${data.id}`), {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const body = await res.json();
          if (body.active) {
            setActiveOtp({ otp: body.otp, expiresAt: body.expiresAt });
          } else {
            setActiveOtp(null);
          }
        }
      } catch (err) {
        console.error('OTP Polling failed', err);
      }
    };

    poll();
    timer = window.setInterval(poll, 4000);
    return () => window.clearInterval(timer);
  }, [data.id]);

  const copyLink = async () => {
    if (!qrResponse?.gatewayUrl) return;
    try {
      await navigator.clipboard.writeText(qrResponse.gatewayUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Clipboard access was blocked by the browser.');
    }
  };

  const smsHref = qrResponse?.gatewayUrl
    ? `sms:?&body=${encodeURIComponent(`MEIOSIS temporary EMR access for ${data.name}: ${qrResponse.gatewayUrl}`)}`
    : undefined;

  return (
    <div className="patient-page patient-qr-page p-4 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-5xl mx-auto min-h-full flex flex-col gap-6 md:gap-8">
      <header className="patient-page-header mt-2 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">My QR</h1>
        <p className="text-mist">Present to a doctor for signed, time-boxed EMR access.</p>
      </header>

      <div className="qr-layout flex flex-col lg:flex-row gap-6 md:gap-8 flex-1 pb-4 md:pb-8">
        <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
          <div className="glass-card overflow-hidden h-full flex flex-col">
            <div className="p-8 pb-6 flex justify-center bg-gradient-to-b from-white/[0.02] to-transparent border-b border-wire/10 relative">
              <div className="relative w-64 h-64 p-4 rounded-3xl bg-white shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center justify-center overflow-hidden">
                {isLoading && (
                  <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                )}
                {!isLoading && qrImage && (
                  <img src={qrImage} alt="Signed patient gateway QR code" className="h-full w-full rounded-2xl" />
                )}
                {!isLoading && !qrImage && (
                  <div className="px-4 text-center text-sm font-semibold text-slate-700">
                    QR unavailable
                  </div>
                )}
                {qrImage && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent h-12 w-full animate-[panel-float_3s_ease-in-out_infinite]" />}
              </div>

              {/* OTP Overlay for Active Scans */}
              {activeOtp && (
                <div className="absolute inset-x-8 bottom-8 animate-[page-enter_0.3s_ease-out_forwards]">
                  <div className="glass-card !bg-ink/90 border-neon/30 shadow-[0_0_30px_rgba(82,255,157,0.2)] p-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-neon mb-2 font-bold">Verification Code</p>
                    <div className="flex justify-center gap-2 mb-2">
                      {activeOtp.otp.split('').map((char, i) => (
                        <div key={i} className="w-10 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold text-white font-mono">
                          {char}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-mist">Provide this to the doctor for access</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 text-center border-b border-wire/10">
              <h2 className="text-xl font-bold text-white mb-1">{data.name}</h2>
              <p className="text-sm text-mist mb-4">ID: <strong className="text-white">{patientCode}</strong></p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="chip chip-green !px-4"><Shield className="w-3.5 h-3.5" /> {qrResponse?.scope || 'READ_ONLY_EMR'}</span>
                <span className="chip bg-white/5 border-wire/20 text-white">
                  <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-neon animate-pulse' : 'bg-red-400'}`} />
                  {isLive ? 'Live' : 'Expired'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 p-6 gap-y-4 gap-x-2 border-b border-wire/10 flex-1 bg-white/[0.01]">
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-full bg-sky/10 border border-sky/20 flex items-center justify-center text-sky">
                  <Files className="w-4 h-4" />
                </div>
                {summary.appointments} Visits
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                {summary.activePrescriptions} Active Rx
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Beaker className="w-4 h-4" />
                </div>
                {summary.labs} Lab Reports
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCircle className="w-4 h-4" />
                </div>
                Identity Match
              </div>
            </div>

            <div className="p-6 bg-ink/30 mt-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-mist flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Valid for
                </span>
                <strong className="text-lg text-white font-bold">{selectedDuration.label}</strong>
              </div>

              <div className="relative mb-6">
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  className="w-full accent-neon cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between mt-2 pt-1 text-[11px] font-medium text-mist/60 px-1">
                  {durationOptions.map((option) => <span key={option.label}>{option.label.replace(' ', '')}</span>)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="w-full ghost-btn !bg-white/5 !border-white/15 !text-white hover:!bg-white/10 group"
              >
                <RefreshCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" />
                Generate New Signed QR
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          <div className="glass-card p-6 h-full border border-wire/10">
            <span className="chip bg-sky/10 border-sky/20 text-sky mb-4 inline-flex">Scan Guide</span>
            <h3 className="section-title mb-6">How it works</h3>

            <div className="space-y-6">
              <div className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-neon shadow-[0_0_8px_rgba(82,255,157,0.8)]"></div>
                <strong className="block text-white text-sm mb-1">Linked doctors</strong>
                <p className="text-mist text-sm leading-relaxed">Scanning opens your existing doctor link and highlights your record instantly.</p>
              </div>

              <div className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-sky shadow-[0_0_8px_rgba(131,212,255,0.8)]"></div>
                <strong className="block text-white text-sm mb-1">Unlinked doctors</strong>
                <p className="text-mist text-sm leading-relaxed">They receive a short-lived read-only EMR token scoped only to this patient.</p>
              </div>

              <div className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                <strong className="block text-white text-sm mb-1">Expires at</strong>
                <p className="text-mist text-sm leading-relaxed">{formatExpiry(qrResponse?.expiresAt)}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-wire/10 grid gap-3">
              <button type="button" onClick={copyLink} className="ghost-btn w-full">
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copied' : 'Copy Signed Link'}
              </button>
              <a
                href={smsHref}
                className={`ghost-btn w-full text-center ${smsHref ? '' : 'pointer-events-none opacity-50'}`}
              >
                Share Link via SMS
              </a>
            </div>

            <div className="mt-5 rounded-2xl border border-wire/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-mist/60 mb-2">Gateway URL</p>
              <p className="break-all font-mono text-xs text-mist">{compactUrl(qrResponse?.gatewayUrl || '')}</p>
              {error && <p className="mt-3 text-xs font-semibold text-red-300">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
