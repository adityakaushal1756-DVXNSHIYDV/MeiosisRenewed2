import { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RadialMenu, Section } from './components/RadialMenu';
import { FloatingBackButton } from './components/FloatingBackButton';
import { LoadingFallback } from './components/LoadingFallback';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MyQrPage = lazy(() => import('./pages/MyQrPage').then(m => ({ default: m.MyQrPage })));
const RecordsPage = lazy(() => import('./pages/RecordsPage').then(m => ({ default: m.RecordsPage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const MedicinesPage = lazy(() => import('./pages/MedicinesPage').then(m => ({ default: m.MedicinesPage })));
const PrescriptionsPage = lazy(() => import('./pages/PrescriptionsPage').then(m => ({ default: m.PrescriptionsPage })));
const NetworkPage = lazy(() => import('./pages/NetworkPage').then(m => ({ default: m.NetworkPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NfcPage = lazy(() => import('./pages/NfcPage').then(m => ({ default: m.NfcPage })));

import { useAuth } from './lib/auth';
import { usePatientProfile } from './hooks/usePatientProfile';

function App() {
  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [showFloatingBack, setShowFloatingBack] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollYRef = useRef(0);
  const showFloatingBackRef = useRef(false);

  const { session, isLoading: authLoading } = useAuth();
  const { data, isLoading: dataLoading, error, refresh } = usePatientProfile(session?.patientId);

  // Syncing logic: We are loading if auth is loading OR if we have a session but data isn't here yet
  const isSyncing = authLoading || (session && dataLoading && !data);

  const handleSectionChange = (section: Section) => {
    lastScrollYRef.current = 0;
    showFloatingBackRef.current = false;
    setShowFloatingBack(false);
    setCurrentSection(section);
  };

  // Typography & Theme Engine
  const [theme] = useState(localStorage.getItem('meiosis_theme_v1') || 'super-dark');

  useEffect(() => {
    const font = localStorage.getItem('meiosis_font_v1') || 'plex';
    const fonts: Record<string, string> = {
      plex: "'IBM Plex Sans', sans-serif",
      instrument: "'Instrument Sans', sans-serif",
      outfit: "'Outfit', sans-serif",
      inter: "'Inter', sans-serif",
      manrope: "'Manrope', sans-serif",
      space: "'Space Grotesk', sans-serif"
    };

    const selectedFont = fonts[font] || fonts.plex;
    document.documentElement.style.setProperty('--font-primary', selectedFont);
    document.documentElement.style.setProperty('--font-display', selectedFont);

    // Apply Light Theme class to body if needed
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);
  // Scroll listener for iOS-style back button reveal
  const handleScroll = () => {
    if (!mainRef.current) return;
    const currentScrollY = mainRef.current.scrollTop;
    const lastScrollY = lastScrollYRef.current;
    let nextVisible = showFloatingBackRef.current;
    
    // Reveal on scroll up, hide on scroll down or at top
    if (currentScrollY < lastScrollY && currentScrollY > 120) {
      nextVisible = true;
    } else if (currentScrollY > lastScrollY || currentScrollY <= 60) {
      nextVisible = false;
    }
    
    if (nextVisible !== showFloatingBackRef.current) {
      showFloatingBackRef.current = nextVisible;
      setShowFloatingBack(nextVisible);
    }
    lastScrollYRef.current = currentScrollY;
  };

  // Reset scroll and button state on navigation
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    lastScrollYRef.current = 0;
    showFloatingBackRef.current = false;
  }, [currentSection]);

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-mist text-sm animate-pulse">Syncing patient identity...</p>
      </div>
    );
  }

  if (!authLoading && !session) {
    return null; // Will redirect in useAuth
  }

  if (!isSyncing && (error || (session && !data))) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="glass-card p-6 border-red-500/20 text-center max-w-md">
          <h3 className="text-white font-bold mb-2">Sync Failed</h3>
          <p className="text-mist text-sm mb-4">{error || 'Unable to load profile data.'}</p>
          <button className="action-btn !bg-white/10 !border-white/20 !text-white" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!session || !data) {
    return null;
  }

  return (
    <div className="patient-app-shell min-h-screen bg-ink flex overflow-hidden selection:bg-neon/30 selection:text-neon font-primary" data-doctor-theme={theme}>
      
      {/* Floating Back Button - iOS Overlay Style */}
      <FloatingBackButton
        onBack={() => handleSectionChange('home')}
        visible={currentSection !== 'home'}
      />

      {/* Desktop Sidebar - Re-sync with large screens (xl = 1280px+) */}
      <div className="hidden xl:block">
        <Sidebar
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
          isOpen={false}
          onClose={() => {}}
        />
      </div>

      {/* Radial Navigation Menu - Tablet & Mobile (<1280px, including iPad Air 11") */}
      <div className="xl:hidden">
        <RadialMenu
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
        />
      </div>
      
      <div className="patient-main-shell flex-1 xl:pl-[312px] flex flex-col h-screen overflow-hidden relative">
        {/* Main Content Area */}
        <main 
          ref={mainRef}
          onScroll={handleScroll}
          className="patient-main-scroll flex-1 overflow-y-auto scroll-skin relative z-10 w-full queue-scroll"
        >
          <Suspense fallback={<LoadingFallback />}>
            {currentSection === 'home' && <DashboardPage onNavigate={handleSectionChange} data={data} patientId={session.patientId} />}
            {currentSection === 'records' && <RecordsPage data={data} />}
            {currentSection === 'appointments' && <AppointmentsPage data={data} refresh={refresh} />}
            {currentSection === 'medicines' && <MedicinesPage data={data} />}
            {currentSection === 'prescriptions' && <PrescriptionsPage data={data} />}
            {currentSection === 'network' && <NetworkPage />}
            {currentSection === 'messages' && <MessagesPage />}
            {currentSection === 'myqr' && <MyQrPage data={data} patientId={session.patientId} />}
            {currentSection === 'settings' && <SettingsPage />}
            {currentSection === 'nfc' && <NfcPage />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
