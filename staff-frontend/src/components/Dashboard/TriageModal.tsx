import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Thermometer, Wind, Heart, ShieldCheck, MapPin, Bed, Loader2 } from 'lucide-react';

interface TriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  onSave: (vitals: any) => Promise<void>;
}

export function TriageModal({ isOpen, onClose, patientName, onSave }: TriageModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vitals, setVitals] = useState({
    bp: '',
    pulse: '',
    temp: '',
    spo2: '',
    ward: '',
    bed: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(vitals);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0F1115] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 pb-0 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Activity size={18} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Clinical Intake & Triage</h2>
            </div>
            <p className="text-mist/40 text-sm">Recording baseline vitals for <span className="text-white font-semibold">{patientName}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-mist/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Vitals Grid */}
          <div className="grid grid-cols-2 gap-4">
            <VitalInput 
              icon={<Heart size={18} className="text-red-400" />} 
              label="Blood Pressure" 
              placeholder="120/80" 
              unit="mmHg" 
              value={vitals.bp}
              onChange={(v: string) => setVitals(prev => ({ ...prev, bp: v }))}
            />
            <VitalInput 
              icon={<Activity size={18} className="text-purple-400" />} 
              label="Pulse Rate" 
              placeholder="72" 
              unit="bpm" 
              value={vitals.pulse}
              onChange={(v: string) => setVitals(prev => ({ ...prev, pulse: v }))}
            />
            <VitalInput 
              icon={<Thermometer size={18} className="text-amber-400" />} 
              label="Body Temp" 
              placeholder="98.6" 
              unit="°F" 
              value={vitals.temp}
              onChange={(v: string) => setVitals(prev => ({ ...prev, temp: v }))}
            />
            <VitalInput 
              icon={<Wind size={18} className="text-blue-400" />} 
              label="Oxygen (SpO2)" 
              placeholder="98" 
              unit="%" 
              value={vitals.spo2}
              onChange={(v: string) => setVitals(prev => ({ ...prev, spo2: v }))}
            />
          </div>

          {/* Admission Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-mist/20 ml-1">Admission Tracking</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-mist/20" size={18} />
                <input 
                  type="text" 
                  placeholder="Ward (e.g. ICU, General)" 
                  value={vitals.ward}
                  onChange={(e) => setVitals(prev => ({ ...prev, ward: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-mist/20 outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div className="relative">
                <Bed className="absolute left-4 top-1/2 -translate-y-1/2 text-mist/20" size={18} />
                <input 
                  type="text" 
                  placeholder="Bed Number" 
                  value={vitals.bed}
                  onChange={(e) => setVitals(prev => ({ ...prev, bed: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-mist/20 outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-mist/40 hover:text-white hover:bg-white/5 transition-all"
            >
              Skip for now
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-emerald-500 text-black rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
              Complete Intake
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function VitalInput({ icon, label, placeholder, unit, value, onChange }: any) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
        {icon}
      </div>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-16 pr-16 text-white font-bold placeholder:text-mist/20 outline-none focus:border-emerald-500/50 transition-all"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <span className="text-[10px] font-black text-mist/20 uppercase">{unit}</span>
      </div>
      <div className="absolute -top-2 left-4 px-2 bg-[#0F1115] text-[9px] font-black uppercase tracking-widest text-mist/40">
        {label}
      </div>
    </div>
  );
}
