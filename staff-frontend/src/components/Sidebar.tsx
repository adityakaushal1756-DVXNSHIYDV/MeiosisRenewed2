import React from 'react';
import {
  LayoutGrid, ListOrdered, Search, UserPlus, Calendar,
  Receipt, ShieldCheck, Settings, Eye, EyeOff, Power,
  ChevronRight, Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore, NavView } from '../store/useStore';
import { StatusDot } from './ui';

interface NavItem { id: NavView; label: string; icon: React.ReactNode; shortcut?: string; }

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={20} />, shortcut: '1' },
  { id: 'queue', label: 'Queue', icon: <ListOrdered size={20} />, shortcut: '2' },
  { id: 'search', label: 'Patient Search', icon: <Search size={20} />, shortcut: 'S' },
  { id: 'registration', label: 'Registration', icon: <UserPlus size={20} />, shortcut: 'N' },
  { id: 'calendar', label: 'Medical Calendar', icon: <Calendar size={20} />, shortcut: '5' },
  { id: 'billing', label: 'Billing & Payments', icon: <Receipt size={20} />, shortcut: 'B' },
  { id: 'audit', label: 'Security Audit', icon: <ShieldCheck size={20} />, shortcut: '7' },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarExpanded, toggleSidebar, privacyMode, togglePrivacyMode, isClinicOpen, toggleClinicStatus, session } = useStore();

  return (
    <aside
      className={clsx(
        'flex flex-col border-r border-white/[0.06] bg-black/50 backdrop-blur-xl z-50 transition-all duration-300 flex-shrink-0',
        sidebarExpanded ? 'w-[220px]' : 'w-[68px]'
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center font-black text-black text-lg shadow-lg shadow-green-500/20 flex-shrink-0">
          M
        </div>
        {sidebarExpanded && (
          <div className="overflow-hidden">
            <p className="text-xs font-black text-primary tracking-tight leading-none">MEIOSIS</p>
            <p className="text-[9px] text-muted font-bold uppercase tracking-[0.15em] mt-0.5">Reception</p>
          </div>
        )}
        <button onClick={toggleSidebar} className="ml-auto text-muted hover:text-primary transition-colors flex-shrink-0">
          <ChevronRight size={14} className={clsx('transition-transform', sidebarExpanded && 'rotate-180')} />
        </button>
      </div>

      {/* Staff Info */}
      {sidebarExpanded && session && (
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03]">
            <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-black flex-shrink-0">
              {session.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-primary truncate">{session.name}</p>
              <p className="text-[10px] text-muted capitalize truncate">{session.role?.toLowerCase()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scroll">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={clsx(
              'nav-item w-full text-left',
              activeView === item.id && 'active',
              sidebarExpanded ? 'flex-row px-3 py-2.5 justify-start gap-3' : 'flex-col py-3'
            )}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {sidebarExpanded ? (
              <span className="text-[13px] font-semibold flex-1">{item.label}</span>
            ) : (
              <span className="text-[8px] font-bold uppercase tracking-wider mt-1 opacity-60">{item.label.split(' ')[0]}</span>
            )}
            {sidebarExpanded && item.shortcut && (
              <span className="text-[9px] font-mono bg-white/[0.05] px-1.5 py-0.5 rounded text-muted">
                {item.id === 'search' ? 'Alt+S' : item.id === 'registration' ? 'Alt+N' : item.id === 'billing' ? 'Alt+B' : item.shortcut}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Controls */}
      <div className="p-2 space-y-0.5 border-t border-white/[0.06]">
        {/* Clinic Status */}
        <button
          onClick={toggleClinicStatus}
          className={clsx(
            'nav-item w-full',
            sidebarExpanded ? 'flex-row px-3 py-2.5 justify-start gap-3' : 'flex-col py-3'
          )}
        >
          <Activity size={16} className={isClinicOpen ? 'text-green-400' : 'text-red-400'} />
          {sidebarExpanded && (
            <span className={clsx('text-[11px] font-bold flex-1', isClinicOpen ? 'text-green-400' : 'text-red-400')}>
              {isClinicOpen ? 'Clinic Open' : 'Clinic Closed'}
            </span>
          )}
          {sidebarExpanded && (
            <StatusDot color={isClinicOpen ? 'green' : 'red'} />
          )}
        </button>

        {/* Privacy */}
        <button
          onClick={togglePrivacyMode}
          className={clsx(
            'nav-item w-full',
            sidebarExpanded ? 'flex-row px-3 py-2.5 justify-start gap-3' : 'flex-col py-3',
            privacyMode && 'text-amber-400'
          )}
        >
          {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
          {sidebarExpanded && <span className="text-[11px] font-bold flex-1">Privacy Mode</span>}
        </button>

        {/* Logout */}
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/staff-login.html'; }}
          className={clsx(
            'nav-item w-full text-red-500/60 hover:text-red-400',
            sidebarExpanded ? 'flex-row px-3 py-2.5 justify-start gap-3' : 'flex-col py-3'
          )}
        >
          <Power size={16} />
          {sidebarExpanded && <span className="text-[11px] font-bold flex-1">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
