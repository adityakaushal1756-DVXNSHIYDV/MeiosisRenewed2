import { useState } from 'react';
import { Pill, ChevronRight, FileText, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../components/Sidebar';
import type { PatientProfile, Prescription, PrescriptionItem } from '../types';
import { differenceInDays, addDays, parseISO, startOfDay } from 'date-fns';

interface MedicinesPageProps {
  data: PatientProfile;
}

// ── Client-side mirror of backend parse-duration.js ───────────────────────
// Converts "7 days", "2 weeks", "30", "1m" → integer days, or null.
function parseDurationToDays(str: string | null | undefined): number | null {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().toLowerCase();
  if (!s) return null;
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(d|day|days|w|week|weeks|m|month|months|y|year|years)?\.?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'd').charAt(0);
  let days: number;
  switch (unit) {
    case 'd': days = Math.round(value); break;
    case 'w': days = Math.round(value * 7); break;
    case 'm': days = Math.round(value * 30); break;
    case 'y': days = Math.round(value * 365); break;
    default:  days = Math.round(value);
  }
  return days > 0 ? days : null;
}

// ── Helper: compute per-item active status ─────────────────────────────────
// Priority:
//   1. backend isActive (most accurate)
//   2. item.durationDays (stored numeric)
//   3. parseDurationToDays(item.timing) (self-healing raw text parse)
//   4. prescription.durationDays (prescription-wide fallback)
function isItemActive(
  item: PrescriptionItem,
  prescription: Prescription,
  today: Date
): boolean {
  // 1. Backend already computed this
  if (typeof item.isActive === 'boolean') return item.isActive;

  // 2–4. Client-side calculation with self-healing fallback chain
  const itemDays =
    item.durationDays ??
    parseDurationToDays(item.timing) ??
    prescription.durationDays ??
    30;

  const start = parseISO(prescription.startDate);
  const expiry = addDays(start, itemDays);
  return today <= expiry;
}


// ── Enriched item type ─────────────────────────────────────────────────────
interface ActiveMedItem extends PrescriptionItem {
  doctorName: string | undefined;
  totalDays: number;
  daysLeft: number;
  progress: number;
  dayNumber: number;
  cycleEnd: Date;
}

interface InactiveMedItem extends PrescriptionItem {
  doctorName: string | undefined;
  totalDays: number;
  endedOn: string;
}

export function MedicinesPage({ data }: MedicinesPageProps) {
  const today = startOfDay(new Date());

  // ── Build active and inactive item lists ────────────────────────────────
  const allActiveItems: ActiveMedItem[] = [];
  const allInactiveItems: InactiveMedItem[] = [];

  (data.prescriptions || []).forEach(p => {
    if (p.status !== 'ACTIVE') {
      // Entire prescription inactive: all items go to history
      (p.items || []).forEach(item => {
        const itemDays =
          item.durationDays ??
          parseDurationToDays(item.timing) ??
          p.durationDays ??
          30;
        allInactiveItems.push({
          ...item,
          doctorName: p.doctor?.name,
          totalDays: itemDays,
          endedOn: addDays(parseISO(p.startDate), itemDays).toLocaleDateString(),
        });
      });
      return;
    }

    (p.items || []).forEach(item => {
      const active = isItemActive(item, p, today);
      const itemDays =
        item.durationDays ??
        parseDurationToDays(item.timing) ??
        p.durationDays ??
        30;
      const start = parseISO(p.startDate);
      const cycleEnd = addDays(start, itemDays);

      if (active) {
        const daysPassed = Math.max(0, differenceInDays(today, start));
        const daysLeft = Math.max(0, itemDays - daysPassed);
        const progress = Math.min(100, (daysPassed / itemDays) * 100);
        allActiveItems.push({
          ...item,
          doctorName: p.doctor?.name,
          totalDays: itemDays,
          daysLeft,
          progress,
          dayNumber: daysPassed + 1,
          cycleEnd,
        });
      } else {
        allInactiveItems.push({
          ...item,
          doctorName: p.doctor?.name,
          totalDays: itemDays,
          endedOn: cycleEnd.toLocaleDateString(),
        });
      }
    });
  });

  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(
    allActiveItems.length > 0 ? allActiveItems[0].medicine : null
  );

  return (
    <div className="p-6 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto h-full flex flex-col relative overflow-hidden">
      <header className="mb-8 mt-2 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Medications</h1>
          <p className="text-mist mt-1 text-sm font-medium">Real-time treatment tracker &amp; adherence assistant.</p>
        </div>
        
        <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-white/5 backdrop-blur-3xl shadow-2xl">
           <div className="px-6 py-2.5 text-xs font-semibold text-neon uppercase tracking-wider flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-neon animate-pulse shadow-[0_0_10px_rgba(82,255,157,0.8)]"></div>
             {allActiveItems.length} Active Protocols
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll-skin pb-20 queue-scroll">
        <div className="grid lg:grid-cols-12 gap-6 mb-8">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Daily Tracker */}
            <div className="glass-card p-6 border border-wire/10 border-b-neon/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 rounded-full blur-3xl group-hover:bg-neon/10 transition-colors"></div>
              <h2 className="text-xl font-bold text-white mb-1">Dose Checklist</h2>
              <p className="text-mist text-sm mb-6">Track your daily protocol for {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              
              <div className="flex justify-between items-end mb-2">
                <p className="text-lg font-bold text-white">
                  <span className="text-neon">0</span>/{allActiveItems.length} completed
                </p>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] text-mist/60 uppercase font-semibold mb-1">Daily Goal</span>
                    <span className="chip bg-white/5 border-wire/10 !px-3 font-semibold text-mist">0%</span>
                 </div>
              </div>
              
              <div className="h-2 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-neon rounded-full" style={{ width: '0%' }}></div>
              </div>
              
              {allActiveItems.length > 0 ? (
                 <div className="p-4 rounded-xl bg-white/[0.03] border border-wire/10 border-l-4 border-l-sky space-y-3">
                    <p className="text-xs text-mist uppercase font-semibold tracking-wider">Upcoming Focus</p>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">{allActiveItems[0].medicine}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky/10 text-sky-400 border border-sky/20 font-bold">{allActiveItems[0].timing}</span>
                   </div>
                </div>
              ) : (
                <div className="p-12 text-center border border-dashed border-wire/10 rounded-xl">
                   <p className="text-sm font-medium text-mist">All treatment cycles completed.</p>
                </div>
              )}
            </div>

            {/* Treatment Progress */}
            <div className="glass-card p-6 border border-wire/10 flex-1">
              <h2 className="text-lg font-bold text-white mb-1">Treatment Progress</h2>
              <p className="text-mist text-sm mb-6">Real-time countdown indicators for each medication.</p>
              
              <div className="space-y-3">
                {allActiveItems.length > 0 ? allActiveItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedMedicine(item.medicine)}
                    className={cn(
                      "p-4 rounded-xl cursor-pointer flex items-center justify-between transition-all outline-none group",
                      selectedMedicine === item.medicine
                        ? "bg-neon/10 border border-neon/40 shadow-[0_0_20px_rgba(82,255,157,0.05)]"
                        : "bg-white/5 border border-wire/10 hover:border-wire/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-all", 
                        selectedMedicine === item.medicine ? "bg-neon text-ink border-neon shadow-[0_0_15px_rgba(82,255,157,0.4)]" : "bg-white/5 text-mist border-wire/10"
                      )}>
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-neon transition-colors">{item.medicine}</h3>
                         <div className="flex items-center gap-2 mt-0.5">
                            <Clock className={cn("w-3 h-3", item.daysLeft <= 2 ? "text-rose-400" : "text-mist")} />
                            <span className={cn("text-[10px] font-semibold uppercase tracking-wider", item.daysLeft <= 2 ? "text-rose-400" : "text-mist")}>
                              {item.daysLeft} Days Remaining
                            </span>
                         </div>
                      </div>
                    </div>
                     <div className="text-right">
                        <p className="text-[10px] text-mist/60 uppercase font-semibold mb-1">Day {item.dayNumber}/{item.totalDays}</p>
                       <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-sky" style={{ width: `${item.progress}%` }}></div>
                       </div>
                     </div>
                  </div>
                )) : (
                  <p className="text-mist text-sm text-center py-10">No cycles in progress.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Today's Schedule */}
            <div className="glass-card p-6 border border-wire/10 h-full flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Today's Schedule</h2>
                  <p className="text-mist text-sm">Synchronized with your doctor's timeline.</p>
                </div>
                 {allActiveItems.some(i => i.daysLeft <= 1) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-semibold uppercase">
                    <AlertTriangle className="w-3.5 h-3.5" /> Ending Soon
                  </div>
                )}
              </div>
              
              <div className="space-y-4 flex-1">
                {allActiveItems.length > 0 ? allActiveItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-white/[0.02] border border-wire/5 cursor-pointer hover:bg-white/5 transition-all group relative overflow-hidden">
                    <div className="w-6 h-6 rounded-full border-2 border-wire/20 flex items-center justify-center shrink-0 mt-1 transition-all group-hover:border-neon group-hover:shadow-[0_0_10px_rgba(82,255,157,0.3)]"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-white text-base group-hover:text-neon transition-colors">{item.medicine}</h4>
                          <p className="text-xs text-mist mt-0.5">{item.dose} • {item.timing}</p>
                        </div>
                         <div className="text-right">
                            <span className="text-[10px] font-semibold text-mist/40 uppercase tracking-wider">{item.frequency.replace(/_/g, ' ')}</span>
                         </div>
                      </div>
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                          <span className="text-mist flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> Cycle Ends: {item.cycleEnd.toLocaleDateString()}
                          </span>
                          <span className="text-sky font-semibold uppercase">Active Track</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full text-mist p-8 text-center text-sm border-dashed border border-wire/10 rounded-xl">
                    <Pill className="w-12 h-12 mb-4 opacity-10" />
                    <p>Clinical regimen complete or not yet started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* Active Regimen Table */}
        <div className="glass-card p-0 border border-wire/10 overflow-hidden">
          <div className="p-6 border-b border-wire/10 bg-white/[0.01]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky" /> Full Regimen Details
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                 <tr className="bg-white/[0.02]">
                  <th className="py-4 px-6 text-[10px] font-semibold text-mist uppercase tracking-wider">Clinical Source</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-mist uppercase tracking-wider">Medication</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-mist uppercase tracking-wider">Protocol</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-mist uppercase tracking-wider">Time Left</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-mist uppercase tracking-wider">Clinic Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wire/5">
                {allActiveItems.length > 0 ? (
                  allActiveItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="py-5 px-6">
                         <p className="text-sm font-bold text-white/90">{item.doctorName || 'Prescribing Lead'}</p>
                         <p className="text-[10px] text-mist/60 font-medium">Verified MEIOSIS Node</p>
                      </td>
                      <td className="py-5 px-6">
                         <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-neon"></div>
                           <span className="text-sm font-bold text-white">{item.medicine}</span>
                         </div>
                         <p className="text-[10px] text-mist/50 mt-1">{item.dose}</p>
                      </td>
                       <td className="py-5 px-6">
                        <span className="px-2 py-1 rounded bg-panel border border-wire/10 text-[10px] text-white font-semibold uppercase">{item.frequency.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-5 px-6">
                         <div className="flex items-center gap-2">
                           <div className={cn("w-2 h-2 rounded-full", item.daysLeft <= 2 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-sky-400")}></div>
                           <span className={cn("text-xs font-bold", item.daysLeft <= 2 ? "text-rose-400" : "text-white")}>{item.daysLeft} Days</span>
                         </div>
                      </td>
                      <td className="py-5 px-6 text-sm text-mist/60 max-w-xs truncate">{item.reason || 'Symptomatic control'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 px-4 text-sm text-mist/40 text-center">No active medication tracks enqueued.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Past Medications */}
        {allInactiveItems.length > 0 && (
          <div className="glass-card p-0 border border-wire/10 overflow-hidden mt-8 opacity-80">
            <div className="p-6 border-b border-wire/10 bg-white/[0.01]">
              <h2 className="text-base font-bold text-mist flex items-center gap-2">
                <Clock className="w-4 h-4" /> Past Medications
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                   <tr className="bg-white/[0.02]">
                    <th className="py-4 px-6 text-[10px] font-semibold text-mist uppercase tracking-wider">Clinical Source</th>
                    <th className="py-4 px-6 text-[10px] font-semibold text-mist uppercase tracking-wider">Medication</th>
                    <th className="py-4 px-6 text-[10px] font-semibold text-mist uppercase tracking-wider">Protocol</th>
                    <th className="py-4 px-6 text-[10px] font-semibold text-mist uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wire/5">
                  {allInactiveItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-5 px-6">
                         <p className="text-sm font-bold text-mist/80">{item.doctorName || 'Prescribing Lead'}</p>
                      </td>
                      <td className="py-5 px-6">
                         <div className="flex items-center gap-2">
                           <span className="text-sm font-bold text-mist/80 line-through">{item.medicine}</span>
                         </div>
                         <p className="text-[10px] text-mist/40 mt-1">{item.dose}</p>
                      </td>
                       <td className="py-5 px-6">
                        <span className="text-[10px] text-mist/60 font-semibold uppercase">{item.frequency.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-5 px-6">
                         <div className="flex items-center gap-2">
                           <div className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-white/5 text-mist/60 border border-wire/10">Inactive</div>
                           <span className="text-xs font-semibold text-mist/50">Ended {item.endedOn}</span>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
