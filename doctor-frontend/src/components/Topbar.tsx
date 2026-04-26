import { Bell, Building2, CalendarDays, Clock3, Moon, Sparkles, SunMedium, WifiOff, Wifi } from 'lucide-react';
import type { SyncStatus } from '../hooks/useOfflineSync';

interface TopbarProps {
  doctorName: string;
  clinicStatus: string;
  currentTime: string;
  notifications: number;
  darkMode: boolean;
  onToggleTheme: () => void;
  onToggleNotifications: () => void;
  onOpenCalendar: () => void;
  liveCount?: number;
  compact?: boolean;
  isOnline?: boolean;
  syncStatus?: SyncStatus;
  pendingCount?: number;
  onOpenYourClinic: () => void;
}

export function Topbar({ doctorName, clinicStatus, currentTime, notifications, darkMode, onToggleTheme, onToggleNotifications, onOpenCalendar, onOpenYourClinic, liveCount = 0, compact = false, isOnline = true, syncStatus = 'online', pendingCount = 0 }: TopbarProps) {
  return (
    <header className={`glass-card topbar-shell relative isolate overflow-hidden px-5 transition-[padding,transform,background-color,border-color] duration-200 ease-out ${compact ? 'py-2.5' : 'py-4'}`}>
      <div className={`relative flex flex-col gap-3 transition-[min-height,gap] duration-200 ease-out xl:flex-row xl:flex-nowrap xl:items-center xl:justify-between ${compact ? 'xl:min-h-[52px]' : 'xl:min-h-[84px]'}`}>
        <div className="min-w-0 xl:flex-1">
          <div className={`flex flex-wrap items-center gap-2 overflow-hidden transition-[opacity,max-height,margin] duration-150 ease-out ${compact ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'}`}>
            <p className="text-xs uppercase tracking-[0.26em] text-neon/70">MEIOSIS Doctor Dashboard</p>
            <span className="chip border-wire/10 bg-white/[0.04] text-white/75">
              <Sparkles size={12} />
              Smart clinical overview
            </span>
          </div>

          <div className={`flex flex-wrap items-center gap-3 transition-[margin] duration-200 ease-out ${compact ? 'mt-0' : 'mt-3'}`}>
            <h1 className={`bg-gradient-to-r from-white via-white to-neon/70 bg-clip-text font-semibold tracking-tight text-transparent transition-[font-size,line-height] duration-200 ease-out ${compact ? 'text-lg' : 'text-2xl'}`}>
              Dr. {doctorName}
            </h1>
            <span className="chip chip-green">{clinicStatus}</span>
            {liveCount > 0 && (
              <span className="chip border-neon/40 bg-neon/[0.12] font-semibold text-neon">
                <span className="live-dot" />
                {liveCount === 1 ? '1 live consult' : `${liveCount} live consults`}
              </span>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-2 transition-[gap] duration-200 ease-out xl:flex-nowrap ${compact ? 'gap-2' : 'gap-3'}`}>
          <div className={`rounded-[24px] border border-wire/10 bg-white/[0.04] transition-[padding] duration-200 ease-out ${compact ? 'px-3 py-1.5' : 'px-4 py-3'}`}>
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span className={`chip chip-blue justify-center tabular-nums transition-[min-width,padding] duration-200 ease-out ${compact ? 'min-w-[150px]' : 'min-w-[180px]'}`}>
                <Clock3 size={14} />
                {currentTime}
              </span>
              {isOnline && syncStatus !== 'syncing' && pendingCount === 0 ? (
                <span className={`chip border-wire/10 bg-white/[0.03] text-white/80 overflow-hidden whitespace-nowrap transition-[opacity,max-width,padding,border-color] duration-150 ease-out ${compact ? 'max-w-0 border-transparent px-0 opacity-0' : 'max-w-[120px] opacity-100'}`}>
                  <Wifi size={14} />
                  Online
                </span>
              ) : !isOnline ? (
                <span className={`chip border-amber-400/35 bg-amber-400/10 text-amber-200 overflow-hidden whitespace-nowrap transition-[opacity,max-width,padding,border-color] duration-150 ease-out ${compact ? 'max-w-0 border-transparent px-0 opacity-0' : 'max-w-[120px] opacity-100'}`}>
                  <WifiOff size={14} />
                  Offline{pendingCount > 0 ? ` (${pendingCount})` : ''}
                </span>
              ) : (
                <span className={`chip border-neon/30 bg-neon/10 text-neon overflow-hidden whitespace-nowrap transition-[opacity,max-width,padding,border-color] duration-150 ease-out ${compact ? 'max-w-0 border-transparent px-0 opacity-0' : 'max-w-[120px] opacity-100'}`}>
                  <Wifi size={14} className="animate-pulse" />
                  Syncing…
                </span>
              )}
            </div>
          </div>
          <button onClick={onToggleTheme} className={`ghost-btn min-w-[48px] px-3 transition-[padding,transform,background-color,border-color] duration-200 ease-out ${compact ? 'py-2' : ''}`} aria-label="Toggle theme">
            {darkMode ? <SunMedium size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={onOpenYourClinic} className={`ghost-btn gap-2 whitespace-nowrap px-4 transition-[padding,transform,background-color,border-color] duration-200 ease-out ${compact ? 'py-2' : ''}`} aria-label="Open your clinic">
            <Building2 size={16} />
            <span className={`${compact ? 'hidden' : 'inline'}`}>Your Clinic</span>
          </button>
          <button onClick={onOpenCalendar} className={`ghost-btn gap-2 whitespace-nowrap px-4 transition-[padding,transform,background-color,border-color] duration-200 ease-out ${compact ? 'py-2' : ''}`} aria-label="Open calendar">
            <CalendarDays size={16} />
            <span className={`${compact ? 'hidden' : 'inline'}`}>Calendar</span>
          </button>
          <button
            onClick={onToggleNotifications}
            className={`relative min-w-[52px] whitespace-nowrap px-3 transition-[padding,transform,background-color,border-color,color] duration-200 ease-out ${notifications > 0 ? 'ghost-btn !border-amber-400/35 !bg-amber-400/10 !text-amber-200' : 'ghost-btn'} ${compact ? 'py-2' : ''}`}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className={`${compact ? 'hidden' : 'inline'}`}>Notifications</span>
            {notifications > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-950">
                {notifications}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
