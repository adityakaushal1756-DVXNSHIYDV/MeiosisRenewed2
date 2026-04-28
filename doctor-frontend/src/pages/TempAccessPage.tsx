import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Beaker, CalendarDays, Clock, FileText, ShieldCheck, XCircle } from 'lucide-react';
import { apiUrl } from '../lib/api';

interface TempEmrPayload {
  patient: {
    id: string;
    name: string;
    meiosisId?: string;
    universalCode?: string;
    bloodGroup?: string;
    phone?: string;
    email?: string;
  };
  prescriptions: Array<any>;
  labReports: Array<any>;
  appointments: Array<any>;
  accessLevel: string;
  scope: string;
  tokenExpiresAt: number;
}

type ViewerStatus = 'loading' | 'ready' | 'expired' | 'error';

function readTokenFromUrl() {
  if (typeof window === 'undefined') return '';
  return new URL(window.location.href).searchParams.get('token') || '';
}

function decodeJwtPayload(token: string): { exp?: number; p_id?: string; scope?: string } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function formatRemaining(expiresAt: number | null, now: number) {
  if (!expiresAt) return '--';
  const remaining = Math.max(0, expiresAt * 1000 - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function SandboxedEmrViewer({ token }: { token: string }) {
  const [status, setStatus] = useState<ViewerStatus>('loading');
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<TempEmrPayload | null>(null);
  const [now, setNow] = useState(Date.now());
  const cacheRef = useRef(new Map<string, TempEmrPayload>());
  const abortRef = useRef<AbortController | null>(null);
  const tokenClaims = useMemo(() => decodeJwtPayload(token), [token]);
  const expiresAt = payload?.tokenExpiresAt || tokenClaims?.exp || null;

  const destroySession = useCallback((nextStatus: ViewerStatus = 'expired') => {
    abortRef.current?.abort();
    abortRef.current = null;
    cacheRef.current.clear();
    setPayload(null);
    setStatus(nextStatus);
  }, []);

  useEffect(() => {
    if (!token) {
      setError('Temporary access token is missing.');
      setStatus('error');
      return;
    }

    if (tokenClaims?.exp && tokenClaims.exp * 1000 <= Date.now()) {
      destroySession('expired');
      return;
    }

    const cached = cacheRef.current.get(token);
    if (cached) {
      setPayload(cached);
      setStatus('ready');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setError('');

    fetch(apiUrl('/gateway/temp-emr'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Temporary EMR fetch failed with ${res.status}`);
        cacheRef.current.set(token, body);
        setPayload(body);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        cacheRef.current.clear();
        setError(err.message || 'Unable to load temporary EMR.');
        setStatus('error');
      });

    return () => {
      controller.abort();
      cacheRef.current.clear();
    };
  }, [destroySession, token, tokenClaims?.exp]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const remainingMs = expiresAt * 1000 - Date.now();
    if (remainingMs <= 0) {
      destroySession('expired');
      return;
    }
    const timer = window.setTimeout(() => destroySession('expired'), remainingMs);
    return () => window.clearTimeout(timer);
  }, [destroySession, expiresAt]);

  const activePrescriptions = payload?.prescriptions?.filter((item) => item.isActive).length ?? 0;
  const patientCode = payload?.patient?.universalCode || payload?.patient?.meiosisId || payload?.patient?.id || tokenClaims?.p_id;

  return (
    <div className="min-h-screen bg-ink text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 md:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-wire/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neonSoft px-3 py-1 text-xs font-semibold text-neon">
              <ShieldCheck size={14} />
              READ_ONLY_EMR
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Temporary EMR Viewer</h1>
            <p className="mt-2 text-sm text-mist">Sandboxed session. No patient data is written into the doctor dashboard state.</p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">
            <div className="flex items-center gap-2 font-semibold">
              <Clock size={15} />
              Auto-destruct in {formatRemaining(expiresAt, now)}
            </div>
          </div>
        </header>

        {status === 'loading' && (
          <section className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neon border-t-transparent" />
              <p className="text-sm text-mist">Fetching EMR just in time...</p>
            </div>
          </section>
        )}

        {status === 'error' && (
          <section className="glass-card mx-auto mt-12 max-w-lg p-6 text-center">
            <AlertTriangle className="mx-auto mb-4 text-amber-300" size={34} />
            <h2 className="text-xl font-bold">Access could not be opened</h2>
            <p className="mt-2 text-sm text-mist">{error}</p>
          </section>
        )}

        {status === 'expired' && (
          <section className="glass-card mx-auto mt-12 max-w-lg p-6 text-center">
            <XCircle className="mx-auto mb-4 text-red-300" size={34} />
            <h2 className="text-xl font-bold">Temporary access expired</h2>
            <p className="mt-2 text-sm text-mist">The local viewer cache was purged for this session.</p>
          </section>
        )}

        {status === 'ready' && payload && (
          <section className="grid flex-1 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="glass-card p-5">
              <div className="rounded-3xl border border-neon/15 bg-neonSoft/40 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-neon/70">Patient</p>
                <h2 className="mt-2 text-2xl font-bold">{payload.patient.name}</h2>
                <p className="mt-1 font-mono text-sm text-mist">{patientCode}</p>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-2xl border border-wire/10 bg-white/[0.03] p-4">
                  <p className="text-mist">Blood Group</p>
                  <strong>{payload.patient.bloodGroup || 'Not recorded'}</strong>
                </div>
                <div className="rounded-2xl border border-wire/10 bg-white/[0.03] p-4">
                  <p className="text-mist">Contact</p>
                  <strong>{payload.patient.phone || payload.patient.email || 'Restricted'}</strong>
                </div>
              </div>
            </aside>

            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="glass-card p-5">
                  <FileText className="mb-3 text-neon" size={20} />
                  <p className="text-2xl font-bold">{activePrescriptions}</p>
                  <p className="text-sm text-mist">Active prescriptions</p>
                </div>
                <div className="glass-card p-5">
                  <Beaker className="mb-3 text-sky" size={20} />
                  <p className="text-2xl font-bold">{payload.labReports.length}</p>
                  <p className="text-sm text-mist">Lab reports</p>
                </div>
                <div className="glass-card p-5">
                  <CalendarDays className="mb-3 text-amber-300" size={20} />
                  <p className="text-2xl font-bold">{payload.appointments.length}</p>
                  <p className="text-sm text-mist">Appointments</p>
                </div>
              </div>

              <div className="glass-card min-h-0 p-5">
                <h3 className="mb-4 text-lg font-bold">Latest clinical records</h3>
                <div className="scroll-skin max-h-[52vh] space-y-3 overflow-auto pr-1">
                  {payload.prescriptions.slice(0, 8).map((rx) => (
                    <article key={rx.id} className="rounded-2xl border border-wire/10 bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold">{rx.title || 'Clinical visit'}</h4>
                          <p className="mt-1 text-xs text-mist">
                            {rx.doctor?.name || 'Doctor'} | {new Date(rx.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={rx.isActive ? 'chip chip-green' : 'chip bg-white/5 text-mist'}>
                          {rx.isActive ? 'Active' : 'Past'}
                        </span>
                      </div>
                      {rx.doctorNote && <p className="mt-3 line-clamp-3 text-sm text-mist">{rx.doctorNote}</p>}
                      {Array.isArray(rx.items) && rx.items.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {rx.items.slice(0, 4).map((item: any) => (
                            <span key={item.id} className="rounded-xl border border-wire/10 bg-panel px-3 py-1 text-xs text-white/80">
                              {item.medicine} {item.dose}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                  {payload.prescriptions.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-wire/10 p-6 text-center text-sm text-mist">
                      No prescriptions are visible in this temporary session.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export function TempAccessPage() {
  const [token] = useState(readTokenFromUrl);

  useEffect(() => {
    if (!token) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }, [token]);

  return <SandboxedEmrViewer token={token} />;
}
