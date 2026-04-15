import { useState } from 'react';
import { Pill, Stethoscope, ChevronRight, FlaskConical, Calendar, ShieldAlert } from 'lucide-react';
import { cn } from './Sidebar';
import type { PatientProfile, Prescription } from '../types';
import { TimelineSidePanel } from './TimelineSidePanel';
import { parseISO, format } from 'date-fns';

// -- Types & Formatting ------------------------------------------

export interface LabEntry {
  id: string;
  label: string;
  value: string;
  unit?: string;
  status?: 'normal' | 'high' | 'low' | 'critical';
}

export interface PrescriptionEntry {
  id: string;
  name: string;
  dose: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface MedicationEntry {
  id: string;
  name: string;
  dose: string;
  ongoing?: boolean;
}

export interface AppointmentEntry {
  id: string;
  rawDate: Date;
  date: string;
  type: string;
  specialty: string;
  doctor: string;
  metrics: string;
  notes?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  adherenceScore?: number;
  chiefComplaint?: string;
  plan?: string;
  vitals?: {
    bloodPressure?: string;
    pulse?: string;
    temperature?: string;
    spo2?: string;
    height?: string;
    weight?: string;
  };
  labs: LabEntry[];
  prescriptions: PrescriptionEntry[];
  medications: MedicationEntry[];
  documentPath?: string;
}

const ACCENT: Record<string, string> = {
  'Cardiology':       '#E7F36E',
  'Nephrology':       '#93C5FD',
  'General Medicine': '#52FF9D',
  'Dermatology':      '#F9A8D4',
  'Orthopedics':      '#FCA5A5',
  'Pediatrics':       '#FDBA74',
  'Neurology':        '#A78BFA',
  'Oncology':         '#34D399',
  'Endocrinology':    '#67E8F9',
  'Psychiatry':       '#FDE68A',
  'Pulmonology':      '#86EFAC',
  'Gastroenterology': '#FB923C',
  'General Practice': '#52FF9D',
};

const ACCENT_PALETTE = ['#E7F36E','#93C5FD','#52FF9D','#F9A8D4','#FCA5A5','#FDBA74','#A78BFA','#34D399'];
function getAccent(specialty: string): string {
  if (ACCENT[specialty]) return ACCENT[specialty];
  let h = 0;
  for (const c of specialty) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return ACCENT_PALETTE[h % ACCENT_PALETTE.length];
}

// -- Data mapping ------------------------------------------------

function extractFromNote(note: string, prefix: string): string | undefined {
  const line = (note || '').split('\n').find(l => l.startsWith(prefix));
  return line ? line.slice(prefix.length).trim() || undefined : undefined;
}

function extractMetrics(note: string): string {
  const vitalsLine = (note || '').split('\n').find(l => l.startsWith('Vitals —'));
  if (vitalsLine) {
    const parts = vitalsLine.replace('Vitals — ', '').split(' | ');
    return parts[0] || 'Stable';
  }
  const assessment = extractFromNote(note, 'Assessment: ');
  if (assessment) return assessment.slice(0, 30);
  return 'Stable Profile';
}

function mapToAppointmentEntries(data: PatientProfile): AppointmentEntry[] {
  const prescriptions = data.prescriptions || [];
  const appointments = data.appointments || [];
  const entries: AppointmentEntry[] = [];

  prescriptions.forEach(rx => {
    const d = parseISO(rx.startDate);
    entries.push({
      id: rx.id,
      rawDate: d,
      date: format(d, 'dd MMM yyyy'),
      type: rx.title || 'Prescription',
      specialty: rx.doctor?.specialty || 'General Practice',
      doctor: rx.doctor?.name || 'Unknown Doctor',
      metrics: extractMetrics(rx.doctorNote || ''),
      status: rx.status,
      startDate: rx.startDate,
      endDate: rx.startDate,
      durationDays: rx.durationDays,
      notes: extractFromNote(rx.doctorNote || '', 'Assessment: '),
      chiefComplaint: extractFromNote(rx.doctorNote || '', 'Chief Complaint: '),
      plan: extractFromNote(rx.doctorNote || '', 'Plan: '),
      labs: [],
      prescriptions: (rx.items || []).map(i => ({
        id: i.id,
        name: i.medicine,
        dose: i.dose,
        frequency: i.frequency,
        duration: i.timing
      })),
      medications: []
    });
  });

  appointments.forEach(apt => {
    const d = parseISO(apt.scheduledDate);
    const dateStr = format(d, 'dd MMM yyyy');
    if (!entries.find(e => e.date === dateStr)) {
        entries.push({
            id: apt.id,
            rawDate: d,
            date: dateStr,
            type: apt.title || 'Consultation',
            specialty: apt.doctor?.specialty || 'General Practice',
            doctor: apt.doctor?.name || 'Unknown Doctor',
            metrics: 'Clinical Review',
            status: 'COMPLETED',
            labs: [],
            prescriptions: [],
            medications: []
        });
    }
  });

  return entries.sort((a,b) => b.rawDate.getTime() - a.rawDate.getTime());
}

// -- Components --------------------------------------------------

interface TimelineNodeProps {
  entry: AppointmentEntry;
  delay: number;
  onSelect: (e: AppointmentEntry) => void;
}

const TimelineNode = ({ entry, delay, onSelect }: TimelineNodeProps) => {
  const accent = getAccent(entry.specialty);
  const itemCount = entry.prescriptions.length + entry.labs.length;
  const isMedication = entry.prescriptions.length > 0;
  
  return (
    <div 
      className="relative flex items-center gap-6 md:gap-10 w-full group/node animate-[sIn_0.6s_ease_forwards] opacity-0 cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onSelect(entry)}
    >
      {/* Date Marker (Left Side on Desktop, Hidden on small mobile if tight) */}
      <div className="hidden md:block w-24 text-right shrink-0">
        <span className="text-[11px] font-black uppercase tracking-widest text-[#8CA1B4] leading-tight block">
          {format(entry.rawDate, 'MMM dd')}
        </span>
        <span className="text-[9px] font-bold text-mist/40 tracking-wider">
          {format(entry.rawDate, 'yyyy')}
        </span>
      </div>

      {/* Center Axis Node */}
      <div className="relative flex items-center justify-center shrink-0 w-6 h-6 z-10 transition-transform duration-300 group-hover/node:scale-125">
         <div className="absolute inset-0 rounded-full blur-[8px] opacity-40 transition-opacity duration-300 group-hover/node:opacity-80" style={{ backgroundColor: accent }}></div>
         <div className="w-5 h-5 rounded-full border-[3px] border-[#0A1118] relative z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center p-[2px]" style={{ backgroundColor: accent }}>
            {isMedication ? <Pill className="w-2.5 h-2.5 text-[#0A1118]" /> : <Stethoscope className="w-2.5 h-2.5 text-[#0A1118]" />}
         </div>
      </div>

      {/* Content Card */}
      <div className="flex-1 min-w-0 py-4">
        <div className="glass-card p-5 border border-wire/10 hover:border-white/20 transition-all rounded-[20px] bg-gradient-to-r from-white/[0.03] to-transparent relative overflow-hidden group-hover/node:shadow-[0_8px_30px_rgba(0,0,0,0.12)] group-hover/node:-translate-y-0.5">
          {/* Subtle accent glow inside card */}
          <div className="absolute -top-10 -right-10 w-32 h-32 blur-[40px] opacity-10 rounded-full transition-opacity duration-500 group-hover/node:opacity-30 pointer-events-none" style={{ backgroundColor: accent }}></div>
          
          <div className="flex justify-between items-start mb-3">
             <div className="flex flex-col md:flex-row md:items-center gap-2">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border" style={{ color: accent, borderColor: `${accent}30`, backgroundColor: `${accent}10` }}>
                    {entry.specialty}
                 </span>
                 <span className="md:hidden text-[10px] text-mist/60 font-bold tracking-widest uppercase">{format(entry.rawDate, 'dd MMM yyyy')}</span>
             </div>
             
             {/* Interaction affordance */}
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover/node:bg-white/10 group-hover/node:text-white transition-colors">
                 <ChevronRight className="w-4 h-4" />
             </div>
          </div>

          <h3 className="text-lg font-bold text-white mb-1 truncate pr-4">{entry.type}</h3>
          <p className="text-xs text-mist font-medium mb-4 truncate">Dr. {entry.doctor}</p>

          <div className="flex flex-wrap gap-3">
              <div className="bg-[#0A1118]/60 border border-white/5 rounded-xl p-3 flex-1 min-w-[200px]">
                 <p className="text-[9px] uppercase tracking-[0.2em] text-[#8CA1B4] mb-1">Primary Clinical Metric</p>
                 <p className="text-sm font-semibold text-white truncate" style={{ color: accent }}>{entry.metrics}</p>
              </div>
              
              {itemCount > 0 && (
                <div className="bg-[#0A1118]/60 border border-white/5 rounded-xl px-4 py-3 flex flex-col justify-center shrink-0">
                   <p className="text-[9px] uppercase tracking-[0.2em] text-[#8CA1B4] mb-1">Enclosed</p>
                   <p className="text-sm font-black text-white flex items-center gap-1.5">
                      {isMedication ? <Pill className="w-3.5 h-3.5 text-sky" /> : <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />}
                      {itemCount} Items
                   </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface ModernTimelineProps {
  data: PatientProfile;
  isSmallDevice?: boolean;
}

export function ModernTimeline({ data }: ModernTimelineProps) {
  const [selectedEntry, setSelectedEntry] = useState<AppointmentEntry | null>(null);
  const entries = mapToAppointmentEntries(data);
  
  // Group entries by Month & Year for narrative storytelling
  const groupedEntries: { [key: string]: AppointmentEntry[] } = {};
  entries.forEach(entry => {
     const monthYear = format(entry.rawDate, 'MMMM yyyy');
     if (!groupedEntries[monthYear]) groupedEntries[monthYear] = [];
     groupedEntries[monthYear].push(entry);
  });

  return (
    <div className="flex-1 h-full overflow-y-auto overflow-x-hidden scroll-skin relative py-12 px-4 md:px-12 lg:px-24">
      {/* The Clinical Spine - Thick Gradient Track */}
      <div className="absolute left-[34px] md:left-[154px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-4xl mx-auto flex flex-col gap-10 relative">
        {Object.keys(groupedEntries).length === 0 ? (
           <div className="flex flex-col items-center justify-center p-20 text-center">
              <ShieldAlert className="w-12 h-12 text-mist opacity-20 mb-4" />
              <p className="text-mist font-medium">No clinical timeline history available.</p>
           </div>
        ) : (
           Object.entries(groupedEntries).map(([monthYear, monthEntries], groupIdx) => (
             <div key={monthYear} className="relative z-10 w-full animate-[sIn_0.6s_ease_forwards] opacity-0" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                
                {/* Milestone Node */}
                <div className="flex items-center gap-6 md:gap-10 mb-6 sticky top-[-48px] bg-[#0A1118]/80 backdrop-blur-2xl py-4 z-30 border-y border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] rounded-2xl md:rounded-3xl px-4 md:px-6 transition-all duration-300 group/milestone hover:bg-[#0A1118]/90">
                   <div className="hidden md:block w-[72px] text-right shrink-0"></div>
                   <div className="relative flex items-center justify-center shrink-0 w-6 h-6 z-10">
                      <div className="w-3 h-3 rounded-full bg-neon/80 shadow-[0_0_12px_#52FF9D]"></div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter shadow-sm">{monthYear}</h2>
                      <p className="text-[10px] font-black tracking-[0.25em] text-mist/50 uppercase">Episode of Care</p>
                   </div>
                </div>

                {/* Event Nodes */}
                <div className="flex flex-col gap-4">
                  {monthEntries.map((entry, idx) => (
                    <TimelineNode 
                      key={entry.id} 
                      entry={entry} 
                      delay={(groupIdx * 100) + (idx * 50) + 150} 
                      onSelect={setSelectedEntry}
                    />
                  ))}
                </div>
             </div>
           ))
        )}
        
        {/* End of Line Marker */}
        {entries.length > 0 && (
           <div className="flex items-center gap-6 md:gap-10 pt-10 pb-20 opacity-30">
              <div className="hidden md:block w-24 shrink-0"></div>
              <div className="relative flex items-center justify-center shrink-0 w-6 h-6 z-10">
                 <div className="w-2 h-2 rounded-full bg-white/30"></div>
              </div>
              <div className="flex-1">
                 <span className="text-[10px] font-black uppercase tracking-widest text-mist">End of Available Records</span>
              </div>
           </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      <TimelineSidePanel 
        entry={selectedEntry} 
        isOpen={!!selectedEntry} 
        onClose={() => setSelectedEntry(null)} 
      />
    </div>
  );
}
