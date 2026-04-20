import { ArrowLeft, PlusCircle } from 'lucide-react';
import { TimelineView } from '../components/EMRv2/TimelineView';

interface EMRv2Props {
  patientId?: string | null;
  darkMode?: boolean;
  timelineTheme?: 'default' | 'dashboard-dark' | 'beige-light';
  timelineWarp?: boolean;
  singularityModern?: boolean;
  timelineLayout?: 'simple' | 'advanced';
  timelineZoom?: number;
  setTimelineZoom?: (zoom: number) => void;
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
  timelineWarp = false,
  singularityModern = false,
  timelineLayout = 'advanced',
  timelineZoom = 1,
  setTimelineZoom,
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
      <TimelineView 
        patientId={patientId} 
        darkMode={darkMode} 
        timelineTheme={timelineTheme} 
        timelineWarp={timelineWarp}
        singularityModern={singularityModern}
        timelineLayout={timelineLayout} 
        timelineZoom={timelineZoom} 
        setTimelineZoom={setTimelineZoom} 
        accessLevel={accessLevel} 
        onBack={onBack}
        onBuildEMR={onBuildEMR}
      />
    </div>
  );
}
