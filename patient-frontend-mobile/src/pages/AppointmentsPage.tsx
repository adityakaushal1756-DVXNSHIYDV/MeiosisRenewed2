import { useState } from 'react';
import { Calendar, Clock, MapPin, Video, User, PlusCircle } from 'lucide-react';
import { cn } from '../components/Sidebar';
import { AppointmentBookingOverlay } from '../components/AppointmentBookingOverlay';
import { AnimatePresence } from 'framer-motion';
import type { PatientProfile } from '../types';

interface AppointmentsPageProps {
  data: PatientProfile;
  refresh: () => void;
}

export function AppointmentsPage({ data, refresh }: AppointmentsPageProps) {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [showBooking, setShowBooking] = useState(false);

  const now = new Date();
  
  const mappedAppointments = (data.appointments || []).map(a => {
    let computedStatus: 'upcoming' | 'past' | 'cancelled' = 'upcoming';
    if (a.status === 'CANCELLED') computedStatus = 'cancelled';
    else if (a.status === 'COMPLETED' || new Date(a.scheduledDate) < now) computedStatus = 'past';

    return {
      id: a.id,
      doctor: a.doctor?.name || 'Unknown Doctor',
      specialty: a.doctor?.specialty || 'General',
      date: new Date(a.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: a.slotStartTime ? new Date(a.slotStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible',
      mode: a.mode === 'IN_PERSON' ? 'In-person' : 'Video Consult',
      location: a.location || a.doctor?.hospital || 'Virtual',
      status: computedStatus,
      type: a.title || 'Consultation'
    };
  });

  const filtered = mappedAppointments.filter(a => a.status === filter);

  return (
    <div className="patient-page patient-appointments-page p-4 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto min-h-full flex flex-col relative">
      <header className="appointments-header patient-page-header mb-6 md:mb-8 mt-2 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Appointments</h1>
          <p className="text-mist mt-1 text-sm font-medium">Manage clinical visits & video consultations.</p>
        </div>

        <button 
          onClick={() => setShowBooking(true)}
          className="action-btn gap-2 shadow-[0_8px_32px_rgba(82,255,157,0.2)] w-full sm:w-auto justify-center"
        >
          <PlusCircle size={18} strokeWidth={3} />
          Book New Appointment
        </button>
        
        <div className="filter-pill-group">
          <button 
            onClick={() => setFilter('upcoming')}
            className={`filter-pill-btn ${filter === 'upcoming' ? 'active' : ''}`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setFilter('past')}
            className={`filter-pill-btn ${filter === 'past' ? 'active' : ''}`}
          >
            Past
          </button>
          <button 
            onClick={() => setFilter('cancelled')}
            className={`filter-pill-btn ${filter === 'cancelled' ? 'active' : ''}`}
          >
            Cancelled
          </button>
        </div>
      </header>

      <div className="patient-page-list grid md:grid-cols-2 gap-4 md:gap-6 pb-12 items-start">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 glass-card p-12 text-center border-dashed border-wire/20 flex flex-col items-center justify-center">
            <Calendar className="w-12 h-12 text-mist mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No {filter} appointments found</h3>
            <p className="text-mist">You do not have any {filter} appointments at this time.</p>
            {filter !== 'past' && <button className="action-btn mt-6" onClick={() => setShowBooking(true)}>Book New Appointment</button>}
          </div>

        ) : (
          filtered.map(apt => (
            <div key={apt.id} className="glass-card p-6 border border-wire/10 flex flex-col group hover:border-wire/20 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-wire/10 flex items-center justify-center text-xl overflow-hidden shrink-0">
                    <User className="w-6 h-6 text-mist" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-neon transition-colors">{apt.doctor}</h3>
                    <span className="chip bg-white/5 border-wire/10 text-mist">{apt.specialty}</span>
                  </div>
                </div>
                {apt.status === 'upcoming' && <span className="chip chip-blue border-none bg-sky/10 text-sky text-xs font-bold px-2 py-1">Upcoming</span>}
                {apt.status === 'past' && <span className="chip bg-white/5 border-wire/10 text-mist text-xs">Completed</span>}
                {apt.status === 'cancelled' && <span className="chip border-none border-red-500/20 text-red-400 text-xs font-bold px-2 py-1">Cancelled</span>}
              </div>

              <div className="bg-ink/50 rounded-xl p-4 border border-wire/5 mb-6">
                <div className="flex items-center gap-3 mb-3 text-sm text-white font-medium">
                  <Calendar className="w-4 h-4 text-neon" /> {apt.date}
                  <span className="text-mist">|</span>
                  <Clock className="w-4 h-4 text-neon" /> {apt.time}
                </div>
                <div className="flex items-center gap-3 text-sm text-mist">
                  {apt.mode === 'In-person' ? <MapPin className="w-4 h-4 text-mist" /> : <Video className="w-4 h-4 text-mist" />}
                  {apt.location}
                </div>
              </div>

              <div className="mt-auto flex items-center gap-3">
                <button className="action-btn flex-1 !py-2.5">Follow-up context</button>
                <button className="ghost-btn flex-1 !py-2.5">Manage</button>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showBooking && (
          <AppointmentBookingOverlay 
            patient={data} 
            onClose={() => setShowBooking(false)} 
            onSuccess={refresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
