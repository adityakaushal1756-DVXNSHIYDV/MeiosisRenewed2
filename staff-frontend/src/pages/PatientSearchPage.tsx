import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, User, Phone, Heart, AlertCircle, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { GlassCard, Badge, EmptyState, Input } from '../components/ui';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { clsx } from 'clsx';

interface SearchResult {
  id: string;
  name: string;
  meiosisId: string;
  phone: string;
  email: string;
  bloodGroup?: string;
  medicalStatus?: string;
}

const DEMO_RESULTS: SearchResult[] = [
  { id: 'p1', name: 'Priya Sharma', meiosisId: '99000001', phone: '+91 98765 43210', email: 'priya@mail.com', bloodGroup: 'O+', medicalStatus: 'normal' },
  { id: 'p2', name: 'Rahul Mehta', meiosisId: '99000042', phone: '+91 87654 32109', email: 'rahul@mail.com', bloodGroup: 'B+', medicalStatus: 'normal' },
  { id: 'p3', name: 'Sunita Rao', meiosisId: '99000078', phone: '+91 76543 21098', email: 'sunita@mail.com', bloodGroup: 'A+', medicalStatus: 'hospitalization' },
];

export function PatientSearchPage() {
  const { setSelectedPatientId, openBilling, openTriage } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        // Use demo data for now; real API: api.get(`/patients/search?q=${query}`)
        const filtered = DEMO_RESULTS.filter(
          p => p.name.toLowerCase().includes(query.toLowerCase()) ||
               p.meiosisId.includes(query) ||
               p.phone.includes(query)
        );
        setResults(filtered);
        setActiveIndex(0);
      } catch {
        setResults(DEMO_RESULTS);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIndex]) { setSelectedPatient(results[activeIndex]); }
    if (e.key === ' ' && results[activeIndex]) { e.preventDefault(); setSelectedPatient(p => p?.id === results[activeIndex].id ? null : results[activeIndex]); }
    if (e.key === 'Escape') { setQuery(''); setResults([]); setSelectedPatient(null); }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Patient Search" subtitle="Lookup by name, ID, or phone" icon={<Search size={16} />} />
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Search Panel */}
        <div className="flex flex-col w-full max-w-lg border-r border-white/[0.06]">
          {/* Search Bar */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="relative">
              {loading ? (
                <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />
              ) : (
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search name, Meiosis ID, or phone..."
                className="input-base w-full py-3 pl-9 pr-4 text-sm"
              />
            </div>
            <div className="flex items-center gap-4 mt-2 px-1">
              {[
                { key: '↑↓', hint: 'navigate' },
                { key: 'Enter', hint: 'open' },
                { key: 'Space', hint: 'toggle detail' },
                { key: 'Esc', hint: 'clear' },
              ].map(({ key, hint }) => (
                <span key={key} className="text-[10px] text-muted">
                  <kbd className="font-mono bg-white/[0.05] px-1.5 py-0.5 rounded">{key}</kbd> {hint}
                </span>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto custom-scroll p-2">
            {!query && (
              <EmptyState
                icon={<Search size={24} />}
                title="No Patient Waiting"
                description="Type a name, Meiosis ID, or phone number to search the registry."
              />
            )}
            {query && !loading && results.length === 0 && (
              <EmptyState
                icon={<AlertCircle size={24} />}
                title="No Results Found"
                description={`No patients match "${query}". Try a different name or ID.`}
              />
            )}
            {results.map((p, i) => (
              <div
                key={p.id}
                onClick={() => { setSelectedPatient(p); setActiveIndex(i); }}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group mb-1',
                  activeIndex === i && 'bg-green-500/10 border border-green-500/20',
                  activeIndex !== i && 'hover:bg-white/[0.03] border border-transparent'
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-secondary text-sm font-black flex-shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary truncate">{p.name}</p>
                  <p className="text-[10px] font-mono text-muted">{p.meiosisId} · {p.phone}</p>
                </div>
                {p.medicalStatus === 'hospitalization' && <Badge variant="amber">IP</Badge>}
                <ChevronRight size={14} className="text-muted group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6">
          {selectedPatient ? (
            <PatientDetail patient={selectedPatient} onBill={() => openBilling(selectedPatient.id)} onTriage={() => openTriage(selectedPatient.id)} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyState icon={<User size={28} />} title="Select a Patient" description="Choose a patient from the left panel to view their details." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientDetail({ patient, onBill, onTriage }: { patient: SearchResult; onBill: () => void; onTriage: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/15">
        <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 text-2xl font-black">
          {patient.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-black text-primary">{patient.name}</h2>
          <p className="text-xs font-mono text-muted">{patient.meiosisId}</p>
          <div className="flex items-center gap-2 mt-1">
            {patient.bloodGroup && <Badge variant="red"><Heart size={9} className="inline" /> {patient.bloodGroup}</Badge>}
            {patient.medicalStatus === 'hospitalization' ? <Badge variant="amber">Inpatient</Badge> : <Badge variant="green">Outpatient</Badge>}
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={onTriage} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-secondary text-sm hover:text-primary hover:bg-white/10 transition-all font-semibold">Triage</button>
          <button onClick={onBill} className="px-4 py-2 rounded-xl btn-primary text-sm font-bold">Billing</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Phone', value: patient.phone, mono: true },
          { label: 'Email', value: patient.email, mono: false },
          { label: 'Blood Group', value: patient.bloodGroup || 'N/A', mono: true },
          { label: 'Status', value: patient.medicalStatus || 'Normal', mono: false },
        ].map(({ label, value, mono }) => (
          <GlassCard key={label} className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">{label}</p>
            <p className={clsx('text-sm font-semibold text-primary', mono && 'font-mono')}>{value}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
