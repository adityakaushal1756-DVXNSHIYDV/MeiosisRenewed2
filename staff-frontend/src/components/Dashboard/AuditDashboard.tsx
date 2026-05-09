import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Search, 
  Terminal, 
  Clock, 
  User, 
  ArrowRight, 
  Activity, 
  RefreshCw,
  Filter,
  ShieldCheck,
  ChevronDown,
  Database
} from 'lucide-react';
import { api } from '../../lib/api';

interface AuditLog {
  id: string;
  type: 'ACCESS' | 'TRANSCRIPT' | 'SYSTEM';
  category: string;
  timestamp: string;
  actor: string;
  actorId: string;
  target: string;
  targetId: string;
  detail: string;
}

export function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await api.get('/audit');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(true), 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === 'ALL' || log.type === filterType;
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'ACCESS': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'TRANSCRIPT': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'SYSTEM': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-mist/5 text-mist/40 border-white/5';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E] text-white font-sans">
      {/* Header Section */}
      <div className="p-8 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                Security & Audit Ledger
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </h1>
              <p className="text-xs text-mist/30 font-bold uppercase tracking-widest mt-1">Real-time DPDP Compliance Tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchLogs()}
              className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={18} className="text-mist/40" />
            </button>
            <div className="h-10 w-[300px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-mist/20" size={16} />
              <input 
                type="text" 
                placeholder="Search actor, target, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-mist/20 outline-none focus:border-red-500/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {['ALL', 'ACCESS', 'TRANSCRIPT', 'SYSTEM'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                filterType === type 
                ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' 
                : 'bg-white/5 text-mist/40 border-white/5 hover:bg-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ledger Feed */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-4">
          <AnimatePresence mode='popLayout'>
            {filteredLogs.map((log, index) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:border-red-500/20 hover:bg-white/[0.03] transition-all group relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-1 h-full ${log.type === 'ACCESS' ? 'bg-blue-500' : 'bg-purple-500'}`} />

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getTypeStyle(log.type)}`}>
                        {log.category}
                      </div>
                      <div className="flex items-center gap-2 text-mist/20">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {new Date(log.timestamp).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      {/* Patient Details */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-mist/20 uppercase tracking-[0.2em]">Patient Scanned</p>
                        <h3 className="text-lg font-black text-white group-hover:text-red-400 transition-colors">{log.target}</h3>
                        <p className="text-xs font-mono text-mist/40">{log.targetId}</p>
                      </div>

                      {/* Doctor Details */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-mist/20 uppercase tracking-[0.2em]">Authorized Actor</p>
                        <h3 className="text-lg font-black text-white">{log.actor}</h3>
                        <p className="text-xs font-mono text-mist/40">{log.actorId}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-6">
                      <div className="flex items-center gap-2 text-mist/40">
                        <Terminal size={14} />
                        <span className="text-xs font-medium">{log.detail}</span>
                      </div>
                      <div className="flex-1 h-px bg-white/5" />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/5 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/10">
                          <ShieldCheck size={12} />
                          Integrity Verified
                        </div>
                        <div className="text-[9px] font-mono text-mist/20">
                          ID: {log.id.slice(0, 12)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-mist/20">
              <RefreshCw size={32} className="animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Streaming Security Ledger...</p>
            </div>
          )}

          {!loading && filteredLogs.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
              <Database size={48} className="mb-4" />
              <p className="text-sm font-black uppercase tracking-[0.3em]">No Audit Trails Found</p>
              <p className="text-xs mt-1">This clinic's ledger is currently clear.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <StatBox label="Total Events" value={logs.length} color="text-white" />
          <StatBox label="Security Level" value="High" color="text-emerald-400" />
          <StatBox label="Audit Cycle" value="Real-time" color="text-blue-400" />
        </div>
        <div className="text-[10px] text-mist/20 font-black uppercase tracking-widest">
          Node Cluster: <span className="text-mist/40">Vercel-Lambda-04</span>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-mist/20 uppercase tracking-[0.2em]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}
