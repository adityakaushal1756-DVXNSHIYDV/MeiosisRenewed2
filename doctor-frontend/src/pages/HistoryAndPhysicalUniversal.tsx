import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, CheckCircle2, AlertCircle, ChevronRight, Clipboard, 
  History as HistoryIcon, Activity, Stethoscope, FileText, 
  Check, User, Plus, Trash2, Heart, Wind, Brain, Eye, 
  Thermometer, Scaling, Weight, Info, Minus, Search, ChevronDown
} from 'lucide-react';
import type { HPNoteSnapshot } from '../types/Patient';

interface HPProps {
  onClose: () => void;
  patientId?: string | null;
  patientName?: string;
  darkMode?: boolean;
  onSaveDraft?: (snapshot: HPNoteSnapshot) => void;
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

export const HistoryAndPhysicalUniversal: React.FC<HPProps> = ({ onClose, patientId, patientName, darkMode, onSaveDraft }) => {
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({ history: true });

  const toggleTabExpansion = (tabId: string) => {
    setExpandedTabs(prev => ({ ...prev, [tabId]: !prev[tabId] }));
  };

  const handleSubSectionClick = (subId: string) => {
    const element = document.getElementById(subId);
    if (element) {
      isAutoScrolling.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update active tab based on prefix
      const tabId = subId.split('_')[0] as TabType;
      setActiveTab(tabId);
      setTimeout(() => { isAutoScrolling.current = false; }, 800);
    }
  };

  const sidebarData = [
    { 
      id: 'history', label: 'History', icon: <HistoryIcon size={18} />, 
      subItems: [
        { id: 'history_vitals', label: 'Patient Vitals' },
        { id: 'history_medical', label: 'Medical & Surgical' },
        { id: 'history_social', label: 'Social History' }
      ]
    },
    { 
      id: 'ros', label: 'Review of Systems', icon: <Activity size={18} />, 
      subItems: Object.keys(ROS_CONFIG).map(key => ({ id: `ros_${key.toLowerCase().replace(/\s+/g, '_')}`, label: key }))
    },
    { 
      id: 'physical', label: 'Physical Exam', icon: <Stethoscope size={18} />, 
      subItems: Object.keys(PE_CONFIG).map(key => ({ id: `pe_${key.toLowerCase().replace(/\s+/g, '_')}`, label: key }))
    },
    { 
      id: 'plan', label: 'Findings & Plan', icon: <FileText size={18} />, 
      subItems: [
        { id: 'plan_findings', label: 'Diagnostic Findings' },
        { id: 'plan_impressions', label: 'Impressions & Assessment' },
        { id: 'plan_treatment', label: 'Treatment Plan' }
      ]
    },
  ];
  const [isSaved, setIsSaved] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const handleSaveDraft = () => {
    const snapshot: HPNoteSnapshot = {
      savedAt: new Date().toISOString(),
      vitals: {
        temp: form.vitals.temp,
        hr: form.vitals.hr,
        rr: form.vitals.rr,
        bpSupine: form.vitals.bpSupine,
        bpSeated: form.vitals.bpSeated,
        height: form.vitals.height,
        weight: form.vitals.weight,
        pulseOx: form.vitals.pulseOx,
        pain: form.vitals.pain,
      },
      medicalHistory: form.medicalHistory,
      surgicalHistory: form.surgicalHistory,
      social: {
        tobacco: form.social.tobacco,
        tobaccoPkYrs: form.social.tobaccoPkYrs,
        illicitDrugsTypes: form.social.illicitDrugsTypes,
        alcoholFreq: form.social.alcoholFreq,
        occupation: form.social.occupation,
        other: form.social.other,
      },
      ros: form.ros,
      pe: form.pe,
      findings: form.findings,
      impressions: form.impressions,
      plan: form.plan,
    };
    onSaveDraft?.(snapshot);
    onClose();
  };

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

  const kbState = React.useRef({ activeTab, selectedRowId, activeItems });
  React.useEffect(() => {
    kbState.current = { activeTab, selectedRowId, activeItems };
  }, [activeTab, selectedRowId, activeItems]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { activeTab: currentTab, selectedRowId: currentSelected, activeItems: currentItems } = kbState.current;
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable;
      
      if (e.key.toLowerCase() === 'o' || e.key.toLowerCase() === 'i') {
        if (!isTyping) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
      }

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

      const isArrowNav = e.key === 'ArrowDown' || e.key === 'ArrowUp';
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
        if (isTyping) (e.target as HTMLElement).blur();
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

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = React.useRef(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const isAutoScrolling = React.useRef(false);
  const TABS: TabType[] = ['history', 'ros', 'physical', 'plan'];

  const sectionRefs: Record<TabType, React.RefObject<HTMLDivElement>> = {
    history: React.useRef<HTMLDivElement>(null),
    ros: React.useRef<HTMLDivElement>(null),
    physical: React.useRef<HTMLDivElement>(null),
    plan: React.useRef<HTMLDivElement>(null),
  };

  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);

  const sectionVisibilities = React.useRef<Record<string, { ratio: number, top: number }>>({});

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isAutoScrolling.current) return;
        
        entries.forEach(entry => {
          const id = entry.target.getAttribute('data-section') || entry.target.id;
          if (!id) return;

          sectionVisibilities.current[id] = {
            ratio: entry.intersectionRatio,
            top: entry.boundingClientRect.top
          };
        });

        let bestSection: TabType | null = null;
        let bestSub: string | null = null;
        let minSectionTop = Infinity;
        let minSubTop = Infinity;

        Object.entries(sectionVisibilities.current).forEach(([id, data]) => {
          if (data.ratio > 0) {
            // We want the section that is currently "at or just past" the trigger line (120px)
            // A section is a good candidate if its top is <= 150px
            if (['history', 'ros', 'physical', 'plan'].includes(id)) {
              if (data.top <= 150 && (bestSection === null || data.top > sectionVisibilities.current[bestSection]?.top)) {
                bestSection = id as TabType;
              }
            } else {
              // Same for sub-sections
              if (data.top <= 150 && (bestSub === null || data.top > sectionVisibilities.current[bestSub]?.top)) {
                bestSub = id;
              }
            }
          }
        });

        if (bestSection && bestSection !== activeTab) {
          setActiveTab(bestSection);
        }
        if (bestSub && bestSub !== activeSubSection) {
          setActiveSubSection(bestSub);
          // Auto-expand the parent if it's a sub-item being viewed
          const parentId = String(bestSub).split('_')[0];
          if (parentId && (parentId === 'history' || parentId === 'ros' || parentId === 'pe' || parentId === 'plan')) {
            const tabId = parentId === 'pe' ? 'physical' : parentId;
            setExpandedTabs(prev => ({ ...prev, [tabId]: true }));
          }
        }
      },
      { 
        threshold: Array.from({ length: 11 }, (_, i) => i * 0.1),
        root: scrollContainerRef.current,
        rootMargin: '-100px 0px -70% 0px'
      }
    );

    // Observe main sections
    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    // Observe sub-sections
    const subSections = document.querySelectorAll('[id^="history_"], [id^="ros_"], [id^="pe_"], [id^="plan_"]');
    subSections.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [activeTab, activeSubSection]);

  // Auto-scroll sidebar to keep active item in view
  React.useEffect(() => {
    if (isAutoScrolling.current) return;
    
    const targetId = activeSubSection ? `sidebar_sub_${activeSubSection}` : `sidebar_main_${activeTab}`;
    const sidebarEl = document.getElementById(targetId);
    
    if (sidebarEl && sidebarRef.current) {
      sidebarEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTab, activeSubSection]);

  const handleNavClick = (tabId: TabType) => {
    const targetRef = sectionRefs[tabId];
    if (targetRef.current) {
      isAutoScrolling.current = true;
      setActiveTab(tabId);
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { isAutoScrolling.current = false; }, 800);
    }
  };

  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const currentScrollY = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const isScrollingDown = currentScrollY > lastScrollY.current;
    const isScrollingUp = currentScrollY < lastScrollY.current - 5;
    const isNearBottom = currentScrollY + clientHeight >= scrollHeight - 80;

    if (isScrollingDown && currentScrollY > 80 && !isNearBottom) {
      setShowHeader(false);
    } else if (isScrollingUp || currentScrollY <= 80) {
      setShowHeader(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const hasVisibleItems = (items: Record<string, ItemState>, sectionName: string) => {
    if (matchesSearch(sectionName)) return true;
    return Object.keys(items).some(key => matchesSearch(key));
  };

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
    const secKey = id.split('_')[1];
    setCollapsedSections(prev => ({ ...prev, [secKey]: false }));
    const element = document.getElementById(id);
    if (element) {
      isAutoScrolling.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { isAutoScrolling.current = false; }, 800);
    }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const results: { id: string; label: string; type: string; tab: TabType }[] = [];
    
    sidebarData.forEach(item => {
      item.subItems.forEach(sub => {
        if (sub.label.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ id: sub.id, label: sub.label, type: 'Category', tab: item.id as TabType });
        }
      });
    });

    Object.entries(ROS_CONFIG).forEach(([sec, items]) => {
      items.forEach(item => {
        if (item.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ 
            id: `ros_${sec}_${item}`, 
            label: item.replace(/([A-Z])/g, ' $1').trim(), 
            type: `ROS: ${sec}`, 
            tab: 'ros' 
          });
        }
      });
    });

    Object.entries(PE_CONFIG).forEach(([sec, items]) => {
      items.forEach(item => {
        if (item.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ 
            id: `physical_${sec}_${item}`, 
            label: item.replace(/([A-Z])/g, ' $1').trim(), 
            type: `Exam: ${sec}`, 
            tab: 'physical' 
          });
        }
      });
    });

    return results.slice(0, 8);
  }, [searchQuery]);

  const handleSearchResultClick = (res: any) => {
    if (res.id.includes('_') && res.id.split('_').length > 2) {
      // It's a specific row item
      navigateToAbnormality(res.tab, res.id);
    } else {
      // It's a section/category
      handleSubSectionClick(res.id);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
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
      <motion.div 
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: showHeader ? 0 : -120, opacity: showHeader ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '20px 24px', 
          zIndex: 2001,
          pointerEvents: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}
      >
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

        <div style={{
          padding: '4px 8px 4px 12px', 
          borderRadius: 100,
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex', alignItems: 'center', gap: 8,
          background: darkMode ? 'rgba(10, 15, 28, 0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          pointerEvents: 'auto'
        }}>
          <motion.div 
            initial={false}
            animate={{ width: isSearchOpen ? 210 : 32 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0,0,0,0.05)',
              borderRadius: 100, padding: isSearchOpen ? '6px 12px' : '0',
              justifyContent: isSearchOpen ? 'flex-start' : 'center',
              height: 32,
              border: `1px solid ${isSearchOpen ? '#52ff9d44' : 'transparent'}`,
              position: 'relative',
              cursor: isSearchOpen ? 'default' : 'pointer'
            }}
            onClick={() => { if(!isSearchOpen) { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); } }}
          >
            <Search size={14} color={isSearchOpen ? '#52ff9d' : (darkMode ? '#94a3b8' : '#64748b')} />
            {isSearchOpen && (
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: darkMode ? '#f8fafc' : '#1e293b', fontSize: 12 }}
                onBlur={(e) => { 
                  // Delay blur to allow clicks on results
                  setTimeout(() => { if(!searchQuery) setIsSearchOpen(false); }, 200); 
                }}
              />
            )}

            <AnimatePresence>
              {isSearchOpen && searchQuery && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute', top: '130%', right: 0, width: 280,
                    background: darkMode ? 'rgba(15, 23, 42, 0.98)' : '#fff',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 20, padding: 8,
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    zIndex: 2005,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 800, color: '#52ff9d', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em' }}>Search Results</div>
                  {searchResults.map((res) => (
                    <button
                      key={res.id}
                      onClick={(e) => { e.stopPropagation(); handleSearchResultClick(res); }}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 12, border: 'none',
                        background: 'transparent', display: 'flex', flexDirection: 'column',
                        textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(82,255,157,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? '#f8fafc' : '#1e293b', textTransform: 'capitalize' }}>{res.label}</div>
                      <div style={{ fontSize: 10, color: darkMode ? '#64748b' : '#94a3b8' }}>{res.type}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
            {isSearchOpen && searchQuery && (
              <button onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                <X size={12} color={darkMode ? '#94a3b8' : '#64748b'} />
              </button>
            )}
            <button onClick={handleSaveDraft} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 100, border: 'none', background: '#52ff9d', color: '#0f172a', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(82,255,157,0.2)' }}>
              <Save size={14} /> Save Draft
            </button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: darkMode ? '#94a3b8' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
        </div>
      </motion.div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <motion.div 
          ref={sidebarRef}
          animate={{ paddingTop: showHeader ? 100 : 40 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          style={{ 
            width: 300, borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            padding: '24px 16px',
            display: 'flex', flexDirection: 'column', gap: 4,
            background: darkMode ? 'rgba(15, 23, 42, 0.2)' : 'rgba(0,0,0,0.01)',
            overflowY: 'auto',
            scrollBehavior: 'smooth'
          }}
        >
          {sidebarData.map(item => (
            <div key={item.id} id={`sidebar_main_${item.id}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <div 
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: activeTab === item.id ? (darkMode ? 'rgba(82,255,157,0.1)' : 'rgba(82,255,157,0.05)') : 'transparent',
                  color: activeTab === item.id ? '#52ff9d' : (darkMode ? '#94a3b8' : '#64748b'),
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  handleNavClick(item.id as TabType);
                  if (!expandedTabs[item.id]) toggleTabExpansion(item.id);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeTab === item.id ? '#52ff9d20' : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') }}>{item.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleTabExpansion(item.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', color: 'inherit', opacity: expandedTabs[item.id] ? 0.9 : 0.4, transform: expandedTabs[item.id] ? 'rotate(180deg)' : 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <ChevronDown size={18} />
                </button>
              </div>
              <AnimatePresence>
                {expandedTabs[item.id] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', paddingLeft: 26, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 26, top: 0, bottom: 15, width: 1.5, background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                      {item.subItems.map(sub => (
                        <div 
                          key={sub.id} 
                          id={`sidebar_sub_${sub.id}`}
                          onClick={() => handleSubSectionClick(sub.id)} 
                          style={{ 
                            position: 'relative', padding: '6px 12px 6px 20px', fontSize: 13, fontWeight: 700, 
                            color: activeSubSection === sub.id ? '#52ff9d' : (darkMode ? '#64748b' : '#94a3b8'), 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease',
                            opacity: activeSubSection === sub.id ? 1 : 0.7
                          }} 
                          onMouseEnter={(e) => e.currentTarget.style.color = '#52ff9d'} 
                          onMouseLeave={(e) => e.currentTarget.style.color = activeSubSection === sub.id ? '#52ff9d' : ''}
                        >
                          <div style={{ 
                            position: 'absolute', left: 0, top: '50%', width: 12, height: 1.5, 
                            background: activeSubSection === sub.id ? '#52ff9d44' : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                            boxShadow: activeSubSection === sub.id ? '0 0 8px #52ff9d44' : 'none'
                          }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <div style={{ marginTop: 'auto', padding: 20, background: darkMode ? 'rgba(239, 68, 68, 0.03)' : 'rgba(239, 68, 68, 0.05)', borderRadius: 24, border: '1px solid rgba(239,68,68,0.1)', maxHeight: '40vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} color="#ef4444" />
                <h5 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abnormalities</h5>
              </div>
              <motion.span animate={{ scale: [1, 1.2, 1] }} key={abnormalities.length} style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', background: '#ef4444', color: '#fff', borderRadius: 100 }}>{abnormalities.length}</motion.span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }} className="custom-scrollbar">
              {abnormalities.length === 0 ? <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.5)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>No findings documented.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{['ros', 'physical'].map(tabType => { const group = abnormalities.filter(a => a.tab === tabType); if (group.length === 0) return null; return <div key={tabType}><div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(148, 163, 184, 0.4)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ height: 1, flex: 1, background: 'rgba(239,68,68,0.1)' }} />{tabType === 'ros' ? 'ROS' : 'Physical Exam'}<div style={{ height: 1, flex: 1, background: 'rgba(239,68,68,0.1)' }} /></div>{group.map((a: any) => <motion.div key={a.id} whileHover={{ x: 4, background: 'rgba(239,68,68,0.05)' }} onClick={() => navigateToAbnormality(a.tab, a.id)} style={{ padding: '8px 12px', borderRadius: 12, cursor: 'pointer', borderLeft: '2px solid rgba(239,68,68,0.3)', transition: 'all 0.2s ease' }}><div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'capitalize', marginBottom: 2 }}>{a.item.replace(/([A-Z])/g, ' $1').trim()}</div><div style={{ fontSize: 10, color: 'rgba(148, 163, 184, 0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.note || 'No descriptive note provided.'}</div></motion.div>)}</div>; })}</div>}
            </div>
          </div>
        </motion.div>

        <motion.div ref={scrollContainerRef} onScroll={handleContentScroll} animate={{ paddingTop: showHeader ? 100 : 40 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} style={{ flex: 1, overflowY: 'auto', padding: '60px 40px', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            <div ref={sectionRefs.history} data-section="history">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {(matchesSearch('vitals') || ['temp', 'hr', 'rr', 'bp', 'height', 'weight', 'pulse'].some(v => matchesSearch(v))) && (
                  <div id="history_vitals">
                    <SectionHeader title="Patient Vitals" icon={<Activity size={20} />} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                      {matchesSearch('temp') && <VitalInput label="Temp (°F)" value={form.vitals.temp} onChange={(v: string) => updateVitals('temp', v)} icon={<Thermometer size={14} />} />}
                      {matchesSearch('heart') || matchesSearch('hr') && <VitalInput label="Heart Rate" value={form.vitals.hr} onChange={(v: string) => updateVitals('hr', v)} icon={<Heart size={14} />} />}
                      {matchesSearch('resp') || matchesSearch('rr') && <VitalInput label="Resp. Rate" value={form.vitals.rr} onChange={(v: string) => updateVitals('rr', v)} icon={<Wind size={14} />} />}
                      {matchesSearch('bp') && <VitalInput label="BP (Supine)" value={form.vitals.bpSupine} onChange={(v: string) => updateVitals('bpSupine', v)} placeholder="120/80" />}
                      {matchesSearch('bp') && <VitalInput label="BP (Seated)" value={form.vitals.bpSeated} onChange={(v: string) => updateVitals('bpSeated', v)} placeholder="122/82" />}
                      {matchesSearch('height') && <VitalInput label="Height" value={form.vitals.height} onChange={(v: string) => updateVitals('height', v)} icon={<Scaling size={14} />} />}
                      {matchesSearch('weight') && <VitalInput label="Weight" value={form.vitals.weight} onChange={(v: string) => updateVitals('weight', v)} icon={<Weight size={14} />} />}
                      {matchesSearch('pulse') || matchesSearch('ox') && <VitalInput label="Pulse Ox (%)" value={form.vitals.pulseOx} onChange={(v: string) => updateVitals('pulseOx', v)} />}
                    </div>
                  </div>
                )}
                {(matchesSearch('history') || matchesSearch('medical') || matchesSearch('surgical')) && (
                  <div id="history_medical">
                    <SectionHeader title="Medical & Surgical History" icon={<HistoryIcon size={20} />} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      {matchesSearch('medical') && <TextArea label="Past Medical History" value={form.medicalHistory} onChange={(v: string) => setForm(f => ({ ...f, medicalHistory: v }))} placeholder="Chronic conditions, hospitalizations..." />}
                      {matchesSearch('surgical') && <TextArea label="Past Surgical History" value={form.surgicalHistory} onChange={(v: string) => setForm(f => ({ ...f, surgicalHistory: v }))} placeholder="Surgeries, dates, surgeons..." />}
                    </div>
                  </div>
                )}
                {(matchesSearch('social') || matchesSearch('tobacco') || matchesSearch('alcohol') || matchesSearch('occupation')) && (
                  <div id="history_social">
                    <SectionHeader title="Social History" icon={<User size={20} />} />
                    <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: 24, borderRadius: 20, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
                        {matchesSearch('tobacco') && (
                          <PillSelect 
                            label="Tobacco Use" 
                            options={['Never', 'Daily', 'Occasional', 'Former']} 
                            value={form.social.tobacco} 
                            onChange={(v: string) => setForm(f => ({ ...f, social: { ...f.social, tobacco: v } }))} 
                            darkMode={darkMode}
                          />
                        )}
                        {matchesSearch('tobacco') && <Input label="PK / YRS" value={form.social.tobaccoPkYrs} onChange={(v: string) => setForm(f => ({ ...f, social: { ...f.social, tobaccoPkYrs: v } }))} />}
                        {matchesSearch('drugs') && <Input label="Illicit Drugs" value={form.social.illicitDrugsTypes} onChange={(v: string) => setForm(f => ({ ...f, social: { ...f.social, illicitDrugsTypes: v } }))} />}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                        {matchesSearch('alcohol') && <Input label="Alcohol Frequency" value={form.social.alcoholFreq} onChange={(v: string) => setForm(f => ({ ...f, social: { ...f.social, alcoholFreq: v } }))} />}
                        {matchesSearch('occupation') && <Input label="Occupation" value={form.social.occupation} onChange={(v: string) => setForm(f => ({ ...f, social: { ...f.social, occupation: v } }))} />}
                      </div>
                      {matchesSearch('other') && <TextArea label="Other Social (Living, Diet, Exercise)" value={form.social.other} onChange={(v: string) => setForm(f => ({ ...f, social: { ...f.social, other: v } }))} />}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div ref={sectionRefs.ros} data-section="ros">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <SectionHeader title="Review of Systems" icon={<Activity size={20} />} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setAllNormal('ros')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #52ff9d', background: 'transparent', color: '#52ff9d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Normal All</button>
                  <button onClick={() => setForm(f => ({ ...f, ros: createInitialSectionState(ROS_CONFIG) }))} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Object.entries(form.ros).filter(([secKey, items]) => hasVisibleItems(items, secKey)).map(([secKey, items]) => (
                  <div key={secKey} id={`ros_${secKey.toLowerCase().replace(/\s+/g, '_')}`}>
                    <CategoryCard title={secKey.toUpperCase()} onNormalAll={() => setSectionNormal('ros', secKey)} onReset={() => resetSection('ros', secKey)} isCollapsed={!!collapsedSections[`ros_${secKey}`]} onToggleCollapse={() => toggleSectionCollapse(`ros_${secKey}`)} darkMode={darkMode}>
                      {Object.entries(items).filter(([itemKey]) => matchesSearch(secKey) || matchesSearch(itemKey)).map(([itemKey, state]) => (
                        <ItemRow key={itemKey} label={itemKey} state={state} isSelected={selectedRowId === `ros_${secKey}_${itemKey}`} onChange={(status, note) => updateItem('ros', secKey, itemKey, status, note)} darkMode={darkMode} />
                      ))}
                    </CategoryCard>
                  </div>
                ))}
              </div>
            </div>
            <div ref={sectionRefs.physical} data-section="physical">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <SectionHeader title="Physical Examination" icon={<Stethoscope size={20} />} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setAllNormal('pe')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #52ff9d', background: 'transparent', color: '#52ff9d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Normal All</button>
                  <button onClick={() => setForm(f => ({ ...f, pe: createInitialSectionState(PE_CONFIG) }))} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Object.entries(form.pe).filter(([secKey, items]) => hasVisibleItems(items, secKey)).map(([secKey, items]) => (
                  <div key={secKey} id={`pe_${secKey.toLowerCase().replace(/\s+/g, '_')}`}>
                    <CategoryCard title={secKey.toUpperCase()} onNormalAll={() => setSectionNormal('pe', secKey)} onReset={() => resetSection('pe', secKey)} isCollapsed={!!collapsedSections[`pe_${secKey}`]} onToggleCollapse={() => toggleSectionCollapse(`pe_${secKey}`)} darkMode={darkMode}>
                      {Object.entries(items).filter(([itemKey]) => matchesSearch(secKey) || matchesSearch(itemKey)).map(([itemKey, state]) => (
                        <ItemRow key={itemKey} label={itemKey} state={state} isSelected={selectedRowId === `physical_${secKey}_${itemKey}`} onChange={(status, note) => updateItem('pe', secKey, itemKey, status, note)} darkMode={darkMode} />
                      ))}
                    </CategoryCard>
                  </div>
                ))}
              </div>
            </div>
            <div ref={sectionRefs.plan} data-section="plan">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {(matchesSearch('findings') || matchesSearch('ua') || matchesSearch('ekg') || matchesSearch('rad')) && (
                  <div id="plan_findings">
                    <SectionHeader title="Diagnostic Findings" icon={<Brain size={20} />} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {matchesSearch('ua') && <Input label="UA (Urinalysis)" value={form.findings.ua} onChange={(v: string) => setForm(f => ({ ...f, findings: { ...f.findings, ua: v } }))} />}
                      {matchesSearch('ekg') && <Input label="EKG / ECG" value={form.findings.ekg} onChange={(v: string) => setForm(f => ({ ...f, findings: { ...f.findings, ekg: v } }))} />}
                      {matchesSearch('rad') && <Input label="RAD (Imaging)" value={form.findings.rad} onChange={(v: string) => setForm(f => ({ ...f, findings: { ...f.findings, rad: v } }))} />}
                    </div>
                    {matchesSearch('other') && <TextArea label="Other Findings" value={form.findings.other} onChange={(v: string) => setForm(f => ({ ...f, findings: { ...f.findings, other: v } }))} />}
                  </div>
                )}
                {matchesSearch('impressions') && (
                  <div id="plan_impressions">
                    <SectionHeader title="Impressions & Assessment" icon={<AlertCircle size={20} />} />
                    <TextArea label="Impressions" value={form.impressions} onChange={(v: string) => setForm(f => ({ ...f, impressions: v }))} minHeight={120} />
                  </div>
                )}
                {matchesSearch('plan') && (
                  <div id="plan_treatment">
                    <SectionHeader title="Treatment Plan" icon={<CheckCircle2 size={20} />} />
                    <TextArea label="Plan" value={form.plan} onChange={(v: string) => setForm(f => ({ ...f, plan: v }))} minHeight={150} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ height: 100 }} />
        </motion.div>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '4px solid #52ff9d', paddingLeft: 16, marginBottom: 24 }}>
    <div style={{ color: '#52ff9d', opacity: 0.8 }}>{icon}</div>
    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
  </div>
);

const CategoryCard = ({ title, onNormalAll, onReset, children, isCollapsed, onToggleCollapse, darkMode }: any) => (
  <div style={{ padding: '24px 32px', borderRadius: 24, background: darkMode ? 'rgba(255,255,255,0.02)' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, boxShadow: darkMode ? 'none' : '0 10px 30px rgba(0,0,0,0.02)', transition: 'all 0.3s ease' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isCollapsed ? 'none' : `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingBottom: isCollapsed ? 0 : 12, marginBottom: isCollapsed ? 0 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={onToggleCollapse}>
        <motion.div animate={{ rotate: isCollapsed ? 0 : 90 }}>
          <ChevronRight size={16} color="#52ff9d" />
        </motion.div>
        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#52ff9d' }}>{title}</h4>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onNormalAll} style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: '#52ff9d20', color: '#52ff9d', border: 'none', cursor: 'pointer' }}>No Abnormals</button>
        <button onClick={onReset} style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'inherit', border: 'none', cursor: 'pointer' }}>Reset</button>
      </div>
    </div>
    <AnimatePresence>
      {!isCollapsed && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'visible' }}><div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingLeft: 12 }}>{children}</div></motion.div>}
    </AnimatePresence>
  </div>
);

const ItemRow = ({ label, state, onChange, isSelected, darkMode }: { label: string, state: ItemState, onChange: (s: ItemStatus, n?: string) => void, isSelected?: boolean, darkMode?: boolean }) => {
  const isAbnormal = state.status === 'abnormal';
  const isNormal = state.status === 'normal';
  const isNC = state.status === 'not_checked';
  const rowRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { if (isSelected && rowRef.current) { rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, [isSelected]);
  return (
    <div ref={rowRef} style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '16px 24px', margin: '0 -24px', borderRadius: 24, position: 'relative', background: isSelected ? (darkMode ? 'rgba(82,255,157,0.1)' : 'rgba(82,255,157,0.12)') : 'transparent', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}>
      {isSelected && <motion.div layoutId="selection-accent" style={{ position: 'absolute', left: 4, top: '25%', bottom: '25%', width: 8, background: '#52ff9d', borderRadius: 100, boxShadow: '0 0 25px rgba(82,255,157,0.5)' }} transition={{ type: 'spring', stiffness: 450, damping: 38 }} />}
      <div style={{ width: 220, flexShrink: 0, fontSize: 15, fontWeight: isSelected ? 800 : 700, color: isAbnormal ? '#ef4444' : isNormal ? '#52ff9d' : 'inherit', textTransform: 'capitalize', userSelect: 'none' }}>{label.replace(/([A-Z])/g, ' $1').trim()}</div>
      <div style={{ display: 'flex', padding: 4, borderRadius: 100, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', height: 48, width: 340, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>{isNormal && <motion.div layoutId={`pill-bg-${label}`} style={{ position: 'absolute', inset: 0, background: '#52ff9d', borderRadius: 100 }} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}<button onClick={() => onChange('normal')} style={{ flex: 1, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, borderRadius: 100, background: 'transparent', color: isNormal ? '#06111d' : (darkMode ? '#94a3b8' : '#64748b'), transition: 'color 0.2s ease', zIndex: 1, position: 'relative' }}>Normal</button></div>
        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>{isNC && <motion.div layoutId={`pill-bg-${label}`} style={{ position: 'absolute', inset: 0, background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', borderRadius: 100 }} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}<button onClick={() => onChange('not_checked')} style={{ flex: 1, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, borderRadius: 100, background: 'transparent', color: isNC ? (darkMode ? '#fff' : '#000') : (darkMode ? '#94a3b8' : '#64748b'), transition: 'color 0.2s ease', zIndex: 1, position: 'relative' }}>NC</button></div>
        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>{isAbnormal && <motion.div layoutId={`pill-bg-${label}`} style={{ position: 'absolute', inset: 0, background: '#ef4444', borderRadius: 100 }} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}<button onClick={() => onChange('abnormal')} style={{ flex: 1, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, borderRadius: 100, background: 'transparent', color: isAbnormal ? '#fff' : (darkMode ? '#94a3b8' : '#64748b'), transition: 'color 0.2s ease', zIndex: 1, position: 'relative' }}>Abnormal</button></div>
      </div>
      {isAbnormal && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ flex: 1 }}><input placeholder="Describe abnormality..." value={state.note} onChange={e => onChange('abnormal', e.target.value)} style={{ width: '100%', padding: '12px 20px', borderRadius: 16, fontSize: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: 'inherit', outline: 'none', fontWeight: 500 }} /></motion.div>}
    </div>
  );
};

const VitalInput = ({ label, value, onChange, placeholder, icon }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>{icon}</div>}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: `14px 16px 14px ${icon ? '44px' : '16px'}`, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit', fontSize: 15, outline: 'none', fontWeight: 500 }} />
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

const PillSelect = ({ label, options, value, onChange, darkMode }: any) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 800, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      <div style={{ display: 'flex', padding: 4, borderRadius: 100, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', height: 44, position: 'relative', width: 'fit-content' }}>
        {options.map((opt: string) => {
          const isActive = (value || '').toLowerCase() === opt.toLowerCase();
          return (
            <div key={opt} style={{ position: 'relative', flex: 1, display: 'flex' }}>
              {isActive && (
                <motion.div 
                  layoutId={`pill-bg-${label}`} 
                  style={{ position: 'absolute', inset: 0, background: '#52ff9d', borderRadius: 100 }} 
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} 
                />
              )}
              <button 
                onClick={() => onChange(opt)} 
                style={{ 
                  flex: 1, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, 
                  borderRadius: 100, background: 'transparent', 
                  color: isActive ? '#06111d' : (darkMode ? '#94a3b8' : '#64748b'), 
                  transition: 'color 0.2s ease', zIndex: 1, position: 'relative',
                  padding: '0 12px', whiteSpace: 'nowrap'
                }}
              >
                {opt.toUpperCase()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
