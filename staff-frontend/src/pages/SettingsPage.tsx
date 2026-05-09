import React from 'react';
import { Settings, User, Bell, Shield, Database, Monitor, Globe, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { GlassCard, Badge, Button } from '../components/ui';
import { useStore } from '../store/useStore';

const SETTING_GROUPS = [
  {
    label: 'Account',
    icon: <User size={16} />,
    color: 'bg-blue-500/10 text-blue-400',
    items: ['Profile Information', 'Change Password', 'Two-Factor Authentication'],
  },
  {
    label: 'Notifications',
    icon: <Bell size={16} />,
    color: 'bg-amber-500/10 text-amber-400',
    items: ['Queue Alerts', 'Appointment Reminders', 'Billing Notifications'],
  },
  {
    label: 'Privacy & Security',
    icon: <Shield size={16} />,
    color: 'bg-red-500/10 text-red-400',
    items: ['Session Timeout', 'Audit Log Access', 'Data Export'],
  },
  {
    label: 'Display',
    icon: <Monitor size={16} />,
    color: 'bg-purple-500/10 text-purple-400',
    items: ['Dense Data Mode', 'Color Scheme', 'Font Size'],
  },
  {
    label: 'System',
    icon: <Database size={16} />,
    color: 'bg-green-500/10 text-green-400',
    items: ['Local Cache', 'Offline Mode', 'Data Sync'],
  },
];

export function SettingsPage() {
  const { session, privacyMode, togglePrivacyMode, isClinicOpen, toggleClinicStatus } = useStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" subtitle="Console configuration" icon={<Settings size={16} />} />
      <div className="flex-1 overflow-y-auto custom-scroll p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Session Info */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 text-xl font-black">
                {session?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <p className="font-black text-primary">{session?.name || 'Staff Member'}</p>
                <p className="text-sm text-secondary capitalize">{session?.role?.toLowerCase() || 'Reception'}</p>
                <p className="text-xs font-mono text-muted">{session?.email || '—'}</p>
              </div>
              <div className="ml-auto">
                <Badge variant="green">Active Session</Badge>
              </div>
            </div>
          </GlassCard>

          {/* Quick Toggles */}
          <GlassCard className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Quick Controls</p>
            <div className="space-y-3">
              <ToggleRow
                label="Clinic Status"
                description={isClinicOpen ? 'Clinic is currently open for patients' : 'Clinic is closed'}
                active={isClinicOpen}
                onToggle={toggleClinicStatus}
                activeColor="text-green-400"
              />
              <ToggleRow
                label="Privacy Mode"
                description="Blur sensitive patient information in the UI"
                active={privacyMode}
                onToggle={togglePrivacyMode}
                activeColor="text-amber-400"
              />
            </div>
          </GlassCard>

          {/* Setting Groups */}
          {SETTING_GROUPS.map(group => (
            <GlassCard key={group.label} className="overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${group.color}`}>
                  {group.icon}
                </div>
                <h3 className="text-sm font-bold text-primary">{group.label}</h3>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {group.items.map(item => (
                  <button key={item} className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-all text-left">
                    <span className="text-sm text-secondary">{item}</span>
                    <ChevronRight size={14} className="text-muted" />
                  </button>
                ))}
              </div>
            </GlassCard>
          ))}

          {/* Sign out */}
          <Button
            variant="danger"
            className="w-full justify-center"
            onClick={() => { localStorage.clear(); window.location.href = '/staff-login.html'; }}
          >
            Sign Out of Console
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, active, onToggle, activeColor }: { label: string; description: string; active: boolean; onToggle: () => void; activeColor: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-semibold text-primary">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-10 h-5 rounded-full transition-all ${active ? 'bg-green-500/30' : 'bg-white/[0.08]'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${active ? 'left-5 bg-green-400' : 'left-0.5 bg-white/30'}`} />
      </button>
    </div>
  );
}
