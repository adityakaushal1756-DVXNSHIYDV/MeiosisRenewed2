import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileSignature, 
  Calendar, 
  Pill, 
  Clock, 
  ClipboardList,
  ShieldAlert,
  Download,
  Activity
} from 'lucide-react';
import { cn } from './Sidebar';
import type { Prescription } from '../types';
import { addDays, isAfter, parseISO, startOfDay } from 'date-fns';

interface RecordDetailPanelProps {
  prescription: Prescription | null;
  isOpen: boolean;
  onClose: () => void;
}

const NilField = ({ label, value, icon: Icon, isCritical }: { label: string; value: any; icon?: any, isCritical?: boolean }) => {
  const isNil = !value || (Array.isArray(value) && value.length === 0);
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1.5 opacity-50">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className={cn(
        "text-sm font-medium transition-colors",
        isNil ? "text-rose-400/50" : (isCritical ? "text-rose-400 font-bold" : "text-white")
      )}>
        {isNil ? 'NIL' : value}
      </div>
    </div>
  );
};

import { apiUrl } from '../lib/api';
import { useEffect } from 'react';

export function RecordDetailPanel({ prescription, isOpen, onClose }: RecordDetailPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('panel-open');
    } else {
      document.body.classList.remove('panel-open');
    }
    return () => document.body.classList.remove('panel-open');
  }, [isOpen]);

  if (!prescription) return null;

  const today = startOfDay(new Date());
  const expiryDate = addDays(parseISO(prescription.startDate), prescription.durationDays);
  const isExpired = isAfter(today, expiryDate);
  const displayStatus = isExpired ? 'EXPIRED' : (prescription.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE');

  const handleDownload = () => {
    alert("PDF generation is disabled pending system redesign.");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[110]"
          />

          {/* Slide Over Panel */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 20 }} // Stops 20px from top
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="record-detail-panel fixed inset-x-0 bottom-0 z-[120] bg-ink border-t border-wire/20 rounded-t-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
            style={{ height: 'calc(100vh - 20px)' }}
          >
            {/* Grab Handle/Header */}
            <div className="record-detail-header flex items-center justify-between px-8 py-6 border-b border-wire/10 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky/20 border border-sky/30 flex items-center justify-center text-sky">
                    <FileSignature className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{prescription.title}</h2>
                    <p className="text-xs text-mist font-medium tracking-wide">Detailed Clinical Record • {prescription.id}</p>
                  </div>
               </div>
               <button 
                 onClick={onClose}
                 className="w-10 h-10 rounded-full bg-white/5 border border-wire/10 flex items-center justify-center text-mist hover:text-white transition-all active:scale-90"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Content Scroll Area */}
            <div className="record-detail-scroll flex-1 overflow-y-auto scroll-skin px-8 py-10">
               <div className="max-w-4xl mx-auto space-y-12 pb-20">
                 
                 {/* 1. High-Level Context Row */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <NilField label="Status" value={displayStatus} icon={Activity} isCritical={isExpired} />
                    <NilField label="Prescribed On" value={new Date(prescription.startDate).toLocaleDateString()} icon={Calendar} />
                    <NilField label="Approx. Duration" value={`${prescription.durationDays} Days`} icon={Clock} />
                    <NilField label="Expiry Date" value={new Date(expiryDate).toLocaleDateString()} icon={ShieldAlert} />
                 </div>

                 {/* 2. Doctor/Identity Section */}
                 <div className="glass-card p-6 border border-wire/10 bg-gradient-to-r from-sky/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-full bg-panel border-2 border-sky/20 flex items-center justify-center text-sky font-bold text-xl overflow-hidden">
                         {prescription.doctor.name.charAt(0)}
                       </div>
                       <div>
                         <p className="text-[10px] text-sky font-semibold uppercase tracking-wider mb-1">Prescribing Physician</p>
                         <h3 className="text-lg font-bold text-white">{prescription.doctor.name}</h3>
                         <p className="text-sm text-mist">{prescription.doctor.specialty} • {prescription.doctor.hospital}</p>
                       </div>
                    </div>
                    <button className="ghost-btn !border-sky/20 !text-sky-300">Message Doctor</button>
                 </div>

                 {/* 3. Detailed Medication Table */}
                 <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-wire/10 pb-4">
                       <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                         <Pill className="w-4 h-4" /> Medication Regimen
                       </h3>
                    </div>
                    
                    <div className="grid gap-4">
                       {prescription.items.length > 0 ? prescription.items.map((item, i) => (
                         <div key={item.id} className="glass-card overflow-hidden border border-wire/10 hover:border-sky/30 transition-all">
                            <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                               <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                     <span className="w-6 h-6 rounded-md bg-sky/10 border border-sky/20 text-sky text-[10px] flex items-center justify-center font-bold">{i+1}</span>
                                     <h4 className="font-bold text-white text-base">{item.medicine}</h4>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-4">
                                     <NilField label="Dosage" value={item.dose} />
                                     <NilField label="Frequency" value={item.frequency} />
                                     <NilField label="Timing" value={item.timing} />
                                  </div>
                               </div>
                               <div className="w-full md:w-64 p-4 rounded-xl bg-ink/50 border border-wire/5">
                                  <NilField label="Note by Doctor" value={item.reason} />
                               </div>
                            </div>
                         </div>
                       )) : <p className="text-mist text-sm text-center py-8">No specific medications listed.</p>}
                    </div>
                 </section>

                 {/* 4. Clinical Observations / Notes */}
                 <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-wire/10 pb-4">
                       <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                         <ClipboardList className="w-4 h-4" /> Clinical Observations
                       </h3>
                    </div>
                    
                    <div className="grid gap-6">
                       <div className="p-6 rounded-2xl bg-white/[0.02] border border-wire/5">
                          <NilField label="Symptoms & Diagnosis" value={null} /> {/* Populated from EMR if available */}
                       </div>
                       <div className="p-6 rounded-2xl bg-white/[0.02] border border-wire/5 bg-gradient-to-b from-transparent to-rose-500/[0.02]">
                          <NilField label="Physician Special Instructions" value={prescription.doctorNote} icon={ShieldAlert} />
                       </div>
                    </div>
                 </section>

                 {/* Footer Actions */}
                 <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 shrink-0">
                    <button 
                      onClick={handleDownload}
                      className="action-btn !py-4 flex-1 w-full gap-2"
                    >
                       <Download className="w-5 h-5" /> Download PDF
                    </button>
                    <button className="ghost-btn !py-4 flex-1 w-full gap-2 text-mist" onClick={onClose}>
                       Close Record View
                    </button>
                 </div>

               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
