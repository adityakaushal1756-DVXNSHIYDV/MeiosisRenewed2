import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Link,
  ShieldPlus,
  Search,
  X,
  UserPlus,
  Check,
  Stethoscope,
  Building2,
  Mail,
  CircleDollarSign,
  Star,
  Clock,
  Loader2,
  UserMinus,
  ChevronRight,
} from 'lucide-react';
import { API_BASE_URL, getAuthHeader } from '../lib/api';
import { loadAuthSession } from '../lib/auth';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  clinicName?: string;
  clinicAddress?: string;
  email?: string;
  phone?: string;
  consultFee: number;
  rating: number;
  workingHours?: string;
  qualification?: string;
  yearsExperience?: number;
  meiosisId?: string;
  isLinked?: boolean;
  linkedAt?: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const SPECIALTY_COLORS: Record<string, string> = {
  Cardiology:       'from-rose-500/20 to-red-500/10 border-rose-500/20 text-rose-300',
  Neurology:        'from-violet-500/20 to-purple-500/10 border-violet-500/20 text-violet-300',
  Endocrinology:    'from-cyan-500/20 to-sky-500/10 border-cyan-500/20 text-cyan-300',
  'Primary Care':   'from-emerald-500/20 to-green-500/10 border-emerald-500/20 text-emerald-300',
  'General Medicine': 'from-emerald-500/20 to-green-500/10 border-emerald-500/20 text-emerald-300',
  Dermatology:      'from-pink-500/20 to-fuchsia-500/10 border-pink-500/20 text-pink-300',
  Orthopedics:      'from-amber-500/20 to-yellow-500/10 border-amber-500/20 text-amber-300',
  Pediatrics:       'from-orange-500/20 to-amber-500/10 border-orange-500/20 text-orange-300',
  Virology:         'from-teal-500/20 to-cyan-500/10 border-teal-500/20 text-teal-300',
};

function specialtyClass(specialty: string): string {
  return (
    SPECIALTY_COLORS[specialty] ??
    'from-sky-500/20 to-indigo-500/10 border-sky-500/20 text-sky-300'
  );
}

/* ---------- Doctor Card (in network list) ---------- */
function DoctorCard({ doc, onRemove }: { doc: Doctor; onRemove: (id: string) => void }) {
  const [removing, setRemoving] = useState(false);
  const cls = specialtyClass(doc.specialty);
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-wire/10 hover:border-wire/20 transition-all flex flex-col sm:flex-row gap-5">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cls} border flex items-center justify-center text-lg font-bold shrink-0`}>
        {initials(doc.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="text-base font-bold text-white truncate">{doc.name}</h3>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-300 shrink-0">
            <Star className="w-3 h-3 fill-amber-300" />
            {doc.rating?.toFixed(1)}
          </span>
        </div>
        <p className="text-sm text-sky mb-2">{doc.specialty}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs text-mist">
          {doc.clinicName && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {doc.clinicName}
            </span>
          )}
          {!doc.clinicName && doc.hospital && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {doc.hospital}
            </span>
          )}
          {doc.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {doc.email}
            </span>
          )}
          {doc.consultFee != null && (
            <span className="flex items-center gap-1">
              <CircleDollarSign className="w-3.5 h-3.5" /> ₹{doc.consultFee}
            </span>
          )}
          {doc.workingHours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {doc.workingHours}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-400/20 bg-red-400/5 text-red-300 text-xs font-medium hover:bg-red-400/10 transition-all disabled:opacity-50"
            disabled={removing}
            onClick={async () => {
              setRemoving(true);
              await onRemove(doc.id);
              setRemoving(false);
            }}
          >
            {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Popup doctor card (in search results) ---------- */
function SearchDoctorCard({ doc, onAdd }: { doc: Doctor; onAdd: (d: Doctor) => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(doc.isLinked ?? false);
  const cls = specialtyClass(doc.specialty);

  useEffect(() => setAdded(doc.isLinked ?? false), [doc.isLinked]);

  const handleAdd = async () => {
    if (added) return;
    setAdding(true);
    await onAdd(doc);
    setAdded(true);
    setAdding(false);
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all ${added ? 'bg-neon/5 border-neon/20' : 'bg-white/[0.02] border-wire/10 hover:border-wire/20'}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cls} border flex items-center justify-center text-sm font-bold shrink-0`}>
          {initials(doc.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{doc.name}</h3>
              <p className="text-xs text-sky">{doc.specialty}</p>
            </div>
            <button
              disabled={added || adding}
              onClick={handleAdd}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all disabled:opacity-60 ${
                added
                  ? 'border border-neon/30 bg-neon/10 text-neon'
                  : 'border border-sky/30 bg-sky/10 text-sky hover:bg-sky/20'
              }`}
            >
              {adding ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : added ? (
                <Check className="w-3 h-3" />
              ) : (
                <UserPlus className="w-3 h-3" />
              )}
              {added ? 'In Network' : 'Add'}
            </button>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[11px] text-mist">
            {(doc.clinicName || doc.hospital) && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {doc.clinicName || doc.hospital}
              </span>
            )}
            {doc.email && (
              <span className="flex items-center gap-1 max-w-[160px] truncate">
                <Mail className="w-3 h-3 shrink-0" />
                {doc.email}
              </span>
            )}
            {doc.consultFee != null && (
              <span className="flex items-center gap-1">
                <CircleDollarSign className="w-3 h-3" />
                ₹{doc.consultFee}
              </span>
            )}
            {doc.qualification && (
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                {doc.qualification}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              {doc.rating?.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Add Doctor Popup ---------- */
function AddDoctorPopup({
  patientId,
  onClose,
  onLinked,
}: {
  patientId: string;
  onClose: () => void;
  onLinked: (doc: Doctor) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch on mount (show all doctors) and on query change
  const fetchSearch = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE_URL}/network/search?q=${encodeURIComponent(query)}&patientId=${encodeURIComponent(patientId)}`;
        const res = await fetch(url, { headers: getAuthHeader() });
        if (!res.ok) throw new Error('Search failed');
        const data: Doctor[] = await res.json();
        setResults(data);
      } catch {
        setError('Could not load doctors. Check your connection.');
      } finally {
        setLoading(false);
      }
    },
    [patientId]
  );

  useEffect(() => {
    fetchSearch('');
    inputRef.current?.focus();
  }, [fetchSearch]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSearch(q), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, fetchSearch]);

  const handleAdd = async (doc: Doctor) => {
    try {
      const res = await fetch(`${API_BASE_URL}/network/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ patientId, doctorId: doc.id }),
      });
      if (!res.ok) throw new Error();
      // Mark as linked in results list too
      setResults((prev) => prev.map((d) => d.id === doc.id ? { ...d, isLinked: true } : d));
      onLinked({ ...doc, isLinked: true });
    } catch {
      // silently fail; the button won't set `added`
      throw new Error('Link failed');
    }
  };

  // Close on backdrop click
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', background: 'rgba(4,12,24,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-[28px] sm:rounded-[28px] border border-wire/15 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, rgba(8,22,40,0.98) 0%, rgba(5,14,28,0.96) 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-wire/10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Add a Doctor</h2>
            <p className="text-sm text-mist mt-0.5">Search by name, specialty, clinic, or email</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-wire/15 bg-white/5 flex items-center justify-center text-mist hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctor..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-wire/10 text-white placeholder:text-mist/50 text-sm focus:outline-none focus:border-sky/30 focus:bg-white/[0.06] transition-all"
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 min-h-0">
          {error && (
            <div className="text-sm text-red-300 text-center py-8">{error}</div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="text-sm text-mist text-center py-10 flex flex-col items-center gap-3">
              <Stethoscope className="w-8 h-8 opacity-30" />
              No doctors found{q ? ` for "${q}"` : ''}.
            </div>
          )}
          {results.map((doc) => (
            <SearchDoctorCard key={doc.id} doc={doc} onAdd={handleAdd} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Main NetworkPage ---------- */
export function NetworkPage() {
  const session = loadAuthSession();
  const patientId = session?.patientId ?? '';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const fetchDoctors = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/network/doctors/${encodeURIComponent(patientId)}`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error();
      const data: Doctor[] = await res.json();
      setDoctors(data);
    } catch {
      setError('Failed to load your doctor network.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleRemove = async (doctorId: string) => {
    try {
      await fetch(`${API_BASE_URL}/network/unlink`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ patientId, doctorId }),
      });
      setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
    } catch {
      /* silently noop */
    }
  };

  const handleLinked = (doc: Doctor) => {
    setDoctors((prev) => {
      if (prev.find((d) => d.id === doc.id)) return prev;
      return [{ ...doc, linkedAt: new Date().toISOString() }, ...prev];
    });
  };

  const specialties = [...new Set(doctors.map((d) => d.specialty))];

  return (
    <>
      {showPopup && patientId && (
        <AddDoctorPopup
          patientId={patientId}
          onClose={() => setShowPopup(false)}
          onLinked={handleLinked}
        />
      )}

      <div className="patient-page patient-network-page p-4 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto min-h-full flex flex-col gap-8">
        <header className="patient-page-header mt-2 shrink-0">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Doctor Network</h1>
          <p className="text-mist">Connected care team and referral control</p>
        </header>

        {/* Stats Grid */}
        <div className="kpi-grid">
          <div className="glass-card p-5 border border-wire/10 border-t-sky/30 text-center">
            <h3 className="text-3xl font-bold text-white mb-1">{loading ? '—' : doctors.length}</h3>
            <p className="text-sm font-medium text-white">Connected Doctors</p>
            <p className="text-xs text-mist mt-1">Profiles linked</p>
          </div>
          <div className="glass-card p-5 border border-wire/10 border-t-sky/30 text-center">
            <h3 className="text-3xl font-bold text-white mb-1">{loading ? '—' : specialties.length}</h3>
            <p className="text-sm font-medium text-white">Specialties</p>
            <p className="text-xs text-mist mt-1">Areas of care</p>
          </div>
          <div className="glass-card p-5 border border-wire/10 border-t-sky/30 text-center col-span-2 md:col-span-1 max-[820px]:hidden">
            <h3 className="text-3xl font-bold text-white mb-1">{loading ? '—' : doctors.length > 0 ? 'Active' : 'None'}</h3>
            <p className="text-sm font-medium text-white">Care Status</p>
            <p className="text-xs text-mist mt-1">Active care team</p>
          </div>

          {/* Second Opinion button */}
          <div className="glass-card p-5 border border-neon/30 bg-neon/5 hover:bg-neon/10 transition-colors cursor-pointer flex flex-col justify-center items-center text-center group">
            <ShieldPlus className="w-6 h-6 text-neon mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-bold text-white mb-1">Second Opinion</h3>
            <p className="text-xs text-mist">Request specialist review</p>
          </div>

          {/* Mobile Add Doctor button */}
          <div 
            className="glass-card p-5 border border-neon/30 bg-neon/5 hover:bg-neon/10 transition-colors cursor-pointer flex flex-col justify-center items-center text-center group min-[821px]:hidden"
            onClick={() => setShowPopup(true)}
          >
            <UserPlus className="w-6 h-6 text-neon mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-bold text-white mb-1">Add Doctor</h3>
            <p className="text-xs text-mist">Expand your care team</p>
          </div>
        </div>

        {/* Doctors List */}
        <div className="glass-card p-6 border border-wire/10 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="section-title">Your Doctors</h2>
              <p className="text-mist text-sm">Ratings, availability, and quick actions in one place.</p>
            </div>
            <button
              className="action-btn !py-2 !px-4 flex items-center gap-2 max-[820px]:hidden"
              onClick={() => setShowPopup(true)}
            >
              <UserPlus className="w-4 h-4" />
              Add Doctor
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-mist/50">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Loading your care team…</span>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-12 text-red-300 text-sm">
              {error}{' '}
              <button className="underline" onClick={fetchDoctors}>Retry</button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && doctors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sky/10 border border-sky/20 flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-sky/60" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg mb-1">No doctors yet</p>
                <p className="text-mist text-sm max-w-xs">
                  Add your first doctor to build your personal care team and enable cross-doctor EMR access.
                </p>
              </div>
              <button
                className="action-btn !py-2 !px-5 flex items-center gap-2"
                onClick={() => setShowPopup(true)}
              >
                <UserPlus className="w-4 h-4" />
                Add your first doctor
              </button>
            </div>
          )}

          {/* Doctors grid */}
          {!loading && !error && doctors.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <DoctorCard key={doc.id} doc={doc} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </div>

        {/* Access notice */}
        {!loading && doctors.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl border border-sky/10 bg-sky/5 flex items-center gap-3 shrink-0">
            <Link className="w-4 h-4 text-sky shrink-0" />
            <p className="text-xs text-mist">
              All linked doctors can access your EMR according to the share settings you configure in{' '}
              <strong className="text-white">Settings → Share Control</strong>.
            </p>
            <ChevronRight className="w-4 h-4 text-mist shrink-0 ml-auto" />
          </div>
        )}
      </div>
    </>
  );
}
