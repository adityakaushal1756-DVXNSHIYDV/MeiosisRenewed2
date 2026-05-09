import React, { useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { TriageModal } from './components/TriageModal';
import { useStore } from './store/useStore';
import './index.css';

// ── Lazy-load all page views ─────────────────────────────────────────────────
const DashboardPage   = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const QueuePage       = lazy(() => import('./pages/QueuePage').then(m => ({ default: m.QueuePage })));
const PatientSearchPage = lazy(() => import('./pages/PatientSearchPage').then(m => ({ default: m.PatientSearchPage })));
const RegistrationPage  = lazy(() => import('./pages/RegistrationPage').then(m => ({ default: m.RegistrationPage })));
const CalendarPage    = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const BillingPage     = lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));
const AuditPage       = lazy(() => import('./pages/AuditPage').then(m => ({ default: m.AuditPage })));
const SettingsPage    = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
});

// ── Session Keys ─────────────────────────────────────────────────────────────
const SESSION_KEYS = ['meiosis_staff_session', 'meiosis_auth_session_v1'];

function loadSession() {
  for (const key of SESSION_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
  }
  // Also check URL param
  const url = new URL(window.location.href);
  const sessionParam = url.searchParams.get('session');
  if (sessionParam) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionParam));
      localStorage.setItem('meiosis_staff_session', JSON.stringify(parsed));
      url.searchParams.delete('session');
      window.history.replaceState({}, '', url.toString());
      return parsed;
    } catch {}
  }
  return null;
}

const STAFF_ROLES = ['RECEPTION', 'NURSE', 'REGISTRAR', 'RESIDENT', 'INTERN', 'STAFF', 'ADMIN'];

// ── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const { session, setSession, activeView, setActiveView } = useStore();
  const [loading, setLoading] = React.useState(true);

  // ── Load Session ────────────────────────────────────────────────────────
  useEffect(() => {
    const s = loadSession();
    if (s) setSession(s);
    setLoading(false);
  }, []);

  // ── Global Keyboard Shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Alt + key shortcuts
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n': e.preventDefault(); setActiveView('registration'); break;
          case 'b': e.preventDefault(); setActiveView('billing'); break;
          case 's': e.preventDefault(); setActiveView('search'); break;
        }
      }
      // Esc: close modals via store
      if (e.key === 'Escape') {
        const { closeBilling, closeTriage } = useStore.getState();
        closeBilling();
        closeTriage();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Loading Screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-green-500/30">
            M
          </div>
          <Loader2 className="text-green-400 animate-spin" size={20} />
          <p className="text-sm text-secondary">Loading clinical console...</p>
        </div>
      </div>
    );
  }

  // ── No Session ───────────────────────────────────────────────────────────
  if (!session || !STAFF_ROLES.includes((session.role || '').toUpperCase())) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-400 text-2xl font-black">
          !
        </div>
        <h2 className="text-xl font-black text-primary mb-2">Authentication Required</h2>
        <p className="text-sm text-secondary max-w-xs mb-6">
          Please log in through the clinical staff portal to access this console.
        </p>
        <a
          href="/staff-login.html"
          className="btn-primary px-6 py-3 rounded-xl font-bold text-sm"
        >
          Go to Staff Login →
        </a>
      </div>
    );
  }

  // ── Main Console ─────────────────────────────────────────────────────────
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-[var(--color-bg-base)] overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar />

        {/* Page Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Suspense fallback={<PageLoader />}>
            {activeView === 'dashboard'    && <DashboardPage />}
            {activeView === 'queue'        && <QueuePage />}
            {activeView === 'search'       && <PatientSearchPage />}
            {activeView === 'registration' && <RegistrationPage />}
            {activeView === 'calendar'     && <CalendarPage />}
            {activeView === 'billing'      && <BillingPage />}
            {activeView === 'audit'        && <AuditPage />}
            {activeView === 'settings'     && <SettingsPage />}
          </Suspense>
        </main>

        {/* Global Modals */}
        <TriageModal />

        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </QueryClientProvider>
  );
}

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="text-green-400 animate-spin" size={24} />
    </div>
  );
}
