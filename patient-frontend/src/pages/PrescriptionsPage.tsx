import { useState, useEffect } from 'react';
import { FileSignature, FileText, Search, ChevronRight, Clock, Activity } from 'lucide-react';
import { cn } from '../components/Sidebar';
import type { PatientProfile, Prescription } from '../types';
import { RecordDetailPanel } from '../components/RecordDetailPanel';
import { ModernTimeline } from '../components/ModernTimeline';
import { AnimatePresence } from 'framer-motion';
import { addDays, isAfter, parseISO, startOfDay, differenceInDays, format } from 'date-fns';

interface PrescriptionsPageProps {
  data: PatientProfile;
}

export function PrescriptionsPage({ data }: PrescriptionsPageProps) {
  const [view, setView] = useState<'overview' | 'timeline'>('overview');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSmallDevice, setIsSmallDevice] = useState(window.innerWidth <= 820);

  useEffect(() => {
    const handleResize = () => setIsSmallDevice(window.innerWidth <= 820);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const today = startOfDay(new Date());

  // Filter based on backend isActive flag (preferred) or real-time duration calculation (fallback)
  const activePrescriptions = (data.prescriptions || []).filter(p => {
    // Use the backend-computed field if available
    if (typeof p.isActive === 'boolean') return p.isActive;
    // Legacy fallback: use prescription-level durationDays
    if (p.status !== 'ACTIVE') return false;
    const expiryDate = addDays(parseISO(p.startDate), p.durationDays);
    return !isAfter(today, expiryDate);
  });

  const pastPrescriptions = (data.prescriptions || []).filter(p => {
    if (typeof p.isActive === 'boolean') return !p.isActive;
    if (p.status !== 'ACTIVE') return true;
    const expiryDate = addDays(parseISO(p.startDate), p.durationDays);
    return isAfter(today, expiryDate);
  });

  const openPanel = (p: Prescription) => {
    setSelectedPrescription(p);
    setIsPanelOpen(true);
  };

  const prescriptions = data.prescriptions || [];
  const appointments = data.appointments || [];
  const labs = data.labReports || [];

  // Ring Percentages based on activity
  const scriptPercent = Math.min(100, (prescriptions.length / 5) * 100);
  const visitPercent = Math.min(100, (appointments.length / 3) * 100);
  const labPercent = Math.min(100, (labs.length / 2) * 100);

  return (
    <div className="p-6 md:p-8 pt-[max(1.5rem,env(safe-area-inset-top,1.5rem))] animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto h-full flex flex-col relative overflow-hidden">
      <header className="mb-8 mt-2 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Prescriptions</h1>
          <p className="text-mist mt-1 text-sm font-medium">Digital treatment records & clinical documentation.</p>
        </div>
        
        <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-white/5 backdrop-blur-3xl shadow-2xl">
          <button 
            onClick={() => setView('overview')}
            className={cn("px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300", 
              view === 'overview' ? 'bg-neon text-ink shadow-[0_0_20px_rgba(82,255,157,0.4)]' : 'text-mist hover:text-white')}
          >
            Overview
          </button>
          <button 
            onClick={() => setView('timeline')}
            className={cn("px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300", 
              view === 'timeline' ? 'bg-neon text-ink shadow-[0_0_20px_rgba(82,255,157,0.4)]' : 'text-mist hover:text-white')}
          >
            Timeline
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden h-full">
        {view === 'overview' ? (
          <div className="h-full overflow-y-auto scroll-skin pb-32 queue-scroll pr-1 space-y-8">
            
            {/* 1. Intelligence Header */}
            <section className="glass-card p-6 md:p-10 border border-wire/10 relative overflow-hidden bg-gradient-to-br from-neon/5 via-white/[0.02] to-transparent">
              <div className="absolute top-0 right-0 w-64 h-64 bg-neon/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
              
              <div className="flex flex-col md:flex-row gap-8 justify-between relative z-10">
                <div className="max-w-md">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neon mb-2 hidden md:block">Clinical Vault</span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none mb-3">
                    {activePrescriptions.length} Active Treatment {activePrescriptions.length === 1 ? 'Track' : 'Tracks'}
                  </h2>
                  <p className="text-mist text-sm font-medium leading-relaxed">
                    Your authenticated digital health records, securely managed and strictly verified on the Meiosis network.
                  </p>
                </div>

                <div className="flex flex-wrap md:flex-col gap-3 shrink-0">
                  <div className="bg-ink/50 backdrop-blur-xl border border-wire/10 px-4 py-3 rounded-2xl flex items-center gap-4 min-w-[160px]">
                    <div className="w-8 h-8 rounded-full bg-neon/10 flex items-center justify-center border border-neon/20">
                       <FileSignature className="w-4 h-4 text-neon" />
                    </div>
                    <div>
                       <span className="text-xl font-bold text-white leading-none block">{prescriptions.length}</span>
                       <span className="text-[9px] font-semibold uppercase tracking-wider text-mist/60">Total Scripts</span>
                    </div>
                  </div>
                  <div className="bg-ink/50 backdrop-blur-xl border border-wire/10 px-4 py-3 rounded-2xl flex items-center gap-4 min-w-[160px]">
                    <div className="w-8 h-8 rounded-full bg-indigo-400/10 flex items-center justify-center border border-indigo-400/20">
                       <Activity className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                       <span className="text-xl font-bold text-white leading-none block">{labs.length}</span>
                       <span className="text-[9px] font-semibold uppercase tracking-wider text-mist/60">Lab Reports</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Active Care Pipeline */}
            {activePrescriptions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neon animate-pulse"></span>
                    Active Pipeline
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activePrescriptions.map(p => {
                    const startDate = parseISO(p.startDate);
                    const expiryDate = addDays(startDate, p.durationDays);
                    const daysPassed = Math.max(0, differenceInDays(today, startDate));
                    const totalDays = p.durationDays || 1;
                    const progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
                    const daysLeft = Math.max(0, totalDays - daysPassed);

                    return (
                      <div 
                        key={p.id} 
                        className="glass-card p-5 border border-neon/20 hover:border-neon/50 bg-[#0A1118]/80 hover:bg-[#0A1118] transition-all relative overflow-hidden group flex flex-col h-full"
                      >
                        <div className="absolute top-0 inset-x-0 h-1 bg-white/5">
                           <div className="h-full bg-neon shadow-[0_0_10px_#52FF9D]" style={{ width: `${progress}%` }}></div>
                        </div>

                        <div className="flex justify-between items-start mb-4 mt-2">
                           <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon shrink-0">
                             <FileText className="w-5 h-5" />
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-mist block mb-0.5">Remaining</span>
                              <span className="text-lg font-bold text-white">{daysLeft} Days</span>
                           </div>
                        </div>

                        <h4 className="text-xl font-bold text-white mb-1 truncate">{p.title}</h4>
                        <p className="text-xs font-medium text-mist/80 mb-6 truncate">{p.doctor?.name} • {p.doctor?.specialty}</p>

                        <div className="mt-auto">
                           <button 
                             onClick={() => openPanel(p)}
                             className="w-full bg-white/5 hover:bg-neon/10 border border-white/5 hover:border-neon/30 text-white hover:text-neon py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex justify-center items-center gap-2 group/btn"
                           >
                             View Digital Rx
                             <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. Clinical Archive & Labs */}
            <section className="grid lg:grid-cols-2 gap-6 pt-4 border-t border-white/5">
              
              {/* Past Prescriptions */}
              <div className="flex flex-col h-[500px]">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-mist/50 mb-4 px-1">Prescription Archive</h3>
                <div className="flex-1 overflow-y-auto scroll-skin px-4 space-y-2 relative">
                  {pastPrescriptions.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => openPanel(p)}
                      className="p-4 rounded-xl bg-white/[0.02] border border-transparent hover:border-wire/10 transition-colors flex items-center gap-4 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-mist/60 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-mist group-hover:text-white transition-colors truncate">{p.title}</h4>
                        <p className="text-[10px] font-mono text-mist/40 uppercase tracking-tighter">Concluded • {format(parseISO(p.startDate), 'MMM dd, yyyy')}</p>
                      </div>
                      <button className="text-[10px] font-bold text-mist/30 hover:text-white uppercase tracking-wider px-3 py-1.5 rounded bg-white/5 opacity-0 group-hover:opacity-100 transition-all">Review</button>
                    </div>
                  ))}
                  {pastPrescriptions.length === 0 && (
                     <div className="p-8 text-center text-sm font-medium text-mist/40 border border-dashed border-white/5 rounded-xl">No archived prescriptions found.</div>
                  )}
                  {/* Subtle fade effect at bottom of list */}
                  {pastPrescriptions.length > 5 && <div className="sticky bottom-0 h-10 bg-gradient-to-t from-ink to-transparent pointer-events-none"></div>}
                </div>
              </div>

              {/* Lab Reports */}
              <div className="flex flex-col h-[500px]">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-mist/50 mb-4 px-1 flex justify-between items-center">
                  <span>Lab Reports Archive</span>
                  <span className="hover:text-neon cursor-pointer transition-colors text-[9px] bg-white/5 px-2 py-0.5 rounded-full">+ Upload</span>
                </h3>
                <div className="flex-1 overflow-y-auto scroll-skin px-4 space-y-2 relative">
                  {labs.map(l => (
                    <div 
                      key={l.id}
                      className="p-4 rounded-xl bg-sky/5 border border-sky/10 hover:border-sky/30 transition-colors flex items-center gap-4 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky/10 flex items-center justify-center text-sky/70 shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-sky group-hover:text-sky-200 transition-colors truncate">{l.title}</h4>
                        <p className="text-[10px] font-mono text-sky/60 uppercase tracking-tighter">{l.labName} • {format(parseISO(l.reportDate), 'MMM dd, yyyy')}</p>
                      </div>
                      <button className="text-[10px] font-bold text-sky hover:text-white uppercase tracking-wider px-3 py-1.5 rounded bg-sky/20 opacity-0 group-hover:opacity-100 transition-all">Download</button>
                    </div>
                  ))}
                  {labs.length === 0 && (
                     <div className="p-8 text-center text-sm font-medium text-mist/40 border border-dashed border-white/5 rounded-xl">No lab reports on file.</div>
                  )}
                  {labs.length > 5 && <div className="sticky bottom-0 h-10 bg-gradient-to-t from-ink to-transparent pointer-events-none"></div>}
                </div>
              </div>

            </section>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <ModernTimeline data={data} isSmallDevice={isSmallDevice} />
          </div>
        )}
      </div>

      <RecordDetailPanel 
        prescription={selectedPrescription} 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </div>
  );
}

