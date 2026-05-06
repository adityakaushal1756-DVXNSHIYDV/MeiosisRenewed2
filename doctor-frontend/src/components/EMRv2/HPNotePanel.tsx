import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Activity, User, FileText, AlertCircle, CheckCircle2, Brain, Stethoscope, ChevronRight, Maximize2 } from 'lucide-react';
import type { HPNoteSnapshot, HPNoteItemState } from '../../types/Patient';
import type { AppointmentEntry } from './types';

interface HPNotePanelProps {
  appointment: AppointmentEntry;
  onClose: () => void;
}

const HP_ACCENT = '#818CF8';
const HP_ACCENT_DIM = 'rgba(129,140,248,0.12)';
const HP_ACCENT_BORDER = 'rgba(129,140,248,0.25)';

type FindingType = 'abnormal' | 'normal' | 'not_checked';

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 10, background: HP_ACCENT_DIM, border: `1px solid ${HP_ACCENT_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: HP_ACCENT, flexShrink: 0 }}>
          {icon && (typeof icon === 'object' && 'props' in (icon as any) ? <span style={{ transform: 'scale(0.8)' }}>{icon}</span> : icon)}
        </div>
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 900, color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</h3>
      </div>
      {count !== undefined && (
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(148,163,184,0.6)', background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.06)' }}>
          {count}
        </span>
      )}
    </div>
  );
}

function VitalChip({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', 
      border: '1px solid rgba(255,255,255,0.08)', 
      borderRadius: 20, 
      padding: '12px 18px',
      transition: 'all 0.2s ease',
      cursor: 'default',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }}>
      <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>{value}</p>
    </div>
  );
}

function InfoBlock({ label, value, color = HP_ACCENT }: { label: string; value?: string; color?: string }) {
  if (!value?.trim()) return null;
  return (
    <div style={{ 
      padding: '16px', 
      borderRadius: 20, 
      background: 'rgba(255,255,255,0.02)', 
      border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 4, height: 12, borderRadius: 100, background: color }} />
        <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(241,245,249,0.9)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{value}</p>
    </div>
  );
}

interface ClassifiedItem {
  sec: string;
  item: string;
  state: HPNoteItemState;
  source: 'ros' | 'pe';
}

function classifyItems(data: HPNoteSnapshot): {
  abnormal: ClassifiedItem[];
  normal: ClassifiedItem[];
  notChecked: ClassifiedItem[];
} {
  const abnormal: ClassifiedItem[] = [];
  const normal: ClassifiedItem[] = [];
  const notChecked: ClassifiedItem[] = [];

  const processSection = (sections: Record<string, Record<string, HPNoteItemState>> | undefined, source: 'ros' | 'pe') => {
    if (!sections) return;
    Object.entries(sections).forEach(([sec, items]) => {
      Object.entries(items).forEach(([item, state]) => {
        const entry: ClassifiedItem = { sec, item, state, source };
        if (state.status === 'abnormal') abnormal.push(entry);
        else if (state.status === 'normal') normal.push(entry);
        else notChecked.push(entry);
      });
    });
  };

  processSection(data.ros, 'ros');
  processSection(data.pe, 'pe');
  return { abnormal, normal, notChecked };
}

function formatLabel(str: string) {
  return str.replace(/([A-Z])/g, ' $1').trim();
}

export function HPNotePanel({ appointment, onClose }: HPNotePanelProps) {
  const data = appointment.hpNoteData;
  const [filter, setFilter] = useState<FindingType>('abnormal');

  // Close on space bar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Escape') { 
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
        e.preventDefault(); e.stopPropagation(); onClose(); 
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const { abnormal, normal, notChecked } = useMemo(() => {
    if (!data) return { abnormal: [], normal: [], notChecked: [] };
    return classifyItems(data);
  }, [data]);

  const activeFindings = useMemo(() => {
    if (filter === 'abnormal') return abnormal;
    if (filter === 'normal') return normal;
    return notChecked;
  }, [filter, abnormal, normal, notChecked]);

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  if (!data) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-xl" onClick={onClose}>
        <div style={{ background: '#0d1520', borderRadius: 40, padding: 60, color: 'white', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
          <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: 18, fontWeight: 600 }}>No H&P data found for this record.</p>
          <button onClick={onClose} style={{ marginTop: 32, padding: '14px 44px', borderRadius: 100, border: `1px solid ${HP_ACCENT_BORDER}`, background: HP_ACCENT_DIM, color: HP_ACCENT, cursor: 'pointer', fontSize: 15, fontWeight: 800 }}>Return to Timeline</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-xl"
      onClick={onClose}
    >
      {/* Floating Close Button */}
      <button 
        onClick={onClose} 
        style={{ 
          position: 'fixed',
          top: 24,
          right: 24,
          width: 44, 
          height: 44, 
          borderRadius: '50%', 
          border: '1px solid rgba(255,255,255,0.15)', 
          background: 'rgba(255,255,255,0.08)', 
          color: '#ffffff', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 130,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      >
        <X size={20} strokeWidth={3} />
      </button>

      <div
        style={{ 
          width: '92vw', 
          height: '86vh', 
          borderRadius: 32, 
          border: '1px solid rgba(255,255,255,0.1)', 
          background: '#04080f', 
          boxShadow: '0 60px 180px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.05)', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'pInL 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Compact Header ── */}
        <div style={{ 
          padding: '20px 32px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          background: 'linear-gradient(135deg, rgba(129,140,248,0.08) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: HP_ACCENT }}>
              <Brain size={24} strokeWidth={2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: 100, background: HP_ACCENT, boxShadow: `0 0 12px ${HP_ACCENT}` }} />
                <span style={{ fontSize: 10, fontWeight: 900, color: HP_ACCENT, textTransform: 'uppercase', letterSpacing: '0.15em' }}>History & Physical Record</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {appointment.type || 'Universal H&P Note'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Activity size={10} color="rgba(148,163,184,0.5)" />
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)', fontWeight: 800 }}>{appointment.date}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <User size={10} color="rgba(148,163,184,0.5)" />
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)', fontWeight: 800 }}>Dr. {appointment.doctor}</span>
            </div>
          </div>
        </div>

        {/* ── Immersive Content Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Column: Narrative (Scrollable) */}
          <div style={{ padding: '32px', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 32, background: 'rgba(255,255,255,0.01)' }}>
            
            {/* Vitals Dashboard */}
            {Object.values(data.vitals || {}).some(v => !!v) && (
              <div>
                <SectionTitle icon={<Activity size={18} />} title="Vital Diagnostics" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <VitalChip label="Temperature" value={data.vitals.temp ? `${data.vitals.temp} °F` : undefined} />
                  <VitalChip label="Heart Rate" value={data.vitals.hr ? `${data.vitals.hr} bpm` : undefined} />
                  <VitalChip label="Resp. Rate" value={data.vitals.rr ? `${data.vitals.rr} /min` : undefined} />
                  <VitalChip label="BP (Supine)" value={data.vitals.bpSupine} />
                  <VitalChip label="BP (Seated)" value={data.vitals.bpSeated} />
                  <VitalChip label="Oxygen (SpO2)" value={data.vitals.pulseOx ? `${data.vitals.pulseOx}%` : undefined} />
                  <VitalChip label="Height" value={data.vitals.height} />
                  <VitalChip label="Weight" value={data.vitals.weight} />
                </div>
              </div>
            )}

            {/* History Section */}
            <div>
              <SectionTitle icon={<FileText size={18} />} title="Clinical History" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <InfoBlock label="Past Medical History" value={data.medicalHistory} />
                <InfoBlock label="Past Surgical History" value={data.surgicalHistory} />
                
                {data.social && Object.values(data.social).some(v => !!v) && (
                  <div style={{ padding: '20px', borderRadius: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 900, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Social Context</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                      {data.social.tobacco && (
                        <div style={{ padding: '10px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: 'rgba(148,163,184,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Tobacco</p>
                          <p style={{ margin: 0, fontSize: 13, color: '#f1f5f9', fontWeight: 700 }}>{data.social.tobacco}{data.social.tobaccoPkYrs ? ` · ${data.social.tobaccoPkYrs} pk/yrs` : ''}</p>
                        </div>
                      )}
                      {data.social.alcoholFreq && (
                        <div style={{ padding: '10px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: 'rgba(148,163,184,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Alcohol</p>
                          <p style={{ margin: 0, fontSize: 13, color: '#f1f5f9', fontWeight: 700 }}>{data.social.alcoholFreq}</p>
                        </div>
                      )}
                      {data.social.illicitDrugsTypes && (
                        <div style={{ padding: '10px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: 'rgba(148,163,184,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Illicit Drugs</p>
                          <p style={{ margin: 0, fontSize: 13, color: '#f1f5f9', fontWeight: 700 }}>{data.social.illicitDrugsTypes}</p>
                        </div>
                      )}
                      {data.social.occupation && (
                        <div style={{ padding: '10px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: 'rgba(148,163,184,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Occupation</p>
                          <p style={{ margin: 0, fontSize: 13, color: '#f1f5f9', fontWeight: 700 }}>{data.social.occupation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assessment & Plan Dashboard */}
            {(data.impressions?.trim() || data.plan?.trim()) && (
              <div style={{ padding: '24px', borderRadius: 32, background: 'rgba(129,140,248,0.04)', border: `1px solid rgba(129,140,248,0.15)`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <SectionTitle icon={<Stethoscope size={16} />} title="Assessment & Care Plan" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <InfoBlock label="Diagnostic Assessment" value={data.impressions} color="#4ade80" />
                  <InfoBlock label="Therapeutic Plan" value={data.plan} color="#60a5fa" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Findings Toggle (Immersive Sidebar) */}
          <div style={{ padding: '0', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            
            {/* Scrollable Findings Pill List */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '32px',
              paddingBottom: 120, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 24,
              maskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 100px), transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 100px), transparent)'
            }}>
              {activeFindings.length === 0 ? (
                <div style={{ padding: '100px 0', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'rgba(148,163,184,0.2)' }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'rgba(148,163,184,0.3)' }}>No {filter.replace('_', ' ')} entries.</p>
                </div>
              ) : (
                (() => {
                  const grouped: Record<string, ClassifiedItem[]> = {};
                  activeFindings.forEach(item => {
                    const key = `${item.source === 'ros' ? 'Review of Systems' : 'Physical Exam'}: ${item.sec}`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(item);
                  });

                  return Object.entries(grouped).map(([groupKey, items]) => (
                    <div key={groupKey}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, opacity: 0.9 }}>
                        <ChevronRight size={12} color={HP_ACCENT} strokeWidth={4} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{groupKey}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {items.map(entry => (
                          <div 
                            key={`${entry.source}-${entry.sec}-${entry.item}`}
                            style={{ 
                              width: '100%',
                              padding: '16px 24px', 
                              borderRadius: 24, 
                              background: filter === 'abnormal' ? 'rgba(239,68,68,0.12)' : filter === 'normal' ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.05)',
                              border: filter === 'abnormal' ? '1px solid rgba(239,68,68,0.25)' : filter === 'normal' ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.1)',
                              transition: 'all 0.2s ease',
                              boxShadow: filter === 'abnormal' ? '0 10px 30px -10px rgba(239,68,68,0.15)' : filter === 'normal' ? '0 10px 30px -10px rgba(74,222,128,0.12)' : '0 10px 30px -10px rgba(0,0,0,0.3)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: entry.state.note ? 10 : 0 }}>
                              <div style={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: 100, 
                                background: filter === 'abnormal' ? '#f87171' : filter === 'normal' ? '#4ade80' : 'rgba(148,163,184,0.6)',
                                boxShadow: filter === 'abnormal' ? '0 0 10px #f87171' : filter === 'normal' ? '0 0 10px #4ade80' : 'none'
                              }} />
                              <span style={{ 
                                fontSize: 15, 
                                fontWeight: 800, 
                                color: filter === 'abnormal' ? '#fecaca' : filter === 'normal' ? '#bbf7d0' : '#f8fafc',
                                textTransform: 'capitalize',
                                letterSpacing: '-0.01em'
                              }}>
                                {formatLabel(entry.item)}
                              </span>
                            </div>
                            {entry.state.note && (
                              <div style={{ 
                                padding: '12px 16px', 
                                background: 'rgba(0,0,0,0.4)', 
                                borderRadius: 16, 
                                marginTop: 4,
                                border: '1px solid rgba(255,255,255,0.05)'
                              }}>
                                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                                  {entry.state.note}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Bottom-Floating Pill-Shaped Toggle System */}
            <div style={{ 
              position: 'absolute',
              bottom: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '85%',
              display: 'flex', 
              padding: 5, 
              background: 'rgba(13, 21, 32, 0.85)', 
              borderRadius: 100, 
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
              gap: 4,
              zIndex: 10
            }}>
              {(['abnormal', 'normal', 'not_checked'] as FindingType[]).map((type) => {
                const isActive = filter === type;
                const label = type === 'abnormal' ? 'Abnormal' : type === 'normal' ? 'Normal' : 'Pending';
                const count = type === 'abnormal' ? abnormal.length : type === 'normal' ? normal.length : notChecked.length;
                const color = type === 'abnormal' ? '#f87171' : type === 'normal' ? '#4ade80' : 'rgba(148,163,184,0.8)';
                
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: 100,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-finding-pill"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(255,255,255,0.12)',
                          borderRadius: 100,
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                          zIndex: -1,
                        }}
                      />
                    )}
                    <span style={{ fontSize: 10, fontWeight: 900, color: isActive ? '#fff' : 'rgba(148,163,184,0.8)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 4, height: 4, borderRadius: 100, background: color, boxShadow: isActive ? `0 0 10px ${color}` : 'none' }} />
                      <span style={{ fontSize: 9, fontWeight: 900, color: isActive ? color : 'rgba(148,163,184,0.5)' }}>{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
