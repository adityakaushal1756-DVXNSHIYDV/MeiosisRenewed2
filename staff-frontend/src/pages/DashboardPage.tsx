import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, Users, Clock, TrendingUp, TrendingDown,
  Heart, Activity, Thermometer, IndianRupee, UserCheck,
  RefreshCw, AlertTriangle
} from 'lucide-react';
import { StatCard, GlassCard, SectionHeader, Badge, StatusDot, Button, EmptyState } from '../components/ui';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';

// ── Mock data for demo ─────────────────────────────────────────────────────
const DEMO_PATIENTS = [
  { id: 'p1', name: 'Priya Sharma', meiosisId: '99000001', status: 'waiting', waitMin: 18, bp: '128/84', hr: 76, temp: '98.6°F' },
  { id: 'p2', name: 'Rahul Mehta', meiosisId: '99000042', status: 'with_doctor', waitMin: 0, bp: '115/72', hr: 68, temp: '98.2°F' },
  { id: 'p3', name: 'Sunita Rao', meiosisId: '99000078', status: 'waiting', waitMin: 7, bp: '135/90', hr: 88, temp: '99.1°F' },
  { id: 'p4', name: 'Arvind Joshi', meiosisId: '99000105', status: 'completed', waitMin: 0, bp: '120/80', hr: 72, temp: '98.4°F' },
];

const UPCOMING = [
  { time: '11:00 AM', name: 'Meena Pillai', type: 'Follow-up', id: 'APT-441' },
  { time: '11:30 AM', name: 'Suresh Kumar', type: 'New', id: 'APT-442' },
  { time: '12:00 PM', name: 'Divya Nair', type: 'Follow-up', id: 'APT-443' },
  { time: '12:30 PM', name: 'Kiran Shah', type: 'New', id: 'APT-444' },
];

export function DashboardPage() {
  const { isClinicOpen, openTriage, openBilling } = useStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const waiting = DEMO_PATIENTS.filter(p => p.status === 'waiting').length;
  const withDoc = DEMO_PATIENTS.filter(p => p.status === 'with_doctor').length;
  const completed = DEMO_PATIENTS.filter(p => p.status === 'completed').length;
  const avgWait = Math.round(DEMO_PATIENTS.filter(p => p.waitMin > 0).reduce((a, b) => a + b.waitMin, 0) / (DEMO_PATIENTS.filter(p => p.waitMin > 0).length || 1));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Reception Dashboard"
        subtitle="Real-time clinic overview"
        icon={<LayoutGrid size={16} />}
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-6">
        {/* Date/Time Banner */}
        <div className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/10">
          <div>
            <p className="text-xs text-green-400 font-bold uppercase tracking-widest">Today's Session</p>
            <p className="text-2xl font-black text-primary font-mono">{timeStr}</p>
            <p className="text-sm text-secondary">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot color={isClinicOpen ? 'green' : 'red'} />
            <span className={`text-sm font-bold ${isClinicOpen ? 'text-green-400' : 'text-red-400'}`}>
              Clinic {isClinicOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Waiting" value={waiting} icon={<Clock size={18} />} iconBg="bg-amber-500/10 text-amber-400" sub="In queue" />
          <StatCard label="With Doctor" value={withDoc} icon={<UserCheck size={18} />} iconBg="bg-blue-500/10 text-blue-400" sub="In consultation" />
          <StatCard label="Completed" value={completed} icon={<Activity size={18} />} iconBg="bg-green-500/10 text-green-400" sub="Today" />
          <StatCard label="Avg Wait" value={`${avgWait}m`} icon={<TrendingUp size={18} />} iconBg="bg-purple-500/10 text-purple-400" sub="Minutes" />
        </div>

        {/* Daily Snapshot */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <GlassCard className="p-5 col-span-3 lg:col-span-1">
            <SectionHeader title="Daily Snapshot" subtitle="Operational intelligence" icon={<TrendingUp size={16} />} />
            <div className="space-y-3">
              <SnapshotRow label="Today's Collections" value="₹14,580" sub="+₹2,100 vs yesterday" color="green" />
              <SnapshotRow label="Wait-Time Average" value={`${avgWait} min`} sub="Target: &lt;15 min" color={avgWait <= 15 ? 'green' : 'amber'} />
              <SnapshotRow label="New Patients" value="4" sub="vs 7 follow-ups (36% new)" color="blue" />
              <SnapshotRow label="OPD Revenue" value="₹11,000" sub="Platform fee: ₹140" color="purple" />
            </div>
          </GlassCard>

          {/* Live Queue Cards */}
          <GlassCard className="p-5 col-span-3 lg:col-span-2">
            <SectionHeader
              title="Active Queue"
              subtitle={`${DEMO_PATIENTS.length} patients`}
              icon={<Users size={16} />}
              action={<Button variant="ghost" size="sm" icon={<RefreshCw size={13} />}>Refresh</Button>}
            />
            <div className="space-y-2">
              {DEMO_PATIENTS.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-pointer hover:bg-white/[0.04] ${
                    p.status === 'with_doctor' ? 'border-blue-500/20 bg-blue-500/5 active-patient-card' : 'border-white/[0.06] bg-white/[0.01]'
                  }`}
                >
                  <span className="text-xs font-mono text-muted w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{p.name}</p>
                    <p className="text-[10px] font-mono text-muted">{p.meiosisId}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-[11px] text-muted font-mono">
                    <span><Heart size={11} className="inline mr-1" />{p.hr}</span>
                    <span><Thermometer size={11} className="inline mr-1" />{p.temp}</span>
                  </div>
                  <QueueStatusBadge status={p.status} waitMin={p.waitMin} />
                  <div className="hidden group-hover:flex items-center gap-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => openTriage(p.id)}>Triage</Button>
                    <Button variant="ghost" size="sm" onClick={() => openBilling(p.id)}>Bill</Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Upcoming Appointments */}
        <GlassCard className="p-5">
          <SectionHeader title="Upcoming Appointments" subtitle="Next 4 slots" icon={<Clock size={16} />} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {UPCOMING.map((apt) => (
              <div key={apt.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all">
                <p className="text-xs font-mono text-green-400 font-bold mb-1">{apt.time}</p>
                <p className="text-sm font-bold text-primary">{apt.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant={apt.type === 'New' ? 'blue' : 'gray'}>{apt.type}</Badge>
                  <span className="text-[10px] font-mono text-muted">{apt.id}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function SnapshotRow({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = { green: 'text-green-400', blue: 'text-blue-400', amber: 'text-amber-400', purple: 'text-purple-400' };
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <div>
        <p className="text-xs font-semibold text-secondary">{label}</p>
        <p className="text-[10px] text-muted" dangerouslySetInnerHTML={{ __html: sub }} />
      </div>
      <p className={`text-base font-black font-mono ${colorMap[color]}`}>{value}</p>
    </div>
  );
}

function QueueStatusBadge({ status, waitMin }: { status: string; waitMin: number }) {
  if (status === 'waiting') return <Badge variant="amber"><Clock size={9} className="inline" /> {waitMin}m wait</Badge>;
  if (status === 'with_doctor') return <Badge variant="blue">With Doctor</Badge>;
  if (status === 'completed') return <Badge variant="green">Done</Badge>;
  return <Badge>—</Badge>;
}
