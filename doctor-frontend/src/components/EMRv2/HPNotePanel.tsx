import { useEffect, useMemo, useState } from 'react';
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 14, background: HP_ACCENT_DIM, border: `1px solid ${HP_ACCENT_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: HP_ACCENT, flexShrink: 0 }}>
          {icon}
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</h3>
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
      borderRadius: 24, 
      padding: '16px 22px',
      transition: 'all 0.2s ease',
      cursor: 'default',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>{value}</p>
    </div>
  );
}

function InfoBlock({ label, value, color = HP_ACCENT }: { label: string; value?: string; color?: string }) {
  if (!value?.trim()) return null;
  return (
    <div style={{ 
      padding: '20px', 
      borderRadius: 24, 
      background: 'rgba(255,255,255,0.02)', 
      border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 5, height: 14, borderRadius: 100, background: color }} />
        <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontSize: 15, color: 'rgba(241,245,249,0.95)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{value}</p>
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
      <div
        style={{ 
          width: '96vw', 
          height: '92vh', 
          borderRadius: 40, 
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
        {/* ── Immersive Header ── */}
        <div style={{ 
          padding: '32px 48px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          background: 'linear-gradient(135deg, rgba(129,140,248,0.1) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: HP_ACCENT }}>
              <Brain size={32} strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 100, background: HP_ACCENT, boxShadow: `0 0 20px ${HP_ACCENT}` }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: HP_ACCENT, textTransform: 'uppercase', letterSpacing: '0.25em' }}>History & Physical Record</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em' }}>
                {appointment.type || 'Universal H&P Note'}
              </h2>
              <div style={{ display: 'flex', gap: 20, marginTop: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Activity size={12} color="rgba(148,163,184,0.6)" />
                  <span style={{ fontSize: 13, color: 'rgba(148,163,184,1)', fontWeight: 700 }}>{appointment.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <User size={12} color="rgba(148,163,184,0.6)" />
                  <span style={{ fontSize: 13, color: 'rgba(148,163,184,1)', fontWeight: 700 }}>{appointment.doctor}</span>
                </div>
                {data.savedAt && (
                  <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.4)', fontWeight: 600 }}>Archived {fmtDate(data.savedAt)}</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <button 
              onClick={onClose} 
              style={{ 
                width: 56, 
                height: 56, 
                borderRadius: 20, 
                border: '1px solid rgba(255,255,255,0.1)', 
                background: 'rgba(255,255,255,0.05)', 
                color: '#ffffff', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
              }}
            >
              <X size={28} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── Immersive Content Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Column: Narrative (Scrollable) */}
          <div style={{ padding: '48px', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 48, background: 'rgba(255,255,255,0.01)' }}>
            
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <InfoBlock label="Past Medical History" value={data.medicalHistory} />
                <InfoBlock label="Past Surgical History" value={data.surgicalHistory} />
                
                {data.social && Object.values(data.social).some(v => !!v) && (
                  <div style={{ padding: '24px', borderRadius: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ margin: '0 0 20px', fontSize: 12, fontWeight: 900, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Social Context</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 40px' }}>
                      {data.social.tobacco && (
                        <div style={{ padding: '12px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: 'rgba(148,163,184,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Tobacco</p>
                          <p style={{ margin: 0, fontSize: 16, color: '#f1f5f9', fontWeight: 700 }}>{data.social.tobacco}{data.social.tobaccoPkYrs ? ` · ${data.social.tobaccoPkYrs} pk/yrs` : ''}</p>
                        </div>
                      )}
                      {data.social.alcoholFreq && (
                        <div style={{ padding: '12px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: 'rgba(148,163,184,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Alcohol</p>
                          <p style={{ margin: 0, fontSize: 16, color: '#f1f5f9', fontWeight: 700 }}>{data.social.alcoholFreq}</p>
                        </div>
                      )}
                      {data.social.illicitDrugsTypes && (
                        <div style={{ padding: '12px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: 'rgba(148,163,184,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Illicit Drugs</p>
                          <p style={{ margin: 0, fontSize: 16, color: '#f1f5f9', fontWeight: 700 }}>{data.social.illicitDrugsTypes}</p>
                        </div>
                      )}
                      {data.social.occupation && (
                        <div style={{ padding: '12px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: 'rgba(148,163,184,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Occupation</p>
                          <p style={{ margin: 0, fontSize: 16, color: '#f1f5f9', fontWeight: 700 }}>{data.social.occupation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assessment & Plan Dashboard */}
            {(data.impressions?.trim() || data.plan?.trim()) && (
              <div style={{ padding: '32px', borderRadius: 36, background: 'rgba(129,140,248,0.04)', border: `1px solid rgba(129,140,248,0.15)`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <SectionTitle icon={<Stethoscope size={20} />} title="Assessment & Care Plan" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <InfoBlock label="Diagnostic Assessment" value={data.impressions} color="#4ade80" />
                  <InfoBlock label="Therapeutic Plan" value={data.plan} color="#60a5fa" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Findings Toggle (Immersive Sidebar) */}
          <div style={{ padding: '48px', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 32, overflow: 'hidden' }}>
            
            {/* Pill-Shaped Toggle System */}
            <div style={{ 
              display: 'flex', 
              padding: 6, 
              background: 'rgba(255,255,255,0.04)', 
              borderRadius: 24, 
              border: '1px solid rgba(255,255,255,0.08)',
              gap: 4
            }}>
              {(['abnormal', 'normal', 'not_checked'] as FindingType[]).map((type) => {
                const isActive = filter === type;
                const label = type === 'abnormal' ? 'Abnormal' : type === 'normal' ? 'Normal' : 'Pending';
                const count = type === 'abnormal' ? abnormal.length : type === 'normal' ? normal.length : notChecked.length;
                const color = type === 'abnormal' ? '#f87171' : type === 'normal' ? '#4ade80' : 'rgba(148,163,184,0.5)';
                
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    style={{
                      flex: 1,
                      padding: '16px 0',
                      borderRadius: 18,
                      border: 'none',
                      background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isActive ? '0 8px 24px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 900, color: isActive ? '#fff' : 'rgba(148,163,184,0.6)', letterSpacing: '0.02em' }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 100, background: color }} />
                      <span style={{ fontSize: 11, fontWeight: 900, color: isActive ? color : 'rgba(148,163,184,0.3)' }}>{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Findings Pill List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10, display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                              background: filter === 'abnormal' ? 'rgba(239,68,68,0.08)' : filter === 'normal' ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)',
                              border: filter === 'abnormal' ? '1px solid rgba(239,68,68,0.18)' : filter === 'normal' ? '1px solid rgba(74,222,128,0.14)' : '1px solid rgba(255,255,255,0.06)',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: entry.state.note ? 10 : 0 }}>
                              <div style={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: 100, 
                                background: filter === 'abnormal' ? '#f87171' : filter === 'normal' ? '#4ade80' : 'rgba(148,163,184,0.4)' 
                              }} />
                              <span style={{ 
                                fontSize: 15, 
                                fontWeight: 800, 
                                color: filter === 'abnormal' ? '#fca5a5' : filter === 'normal' ? '#86efac' : 'rgba(148,163,184,0.8)',
                                textTransform: 'capitalize',
                                letterSpacing: '-0.01em'
                              }}>
                                {formatLabel(entry.item)}
                              </span>
                            </div>
                            {entry.state.note && (
                              <div style={{ 
                                padding: '12px 16px', 
                                background: 'rgba(0,0,0,0.2)', 
                                borderRadius: 16, 
                                marginTop: 4,
                                border: '1px solid rgba(255,255,255,0.03)'
                              }}>
                                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
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
          </div>
        </div>

        {/* ── Action Footer ── */}
        <div style={{ 
          padding: '24px 48px', 
          borderTop: '1px solid rgba(255,255,255,0.08)', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          background: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          gap: 20
        }}>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(148,163,184,0.4)', fontWeight: 600 }}>Press <span style={{ color: 'rgba(148,163,184,0.8)', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>Space</span> or <span style={{ color: 'rgba(148,163,184,0.8)', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>Esc</span> to close</p>
          <button 
            onClick={onClose} 
            style={{ 
              padding: '16px 56px', 
              borderRadius: 100, 
              border: `1px solid ${HP_ACCENT_BORDER}`, 
              background: HP_ACCENT_DIM, 
              color: HP_ACCENT, 
              fontSize: 16, 
              fontWeight: 900, 
              cursor: 'pointer', 
              letterSpacing: '0.02em',
              boxShadow: `0 8px 32px ${HP_ACCENT_DIM}`,
              transition: 'all 0.2s ease'
            }}
          >
            Close Patient Record
          </button>
        </div>
      </div>
    </div>
  );
}
