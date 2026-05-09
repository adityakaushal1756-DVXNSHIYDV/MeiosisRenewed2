import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Search, Database, AlertTriangle, Eye, FileText, Settings } from 'lucide-react';
import { Header } from '../components/Header';
import { GlassCard, Badge, Button, Input } from '../components/ui';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';

type AuditCategory = 'ALL' | 'ACCESS' | 'TRANSCRIPT' | 'SYSTEM';

interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actionType: string;
  resourceId: string;
  resourceType: string;
  summary: string;
  category: 'ACCESS' | 'TRANSCRIPT' | 'SYSTEM';
  severity?: 'deletion' | 'financial' | 'normal';
}

const ACTION_BADGES: Record<string, { variant: 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'gray'; label: string }> = {
  'QR_SCAN': { variant: 'blue', label: 'QR Scan' },
  'RECORD_ACCESS': { variant: 'blue', label: 'Record Access' },
  'TRANSCRIPT_CREATED': { variant: 'green', label: 'Transcript' },
  'BILLING_RECORD_DELETED': { variant: 'amber', label: 'Deletion ⚠' },
  'FINANCIAL_EDIT': { variant: 'amber', label: 'Financial Edit ⚠' },
  'SYSTEM_LOGIN': { variant: 'gray', label: 'Login' },
  'SYSTEM_LOGOUT': { variant: 'gray', label: 'Logout' },
  'PATIENT_REGISTERED': { variant: 'green', label: 'Registered' },
};

export function AuditPage() {
  const { session } = useStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<AuditCategory>('ALL');
  const [search, setSearch] = useState('');
  const [totalEvents, setTotalEvents] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const doctorId = session?.doctorId;
      if (!doctorId) { setLoading(false); return; }
      const res = await api.get(`/audit/logs?doctorId=${doctorId}&limit=100`);
      const raw = res.data?.logs || res.data || [];
      setLogs(raw);
      setTotalEvents(res.data?.total || raw.length);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [session]);

  const filtered = logs
    .filter(l => category === 'ALL' || l.category === category)
    .filter(l => !search || l.actorId?.toLowerCase().includes(search.toLowerCase()) || l.resourceId?.toLowerCase().includes(search.toLowerCase()) || l.summary?.toLowerCase().includes(search.toLowerCase()));

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }); }
    catch { return ts; }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Security & Audit Ledger"
        subtitle="Real-time DPDP compliance tracking"
        icon={<ShieldCheck size={16} />}
        actions={
          <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={fetchLogs}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col h-full overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-white/[0.06] flex items-center gap-3 flex-wrap">
          {(['ALL', 'ACCESS', 'TRANSCRIPT', 'SYSTEM'] as AuditCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={clsx(
                'px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                category === cat ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-white/[0.04] border border-white/[0.06] text-muted hover:border-white/20 hover:text-secondary'
              )}
            >
              {cat}
            </button>
          ))}
          <div className="ml-auto w-64">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search actor, target, or ID..."
                className="input-base w-full py-1.5 pl-9 pr-3 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Log Table */}
        <div className="flex-1 overflow-y-auto custom-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted">
              <RefreshCw size={20} className="animate-spin mr-2" />
              <span className="text-sm">Loading audit trail...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Database size={36} className="text-muted mb-3 opacity-40" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-muted">NO AUDIT TRAILS FOUND</p>
              <p className="text-xs text-muted/50 mt-1 italic">This clinic's ledger is currently clear.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0A0F14]/90 backdrop-blur-md z-10">
                <tr className="border-b border-white/[0.06]">
                  {['Timestamp', 'Actor', 'Action', 'Resource ID', 'Summary'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const actionMeta = ACTION_BADGES[log.actionType] || { variant: 'gray' as const, label: log.actionType };
                  const isDeletion = log.severity === 'deletion' || log.actionType?.includes('DELETE');
                  const isFinancial = log.severity === 'financial' || log.actionType?.includes('FINANCIAL');
                  return (
                    <tr
                      key={log.id || i}
                      className={clsx(
                        'audit-row',
                        (isDeletion || isFinancial) && 'deletion'
                      )}
                    >
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted whitespace-nowrap">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-semibold text-secondary">{log.actorName || '—'}</p>
                        <p className="text-[9px] font-mono text-muted">{log.actorId || '—'}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={(isDeletion || isFinancial) ? 'amber' : actionMeta.variant}>
                          {(isDeletion || isFinancial) && <AlertTriangle size={9} className="inline mr-0.5" />}
                          {actionMeta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted">{log.resourceId || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-secondary max-w-xs truncate">{log.summary || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer bar */}
        <div className="px-6 py-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-muted font-mono">
          <div className="flex items-center gap-6">
            <span>TOTAL EVENTS<br /><strong className="text-primary text-sm">{totalEvents}</strong></span>
            <span>SECURITY LEVEL<br /><strong className="text-blue-400 text-sm">High</strong></span>
            <span>AUDIT CYCLE<br /><strong className="text-green-400 text-sm">Real-time</strong></span>
          </div>
          <span>NODE CLUSTER: VERCEL-LAMBDA-04</span>
        </div>
      </div>
    </div>
  );
}
