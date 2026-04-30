import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, CheckCircle2, AlertCircle, ChevronRight, Clipboard, 
  History as HistoryIcon, Activity, Stethoscope, FileText, 
  Check, User, Plus, Trash2, Heart, Wind, Brain, Eye, 
  Thermometer, Scaling, Weight, Info, Minus
} from 'lucide-react';

interface HPProps {
  onClose: () => void;
  patientName?: string;
  darkMode?: boolean;
}

type TabType = 'history' | 'ros' | 'physical' | 'plan';
type ItemStatus = 'not_checked' | 'normal' | 'abnormal';

interface ItemState {
  status: ItemStatus;
  note: string;
}

// --- CONFIGURATION ---
const ROS_CONFIG: Record<string, string[]> = {
  general: ['fever', 'chills', 'anorexia', 'diaphoresis', 'weightGain', 'weightLoss', 'adenopathy', 'lightheadedness', 'edema'],
  endocrine: ['thyroid', 'intolerance', 'goiter', 'radiation', 'diabetes', 'lipid'],
  hematologic: ['anemia', 'sickle', 'leukemia', 'transfusions', 'bruising', 'bleeding'],
  skin: ['pruritus', 'rash', 'moles', 'cancer', 'tattoos', 'nailChanges'],
  eyes: ['lenses', 'cataracts', 'glaucoma', 'photophobia', 'visualChange', 'laser'],
  ent: ['infections', 'hearingLoss', 'vertigo', 'tinnitus', 'epistaxis', 'hoarseness'],
  oral: ['condition', 'dentures', 'lesions', 'pain', 'infections', 'dysgeusia'],
  cv: ['chestPain', 'pressure', 'palpitations', 'syncope', 'orthopnea', 'pnd', 'mi', 'hypertension', 'cath', 'murmur', 'rheumatic', 'dysrhythmia', 'claudication', 'aneurysm', 'varicosities', 'dvt', 'thrombophlebitis', 'raynauds'],
  pulm: ['dyspnea', 'cough', 'hemoptysis', 'asthma', 'wheezing', 'tb', 'positivePpd', 'tbExposure'],
  breasts: ['mass', 'tenderness', 'discharge', 'asymmetry', 'gynecomastia', 'implants', 'mammography'],
  gi: ['dysphagia', 'odynophagia', 'heartburn', 'abdominalPain', 'nausea', 'hematemesis', 'hematochezia', 'melena', 'diarrhea', 'constipation', 'ulcers', 'hepatitis', 'pancreatitis', 'gallstones', 'colitis', 'jaundice', 'hemorrhoids', 'hernia', 'fecalOccult'],
  msk: ['pain', 'arthritis', 'deformity', 'stiffness', 'swelling', 'injury'],
  neuro: ['paresthesia', 'paralysis', 'headache', 'headTrauma', 'syncope', 'cva', 'seizures', 'tremor', 'weakness', 'gait', 'dysarthria'],
  psych: ['anxiety', 'depression', 'psychosis', 'memoryLoss', 'psychTreatment'],
  gu: ['hematuria', 'dysuria', 'urgency', 'frequency', 'nocturia', 'incontinence', 'streamChange', 'infection', 'stones'],
  genitorepro: ['multiplePartners', 'stds', 'impotence', 'pain', 'mass', 'testicularSelf', 'penileDischarge', 'abnormalBleeding', 'dyspareunia', 'pms', 'hormoneUse', 'contraception', 'infertility']
};

const PE_CONFIG: Record<string, string[]> = {
  general: ['appearance', 'acutelyIll', 'orientation', 'consciousness'],
  eyes: ['pupils', 'conjunctiva', 'fundus', 'extraocular'],
  ent: ['head', 'hearing', 'eac', 'tympanic', 'nasal', 'gums', 'pharynx', 'tongue'],
  neck: ['mobility', 'trachea', 'thyroid', 'masses'],
  lungs: ['wheeze', 'rhonchi', 'rales', 'friction', 'dullness', 'abnormalBreath'],
  heart: ['rate', 'rhythm', 'sounds', 'murmur', 'rub', 'pmi'],
  vascular: ['pulses', 'bruits', 'stasis', 'varicosities', 'edema', 'capillaryRefill'],
  abdomen: ['bowelSounds', 'tenderness', 'distension', 'abnormalPercussion'],
  rectal: ['sphincter', 'masses', 'hemorrhoids', 'grossBlood'],
  neuro: ['cranialNerves', 'cerebellar', 'meningismus', 'deepTendon', 'muscleStrength', 'pathologicReflexes', 'sensation', 'fineMotor'],
  lymph: ['cervical', 'occipital', 'supraclavicular', 'axillary', 'inguinal', 'epitrochlear'],
  skin: ['turgor', 'lesions'],
  breasts: ['skinChanges', 'nippleInversion', 'mass', 'tenderness', 'asymmetry', 'discharge'],
  genital: ['penis', 'urethra', 'testicles', 'prostate', 'external', 'genitalia', 'adnexa', 'uterus', 'cervix']
};

const createInitialSectionState = (config: Record<string, string[]>) => {
  const sections: Record<string, Record<string, ItemState>> = {};
  Object.keys(config).forEach(sec => {
    sections[sec] = {};
    config[sec].forEach(item => {
      sections[sec][item] = { status: 'not_checked', note: '' };
    });
  });
  return sections;
};

export const HistoryAndPhysicalUniversal: React.FC<HPProps> = ({ onClose, patientName, darkMode }) => {
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [isSaved, setIsSaved] = useState(false);

  // --- KEYBOARD NAVIGATION ---
  React.useEffect(() => {
    const tabs: TabType[] = ['history', 'ros', 'physical', 'plan'];
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable;
      
      // Block dashboard global shortcuts 'o' and 'i' when H&P is open
      if (e.key.toLowerCase() === 'o' || e.key.toLowerCase() === 'i') {
        if (!isTyping) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
      }

      // Don't switch tabs if the user is typing
      if (isTyping) return;

      if (e.key === 'ArrowRight') {
        setActiveTab(current => {
          const idx = tabs.indexOf(current);
          return tabs[(idx + 1) % tabs.length];
        });
      } else if (e.key === 'ArrowLeft') {
        setActiveTab(current => {
          const idx = tabs.indexOf(current);
          return tabs[(idx - 1 + tabs.length) % tabs.length];
        });
      }
    };

    // Use capture phase to ensure we intercept the keys before other global listeners
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // --- STATE ---
  const [form, setForm] = useState({
    vitals: { temp: '', hr: '', rr: '', bpSupine: '', bpSeated: '', height: '', weight: '', pulseOx: '', pain: '0' },
    medicalHistory: '',
    surgicalHistory: '',
    social: {
      tobacco: 'none', tobaccoPkYrs: '', tobaccoQuit: '',
      alcohol: 'none', alcoholFreq: '', alcoholLast: '', alcoholHx: '',
      caffeine: '', illicitDrugs: 'none', illicitDrugsTypes: '',
      occupation: '', exposures: '', living: '', travel: '', diet: '', nutrition: '', exercise: '', other: ''
    },
    immunizations: { tetanus: '', pneumovax: '', influenza: '', hepB: '', varicella: '', ppd: '', childhood: '' },
    familyHistory: { parents: '', siblings: '', other: '' },
    ros: createInitialSectionState(ROS_CONFIG),
    pe: createInitialSectionState(PE_CONFIG),
    findings: { ua: '', ekg: '', rad: '', other: '' },
    impressions: '',
    plan: '',
    obgyn: { g: '', p: '', fdlmp: '', menarche: '', menopause: '' }
  });

  // --- HELPERS ---
  const updateVitals = (field: string, val: string) => setForm(f => ({ ...f, vitals: { ...f.vitals, [field]: val } }));
  
  const updateItem = (tab: 'ros' | 'pe', sec: string, item: string, status: ItemStatus, note?: string) => {
    setForm(f => ({
      ...f,
      [tab]: {
        ...f[tab],
        [sec]: {
          ...f[tab][sec],
          [item]: { status, note: note ?? f[tab][sec][item].note }
        }
      }
    }));
  };

  const setSectionNormal = (tab: 'ros' | 'pe', sec: string) => {
    setForm(f => {
      const newSec = { ...f[tab][sec] };
      Object.keys(newSec).forEach(k => {
        if (newSec[k].status === 'not_checked') {
          newSec[k] = { ...newSec[k], status: 'normal' };
        }
      });
      return { ...f, [tab]: { ...f[tab], [sec]: newSec } };
    });
  };

  const resetSection = (tab: 'ros' | 'pe', sec: string) => {
    setForm(f => {
      const newSec = { ...f[tab][sec] };
      Object.keys(newSec).forEach(k => {
        newSec[k] = { status: 'not_checked', note: '' };
      });
      return { ...f, [tab]: { ...f[tab], [sec]: newSec } };
    });
  };

  const setAllNormal = (tab: 'ros' | 'pe') => {
    setForm(f => {
      const newTab = { ...f[tab] };
      Object.keys(newTab).forEach(sec => {
        const newSec = { ...newTab[sec] };
        Object.keys(newSec).forEach(item => {
          if (newSec[item].status === 'not_checked') {
            newSec[item] = { ...newSec[item], status: 'normal' };
          }
        });
        newTab[sec] = newSec;
      });
      return { ...f, [tab]: newTab };
    });
  };

  // --- DERIVED ---
  const abnormalities = useMemo(() => {
    const list: { tab: string; sec: string; item: string; note: string }[] = [];
    ['ros', 'pe'].forEach(tab => {
      const sections = form[tab as 'ros' | 'pe'];
      Object.keys(sections).forEach(sec => {
        const items = sections[sec];
        Object.keys(items).forEach(item => {
          if (items[item].status === 'abnormal') {
            list.push({ tab: tab.toUpperCase(), sec, item, note: items[item].note });
          }
        });
      });
    });
    return list;
  }, [form.ros, form.pe]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: darkMode ? '#060b13' : '#f8fafc',
        display: 'flex', flexDirection: 'column',
        color: darkMode ? '#f8fafc' : '#0f172a'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 40px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: darkMode ? 'rgba(15, 23, 42, 0.5)' : '#fff',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#52ff9d20', color: '#52ff9d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clipboard size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Universal H&P Builder</h1>
            <p style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>
              {patientName ? `Patient: ${patientName}` : 'Comprehensive History & Physical Examination'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => { setIsSaved(true); setTimeout(() => setIsSaved(false), 2000); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
              borderRadius: 12, border: 'none', background: '#52ff9d', color: '#06111d',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 10px 20px rgba(82,255,157,0.2)'
            }}
          >
            {isSaved ? <Check size={18} /> : <Save size={18} />}
            {isSaved ? 'Draft Saved' : 'Save Draft'}
          </button>
          <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Navigation Sidebar */}
        <div style={{ 
          width: 280, borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          padding: 24, display: 'flex', flexDirection: 'column', gap: 8,
          background: darkMode ? 'rgba(15, 23, 42, 0.2)' : 'rgba(0,0,0,0.01)'
        }}>
          {[
            { id: 'history', label: 'History', icon: <HistoryIcon size={18} />, sub: 'Med/Surg/Social/Fam' },
            { id: 'ros', label: 'Review of Systems', icon: <Activity size={18} />, sub: `${Object.keys(ROS_CONFIG).length} Categories` },
            { id: 'physical', label: 'Physical Exam', icon: <Stethoscope size={18} />, sub: `${Object.keys(PE_CONFIG).length} Categories` },
            { id: 'plan', label: 'Findings & Plan', icon: <FileText size={18} />, sub: 'Assessment / Impressions' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                borderRadius: 12, border: 'none', textAlign: 'left', cursor: 'pointer',
                background: activeTab === item.id ? (darkMode ? 'rgba(82,255,157,0.1)' : 'rgba(82,255,157,0.05)') : 'transparent',
                color: activeTab === item.id ? '#52ff9d' : (darkMode ? '#94a3b8' : '#64748b'),
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: activeTab === item.id ? '#52ff9d20' : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{item.sub}</div>
              </div>
              {activeTab === item.id && <ChevronRight size={16} />}
            </button>
          ))}
          
          <div style={{ marginTop: 'auto', padding: '16px', borderRadius: 16, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px dashed ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#52ff9d' }}>
              <Info size={14} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>Quick Peek</span>
            </div>
            <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {abnormalities.length === 0 ? (
                <p style={{ fontSize: 11, margin: 0, color: darkMode ? '#64748b' : '#94a3b8' }}>No abnormalities documented.</p>
              ) : (
                abnormalities.map((a, i) => (
                  <div key={i} style={{ borderLeft: '2px solid #ef4444', paddingLeft: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444' }}>{a.item.toUpperCase()}</div>
                    <div style={{ fontSize: 9, color: darkMode ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.note || 'No description'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'history' && (
              <motion.div 
                key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
              >
                <SectionHeader title="Patient Vitals" icon={<Activity size={20} />} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <VitalInput label="Temp (°F)" value={form.vitals.temp} onChange={v => updateVitals('temp', v)} icon={<Thermometer size={14} />} />
                  <VitalInput label="Heart Rate" value={form.vitals.hr} onChange={v => updateVitals('hr', v)} icon={<Heart size={14} />} />
                  <VitalInput label="Resp. Rate" value={form.vitals.rr} onChange={v => updateVitals('rr', v)} icon={<Wind size={14} />} />
                  <VitalInput label="BP (Supine)" value={form.vitals.bpSupine} onChange={v => updateVitals('bpSupine', v)} placeholder="120/80" />
                  <VitalInput label="BP (Seated)" value={form.vitals.bpSeated} onChange={v => updateVitals('bpSeated', v)} placeholder="122/82" />
                  <VitalInput label="Height" value={form.vitals.height} onChange={v => updateVitals('height', v)} icon={<Scaling size={14} />} />
                  <VitalInput label="Weight" value={form.vitals.weight} onChange={v => updateVitals('weight', v)} icon={<Weight size={14} />} />
                  <VitalInput label="Pulse Ox (%)" value={form.vitals.pulseOx} onChange={v => updateVitals('pulseOx', v)} />
                </div>

                <SectionHeader title="Medical & Surgical History" icon={<HistoryIcon size={20} />} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <TextArea label="Past Medical History" value={form.medicalHistory} onChange={v => setForm(f => ({ ...f, medicalHistory: v }))} placeholder="Chronic conditions, hospitalizations..." />
                  <TextArea label="Past Surgical History" value={form.surgicalHistory} onChange={v => setForm(f => ({ ...f, surgicalHistory: v }))} placeholder="Surgeries, dates, surgeons..." />
                </div>

                <SectionHeader title="Social History" icon={<User size={20} />} />
                <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: 24, borderRadius: 20, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <Select label="Tobacco Use" options={['none', 'active', 'quit', 'smokeless']} value={form.social.tobacco} onChange={v => setForm(f => ({ ...f, social: { ...f.social, tobacco: v } }))} />
                    <Input label="PK / YRS" value={form.social.tobaccoPkYrs} onChange={v => setForm(f => ({ ...f, social: { ...f.social, tobaccoPkYrs: v } }))} />
                    <Input label="Illicit Drugs" value={form.social.illicitDrugsTypes} onChange={v => setForm(f => ({ ...f, social: { ...f.social, illicitDrugsTypes: v } }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    <Input label="Alcohol Frequency" value={form.social.alcoholFreq} onChange={v => setForm(f => ({ ...f, social: { ...f.social, alcoholFreq: v } }))} />
                    <Input label="Occupation" value={form.social.occupation} onChange={v => setForm(f => ({ ...f, social: { ...f.social, occupation: v } }))} />
                  </div>
                  <TextArea label="Other Social (Living, Diet, Exercise)" value={form.social.other} onChange={v => setForm(f => ({ ...f, social: { ...f.social, other: v } }))} />
                </div>
              </motion.div>
            )}

            {activeTab === 'ros' && (
              <motion.div key="ros" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                  <SectionHeader title="Review of Systems" icon={<Activity size={20} />} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setAllNormal('ros')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #52ff9d', background: 'transparent', color: '#52ff9d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Normal All</button>
                    <button onClick={() => setForm(f => ({ ...f, ros: createInitialSectionState(ROS_CONFIG) }))} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {Object.entries(form.ros).map(([secKey, items]) => (
                    <CategoryCard 
                      key={secKey} title={secKey.toUpperCase()} 
                      onNormalAll={() => setSectionNormal('ros', secKey)}
                      onReset={() => resetSection('ros', secKey)}
                      darkMode={darkMode}
                    >
                      {Object.entries(items).map(([itemKey, state]) => (
                        <ItemRow 
                          key={itemKey} label={itemKey} state={state} 
                          onChange={(status, note) => updateItem('ros', secKey, itemKey, status, note)} 
                          darkMode={darkMode} 
                        />
                      ))}
                    </CategoryCard>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'physical' && (
              <motion.div key="physical" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                  <SectionHeader title="Physical Examination" icon={<Stethoscope size={20} />} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setAllNormal('pe')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #52ff9d', background: 'transparent', color: '#52ff9d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Normal All</button>
                    <button onClick={() => setForm(f => ({ ...f, pe: createInitialSectionState(PE_CONFIG) }))} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {Object.entries(form.pe).map(([secKey, items]) => (
                    <CategoryCard 
                      key={secKey} title={secKey.toUpperCase()} 
                      onNormalAll={() => setSectionNormal('pe', secKey)}
                      onReset={() => resetSection('pe', secKey)}
                      darkMode={darkMode}
                    >
                      {Object.entries(items).map(([itemKey, state]) => (
                        <ItemRow 
                          key={itemKey} label={itemKey} state={state} 
                          onChange={(status, note) => updateItem('pe', secKey, itemKey, status, note)} 
                          darkMode={darkMode} 
                        />
                      ))}
                    </CategoryCard>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'plan' && (
              <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <SectionHeader title="Diagnostic Findings" icon={<Brain size={20} />} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <Input label="UA (Urinalysis)" value={form.findings.ua} onChange={v => setForm(f => ({ ...f, findings: { ...f.findings, ua: v } }))} />
                  <Input label="EKG / ECG" value={form.findings.ekg} onChange={v => setForm(f => ({ ...f, findings: { ...f.findings, ekg: v } }))} />
                  <Input label="RAD (Imaging)" value={form.findings.rad} onChange={v => setForm(f => ({ ...f, findings: { ...f.findings, rad: v } }))} />
                </div>
                <TextArea label="Other Findings" value={form.findings.other} onChange={v => setForm(f => ({ ...f, findings: { ...f.findings, other: v } }))} />

                <SectionHeader title="Impressions & Assessment" icon={<AlertCircle size={20} />} />
                <TextArea label="Impressions" value={form.impressions} onChange={v => setForm(f => ({ ...f, impressions: v }))} minHeight={120} />

                <SectionHeader title="Treatment Plan" icon={<CheckCircle2 size={20} />} />
                <TextArea label="Plan" value={form.plan} onChange={v => setForm(f => ({ ...f, plan: v }))} minHeight={150} />
              </motion.div>
            )}
          </AnimatePresence>
          <div style={{ height: 100 }} />
        </div>
      </div>
    </motion.div>
  );
};

// --- SUB-COMPONENTS ---

const SectionHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '4px solid #52ff9d', paddingLeft: 16 }}>
    <div style={{ color: '#52ff9d', opacity: 0.8 }}>{icon}</div>
    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
  </div>
);

const CategoryCard = ({ title, onNormalAll, onReset, children, darkMode }: any) => (
  <div style={{ 
    padding: '24px 32px', borderRadius: 24, 
    background: darkMode ? 'rgba(255,255,255,0.02)' : '#fff',
    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
    boxShadow: darkMode ? 'none' : '0 10px 30px rgba(0,0,0,0.02)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingBottom: 12 }}>
      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#52ff9d' }}>{title}</h4>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onNormalAll} style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: '#52ff9d20', color: '#52ff9d', border: 'none', cursor: 'pointer' }}>No Abnormals</button>
        <button onClick={onReset} style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'inherit', border: 'none', cursor: 'pointer' }}>Reset</button>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {children}
    </div>
  </div>
);

const ItemRow = ({ label, state, onChange, darkMode }: { label: string, state: ItemState, onChange: (s: ItemStatus, n?: string) => void, darkMode?: boolean }) => {
  const isAbnormal = state.status === 'abnormal';
  const isNormal = state.status === 'normal';

  return (
    <div style={{ 
      display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 0',
      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`
    }}>
      <div style={{ width: 180, flexShrink: 0, fontSize: 13, fontWeight: 600, color: isAbnormal ? '#ef4444' : isNormal ? '#52ff9d' : 'inherit', textTransform: 'capitalize' }}>
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </div>

      <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, height: 32 }}>
        <button 
          onClick={() => onChange('normal')}
          style={{ 
            padding: '0 12px', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
            background: isNormal ? '#52ff9d' : 'transparent',
            color: isNormal ? '#06111d' : (darkMode ? '#94a3b8' : '#64748b')
          }}
        >Normal</button>
        <button 
          onClick={() => onChange('not_checked')}
          style={{ 
            padding: '0 12px', borderLeft: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, cursor: 'pointer', fontSize: 10, fontWeight: 700,
            background: state.status === 'not_checked' ? (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'transparent',
            color: state.status === 'not_checked' ? (darkMode ? '#fff' : '#000') : (darkMode ? '#94a3b8' : '#64748b')
          }}
        >NC</button>
        <button 
          onClick={() => onChange('abnormal')}
          style={{ 
            padding: '0 12px', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
            background: isAbnormal ? '#ef4444' : 'transparent',
            color: isAbnormal ? '#fff' : (darkMode ? '#94a3b8' : '#64748b')
          }}
        >Abnormal</button>
      </div>

      {isAbnormal && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ flex: 1 }}>
          <input 
            placeholder="Describe abnormality..." 
            value={state.note} onChange={e => onChange('abnormal', e.target.value)}
            style={{ 
              width: '100%', padding: '6px 12px', borderRadius: 8, fontSize: 12,
              background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'inherit', outline: 'none'
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

const VitalInput = ({ label, value, onChange, placeholder, icon }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148, 163, 184, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>{icon}</div>}
      <input 
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: `10px 12px 10px ${icon ? '34px' : '12px'}`, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 13, outline: 'none' }} 
      />
    </div>
  </div>
);

const Input = ({ label, value, onChange }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148, 163, 184, 0.8)', textTransform: 'uppercase' }}>{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 13, outline: 'none' }} />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, minHeight = 80 }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148, 163, 184, 0.8)', textTransform: 'uppercase' }}>{label}</label>
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', minHeight, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical' }} />
  </div>
);

const Select = ({ label, options, value, onChange }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148, 163, 184, 0.8)', textTransform: 'uppercase' }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 13, outline: 'none' }}>
      {options.map((o: string) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
    </select>
  </div>
);
