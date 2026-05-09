import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { Header } from '../components/Header';
import { GlassCard, Badge } from '../components/ui';
import { clsx } from 'clsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DEMO_APPOINTMENTS: Record<string, { time: string; name: string; type: 'new' | 'followup'; id: string }[]> = {
  '9': [
    { time: '10:00 AM', name: 'Priya Sharma', type: 'new', id: 'APT-440' },
    { time: '11:00 AM', name: 'Meena Pillai', type: 'followup', id: 'APT-441' },
  ],
  '12': [
    { time: '2:00 PM', name: 'Rahul Mehta', type: 'new', id: 'APT-445' },
  ],
  '15': [
    { time: '9:30 AM', name: 'Sunita Rao', type: 'followup', id: 'APT-448' },
    { time: '11:30 AM', name: 'Arvind Joshi', type: 'new', id: 'APT-449' },
    { time: '3:00 PM', name: 'Kiran Shah', type: 'followup', id: 'APT-450' },
  ],
};

export function CalendarPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectedApts = DEMO_APPOINTMENTS[String(selectedDay)] || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Medical Calendar" subtitle="Appointment scheduling overview" icon={<Calendar size={16} />} />
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Calendar Grid */}
        <div className="w-[380px] flex-shrink-0 border-r border-white/[0.06] p-5 flex flex-col">
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-secondary transition-all">
              <ChevronLeft size={16} />
            </button>
            <h3 className="font-black text-primary">{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-secondary transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted py-1">{d}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasApts = !!DEMO_APPOINTMENTS[String(day)];
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={clsx(
                    'aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative',
                    isSelected && 'bg-green-500 text-black font-black shadow-lg shadow-green-500/30',
                    !isSelected && isToday && 'border border-green-500/40 text-green-400 font-bold',
                    !isSelected && !isToday && 'hover:bg-white/[0.05] text-secondary font-medium'
                  )}
                >
                  {day}
                  {hasApts && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-green-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail */}
        <div className="flex-1 overflow-y-auto custom-scroll p-5">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="text-lg font-black text-primary">
              {MONTHS[month]} {selectedDay}, {year}
            </h3>
            {selectedApts.length > 0 && <Badge variant="green">{selectedApts.length} appointments</Badge>}
          </div>

          {selectedApts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center text-muted mb-4">
                <Calendar size={24} />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-secondary">No Appointments</p>
              <p className="text-xs text-muted mt-1">This day has no scheduled appointments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedApts.map(apt => (
                <GlassCard key={apt.id} className="p-4 card-hover">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-primary">{apt.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={11} className="text-muted" />
                        <span className="text-xs font-mono text-muted">{apt.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apt.type === 'new' ? 'blue' : 'gray'}>{apt.type === 'new' ? 'New' : 'Follow-up'}</Badge>
                      <span className="text-[10px] font-mono text-muted">{apt.id}</span>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
