import { useState } from 'react';
import { Calendar, Clock, MapPin, Video, User } from 'lucide-react';
import { cn } from '../components/Sidebar';
import type { PatientProfile } from '../types';

interface AppointmentsPageProps {
  data: PatientProfile;
}

export function AppointmentsPage({ data }: AppointmentsPageProps) {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

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
    <div className="p-6 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto h-full flex flex-col relative overflow-hidden">
      <header className="mb-8 mt-2 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Appointments</h1>
          <p className="text-mist mt-1 text-sm font-medium">Manage clinical visits & video consultations.</p>
        </div>
        
        <div className="flex bg-white/[0.03] p-1.5 rounded-full border border-white/5 backdrop-blur-3xl shadow-2xl">
          <button 
            onClick={() => setFilter('upcoming')}
            className={cn("px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
              filter === 'upcoming' ? 'bg-neon text-ink shadow-[0_0_20px_rgba(82,255,157,0.4)]' : 'text-mist hover:text-white')}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setFilter('past')}
            className={cn("px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
              filter === 'past' ? 'bg-neon text-ink shadow-[0_0_20px_rgba(82,255,157,0.4)]' : 'text-mist hover:text-white')}
          >
            Past
          </button>
          <button 
            onClick={() => setFilter('cancelled')}
            className={cn("px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
              filter === 'cancelled' ? 'bg-neon text-ink shadow-[0_0_20px_rgba(82,255,157,0.4)]' : 'text-mist hover:text-white')}
          >
            Cancelled
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-6 overflow-y-auto scroll-skin pb-12 items-start queue-scroll">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 glass-card p-12 text-center border-dashed border-wire/20 flex flex-col items-center justify-center">
            <Calendar className="w-12 h-12 text-mist mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No {filter} appointments found</h3>
            <p className="text-mist">You do not have any {filter} appointments at this time.</p>
            {filter !== 'past' && <button className="action-btn mt-6">Book New Appointment</button>}
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
    </div>
  );
}
