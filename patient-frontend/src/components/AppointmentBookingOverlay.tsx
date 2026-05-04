import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  ChevronRight, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Heart
} from 'lucide-react';
import { cn } from './Sidebar';
import { apiUrl, getAuthHeader } from '../lib/api';
import type { PatientProfile, Doctor, AppointmentSlot } from '../types';

interface AppointmentBookingOverlayProps {
  patient: PatientProfile;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'DOCTOR_SELECTION' | 'SLOT_SELECTION' | 'PAYMENT' | 'SUCCESS';

export function AppointmentBookingOverlay({ patient, onClose, onSuccess }: AppointmentBookingOverlayProps) {
  const [step, setStep] = useState<Step>('DOCTOR_SELECTION');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Care team doctor IDs
  const careTeamIds = useMemo(() => 
    new Set((patient.doctorLinks || []).map(link => link.doctorId)),
    [patient.doctorLinks]
  );

  useEffect(() => {
    if (step === 'DOCTOR_SELECTION') {
      fetchDoctors();
    }
  }, [step]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/doctors'), { headers: getAuthHeader() });
      const data = await res.json();
      
      // Sort: Care team first
      const sorted = [...data].sort((a, b) => {
        const aIsCare = careTeamIds.has(a.id) ? 1 : 0;
        const bIsCare = careTeamIds.has(b.id) ? 1 : 0;
        return bIsCare - aIsCare;
      });
      
      setDoctors(sorted);
    } catch (err) {
      setError('Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId: string) => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`/doctors/${doctorId}/slots`), { headers: getAuthHeader() });
      const data = await res.json();
      
      // Filter for next 5 days
      const now = new Date();
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(now.getDate() + 5);
      
      const filtered = data.filter((slot: AppointmentSlot) => {
        const start = new Date(slot.startAt);
        return start >= now && start <= fiveDaysLater && slot.available;
      });
      
      setSlots(filtered);
    } catch (err) {
      setError('Failed to load slots.');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    fetchSlots(doctor.id);
    setStep('SLOT_SELECTION');
  };

  const handleSlotSelect = (slot: AppointmentSlot) => {
    setSelectedSlot(slot);
    setStep('PAYMENT');
  };

  const handlePayment = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/appointments'), {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: patient.id,
          doctorId: selectedDoctor.id,
          appointmentSlotId: selectedSlot.id,
          title: 'Routine Consultation',
          mode: selectedSlot.mode,
          paymentMethod: 'Mock Payment'
        })
      });
      
      if (res.ok) {
        setStep('SUCCESS');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to book appointment.');
      }
    } catch (err) {
      setError('An error occurred during booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-ink/40 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-neon/40 to-transparent blur-sm" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neon/5 blur-[100px] rounded-full" />

        {/* Header */}
        <div className="p-8 pb-6 flex items-center justify-between shrink-0 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
              <span className="w-1 h-6 bg-neon shadow-[0_0_12px_rgba(82,255,157,0.6)]" />
              {step === 'DOCTOR_SELECTION' && 'Select Specialist'}
              {step === 'SLOT_SELECTION' && 'Available Slots'}
              {step === 'PAYMENT' && 'Checkout'}
              {step === 'SUCCESS' && 'Confirmed'}
            </h2>
            <p className="text-mist text-sm mt-1.5 font-medium tracking-wide">
              {step === 'DOCTOR_SELECTION' && 'Expert consultation, specialized for you.'}
              {step === 'SLOT_SELECTION' && `Choose a timing for ${selectedDoctor?.name}`}
              {step === 'PAYMENT' && 'Finalize your healthcare appointment.'}
              {step === 'SUCCESS' && 'Syncing with your medical timeline...'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-mist hover:text-white hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scroll-skin px-8 pb-8 relative z-10">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-400 text-sm font-bold"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            {step === 'DOCTOR_SELECTION' && (
              <motion.div 
                key="doctors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-[3px] border-neon border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(82,255,157,0.2)]" />
                    <p className="text-mist text-xs font-black uppercase tracking-[0.2em] animate-pulse">Scanning Specialists</p>
                  </div>
                )}
                
                {!loading && doctors.map(doctor => (
                  <button
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="w-full text-left bg-white/[0.02] backdrop-blur-xl p-5 border border-white/5 rounded-3xl flex items-center gap-5 group hover:border-neon/40 hover:bg-neon/[0.03] transition-all active:scale-[0.98]"
                  >
                    <div className="w-16 h-16 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      <User className="w-8 h-8 text-mist group-hover:text-neon transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-xl font-bold text-white group-hover:text-neon transition-colors truncate">
                          {doctor.name}
                        </h4>
                        {careTeamIds.has(doctor.id) && (
                          <span className="flex items-center gap-1.5 bg-neon/10 border border-neon/20 text-neon text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(82,255,157,0.1)]">
                            <Heart size={10} fill="currentColor" /> Care Team
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-mist text-[11px] font-bold uppercase tracking-wider">{doctor.specialty}</span>
                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="text-mist/60 text-[11px] font-medium">{doctor.hospital}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-neon/10 group-hover:border-neon/20 transition-all">
                      <ChevronRight size={18} className="text-mist group-hover:text-neon group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 'SLOT_SELECTION' && (
              <motion.div 
                key="slots"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-[3px] border-neon border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(82,255,157,0.2)]" />
                    <p className="text-mist text-xs font-black uppercase tracking-[0.2em] animate-pulse">Syncing Availability</p>
                  </div>
                )}

                {!loading && slots.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <Calendar className="w-10 h-10 text-mist/30" />
                    </div>
                    <p className="text-xl font-bold text-white mb-2 tracking-tight">No slots available soon</p>
                    <p className="text-mist text-sm max-w-[280px]">Our system couldn't find any openings in the next 5 days.</p>
                    <button 
                      onClick={() => setStep('DOCTOR_SELECTION')}
                      className="text-neon text-sm font-black uppercase tracking-widest mt-8 px-6 py-3 bg-neon/10 border border-neon/20 rounded-2xl hover:bg-neon/20 transition-all"
                    >
                      Back to Specialists
                    </button>
                  </div>
                )}

                {!loading && slots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {slots.map(slot => {
                      const start = new Date(slot.startAt);
                      const isToday = start.toDateString() === new Date().toDateString();
                      
                      return (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot)}
                          className="bg-white/[0.02] backdrop-blur-xl p-5 border border-white/5 rounded-3xl flex flex-col items-center gap-4 group hover:border-neon/40 hover:bg-neon/[0.03] transition-all active:scale-[0.96] relative overflow-hidden"
                        >
                          {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-neon shadow-[0_0_8px_rgba(82,255,157,0.4)]" />}
                          <div className="text-center">
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] mb-2", isToday ? "text-neon" : "text-mist/60")}>
                              {isToday ? 'Today' : start.toLocaleDateString('en-GB', { weekday: 'long' })}
                            </p>
                            <div className="flex items-baseline gap-1.5 justify-center">
                              <span className="text-2xl font-black text-white group-hover:text-neon transition-colors">
                                {start.getDate()}
                              </span>
                              <span className="text-xs font-bold text-mist uppercase">
                                {start.toLocaleDateString('en-GB', { month: 'short' })}
                              </span>
                            </div>
                          </div>
                          <div className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-[18px] bg-white/5 border border-white/5 group-hover:bg-neon/10 group-hover:border-neon/20 transition-all">
                            <Clock size={14} className="text-mist group-hover:text-neon" />
                            <span className="text-sm font-black text-white group-hover:text-neon transition-colors">
                              {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {step === 'PAYMENT' && selectedDoctor && selectedSlot && (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-white/[0.02] backdrop-blur-xl p-8 border border-white/5 rounded-[32px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 blur-[50px] rounded-full -mr-16 -mt-16" />
                  
                  <div className="flex items-center gap-5 mb-8 relative z-10">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-10 h-10 text-neon" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white tracking-tight">{selectedDoctor.name}</h4>
                      <p className="text-mist text-sm font-bold uppercase tracking-wider">{selectedDoctor.specialty}</p>
                    </div>
                  </div>

                  <div className="space-y-5 pt-6 border-t border-white/5 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-mist text-[13px] font-bold uppercase tracking-widest flex items-center gap-2.5">
                        <Calendar size={16} className="text-neon" /> Date
                      </span>
                      <span className="text-white font-black">
                        {new Date(selectedSlot.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-mist text-[13px] font-bold uppercase tracking-widest flex items-center gap-2.5">
                        <Clock size={16} className="text-neon" /> Time
                      </span>
                      <span className="text-white font-black">
                        {new Date(selectedSlot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-mist text-[13px] font-bold uppercase tracking-widest flex items-center gap-2.5">
                        {selectedSlot.mode === 'IN_PERSON' ? <MapPin size={16} className="text-neon" /> : <Video size={16} className="text-neon" />} 
                        Session Mode
                      </span>
                      <span className="text-white font-black">
                        {selectedSlot.mode === 'IN_PERSON' ? 'In-Person OPD' : 'Virtual Consult'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-10 pt-8 border-t-2 border-dashed border-white/10 relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-mist text-sm font-bold uppercase tracking-wider">Consultation Fee</span>
                      <span className="text-white font-bold">₹500.00</span>
                    </div>
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-mist text-sm font-bold uppercase tracking-wider">Platform Fee</span>
                      <span className="text-white font-bold">₹20.00</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-mist text-[10px] font-black uppercase tracking-[0.2em] mb-1">Payable Amount</div>
                      <span className="text-neon text-4xl font-black leading-none drop-shadow-[0_0_15px_rgba(82,255,157,0.4)]">
                        ₹520.00
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-5 group hover:bg-white/[0.08] transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center border border-white/5 shadow-inner">
                      <CreditCard size={22} className="text-mist group-hover:text-neon transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Patient Wallet</p>
                      <p className="text-mist text-xs font-bold mt-0.5">Balance: ₹24,500.00</p>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-neon bg-neon/10 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-neon shadow-[0_0_12px_rgba(82,255,157,0.8)]" />
                    </div>
                  </div>

                  <button 
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-neon text-ink py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_16px_48px_rgba(82,255,157,0.25)] hover:shadow-[0_20px_64px_rgba(82,255,157,0.4)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-[3px] border-ink border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={20} strokeWidth={3} />
                        Confirm Booking
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setStep('SLOT_SELECTION')}
                    className="w-full text-mist/60 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Reselect Timing
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'SUCCESS' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="relative mb-10">
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-32 h-32 rounded-[40px] bg-neon/10 border border-neon/30 flex items-center justify-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-neon/10 to-transparent" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 300, delay: 0.4 }}
                      className="relative z-10"
                    >
                      <CheckCircle2 size={80} className="text-neon" strokeWidth={1.5} />
                    </motion.div>
                  </motion.div>
                  
                  {/* Fluid particle animations */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.5, 0], 
                        opacity: [0, 0.8, 0],
                        x: [0, (Math.cos(i * 45 * Math.PI / 180) * 80)],
                        y: [0, (Math.sin(i * 45 * Math.PI / 180) * 80)]
                      }}
                      transition={{ duration: 2, delay: 0.5 + i * 0.05, repeat: Infinity, repeatDelay: 1 }}
                      className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-neon shadow-[0_0_10px_rgba(82,255,157,0.8)]"
                    />
                  ))}
                </div>

                <h3 className="text-3xl font-black text-white mb-4 tracking-tight uppercase italic">
                  Success!
                </h3>
                <p className="text-mist max-w-[320px] text-sm font-medium leading-relaxed mb-12">
                  Your consultation with <span className="text-white font-bold">{selectedDoctor?.name}</span> is confirmed for {new Date(selectedSlot?.startAt || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.
                </p>

                <div className="flex flex-col items-center">
                  <div className="h-1.5 w-64 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '0%' }}
                      transition={{ duration: 2.5, ease: "easeInOut" }}
                      className="h-full w-full bg-neon shadow-[0_0_20px_rgba(82,255,157,0.8)]"
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-2 h-2 bg-neon rounded-full animate-ping" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon/60">Finalizing Record Sync</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </div>
  );
}
