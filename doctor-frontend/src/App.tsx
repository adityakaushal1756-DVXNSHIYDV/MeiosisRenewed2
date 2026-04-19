import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileText, LayoutDashboard, UserPlus, X } from 'lucide-react';
import { WelcomeAnimation } from './components/WelcomeAnimation';
import { LanguageContext } from './i18n/LanguageContext';
import { createT, type LangCode } from './i18n/translations';
const EMRv2 = lazy(() => import('./pages/EMRv2'));
import { NavKey } from './components/Sidebar';
import { usePatients } from './hooks/usePatients';
import { useDoctorAnalytics } from './hooks/useDoctorAnalytics';
import { useQueue } from './hooks/useQueue';
import { EmrShareRequest, useEmrShareNotifications } from './hooks/useEmrShareNotifications';
import { clearCache } from './utils/persistentCache';
import { mockPrescriptionTemplates } from './mock/mockAppointments';
import { EMRState, PrescriptionRow, PrescriptionTemplate, PdfTemplate } from './types/EMR';
import { Appointment } from './types/Appointment';
import type { PatientMedicalReport, PatientPastAppointment } from './types/Patient';
import { DailySchedule } from './components/Schedule/ScheduleDayEditor';
import { CURRENT_DOCTOR, type DoctorProfile } from './config/doctorProfile';
import { useOfflineSync } from './hooks/useOfflineSync';
import { enqueueEMR } from './utils/offlineQueue';
import { OfflineSyncBar } from './components/OfflineSyncBar';
import { apiUrl, assetUrl, getAuthHeader } from './lib/api';
import { AccessDeniedOverlay } from './components/Patient/AccessDeniedOverlay';
import { HoverRevealSidebar } from './components/HoverRevealSidebar';
import { LoadingFallback } from './components/LoadingFallback';
import { EndConsultationDialog } from './components/EMR/EndConsultationDialog';

const LazyDashboard = lazy(() => import('./pages/Dashboard'));
const LazyTemplateBuilder = lazy(() =>
  import('./pages/TemplateBuilderPage').then((module) => ({
    default: module.TemplateBuilderPage,
  }))
);

const CONSOLE_COLLAPSIBLE_KEY = 'meiosis_doctor_console_collapsible_v1';
const CONSOLE_COLLAPSED_KEY = 'meiosis_doctor_console_collapsed_v1';
const CONSOLE_WIDTH_KEY = 'meiosis_doctor_console_width_v1';
const DOCTOR_THEME_MODE_KEY = 'meiosis_doctor_theme_mode_v1';
const DOCTOR_CUSTOM_THEME_KEY = 'meiosis_doctor_custom_theme_v1';
const DOCTOR_DARKER_TIMELINE_KEY = 'meiosis_doctor_darker_timeline_v1';
const DOCTOR_TIMELINE_THEME_KEY = 'meiosis_doctor_timeline_theme_v1';
const DOCTOR_TIMELINE_ZOOM_KEY        = 'meiosis_doctor_timeline_zoom_v1';
const DOCTOR_EMR_BUILDER_V2_THEME_KEY = 'meiosis_doctor_emr_builder_v2_theme_v1';
const DOCTOR_EMR_BUILDER_LAYOUT_KEY   = 'meiosis_doctor_emr_builder_layout_v1';
const DOCTOR_TIMELINE_LAYOUT_KEY      = 'meiosis_doctor_timeline_layout_v1';
const DOCTOR_PRESCRIPTION_TEMPLATES_KEY = 'meiosis_doctor_prescription_templates_v1';
const DOCTOR_SLOT_DURATION_KEY        = 'meiosis_doctor_slot_duration_v1';
const DOCTOR_QUEUE_BLOCK_DURATION_KEY = 'meiosis_doctor_queue_block_duration_v1';
const DOCTOR_FOLLOWUP_GAP_KEY         = 'meiosis_doctor_followup_gap_v1';
const TIMELINE_ZOOM_MIN = 0.8;
const TIMELINE_ZOOM_MAX = 1.4;
const TIMELINE_ZOOM_STEP = 0.05;

type DoctorThemeMode = 'dark' | 'light' | 'super-dark' | 'green' | 'orange' | 'violet' | 'yellow' | 'custom';
type DoctorCustomTheme = { hue: number; brightness: number };
type DoctorTimelineTheme = 'default' | 'dashboard-dark' | 'beige-light';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampTimelineZoom(value: number) {
  return clamp(Number.isFinite(value) ? value : 1, TIMELINE_ZOOM_MIN, TIMELINE_ZOOM_MAX);
}

function loadStoredDoctorCustomTheme(): DoctorCustomTheme {
  try {
    const raw = localStorage.getItem(DOCTOR_CUSTOM_THEME_KEY);
    if (!raw) return { hue: 152, brightness: 100 };
    const parsed = JSON.parse(raw);
    return {
      hue: clamp(Number(parsed?.hue) || 152, 0, 360),
      brightness: clamp(Number(parsed?.brightness) || 100, 70, 135)
    };
  } catch {
    return { hue: 152, brightness: 100 };
  }
}

function cloneTemplateRows(rows: PrescriptionRow[]): PrescriptionRow[] {
  return rows.map((row, index) => ({
    id: row.id || `tpl-row-${Date.now()}-${index}`,
    medicineName: row.medicineName || '',
    dose: row.dose || '',
    frequency: row.frequency || '',
    duration: row.duration || '',
    notes: row.notes || ''
  }));
}

function cloneTemplates(templates: PrescriptionTemplate[]): PrescriptionTemplate[] {
  return templates.map((template, index) => ({
    id: template.id || `tpl-${Date.now()}-${index}`,
    name: template.name || `Template ${index + 1}`,
    diagnosis: template.diagnosis || 'General review',
    advice: template.advice || 'Routine follow-up advised.',
    rows: cloneTemplateRows(template.rows || [])
  }));
}

function loadStoredPrescriptionTemplates(): PrescriptionTemplate[] {
  try {
    const raw = localStorage.getItem(DOCTOR_PRESCRIPTION_TEMPLATES_KEY);
    if (!raw) return cloneTemplates(mockPrescriptionTemplates);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return cloneTemplates(mockPrescriptionTemplates);
    return cloneTemplates(parsed as PrescriptionTemplate[]);
  } catch {
    return cloneTemplates(mockPrescriptionTemplates);
  }
}

function createEmptyRow(seed: number): PrescriptionRow {
  return {
    id: `rx-${seed}-${Math.random().toString(16).slice(2, 8)}`,
    medicineName: '',
    dose: '',
    frequency: '',
    duration: '',
    notes: ''
  };
}

function createInitialEmr(patient?: { name: string; vitals: EMRState['vitals']; visitReason: string } | null): EMRState {
  return {
    patientInfo: patient ? `Name: ${patient.name}\nVisit Reason: ${patient.visitReason}` : '',
    vitals: patient?.vitals ? { ...patient.vitals } : {
      bloodPressure: '',
      pulse: '',
      temperature: '',
      spo2: '',
      height: '',
      weight: '',
    },
    symptoms: '',
    diagnosis: '',
    labTests: '',
    advice: '',
    followUpDate: '',
    prescriptionRows: [createEmptyRow(Date.now())],
  };
}

function isEmrDirty(emr: EMRState): boolean {
  if (!emr) return false;
  
  // Check text fields
  if (emr.symptoms?.trim()) return true;
  if (emr.diagnosis?.trim()) return true;
  if (emr.labTests?.trim()) return true;
  if (emr.advice?.trim()) return true;
  if (emr.followUpDate?.trim()) return true;
  
  // Check vitals (compared to empty)
  const v = emr.vitals;
  if (v.bloodPressure?.trim() || v.pulse?.trim() || v.temperature?.trim() || 
      v.spo2?.trim() || v.height?.trim() || v.weight?.trim()) return true;
      
  // Check prescription rows
  const meaningfulRows = emr.prescriptionRows.filter(r => 
    [r.medicineName, r.dose, r.frequency, r.duration, r.notes].some(val => val?.trim().length > 0)
  );
  if (meaningfulRows.length > 0) return true;
  
  return false;
}

const defaultSchedule: DailySchedule[] = [
  { day: 'Monday', open: true, morningStart: '09:00', morningEnd: '13:00', eveningStart: '17:00', eveningEnd: '20:00' },
  { day: 'Tuesday', open: true, morningStart: '09:30', morningEnd: '13:30', eveningStart: '17:00', eveningEnd: '20:00' },
  { day: 'Wednesday', open: true, morningStart: '09:00', morningEnd: '13:00', eveningStart: '17:30', eveningEnd: '20:30' },
  { day: 'Thursday', open: true, morningStart: '10:00', morningEnd: '14:00', eveningStart: '17:00', eveningEnd: '19:30' },
  { day: 'Friday', open: true, morningStart: '09:00', morningEnd: '13:00', eveningStart: '17:00', eveningEnd: '20:30' },
  { day: 'Saturday', open: true, morningStart: '09:00', morningEnd: '12:00', eveningStart: '16:30', eveningEnd: '18:30' },
  { day: 'Sunday', open: false, morningStart: '00:00', morningEnd: '00:00', eveningStart: '00:00', eveningEnd: '00:00' }
];

export default function App() {
  const {
    patients,
    setPatients,
    query,
    setQuery,
    filteredPatients,
    selectedPatient,
    selectedPatientId,
    setSelectedPatientId,
    expandedHistoryId,
    setExpandedHistoryId,
    updatePatient,
    isSyncing: isSyncingPatients
  } = usePatients();

  const {
    queue,
    backendPatients,
    activeAppointment,
    activeAppointmentId,
    setActiveAppointmentId,
    startAppointment,
    endAppointment,
    pauseAppointment,
    resumeAppointment,
    skipPatient,
    markNoShow,
    addWalkInPatient,
    isSyncing: isSyncingQueue,
    refreshQueue
  } = useQueue();
  const { completedAppointments, refreshCompletedAppointments, isSyncing: isSyncingAnalytics } = useDoctorAnalytics();

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>(CURRENT_DOCTOR);

  const fetchFullDoctorProfile = useCallback(async () => {
    try {
      const res = await fetch(
        apiUrl(`/doctors/${encodeURIComponent(CURRENT_DOCTOR.id)}`),
        { headers: getAuthHeader() }
      );
      if (!res.ok) return;
      const data = await res.json();
      setDoctorProfile({
        id: data.id,
        name: data.name.startsWith('Dr. ') ? data.name : `Dr. ${data.name}`,
        shortName: data.name.replace(/^Dr\.\s*/i, ''),
        specialty: data.specialty || 'General Medicine',
        meiosisId: data.meiosisId || '',
        hospital: data.hospital || ''
      });
    } catch (err) {
      console.error("[Meiosis] Failed to fetch full doctor profile:", err);
    }
  }, []);

  useEffect(() => {
    fetchFullDoctorProfile();
  }, [fetchFullDoctorProfile]);

  const { pending: emrShareRequests, respond: respondToEmrShare, refresh: refreshEmrShareRequests } = useEmrShareNotifications();

  useEffect(() => {
    if (!sessionStorage.getItem('play_login_success_chime')) return;
    sessionStorage.removeItem('play_login_success_chime');
    const audio = new Audio('/startup-chime.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }, []);

  // Eager Pre-fetching: Start downloading lazy chunks while the welcome animation is playing.
  // This eliminates the 'Loading...' flicker after the splash screen finishes.
  useEffect(() => {
    const prefetch = () => {
      import('./pages/Dashboard').catch(() => {});
      import('./pages/TemplateBuilderPage').catch(() => {});
      import('./pages/EMRv2').catch(() => {});
    };
    // Delay slightly to give main thread priority to the animation
    const t = setTimeout(prefetch, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (backendPatients.length > 0) {
      setPatients((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        backendPatients.forEach((bp) => {
          if (!map.has(bp.id)) map.set(bp.id, bp);
        });
        return Array.from(map.values());
      });
    }
  }, [backendPatients, setPatients]);

  const fetchDoctorPatients = useCallback(async () => {
    try {
      // SECURITY: Only fetch patients who have explicitly added this doctor to their network.
      // The /network/patients/:doctorId endpoint enforces the PatientDoctor join table.
      // Never use /doctors/:doctorId/patients — that endpoint returns all patients from
      // appointments/prescriptions and bypasses network gating entirely.
      const res = await fetch(
        apiUrl(`/network/patients/${encodeURIComponent(CURRENT_DOCTOR.id)}`),
        { headers: getAuthHeader() }
      );
      if (!res.ok) return;
      const networkData: any[] = await res.json();
      if (!networkData.length) return;

      setPatients((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        networkData.forEach((p) => {
          if (p?.id && !map.has(p.id)) {
            map.set(p.id, {
              id: p.id,
              meiosisCode: p.universalCode || p.meiosisId || p.id,
              name: p.name || 'Unknown',
              phone: p.phone || '',
              email: p.email || '',
              age: 0,
              gender: 'Other' as const,
              visitReason: 'Patient',
              lastVisitDate: '',
              allergies: [],
              chronicConditions: [],
              vitals: { bloodPressure: '', pulse: '', temperature: '', spo2: '', height: '', weight: '' },
              history: [],
              pastAppointments: [],
              prescriptions: [],
              medicalReports: []
            });
          }
        });
        return Array.from(map.values());
      });
    } catch (err) {
      console.error("[Meiosis] Failed to fetch doctor patients:", err);
    }
  }, [setPatients]);

  useEffect(() => {
    fetchDoctorPatients();
  }, [fetchDoctorPatients]);

  const loadPatientEMR = useCallback(async (patientId: string) => {
    try {
      const res = await fetch(
        apiUrl(`/emr?patientId=${encodeURIComponent(patientId)}`),
        { headers: getAuthHeader() }
      );
      if (res.status === 403) {
        // Doctor not in network — show access denied
        setAccessLevel(null);
        return;
      }
      if (!res.ok) return;
      const data: any = await res.json();
      if (!data?.prescriptions) return;

      // Server returns the effective accessLevel — use it
      if (data.accessLevel) {
        const lvl = data.accessLevel as 'full' | 'lab' | 'summary';
        setAccessLevel(lvl);
      }

      const extract = (note: string, prefix: string): string | undefined => {
        const line = (note || '').split('\n').find((l: string) => l.startsWith(prefix));
        return line ? line.slice(prefix.length).trim() || undefined : undefined;
      };

      const prescriptions = Array.isArray(data.prescriptions) ? data.prescriptions : [];
      const appointments  = Array.isArray(data.appointments)  ? data.appointments  : [];
      const labReports    = Array.isArray(data.labReports)    ? data.labReports    : [];

      // Create a set of dates that already have prescriptions to avoid double-counting consultations
      const rxDates = new Set(prescriptions.map((rx: any) => new Date(rx.startDate).toISOString().slice(0, 10)));

      // Map prescriptions to our rich encounter model
      const pastAppointments: PatientPastAppointment[] = prescriptions.map((rx: any) => ({
        id: rx.id,
        date: new Date(rx.startDate).toISOString().slice(0, 10),
        doctorName: rx.doctor?.name || 'Unknown',
        specialty: rx.doctor?.specialty || 'General Practice',
        mode: 'In-person' as const,
        status: (rx.status === 'ACTIVE' || rx.status === 'COMPLETED') ? 'Completed' as const : 'Cancelled' as const,
        purpose: rx.title || 'Consultation',
        symptoms:  extract(rx.doctorNote || '', 'Subjective: '),
        diagnosis: extract(rx.doctorNote || '', 'Assessment: '),
        medications: (rx.items || []).map((item: any) => ({
          medicineId: item.medicineId,
          name: item.medicine,
          identifier_brand: item.identifier_brand,
          generic_name: item.generic_name,
          substance_identifier: item.substance_identifier,
          route_of_administration: item.route_of_administration,
          dose_form: item.dose_form,
          therapeutic_role: item.therapeutic_role,
          iupac_name: item.iupac_name,
          molecular_formula: item.molecular_formula,
          dose: item.dose,
          frequency: item.frequency,
          duration: item.timing,
          notes: item.reason || undefined,
        })),
        followUp: rx.endDate ? new Date(rx.endDate).toISOString().slice(0, 10) : undefined,
        notes: extract(rx.doctorNote || '', 'Plan: '),
        documentPath: rx.documentPath || undefined,
      }));

      // Add appointments that don't have a corresponding prescription
      appointments.forEach((apt: any) => {
        const dateStr = new Date(apt.scheduledDate).toISOString().slice(0, 10);
        if (!rxDates.has(dateStr)) {
          pastAppointments.push({
            id: apt.id,
            date: dateStr,
            doctorName: apt.doctor?.name || 'Unknown',
            specialty: apt.doctor?.specialty || 'General Practice',
            mode: apt.mode === 'TELECONSULT' ? 'Teleconsult' : 'In-person',
            status: apt.status === 'COMPLETED' ? 'Completed' : 'Cancelled',
            purpose: apt.purpose || apt.title || 'Scheduled Visit',
            notes: apt.notes || undefined,
          });
        }
      });

      // Sort by date descending
      pastAppointments.sort((a, b) => b.date.localeCompare(a.date));

      const medicalReports: PatientMedicalReport[] = labReports.map((lr: any) => ({
        id: lr.id,
        title: lr.testName,
        category: 'Lab' as const,
        reportDate: new Date(lr.reportDate).toISOString().slice(0, 10),
        doctorName: lr.doctor?.name || 'Unknown',
        summary: lr.educationalAi || lr.testName,
        fileLabel: lr.documentPath ? 'View Result' : 'Pending results',
        documentPath: lr.documentPath || undefined,
      }));

      updatePatient(patientId, (p) => ({
        ...p,
        pastAppointments,
        medicalReports,
      }));
    } catch (err) {
      console.error(`[Meiosis] Failed to load EMR for patient ${patientId}:`, err);
    }
  }, [updatePatient]);

  useEffect(() => {
    if (selectedPatientId) loadPatientEMR(selectedPatientId);
  }, [selectedPatientId, loadPatientEMR]);

  const handleRespondToEmrShare = useCallback(async (request: EmrShareRequest, accepted: boolean) => {
    const result = await respondToEmrShare(request.id, accepted);
    if (!result) {
      setEmrToast({ ok: false, msg: `Could not ${accepted ? 'accept' : 'reject'} EMR share right now.` });
      window.setTimeout(() => setEmrToast(null), 4000);
      return;
    }

    if (accepted) {
      await fetchDoctorPatients();
      await loadPatientEMR(request.patientId);
      setSelectedPatientId((current) => current ?? request.patientId);
      setEmrToast({
        ok: true,
        msg: `${request.patient.name}'s shared EMR was accepted and added to your records.`
      });
    } else {
      setEmrToast({
        ok: true,
        msg: `EMR share from ${request.patient.name} was rejected.`
      });
    }

    window.setTimeout(() => setEmrToast(null), 4000);
    refreshEmrShareRequests();
  }, [fetchDoctorPatients, loadPatientEMR, refreshEmrShareRequests, respondToEmrShare]);

  const [lang, setLangState] = useState<LangCode>(() => {
    try { return (localStorage.getItem('meiosis_doctor_lang_v1') as LangCode) ?? 'en'; } catch { return 'en'; }
  });
  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    try { localStorage.setItem('meiosis_doctor_lang_v1', l); } catch {}
  }, []);

  const [showWelcome, setShowWelcome] = useState(true);

  const [nav, setNav] = useState<NavKey>('dashboard');
  const [viewRecordsPatientId, setViewRecordsPatientId] = useState<string | null>(null);
  const [isClosingRecords, setIsClosingRecords] = useState(false);
  const [accessDeniedPatientId, setAccessDeniedPatientId] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<'full' | 'lab' | 'summary' | null>(null);

  const closeViewRecords = useCallback(() => {
    setIsClosingRecords(true);
    setTimeout(() => {
      setViewRecordsPatientId(null);
      setAccessDeniedPatientId(null);
      setAccessLevel(null);
      setIsClosingRecords(false);
    }, 360);
  }, []);

  const handleBackToPatientSearch = useCallback(() => {
    setNav('search');
    closeViewRecords();
  }, [closeViewRecords]);

  const openViewRecords = useCallback((id: string) => setViewRecordsPatientId(id), []);

  const handleBuildEMRFromRecords = useCallback(() => {
    const pId = viewRecordsPatientId || accessDeniedPatientId;
    if (!pId) return;
    const patient = patients.find((p) => p.id === pId) ?? null;
    setSelectedPatientId(pId);
    setEmr(createInitialEmr(patient ? { name: patient.name, vitals: patient.vitals, visitReason: patient.visitReason } : null));
    setEmrOpenedFromRecords(true);
    setEmrComposerOpen(true);
    closeViewRecords();
  }, [viewRecordsPatientId, accessDeniedPatientId, patients, setSelectedPatientId, closeViewRecords]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<DoctorThemeMode>(() => {
    try {
      const stored = localStorage.getItem(DOCTOR_THEME_MODE_KEY);
      return ['dark', 'light', 'super-dark', 'green', 'orange', 'violet', 'yellow', 'custom'].includes(stored ?? '')
        ? (stored as DoctorThemeMode)
        : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [customTheme, setCustomTheme] = useState<DoctorCustomTheme>(() => loadStoredDoctorCustomTheme());
  const [timelineTheme, setTimelineTheme] = useState<DoctorTimelineTheme>(() => {
    try {
      const stored = localStorage.getItem(DOCTOR_TIMELINE_THEME_KEY);
      if (stored === 'default' || stored === 'dashboard-dark' || stored === 'beige-light') {
        return stored;
      }
      return localStorage.getItem(DOCTOR_DARKER_TIMELINE_KEY) === 'true' ? 'dashboard-dark' : 'default';
    } catch {
      return 'default';
    }
  });
  const [timelineZoom, setTimelineZoomState] = useState<number>(() => {
    try {
      return clampTimelineZoom(Number(localStorage.getItem(DOCTOR_TIMELINE_ZOOM_KEY)) || 1);
    } catch {
      return 1;
    }
  });
  const setTimelineZoom = (value: number) => {
    const next = clampTimelineZoom(value);
    setTimelineZoomState(next);
    try { localStorage.setItem(DOCTOR_TIMELINE_ZOOM_KEY, String(next)); } catch {}
  };
  const [emrBuilderLayout, setEmrBuilderLayoutState] = useState<'simple' | 'modern'>(() => {
    try {
      const stored = localStorage.getItem(DOCTOR_EMR_BUILDER_LAYOUT_KEY);
      return stored === 'modern' ? 'modern' : 'simple';
    } catch {
      return 'simple';
    }
  });

  function setEmrBuilderLayout(layout: 'simple' | 'modern') {
    setEmrBuilderLayoutState(layout);
    try { localStorage.setItem(DOCTOR_EMR_BUILDER_LAYOUT_KEY, layout); } catch {}
  }

  const [timelineLayout, setTimelineLayoutState] = useState<'simple' | 'advanced'>(() => {
    try {
      const stored = localStorage.getItem(DOCTOR_TIMELINE_LAYOUT_KEY);
      return stored === 'advanced' ? 'advanced' : 'simple';
    } catch {
      return 'simple';
    }
  });

  function setTimelineLayout(layout: 'simple' | 'advanced') {
    setTimelineLayoutState(layout);
    try { localStorage.setItem(DOCTOR_TIMELINE_LAYOUT_KEY, layout); } catch {}
  }

  const [emrBuilderV2Theme, setEmrBuilderV2Theme] = useState<DoctorTimelineTheme>(() => {
    try {
      const stored = localStorage.getItem(DOCTOR_EMR_BUILDER_V2_THEME_KEY);
      if (stored === 'default' || stored === 'dashboard-dark' || stored === 'beige-light') {
        return stored;
      }
      return 'default';
    } catch {
      return 'default';
    }
  });
  const [consoleCollapsible, setConsoleCollapsible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CONSOLE_COLLAPSIBLE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [consoleCollapsed, setConsoleCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CONSOLE_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [consoleWidth, setConsoleWidth] = useState<number>(() => {
    try {
      return clamp(Number(localStorage.getItem(CONSOLE_WIDTH_KEY)) || 300, 260, 380);
    } catch {
      return 300;
    }
  });
  const [currentTime, setCurrentTime] = useState('');
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>(() => loadStoredPrescriptionTemplates());
  const [pdfTemplates, setPdfTemplates] = useState<PdfTemplate[]>(() => {
    try {
      const stored = localStorage.getItem('meiosis_doctor_pdf_templates_v1');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [manualConsultationStatus, setManualConsultationStatus] = useState<'READY' | 'IN_SESSION' | 'PAUSED'>('READY');
  const [scheduleDays, setScheduleDays] = useState<DailySchedule[]>(defaultSchedule);
  const [slotDuration, setSlotDurationState] = useState<number>(() => {
    try { return Number(localStorage.getItem(DOCTOR_SLOT_DURATION_KEY)) || 15; } catch { return 15; }
  });
  const setSlotDuration = (minutes: number) => {
    setSlotDurationState(minutes);
    try { localStorage.setItem(DOCTOR_SLOT_DURATION_KEY, String(minutes)); } catch { /* ignore */ }
  };

  const slotDurationSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedSlotSync = useRef(false);

  const prefsSyncTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPrefsRef  = useRef<Record<string, unknown>>({});
  const isPrefsLoaded    = useRef(false);

  function syncPrefs(patch: Record<string, unknown>) {
    if (!isPrefsLoaded.current) return;
    Object.assign(pendingPrefsRef.current, patch);
    if (prefsSyncTimer.current) clearTimeout(prefsSyncTimer.current);
    prefsSyncTimer.current = setTimeout(() => {
      const payload = { ...pendingPrefsRef.current };
      pendingPrefsRef.current = {};
      fetch(apiUrl(`/doctors/${CURRENT_DOCTOR.id}/preferences`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error("[Meiosis] Failed to sync preferences to backend:", err);
      });
    }, 800);
  }
  useEffect(() => {
    const syncSlotDuration = () =>
      fetch(apiUrl(`/doctors/${CURRENT_DOCTOR.id}/slot-duration`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ slotDuration }),
      }).catch((err) => {
        console.error("[Meiosis] Failed to sync slot duration:", err);
      });

    if (!isMountedSlotSync.current) {
      isMountedSlotSync.current = true;
      syncSlotDuration();
      return;
    }

    if (slotDurationSyncTimer.current) clearTimeout(slotDurationSyncTimer.current);
    slotDurationSyncTimer.current = setTimeout(syncSlotDuration, 1000);
    return () => {
      if (slotDurationSyncTimer.current) clearTimeout(slotDurationSyncTimer.current);
    };
  }, [slotDuration]);

  const [queueBlockDuration, setQueueBlockDurationState] = useState<number>(() => {
    try { return Number(localStorage.getItem(DOCTOR_QUEUE_BLOCK_DURATION_KEY)) || 120; } catch { return 120; }
  });
  const setQueueBlockDuration = (minutes: number) => {
    setQueueBlockDurationState(minutes);
    try { localStorage.setItem(DOCTOR_QUEUE_BLOCK_DURATION_KEY, String(minutes)); } catch { /* ignore */ }
  };

  const [followUpGapDays, setFollowUpGapDaysState] = useState<number>(() => {
    try { return Number(localStorage.getItem(DOCTOR_FOLLOWUP_GAP_KEY)) || 7; } catch { return 7; }
  });
  const setFollowUpGapDays = (days: number) => {
    setFollowUpGapDaysState(days);
    try { localStorage.setItem(DOCTOR_FOLLOWUP_GAP_KEY, String(days)); } catch { /* ignore */ }
  };
  const [vacationNote, setVacationNote] = useState('Apr 12–15: conference leave planned. OPD closed for physical consults.');
  const [lateStartDate, setLateStartDate] = useState('2026-03-21');
  const [lateStartTime, setLateStartTime] = useState('11:30');
  const [emrComposerOpen, setEmrComposerOpen] = useState(false);
  const [emrOpenedFromRecords, setEmrOpenedFromRecords] = useState(false);
  const [emr, setEmr] = useState<EMRState>(() => createInitialEmr(null));
  const [emrSaving, setEmrSaving] = useState(false);
  const [emrToast, setEmrToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showEndConsultDialog, setShowEndConsultDialog] = useState(false);
  const [pendingSaveSeverity, setPendingSaveSeverity] = useState<any>('MILD');
  const [lastSavedPrescriptionPath, setLastSavedPrescriptionPath] = useState<string | null>(null);
  // Keep a snapshot of the patient being treated so dialogs work even after EMR state resets
  const [finalizedPatientName, setFinalizedPatientName] = useState<string | null>(null);

  const { isOnline, syncStatus, pendingCount, refreshPendingCount } = useOfflineSync({
    onToast: (ok, msg) => showToast(ok, msg),
    onSynced: (item) => {
      const patientId = item.payload?.patientId as string | undefined;
      if (patientId) loadPatientEMR(patientId);
    },
  });
  const darkMode = themeMode !== 'light' && !(themeMode === 'custom' && customTheme.brightness >= 112);

  useEffect(() => {
    const formatNow = () => {
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { weekday: 'short' });
      const date = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `${day} | ${date} | ${time}`;
    };

    setCurrentTime(formatNow());
    const timer = window.setInterval(() => setCurrentTime(formatNow()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
    document.body.classList.toggle('theme-light', !darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.body.setAttribute('data-doctor-theme', themeMode);
    try {
      localStorage.setItem(DOCTOR_THEME_MODE_KEY, themeMode);
    } catch {}

    if (themeMode !== 'custom') {
      [
        '--doctor-accent',
        '--doctor-accent-rgb',
        '--doctor-accent-soft',
        '--doctor-accent-secondary',
        '--doctor-bg-start',
        '--doctor-bg-end',
        '--doctor-bg-glow-a',
        '--doctor-bg-glow-b',
        '--doctor-card-tint',
        '--doctor-border',
        '--doctor-text',
        '--doctor-muted'
      ].forEach((property) => document.body.style.removeProperty(property));
      return;
    }

    const hue = clamp(customTheme.hue, 0, 360);
    const brightness = clamp(customTheme.brightness, 70, 135);
    const tone = (brightness - 70) / 65;
    const accentLightness = clamp(58 + tone * 8, 48, 74);
    const bgStart = clamp(4 + tone * 90, 4, 94);
    const bgEnd = clamp(8 + tone * 84, 8, 94);
    const cardTint = clamp(10 + tone * 78, 10, 90);
    const borderAlpha = clamp(0.12 + tone * 0.08, 0.12, 0.2);
    const textLightness = clamp(98 - tone * 84, 14, 98);
    const mutedLightness = clamp(72 - tone * 28, 34, 72);
    const secondaryHue = (hue + 34) % 360;

    document.body.style.setProperty('--doctor-accent', `hsl(${hue} 92% ${accentLightness}%)`);
    document.body.style.setProperty('--doctor-accent-rgb', `${Math.round(255 * (1 - Math.abs(((hue / 60) % 2) - 1)))}, 220, 170`);
    document.body.style.setProperty('--doctor-accent-soft', `hsl(${hue} 92% ${accentLightness}% / ${clamp(0.12 + tone * 0.08, 0.12, 0.2)})`);
    document.body.style.setProperty('--doctor-accent-secondary', `hsl(${secondaryHue} 82% ${clamp(accentLightness - 8 + tone * 6, 42, 76)}%)`);
    document.body.style.setProperty('--doctor-bg-start', `hsl(${hue} 34% ${bgStart}%)`);
    document.body.style.setProperty('--doctor-bg-end', `hsl(${hue} 28% ${bgEnd}%)`);
    document.body.style.setProperty('--doctor-bg-glow-a', `hsl(${hue} 92% ${accentLightness}% / ${clamp(0.08 + tone * 0.08, 0.08, 0.16)})`);
    document.body.style.setProperty('--doctor-bg-glow-b', `hsl(${secondaryHue} 82% ${clamp(accentLightness - 10 + tone * 4, 40, 72)}% / ${clamp(0.07 + tone * 0.06, 0.07, 0.13)})`);
    document.body.style.setProperty('--doctor-card-tint', `hsl(${hue} 22% ${cardTint}% / ${clamp(0.68 - tone * 0.16, 0.52, 0.68)})`);
    document.body.style.setProperty('--doctor-border', `hsl(${hue} 48% ${clamp(72 + tone * 10, 64, 84)}% / ${borderAlpha})`);
    document.body.style.setProperty('--doctor-text', `hsl(${(hue + 14) % 360} 18% ${textLightness}%)`);
    document.body.style.setProperty('--doctor-muted', `hsl(${(hue + 14) % 360} 12% ${mutedLightness}%)`);
  }, [themeMode, customTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(DOCTOR_PRESCRIPTION_TEMPLATES_KEY, JSON.stringify(templates));
    } catch {}
    syncPrefs({ prescriptionTemplates: templates });
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(DOCTOR_CUSTOM_THEME_KEY, JSON.stringify(customTheme));
    } catch {}
  }, [customTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(DOCTOR_TIMELINE_THEME_KEY, timelineTheme);
      localStorage.setItem(DOCTOR_DARKER_TIMELINE_KEY, String(timelineTheme === 'dashboard-dark'));
    } catch {}
  }, [timelineTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(DOCTOR_TIMELINE_ZOOM_KEY, String(timelineZoom));
    } catch {}
  }, [timelineZoom]);

  useEffect(() => {
    try {
      localStorage.setItem(DOCTOR_EMR_BUILDER_V2_THEME_KEY, emrBuilderV2Theme);
    } catch {}
  }, [emrBuilderV2Theme]);

  useEffect(() => {
    try {
      localStorage.setItem(CONSOLE_COLLAPSIBLE_KEY, String(consoleCollapsible));
    } catch {}
    if (!consoleCollapsible) {
      setConsoleCollapsed(false);
    }
  }, [consoleCollapsible]);

  useEffect(() => {
    try {
      localStorage.setItem(CONSOLE_COLLAPSED_KEY, String(consoleCollapsed && consoleCollapsible));
    } catch {}
  }, [consoleCollapsed, consoleCollapsible]);

  useEffect(() => {
    try {
      localStorage.setItem(CONSOLE_WIDTH_KEY, String(consoleWidth));
    } catch {}
  }, [consoleWidth]);

  useEffect(() => {
    fetch(apiUrl(`/doctors/${CURRENT_DOCTOR.id}/preferences`), {
      headers: getAuthHeader()
    })
      .then(r => r.ok ? r.json() : null)
      .then((prefs: Record<string, unknown> | null) => {
        if (prefs) {
          const validThemes: DoctorThemeMode[] = ['dark', 'light', 'super-dark', 'green', 'orange', 'violet', 'yellow', 'custom'];
          if (typeof prefs.themeMode === 'string' && validThemes.includes(prefs.themeMode as DoctorThemeMode)) {
            setThemeMode(prefs.themeMode as DoctorThemeMode);
            try { localStorage.setItem(DOCTOR_THEME_MODE_KEY, prefs.themeMode); } catch {}
          }
          if (typeof prefs.customThemeHue === 'number' || typeof prefs.customThemeBrightness === 'number') {
            const ct: DoctorCustomTheme = {
              hue:        clamp(typeof prefs.customThemeHue        === 'number' ? prefs.customThemeHue        : 152, 0,  360),
              brightness: clamp(typeof prefs.customThemeBrightness === 'number' ? prefs.customThemeBrightness : 100, 70, 135),
            };
            setCustomTheme(ct);
            try { localStorage.setItem(DOCTOR_CUSTOM_THEME_KEY, JSON.stringify(ct)); } catch {}
          }
          const validTlThemes = ['default', 'dashboard-dark', 'beige-light'] as const;
          if (typeof prefs.timelineTheme === 'string' && (validTlThemes as readonly string[]).includes(prefs.timelineTheme)) {
            setTimelineTheme(prefs.timelineTheme as DoctorTimelineTheme);
            try { localStorage.setItem(DOCTOR_TIMELINE_THEME_KEY, prefs.timelineTheme); } catch {}
          }
          if (typeof prefs.emrBuilderV2Theme === 'string' && (validTlThemes as readonly string[]).includes(prefs.emrBuilderV2Theme)) {
            setEmrBuilderV2Theme(prefs.emrBuilderV2Theme as DoctorTimelineTheme);
            try { localStorage.setItem(DOCTOR_EMR_BUILDER_V2_THEME_KEY, prefs.emrBuilderV2Theme); } catch {}
          }
          if (prefs.emrBuilderLayout === 'simple' || prefs.emrBuilderLayout === 'modern') {
            setEmrBuilderLayoutState(prefs.emrBuilderLayout);
            try { localStorage.setItem(DOCTOR_EMR_BUILDER_LAYOUT_KEY, prefs.emrBuilderLayout); } catch {}
          }
          if (prefs.timelineLayout === 'simple' || prefs.timelineLayout === 'advanced') {
            setTimelineLayoutState(prefs.timelineLayout);
            try { localStorage.setItem(DOCTOR_TIMELINE_LAYOUT_KEY, prefs.timelineLayout); } catch {}
          }
          if (typeof prefs.consoleCollapsible === 'boolean') {
            setConsoleCollapsible(prefs.consoleCollapsible);
            try { localStorage.setItem(CONSOLE_COLLAPSIBLE_KEY, String(prefs.consoleCollapsible)); } catch {}
          }
          if (typeof prefs.consoleCollapsed === 'boolean') {
            setConsoleCollapsed(prefs.consoleCollapsed);
            try { localStorage.setItem(CONSOLE_COLLAPSED_KEY, String(prefs.consoleCollapsed)); } catch {}
          }
          if (typeof prefs.consoleWidth === 'number') {
            const w = clamp(prefs.consoleWidth, 260, 380);
            setConsoleWidth(w);
            try { localStorage.setItem(CONSOLE_WIDTH_KEY, String(w)); } catch {}
          }
          if (typeof prefs.slotDuration === 'number' && prefs.slotDuration >= 4) {
            setSlotDurationState(prefs.slotDuration);
            try { localStorage.setItem(DOCTOR_SLOT_DURATION_KEY, String(prefs.slotDuration)); } catch {}
          }
          if (typeof prefs.queueBlockDuration === 'number' && prefs.queueBlockDuration > 0) {
            setQueueBlockDurationState(prefs.queueBlockDuration);
            try { localStorage.setItem(DOCTOR_QUEUE_BLOCK_DURATION_KEY, String(prefs.queueBlockDuration)); } catch {}
          }
          if (typeof prefs.followUpGapDays === 'number' && prefs.followUpGapDays > 0) {
            setFollowUpGapDaysState(prefs.followUpGapDays);
            try { localStorage.setItem(DOCTOR_FOLLOWUP_GAP_KEY, String(prefs.followUpGapDays)); } catch {}
          }
          if (typeof prefs.lang === 'string') {
            setLangState(prefs.lang as LangCode);
            try { localStorage.setItem('meiosis_doctor_lang_v1', prefs.lang); } catch {}
          }
          if (Array.isArray(prefs.prescriptionTemplates) && (prefs.prescriptionTemplates as unknown[]).length > 0) {
            const tpls = cloneTemplates(prefs.prescriptionTemplates as PrescriptionTemplate[]);
            setTemplates(tpls);
            try { localStorage.setItem(DOCTOR_PRESCRIPTION_TEMPLATES_KEY, JSON.stringify(tpls)); } catch {}
          }
          if (Array.isArray(prefs.pdfTemplates)) {
            setPdfTemplates(prefs.pdfTemplates as PdfTemplate[]);
            try { localStorage.setItem('meiosis_doctor_pdf_templates_v1', JSON.stringify(prefs.pdfTemplates)); } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        isPrefsLoaded.current = true;
      });
  }, []);

  useEffect(() => {
    syncPrefs({
      themeMode,
      customThemeHue: customTheme.hue,
      customThemeBrightness: customTheme.brightness,
      timelineTheme,
      emrBuilderV2Theme,
      emrBuilderLayout,
      timelineLayout,
      consoleCollapsible,
      consoleCollapsed,
      consoleWidth,
      slotDuration,
      queueBlockDuration,
      followUpGapDays,
      lang,
      pdfTemplates,
    });
  }, [themeMode, customTheme, timelineTheme, emrBuilderV2Theme, emrBuilderLayout, timelineLayout, consoleCollapsible, consoleCollapsed, consoleWidth, slotDuration, queueBlockDuration, followUpGapDays, lang, pdfTemplates]);

  const selectedQueuePatient = useMemo(() => {
    if (!activeAppointment) return null;
    return patients.find((patient) => patient.id === activeAppointment.patientId) ?? null;
  }, [activeAppointment, patients]);

  const effectivePatient = selectedQueuePatient ?? selectedPatient;
  const handleWelcomeDone = useCallback(() => {
    console.log("[Meiosis] Welcome animation complete. Activating dashboard.");
    setShowWelcome(false);
  }, []);

  const scannedPatient = useMemo(() => patients.find((p) => p.meiosisCode === 'scanned') ?? null, [patients]);

  const consultationAppointment: Appointment | null = useMemo(() => {
    if (activeAppointment) return activeAppointment;
    if (!effectivePatient) return null;
    return {
      id: `manual-${effectivePatient.id}`,
      patientId: effectivePatient.id,
      queueNumber: 0,
      appointmentTime: 'Direct open',
      arrivalStatus: 'CHECKED_IN',
      status: manualConsultationStatus,
      visitReason: effectivePatient.visitReason,
      mode: 'In-person'
    };
  }, [activeAppointment, effectivePatient, manualConsultationStatus]);

  useEffect(() => {
    if (!effectivePatient) {
      setEmr(createInitialEmr(null));
      return;
    }

    setEmr((current) => ({
      ...current,
      patientInfo: current.patientInfo || `${effectivePatient.name} reviewed for ${effectivePatient.visitReason}. Existing history available in side panel.`,
      vitals: current.vitals.bloodPressure ? current.vitals : effectivePatient.vitals
    }));
  }, [effectivePatient]);

  const fetchAndSetAccessLevel = async (patientId: string) => {
    try {
      // Check share-settings directly — fast path for UI hint
      const res = await fetch(apiUrl(`/patient/${encodeURIComponent(patientId)}/share-settings`), {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const settings: { fullAccess: boolean; labOnly: boolean; summaryOnly: boolean } = await res.json();
        if (settings.fullAccess)       setAccessLevel('full');
        else if (settings.labOnly)     setAccessLevel('lab');
        else if (settings.summaryOnly) setAccessLevel('summary');
        else                           setAccessLevel('full'); // default: full access
        return;
      }
    } catch (err) {
      console.error('Failed to fetch share settings:', err);
    }
    setAccessLevel('full');
  };

  const handleSelectPatient = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setNav('search');
    setActiveAppointmentId(null);
    setManualConsultationStatus('READY');
    setEmrComposerOpen(false);
    const patient = patients.find((item) => item.id === patientId) ?? null;
    setEmr(createInitialEmr(patient ? { name: patient.name, vitals: patient.vitals, visitReason: patient.visitReason } : null));
    await fetchAndSetAccessLevel(patientId);
  };

  const handleSelectQueue = async (appointmentId: string) => {
    setActiveAppointmentId(appointmentId);
    const appointment = queue.find((item) => item.id === appointmentId) ?? null;
    if (!appointment) return;
    setSelectedPatientId(appointment.patientId);
    const patient = patients.find((item) => item.id === appointment.patientId) ?? null;
    setManualConsultationStatus('READY');
    setEmrComposerOpen(false);
    setEmr(createInitialEmr(patient ? { name: patient.name, vitals: patient.vitals, visitReason: appointment.visitReason } : null));
    await fetchAndSetAccessLevel(appointment.patientId);
  };

  const handleStartQueueAppointment = (appointmentId: string) => {
    startAppointment(appointmentId);
    handleSelectQueue(appointmentId);
    setNav('queue');
    setEmrComposerOpen(false);
  };

  const handleEndQueueAppointment = (appointmentId: string) => {
    const nextAppointment = queue.find((item) => item.id !== appointmentId && (item.status === 'WAITING' || item.status === 'LATE'));
    endAppointment(appointmentId);
    if (nextAppointment) {
      const nextPatient = patients.find((item) => item.id === nextAppointment.patientId) ?? null;
      setSelectedPatientId(nextAppointment.patientId);
      setEmrComposerOpen(false);
      setEmr(createInitialEmr(nextPatient ? { name: nextPatient.name, vitals: nextPatient.vitals, visitReason: nextAppointment.visitReason } : null));
    } else {
      setEmrComposerOpen(false);
      setEmr(createInitialEmr(null));
    }
    setManualConsultationStatus('READY');
    window.setTimeout(refreshCompletedAppointments, 500);
  };

  const handleStartConsultation = () => {
    setEmrOpenedFromRecords(false);
    if (activeAppointmentId) {
      startAppointment(activeAppointmentId);
      setNav('queue');
      setEmrComposerOpen(true);
      return;
    }
    setManualConsultationStatus('IN_SESSION');
    setNav('queue');
    setEmrComposerOpen(true);
  };

  const handleEndConsultation = (forceDiscard = false) => {
    // If we're forcing a discard (e.g., from Dashboard "End Session" while closed), 
    // ask for confirmation if data exists.
    if (forceDiscard && isEmrDirty(emr)) {
      if (!window.confirm("You have unsaved EMR data for this patient. Discard and end session?")) {
        return;
      }
    }

    if (activeAppointmentId) {
      const nextAppointment = queue.find((item) => item.id !== activeAppointmentId && (item.status === 'WAITING' || item.status === 'LATE'));
      endAppointment(activeAppointmentId);
      if (nextAppointment) {
        const nextPatient = patients.find((item) => item.id === nextAppointment.patientId) ?? null;
        setSelectedPatientId(nextAppointment.patientId);
        setEmrComposerOpen(false);
        setEmr(createInitialEmr(nextPatient ? { name: nextPatient.name, vitals: nextPatient.vitals, visitReason: nextAppointment.visitReason } : null));
      } else {
        setEmrComposerOpen(false);
        setEmr(createInitialEmr(null));
      }
      window.setTimeout(refreshCompletedAppointments, 500);
      return;
    }
    setManualConsultationStatus('READY');
    setEmrComposerOpen(false);
    if (effectivePatient) {
      setEmr(createInitialEmr({ name: effectivePatient.name, vitals: effectivePatient.vitals, visitReason: effectivePatient.visitReason }));
    }
  };

  const handlePauseConsultation = () => {
    if (activeAppointmentId) {
      pauseAppointment(activeAppointmentId);
      return;
    }
    setManualConsultationStatus('PAUSED');
  };

  const handleResumeConsultation = () => {
    if (activeAppointmentId) {
      resumeAppointment(activeAppointmentId);
      return;
    }
    setManualConsultationStatus('IN_SESSION');
  };

  const handleRandomScan = () => {
    const random = patients[Math.floor(Math.random() * patients.length)];
    if (!random) return;
    handleSelectPatient(random.id);
    setNav('search');
    setEmrComposerOpen(false);
  };

  const handleNFCScan = (patientId: string) => {
    const patient = (patients || []).find((item) => item?.id === patientId || item?.meiosisCode === patientId);
    if (!patient) return;
    setSelectedPatientId(patient.id);
    setEmr(createInitialEmr({ name: patient.name, vitals: patient.vitals, visitReason: patient.visitReason }));
    setNav('search');
    setEmrComposerOpen(false);
  };

  const handleViewRecords = async (patientId: string) => {
    try {
      const res = await fetch(
        apiUrl(`/patient/${encodeURIComponent(patientId)}/share-settings`),
        { headers: getAuthHeader() }
      );
      if (res.ok) {
        const settings: { fullAccess: boolean; labOnly: boolean; summaryOnly: boolean } = await res.json();
        if (settings.fullAccess) {
          setAccessLevel('full');
          setAccessDeniedPatientId(null);
          setViewRecordsPatientId(patientId);
        } else if (settings.labOnly) {
          setAccessLevel('lab');
          setAccessDeniedPatientId(null);
          setViewRecordsPatientId(patientId);
        } else if (settings.summaryOnly) {
          setAccessLevel('summary');
          setAccessDeniedPatientId(null);
          setViewRecordsPatientId(patientId);
        } else {
          setViewRecordsPatientId(null);
          setAccessLevel(null);
          setAccessDeniedPatientId(patientId);
        }
        return;
      }
    } catch {}
    setAccessLevel('full');
    setAccessDeniedPatientId(null);
    setViewRecordsPatientId(patientId);
  };

  const handleEmrFieldChange = (field: keyof EMRState, value: string) => {
    setEmr((current) => ({ ...current, [field]: value }));
  };

  const handleVitalChange = (field: keyof EMRState['vitals'], value: string) => {
    setEmr((current) => ({ ...current, vitals: { ...current.vitals, [field]: value } }));
  };

  const handlePrescriptionChange = (id: string, field: keyof PrescriptionRow, value: string) => {
    setEmr((current) => ({
      ...current,
      prescriptionRows: current.prescriptionRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    }));
  };

  const handleAddPrescriptionRow = () => {
    setEmr((current) => ({ ...current, prescriptionRows: [...current.prescriptionRows, createEmptyRow(Date.now())] }));
  };

  const handleRemovePrescriptionRow = (id: string) => {
    setEmr((current) => {
      const filtered = current.prescriptionRows.filter((row) => row.id !== id);
      return { ...current, prescriptionRows: filtered.length ? filtered : [createEmptyRow(Date.now())] };
    });
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = (templates || []).find((item) => item?.id === templateId);
    if (!template) return;
    setEmr((current) => {
      const existingMeaningful = current.prescriptionRows.filter((r) =>
        [r.medicineName, r.dose, r.frequency, r.duration, r.notes].some((v) => v.trim().length > 0)
      );
      const newRows = template.rows.map((row) => ({ ...row, id: `${row.id}-${Date.now()}` }));
      return {
        ...current,
        diagnosis: template.diagnosis,
        advice: template.advice,
        prescriptionRows: [...existingMeaningful, ...newRows],
      };
    });
  };

  const handleSaveAsTemplate = (): boolean => {
    const meaningfulRows = emr.prescriptionRows.filter((row) =>
      [row.medicineName, row.dose, row.frequency, row.duration, row.notes].some((value) => value.trim().length > 0)
    );
    if (!meaningfulRows.length) {
      setEmrToast({ ok: false, msg: 'Add at least one medicine entry before saving a template.' });
      window.setTimeout(() => setEmrToast(null), 4000);
      return false;
    }

    const suggestedName = `${effectivePatient?.name?.split(' ')[0] || 'Prescription'} Template ${templates.length + 1}`;
    const requestedName = window.prompt('Name this prescription template', suggestedName);
    if (requestedName === null) return false;

    const name = requestedName.trim() || suggestedName;
    const newTemplate: PrescriptionTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name,
      diagnosis: emr.diagnosis || 'General review',
      advice: emr.advice || 'Routine follow-up advised.',
      rows: meaningfulRows.map((row, index) => ({ ...row, id: `tpl-row-${Date.now()}-${index}` }))
    };
    setTemplates((current) => [newTemplate, ...current]);
    setEmrToast({ ok: true, msg: `"${name}" saved to templates.` });
    window.setTimeout(() => setEmrToast(null), 4000);
    return true;
  };

  const handleDeleteTemplates = (templateIds: string[]) => {
    if (!templateIds.length) return;
    setTemplates((current) => current.filter((template) => !templateIds.includes(template.id)));
    setEmrToast({
      ok: true,
      msg: `${templateIds.length} template${templateIds.length === 1 ? '' : 's'} deleted.`
    });
    window.setTimeout(() => setEmrToast(null), 4000);
  };

  const showToast = (ok: boolean, msg: string) => {
    setEmrToast({ ok, msg });
    window.setTimeout(() => setEmrToast(null), 4000);
  };

  const handleSaveEMR = (severityArg: any = 'MILD') => {
    // This now initiates the finalization flow by showing the confirmation dialog
    const severity = (typeof severityArg === 'string') ? severityArg : 'MILD';
    setPendingSaveSeverity(severity);
    setShowEndConsultDialog(true);
  };

  const handleFinalizeConsultation = async () => {
    if (!effectivePatient || emrSaving) return;

    const severity = pendingSaveSeverity;
    const savedEmr = emr;
    const savedPatient = effectivePatient; // Snapshot BEFORE any state resets
    const savedPatientId = savedPatient.id;
    const wasOpenedFromRecords = emrOpenedFromRecords;

    const now = new Date();
    const nowDate = now.toISOString().slice(0, 10);
    const nowTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newAppt: PatientPastAppointment = {
      id: `emr-saved-${Date.now()}`,
      date: `${nowDate} ${nowTime}`,
      doctorName: CURRENT_DOCTOR.name,
      specialty: CURRENT_DOCTOR.specialty,
      mode: 'In-person',
      status: 'Completed',
      severity: severity,
      purpose: savedEmr.diagnosis || savedEmr.symptoms || savedPatient.visitReason || 'Consultation',
      symptoms:    savedEmr.symptoms    || undefined,
      diagnosis:   savedEmr.diagnosis   || undefined,
      medications: savedEmr.prescriptionRows
        .filter(r => r.medicineName.trim())
        .map(r => ({ 
          medicineId: r.medicineId,
          name: r.medicineName, 
          identifier_brand: r.identifier_brand,
          generic_name: r.generic_name,
          substance_identifier: r.substance_identifier,
          route_of_administration: r.route_of_administration,
          dose_form: r.dose_form,
          therapeutic_role: r.therapeutic_role,
          iupac_name: r.iupac_name,
          molecular_formula: r.molecular_formula,
          dose: r.dose, 
          frequency: r.frequency, 
          duration: r.duration, 
          notes: r.notes || undefined 
        })),
      followUp:    savedEmr.followUpDate || undefined,
      notes:       savedEmr.advice       || undefined,
    };

    const labEntries: PatientMedicalReport[] = savedEmr.labTests?.trim()
      ? savedEmr.labTests
          .split(/[,\n]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .map((testName, i) => ({
            id: `lab-saved-${Date.now()}-${i}`,
            title: testName,
            category: 'Lab' as const,
            reportDate: nowDate,
            doctorName: CURRENT_DOCTOR.name,
            summary: `Ordered during consultation. ${savedEmr.diagnosis ? `Diagnosis: ${savedEmr.diagnosis}.` : ''} ${savedEmr.advice ? `Advice: ${savedEmr.advice}` : ''}`.trim(),
            fileLabel: 'Pending results'
          }))
      : [];

    // Optimistic in-memory update so the local timeline is immediately updated
    updatePatient(savedPatientId, (p) => ({
      ...p,
      lastVisitDate: nowDate,
      pastAppointments: [newAppt, ...p.pastAppointments],
      medicalReports: labEntries.length > 0 ? [...labEntries, ...p.medicalReports] : p.medicalReports
    }));

    const emrPayload = {
      // Use the DB primary key — it's always unambiguous.
      // meiosisCode can be universalCode/meiosisId/id depending on patient setup and may not match.
      patientId: savedPatient.id,
      doctorId: CURRENT_DOCTOR.id,
      patientInfo: savedEmr.patientInfo,
      vitals: savedEmr.vitals,
      symptoms: savedEmr.symptoms,
      diagnosis: savedEmr.diagnosis,
      severity: severity,
      advice: savedEmr.advice,
      prescriptionRows: savedEmr.prescriptionRows,
      labTests: savedEmr.labTests,
      followUpDate: savedEmr.followUpDate,
    };

    if (!navigator.onLine) {
      try {
        await enqueueEMR({ savedAt: Date.now(), patientName: savedPatient.name, payload: emrPayload });
        await refreshPendingCount();
      } catch {}
      showToast(true, `Offline — EMR saved locally. Will sync when connection returns.`);
      // Close the EMR builder and reset session state
      setEmrComposerOpen(false);
      setEmrOpenedFromRecords(false);
      if (!wasOpenedFromRecords && activeAppointmentId) handleEndConsultation(false);
      setShowEndConsultDialog(false);
      return;
    }

    setEmrSaving(true);
    try {
      const res = await fetch(apiUrl('/emr'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(emrPayload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        // patient_not_in_db is a soft failure — optimistic update already applied
        if ((errBody.reason || errBody.error || '').includes('patient_not_in_db')) {
          showToast(true, `EMR saved for ${savedPatient.name}`);
        } else {
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }
      } else {
        const saved = await res.json();
        showToast(true, `EMR synced for ${savedPatient.name}`);
        setLastSavedPrescriptionPath(saved?.prescription?.documentPath || null);
        // Force the DB data to refresh in cache so next View Records shows the new entry
        loadPatientEMR(savedPatientId);
      }

      // Close EMR builder and cleanly end the consultation session
      setEmrComposerOpen(false);
      setEmrOpenedFromRecords(false);
      if (!wasOpenedFromRecords && activeAppointmentId) {
        // Queue-based consultation: properly end appointment
        handleEndConsultation(false);
      } else {
        // Records-based or manual consultation: just reset session
        setManualConsultationStatus('READY');
      }
      // Keep dialog open to show prescription link (if any); user can dismiss it
    } catch (err: any) {
      console.error("[Meiosis] Finalize failed:", err);
      showToast(false, `Sync failed: ${err.message}`);
      // On failure, close the dialog so user can retry via Save EMR button
      setShowEndConsultDialog(false);
    } finally {
      setEmrSaving(false);
    }
  };

  const handleAddWalkIn = () => {
    const fallbackPatient = selectedPatientId ?? patients[0]?.id;
    if (!fallbackPatient) return;
    addWalkInPatient(fallbackPatient);
    setNav('queue');
  };

  const handleToggleDayOpen = (dayLabel: string) => {
    setScheduleDays((current) => current.map((day) => (day.day === dayLabel ? { ...day, open: !day.open } : day)));
  };

  const handleScheduleChange = (dayLabel: string, field: keyof Omit<DailySchedule, 'day' | 'open'>, value: string) => {
    setScheduleDays((current) => current.map((day) => (day.day === dayLabel ? { ...day, [field]: value } : day)));
  };

  const handleSyncSchedule = async (): Promise<boolean> => {
    const DAY_INDEX: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6
    };

    const schedules = scheduleDays
      .filter((d) => d.open && d.morningStart && d.morningEnd)
      .map((d) => ({
        dayOfWeek:    DAY_INDEX[d.day] ?? 1,
        startTime:    d.morningStart,
        endTime:      d.eveningEnd   || d.morningEnd,
        slotDuration: slotDuration,
        breakStart:   d.eveningStart ? d.morningEnd   : null,
        breakEnd:     d.eveningStart ? d.eveningStart : null,
        isActive:     true,
      }));

    if (!schedules.length) return false;

    try {
      const res = await fetch(apiUrl(`/doctors/${CURRENT_DOCTOR.id}/schedules`), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ schedules }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    clearCache();
    localStorage.removeItem('meiosis_auth_session_v1');
    window.location.href = '/login.html';
  };

  const doctorName = CURRENT_DOCTOR.shortName;
  const clinicStatus = scheduleDays.some((day) => day.open) ? 'Clinic Open' : 'Clinic Closed';
  const notifications = (queue || []).filter((item) => item?.status === 'LATE' || item?.status === 'NO_SHOW').length + (emrShareRequests || []).length;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: createT(lang) }}>
      <>
        {showWelcome && (
          <WelcomeAnimation 
            onDone={handleWelcomeDone} 
            doctorName={doctorProfile.name}
            specialty={doctorProfile.specialty}
            hospital={doctorProfile.hospital}
          />
        )}
        
        <Suspense fallback={<LoadingFallback />}>
          {!showWelcome && (
            <>
              <LazyDashboard
                nav={nav}
                onNavChange={setNav}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((current) => !current)}
                consoleCollapsible={consoleCollapsible}
                consoleCollapsed={consoleCollapsible && consoleCollapsed}
                consoleWidth={consoleWidth}
                onToggleConsoleCollapsible={() => setConsoleCollapsible((current) => !current)}
                onToggleConsoleCollapsed={() => setConsoleCollapsed((current) => !current)}
                onConsoleWidthChange={setConsoleWidth}
                darkMode={darkMode}
                themeMode={themeMode}
                customTheme={customTheme}
                onThemeModeChange={setThemeMode}
                onCustomThemeChange={setCustomTheme}
                onToggleTheme={() => setThemeMode((current) => (current === 'light' ? 'dark' : 'light'))}
                timelineTheme={timelineTheme}
                onTimelineThemeChange={setTimelineTheme}
                emrBuilderV2Theme={emrBuilderV2Theme}
                onEmrBuilderV2ThemeChange={setEmrBuilderV2Theme}
                emrBuilderLayout={emrBuilderLayout}
                onEmrBuilderLayoutChange={setEmrBuilderLayout}
                timelineLayout={timelineLayout}
                onTimelineLayoutChange={setTimelineLayout}
                currentTime={currentTime}
                doctorName={doctorName}
                clinicStatus={clinicStatus}
                notifications={notifications}
                emrShareRequests={emrShareRequests}
                onRespondEmrShare={handleRespondToEmrShare}
                completedAppointments={completedAppointments}
                queue={queue}
                patients={patients}
                filteredPatients={filteredPatients}
                searchQuery={query}
                onSearchChange={setQuery}
                onSelectPatient={handleSelectPatient}
                onSelectQueue={handleSelectQueue}
                onStartQueueAppointment={handleStartQueueAppointment}
                onEndQueueAppointment={handleEndQueueAppointment}
                onSkipQueueAppointment={skipPatient}
                onMarkNoShow={markNoShow}
                onAddWalkIn={handleAddWalkIn}
                onRefreshQueue={refreshQueue}
                onStartConsultation={handleStartConsultation}
                onEndConsultation={handleEndConsultation}
                onPauseConsultation={handlePauseConsultation}
                onResumeConsultation={handleResumeConsultation}
                onRandomScan={handleRandomScan}
                onHandleScanCode={handleNFCScan}
                onToggleHistory={setExpandedHistoryId}
                expandedHistoryId={expandedHistoryId}
                selectedPatient={effectivePatient}
                selectedPatientId={effectivePatient?.id ?? null}
                activeAppointment={consultationAppointment}
                activeAppointmentId={consultationAppointment?.id ?? null}
                scannedPatient={scannedPatient}
                emr={emr}
                onEmrFieldChange={handleEmrFieldChange}
                onVitalChange={handleVitalChange}
                onPrescriptionChange={handlePrescriptionChange}
                onAddPrescriptionRow={handleAddPrescriptionRow}
                onRemovePrescriptionRow={handleRemovePrescriptionRow}
                templates={templates}
                activeTemplateId={null}
                onApplyTemplate={handleApplyTemplate}
                onSaveTemplate={handleSaveAsTemplate}
                onDeleteTemplates={handleDeleteTemplates}
                emrSaving={emrSaving}
                emrToast={emrToast}
                onSaveEMR={handleSaveEMR}
                emrComposerOpen={emrComposerOpen}
                emrOpenedFromRecords={emrOpenedFromRecords}
                onOpenEmrComposer={() => setEmrComposerOpen(true)}
                onCloseEmrComposer={() => {
                  setEmrComposerOpen(false);
                  setEmrOpenedFromRecords(false);
                }}
                viewRecordsPatientId={viewRecordsPatientId}
                onViewRecords={handleViewRecords}
                onCloseRecords={closeViewRecords}
                scheduleDays={scheduleDays}
                slotDuration={slotDuration}
                onSlotDurationChange={setSlotDuration}
                queueBlockDuration={queueBlockDuration}
                onQueueBlockDurationChange={setQueueBlockDuration}
                followUpGapDays={followUpGapDays}
                onFollowUpGapDaysChange={setFollowUpGapDays}
                pdfTemplates={pdfTemplates}
                onPdfTemplatesChange={setPdfTemplates}
                onSyncSchedule={handleSyncSchedule}
                onToggleDayOpen={handleToggleDayOpen}
                onScheduleChange={handleScheduleChange}
                onVacationNoteChange={setVacationNote}
                onLateStartDateChange={setLateStartDate}
                onLateStartTimeChange={setLateStartTime}
                vacationNote={vacationNote}
                lateStartDate={lateStartDate}
                lateStartTime={lateStartTime}
                onLogout={handleLogout}
                isOnline={isOnline}
                syncStatus={syncStatus}
                pendingCount={pendingCount}
                accessLevel={accessLevel}
              />

              {nav === 'template-builder' && (
                <div className="fixed inset-0 z-[100] bg-ink">
                  <LazyTemplateBuilder
                    onBack={() => setNav('settings')}
                    existingTemplates={pdfTemplates}
                    onSave={(updated: PdfTemplate[]) => {
                      setPdfTemplates(updated);
                      try {
                        localStorage.setItem(
                          'meiosis_doctor_pdf_templates_v1',
                          JSON.stringify(updated),
                        );
                      } catch {}
                    }}
                  />
                </div>
              )}

              {viewRecordsPatientId && (
                <div className="fixed inset-0 z-[60] bg-ink/95 backdrop-blur-xl">
                  <Suspense fallback={<LoadingFallback />}>
                    <EMRv2
                      patientId={viewRecordsPatientId}
                      darkMode={darkMode}
                      timelineTheme={timelineTheme}
                      timelineLayout={timelineLayout}
                      timelineZoom={timelineZoom}
                      accessLevel={accessLevel}
                      onBack={handleBackToPatientSearch}
                      onBuildEMR={handleBuildEMRFromRecords}
                    />
                  </Suspense>
                </div>
              )}

              {accessDeniedPatientId && (
                  <AccessDeniedOverlay
                    patientName={
                      patients?.find((p) => p.id === accessDeniedPatientId)?.name ||
                      'Patient'
                    }
                    onClose={closeViewRecords}
                    onBuildEMR={handleBuildEMRFromRecords}
                    isClosing={isClosingRecords}
                  />
                )}

                {showEndConsultDialog && (
                  <EndConsultationDialog
                    patientName={effectivePatient?.name || 'Patient'}
                    isSaving={emrSaving}
                    lastSavedPrescriptionPath={lastSavedPrescriptionPath}
                    onConfirm={handleFinalizeConsultation}
                    onCancel={() => {
                      setShowEndConsultDialog(false);
                      setLastSavedPrescriptionPath(null);
                    }}
                    onClose={() => {
                      setShowEndConsultDialog(false);
                      setLastSavedPrescriptionPath(null);
                    }}
                    onViewPrescription={(path) => window.open(assetUrl(path), '_blank')}
                  />
                )}
            </>
          )}
        </Suspense>
      </>
    </LanguageContext.Provider>
  );
}
