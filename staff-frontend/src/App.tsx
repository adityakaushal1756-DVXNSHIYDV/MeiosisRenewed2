import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, HardHat, Construction, Loader2, UserCircle2, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommandDashboard } from './components/Dashboard/CommandDashboard';

const queryClient = new QueryClient();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
        const saved = localStorage.getItem('meiosis_staff_session');
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
          onClick={() => window.location.href = '/login.html'}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
        >
          Return to Gateway
        </button>
      </div>
    );
  }

  // If role is RECEPTION or NURSE, show the Command Center
  if (['RECEPTION', 'NURSE'].includes(role)) {
    return (
      <QueryClientProvider client={queryClient}>
        <CommandDashboard />
      </QueryClientProvider>
    );
  }

  const roleLabels: Record<string, string> = {
    'REGISTRAR': 'Registrar Intelligence',
    'RESIDENT': 'Resident Workspace',
    'INTERN': 'Intern Training Hub'
  };

  const currentLabel = roleLabels[role] || 'Staff Portal';

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col font-sans overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 p-8 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-purple-500/20">M</div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Meiosis <span className="text-purple-400">OS</span></h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-mist/40 uppercase tracking-[0.2em]">Clinical Core v2.4</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl pl-4 pr-2 py-2">
          <div className="text-right">
            <p className="text-xs font-bold text-white">{user.name}</p>
            <p className="text-[10px] text-mist/40 font-medium uppercase tracking-wider">{role}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <UserCircle2 size={24} />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
          <div className="relative mb-12 flex justify-center">
            <motion.div animate={{ rotate: [0, 5, -5, 0], y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-600 rounded-[40px] flex items-center justify-center shadow-2xl relative z-20">
              <Construction size={56} className="text-white" strokeWidth={1.5} />
            </motion.div>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            {currentLabel} <br/>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Under Construction</span>
          </h2>
          <p className="text-mist/50 text-lg max-w-lg mx-auto leading-relaxed mb-12">
            We're architecting a high-performance clinical environment for <span className="text-white font-semibold">{role}s</span>.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
