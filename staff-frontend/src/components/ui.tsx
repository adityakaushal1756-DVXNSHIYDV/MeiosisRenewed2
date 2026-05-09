import React from 'react';
import { clsx } from 'clsx';

// ── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'gray';
interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}
export function Badge({ children, variant = 'gray', icon, className }: BadgeProps) {
  return (
    <span className={clsx('badge', `badge-${variant}`, className)}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}

// ── StatusDot ────────────────────────────────────────────────────────────────
type DotColor = 'green' | 'blue' | 'amber' | 'red';
export function StatusDot({ color }: { color: DotColor }) {
  return <span className={clsx('status-dot', `status-dot-${color}`)} />;
}

// ── GlassCard ────────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  hover?: boolean;
  onClick?: () => void;
}
export function GlassCard({ children, className, elevated, hover, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl',
        elevated ? 'glass-elevated' : 'glass-card',
        hover && 'card-hover',
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}
export function Button({ children, variant = 'secondary', size = 'md', icon, loading, className, disabled, ...props }: ButtonProps) {
  const sizes = { sm: 'px-3 py-1.5 text-xs rounded-lg', md: 'px-4 py-2.5 text-sm rounded-xl', lg: 'px-6 py-3 text-base rounded-2xl' };
  const variants: Record<BtnVariant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 cursor-pointer transition-all',
    ghost: 'text-secondary hover:text-primary hover:bg-white/5 cursor-pointer transition-all rounded-xl',
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx('flex items-center gap-2 font-semibold whitespace-nowrap', sizes[size], variants[variant], (disabled || loading) && 'opacity-50 cursor-not-allowed', className)}
    >
      {loading ? <LoaderIcon /> : icon}
      {children}
    </button>
  );
}

function LoaderIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  hint?: string;
  error?: string;
}
export function Input({ label, icon, hint, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <input
          {...props}
          className={clsx(
            'input-base w-full py-2.5 pr-3 text-sm',
            icon ? 'pl-9' : 'pl-3',
            error && 'border-red-500/40',
            className
          )}
        />
      </div>
      {hint && !error && <p className="text-[11px] text-muted">{hint}</p>}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  iconBg?: string;
}
export function SectionHeader({ icon, title, subtitle, badge, action, iconBg = 'bg-green-500/10 text-green-400' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {icon && (
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-primary tracking-tight">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="text-[11px] text-muted font-medium uppercase tracking-widest mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center text-muted mb-4">
        {icon}
      </div>
      <p className="text-sm font-bold uppercase tracking-widest text-secondary mb-1">{title}</p>
      {description && <p className="text-xs text-muted max-w-xs mt-1">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={clsx('skeleton', width, height)} />;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  icon?: React.ReactNode;
  iconBg?: string;
}
export function Modal({ isOpen, onClose, title, subtitle, children, footer, width = 'max-w-lg', icon, iconBg = 'bg-green-500/10 text-green-400' }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 modal-backdrop" />
      <div
        className={clsx('relative w-full glass-elevated rounded-3xl shadow-2xl overflow-hidden animate-fade-in', width)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {icon && <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>{icon}</div>}
            <div>
              <h3 className="font-bold text-primary">{title}</h3>
              {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-secondary transition-all">
            ✕
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh] custom-scroll">{children}</div>
        {footer && <div className="px-6 pb-6 pt-4 border-t border-white/[0.06]">{footer}</div>}
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  monospace?: boolean;
}
export function StatCard({ label, value, sub, icon, iconBg = 'bg-green-500/10 text-green-400', trend, monospace }: StatCardProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        {icon && <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>{icon}</div>}
        {trend && (
          <span className={clsx('text-xs font-bold', trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-secondary')}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">{label}</p>
      <p className={clsx('text-2xl font-black text-primary', monospace && 'font-mono')}>{value}</p>
      {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
    </GlassCard>
  );
}
