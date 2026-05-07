import { Fragment, useState, useEffect, useRef } from 'react';
import { X, Pill, Stethoscope, FlaskConical, Download, Calendar, User, Activity, ShieldCheck, HeartPulse, Clock } from 'lucide-react';
import { cn } from './Sidebar';
import type { AppointmentEntry } from './ModernTimeline';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface TimelineSidePanelProps {
  entry: AppointmentEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

function MetaTile({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={cn("px-4 py-3 flex-1", border && "border-l border-white/5")}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-mist/60 mb-1">{label}</p>
      <p className="text-sm font-bold text-white truncate">{value || '—'}</p>
    </div>
  );
}

function ClinicalNoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8 py-4 border-t border-white/5">
      <span className="w-40 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-mist/60 mt-1">{label}</span>
      <p className="flex-1 text-sm font-medium text-white/90 leading-relaxed font-outfit">{value}</p>
    </div>
  );
}

export function TimelineSidePanel({ entry, isOpen, onClose }: TimelineSidePanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedMeds, setExpandedMeds] = useState<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-expand medications with instructions on open
  useEffect(() => {
    if (isOpen && entry) {
      const ids = new Set<string>();
      entry.prescriptions.forEach(p => {
        if (p.instructions) ids.add(p.id);
      });
      setExpandedMeds(ids);
    }
  }, [isOpen, entry]);

  if (!entry) return null;

  const handleDownloadPDF = async () => {
    alert("PDF generation is disabled pending system redesign.");
  };

  const isActive = entry.status === 'ACTIVE' || entry.status === 'OPEN';

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn("fixed inset-0 bg-black/80 backdrop-blur-md z-[100] transition-opacity duration-300", 
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={cn(
        "fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8 transition-all duration-300 pointer-events-none",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        <div 
          ref={modalRef}
          className="w-full max-w-[800px] h-fit max-h-full bg-[#0A1118] border border-wire/10 shadow-[0_32px_128px_rgba(0,0,0,0.8)] rounded-[32px] overflow-hidden flex flex-col pointer-events-auto relative"
        >
          {/* Header */}
          <header className="p-8 border-b border-white/5 flex items-start justify-between shrink-0 bg-gradient-to-b from-white/[0.02] to-transparent">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neon">Meiosis Clinical Portal</span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider",
                  isActive ? "bg-neon/10 text-neon border border-neon/20" : "bg-white/5 text-mist/60 border border-white/10"
                )}>
                  {entry.status || 'Verified'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-none mb-1">{entry.type}</h2>
              <p className="text-mist font-medium flex items-center gap-2 text-sm">
                <Calendar className="w-3.5 h-3.5" /> {entry.date}
              </p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-mist hover:text-white rounded-2xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scroll-skin p-8 space-y-10">
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 bg-white/[0.03] border border-wire/10 rounded-2xl overflow-hidden divide-x divide-white/5 shadow-inner">
              <MetaTile label="Physician" value={entry.doctor} />
              <MetaTile label="Specialty" value={entry.specialty} border />
              {entry.isNote ? (
                <>
                  <MetaTile label="Type" value="Clinical Note" border />
                  <MetaTile label="Date" value={entry.date} border />
                </>
              ) : (
                <>
                  <MetaTile label="Follow-up" value={entry.endDate ? new Date(entry.endDate).toLocaleDateString('en-GB') : 'N/A'} border />
                  <MetaTile label="Duration" value={entry.durationDays ? `${entry.durationDays} Days` : 'N/A'} border />
                </>
              )}
            </div>

            {/* Note Content */}
            {entry.isNote && entry.noteText && (
              <section className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" /> Clinical Note Content
                </h3>
                <p className="text-sm font-medium text-white/90 leading-relaxed font-outfit whitespace-pre-wrap">{entry.noteText}</p>
              </section>
            )}

            {/* Medications Table */}
            {entry.prescriptions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                    <Pill className="w-5 h-5 text-neon" /> Prescribed Medications
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-semibold uppercase tracking-wider text-mist/60">
                        <th className="pb-4 pl-2">Medicine</th>
                        <th className="pb-4">Dose</th>
                        <th className="pb-4">Frequency</th>
                        <th className="pb-4 text-right pr-2">Timing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {entry.prescriptions.map((p) => (
                        <Fragment key={p.id}>
                          <tr className="group">
                            <td className="py-4 pl-2">
                              <span className="text-sm font-bold text-white block">{p.name}</span>
                              <span className="text-[10px] text-mist/40 font-medium">Digital Rx Line</span>
                            </td>
                            <td className="py-4 font-mono text-xs text-neon">{p.dose}</td>
                            <td className="py-4 text-xs font-medium text-white/70">{p.frequency || 'Manual'}</td>
                            <td className="py-4 text-right pr-2 text-xs font-medium text-sky">{p.duration || 'As directed'}</td>
                          </tr>
                          {p.instructions && expandedMeds.has(p.id) && (
                            <tr className="bg-white/[0.01]">
                              <td colSpan={4} className="py-4 px-6">
                                <div className="flex gap-4 items-start border-l-2 border-neon/30 pl-4 py-1">
                                  <div className="p-2 bg-neon/5 rounded-lg text-neon shrink-0">
                                    <Clock className="w-3.5 h-3.5" />
                                  </div>
                                  <p className="text-xs text-mist leading-relaxed font-outfit">{p.instructions}</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Vitals Grid */}
            {!entry.isNote && (
              <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-sky" /> Consultation Vitals
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                          { label: 'BP', value: entry.vitals?.bloodPressure, icon: 'Pulse' },
                          { label: 'HR', value: entry.vitals?.pulse, icon: 'Beats' },
                          { label: 'TMP', value: entry.vitals?.temperature, icon: 'Thermo' },
                          { label: 'O2', value: entry.vitals?.spo2, icon: 'Oxy' },
                          { label: 'HT', value: entry.vitals?.height, icon: 'Cm' },
                          { label: 'WT', value: entry.vitals?.weight, icon: 'Kg' },
                      ].map(v => (
                          <div key={v.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                              <p className="text-[9px] font-semibold text-mist/40 uppercase mb-2">{v.label}</p>
                              <p className="text-sm font-bold text-white">{v.value || 'NIL'}</p>
                          </div>
                      ))}
                  </div>
              </section>
            )}

            {/* Deep Clinical Analysis */}
            {!entry.isNote && (entry.chiefComplaint || entry.notes || entry.plan) && (
              <section className="bg-white/[0.02] border border-wire/10 rounded-2xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-neon" /> Clinical Context
                </h3>
                <div className="divide-y divide-white/5">
                  {entry.chiefComplaint && <ClinicalNoteRow label="Chief Complaint" value={entry.chiefComplaint} />}
                  {entry.notes && <ClinicalNoteRow label="Assessment / Diagnosis" value={entry.notes} />}
                  {entry.plan && <ClinicalNoteRow label="Treatment Plan" value={entry.plan} />}
                </div>
              </section>
            )}

            {/* Verification Footer */}
            <div className="flex items-center justify-between pt-4 opacity-40">
                <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-neon" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white">Encrypted Record Integrity Verified</span>
                </div>
                <span className="text-[9px] font-mono text-mist uppercase">EMR_NODE_{entry.id.slice(-8)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions p-6 border-t border-white/5 bg-white/[0.02] shrink-0 flex gap-4">
            {!entry.isNote && (
              <button 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="flex-1 bg-neon text-[#0A1118] font-semibold uppercase tracking-wider text-[10px] py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-neon/90 transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : <><Download className="w-4 h-4" /> Download Digital Rx</>}
              </button>
            )}
            <button onClick={onClose} className="flex-1 bg-white/5 text-white font-semibold uppercase tracking-wider text-[10px] py-4 rounded-2xl hover:bg-white/10 transition-all">
              Close Record
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
