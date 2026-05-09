import { lazy, Suspense, useState } from 'react';
import {
  Home, ClipboardList, Calendar, Pill, User2,
  ChevronLeft, QrCode
} from 'lucide-react';
import { useAuth } from './lib/auth';
import { usePatientProfile } from './hooks/usePatientProfile';

const DashboardPage    = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const RecordsPage      = lazy(() => import('./pages/RecordsPage').then(m => ({ default: m.RecordsPage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const MedicinesPage    = lazy(() => import('./pages/MedicinesPage').then(m => ({ default: m.MedicinesPage })));
const PrescriptionsPage = lazy(() => import('./pages/PrescriptionsPage').then(m => ({ default: m.PrescriptionsPage })));
const SettingsPage     = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const MyQrPage         = lazy(() => import('./pages/MyQrPage').then(m => ({ default: m.MyQrPage })));
const NetworkPage      = lazy(() => import('./pages/NetworkPage').then(m => ({ default: m.NetworkPage })));
const MessagesPage     = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const NfcPage          = lazy(() => import('./pages/NfcPage').then(m => ({ default: m.NfcPage })));

type Section = 'home' | 'records' | 'appointments' | 'medicines' | 'prescriptions'
             | 'settings' | 'myqr' | 'network' | 'messages' | 'nfc';

const NAV_ITEMS: { key: Section; label: string; icon: React.ComponentType<{size?: number | string}> }[] = [
  { key: 'home',         label: 'Home',    icon: Home },
  { key: 'records',      label: 'Records', icon: ClipboardList },
  { key: 'appointments', label: 'Visits',  icon: Calendar },
  { key: 'medicines',    label: 'Meds',    icon: Pill },
  { key: 'myqr',         label: 'My QR',   icon: QrCode },
];

const PAGE_META: Partial<Record<Section, { title: string; sub: string }>> = {
  home:         { title: 'Patient Console', sub: 'MEIOSIS Health OS' },
  records:      { title: 'Health Records',  sub: 'Clinical history & timeline' },
  appointments: { title: 'Appointments',    sub: 'Visits & consultations' },
  medicines:    { title: 'Medicines',       sub: 'Active medication schedule' },
  prescriptions:{ title: 'Prescriptions',  sub: 'Treatment tracks' },
  settings:     { title: 'Settings',        sub: 'Account & preferences' },
  myqr:         { title: 'My QR',           sub: 'Patient identity card' },
  network:      { title: 'Doctor Network',  sub: 'Your care providers' },
  messages:     { title: 'Messages',        sub: 'Clinical communications' },
  nfc:          { title: 'Emergency QR',    sub: 'Emergency health access' },
};

const PRIMARY_SECTIONS: Section[] = ['home','records','appointments','medicines','myqr'];

function LoadingScreen() {
  return (
    <div className="m-loading">
      <div className="m-spinner" />
      <p style={{ color: 'var(--mist)', fontSize: 'var(--text-sm)' }}>Syncing patient identity...</p>
    </div>
  );
}

export default function App() {
  const [section, setSection] = useState<Section>('home');
  const { session, isLoading: authLoading } = useAuth();
  const { data, isLoading: dataLoading, error, refresh } = usePatientProfile(session?.patientId);

  const isSyncing = authLoading || (session && dataLoading && !data);
  const meta = PAGE_META[section] ?? { title: section, sub: '' };
  const isSubPage = !PRIMARY_SECTIONS.includes(section);

  const navigate = (s: string) => setSection(s as Section);

  if (isSyncing) return <LoadingScreen />;

  if (!authLoading && !session) return null;

  if (!isSyncing && (error || (session && !data))) {
    return (
      <div className="m-loading">
        <p style={{ color: '#f87171', fontSize: 'var(--text-sm)', textAlign: 'center', padding: '0 32px' }}>
          {error || 'Unable to load profile.'}
        </p>
        <button className="m-btn m-btn-ghost" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!session || !data) return null;

  return (
    <div className="m-shell">
      {/* Fixed top header */}
      <header className="m-header">
        {isSubPage && (
          <button className="m-header-back" onClick={() => setSection('home')} aria-label="Back">
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="m-header-title">
          <h1>{meta.title}</h1>
          <p>{meta.sub}</p>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="m-body">
        <Suspense fallback={
          <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
            <div className="m-spinner" />
          </div>
        }>
          {section === 'home'         && <DashboardPage onNavigate={navigate} data={data} patientId={session.patientId} />}
          {section === 'records'      && <RecordsPage data={data} />}
          {section === 'appointments' && <AppointmentsPage data={data} refresh={refresh} />}
          {section === 'medicines'    && <MedicinesPage data={data} />}
          {section === 'prescriptions'&& <PrescriptionsPage data={data} />}
          {section === 'settings'     && <SettingsPage />}
          {section === 'myqr'         && <MyQrPage data={data} patientId={session.patientId} />}
          {section === 'network'      && <NetworkPage />}
          {section === 'messages'     && <MessagesPage />}
          {section === 'nfc'          && <NfcPage />}
        </Suspense>
      </main>

      {/* Bottom navigation */}
      <nav className="m-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`m-nav-item ${section === key ? 'active' : ''}`}
            onClick={() => navigate(key)}
            aria-label={label}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
