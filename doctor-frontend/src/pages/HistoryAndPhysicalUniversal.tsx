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
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Helper to get flattened items for the active tab (ROS/PE)
  const activeItems = useMemo(() => {
    if (activeTab !== 'ros' && activeTab !== 'physical') return [];
    const config = activeTab === 'ros' ? ROS_CONFIG : PE_CONFIG;
    const flat: { id: string; sec: string; item: string }[] = [];
    Object.entries(config).forEach(([sec, items]) => {
      items.forEach(item => {
        flat.push({ id: `${activeTab}_${sec}_${item}`, sec, item });
      });
    });
    return flat;
  }, [activeTab]);

  // Use a Ref to keep the latest state accessible to a stable event listener
  // This prevents the listener from "sticking" or missing events during state updates
  const kbState = React.useRef({ activeTab, selectedRowId, activeItems });
  React.useEffect(() => {
    kbState.current = { activeTab, selectedRowId, activeItems };
  }, [activeTab, selectedRowId, activeItems]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { activeTab: currentTab, selectedRowId: currentSelected, activeItems: currentItems } = kbState.current;
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable;
      
      // Block dashboard global shortcuts 'o' and 'i'
      if (e.key.toLowerCase() === 'o' || e.key.toLowerCase() === 'i') {
        if (!isTyping) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
      }

      // Number keys 1, 2, 3 for status setting
      if (!isTyping && currentSelected && ['1', '2', '3'].includes(e.key)) {
        const item = currentItems.find(i => i.id === currentSelected);
        if (item) {
          const tabKey = currentTab === 'physical' ? 'pe' : 'ros';
          const status: ItemStatus = e.key === '1' ? 'normal' : e.key === '2' ? 'not_checked' : 'abnormal';
          updateItem(tabKey, item.sec, item.item, status);
          e.preventDefault();
          return;
        }
      }

      // Navigation
      const isArrowNav = e.key === 'ArrowDown' || e.key === 'ArrowUp';
      // Allow arrows to work in single-line inputs, but block in textareas or if typing other keys
      const isTextArea = e.target instanceof HTMLTextAreaElement;
      
      if (isTyping && !isArrowNav) return;
      if (isTyping && isArrowNav && isTextArea) return;

      const tabs: TabType[] = ['history', 'ros', 'physical', 'plan'];

      if (e.key === 'ArrowRight' && !isTyping) {
        setActiveTab(current => {
          const idx = tabs.indexOf(current);
          return tabs[(idx + 1) % tabs.length];
        });
        setSelectedRowId(null);
      } else if (e.key === 'ArrowLeft' && !isTyping) {
        setActiveTab(current => {
          const idx = tabs.indexOf(current);
          return tabs[(idx - 1 + tabs.length) % tabs.length];
        });
        setSelectedRowId(null);
      } else if (e.key === 'ArrowDown' && currentItems.length > 0) {
        e.preventDefault();
        if (isTyping) (e.target as HTMLElement).blur(); // Exit input focus when moving
        setSelectedRowId(current => {
          if (!current) return currentItems[0].id;
          const idx = currentItems.findIndex(i => i.id === current);
          const nextIdx = Math.min(idx + 1, currentItems.length - 1);
          return currentItems[nextIdx].id;
        });
      } else if (e.key === 'ArrowUp' && currentItems.length > 0) {
        e.preventDefault();
        if (isTyping) (e.target as HTMLElement).blur();
        setSelectedRowId(current => {
          if (!current) return currentItems[0].id;
          const idx = currentItems.findIndex(i => i.id === current);
          const prevIdx = Math.max(idx - 1, 0);
          return currentItems[prevIdx].id;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // --- COLLAPSE PREFERENCE ---
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('hp_builder_collapsed');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  React.useEffect(() => {
    localStorage.setItem('hp_builder_collapsed', JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  const toggleSectionCollapse = (sec: string) => {
    setCollapsedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // --- SCROLL ANIMATION ---
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = React.useRef(0);
  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
    lastScrollY.current = currentScrollY;
  };

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
    const list: any[] = [];
    ['ros', 'pe'].forEach(tab => {
      const sections = form[tab as 'ros' | 'pe'];
      Object.keys(sections).forEach(sec => {
        const items = sections[sec];
        Object.keys(items).forEach(item => {
          if (items[item].status === 'abnormal') {
            const tabKey = tab === 'ros' ? 'ros' : 'physical';
            list.push({ tab: tabKey, sec, item, note: items[item].note, id: `${tabKey}_${sec}_${item}` });
          }
        });
      });
    });
    return list;
  }, [form.ros, form.pe]);

  const navigateToAbnormality = (tab: TabType, id: string) => {
    setActiveTab(tab);
    setSelectedRowId(id);
    // Ensure the section is expanded
    const secKey = id.split('_')[1];
    setCollapsedSections(prev => ({ ...prev, [secKey]: false }));
  };

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
      {/* Header Container (Split Independent Pills) */}
      <motion.div 
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: showHeader ? 0 : -120, opacity: showHeader ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '20px 24px', // Align with sidebar internal padding
          zIndex: 2001,
          pointerEvents: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}
      >
        {/* Left Info Pill - Limited to Sidebar Width */}
        <div style={{
          padding: '6px 16px', 
          borderRadius: 100,
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex', alignItems: 'center', gap: 10,
          background: darkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          width: 240, pointerEvents: 'auto'
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#52ff9d20', color: '#52ff9d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clipboard size={16} />
          </div>
          <div>
            <h1 style={{ fontSize: 13, fontWeight: 900, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#52ff9d' }}>Universal H&P</h1>
            <p style={{ fontSize: 9, color: darkMode ? '#94a3b8' : '#64748b', margin: 0, opacity: 0.7, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {patientName ? patientName : 'Clinician Tool'}
            </p>
          </div>
        </div>

        {/* Right Actions Pill */}
        <div style={{
          padding: '4px', 
          borderRadius: 100,
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex', alignItems: 'center', gap: 4,
          background: darkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          pointerEvents: 'auto'
        }}>
          <button 
            onClick={() => { setIsSaved(true); setTimeout(() => setIsSaved(false), 2000); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
              borderRadius: 100, border: 'none', background: '#52ff9d', color: '#06111d',
              fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(82,255,157,0.1)'
            }}
          >
            {isSaved ? <Check size={14} /> : <Save size={14} />}
            {isSaved ? 'Saved' : 'Save Draft'}
          </button>
          
          <button 
            onClick={onClose} 
            style={{ 
              width: 32, height: 32, borderRadius: '50%', border: 'none', 
              background: 'rgba(255,255,255,0.03)', color: 'inherit', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>

      {/* Main Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Navigation Sidebar */}
        <motion.div 
          animate={{ paddingTop: showHeader ? 100 : 40 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          style={{ 
            width: 280, borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            padding: '24px', // Static side/bottom padding
            display: 'flex', flexDirection: 'column', gap: 8,
            background: darkMode ? 'rgba(15, 23, 42, 0.2)' : 'rgba(0,0,0,0.01)'
          }}
        >
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
          
          {/* Advanced Quick Peek Summary */}
          <div style={{ 
            marginTop: 'auto', padding: 20, 
            background: darkMode ? 'rgba(239, 68, 68, 0.03)' : 'rgba(239, 68, 68, 0.05)', 
            borderRadius: 24, border: '1px solid rgba(239,68,68,0.1)',
            maxHeight: '40vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} color="#ef4444" />
                <h5 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abnormalities</h5>
              </div>
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }} key={abnormalities.length}
                style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', background: '#ef4444', color: '#fff', borderRadius: 100 }}
              >
                {abnormalities.length}
              </motion.span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }} className="custom-scrollbar">
              {abnormalities.length === 0 ? (
                <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.5)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                  No findings documented.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['ros', 'physical'].map(tabType => {
                    const group = abnormalities.filter(a => a.tab === tabType);
                    if (group.length === 0) return null;
                    return (
                      <div key={tabType}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(148, 163, 184, 0.4)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ height: 1, flex: 1, background: 'rgba(239,68,68,0.1)' }} />
                          {tabType === 'ros' ? 'ROS' : 'Physical Exam'}
                          <div style={{ height: 1, flex: 1, background: 'rgba(239,68,68,0.1)' }} />
                        </div>
                        {group.map((a: any, i: number) => (
                          <motion.div 
                            key={a.id} whileHover={{ x: 4, background: 'rgba(239,68,68,0.05)' }}
                            onClick={() => navigateToAbnormality(a.tab, a.id)}
                            style={{ 
                              padding: '8px 12px', borderRadius: 12, cursor: 'pointer',
                              borderLeft: '2px solid rgba(239,68,68,0.3)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'capitalize', marginBottom: 2 }}>{a.item.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div style={{ fontSize: 10, color: 'rgba(148, 163, 184, 0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.note || 'No descriptive note provided.'}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div 
          onScroll={handleContentScroll}
          animate={{ paddingTop: showHeader ? 100 : 40 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          style={{ flex: 1, overflowY: 'auto', padding: '60px 40px', position: 'relative' }}
        >
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
                      isCollapsed={!!collapsedSections[`ros_${secKey}`]}
                      onToggleCollapse={() => toggleSectionCollapse(`ros_${secKey}`)}
                      darkMode={darkMode}
                    >
                      {Object.entries(items).map(([itemKey, state]) => (
                        <ItemRow 
                          key={itemKey} label={itemKey} state={state} 
                          isSelected={selectedRowId === `ros_${secKey}_${itemKey}`}
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
                      isCollapsed={!!collapsedSections[`pe_${secKey}`]}
                      onToggleCollapse={() => toggleSectionCollapse(`pe_${secKey}`)}
                      darkMode={darkMode}
                    >
                      {Object.entries(items).map(([itemKey, state]) => (
                        <ItemRow 
                          key={itemKey} label={itemKey} state={state} 
                          isSelected={selectedRowId === `physical_${secKey}_${itemKey}`}
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
        </motion.div>
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

const CategoryCard = ({ title, onNormalAll, onReset, children, isCollapsed, onToggleCollapse, darkMode }: any) => (
  <div style={{ 
    padding: '24px 32px', borderRadius: 24, 
    background: darkMode ? 'rgba(255,255,255,0.02)' : '#fff',
    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
    boxShadow: darkMode ? 'none' : '0 10px 30px rgba(0,0,0,0.02)',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isCollapsed ? 'none' : `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingBottom: isCollapsed ? 0 : 12, marginBottom: isCollapsed ? 0 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={onToggleCollapse}>
        <motion.div animate={{ rotate: isCollapsed ? 0 : 90 }}>
          <ChevronRight size={16} color="#52ff9d" />
        </motion.div>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#52ff9d' }}>{title}</h4>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onNormalAll} style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: '#52ff9d20', color: '#52ff9d', border: 'none', cursor: 'pointer' }}>No Abnormals</button>
        <button onClick={onReset} style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'inherit', border: 'none', cursor: 'pointer' }}>Reset</button>
      </div>
    </div>
    <AnimatePresence>
      {!isCollapsed && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }} 
          exit={{ height: 0, opacity: 0 }}
          style={{ overflow: 'visible' }} // Allow indicator glow to be visible
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingLeft: 12 }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const ItemRow = ({ label, state, onChange, isSelected, darkMode }: { label: string, state: ItemState, onChange: (s: ItemStatus, n?: string) => void, isSelected?: boolean, darkMode?: boolean }) => {
  const isAbnormal = state.status === 'abnormal';
  const isNormal = state.status === 'normal';
  const isNC = state.status === 'not_checked';
  const rowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isSelected]);

  return (
    <div 
      ref={rowRef}
      style={{ 
        display: 'flex', alignItems: 'center', gap: 32, padding: '16px 24px',
        margin: '0 -24px',
        borderRadius: 24,
        position: 'relative',
        background: isSelected ? (darkMode ? 'rgba(82,255,157,0.1)' : 'rgba(82,255,157,0.12)') : 'transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
      }}
    >
      {/* Selection Accent Bar (Floating Pill) */}
      {isSelected && (
        <motion.div 
          layoutId="selection-accent"
          style={{ 
            position: 'absolute', left: 4, top: '25%', bottom: '25%', width: 8, 
            background: '#52ff9d', borderRadius: 100,
            boxShadow: '0 0 25px rgba(82,255,157,0.5)'
          }} 
          transition={{ type: 'spring', stiffness: 450, damping: 38 }}
        />
      )}

      <div style={{ 
        width: 220, flexShrink: 0, fontSize: 15, fontWeight: isSelected ? 800 : 700, 
        color: isAbnormal ? '#ef4444' : isNormal ? '#52ff9d' : 'inherit', 
        textTransform: 'capitalize',
        userSelect: 'none' // Prevent messy text selection during navigation
      }}>
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </div>

      <div style={{ 
        display: 'flex', padding: 4, borderRadius: 100, 
        background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
        height: 48, width: 340, flexShrink: 0, position: 'relative'
      }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
          {isNormal && (
            <motion.div 
              layoutId={`pill-bg-${label}`}
              style={{ position: 'absolute', inset: 0, background: '#52ff9d', borderRadius: 100 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <button 
            onClick={() => onChange('normal')}
            style={{ 
              flex: 1, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, borderRadius: 100,
              background: 'transparent',
              color: isNormal ? '#06111d' : (darkMode ? '#94a3b8' : '#64748b'),
              transition: 'color 0.2s ease', zIndex: 1, position: 'relative'
            }}
          >Normal</button>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
          {isNC && (
            <motion.div 
              layoutId={`pill-bg-${label}`}
              style={{ position: 'absolute', inset: 0, background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', borderRadius: 100 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <button 
            onClick={() => onChange('not_checked')}
            style={{ 
              flex: 1, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, borderRadius: 100,
              background: 'transparent',
              color: isNC ? (darkMode ? '#fff' : '#000') : (darkMode ? '#94a3b8' : '#64748b'),
              transition: 'color 0.2s ease', zIndex: 1, position: 'relative'
            }}
          >NC</button>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
          {isAbnormal && (
            <motion.div 
              layoutId={`pill-bg-${label}`}
              style={{ position: 'absolute', inset: 0, background: '#ef4444', borderRadius: 100 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <button 
            onClick={() => onChange('abnormal')}
            style={{ 
              flex: 1, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, borderRadius: 100,
              background: 'transparent',
              color: isAbnormal ? '#fff' : (darkMode ? '#94a3b8' : '#64748b'),
              transition: 'color 0.2s ease', zIndex: 1, position: 'relative'
            }}
          >Abnormal</button>
        </div>
      </div>

      {isAbnormal && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ flex: 1 }}>
          <input 
            placeholder="Describe abnormality..." 
            value={state.note} onChange={e => onChange('abnormal', e.target.value)}
            style={{ 
              width: '100%', padding: '12px 20px', borderRadius: 16, fontSize: 14,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'inherit', outline: 'none', fontWeight: 500
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

const VitalInput = ({ label, value, onChange, placeholder, icon }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>{icon}</div>}
      <input 
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: `14px 16px 14px ${icon ? '44px' : '16px'}`, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit', fontSize: 15, outline: 'none', fontWeight: 500 }} 
      />
    </div>
  </div>
);

const Input = ({ label, value, onChange }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit', fontSize: 15, outline: 'none', fontWeight: 500 }} />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, minHeight = 100 }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
    <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', minHeight, padding: '16px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit', fontSize: 15, outline: 'none', resize: 'vertical', lineHeight: '1.6', fontWeight: 500 }} />
  </div>
);

const Select = ({ label, options, value, onChange }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit', fontSize: 15, outline: 'none', cursor: 'pointer', fontWeight: 500 }}>
      {options.map((o: string) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
    </select>
  </div>
);
