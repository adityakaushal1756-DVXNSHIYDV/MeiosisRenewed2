import React from 'react';
import { Brain, Lock, HardDrive, Zap, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../store/useStore';
import { StatusDot, Button } from './ui';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, icon, actions }: HeaderProps) {
  const { isClinicOpen, setActiveView } = useStore();

  return (
    <header className="flex-shrink-0 h-16 border-b border-white/[0.06] bg-black/30 backdrop-blur-md flex items-center justify-between px-6 z-40">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-[15px] font-black text-primary leading-none">{title}</h1>
          {subtitle && <p className="text-[10px] text-muted mt-0.5 uppercase tracking-widest font-medium">{subtitle}</p>}
        </div>
      </div>

      {/* Center: Optional actions */}
      {actions && <div className="flex items-center gap-3">{actions}</div>}

      {/* Right: Status Bar */}
      <div className="flex items-center gap-4">
        {/* Search hint */}
        <button
          onClick={() => setActiveView('search')}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-muted hover:text-primary hover:border-white/10 transition-all text-xs"
        >
          <Search size={13} />
          <span>Patient Search</span>
          <kbd className="font-mono bg-white/[0.05] px-1.5 py-0.5 rounded text-[9px]">Alt+S</kbd>
        </button>

        <div className="hidden xl:flex items-center gap-5 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <StatusItem dot="green" label="Intelligence Active" />
          <StatusItem icon={<Brain size={11} />} label="Console V4.2" />
          <StatusItem icon={<Lock size={11} />} label="Encrypted" />
          <StatusItem icon={<HardDrive size={11} />} label="Cache Ready" />
        </div>

        <div className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-default',
          isClinicOpen
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        )}>
          <Zap size={12} fill="currentColor" />
          {isClinicOpen ? 'Open' : 'Closed'}
        </div>
      </div>
    </header>
  );
}

function StatusItem({ dot, icon, label }: { dot?: 'green' | 'blue'; icon?: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted font-medium">
      {dot ? <StatusDot color={dot} /> : <span className="opacity-50">{icon}</span>}
      <span>{label}</span>
    </div>
  );
}
