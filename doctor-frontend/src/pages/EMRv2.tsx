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
}

export default function EMRv2({ patientId, darkMode, timelineTheme = 'default', timelineLayout = 'advanced', timelineZoom = 1, inline = false, accessLevel }: EMRv2Props) {
  const pageBg = timelineTheme === 'dashboard-dark'
    ? 'linear-gradient(180deg, var(--doctor-bg-start, #06111d) 0%, var(--doctor-bg-end, #10263d) 100%)'
    : darkMode
    ? '#091e38'
    : '#f5f5f3';
  return (
    <div
      style={{
        position: inline ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: inline ? undefined : 20,
        background: pageBg || '#06111d',
      }}
    >
      <TimelineView patientId={patientId} darkMode={darkMode} timelineTheme={timelineTheme} timelineLayout={timelineLayout} timelineZoom={timelineZoom} accessLevel={accessLevel} />
    </div>
  );
}
