import { useMemo } from 'react';
import { Bone, Brain, ChevronDown, ChevronUp, Droplets, Flame, Heart, Wind } from 'lucide-react';
import type { TimelineEvent } from './EMRTimeline';
import type { Patient } from '../../types/Patient';

interface BodySystem {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  keywords: string[];
  zone: { cx: number; cy: number; rx: number; ry: number };
  iconPos: { top: number; left: number };
  icon: React.ReactNode;
}

export const BODY_SYSTEMS: BodySystem[] = [
  {
    id: 'neural',
    label: 'Neurological',
    shortLabel: 'Neuro',
    color: '#8B5CF6',
    keywords: ['neuro', 'brain', 'headache', 'migraine', 'seizure', 'psychiatric', 'anxiety', 'depression', 'mental', 'vertigo', 'dizziness'],
    zone: { cx: 70, cy: 20, rx: 16, ry: 18 },
    iconPos: { top: 8, left: 78 },
    icon: <Brain size={13} />,
  },
  {
    id: 'cardiac',
    label: 'Cardiac',
    shortLabel: 'Cardiac',
    color: '#EF4444',
    keywords: ['cardiac', 'heart', 'arrhythmia', 'hypertension', 'blood pressure', 'cholesterol', 'ecg', 'chest pain', 'angina', 'palpitation', 'bp', 'pulse'],
    zone: { cx: 40, cy: 80, rx: 20, ry: 18 },
    iconPos: { top: 35, left: 18 },
    icon: <Heart size={13} />,
  },
  {
    id: 'respiratory',
    label: 'Respiratory',
    shortLabel: 'Resp',
    color: '#3B82F6',
    keywords: ['respiratory', 'lung', 'cough', 'asthma', 'pneumonia', 'bronchitis', 'spo2', 'pulmo', 'breath', 'wheez', 'copd', 'sinus', 'nasal'],
    zone: { cx: 100, cy: 80, rx: 20, ry: 18 },
    iconPos: { top: 35, left: 78 },
    icon: <Wind size={13} />,
  },
  {
    id: 'digestive',
    label: 'Digestive / Metabolic',
    shortLabel: 'Digestive',
    color: '#F59E0B',
    keywords: ['digestive', 'gastro', 'liver', 'stomach', 'bowel', 'abdom', 'gastritis', 'ibs', 'diabetes', 'nausea', 'vomit', 'diarrhea', 'constipation', 'hepat', 'metabol'],
    zone: { cx: 70, cy: 130, rx: 22, ry: 18 },
    iconPos: { top: 52, left: 50 },
    icon: <Flame size={13} />,
  },
  {
    id: 'renal',
    label: 'Renal / Urological',
    shortLabel: 'Renal',
    color: '#06B6D4',
    keywords: ['renal', 'kidney', 'urine', 'urinary', 'bladder', 'uti', 'creatinine', 'urea', 'nephro', 'urology'],
    zone: { cx: 70, cy: 155, rx: 18, ry: 12 },
    iconPos: { top: 63, left: 22 },
    icon: <Droplets size={13} />,
  },
  {
    id: 'musculo',
    label: 'Musculoskeletal',
    shortLabel: 'Musculo',
    color: '#10B981',
    keywords: ['joint', 'bone', 'muscle', 'arthritis', 'back', 'spine', 'fracture', 'orthopedic', 'pain', 'sprain', 'ligament', 'tendon', 'rheumat'],
    zone: { cx: 70, cy: 230, rx: 40, ry: 50 },
    iconPos: { top: 76, left: 78 },
    icon: <Bone size={13} />,
  },
];

function getEventText(event: TimelineEvent): string {
  if (event.kind === 'appointment') {
    const a = event.data;
    return [a.chiefComplaint, a.symptoms, a.diagnosis, a.purpose, a.notes, ...(a.medications?.map((m) => m.name) ?? [])].filter(Boolean).join(' ');
  }
  if (event.kind === 'lab') return [event.data.title, event.data.summary, event.data.category].filter(Boolean).join(' ');
  return '';
}

export function getEventSystems(event: TimelineEvent): string[] {
  const text = getEventText(event).toLowerCase();
  return BODY_SYSTEMS.filter(sys => sys.keywords.some(kw => text.includes(kw))).map(sys => sys.id);
}

interface BodyMapProps {
  patient: Patient | null;
  events: TimelineEvent[];
  activeSystem: string | null;
  onSystemSelect: (system: string | null) => void;
}

export function BodyMap({ patient, events, activeSystem, onSystemSelect }: BodyMapProps) {
  const systemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(ev => getEventSystems(ev).forEach(sys => { counts[sys] = (counts[sys] ?? 0) + 1; }));
    return counts;
  }, [events]);

  /* Derive conditions list from patient.chronicConditions, fallback to BODY_SYSTEMS with events */
  const conditionsList = useMemo(() => {
    if (patient && patient.chronicConditions.length > 0) {
      return patient.chronicConditions;
    }
    return BODY_SYSTEMS.filter(sys => (systemCounts[sys.id] ?? 0) > 0).map(sys => sys.label);
  }, [patient, systemCounts]);

  return (
    <div className="flex h-full overflow-hidden bg-[#e5e0d4]">

      {/* ── Anatomical body + floating hotspot icons ── */}
      <div className="relative flex-shrink-0 flex items-start justify-center pt-2" style={{ width: '155px' }}>
        <svg
          viewBox="0 0 140 300"
          className="w-full max-w-[130px]"
          style={{ filter: 'drop-shadow(0 3px 4px rgba(74,24,8,0.22))' }}
        >
          <defs>
            <radialGradient id="bm" cx="38%" cy="25%" r="65%">
              <stop offset="0%" stopColor="#e09880" />
              <stop offset="40%" stopColor="#cc7660" />
              <stop offset="75%" stopColor="#a85440" />
              <stop offset="100%" stopColor="#8a3828" />
            </radialGradient>
            <radialGradient id="mhl" cx="38%" cy="25%" r="65%">
              <stop offset="0%" stopColor="#dda070" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#cc7660" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#a85440" stopOpacity="0" />
            </radialGradient>
            <filter id="sf">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
            <filter id="bdf" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#4a1808" floodOpacity="0.22" />
            </filter>
          </defs>

          <g filter="url(#bdf)">
            {/* HEAD */}
            <ellipse cx="70" cy="20" rx="16" ry="18" fill="url(#bm)" stroke="#a85040" strokeWidth="0.4" />
            {/* HAIR */}
            <path d="M54,14 C54,5 58,1 70,0 C82,1 86,5 86,14 Q83,7 70,7 Q57,7 54,14 Z" fill="#3a1c0a" opacity="0.88" />
            {/* EARS */}
            <ellipse cx="54" cy="22" rx="2.5" ry="4" fill="url(#bm)" stroke="#a85040" strokeWidth="0.3" />
            <ellipse cx="86" cy="22" rx="2.5" ry="4" fill="url(#bm)" stroke="#a85040" strokeWidth="0.3" />
            {/* NECK */}
            <path d="M63,37 C62,42 63,46 70,47 C77,46 78,42 77,37 L77,52 C77,55 74,57 70,57 C66,57 63,55 63,52 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.3" />
            {/* TORSO */}
            <path d="M63,52 C57,53 46,57 35,63 C22,69 12,79 10,91 L9,154 C10,159 14,163 20,166 L27,168 35,171 48,174 62,176 70,177 78,176 92,174 105,171 113,168 L120,166 C126,163 130,159 131,154 L130,91 C128,79 118,69 105,63 C94,57 83,53 77,52 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.4" />
            {/* LEFT ARM */}
            <path d="M35,65 C25,70 16,78 12,90 L9,120 C9,125 11,128 15,129 C19,129 21,126 22,122 L24,100 L32,78 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.3" />
            <path d="M9,120 C7,129 7,138 7,147 C6,156 4,163 6,170 L12,173 17,171 C19,163 20,154 20,143 L20,124 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.28" />
            <path d="M6,170 C4,175 3,181 6,183 L17,183 C20,179 19,175 18,170 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.25" />
            {/* RIGHT ARM */}
            <path d="M105,65 C115,70 124,78 128,90 L131,120 C131,125 129,128 125,129 C121,129 119,126 118,122 L116,100 L108,78 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.3" />
            <path d="M131,120 C133,129 133,138 133,147 C134,156 136,163 134,170 L128,173 123,171 C121,163 120,154 120,143 L120,124 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.28" />
            <path d="M134,170 C136,175 137,181 134,183 L123,183 C120,179 121,175 122,170 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.25" />
            {/* HIPS */}
            <path d="M22,168 C16,174 14,184 18,192 Q70,200 122,192 C126,184 124,174 118,168 Q70,174 22,168 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.28" />
            {/* LEFT THIGH + KNEE + CALF */}
            <path d="M22,188 C16,196 10,212 10,228 C10,238 13,243 19,244 C26,245 29,240 30,232 L32,216 34,198 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.28" />
            <ellipse cx="20" cy="244" rx="11" ry="6" fill="#c07060" stroke="#a05040" strokeWidth="0.3" opacity="0.72" />
            <path d="M10,244 C8,254 8,264 8,270 C8,277 6,280 9,282 L19,282 C23,281 22,278 22,272 L22,256 L31,244 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.25" />
            {/* RIGHT THIGH + KNEE + CALF */}
            <path d="M118,188 C124,196 130,212 130,228 C130,238 127,243 121,244 C114,245 111,240 110,232 L108,216 106,198 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.28" />
            <ellipse cx="120" cy="244" rx="11" ry="6" fill="#c07060" stroke="#a05040" strokeWidth="0.3" opacity="0.72" />
            <path d="M130,244 C132,254 132,264 132,270 C132,277 134,280 131,282 L121,282 C117,281 118,278 118,272 L118,256 L109,244 Z" fill="url(#bm)" stroke="#a85040" strokeWidth="0.25" />
          </g>

          {/* MUSCLE DEFINITION LINES */}
          {/* Pec division */}
          <line x1="70" y1="57" x2="70" y2="130" stroke="#7a3020" strokeWidth="0.8" opacity="0.4" />
          {/* L pec bottom curve */}
          <path d="M16,84 C26,94 42,100 64,104" fill="none" stroke="#7a3020" strokeWidth="0.7" opacity="0.38" />
          {/* R pec bottom curve */}
          <path d="M124,84 C114,94 98,100 76,104" fill="none" stroke="#7a3020" strokeWidth="0.7" opacity="0.38" />
          {/* Clavicles */}
          <path d="M65,54 C55,56 43,60 33,66" fill="none" stroke="#9a5030" strokeWidth="0.65" opacity="0.42" />
          <path d="M75,54 C85,56 97,60 107,66" fill="none" stroke="#9a5030" strokeWidth="0.65" opacity="0.42" />
          {/* Abs lines (4 horizontal) */}
          <path d="M51,110 C60,112 80,112 89,110" fill="none" stroke="#7a3020" strokeWidth="0.55" opacity="0.34" />
          <path d="M49,124 C59,126 81,126 91,124" fill="none" stroke="#7a3020" strokeWidth="0.55" opacity="0.29" />
          <path d="M49,138 C59,140 81,140 91,138" fill="none" stroke="#7a3020" strokeWidth="0.5" opacity="0.24" />
          <path d="M49,152 C59,154 81,154 91,152" fill="none" stroke="#7a3020" strokeWidth="0.5" opacity="0.19" />
          {/* Linea alba */}
          <line x1="70" y1="104" x2="70" y2="168" stroke="#7a3020" strokeWidth="0.55" opacity="0.32" />
          {/* Lateral lines */}
          <path d="M41,107 C40,120 40,135 41,150" fill="none" stroke="#7a3020" strokeWidth="0.48" opacity="0.27" />
          <path d="M99,107 C100,120 100,135 99,150" fill="none" stroke="#7a3020" strokeWidth="0.48" opacity="0.27" />
          {/* Bicep lines */}
          <path d="M12,96 C11,108 12,120 14,132" fill="none" stroke="#7a3020" strokeWidth="0.48" opacity="0.28" />
          <path d="M128,96 C129,108 128,120 126,132" fill="none" stroke="#7a3020" strokeWidth="0.48" opacity="0.28" />
          {/* Thigh division lines */}
          <path d="M14,210 C13,222 14,234 16,242" fill="none" stroke="#7a3020" strokeWidth="0.45" opacity="0.26" />
          <path d="M126,210 C127,222 126,234 124,242" fill="none" stroke="#7a3020" strokeWidth="0.45" opacity="0.26" />

          {/* SPECULAR HIGHLIGHTS */}
          <ellipse cx="44" cy="80" rx="16" ry="12" fill="#e8a888" opacity="0.2" filter="url(#sf)" />
          <ellipse cx="96" cy="80" rx="16" ry="12" fill="#e8a888" opacity="0.2" filter="url(#sf)" />
          <ellipse cx="19" cy="78" rx="11" ry="9" fill="#e8a888" opacity="0.22" filter="url(#sf)" />
          <ellipse cx="121" cy="78" rx="11" ry="9" fill="#e8a888" opacity="0.22" filter="url(#sf)" />
          <rect x="62" y="105" width="16" height="54" rx="5" fill="#e8a888" opacity="0.1" filter="url(#sf)" />
          <ellipse cx="20" cy="218" rx="9" ry="16" fill="#e8a888" opacity="0.17" filter="url(#sf)" />
          <ellipse cx="120" cy="218" rx="9" ry="16" fill="#e8a888" opacity="0.17" filter="url(#sf)" />
        </svg>

        {/* ── Floating condition hotspot icons ── */}
        {BODY_SYSTEMS.map(sys => {
          const count = systemCounts[sys.id] ?? 0;
          const isActive = activeSystem === sys.id;
          if (count === 0 && !isActive) return null;
          return (
            <button
              key={sys.id}
              type="button"
              onClick={() => onSystemSelect(isActive ? null : sys.id)}
              style={{
                position: 'absolute',
                top: `${sys.iconPos.top}%`,
                left: `${sys.iconPos.left}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
                isActive
                  ? 'bg-[#e8e040] text-[#1a1a1a] scale-110 shadow-lg'
                  : 'bg-white text-[#666] hover:scale-105'
              }`}
            >
              {sys.icon}
              {count > 0 && (
                <div
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black leading-none bg-[#1a1a1a] text-white"
                >
                  {count > 9 ? '9+' : count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Conditions list (pill-shaped cards) ── */}
      <div
        className="flex flex-col justify-center py-2 pr-2 gap-0 overflow-y-auto"
        style={{ width: '145px', flexShrink: 0, scrollbarWidth: 'none' }}
      >
        {conditionsList.length > 0
          ? conditionsList.map((cond, idx) => {
              /* Try to find a matching body system for this condition */
              const matchingSys = BODY_SYSTEMS.find(sys =>
                sys.keywords.some(kw => cond.toLowerCase().includes(kw)) ||
                sys.label.toLowerCase().includes(cond.toLowerCase()) ||
                cond.toLowerCase().includes(sys.shortLabel.toLowerCase())
              );
              const sysId = matchingSys?.id ?? null;
              const isActive = sysId !== null && activeSystem === sysId;
              const hasEvents = sysId !== null && (systemCounts[sysId] ?? 0) > 0;

              return (
                <div key={`cond-${idx}`}>
                  <div
                    className="mb-1.5 rounded-2xl bg-white shadow-sm border border-black/[0.07] px-3 py-2.5 flex items-center gap-2.5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => sysId && onSystemSelect(isActive ? null : sysId)}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: isActive ? '#e8e040' : hasEvents ? '#1a1a1a' : '#d0ccc6',
                        boxShadow: isActive ? '0 0 6px #e8e04077' : undefined,
                      }}
                    />
                    <span className="flex-1 text-[12px] font-medium text-[#1a1a1a] leading-tight truncate">{cond}</span>
                    {isActive
                      ? <ChevronUp size={12} className="text-[#666] flex-shrink-0" />
                      : hasEvents
                        ? <ChevronDown size={12} className="text-[#bbb] flex-shrink-0" />
                        : null
                    }
                  </div>
                  {isActive && matchingSys && (
                    <div className="mx-1 mb-1.5 rounded-xl overflow-hidden bg-[#1a1a1a]">
                      <div className="px-2.5 pt-2 pb-2">
                        <p className="text-[7.5px] text-white/35 uppercase tracking-[0.2em] mb-1.5">{matchingSys.shortLabel}</p>
                        <svg viewBox="0 0 100 22" className="w-full h-5">
                          <rect width="100" height="22" fill="#111" rx="4" />
                          <polyline
                            points="0,11 7,11 11,4 15,19 19,11 23,11 27,7 31,15 35,11 45,11 49,5 53,17 57,11 67,11 71,9 75,13 80,11 100,11"
                            fill="none"
                            stroke={matchingSys.color}
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <text x="96" y="8" fontSize="5" fill={matchingSys.color} opacity="0.65" textAnchor="end">
                            {systemCounts[sysId]} rec
                          </text>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          : BODY_SYSTEMS.map(sys => {
              const count = systemCounts[sys.id] ?? 0;
              const isActive = activeSystem === sys.id;
              const dimmed = activeSystem !== null && !isActive;
              return (
                <div key={sys.id}>
                  <div
                    className="mb-1.5 rounded-2xl bg-white shadow-sm border border-black/[0.07] px-3 py-2.5 flex items-center gap-2.5 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onSystemSelect(isActive ? null : sys.id)}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: isActive ? '#e8e040' : count > 0 ? '#1a1a1a' : '#d0ccc6',
                        boxShadow: isActive ? '0 0 6px #e8e04077' : undefined,
                      }}
                    />
                    <span
                      className="flex-1 text-[12px] font-medium leading-tight truncate"
                      style={{
                        color: isActive ? '#1a1a1a' : dimmed ? '#c0bcb6' : count > 0 ? '#1a1a1a' : '#b0aca6',
                      }}
                    >
                      {sys.label}
                    </span>
                    {isActive
                      ? <ChevronUp size={12} className="text-[#666] flex-shrink-0" />
                      : count > 0
                        ? <ChevronDown size={12} className="text-[#bbb] flex-shrink-0" />
                        : null
                    }
                  </div>
                  {isActive && (
                    <div className="mx-1 mb-1.5 rounded-xl overflow-hidden bg-[#1a1a1a]">
                      <div className="px-2.5 pt-2 pb-2">
                        <p className="text-[7.5px] text-white/35 uppercase tracking-[0.2em] mb-1.5">{sys.shortLabel}</p>
                        <svg viewBox="0 0 100 22" className="w-full h-5">
                          <rect width="100" height="22" fill="#111" rx="4" />
                          <polyline
                            points="0,11 7,11 11,4 15,19 19,11 23,11 27,7 31,15 35,11 45,11 49,5 53,17 57,11 67,11 71,9 75,13 80,11 100,11"
                            fill="none"
                            stroke={sys.color}
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <text x="96" y="8" fontSize="5" fill={sys.color} opacity="0.65" textAnchor="end">
                            {count} rec
                          </text>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        }
      </div>

    </div>
  );
}
