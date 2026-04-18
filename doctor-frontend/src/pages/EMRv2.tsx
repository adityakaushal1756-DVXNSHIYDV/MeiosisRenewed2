import { ArrowLeft, PlusCircle } from 'lucide-react';
import { TimelineView } from '../components/EMRv2/TimelineView';

interface EMRv2Props {
  patientId?: string | null;
  darkMode?: boolean;
  timelineTheme?: 'default' | 'dashboard-dark' | 'beige-light';
  timelineLayout?: 'simple' | 'advanced';
  timelineZoom?: number;
  /** When true, renders as a block filling its parent instead of fixed full-screen */
  inline?: boolean;
  accessLevel?: 'full' | 'lab' | 'summary' | null;
  onBack?: () => void;
  onBuildEMR?: () => void;
}

export default function EMRv2({
  patientId,
  darkMode,
  timelineTheme = 'default',
  timelineLayout = 'advanced',
  timelineZoom = 1,
  inline = false,
  accessLevel,
  onBack,
  onBuildEMR,
}: EMRv2Props) {
  const pageBg = timelineTheme === 'dashboard-dark'
    ? 'linear-gradient(180deg, var(--doctor-bg-start, #06111d) 0%, var(--doctor-bg-end, #10263d) 100%)'
    : darkMode
    ? '#091e38'
    : '#f5f5f3';
  const chromeDarkMode = timelineTheme === 'dashboard-dark' ? true : darkMode;
  const buttonBorder = chromeDarkMode
    ? '1px solid var(--doctor-border, rgba(108,156,204,0.12))'
    : '1px solid rgba(148,163,184,0.22)';
  const buttonBg = timelineTheme === 'beige-light'
    ? 'rgba(255,255,255,0.84)'
    : chromeDarkMode
    ? 'color-mix(in srgb, var(--doctor-card-tint, rgba(8,26,43,0.82)) 92%, transparent)'
    : 'rgba(255,255,255,0.9)';
  const buttonColor = timelineTheme === 'beige-light'
    ? '#3f3121'
    : chromeDarkMode
    ? 'var(--doctor-text, #f8fafc)'
    : '#0f172a';
  const buttonShadow = chromeDarkMode
    ? '0 14px 32px rgba(0,0,0,0.24)'
    : '0 10px 24px rgba(37,67,112,0.12)';

  return (
    <div
      style={{
        position: inline ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: inline ? undefined : 20,
        background: pageBg || '#06111d',
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to patient search"
          title="Back to patient search"
          style={{
            position: 'absolute',
            top: 18,
            left: 24,
            zIndex: 5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: buttonBorder,
            background: buttonBg,
            color: buttonColor,
            borderRadius: 14,
            padding: '9px 14px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: buttonShadow,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            if (chromeDarkMode) e.currentTarget.style.background = 'color-mix(in srgb, var(--doctor-accent, #52ff9d) 10%, var(--doctor-card-tint, #081a2b))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = buttonBg;
          }}
        >
          <ArrowLeft size={15} />
          Back
        </button>
      )}

      {onBuildEMR && (
        <button
          type="button"
          onClick={onBuildEMR}
          style={{
            position: 'absolute',
            top: 18,
            left: onBack ? 132 : 24,
            zIndex: 5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--doctor-accent, #52ff9d)',
            background: 'color-mix(in srgb, var(--doctor-accent, #52ff9d) 15%, transparent)',
            color: 'var(--doctor-accent, #52ff9d)',
            borderRadius: 14,
            padding: '9px 16px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 8px 32px rgba(82,255,157,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.background = 'color-mix(in srgb, var(--doctor-accent, #52ff9d) 25%, transparent)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(82,255,157,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.background = 'color-mix(in srgb, var(--doctor-accent, #52ff9d) 15%, transparent)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(82,255,157,0.18)';
          }}
        >
          <PlusCircle size={15} />
          Build EMR
        </button>
      )}
      <TimelineView patientId={patientId} darkMode={darkMode} timelineTheme={timelineTheme} timelineLayout={timelineLayout} timelineZoom={timelineZoom} accessLevel={accessLevel} />
    </div>
  );
}
