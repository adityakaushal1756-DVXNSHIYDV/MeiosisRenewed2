import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommandDashboard } from './components/Dashboard/CommandDashboard';
import { AuditDashboard } from './components/Dashboard/AuditDashboard';
import { LayoutGrid, ShieldAlert, UserCircle2, Loader2, ShieldCheck, Power } from 'lucide-react';

const queryClient = new QueryClient();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'COMMAND' | 'AUDIT'>('COMMAND');

  useEffect(() => {
    const checkSession = () => {
      const params = new URLSearchParams(window.location.search);
      const sessionStr = params.get('session');
      
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          setUser(session);
          setRole(session.role);
          localStorage.setItem('meiosis_staff_session', sessionStr);
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error('Failed to parse session');
        }
      } else {
        const saved = localStorage.getItem('meiosis_staff_session') || localStorage.getItem('meiosis_auth_session_v1');
        if (saved) {
          try {
            const session = JSON.parse(saved);
            setUser(session);
            setRole(session.role);
          } catch (e) {}
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <Loader2 className="text-purple-500 animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-[32px] flex items-center justify-center mb-6 border border-red-500/20 text-red-500">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-mist/40 max-w-xs mb-8">Please login through the main portal to access the clinical console.</p>
        <button 
          onClick={() => window.location.href = '/staff-login.html'}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
        >
          Return to Gateway
        </button>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-[#0A0F1E] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 flex flex-col items-center py-8 border-r border-white/5 bg-black/40 backdrop-blur-xl z-50">
          <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-purple-500/20 mb-12">
            M
          </div>
          
          <nav className="flex-1 space-y-6">
            <SidebarIcon 
              icon={<LayoutGrid size={22} />} 
              active={view === 'COMMAND'} 
              onClick={() => setView('COMMAND')}
            />
            <SidebarIcon 
              icon={<ShieldAlert size={22} />} 
              active={view === 'AUDIT'} 
              onClick={() => setView('AUDIT')}
            />
          </nav>

          <div className="space-y-6">
            <SidebarIcon icon={<Power size={22} className="text-red-500/60" />} />
          </div>
        </aside>

        {/* Main View Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {view === 'COMMAND' ? <CommandDashboard /> : <AuditDashboard />}
        </div>
      </div>
    </QueryClientProvider>
  );
}

function SidebarIcon({ icon, active, onClick }: { icon: React.ReactNode, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${active ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-mist/20 hover:text-white hover:bg-white/5'}`}>
      {icon}
    </div>
  );
}

