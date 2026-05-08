import { Calendar, Pill, Activity, TrendingUp, ShieldAlert, FileText, ChevronRight, User, FlaskConical, CheckCircle2, LoaderCircle, Lock, FileSearch, ShieldCheck } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format, parseISO, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../components/Sidebar';
import type { PatientProfile, Prescription, Appointment } from '../types';
import { useState, useEffect } from 'react';
import { RecordDetailPanel } from '../components/RecordDetailPanel';
import { apiUrl, getAuthHeader } from '../lib/api';

interface RecordsPageProps {
  data: PatientProfile;
}

type ShareScope = 'none' | 'summary' | 'labs' | 'full';

type ShareSettings = {
  fullAccess: boolean;
  labOnly: boolean;
  summaryOnly: boolean;
};

const SHARE_OPTIONS: Array<{
  id: ShareScope;
  label: string;
  caption: string;
  note: string;
  icon: any;
  color: string;
}> = [
  {
    id: 'none',
    label: 'Restricted',
    caption: 'Locked records',
    note: 'Zero access policy. No clinical data is shared with doctors.',
    icon: Lock,
    color: 'red',
  },
  {
    id: 'summary',
    label: 'Summary',
    caption: 'Snapshot only',
    note: 'Doctors see vitals, allergies, and chronic history but no full records.',
    icon: FileSearch,
    color: 'amber',
  },
  {
    id: 'labs',
    label: 'Lab Only',
    caption: 'Reports synced',
    note: 'Access limited strictly to diagnostic reports and imaging.',
    icon: FlaskConical,
    color: 'blue',
  },
  {
    id: 'full',
    label: 'Standard',
    caption: 'Full visibility',
    note: 'Doctors can view your complete clinical timeline and EMR history.',
    icon: ShieldCheck,
    color: 'green',
  },
];

function settingsToScope(settings: ShareSettings): ShareScope {
  if (settings.fullAccess) return 'full';
  if (settings.labOnly) return 'labs';
  if (settings.summaryOnly) return 'summary';
  return 'none';
}

function scopeToSettings(scope: ShareScope): ShareSettings {
  return {
    fullAccess: scope === 'full',
    labOnly: scope === 'labs',
    summaryOnly: scope === 'summary',
  };
}

export function RecordsPage({ data }: RecordsPageProps) {
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [shareScope, setShareScope] = useState<ShareScope>('none');
  const [savedShareScope, setSavedShareScope] = useState<ShareScope>('none');
  const [shareLoading, setShareLoading] = useState(true);
  const [shareSaving, setShareSaving] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [isCompactDevice, setIsCompactDevice] = useState(() => window.innerWidth <= 1180);

  // ── Health Sentiment Logic ──────────────────────────────────────────
  const extractSeverity = (note: string = "") => {
    if (note.includes("Severity: SEVERE")) return { value: 20, label: "EXTREME", color: "#FF5252" };
    if (note.includes("Severity: MILD")) return { value: 60, label: "MILD", color: "#FFB347" };
    if (note.includes("Severity: LOW")) return { value: 100, label: "LOW", color: "#52FF9D" };
    return { value: 85, label: "NORMAL", color: "#83D4FF" }; // Default
  };

  const prescriptions = data.prescriptions || [];
  const timelineData = [...prescriptions]
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
    .map(p => {
      const sev = extractSeverity(p.doctorNote);
      return {
        date: format(parseISO(p.startDate), "MMM dd"),
        sentiment: sev.value,
        label: sev.label,
        color: sev.color,
        title: p.title
      };
    });

  const graphData = timelineData.length > 0 ? timelineData : [
    { date: "Current", sentiment: 100, label: "OPTIMAL", color: "#52FF9D" }
  ];

  const currentStatus = timelineData.length > 0 
    ? timelineData[timelineData.length - 1]
    : { label: "STABLE", color: "#52FF9D" };

  const openPanel = (p: Prescription) => {
    // Prescription view disabled as per requirement
    console.log("Prescription detail view is disabled:", p.id);
  };

  useEffect(() => {
    const handleResize = () => setIsCompactDevice(window.innerWidth <= 1180);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadShareSettings = async () => {
      setShareLoading(true);
      setShareError(null);

      try {
        const response = await fetch(apiUrl(`/patient/${encodeURIComponent(data.id)}/share-settings`), {
          headers: { ...getAuthHeader() }
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Server responded with ${response.status}`);
        }

        const settings = (await response.json()) as ShareSettings;
        if (cancelled) return;
        const scope = settingsToScope(settings);
        setShareScope(scope);
        setSavedShareScope(scope);
      } catch (err: any) {
        if (cancelled) return;
        setShareError(err?.message || 'Unable to load share controls right now.');
      } finally {
        if (!cancelled) setShareLoading(false);
      }
    };

    loadShareSettings();

    return () => {
      cancelled = true;
    };
  }, [data.id]);

  useEffect(() => {
    if (!shareSuccess) return;
    const timer = window.setTimeout(() => setShareSuccess(null), 3200);
    return () => window.clearTimeout(timer);
  }, [shareSuccess]);

  const selectedOption = SHARE_OPTIONS.find((option) => option.id === shareScope) ?? SHARE_OPTIONS[0];
  const savedOption = SHARE_OPTIONS.find((option) => option.id === savedShareScope) ?? SHARE_OPTIONS[0];
  const shareDirty = shareScope !== savedShareScope;

  const handleSaveShareSettings = async () => {
    setShareSaving(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      const response = await fetch(apiUrl(`/patient/${encodeURIComponent(data.id)}/share-settings`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(scopeToSettings(shareScope)),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Server responded with ${response.status}`);
      }

      const updated = (await response.json()) as ShareSettings;
      const scope = settingsToScope(updated);
      setShareScope(scope);
      setSavedShareScope(scope);
      setShareSuccess(scope === 'full'
        ? 'Full access enabled. Safe care mode activated.'
        : 'Medical share settings updated successfully.');
    } catch (err: any) {
      setShareError(err?.message || 'Could not save share controls.');
    } finally {
      setShareSaving(false);
    }
  };

  return (
    <>
      <div className="patient-page patient-records-page min-h-full flex flex-col p-4 md:p-8 pt-[max(1.5rem,env(safe-area-inset-top,1.5rem))] animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto bg-ink/30 relative gap-6 md:gap-8">
      
      {/* Header Area */}
      <header className="patient-page-header shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Clinical Records</h1>
          <p className="text-mist mt-1 text-sm font-medium">Unified analytics & patient-controlled intelligence console.</p>
        </div>
        
        <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-wire/5 backdrop-blur-3xl shadow-2xl">
           <div className="px-6 py-2.5 text-xs font-semibold text-neon uppercase tracking-wider flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-neon animate-pulse shadow-[0_0_10px_rgba(82,255,157,0.8)]"></div>
             Full EMR Visibility
           </div>
        </div>
      </header>

      {/* Share Controls Tier */}
      <section className="records-share-panel shrink-0 glass-card relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-transparent p-6 border-none shadow-[0_32px_80px_rgba(0,0,0,0.2)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-neon/[0.04] blur-3xl" />
        
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between relative z-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className={`chip py-1 text-[11px] font-bold uppercase tracking-widest chip-${SHARE_OPTIONS.find(o => o.id === savedShareScope)?.color}`}>
                Current: {savedOption.label}
              </span>
              {shareDirty && <span className="chip py-1 text-[11px] font-bold uppercase tracking-widest bg-amber-400/10 text-amber-300 border-amber-400/20">Modifying</span>}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Access Control Protocol</h2>
            <p className="text-mist mt-2 text-sm leading-relaxed font-normal opacity-70">
              Manage your diagnostic and prescription data visibility. Your doctor's ability to provide accurate care depends on the access levels you grant here.
            </p>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={shareScope}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="mt-6 p-5 rounded-[24px] bg-white/[0.03] border border-wire/8 shadow-inner"
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 h-10 w-10 flex items-center justify-center rounded-2xl bg-${selectedOption.color}-400/10 border border-${selectedOption.color}-400/20 text-${selectedOption.color}-400`}>
                    <selectedOption.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white mb-1">{selectedOption.label} Access Policies</div>
                    <p className="text-[13px] leading-6 text-mist/80">{selectedOption.note}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full xl:max-w-[500px]">
            <div className="rounded-[32px] border border-wire/10 bg-black/20 p-2 shadow-2xl">
              <div className="relative grid grid-cols-4 gap-2">
                {SHARE_OPTIONS.map((option) => {
                  const active = option.id === shareScope;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setShareScope(option.id);
                        setShareError(null);
                        setShareSuccess(null);
                      }}
                      className={`relative z-[1] rounded-[24px] px-2 py-5 text-center transition-all duration-300 ${active ? 'text-white' : 'text-mist/50 hover:text-mist hover:bg-white/[0.02]'}`}
                    >
                      {active && (
                        <motion.div
                          layoutId="shareIndicator"
                          className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-neon/15 to-neon/5 border border-neon/30 shadow-[0_8px_20px_rgba(82,255,157,0.1)]"
                          transition={{ type: 'spring', bounce: 0.22, duration: 0.5 }}
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-center gap-1.5">
                        <option.icon size={16} className={cn(active ? "text-neon" : "opacity-30")} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{option.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {shareError && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                {shareError}
              </motion.div>
            )}

            {shareSuccess && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 rounded-2xl border border-neon/20 bg-neon/10 px-4 py-3 text-sm text-neon flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{shareSuccess}</span>
              </motion.div>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="text-[11px] text-mist/40 font-bold uppercase tracking-widest pl-2">
                Security Sync Status: <span className="text-mist/70 italic">{shareDirty ? 'Pending' : 'Encrypted'}</span>
              </div>
              <button
                type="button"
                disabled={shareLoading || shareSaving || !shareDirty}
                onClick={handleSaveShareSettings}
                className={cn(
                  "px-8 py-3.5 rounded-[22px] font-bold text-xs uppercase tracking-widest transition-all shadow-xl",
                  shareDirty && !shareSaving 
                    ? "bg-neon text-ink hover:scale-[1.03] active:scale-[0.98] shadow-neon/20" 
                    : "bg-white/[0.03] text-mist/30 border border-wire/10 cursor-not-allowed"
                )}
              >
                {shareSaving ? 'Updating...' : 'Publish Protocol'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Health Sentiment Graph Section */}
      <section className="records-graph-panel shrink-0 h-80 glass-card p-6 border border-wire/10 relative overflow-hidden flex flex-col bg-gradient-to-br from-white/[0.03] to-transparent">
        <div className="flex items-center justify-between mb-2">
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentStatus.color }}></div>
                 <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Condition Sentiment</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Health Analysis Graph</h2>
           </div>
           <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-mist block mb-1">Current Sync</span>
              <span className="text-sm font-bold tracking-wider" style={{ color: currentStatus.color }}>{currentStatus.label}</span>
           </div>
        </div>

        <div className="flex-1 min-h-0 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData} margin={isCompactDevice ? { top: 10, right: 4, left: -32, bottom: 0 } : { top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentStatus.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={currentStatus.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }} 
                dy={10}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }} 
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-900/90 border border-wire/20 backdrop-blur-xl rounded-xl shadow-2xl">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-mist mb-1">{d.date}</p>
                        <p className="text-xs font-bold text-white mb-1">{d.title || "Consultation"}</p>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                           <span className="text-[10px] font-semibold uppercase tracking-tight" style={{ color: d.color }}>{d.label} SEVERITY</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="sentiment" 
                stroke={currentStatus.color} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#sentimentGradient)" 
                animationDuration={isCompactDevice ? 250 : 1500}
              />
              <ReferenceLine y={20} stroke="#FF5252" strokeDasharray="5 5" strokeOpacity={0.2} label={{ position: 'right', value: 'CRITICAL', fill: '#FF5252', fontSize: 8, fontWeight: 600 }} />
              <ReferenceLine y={60} stroke="#FFB347" strokeDasharray="5 5" strokeOpacity={0.2} label={{ position: 'right', value: 'MODERATE', fill: '#FFB347', fontSize: 8, fontWeight: 600 }} />
              <ReferenceLine y={100} stroke="#52FF9D" strokeDasharray="5 5" strokeOpacity={0.2} label={{ position: 'right', value: 'OPTIMAL', fill: '#52FF9D', fontSize: 8, fontWeight: 600 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Abstract background glow */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-neon/5 blur-[100px] rounded-full pointer-events-none"></div>
      </section>

      {/* Data Grid: Timeline & Metrics */}
      <div className="records-data-grid grid lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Timeline Column */}
        <div className="flex flex-col glass-card border-none !bg-transparent">
          <div className="flex items-center justify-between px-4 mb-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
              <Pill className="w-4 h-4" /> Prescription Tracks
            </h3>
            <span className="text-[10px] text-mist/60 font-bold uppercase bg-white/5 px-2 py-0.5 rounded-full border border-wire/10">{(data.prescriptions || []).length} Records</span>
          </div>
          
          <div className="space-y-4 px-4 pb-12">
            {(data.prescriptions || []).map(p => (
              <div 
                key={p.id} 
                onClick={() => openPanel(p)}
                className="p-5 rounded-2xl bg-white/[0.02] border border-wire/10 hover:border-sky/30 transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Pill className="w-16 h-16 text-sky" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white mb-1 group-hover:text-sky transition-colors">{p.title}</h4>
                    <p className="text-xs text-mist font-medium">{p.doctor?.name} • {p.doctor?.specialty}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-mist opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex flex-col">
                      <span className="text-[9px] text-mist/40 font-semibold uppercase tracking-wider mb-1">Started</span>
                      <span className="text-[11px] text-white font-bold">{format(parseISO(p.startDate), 'dd MMM yyyy')}</span>
                   </div>
                   <div className="w-px h-6 bg-white/5"></div>
                   <div className="flex flex-col">
                      <span className="text-[9px] text-mist/40 font-semibold uppercase tracking-wider mb-1">Cycle</span>
                      <span className="text-[11px] text-white font-bold">{p.durationDays} Days</span>
                   </div>
                   <div className="flex-1 text-right">
                      <span className={cn(
                        "chip !px-2 !py-0.5 !text-[9px] font-semibold uppercase tracking-tight",
                        p.status === 'ACTIVE' ? "bg-neon/10 text-neon shadow-[0_0_10px_rgba(82,255,157,0.1)]" : "bg-white/5 text-mist"
                      )}>
                        {p.status}
                      </span>
                   </div>
                </div>
              </div>
            ))}
            {(data.prescriptions || []).length === 0 && (
              <div className="p-12 text-center border border-dashed border-wire/10 rounded-2xl flex flex-col items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-mist mb-3 opacity-20" />
                <p className="text-sm text-mist">No active treatment tracks enqueued.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Medical Records & Labs */}
        <div className="flex flex-col h-full overflow-hidden glass-card border-none !bg-transparent">
          <div className="flex items-center justify-between mb-4 px-2 shrink-0">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Clinical Documentation
            </h3>
            <span className="text-[10px] text-mist/60 font-bold uppercase bg-white/5 px-2 py-0.5 rounded-full border border-wire/10">3 Months Trailing</span>
          </div>

          <div className="flex-1 overflow-y-auto scroll-skin queue-scroll px-4 space-y-4 pb-20">
            {/* Appointments */}
            {(data.appointments || []).map(a => (
              <div key={a.id} className="p-5 rounded-2xl bg-white/[0.02] border border-wire/10 hover:border-neon/30 transition-all cursor-pointer group flex gap-4">
                 <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon shrink-0">
                   <User className="w-5 h-5" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-white truncate pr-4">{a.doctor?.name || 'Clinic Consultant'}</h4>
                       <span className="text-[9px] font-semibold text-mist/40 tracking-wider uppercase mt-1 shrink-0">{format(parseISO(a.scheduledDate), 'dd MMM')}</span>
                    </div>
                    <p className="text-xs text-mist line-clamp-1 mb-3">{a.doctor?.specialty} • {a.title || 'In-person Consultation'}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] text-neon font-bold uppercase tracking-tight">MEIOSIS_VERIFIED</span>
                       <button className="text-[10px] text-mist hover:text-white transition-colors underline decoration-wire/20">Full Recap</button>
                    </div>
                 </div>
              </div>
            ))}

            {/* Labs */}
            {(data.labReports || []).map(l => (
              <div key={l.id} className="p-5 rounded-2xl bg-sky/5 border border-sky/20 hover:border-sky/40 transition-all cursor-pointer group flex gap-4 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-sky/10 to-transparent pointer-events-none"></div>
                 <div className="w-10 h-10 rounded-xl bg-sky/20 border border-sky/30 flex items-center justify-center text-sky shrink-0 relative z-10">
                   <FlaskConical className="w-5 h-5" />
                 </div>
                 <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-white truncate pr-4">{l.title}</h4>
                       <span className="text-[9px] font-semibold text-mist/40 tracking-wider uppercase mt-1 shrink-0">{format(parseISO(l.reportDate), 'dd MMM')}</span>
                    </div>
                    <p className="text-xs text-sky-200/60 line-clamp-1">{l.labName || 'Standard Diagnostics Node'}</p>
                 </div>
              </div>
            ))}

            {/* Empty State */}
            {data.appointments?.length === 0 && data.labReports?.length === 0 && (
              <div className="p-12 text-center border border-dashed border-wire/10 rounded-2xl flex flex-col items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-mist mb-3 opacity-20" />
                <p className="text-sm text-mist">Clinical repository is currently empty.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Prescription detail view removed */}
    </>
  );
}

// Helper types internal to component
const ClipboardList = ({ className }: { className?: string }) => <Activity className={className} />;
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
