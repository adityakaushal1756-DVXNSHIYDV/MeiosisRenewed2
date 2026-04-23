import { ArrowLeft, PlusCircle } from 'lucide-react';
import { TimelineView } from '../components/EMRv2/TimelineView';
import type { Patient } from '../types/Patient';

interface EMRv2Props {
  patient?: Patient | null;
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
  prescriptionLayout?: 'classic' | 'wide';
}

export default function EMRv2({
  patient,
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
  prescriptionLayout = 'classic',
}: EMRv2Props) {
  const pageBg = timelineTheme === 'dashboard-dark'
    ? 'linear-gradient(180deg, var(--doctor-bg-start, #06111d) 0%, var(--doctor-bg-end, #10263d) 100%)'
    : darkMode
    ? '#091e38'
    : '#f5f5f3';
  const chromeDarkMode = timelineTheme === 'dashboard-dark' ? true : darkMode;

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
        patient={patient}
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
        prescriptionLayout={prescriptionLayout}
      />
    </div>
  );
}
