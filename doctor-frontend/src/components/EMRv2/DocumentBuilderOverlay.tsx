import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, FileText, Activity, Shield, Users, Heart, Brain, Scissors, Stethoscope, Eye, Baby, Syringe, ClipboardList, Thermometer, FlaskConical, Map, Construction, Hammer, Minimize2, Maximize2 } from 'lucide-react';

interface DocumentBuilderOverlayProps {
  onClose: () => void;
  darkMode?: boolean;
}

const CATEGORIES = [
  {
    id: 'universal',
    title: 'Universal / Administrative',
    icon: <Users size={20} />,
    color: '#6366f1',
    documents: [
      'Patient Registration Form', 'Patient Demographic Sheet', 'Insurance & Payer Authorization Form',
      'Medical Record Release / HIPAA Authorization Form', 'Patient Rights & Responsibilities Form',
      'Financial Responsibility Agreement', 'Advance Beneficiary Notice (ABN)', 'Patient Registration PDF'
    ]
  },
  {
    id: 'clinical',
    title: 'Clinical Foundation',
    icon: <ClipboardList size={20} />,
    color: '#10b981',
    documents: [
      'History & Physical (H&P)', 'Chief Complaint / Presenting Problem Note', 'SOAP Note',
      'Progress Note (Daily/Follow-up)', 'Consultation Request & Report', 'Referral Letter',
      'Transfer Summary', 'Discharge Summary', 'Death Summary'
    ]
  },
  {
    id: 'consent',
    title: 'Consent & Legal',
    icon: <Shield size={20} />,
    color: '#f59e0b',
    documents: [
      'Informed Consent for Treatment', 'Surgical / Procedural Consent Form', 'Anesthesia Consent Form',
      'Refusal of Treatment Form (AMA)', 'Blood Transfusion Consent', 'Clinical Trial / Research Consent',
      'Photography / Video Consent', 'Advance Directive / Living Will', 'Do Not Resuscitate (DNR)',
      'POLST Form', 'Healthcare Power of Attorney', 'Guardianship Designation'
    ]
  },
  {
    id: 'orders',
    title: 'Orders & Prescriptions',
    icon: <FileText size={20} />,
    color: '#ec4899',
    documents: [
      'Physician Order Sheet (POS)', 'Medication Administration Record (MAR)', 'Standing Orders',
      'Discharge Medication Reconciliation', 'IV Fluid & Electrolyte Order Sheet', 'Diet Order Sheet',
      'Nursing Care Order', 'Restraint Order Form'
    ]
  },
  {
    id: 'nursing',
    title: 'Nursing Documents',
    icon: <Thermometer size={20} />,
    color: '#8b5cf6',
    documents: [
      'Nursing Assessment Form', 'Nursing Care Plan', 'Nursing Progress Notes', 'Intake & Output (I&O) Chart',
      'Vital Signs Flow Sheet', 'Fall Risk Assessment', 'Skin/Wound Assessment Form', 'Patient Safety Checklist',
      'Bedside Handoff / SBAR', 'Nursing Admission Assessment'
    ]
  },
  {
    id: 'cardiology',
    title: 'Cardiology',
    icon: <Heart size={20} />,
    color: '#ef4444',
    documents: [
      'Cardiac H&P', 'ECG / EKG Tracing Report', 'Echocardiography Report', 'Stress Test Report',
      'Holter Monitor Report', 'Cardiac Catheterization Report', 'Coronary Angiography Report',
      'PCI Procedure Note', 'EP Study Report', 'Device Interrogation Report', 'Cardiac Rehabilitation Note',
      'Heart Failure Management Plan', 'Anticoagulation Clinic Note', 'Lipid Management Record',
      'Hypertension Management Note', 'Cardiology Outpatient Follow-up'
    ]
  },
  {
    id: 'neurology',
    title: 'Neurology',
    icon: <Brain size={20} />,
    color: '#3b82f6',
    documents: [
      'Neurological H&P', 'MMSE Form', 'MoCA Form', 'Glasgow Coma Scale (GCS)', 'NIH Stroke Scale (NIHSS)',
      'EEG Report', 'NCS / EMG Report', 'Lumbar Puncture Note', 'Epilepsy Seizure Log',
      'Movement Disorder Assessment', 'Dementia Evaluation', 'Neurology Consultation Report',
      'Headache/Migraine Assessment', 'Multiple Sclerosis Log', 'Stroke Thrombolysis Checklist',
      'Neuroradiology Report'
    ]
  },
  {
    id: 'obgyn',
    title: 'Obstetrics & Gynecology',
    icon: <Baby size={20} />,
    color: '#f472b6',
    documents: [
      'Prenatal Flow Sheet', 'Obstetric History Form', 'Ultrasound Obstetric Report', 'Fetal Monitoring Strip',
      'Labor & Delivery Note', 'Partograph', 'Delivery Summary', 'Postpartum Assessment',
      'Newborn Assessment', 'APGAR Score Form', 'Gynecology H&P', 'Pap Smear Report',
      'Colposcopy Report', 'Contraception Counseling'
    ]
  },
  {
    id: 'pediatrics',
    title: 'Pediatrics',
    icon: <Stethoscope size={20} />,
    color: '#fbbf24',
    documents: [
      'Pediatric H&P', 'Well-Child Visit Form', 'Growth Chart', 'Developmental Assessment',
      'Neonatal Assessment', 'Immunization Schedule', 'Newborn Screening Result', 'Pediatric Pain Scale'
    ]
  },
  {
    id: 'emergency',
    title: 'Emergency Medicine',
    icon: <Activity size={20} />,
    color: '#dc2626',
    documents: [
      'Emergency Triage Form', 'Emergency Physician Note', 'Trauma Assessment Form', 'Resuscitation Sheet',
      'Rapid Sequence Intubation', 'MCI Triage Tag', 'Trauma Activation Checklist', 'FAST Exam Report'
    ]
  },
  {
    id: 'psychiatry',
    title: 'Psychiatry',
    icon: <Brain size={20} />,
    color: '#8b5cf6',
    documents: [
      'Psychiatric Evaluation', 'Mental Status Examination', 'Suicide Risk Assessment', 'Safety Plan',
      'Therapy Progress Note', 'Psychopharmacology Note', 'Substance Use Evaluation', 'ADHD Evaluation Form'
    ]
  },
  {
    id: 'surgery',
    title: 'General Surgery',
    icon: <Scissors size={20} />,
    color: '#64748b',
    documents: [
      'Preoperative Assessment', 'Preoperative H&P', 'Operative Report', 'Anesthesia Preop Assessment',
      'Anesthesia Intraoperative Record', 'PACU Note', 'Postoperative Progress Note',
      'Surgical Safety Checklist', 'Surgeon\'s Preference Card', 'Intraoperative Pathology Request',
      'Wound Assessment & Dressing Change', 'Surgical Complication Report', 'Day Surgery Note'
    ]
  }
];

export const DocumentBuilderOverlay: React.FC<DocumentBuilderOverlayProps> = ({ onClose, darkMode }) => {
  const [search, setSearch] = useState('');
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!search) return CATEGORIES;
    return CATEGORIES.map(cat => ({
      ...cat,
      documents: cat.documents.filter(doc => doc.toLowerCase().includes(search.toLowerCase()))
    })).filter(cat => cat.documents.length > 0);
  }, [search]);

  if (minimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderRadius: 24,
          background: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(82, 255, 157, 0.3)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 0 20px rgba(82,255,157,0.1)',
          color: darkMode ? '#f8fafc' : '#0f172a',
          cursor: 'default'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#52ff9d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06111d' }}>
            <Plus size={18} strokeWidth={3} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Document Library</span>
            <span style={{ fontSize: 10, color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Minimized • {search ? `Searching "${search}"` : 'Exploring'}</span>
          </div>
        </div>
        
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        
        <button
          onClick={() => setMinimized(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 16,
            border: 'none',
            background: '#52ff9d',
            color: '#06111d',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Maximize2 size={12} strokeWidth={3} /> Restore
        </button>
        
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            opacity: 0.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
        >
          <X size={16} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 30, scale: 0.98, filter: 'blur(10px)' }}
      transition={{ 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1],
        opacity: { duration: 0.3 }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: darkMode ? 'rgba(6, 17, 29, 0.94)' : 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 40px',
        color: darkMode ? '#f8fafc' : '#0f172a'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Document Builder
          </h2>
          <p style={{ fontSize: 14, color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
            Select a template to generate a new medical document
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setMinimized(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
          >
            <Minimize2 size={20} />
          </button>
          
          <button
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(90deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto 24px', width: '100%' }}>
        <Search 
          size={18} 
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: darkMode ? '#64748b' : '#94a3b8' }} 
        />
        <input
          autoFocus
          placeholder="Search templates (e.g., SOAP Note, Consent Form...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#52ff9d';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(82,255,157,0.2)';
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#fff';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)';
          }}
          style={{
            width: '100%',
            padding: '14px 16px 14px 48px',
            borderRadius: 99,
            border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
            color: 'inherit',
            fontSize: 15,
            outline: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
        />
      </div>

      {/* Grid Content */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
        style={{ flex: 1, overflowY: 'auto', paddingBottom: 60 }}
      >
        {filteredCategories.map((category, idx) => (
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            key={category.id} 
            style={{ marginBottom: 48 }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 20,
              position: 'sticky',
              top: 0,
              background: darkMode ? 'rgba(6, 17, 29, 0.94)' : 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              padding: '12px 0',
              zIndex: 10
            }}>
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8] 
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: idx * 0.2
                }}
                style={{ 
                  width: 36, height: 36, borderRadius: 10, 
                  background: `${category.color}20`, 
                  color: category.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {category.icon}
              </motion.div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{category.title}</h3>
            </div>

            <motion.div 
              variants={{
                visible: { transition: { staggerChildren: 0.02 } }
              }}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: 16 
              }}
            >
              {category.documents.map((doc, dIdx) => (
                <motion.button
                  key={doc}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { opacity: 1, scale: 1 }
                  }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setComingSoon(doc)}
                  style={{
                    background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                    border: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 16,
                    padding: 16,
                    height: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: 'inherit',
                    gap: 8,
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div style={{ opacity: 0.5 }}>
                    <FileText size={20} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doc}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Coming Soon Full-Page Immersive Overlay */}
      <AnimatePresence>
        {comingSoon && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 150 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 3000,
              background: darkMode ? '#060b13' : '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Caution Tape Top */}
            <motion.div 
              style={{
                position: 'absolute',
                top: 0,
                left: '-10%',
                width: '120%',
                height: 50,
                background: 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 30px, #000 30px, #000 60px)',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                transform: 'rotate(-1deg)'
              }}
              animate={{ x: ['-2%', '0%'] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            >
              {[...Array(6)].map((_, i) => (
                <span key={i} style={{ color: '#000', fontWeight: 900, fontSize: 14, letterSpacing: '0.1em' }}>UNDER CONSTRUCTION</span>
              ))}
            </motion.div>

            {/* Caution Tape Bottom */}
            <motion.div 
              style={{
                position: 'absolute',
                bottom: 80,
                left: '-10%',
                width: '120%',
                height: 50,
                background: 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 30px, #000 30px, #000 60px)',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                boxShadow: '0 -4px 10px rgba(0,0,0,0.3)',
                transform: 'rotate(1deg)'
              }}
              animate={{ x: ['0%', '-2%'] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            >
              {[...Array(6)].map((_, i) => (
                <span key={i} style={{ color: '#000', fontWeight: 900, fontSize: 14, letterSpacing: '0.1em' }}>CAUTION: BUILD IN PROGRESS</span>
              ))}
            </motion.div>

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, width: '90%', textAlign: 'center' }}>
              {/* Construction Animation Zone */}
              <div style={{ position: 'relative', height: 180, marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.5, 0.2]
                  }}
                  transition={{ duration: 1, repeat: Infinity, times: [0, 0.1, 1] }}
                  style={{
                    position: 'absolute',
                    width: 240,
                    height: 240,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #52ff9d 0%, transparent 70%)',
                    filter: 'blur(40px)'
                  }}
                />
                
                <motion.div
                  style={{ position: 'relative' }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity, times: [0, 0.1, 1] }}
                >
                  <Construction size={120} color={darkMode ? '#52ff9d' : '#059669'} />
                  
                  {/* The Hammer */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: -60,
                      right: -60,
                      transformOrigin: 'bottom left'
                    }}
                    animate={{ 
                      rotate: [0, -60, 0],
                      x: [0, -20, 0],
                      y: [0, 10, 0]
                    }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity, 
                      ease: "anticipate",
                      times: [0, 0.4, 0.5]
                    }}
                  >
                    <Hammer size={80} color="#fbbf24" strokeWidth={2.5} />
                  </motion.div>
                </motion.div>
              </div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: 42, fontWeight: 900, marginBottom: 20, letterSpacing: '-0.04em', color: darkMode ? '#f8fafc' : '#0f172a' }}
              >
                Building the Future of <br/> 
                <span style={{ color: '#52ff9d' }}>{comingSoon}</span>
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: 18, lineHeight: 1.6, color: darkMode ? '#94a3b8' : '#64748b', marginBottom: 48 }}
              >
                Our clinical engineers are currently forging this document template. 
                It's being designed for peak performance and medical-grade accuracy.
              </motion.p>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setComingSoon(null)}
                  style={{
                    padding: '16px 32px',
                    borderRadius: 16,
                    border: 'none',
                    background: '#52ff9d',
                    color: '#06111d',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(82,255,157,0.3)'
                  }}
                >
                  Notify Me
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setComingSoon(null)}
                  style={{
                    padding: '16px 32px',
                    borderRadius: 16,
                    border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    background: 'transparent',
                    color: 'inherit',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Return to Library
                </motion.button>
              </div>
            </div>
            
            {/* Background Texture Overlay */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
