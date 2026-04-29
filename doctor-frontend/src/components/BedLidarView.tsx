import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { API_BASE_URL, getAuthHeader } from '../lib/api';

type BedStatus = 'occupied' | 'available' | 'cleaning';
interface BedState { id: string; ward: string; status: BedStatus; patientId?: string; patientName?: string; patientAge?: number; patientGender?: string; }
type PopupStep = 'idle' | 'enter-id' | 'confirm' | 'discharge' | 'details';

const INITIAL_BEDS: BedState[] = [
  { id:'101', ward:'WARD-4B', status:'occupied',  patientId:'10G'   },
  { id:'102', ward:'WARD-4B', status:'occupied',  patientId:'10S'   },
  { id:'103', ward:'WARD-4D', status:'occupied',  patientId:'10B'   },
  { id:'104', ward:'WARD-4B', status:'occupied',  patientId:'10S'   },
  { id:'105', ward:'WARD-4C', status:'occupied',  patientId:'10G'   },
  { id:'106', ward:'WARD-4B', status:'cleaning'                     },
  { id:'107', ward:'WARD-4B', status:'cleaning'                     },
  { id:'108', ward:'WARD-4B', status:'occupied',  patientId:'10G'   },
  { id:'109', ward:'WARD-4A', status:'available'                    },
  { id:'110', ward:'WARD-4A', status:'available'                    },
  { id:'111', ward:'WARD-4A', status:'available'                    },
  { id:'112', ward:'WARD-4B', status:'occupied',  patientId:'10R'   },
  { id:'113', ward:'WARD-4B', status:'occupied',  patientId:'10G'   },
  { id:'114', ward:'WARD-4A', status:'cleaning'                     },
  { id:'115', ward:'WARD-4A', status:'cleaning'                     },
  { id:'116', ward:'WARD-4B', status:'occupied',  patientId:'10R'   },
  { id:'117', ward:'WARD-4A', status:'cleaning'                     },
  { id:'118', ward:'WARD-4S', status:'occupied',  patientId:'AKXLL' },
  { id:'119', ward:'WARD-4B', status:'cleaning'                     },
];

const WARDS = ['All','WARD-4A','WARD-4B','WARD-4C','WARD-4D','WARD-4S'];

const S = {
  occupied:  { color:'#f97316', bg:'rgba(249,115,22,0.08)',  border:'rgba(249,115,22,0.22)',  label:'Occupied'  },
  available: { color:'#52ff9d', bg:'rgba(82,255,157,0.06)',  border:'rgba(82,255,157,0.20)',  label:'Available' },
  cleaning:  { color:'#83d4ff', bg:'rgba(131,212,255,0.06)', border:'rgba(131,212,255,0.20)', label:'Cleaning'  },
};

function BedIcon({ color }: { color: string }) {
  return (
    <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
      <rect x="1" y="9" width="36" height="13" rx="3" fill={color} fillOpacity=".14" stroke={color} strokeWidth="1.4"/>
      <rect x="1" y="1" width="7" height="20" rx="2" fill={color} fillOpacity=".22" stroke={color} strokeWidth="1"/>
      <rect x="5" y="3" width="26" height="6" rx="2" fill={color} fillOpacity=".22" stroke={color} strokeWidth="1"/>
      <line x1="35.5" y1="11" x2="35.5" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeOpacity=".5"/>
      <line x1="2.5"  y1="11" x2="2.5"  y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeOpacity=".5"/>
    </svg>
  );
}

const NEON   = '#52ff9d';
const MUTED  = '#8ca1b4';
const BORDER = 'rgba(108,156,204,0.12)';
const CARD   = 'rgba(8,26,43,0.65)';
const FONT   = '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, sans-serif';

const cardVariants: Variants = {
  hidden:  { opacity:0, y:28 },
  visible: (i:number) => ({ opacity:1, y:0, transition:{ delay: i*0.04, duration:0.4, ease:[0.22,1,0.36,1] } }),
};

export function BedLidarView({ onClose }: { onClose:()=>void }) {
  const [beds, setBeds]               = useState<BedState[]>(INITIAL_BEDS);
  const [ward, setWard]               = useState('All');
  const [activeTab, setActiveTab]     = useState<'overview'|'patients'|'bed-mgmt'|'alerts'>('bed-mgmt');
  const [step, setStep]               = useState<PopupStep>('idle');
  const [selId, setSelId]             = useState('');
  const [meiosisInput, setMInput]     = useState('');
  const [admType, setAdmType]         = useState<'observation'|'hospitalisation'|null>(null);
  const [loading, setLoading]         = useState(true);
  const [lastManualUpdate, setLastManualUpdate] = useState<number>(0);

  // -- Real-time Persistence Sync -----------------------------------------
  useEffect(() => {
    async function load() {
      // If we just made a manual change, wait a bit longer before trusting cloud (to allow for propagation)
      if (Date.now() - lastManualUpdate < 6000) return;
      
      setLoading(true);
      try {
        // Fetch admissions and patients in parallel
        const [cloudRes, patientsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/patients/admissions/all`, { headers: getAuthHeader() }),
          fetch(`${API_BASE_URL}/patients`, { headers: getAuthHeader() }).then(r => r.json())
        ]);
        
        const cloud = cloudRes.ok ? await cloudRes.json() : [];

        const patientMap = new Map();
        if (Array.isArray(patientsRes)) {
          patientsRes.forEach(p => patientMap.set(p.meiosisId || p.universalCode || p.id, p));
        }

        setBeds(prev => prev.map(b => {
          const match = cloud.find((c: any) => c.admissionBed === b.id && c.admissionWard === b.ward);
          if (match) {
            const p = patientMap.get(match.meiosisId || match.universalCode || match.id) || match;
            return { 
              ...b, 
              status: 'occupied', 
              patientId: match.meiosisId || match.universalCode || match.id,
              patientName: p?.name,
              patientAge: p?.age,
              patientGender: p?.gender
            };
          }
          return { ...b, status: b.status === 'occupied' ? 'available' : b.status, patientId: undefined, patientName: undefined };
        }));
      } catch (err) {
        console.error("Load failed", err);
      }
      setLoading(false);
    }
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  const selBed = beds.find(b => b.id === selId);
  const view   = ward === 'All' ? beds : beds.filter(b => b.ward === ward);
  const occ    = beds.filter(b => b.status === 'occupied').length;
  const avail  = beds.filter(b => b.status === 'available').length;
  const clean  = beds.filter(b => b.status === 'cleaning').length;

  function clickBed(bed: BedState) {
    if (bed.status === 'available') { 
      setSelId(bed.id); setMInput(''); setAdmType(null); setStep('enter-id'); 
    }
    else if (bed.status === 'occupied') { 
      setSelId(bed.id); setMInput(bed.patientId||''); setStep('details'); 
    }
  }

  async function confirmAssign() {
    if (!admType||!meiosisInput.trim()) return;
    
    // Optimistically update bed state
    const newBeds: BedState[] = beds.map(b => b.id===selId ? {...b,status:'occupied' as BedStatus,patientId:meiosisInput} : b);
    setBeds(newBeds);
    setLastManualUpdate(Date.now());
    
    // 1. Sync to Backend Prisma
    await fetch(`${API_BASE_URL}/patients/${meiosisInput}/admission`, {
      method: 'PATCH',
      headers: getAuthHeader(),
      body: JSON.stringify({
        medicalStatus: admType,
        admissionBed: selId,
        admissionWard: selBed?.ward || ''
      })
    });

    // 2. Legacy LocalStorage support for EMR Timeline
    localStorage.setItem(`admission_${meiosisInput}`, JSON.stringify({
      type:admType, bed:selId, ward:selBed?.ward, timestamp:new Date().toISOString(), meiosisId:meiosisInput,
    }));

    // 3. Resolve name immediately for the UI
    try {
      const res = await fetch(`${API_BASE_URL}/patients/profile?id=${meiosisInput}`, { headers: getAuthHeader() });
      if (res.ok) {
        const p = await res.json();
        if (p?.name) {
          setBeds(prev => prev.map(b => b.id === selId ? { ...b, patientName: p.name, patientAge: p.age, patientGender: p.gender } : b));
        }
      }
    } catch (err) {
       console.error("Name resolution failed", err);
    }
    
    setStep('idle');
  }

  async function confirmDischarge() {
    const pid = selBed?.patientId;
    setBeds(p => p.map(b => b.id===selId ? {...b,status:'available',patientId:undefined} : b));
    setLastManualUpdate(Date.now());
    
    // 1. Sync to Backend Prisma
    if (pid) {
      await fetch(`${API_BASE_URL}/patients/${pid}/admission`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({
          medicalStatus: 'normal',
          admissionBed: null,
          admissionWard: null
        })
      });
    }

    // 2. Legacy LocalStorage support
    if (pid) localStorage.removeItem(`admission_${pid}`);
    
    setStep('idle');
  }

  const TABS = ['overview','patients','bed-mgmt','alerts'] as const;
  const TAB_LABELS = { overview:'Overview', patients:'Patients', 'bed-mgmt':'Bed Mgmt', alerts:'Alerts' };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background:'#04111d', fontFamily:FONT }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom:`1px solid ${BORDER}`, background:'rgba(3,21,37,0.98)', backdropFilter:'blur(16px)' }}>
        <span className="text-sm font-black tracking-[.18em] uppercase" style={{ color:NEON }}>Meiosis</span>
        <nav className="flex items-center gap-1">
          {TABS.map(t => {
            const active = activeTab===t;
            return (
              <button key={t} onClick={()=>setActiveTab(t)}
                className="relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
                style={{ color:active?NEON:MUTED, background:active?'rgba(82,255,157,0.07)':'transparent', borderBottom:active?`2px solid ${NEON}`:'2px solid transparent' }}>
                {TAB_LABELS[t]}
                {t==='alerts' && <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[7px] font-black" style={{ background:'#ef4444', color:'#fff' }}>3</span>}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background:NEON }} />
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color:MUTED }}>Live</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-105"
            style={{ border:`1px solid ${BORDER}`, color:MUTED, background:CARD }}>
            <X size={13}/>
          </button>
        </div>
      </div>

      {/* ── Stats + Ward filter ── */}
      <div className="flex items-center gap-0 px-6 shrink-0" style={{ borderBottom:`1px solid ${BORDER}`, background:'rgba(3,21,37,0.6)' }}>
        {[
          { label:'Total', val:beds.length, col:MUTED },
          { label:'Occupied', val:occ, col:'#f97316' },
          { label:'Available', val:avail, col:'#52ff9d' },
          { label:'Cleaning', val:clean, col:'#83d4ff' },
          { label:'Occupancy', val:`${Math.round(occ/beds.length*100)}%`, col:NEON },
        ].map((s,i) => (
          <div key={s.label} className="flex items-baseline gap-2 py-3 pr-6 mr-6"
            style={{ borderRight: i<4 ? `1px solid ${BORDER}` : 'none' }}>
            <span className="text-lg font-black" style={{ color:s.col }}>{s.val}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color:MUTED }}>{s.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-auto py-3">
          {WARDS.map(w => (
            <button key={w} onClick={()=>setWard(w)}
              className="px-3 py-1 rounded-lg text-[10px] font-semibold tracking-wide transition-all"
              style={{ background:ward===w?'rgba(82,255,157,0.1)':'transparent', border:`1px solid ${ward===w?NEON:BORDER}`, color:ward===w?NEON:MUTED }}>
              {w==='All'?'All Wards':w}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bed Grid ── */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <motion.div layout className="grid gap-3" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))' }}>
          <AnimatePresence mode="popLayout">
          {view.map((bed, i) => {
            const cfg = S[bed.status];
            const clickable = bed.status !== 'cleaning';
            return (
              <motion.div key={bed.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => clickable && clickBed(bed)}
                className="rounded-xl p-4 flex flex-col gap-3 select-none"
                style={{ background:CARD, border:`1px solid ${cfg.border}`, backdropFilter:'blur(12px)', cursor:clickable?'pointer':'default' }}
                whileHover={clickable ? { scale:1.02, boxShadow:`0 0 0 1px ${cfg.color}44, 0 10px 28px rgba(0,0,0,0.35)` } : {}}>

                {/* Icon + Status */}
                <div className="flex items-center justify-between">
                  <BedIcon color={cfg.color}/>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase"
                    style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background:cfg.color }}/>
                    {cfg.label}
                  </span>
                </div>

                {/* Bed info */}
                <div>
                  <div className="text-sm font-black" style={{ color:'#f8fafc' }}>Bed {bed.id}</div>
                  <div className="text-[11px] font-medium mt-0.5" style={{ color:MUTED }}>{bed.ward}</div>
                </div>

                {/* Patient row */}
                {bed.status==='occupied' && bed.patientId && (
                  <div className="flex flex-col gap-1 pt-2" style={{ borderTop:`1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium" style={{ color:MUTED }}>Patient</span>
                      <span className="text-[10px] font-black" style={{ color:'#f8fafc' }}>#{bed.patientId}</span>
                    </div>
                    {bed.patientName && (
                      <div className="text-[11px] font-bold truncate" style={{ color:NEON }}>{bed.patientName}</div>
                    )}
                  </div>
                )}
                {bed.status==='available' && (
                  <div className="text-[10px] font-semibold" style={{ color:'rgba(82,255,157,0.45)' }}>Tap to assign →</div>
                )}
                {bed.status==='cleaning' && (
                  <div className="text-[10px] font-semibold" style={{ color:'rgba(131,212,255,0.45)' }}>Being cleaned</div>
                )}
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Popup ── */}
      <AnimatePresence>
        {step!=='idle' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background:'rgba(3,17,29,0.8)', backdropFilter:'blur(12px)' }}>
            <motion.div
              layoutId="bed-popup"
              initial={{ scale:0.9, opacity:0, y:16 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.9, opacity:0, y:16 }}
              transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
              className="w-full max-w-[400px] rounded-2xl p-6 flex flex-col gap-5"
              style={{ background:'rgba(5,18,32,0.99)', border:`1px solid ${BORDER}`, boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }}>

              {step==='enter-id' && (<>
                <div>
                  <p className="text-[10px] font-bold tracking-[.14em] uppercase mb-2" style={{ color:MUTED }}>Assign Patient</p>
                  <h2 className="text-lg font-black" style={{ color:'#f8fafc' }}>Bed {selBed?.id} <span style={{ color:NEON }}>·</span> {selBed?.ward}</h2>
                  <p className="text-xs mt-1 font-medium" style={{ color:MUTED }}>Enter the patient's Meiosis ID</p>
                </div>
                <input autoFocus value={meiosisInput} onChange={e=>setMInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&meiosisInput.trim())setStep('confirm');}}
                  placeholder="e.g. 12345678"
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all"
                  style={{ background:'rgba(3,21,37,0.8)', border:`1px solid ${meiosisInput.trim()?NEON:BORDER}`, color:'#f8fafc' }}/>
                <div className="flex gap-3">
                  <button onClick={()=>setStep('idle')} className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                    style={{ border:`1px solid ${BORDER}`, color:MUTED, background:'transparent' }}>Cancel</button>
                  <button onClick={()=>{if(meiosisInput.trim())setStep('confirm');}} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background:meiosisInput.trim()?NEON:'rgba(82,255,157,0.08)', color:meiosisInput.trim()?'#031525':'rgba(82,255,157,0.35)', border:'none' }}>Next →</button>
                </div>
              </>)}

              {step==='confirm' && (<>
                <div>
                  <p className="text-[10px] font-bold tracking-[.14em] uppercase mb-2" style={{ color:MUTED }}>Confirm Admission</p>
                  <h2 className="text-base font-black" style={{ color:'#f8fafc' }}>Patient <span style={{ color:NEON }}>#{meiosisInput}</span></h2>
                  <p className="text-xs mt-1 font-medium" style={{ color:MUTED }}>Bed {selId} · {selBed?.ward}</p>
                </div>
                <div className="flex gap-3">
                  {(['observation','hospitalisation'] as const).map(t=>(
                    <button key={t} onClick={()=>setAdmType(t)}
                      className="flex-1 py-4 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5"
                      style={{ border:`1px solid ${admType===t?NEON:BORDER}`, background:admType===t?'rgba(82,255,157,0.07)':'rgba(3,21,37,0.5)', color:admType===t?NEON:MUTED }}>
                      <span className="text-xl">{t==='observation'?'👁':'🏥'}</span>
                      <span className="tracking-wide">{t==='observation'?'Observation':'Hospitalisation'}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setStep('enter-id')} className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                    style={{ border:`1px solid ${BORDER}`, color:MUTED, background:'transparent' }}>← Back</button>
                  <button disabled={!admType} onClick={confirmAssign} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background:admType?NEON:'rgba(82,255,157,0.08)', color:admType?'#031525':'rgba(82,255,157,0.3)', border:'none', opacity:admType?1:.6 }}>
                    Confirm ✓
                  </button>
                </div>
              </>)}

              {step==='details' && (<>
                <div>
                  <p className="text-[10px] font-bold tracking-[.14em] uppercase mb-2" style={{ color:NEON }}>Patient Profile</p>
                  <h2 className="text-xl font-black" style={{ color:'#f8fafc' }}>{selBed?.patientName || 'Loading...'}</h2>
                  <p className="text-xs mt-1 font-medium" style={{ color:MUTED }}>Meiosis ID: #{selBed?.patientId}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                   <div>
                      <span className="text-[9px] font-bold text-mist/50 uppercase tracking-widest">Age</span>
                      <p className="text-sm font-bold text-white">{selBed?.patientAge || '—'} Yrs</p>
                   </div>
                   <div>
                      <span className="text-[9px] font-bold text-mist/50 uppercase tracking-widest">Gender</span>
                      <p className="text-sm font-bold text-white">{selBed?.patientGender || '—'}</p>
                   </div>
                   <div>
                      <span className="text-[9px] font-bold text-mist/50 uppercase tracking-widest">Bed</span>
                      <p className="text-sm font-bold text-white">{selBed?.id}</p>
                   </div>
                   <div>
                      <span className="text-[9px] font-bold text-mist/50 uppercase tracking-widest">Ward</span>
                      <p className="text-sm font-bold text-white">{selBed?.ward}</p>
                   </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button onClick={()=>setStep('idle')} className="flex-1 py-3 rounded-xl text-xs font-semibold"
                    style={{ border:`1px solid ${BORDER}`, color:MUTED, background:'transparent' }}>Close</button>
                  <button onClick={()=>setStep('discharge')} className="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
                    style={{ background:'rgba(249,115,22,0.1)', color:'#f97316', border:'1px solid rgba(249,115,22,0.2)' }}>Discharge →</button>
                </div>
              </>)}

              {step==='discharge' && (<>
                <div>
                  <p className="text-[10px] font-bold tracking-[.14em] uppercase mb-2" style={{ color:'#f97316' }}>Discharge Patient</p>
                  <h2 className="text-base font-black" style={{ color:'#f8fafc' }}>Confirm Discharge</h2>
                  <p className="text-xs mt-1 font-medium" style={{ color:MUTED }}>Patient: {selBed?.patientName} (#{selBed?.patientId})</p>
                </div>
                <p className="text-xs leading-relaxed font-medium" style={{ color:MUTED }}>
                  This will release the bed and remove the patient's admission status from all records.
                </p>
                <div className="flex gap-3">
                  <button onClick={()=>setStep('details')} className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                    style={{ border:`1px solid ${BORDER}`, color:MUTED, background:'transparent' }}>Cancel</button>
                  <button onClick={confirmDischarge} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background:'#f97316', color:'#fff', border:'none' }}>Discharge ✓</button>
                </div>
              </>)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
