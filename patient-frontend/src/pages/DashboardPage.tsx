import { Search, Calendar, ShieldAlert, FileOutput, Upload, LayoutList, FileSignature, Clock } from 'lucide-react';
import { cn } from '../components/Sidebar';
import type { PatientProfile } from '../types';
import { addDays, isAfter, parseISO, startOfDay, differenceInDays } from 'date-fns';

interface DashboardPageProps {
  onNavigate: (section: any) => void;
  data: PatientProfile;
  patientId: string;
}

export function DashboardPage({ onNavigate, data }: DashboardPageProps) {
  const now = new Date();
  const today = startOfDay(now);
  
  const upcomingAppointments = data.appointments.filter(a => new Date(a.scheduledDate) > now && a.status !== 'CANCELLED');
  
  // Updated to respect duration timer
  const activePrescriptions = data.prescriptions.filter(p => {
    if (p.status !== 'ACTIVE') return false;
    const expiryDate = addDays(parseISO(p.startDate), p.durationDays);
    return !isAfter(today, expiryDate);
  });

  const newReportsCount = data.labReports.filter(l => new Date(l.reportDate) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length;

  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  const next2Appointments = upcomingAppointments.slice(1, 3);
  
  const latestPrescription = activePrescriptions.length > 0 ? activePrescriptions[0] : null;

  return (
    <div className="p-6 md:p-8 pt-[max(1.5rem,env(safe-area-inset-top,1.5rem))] animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto relative overflow-hidden h-full flex flex-col">
      {/* Header */}
      <header className="flex items-start justify-between gap-6 mb-8 mt-2 shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">Good Afternoon, {data.name.split(' ')[0]}</h1>
          <p className="text-mist mt-1 text-sm font-medium">Your Health. Fully In Your Control.</p>
        </div>

        {/* Global Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Desktop Search */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
              <input 
                type="text" 
                placeholder="Search section" 
                className="pl-10 pr-4 py-2.5 rounded-xl border border-wire/10 bg-white/[0.03] text-white outline-none focus:border-neon focus:ring-1 focus:ring-neon w-[240px] text-sm transition-all"
              />
            </div>
            <button className="ghost-btn !px-4 !py-2.5 !rounded-xl">Go</button>
          </div>

          {/* Mobile/Tablet Search - Fixed Position */}
          <button className="xl:hidden flex items-center justify-center w-12 h-12 rounded-2xl border border-wire/10 bg-white/[0.03] text-mist hover:text-neon hover:border-neon transition-all group shadow-glass active:scale-95">
            <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Upcoming Appointments', val: upcomingAppointments.length, onClick: () => onNavigate('appointments'), id: 'appointments' },
          { label: 'Active Channels', val: activePrescriptions.length, onClick: () => onNavigate('prescriptions'), id: 'prescriptions' },
          { label: 'New Reports', val: newReportsCount, onClick: () => onNavigate('records'), id: 'records' },
          { label: 'Appointments Booked', val: data.appointments.length, sub: 'Across care timeline', onClick: () => onNavigate('appointments'), id: 'appointments2' },
        ].map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            className="group glass-card p-5 cursor-pointer hover:bg-white/5 transition-colors border border-wire/5 hover:border-wire/20"
          >
            <p className="text-mist text-sm font-medium mb-3">{item.label}</p>
            <h3 className="text-3xl font-semibold text-white">
              {item.val}
              {item.sub && <span className="block text-xs font-normal text-mist mt-1">{item.sub}</span>}
            </h3>
          </div>
        ))}
      </div>

      {/* Main Two Columns */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        
        {/* Upcoming Appointment */}
        <div className="glass-card p-6 flex flex-col relative overflow-hidden group border border-wire/5 hover:border-wire/20 cursor-pointer transition-all" onClick={() => onNavigate('appointments')}>
          <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-24 h-24 text-neon" />
          </div>
          <h2 className="section-title mb-6 flex items-center gap-2 relative z-10">
            <Calendar className="w-5 h-5 text-neon" /> Upcoming Appointment
          </h2>
          
          {nextAppointment ? (
            <>
              <div className="mb-6 relative z-10">
                <p className="text-xl font-bold text-white mb-1">{nextAppointment.doctor?.name || 'Assigned Doctor'}</p>
                <p className="text-neon font-medium mb-1">
                  {new Date(nextAppointment.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {nextAppointment.slotStartTime ? ` • ${new Date(nextAppointment.slotStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
                <p className="text-mist text-sm mb-1">Hospital: {nextAppointment.doctor?.hospital || 'Online'}</p>
                <p className="text-mist text-sm">Mode: {nextAppointment.mode === 'IN_PERSON' ? 'In-person' : 'Teleconsult'}</p>
              </div>
              
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <button className="action-btn !py-2 !px-4" onClick={(e) => { e.stopPropagation(); onNavigate('appointments'); }}>View Details</button>
                <button className="ghost-btn !py-2 !px-4" onClick={(e) => { e.stopPropagation(); }}>Reschedule</button>
              </div>

              {next2Appointments.length > 0 && (
                <div className="mt-auto border-t border-wire/10 pt-5 relative z-10">
                  <h3 className="text-sm font-semibold text-white mb-4">Next Enqueued</h3>
                  <div className="space-y-4">
                    {next2Appointments.map((apt, idx) => (
                      <div key={apt.id} className="flex gap-4 relative">
                        {idx < next2Appointments.length - 1 && <div className="absolute left-[7px] top-4 bottom-[-16px] w-[2px] bg-wire/10"></div>}
                        <div className={cn("w-4 h-4 rounded-full border-2 bg-ink z-10 shrink-0 mt-0.5", idx === 0 ? "border-neon" : "border-mist")}></div>
                        <div>
                          <p className="text-sm font-medium text-mist">{new Date(apt.scheduledDate).toLocaleDateString()}</p>
                          <p className="font-semibold text-white">{apt.doctor?.name || 'Doctor'} • {apt.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-8 relative z-10 text-center">
              <Calendar className="w-12 h-12 text-mist mb-4 opacity-50" />
              <p className="text-white font-medium mb-1">No Upcoming Appointments</p>
              <p className="text-mist text-sm mb-6">Your schedule is completely clear.</p>
              <button className="action-btn" onClick={(e) => { e.stopPropagation(); onNavigate('appointments'); }}>Book Appointment</button>
            </div>
          )}
        </div>

        {/* Latest Prescription */}
        <div className="glass-card p-6 flex flex-col relative overflow-hidden group border border-wire/5 hover:border-wire/20 cursor-pointer transition-all" onClick={() => onNavigate('prescriptions')}>
          <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
            <FileSignature className="w-24 h-24 text-sky" />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h2 className="section-title flex items-center gap-2 mb-1">
                <FileSignature className="w-5 h-5 text-sky" /> Latest Prescription
              </h2>
            </div>
            {latestPrescription && <span className="chip chip-green">Active Track</span>}
          </div>

          {latestPrescription ? (
            <>
              <p className="text-xl font-bold text-white mb-1 relative z-10">{latestPrescription.title}</p>
              <p className="text-mist mb-6 relative z-10">{latestPrescription.doctor?.name || 'Doctor'} • {latestPrescription.doctor?.specialty || 'General Medicine'}</p>

              {latestPrescription.items && latestPrescription.items.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                  {latestPrescription.items.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-lg bg-panel border-wire/10 border text-sm text-white font-medium shadow-glass">
                      {item.medicine} {item.dose}
                    </span>
                  ))}
                  {latestPrescription.items.length > 3 && (
                     <span className="px-3 py-1.5 rounded-lg bg-white/5 border-wire/10 border text-sm text-mist font-medium">
                       +{latestPrescription.items.length - 3} more
                     </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-wire/10">
                  <span className="text-sm text-mist block mb-1">Status</span>
                  <div className="flex items-center gap-2">
                     <Clock className="w-3.5 h-3.5 text-sky" />
                     <strong className="text-white">{latestPrescription.durationDays - differenceInDays(today, parseISO(latestPrescription.startDate))} Days Left</strong>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-wire/10">
                  <span className="text-sm text-mist block mb-1">Issued</span>
                  <strong className="text-white">{new Date(latestPrescription.startDate).toLocaleDateString()}</strong>
                </div>
              </div>

              <div className="mt-auto relative z-10">
                {latestPrescription.doctorNote && (
                  <p className="text-sm text-mist mb-5 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <span className="line-clamp-2">{latestPrescription.doctorNote}</span>
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button className="action-btn !py-2 !px-4 !bg-white !text-slate-900 border-none shadow-[0_4px_14px_rgba(255,255,255,0.2)]" onClick={(e) => { e.stopPropagation(); onNavigate('medicines'); }}>View Medicines</button>
                  <button className="ghost-btn !py-2 !px-4" onClick={(e) => { e.stopPropagation(); onNavigate('prescriptions'); }}>View History</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-8 relative z-10 text-center">
              <FileSignature className="w-12 h-12 text-mist mb-4 opacity-50" />
              <p className="text-white font-medium mb-1">No Active Tracks</p>
              <p className="text-mist text-sm mb-6">Your current treatment plan has concluded.</p>
              <button className="ghost-btn" onClick={(e) => { e.stopPropagation(); onNavigate('prescriptions'); }}>View Past Prescriptions</button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 border border-wire/5">
        <h2 className="section-title mb-6 border-b border-wire/10 pb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button className="h-16 flex items-center gap-3 px-4 rounded-xl bg-white/5 border border-wire/10 hover:bg-white/10 hover:border-wire/20 transition-colors text-white font-medium text-sm group">
            <FileOutput className="w-5 h-5 text-sky group-hover:scale-110 transition-transform" />
            Share EMR
          </button>
          <button className="h-16 flex items-center gap-3 px-4 rounded-xl bg-white/5 border border-wire/10 hover:bg-white/10 hover:border-wire/20 transition-colors text-white font-medium text-sm group" onClick={() => onNavigate('records')}>
            <LayoutList className="w-5 h-5 text-neon group-hover:scale-110 transition-transform" />
            Health Summary
          </button>
          <button className="h-16 flex items-center gap-3 px-4 rounded-xl bg-white/5 border border-wire/10 hover:bg-white/10 hover:border-wire/20 transition-colors text-white font-medium text-sm group" onClick={() => onNavigate('appointments')}>
            <Calendar className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            Add Appointment
          </button>
          <button className="h-16 flex items-center gap-3 px-4 rounded-xl bg-white/5 border border-wire/10 hover:bg-white/10 hover:border-wire/20 transition-colors text-white font-medium text-sm group">
            <Upload className="w-5 h-5 text-mist group-hover:scale-110 transition-transform" />
            Upload Report
          </button>
          <button className="h-16 flex items-center gap-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors text-rose-300 font-medium text-sm group" onClick={() => onNavigate('nfc')}>
            <ShieldAlert className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Emergency QR
          </button>
        </div>
      </div>
    </div>
  );
}

