import { Calendar, Pill, Activity, TrendingUp, ShieldAlert, FileText, ChevronRight, User, FlaskConical } from 'lucide-react';
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
import { cn } from '../components/Sidebar';
import type { PatientProfile, Prescription, Appointment } from '../types';
import { useState, useEffect } from 'react';
import { RecordDetailPanel } from '../components/RecordDetailPanel';

interface RecordsPageProps {
  data: PatientProfile;
}

export function RecordsPage({ data }: RecordsPageProps) {
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // ── Health Sentiment Logic ──────────────────────────────────────────
  // Extract severity from doctorNote (Metadata in Backend: "Severity: SEVERE")
  const extractSeverity = (note: string = "") => {
    if (note.includes("Severity: SEVERE")) return { value: 20, label: "EXTREME", color: "#FF5252" };
    if (note.includes("Severity: MILD")) return { value: 60, label: "MILD", color: "#FFB347" };
    if (note.includes("Severity: LOW")) return { value: 100, label: "LOW", color: "#52FF9D" };
    return { value: 85, label: "NORMAL", color: "#83D4FF" }; // Default
  };

  const prescriptions = data.prescriptions || [];
  const appointments = data.appointments || [];
  const labs = data.labReports || [];

  // Sort prescriptions by date for the graph
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

  // If no prescriptions, show a flat normal line
  const graphData = timelineData.length > 0 ? timelineData : [
    { date: "Current", sentiment: 100, label: "OPTIMAL", color: "#52FF9D" }
  ];

  const currentStatus = timelineData.length > 0 
    ? timelineData[timelineData.length - 1]
    : { label: "STABLE", color: "#52FF9D" };

  const openPanel = (p: Prescription) => {
    setSelectedPrescription(p);
    setIsPanelOpen(true);
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8 pt-[max(1.5rem,env(safe-area-inset-top,1.5rem))] animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto overflow-hidden bg-ink/30 relative">
      
      {/* Header Area - Fixed */}
      <header className="mb-8 mt-2 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Health Records</h1>
          <p className="text-mist mt-1 text-sm font-medium">Unified analytics & clinical intelligence console.</p>
        </div>
        
        <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-wire/5 backdrop-blur-3xl shadow-2xl">
           <div className="px-6 py-2.5 text-xs font-semibold text-neon uppercase tracking-wider flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-neon animate-pulse shadow-[0_0_10px_rgba(82,255,157,0.8)]"></div>
             Live Analytics Sync
           </div>
        </div>
      </header>

      {/* Health Sentiment Graph Section */}
      <section className="shrink-0 mb-10 h-80 glass-card p-6 border border-wire/10 relative overflow-hidden flex flex-col bg-gradient-to-br from-white/[0.03] to-transparent">
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
            <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                animationDuration={1500}
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

      {/* Dual Column Data Area - Scrollable */}
      <div className="flex-1 overflow-hidden grid lg:grid-cols-2 gap-8 min-h-0">
        
        {/* Left Column: Prescriptions */}
        <div className="flex flex-col h-full overflow-hidden glass-card border-none !bg-transparent">
          <div className="flex items-center justify-between mb-4 px-2 shrink-0">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
              <Pill className="w-4 h-4" /> Prescription Tracks
            </h3>
            <span className="text-[10px] text-mist/60 font-bold uppercase bg-white/5 px-2 py-0.5 rounded-full border border-wire/10">{(data.prescriptions || []).length} Records</span>
          </div>
          
          <div className="flex-1 overflow-y-auto scroll-skin queue-scroll px-4 space-y-4 pb-20">
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

      {/* Persistence for interactions */}
      <RecordDetailPanel 
        prescription={selectedPrescription} 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </div>
  );
}

// Helper types internal to component
const ClipboardList = ({ className }: { className?: string }) => <Activity className={className} />;
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
