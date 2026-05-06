import { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { FlaskConical, Pill, Stethoscope, ChevronDown, Sparkles, Activity, ShieldAlert, TrendingUp, History, Moon, Sun, ArrowLeft, PlusCircle, Plus, X, Brain, HeartPulse, Microscope, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, getAuthHeader } from '../../lib/api';
import { SidePanel } from './SidePanel';
import type { AppointmentEntry } from './types';
import { SpacetimeSingularity } from '../Patient/SpacetimeSingularity';
import { PrescriptionModal } from '../EMR/EMRTimeline';
import type { TimelineEvent } from '../EMR/EMRTimeline';
import type { Patient } from '../../types/Patient';
import { AdmissionRecord, AdmissionCard } from '../Shared/AdmissionStatus';
import { DocumentBuilderOverlay } from './DocumentBuilderOverlay';
import { HPNotePanel } from './HPNotePanel';




const API_BASE = API_BASE_URL;

/**
 * Client-side mirror of backend parse-duration.js.
 * Converts "7 days", "2 weeks", "30", "1m" → integer days, or null.
 * Used so item.timing acts as a self-healing fallback when item.durationDays is null.
 */
function parseDurationToDays(str: string | null | undefined): number | null {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().toLowerCase();
  if (!s || s === '—') return null;
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(d|day|days|w|week|weeks|m|month|months|y|year|years)?\.?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'd').charAt(0);
  let days: number;
  switch (unit) {
    case 'd': days = Math.round(value); break;
    case 'w': days = Math.round(value * 7); break;
    case 'm': days = Math.round(value * 30); break;
    case 'y': days = Math.round(value * 365); break;
    default:  days = Math.round(value);
  }
  return days > 0 ? days : null;
}

// -- Tokens -------------------------------------------------------
const BG          = '#F5F5F3';
const LINE_CLR    = 'rgba(103, 232, 249, 0.62)';
const CONN_DEF    = '#C8C8C4';
const CONN_GROUP  = '#7A7A78';
const CONN_FOCUS  = '#111111';
const DOT_D       = '#164e63';
const DOT_A       = '#67E8F9';
const MAX_VIS     = 3;

const ACCENT: Record<string, string> = {
  'Cardiology':       '#E7F36E',
  'Nephrology':       '#93C5FD',
  'General Medicine': '#6EE7B7',
  'Dermatology':      '#F9A8D4',
  'Orthopedics':      '#FCA5A5',
  'Pediatrics':       '#FDBA74',
  'Neurology':        '#A78BFA',
  'Oncology':         '#34D399',
  'Endocrinology':    '#67E8F9',
  'Psychiatry':       '#FDE68A',
  'Pulmonology':      '#86EFAC',
  'Gastroenterology': '#FB923C',
  'General Practice': '#6EE7B7',
};
// Palette for unknown specialties (deterministic by name hash)
const ACCENT_PALETTE = ['#E7F36E','#93C5FD','#6EE7B7','#F9A8D4','#FCA5A5','#FDBA74','#A78BFA','#34D399'];
function getAccent(specialty: string, severity?: string, isLab?: boolean, isHPNote?: boolean): string {
  if (isHPNote) return SEVERITY_CLR.hp_note;
  if (isLab) return SEVERITY_CLR.lab;
  if (severity && SEVERITY_CLR[severity.toLowerCase()]) return SEVERITY_CLR[severity.toLowerCase()];
  if (ACCENT[specialty]) return ACCENT[specialty];
  let h = 0;
  for (const c of specialty) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return ACCENT_PALETTE[h % ACCENT_PALETTE.length];
}

const STATUS_CLR: Record<string, string> = {
  normal: '#22C55E', high: '#F97316', low: '#60A5FA', critical: '#EF4444',
};

const SEVERITY_CLR: Record<string, string> = {
  severe:   '#EF4444', // Red
  high:     '#EF4444', // Red
  critical: '#EF4444', // Red
  mild:     '#F97316', // Orange
  low:      '#22C55E', // Green
  lab:      '#D946EF', // Purple/Pink
  hp_note:  '#818CF8', // Indigo/Purple-blue for H&P
};

const BG_PARTICLES = [
  { top: '10%', left: '16%', size: 5, delay: '0s', duration: '21.7s' },
  { top: '18%', left: '62%', size: 4, delay: '1.8s', duration: '26.7s' },
  { top: '28%', left: '78%', size: 6, delay: '0.9s', duration: '23.3s' },
  { top: '42%', left: '24%', size: 3, delay: '2.4s', duration: '20s' },
  { top: '54%', left: '68%', size: 5, delay: '1.2s', duration: '25s' },
  { top: '64%', left: '38%', size: 4, delay: '3.1s', duration: '28.3s' },
  { top: '74%', left: '84%', size: 5, delay: '0.6s', duration: '20.8s' },
  { top: '82%', left: '18%', size: 4, delay: '2.7s', duration: '24.2s' },
];

// -- Data helpers -------------------------------------------------
function extractFromNote(note: string, prefix: string): string | undefined {
  const line = (note || '').split('\n').find(l => l.startsWith(prefix));
  return line ? line.slice(prefix.length).trim() || undefined : undefined;
}

function extractMetrics(note: string): string {
  const vitalsLine = (note || '').split('\n').find(l => l.startsWith('Vitals —'));
  if (vitalsLine) {
    const parts = vitalsLine.replace('Vitals — ', '').split(' | ');
    return parts[0] || 'Consultation';
  }
  const assessment = extractFromNote(note, 'Assessment: ');
  if (assessment) return assessment.slice(0, 24);
  return 'Consultation';
}

function extractVitals(note: string): AppointmentEntry['vitals'] {
  const vitalsLine = (note || '').split('\n').find(l => l.startsWith('Vitals —'));
  if (!vitalsLine) return {};
  const parts = vitalsLine.replace('Vitals —', '').split('|').map(part => part.trim()).filter(Boolean);
  const vitals: AppointmentEntry['vitals'] = {};
  parts.forEach((part) => {
    const [key, ...rest] = part.split(':');
    const value = rest.join(':').trim();
    if (!key || !value) return;
    const norm = key.trim().toLowerCase();
    if (norm === 'bp') vitals.bloodPressure = value;
    if (norm === 'hr') vitals.pulse = value;
    if (norm === 'temp') vitals.temperature = value;
    if (norm === 'spo2') vitals.spo2 = value;
    if (norm === 'ht') vitals.height = value;
    if (norm === 'wt') vitals.weight = value;
  });
  return vitals;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTimelineData(data: any): AppointmentEntry[] {
  if (!data || typeof data !== 'object') {
    console.error("[Meiosis] Received invalid data for timeline:", data);
    return [];
  }

  const prescriptions = Array.isArray(data.prescriptions) ? data.prescriptions : [];
  const labReports    = Array.isArray(data.labReports)    ? data.labReports    : [];
  const appointments  = Array.isArray(data.appointments)  ? data.appointments  : [];
  const hpNotes       = Array.isArray(data.hpNotes)       ? data.hpNotes       : [];

  // Track dates to avoid double-counting consultations and prescriptions
  const handledDates = new Set<string>();

  const results: AppointmentEntry[] = prescriptions.map((rx: any): AppointmentEntry => {
    if (!rx || typeof rx !== 'object') {
      return { id: Math.random().toString(), date: 'Unknown', type: 'Invalid Data', specialty: '', doctor: '', metrics: '', labs: [], prescriptions: [], medications: [] };
    }

    const dateStr = rx.startDate ? new Date(rx.startDate).toISOString().slice(0, 10) : 'Unknown';
    handledDates.add(dateStr);

    const rxLabs = labReports.filter((lr: any) => lr.prescriptionId === rx.id);
    
    let displayDate = 'Unknown Date';
    try {
      if (rx.startDate) {
        const d = new Date(rx.startDate);
        if (!isNaN(d.getTime())) {
          displayDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
    } catch (e) {
      console.warn("[Meiosis] Failed to parse date for prescription:", rx.id, e);
    }

    return {
      id:         rx.id || `rx-${Math.random()}`,
      date:       displayDate,
      type:       rx.title || 'Consultation',
      specialty:  rx.doctor?.specialty || 'General Practice',
      doctor:     rx.doctor?.name       || 'Unknown',
      metrics:    extractMetrics(rx.doctorNote || ''),
      status:     rx.status,
      startDate:  rx.startDate,
      endDate:    rx.endDate,
      durationDays: rx.durationDays,
      adherenceScore: rx.adherenceScore,
      chiefComplaint: extractFromNote(rx.doctorNote || '', 'Chief Complaint: '),
      severity:   rx.severity || extractFromNote(rx.doctorNote || '', 'Severity: '),
      plan:       extractFromNote(rx.doctorNote || '', 'Plan: '),
      notes:      extractFromNote(rx.doctorNote || '', 'Plan: ')
                    ?? extractFromNote(rx.doctorNote || '', 'Assessment: '),
      vitals:     extractVitals(rx.doctorNote || ''),
      labs: (rxLabs || []).map((lr: any) => ({
        id:     lr.id,
        label:  lr.testName || 'Laboratory Test',
        value:  lr.status === 'PENDING' ? 'Pending' : 'Available',
        unit:   undefined,
        status: undefined,
      })),
      prescriptions: (rx.items ?? []).map((item: any) => {
        // 4-tier priority: stored durationDays → parse timing text → rx-wide days → 30d default
        const duration =
          item.durationDays ??
          parseDurationToDays(item.timing) ??
          rx.durationDays ??
          30;
        const startDate = rx.startDate ? new Date(rx.startDate) : new Date();
        const expiryDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
        const isActive = new Date() <= expiryDate;

        return {
          id:        item.id,
          name:      item.medicine || 'Medicine',
          dose:      item.dose      || '—',
          frequency: item.frequency || undefined,
          duration:  item.timing    || undefined,
          instructions: item.reason || undefined,
          isActive:  isActive,
        };
      }),
      medications: [],
      documentPath: rx.documentPath || undefined,
    };
  });

  // Add appointments that aren't tied to prescriptions
  appointments.forEach((apt: any) => {
    const dateStr = apt.scheduledDate ? new Date(apt.scheduledDate).toISOString().slice(0, 10) : 'Unknown';
    if (!handledDates.has(dateStr)) {
      handledDates.add(dateStr);
      let displayDate = 'Unknown Date';
      try {
        const d = new Date(apt.scheduledDate);
        if (!isNaN(d.getTime())) {
          displayDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch {}

      results.push({
        id: apt.id,
        date: displayDate,
        type: apt.purpose || apt.title || 'Scheduled Visit',
        specialty: apt.doctor?.specialty || 'General Practice',
        doctor: apt.doctor?.name || 'Unknown',
        metrics: 'Review',
        status: apt.status,
        notes: apt.notes || undefined,
        labs: [],
        prescriptions: [],
        medications: []
      });
    }
  });

  // Add orphaned lab reports (no prescriptionId)
  const orphanedLabs = labReports.filter((lr: any) => !lr.prescriptionId);
  orphanedLabs.forEach((lr: any) => {
    let displayDate = 'Unknown Date';
      try {
        const d = new Date(lr.reportDate);
        if (!isNaN(d.getTime())) {
          displayDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch {}

    results.push({
      id: lr.id,
      date: displayDate,
      type: 'Laboratory Result',
      specialty: 'Diagnostic Lab',
      doctor: lr.doctor?.name || 'Laboratory Manager',
      metrics: lr.testName,
      severity: 'low',
      status: lr.status,
      isLab: true,
      labs: [{
        id: lr.id,
        label: lr.testName,
        value: lr.status === 'PENDING' ? 'Pending' : 'Available',
      }],
      prescriptions: [],
      medications: [],
      documentPath: lr.documentPath || undefined
    } as any);
  });

  // Add HP notes from the payload
  hpNotes.forEach((note: any) => {
    let displayDate = 'Unknown Date';
    try {
      const d = new Date(note.noteDate);
      if (!isNaN(d.getTime())) {
        displayDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {}

    const isSimple = !!note.noteData?.isSimpleNote;
    const rawDate = note.noteDate || note.createdAt;

    results.push({
      id: note.id,
      date: displayDate,
      type: isSimple ? 'Clinical Note' : (note.title || 'Added Note'),
      specialty: note.doctor?.specialty || 'General Practice',
      doctor: note.doctor?.name || 'Unknown',
      metrics: isSimple ? 'Note' : 'H&P',
      startDate: rawDate,
      status: 'COMPLETED',
      isHPNote: !isSimple,
      isNote: isSimple,
      noteText: isSimple ? note.noteData?.text : undefined,
      hpNoteData: note.noteData || {},
      labs: [],
      prescriptions: [],
      medications: [],
    } as any);
  });

  return results.sort((a, b) => {
    const timeA = new Date(a.startDate || a.date).getTime();
    const timeB = new Date(b.startDate || b.date).getTime();
    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return 1;
    if (isNaN(timeB)) return -1;
    return timeB - timeA;
  });
}


// -- Secondary item union -----------------------------------------
type SItem =
  | { kind: 'lab';  id: string; label: string; value: string; unit?: string; status?: string }
  | { kind: 'rx';   id: string; label: string; value: string; sub?: string; isActive?: boolean }
  | { kind: 'med';  id: string; label: string; value: string; sub?: string };

function flatten(apt: AppointmentEntry): SItem[] {
  return [
    ...apt.labs.map(l         => ({ kind: 'lab' as const, id: l.id, label: l.label, value: l.value, unit: l.unit,  status: l.status })),
    ...apt.prescriptions.map(p => ({ kind: 'rx'  as const, id: p.id, label: p.name,  value: p.dose,  sub: p.frequency, isActive: p.isActive })),
    ...apt.medications.map(m   => ({ kind: 'med' as const, id: m.id, label: m.name,  value: m.dose,  sub: m.ongoing ? 'Ongoing' : undefined })),
  ];
}

type ConnPath = { d: string; secId: string; endX: number; endY: number };
type TimelineTheme = 'default' | 'dashboard-dark' | 'beige-light';

// -- SCard --------------------------------------------------------
interface SCardProps {
  item: SItem;
  grouped: boolean;
  focused: boolean;
  delay: number;
  aptId: string;
  side: 'left' | 'right';
  width: number;
  scale: number;
  timelineTheme?: TimelineTheme;
  noAnim?: boolean;
  setHiId: (id: string | null) => void;
  setFocusId: (id: string | null) => void;
}

const SCard = forwardRef<HTMLDivElement, SCardProps>(
  ({ item, grouped, focused, delay, aptId, side, width, scale, timelineTheme = 'default', noAnim, setHiId, setFocusId }, ref) => {
    const Icon   = item.kind === 'lab' ? FlaskConical : item.kind === 'rx' ? Stethoscope : Pill;
    const isBeigeTheme = timelineTheme === 'beige-light';
    const accent = isBeigeTheme ? '#14B8A6' : item.kind === 'lab' ? '#67E8F9' : '#6EE7B7';
    const useDashboardTheme = timelineTheme === 'dashboard-dark';
    const iconBg = item.kind === 'lab'
      ? isBeigeTheme ? 'rgba(20,184,166,0.12)' : 'color-mix(in srgb, #67E8F9 22%, rgba(255,255,255,0.12))'
      : isBeigeTheme ? 'rgba(20,184,166,0.12)' : 'color-mix(in srgb, #6EE7B7 22%, rgba(255,255,255,0.12))';
    const cardRadius = Math.max(12, Math.round(14 * scale));
    const iconSize = Math.max(24, Math.round(28 * scale));
    const iconRadius = Math.max(7, Math.round(8 * scale));
    const dot    = item.kind === 'lab' && item.status ? STATUS_CLR[item.status] : undefined;
    const cardBg = useDashboardTheme
      ? 'var(--doctor-bg-end, #10253d)'
      : isBeigeTheme
      ? '#FAF7F2'
      : '#1d384c';
    const groupedBorder = useDashboardTheme
      ? '1px solid rgba(255,255,255,0.12)'
      : isBeigeTheme
      ? '1px solid rgba(120, 95, 70, 0.16)'
      : '1px solid rgba(255,255,255,0.18)';
    const idleBorder = useDashboardTheme
      ? '1px solid rgba(255,255,255,0.06)'
      : isBeigeTheme
      ? '1px solid rgba(120, 95, 70, 0.12)'
      : '1px solid rgba(255,255,255,0.10)';

    return (
      <div
        ref={ref}
        onMouseEnter={() => { setHiId(aptId); setFocusId(item.id); }}
        onMouseLeave={() => { setHiId(null); setFocusId(null); }}
        style={{
          background: cardBg,
          backdropFilter: 'blur(16px) saturate(130%)',
          WebkitBackdropFilter: 'blur(16px) saturate(130%)',
          borderRadius: cardRadius,
          padding: `${Math.max(8, Math.round(9 * scale))}px ${Math.max(10, Math.round(12 * scale))}px`,
          display: 'flex',
          alignItems: 'center',
          gap: Math.max(7, Math.round(9 * scale)),
          width,
          maxWidth: '100%',
          flexShrink: 0,
          border: focused
            ? `1px solid color-mix(in srgb, ${accent} 40%, rgba(255,255,255,0.34))`
            : grouped
            ? groupedBorder
            : idleBorder,
          boxShadow: focused
            ? isBeigeTheme
              ? `0 12px 24px rgba(93,72,50,0.14), 0 0 0 1px color-mix(in srgb, ${accent} 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)`
              : `0 12px 26px rgba(1,10,24,0.28), 0 0 0 1px color-mix(in srgb, ${accent} 16%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`
            : grouped
            ? isBeigeTheme
              ? '0 10px 22px rgba(93,72,50,0.10), inset 0 1px 0 rgba(255,255,255,0.22)'
              : '0 10px 22px rgba(1,10,24,0.20), inset 0 1px 0 rgba(255,255,255,0.06)'
            : isBeigeTheme
              ? '0 8px 18px rgba(93,72,50,0.08), inset 0 1px 0 rgba(255,255,255,0.18)'
              : '0 8px 18px rgba(1,10,24,0.16), inset 0 1px 0 rgba(255,255,255,0.05)',
          transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
          transform: focused
            ? `translateX(${side === 'right' ? 2 : -2}px) scale(1.01)`
            : 'translateX(0) scale(1)',
          // Grey out inactive rx items in the secondary card
          opacity: (item.kind === 'rx' && item.isActive === false) ? 0.45 : (noAnim ? 1 : 0),
          filter: (item.kind === 'rx' && item.isActive === false) ? 'grayscale(0.7)' : 'none',
          animation: (item.kind === 'rx' && item.isActive === false) ? 'none' : (noAnim ? 'none' : `sIn 0.38s ${delay}ms ease forwards`),
          cursor: 'default',
          willChange: 'transform, box-shadow',
        }}
      >
        <div
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconRadius,
            background: iconBg,
            border: isBeigeTheme ? `1px solid color-mix(in srgb, ${accent} 18%, rgba(89,69,48,0.14))` : `1px solid color-mix(in srgb, ${accent} 26%, rgba(255,255,255,0.12))`,
            boxShadow: isBeigeTheme ? `0 0 10px color-mix(in srgb, ${accent} 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.18)` : `0 0 14px color-mix(in srgb, ${accent} 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={Math.max(12, Math.round(13 * scale))} color={accent} strokeWidth={2.35} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: Math.max(9, 9.5 * scale), fontWeight: 700, color: isBeigeTheme ? 'rgba(72,56,38,0.72)' : 'rgba(238,247,255,0.68)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            {item.label}
          </div>
          <div style={{ fontSize: Math.max(12, 12.5 * scale), fontWeight: 800, color: isBeigeTheme ? '#2f2418' : '#FFFFFF', textShadow: isBeigeTheme ? '0 1px 0 rgba(255,255,255,0.18)' : '0 1px 0 rgba(0,0,0,0.12)' }}>
            {item.value}
            {'unit' in item && item.unit
              ? <span style={{ fontSize: Math.max(9, 9.5 * scale), fontWeight: 500, color: isBeigeTheme ? 'rgba(84,66,46,0.72)' : 'rgba(236,245,255,0.62)', marginLeft: 2 }}>{item.unit}</span>
              : null}
            {'sub' in item && item.sub
              ? <span style={{ fontSize: Math.max(9, 9.5 * scale), fontWeight: 500, color: isBeigeTheme ? 'rgba(84,66,46,0.72)' : 'rgba(236,245,255,0.62)', marginLeft: 2 }}>· {item.sub}</span>
              : null}
          </div>
        </div>
        {dot ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} /> : null}
      </div>
    );
  }
);

// -- PCard --------------------------------------------------------
interface PCardProps {
  apt: AppointmentEntry;
  accent: string;
  hi: boolean;
  delay: number;
  side: 'left' | 'right';
  width: number;
  scale: number;
  timelineTheme?: TimelineTheme;
  setHiId: (id: string | null) => void;
  setFocusId: (id: string | null) => void;
  onSel: (a: AppointmentEntry) => void;
  accessLevel?: 'full' | 'lab' | 'summary' | null;
}

const PCard = forwardRef<HTMLDivElement, PCardProps>(
  ({ apt, accent, hi, delay, side, width, scale, timelineTheme = 'default', setHiId, setFocusId, onSel, accessLevel }, ref) => (
    <motion.div
      layoutId={`emr-card-${apt.id}`}
      ref={ref}
        onClick={() => onSel(apt)}
        onMouseEnter={() => { setHiId(apt.id); setFocusId(null); }}
        onMouseLeave={() => setHiId(null)}
        style={{
          position: 'relative',
          background: timelineTheme === 'dashboard-dark'
            ? 'var(--doctor-bg-end, #0d2239)'
            : timelineTheme === 'beige-light'
            ? '#FAF7F2'
            : '#132434',
          backdropFilter: 'blur(18px) saturate(135%)',
          WebkitBackdropFilter: 'blur(18px) saturate(135%)',
          borderRadius: Math.max(18, Math.round(20 * scale)),
          padding: `${Math.max(18, Math.round(20 * scale))}px ${Math.max(18, Math.round(22 * scale))}px`,
          cursor: 'pointer',
          width,
          maxWidth: '100%',
          flexShrink: 0,
          border: hi
            ? `1px solid color-mix(in srgb, ${accent} 40%, rgba(255,255,255,0.40))`
            : timelineTheme === 'dashboard-dark'
            ? '1px solid rgba(255,255,255,0.08)'
            : timelineTheme === 'beige-light'
            ? '1px solid rgba(118, 94, 70, 0.14)'
            : '1px solid rgba(255,255,255,0.12)',
          boxShadow: hi
            ? timelineTheme === 'beige-light'
              ? `0 18px 36px rgba(94,72,50,0.14), 0 0 0 1px color-mix(in srgb, ${accent} 10%, transparent), inset 0 1px 0 rgba(255,255,255,0.24)`
              : `0 18px 42px rgba(1,10,24,0.34), 0 0 0 1px color-mix(in srgb, ${accent} 12%, transparent), inset 0 1px 0 rgba(255,255,255,0.09)`
            : timelineTheme === 'beige-light'
              ? '0 16px 32px rgba(94,72,50,0.10), inset 0 1px 0 rgba(255,255,255,0.20)'
              : '0 16px 36px rgba(1,10,24,0.24), inset 0 1px 0 rgba(255,255,255,0.07)',
          transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
          transform: hi ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
          opacity: 0,
          animation: `pIn${side === 'left' ? 'L' : 'R'} 0.42s ${delay}ms ease forwards`,
          willChange: 'transform, box-shadow',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: Math.max(18, Math.round(20 * scale)),
            pointerEvents: 'none',
            background: timelineTheme === 'beige-light' ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
            opacity: 1,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: Math.max(4, Math.round(4 * scale)), background: timelineTheme === 'beige-light' ? 'rgba(255,255,255,0.26)' : 'color-mix(in srgb, rgba(255,255,255,0.12) 72%, transparent)', border: timelineTheme === 'beige-light' ? '1px solid rgba(116,92,68,0.10)' : '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: `${Math.max(3, Math.round(3 * scale))}px ${Math.max(8, Math.round(9 * scale))}px`, marginBottom: Math.max(10, Math.round(12 * scale)), boxShadow: timelineTheme === 'beige-light' ? 'inset 0 1px 0 rgba(255,255,255,0.22)' : 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          {(() => {
            if ((apt as any).isHPNote) {
              return (
                <>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: accent }} />
                  <span style={{ fontSize: Math.max(9, 9 * scale), fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: accent }}>
                    Added Note
                  </span>
                </>
              );
            }
            const hasMeds = (apt.prescriptions?.length ?? 0) > 0 && accessLevel === 'full';
            const hasActiveMed = hasMeds && apt.prescriptions!.some(p => p.isActive);
            // Active → accent color; Inactive → grey (no meds or all expired)
            const pillColor = hasMeds ? (hasActiveMed ? accent : '#9CA3AF') : accent;
            const pillText = hasMeds ? (hasActiveMed ? 'Active Prescription' : 'Inactive') : apt.specialty;
            return (
              <>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: pillColor }} />
                <span style={{ fontSize: Math.max(9, 9 * scale), fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: pillColor }}>
                  {pillText}
                </span>
              </>
            );
          })()}
        </div>
        <div style={{ position: 'relative', zIndex: 1, fontSize: Math.max(15, 16 * scale), fontWeight: 800, color: timelineTheme === 'beige-light' ? '#2e2418' : '#FFFFFF', lineHeight: 1.3, marginBottom: 5, textShadow: timelineTheme === 'beige-light' ? '0 1px 0 rgba(255,255,255,0.18)' : '0 1px 0 rgba(0,0,0,0.16)' }}>
          {(apt as any).isHPNote ? 'Added Note' : 'Consultation'}, {apt.date}
        </div>
        <div style={{ position: 'relative', zIndex: 1, fontSize: Math.max(10.5, 11 * scale), color: timelineTheme === 'beige-light' ? 'rgba(72,56,38,0.78)' : 'rgba(240,247,255,0.72)', marginBottom: Math.max(14, Math.round(16 * scale)), fontWeight: 500 }}>
          {apt.date} · {apt.doctor}
        </div>
  
        {(accessLevel === 'full' || accessLevel === 'summary') && (
          <div style={{ position: 'relative', zIndex: 1, background: timelineTheme === 'beige-light' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)', border: timelineTheme === 'beige-light' ? '1px solid rgba(116,92,68,0.10)' : '1px solid rgba(255,255,255,0.10)', borderRadius: Math.max(11, Math.round(12 * scale)), padding: `${Math.max(8, Math.round(9 * scale))}px ${Math.max(11, Math.round(13 * scale))}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: timelineTheme === 'beige-light' ? 'inset 0 1px 0 rgba(255,255,255,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: Math.max(9, 9.5 * scale), color: timelineTheme === 'beige-light' ? 'rgba(90,70,50,0.72)' : 'rgba(238,247,255,0.58)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Key Metric
            </span>
            <span style={{ fontSize: Math.max(15, 16 * scale), fontWeight: 800, color: timelineTheme === 'beige-light' ? '#10B981' : accent, textShadow: '0 0 10px color-mix(in srgb, currentColor 16%, transparent)' }}>
              {apt.metrics}
            </span>
          </div>
        )}
  
        <div style={{ position: 'relative', zIndex: 1, fontSize: Math.max(9, 9.5 * scale), color: timelineTheme === 'beige-light' ? 'rgba(84,66,46,0.62)' : 'rgba(236,245,255,0.48)', marginTop: Math.max(8, Math.round(10 * scale)), textAlign: side === 'left' ? 'left' : 'right', fontWeight: 600 }}>
          {side === 'left' ? '↗ Details' : 'Details ↘'}
        </div>
      </motion.div>
  )
);

// -- TimelineGroup ------------------------------------------------
interface GroupProps {
  apt: AppointmentEntry;
  side: 'left' | 'right';
  baseDelay: number;
  floatDelay: number;
  primaryCardWidth: number;
  secondaryCardWidth: number;
  columnGap: number;
  scale: number;
  compact: boolean;
  timelineTheme?: TimelineTheme;
  hiId: string | null;
  focusId: string | null;
  setHiId: (id: string | null) => void;
  setFocusId: (id: string | null) => void;
  onSelect: (a: AppointmentEntry) => void;
  onCardRef: (el: HTMLDivElement | null) => void;
  onDotRef: (el: SVGCircleElement | null) => void;
  accessLevel?: 'full' | 'lab' | 'summary' | null;
}

function TimelineGroup({ apt, side, baseDelay, floatDelay, primaryCardWidth, secondaryCardWidth, columnGap, scale, compact, timelineTheme = 'default', hiId, focusId, setHiId, setFocusId, onSelect, onCardRef, onDotRef, accessLevel }: GroupProps) {
  const allItems  = flatten(apt);
  const items = allItems.filter(item => {
    if (accessLevel === 'full') return true;
    if (accessLevel === 'lab') return item.kind === 'lab';
    if (accessLevel === 'summary') return false; // Secondary cards (pills/labs) hidden in summary-only
    return false;
  });
  const accent = getAccent(apt.specialty, apt.severity, (apt as any).isLab, (apt as any).isHPNote);
  const hi     = hiId === apt.id;
  const isLeft = side === 'left';

  const [expanded, setExpanded] = useState(false);
  const alwaysVisible = items.slice(0, MAX_VIS);
  const hidden        = items.slice(MAX_VIS);
  const hasHidden     = hidden.length > 0;

  // -- Shared secondary card stack -------------------------------
  const branchGlow = 'rgba(103, 232, 249, 0.52)';
  const branchGlowActive = 'rgba(165, 243, 252, 0.98)';
  const branchSoft = 'rgba(103, 232, 249, 0.18)';
  const branchTrack = 'rgba(140, 166, 192, 0.18)';
  const railInset = 10;
  const branchWidth = Math.max(16, Math.round((compact ? 18 : 22) * scale));
  const branchAttachOverlap = 8;
  const mainLinkWidth = Math.max(22, Math.round((compact ? 26 : 34) * scale));
  const groupFloatDuration = `${30 + (floatDelay % 4) * 5}s`;
  const groupFloatDelay = `${(floatDelay * 0.65).toFixed(2)}s`;
  const visibleBranchCount = alwaysVisible.length + (expanded ? hidden.length : 0);
  const branchCardHeight = Math.max(40, Math.round(44 * scale));
  const branchCardGap = Math.max(8, Math.round(10 * scale));
  const branchSvgHeight = Math.max(20, visibleBranchCount * branchCardHeight + Math.max(0, visibleBranchCount - 1) * branchCardGap);
  const branchStartY = branchSvgHeight / 2;

  function getSharedBranchPath(index: number) {
    const endY = branchCardHeight / 2 + index * (branchCardHeight + branchCardGap);
    const startX = isLeft ? branchWidth : 0;
    const endX = isLeft ? 0 : branchWidth;
    const c1X = isLeft ? branchWidth - 10 : 10;
    const c2X = isLeft ? 12 : branchWidth - 12;
    return `M ${startX} ${branchStartY} C ${c1X} ${branchStartY} ${c2X} ${endY} ${endX} ${endY}`;
  }

  function renderSecondaryCard(item: SItem, index: number, delay: number, noAnim?: boolean) {
    return (
      <div>
        <div style={{ position: 'relative', paddingLeft: isLeft ? 0 : branchWidth - branchAttachOverlap, paddingRight: isLeft ? branchWidth - branchAttachOverlap : 0 }}>
          <SCard
            item={item}
            grouped={hi}
            focused={focusId === item.id}
            delay={noAnim ? 0 : baseDelay + 80 + index * 55}
            aptId={apt.id}
            side={side}
            width={secondaryCardWidth}
            scale={scale}
            timelineTheme={timelineTheme}
            noAnim={noAnim}
            setHiId={setHiId}
            setFocusId={setFocusId}
          />
        </div>
      </div>
    );
  }

  const secondaryStack = items.length > 0 && (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        paddingLeft: isLeft ? 0 : branchWidth - branchAttachOverlap + 2,
        paddingRight: isLeft ? branchWidth - branchAttachOverlap + 2 : 0,
      }}
    >
      {visibleBranchCount > 0 && (
        <svg
          aria-hidden
          width={branchWidth}
          height={branchSvgHeight}
          viewBox={`0 0 ${branchWidth} ${branchSvgHeight}`}
          style={{
            position: 'absolute',
            top: branchCardHeight / 2,
            left: isLeft ? 'auto' : -branchAttachOverlap,
            right: isLeft ? -branchAttachOverlap : 'auto',
            overflow: 'visible',
            filter: hi ? `drop-shadow(0 0 10px rgba(103,232,249,0.32))` : `drop-shadow(0 0 4px ${branchSoft})`,
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: visibleBranchCount }).map((_, index) => {
            const endY = branchCardHeight / 2 + index * (branchCardHeight + branchCardGap);
            return (
              <g key={index}>
                <path
                  d={getSharedBranchPath(index)}
                  fill="none"
                  stroke={hi ? branchGlowActive : branchGlow}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: `emrCyanPulse ${hi ? '1.5s' : '2.4s'} ease-in-out infinite` }}
                />
                <circle
                  cx={isLeft ? 0 : branchWidth}
                  cy={endY}
                  r="2.5"
                  fill="rgba(198, 216, 235, 0.92)"
                  stroke="rgba(12, 28, 48, 0.42)"
                  strokeWidth="1"
                />
              </g>
            );
          })}
          <circle
            cx={isLeft ? branchWidth : 0}
            cy={branchStartY}
            r="3"
            fill="rgba(198, 216, 235, 0.92)"
            stroke="rgba(12, 28, 48, 0.42)"
            strokeWidth="1"
          />
        </svg>
      )}

      {/* Cards column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
        {alwaysVisible.map((item, i) => (
          <div key={item.id}>
            {renderSecondaryCard(item, i, floatDelay + i * 0.3)}
          </div>
        ))}

        {hasHidden && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'grid',
              gridTemplateRows: expanded ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 10 }}>
                  {hidden.map((item, i) => (
                    <div key={item.id} style={{
                      opacity: expanded ? 1 : 0,
                      transform: expanded ? 'translateY(0)' : 'translateY(-8px)',
                      transition: expanded
                        ? `opacity 0.30s ${i * 0.08 + 0.08}s cubic-bezier(0.22,1,0.36,1), transform 0.30s ${i * 0.08 + 0.08}s cubic-bezier(0.22,1,0.36,1)`
                        : 'opacity 0.10s ease, transform 0.10s ease',
                      }}>
                      {renderSecondaryCard(item, MAX_VIS + i, floatDelay + (MAX_VIS + i) * 0.3, true)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
              <div style={{ position: 'relative', paddingLeft: isLeft ? 0 : branchWidth - branchAttachOverlap, paddingRight: isLeft ? branchWidth - branchAttachOverlap : 0 }}>
                <button type="button" onClick={() => setExpanded(v => !v)} style={{
                  background: expanded ? 'rgba(0,0,0,0.025)' : 'transparent',
                  border: '1.5px dashed #CECECA', borderRadius: 10,
                  padding: '6px 12px', fontSize: 11, fontWeight: 600,
                  color: '#A8A8A5', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  width: secondaryCardWidth, maxWidth: '100%', transition: 'border-color 0.18s, color 0.18s, background 0.22s',
                }}>
                  <ChevronDown size={11} style={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)', flexShrink: 0,
                  }} />
                  {expanded ? 'Show less' : `Show all ${hidden.length} more`}
                </button>
              </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
      <div style={{
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: columnGap,
        padding: 0,
        position: 'relative',
        overflow: 'visible',
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        animation: `emrCardDrift ${groupFloatDuration} ease-in-out ${groupFloatDelay} infinite`,
        willChange: 'transform',
      }}>
      {isLeft && secondaryStack}

      {/* Primary card */}
      <div style={{ position: 'relative', overflow: 'visible' }}>
        <svg
          aria-hidden
          width={mainLinkWidth}
          height="32"
          viewBox={`0 0 ${mainLinkWidth} 32`}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: isLeft ? -(mainLinkWidth - 2) : 'auto',
            left: isLeft ? 'auto' : -(mainLinkWidth - 2),
            overflow: 'visible',
            filter: hi ? `drop-shadow(0 0 8px rgba(231,243,110,0.22))` : `drop-shadow(0 0 4px ${branchSoft})`,
            pointerEvents: 'none',
          }}
        >
          <path
            d={isLeft
              ? `M 0 16 L ${mainLinkWidth} 16`
              : `M ${mainLinkWidth} 16 L 0 16`}
            fill="none"
            stroke={hi ? branchGlowActive : branchGlow}
            strokeWidth={hi ? '2.4' : '2'}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: `emrCyanPulse ${hi ? '1.35s' : '2.2s'} ease-in-out infinite` }}
          />
          <circle
            ref={onDotRef}
            cx={isLeft ? 0 : mainLinkWidth}
            cy="16"
            r={hi ? '6' : '5'}
            fill={hi ? DOT_A : 'rgba(198, 216, 235, 0.92)'}
            stroke={hi ? DOT_A : 'rgba(12, 28, 48, 0.42)'}
            strokeWidth={hi ? '2' : '1'}
            style={{ transition: 'all 0.2s ease', filter: hi ? `drop-shadow(0 0 8px rgba(103,232,249,0.7))` : 'drop-shadow(0 0 4px rgba(103,232,249,0.24))', animation: `emrCyanPulse ${hi ? '1.2s' : '2.6s'} ease-in-out infinite` }}
          />
          <circle
            cx={isLeft ? mainLinkWidth : 0}
            cy="16"
            r="3"
            fill="rgba(198, 216, 235, 0.92)"
            stroke="rgba(12, 28, 48, 0.42)"
            strokeWidth="1"
          />
        </svg>
        <PCard
          ref={onCardRef}
          apt={apt} accent={accent} hi={hi}
          delay={baseDelay} side={side}
          width={primaryCardWidth}
          scale={scale}
          timelineTheme={timelineTheme}
          setHiId={setHiId} setFocusId={setFocusId} onSel={onSelect}
          accessLevel={accessLevel}
        />
      </div>

      {!isLeft && secondaryStack}
    </div>
  );
}

// -- RightPanel ---------------------------------------------------
const FLAG_CLR: Record<string, { dot: string; bg: string; label: string }> = {
  high:     { dot: '#F97316', bg: '#FFF7ED', label: 'High'     },
  low:      { dot: '#60A5FA', bg: '#EFF6FF', label: 'Low'      },
  critical: { dot: '#EF4444', bg: '#FEF2F2', label: 'Critical' },
};

function RightPanel({ onSelect, data }: { onSelect: (apt: AppointmentEntry) => void; data: AppointmentEntry[] }) {
  const flags = data.flatMap(apt =>
    apt.labs
      .filter(l => l.status && l.status !== 'normal')
      .map(l => ({ lab: l, apt }))
  );

  return (
    <div style={{
      width: 264,
      flexShrink: 0,
      height: '100%',
      overflowY: 'auto',
      borderLeft: '1px solid #E4E4E2',
      background: '#F8F8F6',
      padding: '36px 18px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      zIndex: 1,
    }}>
      {/* -- Abnormal flags -- */}
      {flags.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#BBBBB9', marginBottom: 10 }}>
            Abnormal Results
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {flags.map(({ lab, apt }) => {
              const meta = FLAG_CLR[lab.status!];
              if (!meta) return null;
              return (
                <div
                  key={lab.id}
                  onClick={() => onSelect(apt)}
                  style={{
                    background: meta.bg,
                    borderRadius: 10,
                    padding: '9px 12px',
                    border: `1px solid ${meta.dot}22`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lab.label}</div>
                    <div style={{ fontSize: 9.5, color: '#888', marginTop: 1 }}>
                      {lab.value}{lab.unit ? ' ' + lab.unit : ''} · {meta.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

function AIAnalysisPanel({ 
  data, 
  darkMode, 
  stacked = false, 
  accessLevel, 
  onBack,
  isAiExpanded,
  setIsAiExpanded,
  isOverviewExpanded,
  setIsOverviewExpanded,
  admissionRecord
}: { 
  data: AppointmentEntry[]; 
  darkMode?: boolean; 
  stacked?: boolean; 
  accessLevel?: 'full' | 'lab' | 'summary' | null; 
  onBack?: () => void;
  isAiExpanded: boolean;
  setIsAiExpanded: (val: boolean) => void;
  isOverviewExpanded: boolean;
  setIsOverviewExpanded: (val: boolean) => void;
  admissionRecord: AdmissionRecord | null;
}) {
  const totalVisits = data.length;
  const latest = data[0];
  const specialtyCounts = data.reduce<Record<string, number>>((acc, apt) => {
    acc[apt.specialty] = (acc[apt.specialty] ?? 0) + 1;
    return acc;
  }, {});
  const leadSpecialty = Object.entries(specialtyCounts).sort((a, b) => b[1] - a[1])[0];
  const flaggedLabs = data.flatMap(apt => apt.labs.filter(l => l.status && l.status !== 'normal'));
  const prescriptionCount = data.reduce((sum, apt) => sum + apt.prescriptions.length, 0);
  const medicationCount = data.reduce((sum, apt) => sum + apt.medications.length, 0);

  const shellBg = darkMode
    ? 'rgba(3, 21, 37, 0.45)' // Reduced opacity for better flow
    : 'rgba(255, 255, 255, 0.6)';
  const shellBorder = darkMode
    ? '1px solid rgba(255, 255, 255, 0.08)' // Thinner, more neutral border
    : '1px solid rgba(0, 0, 0, 0.04)';
  const shellShadow = 'none'; // Removed heavy shadow to eliminate vertical 'show/split' type look
  const titleClr = darkMode ? 'var(--doctor-text)' : '#0f172a';
  const muted = darkMode ? 'var(--doctor-muted)' : '#64748b';
  const latestDate = data[0]?.date ?? '';
  const earliestDate = data[data.length - 1]?.date ?? '';
  const panelBg = darkMode
    ? 'color-mix(in srgb, var(--doctor-card-tint) 92%, rgba(255,255,255,0.04))'
    : 'rgba(255,255,255,0.8)';
  const panelBorder = darkMode
    ? '1px solid color-mix(in srgb, rgba(255,255,255,0.08) 50%, var(--doctor-border) 50%)'
    : '1px solid rgba(148,163,184,0.18)';

  const insights = [
    {
      icon: <Activity size={14} />,
      label: 'Clinical Pattern',
      text: latest
        ? `${totalVisits} visits logged, with ${leadSpecialty ? leadSpecialty[0] : 'general care'} appearing most often. Latest encounter focus remains ${latest.specialty.toLowerCase()}.`
        : 'No longitudinal pattern available yet.',
      visible: accessLevel === 'full'
    },
    {
      icon: <ShieldAlert size={14} />,
      label: 'Risk Focus',
      text: flaggedLabs.length > 0
        ? `${flaggedLabs.length} abnormal lab flag${flaggedLabs.length > 1 ? 's are' : ' is'} present in the current timeline and may need closer review.`
        : 'No abnormal lab markers stand out in the available timeline.',
      visible: accessLevel === 'full' || accessLevel === 'lab'
    },
    {
      icon: <TrendingUp size={14} />,
      label: 'Continuity',
      text: `${prescriptionCount + medicationCount} medication-related entries are spread across the record, suggesting ongoing treatment continuity rather than isolated visits.`,
      visible: accessLevel === 'full'
    },
  ].filter(i => i.visible);

  return (
      <div
        style={{
        width: '100%',
        flexShrink: 0,
        height: stacked ? 'auto' : '100%',
        overflowY: 'auto',
        padding: stacked ? '24px 5px 18px 0' : '28px 0 32px 0',
        borderRight: 'none',
        borderBottom: 'none',
        background: 'transparent',
        display: 'flex',
        flexDirection: stacked ? 'row' : 'column',
        alignItems: 'stretch',
        flexWrap: stacked ? 'wrap' : 'nowrap',
        gap: 18,
        zIndex: 1,
      }}
    >
      <motion.div
        layoutId="overview-intelligence-panel"
        onClick={() => setIsOverviewExpanded(true)}
        style={{
          background: shellBg,
          border: shellBorder,
          boxShadow: shellShadow,
          borderRadius: 24,
          padding: '16px 14px',
          width: 'calc(100% - 20px)',
          marginLeft: 5,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          maxHeight: stacked ? 'none' : '34%',
          overflowY: 'auto',
          minHeight: 220,
          flex: stacked ? '1 1 320px' : '0 0 auto',
          cursor: 'pointer',
          position: 'relative',
        }}
        whileHover={{ scale: 1.005, background: darkMode ? 'rgba(3, 21, 37, 0.55)' : 'rgba(255, 255, 255, 0.7)' }}
        transition={{ 
          layout: { type: 'spring', stiffness: 400, damping: 40 },
          scale: { duration: 0.2 }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {onBack ? (
            <button
              onClick={(e) => { e.stopPropagation(); onBack(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 99,
                background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                color: darkMode ? 'var(--doctor-text)' : '#475569',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <ArrowLeft size={12} strokeWidth={3} />
              Back
            </button>
          ) : (
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: darkMode ? 'var(--doctor-accent)' : '#0f766e' }}>
              Overview
            </div>
          )}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: darkMode ? 'color-mix(in srgb, var(--doctor-accent) 14%, transparent)' : 'rgba(16,185,129,0.12)',
              color: darkMode ? 'var(--doctor-accent)' : '#0f766e',
              border: darkMode ? '1px solid color-mix(in srgb, var(--doctor-accent) 22%, transparent)' : '1px solid rgba(16,185,129,0.16)',
            }}
          >
            <Activity size={14} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'Visits', value: String(totalVisits) },
            { label: 'Specialties', value: String(leadSpecialty ? Object.keys(specialtyCounts).length : 0) },
            { label: 'Flags', value: String(flaggedLabs.length) },
            { label: 'Meds', value: String(prescriptionCount + medicationCount) },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                background: panelBg,
                border: panelBorder,
                borderRadius: 16,
                padding: '10px 12px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: titleClr, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: muted, marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        {(earliestDate || latestDate) && (
          <div
            style={{
              background: panelBg,
              border: panelBorder,
              borderRadius: 16,
              padding: '10px 12px',
              fontSize: 11,
              color: muted,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ fontWeight: 700, color: titleClr }}>{earliestDate}</span>
            <span style={{ margin: '0 6px', color: muted }}>to</span>
            <span style={{ fontWeight: 700, color: titleClr }}>{latestDate}</span>
          </div>
        )}
      </motion.div>

      <motion.div
        layoutId="ai-intelligence-panel"
        onClick={() => setIsAiExpanded(true)}
        style={{
          background: shellBg,
          border: shellBorder,
          boxShadow: shellShadow,
          borderRadius: 24,
          padding: '18px 16px',
          width: 'calc(100% - 20px)',
          marginLeft: 5,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          flex: stacked ? '1 1 420px' : 1,
          minHeight: stacked ? 220 : 0,
          overflowY: 'auto',
          cursor: 'pointer',
          position: 'relative',
        }}
        whileHover={{ scale: 1.005, background: darkMode ? 'rgba(3, 21, 37, 0.55)' : 'rgba(255, 255, 255, 0.7)' }}
        transition={{ 
          layout: { type: 'spring', stiffness: 400, damping: 40 }, // Higher damping for professional "snap"
          opacity: { duration: 0.2 },
          scale: { duration: 0.2, ease: 'easeOut' }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: darkMode ? 'var(--doctor-accent)' : '#0f766e', marginBottom: 6 }}>
              AI Analysis
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: titleClr, lineHeight: 1.2 }}>
              Timeline Insight
            </div>
          </div>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: darkMode ? 'color-mix(in srgb, var(--doctor-accent) 14%, transparent)' : 'rgba(16,185,129,0.12)',
              color: darkMode ? 'var(--doctor-accent)' : '#0f766e',
              border: darkMode ? '1px solid color-mix(in srgb, var(--doctor-accent) 22%, transparent)' : '1px solid rgba(16,185,129,0.16)',
            }}
          >
            <Sparkles size={16} />
          </div>
        </div>

        <div
          style={{
            background: panelBg,
            border: panelBorder,
            borderRadius: 18,
            padding: '14px 14px 12px',
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: titleClr, marginBottom: 6 }}>
            {latest ? `${latest.type} remains the anchor event` : 'Awaiting enough activity for analysis'}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.55, color: muted }}>
            {latest
              ? `The current record suggests a ${leadSpecialty ? leadSpecialty[0].toLowerCase() : 'general'}-led care path with recurring follow-up behavior and medication continuity.`
              : 'Search for a patient to unlock longitudinal pattern analysis.'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ background: panelBg, border: panelBorder, borderRadius: 14, padding: '9px 12px', minWidth: 0 }}>
            <div style={{ fontSize: 10, color: muted, marginBottom: 2 }}>Lead Specialty</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: titleClr, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {leadSpecialty ? leadSpecialty[0] : 'Not enough data'}
            </div>
          </div>
          <div style={{ background: panelBg, border: panelBorder, borderRadius: 14, padding: '9px 12px', minWidth: 86 }}>
            <div style={{ fontSize: 10, color: muted, marginBottom: 2 }}>Dominance</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: titleClr }}>
              {leadSpecialty ? `${leadSpecialty[1]} visits` : '0 visits'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {insights.map(item => (
            <div
              key={item.label}
              style={{
                background: panelBg,
                border: panelBorder,
                borderRadius: 18,
                padding: '12px 13px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, color: darkMode ? 'var(--doctor-accent-secondary)' : '#1d4ed8' }}>
                {item.icon}
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.55, color: muted }}>{item.text}</div>
            </div>
          ))}
        </div>

        {/* Click to expand hint */}
        <div style={{ marginTop: 14, textAlign: 'center' }}>
           <span style={{ fontSize: 10, fontWeight: 700, color: darkMode ? 'var(--doctor-accent)' : '#0f766e', opacity: 0.6, letterSpacing: '0.05em' }}>
              CLICK FOR DETAILED ANALYSIS
           </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {(isAiExpanded || isOverviewExpanded) && (
          <IntelligenceOverlay 
            data={data}
            darkMode={darkMode}
            onClose={() => { setIsAiExpanded(false); setIsOverviewExpanded(false); }}
            leadSpecialty={leadSpecialty}
            flaggedLabs={flaggedLabs}
            totalVisits={totalVisits}
            initialMode={isAiExpanded ? 'ai' : 'overview'}
            admissionRecord={admissionRecord}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function IntelligenceOverlay({ 
  data, 
  darkMode, 
  onClose, 
  leadSpecialty, 
  flaggedLabs, 
  totalVisits,
  initialMode,
  admissionRecord
}: { 
  data: AppointmentEntry[]; 
  darkMode?: boolean; 
  onClose: () => void;
  leadSpecialty: [string, number] | undefined;
  flaggedLabs: any[];
  totalVisits: number;
  initialMode: 'overview' | 'ai';
  admissionRecord: AdmissionRecord | null;
}) {
  const [mode, setMode] = useState<'overview' | 'ai'>(initialMode);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello Dr. Aditya, I've analyzed this patient's longitudinal data. How can I assist with your clinical assessment today?" }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hoveredEMR, setHoveredEMR] = useState<any | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 100);
  };

  useEffect(() => {
    if (mode === 'ai') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  // Handle keyboard shortcuts within the overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (e.key.toLowerCase() === 'o' && !isInput) {
        setMode('overview');
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key.toLowerCase() === 'i' && !isInput) {
        setMode('ai');
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === 'ArrowDown' && mode === 'overview') {
        setMode('ai');
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'ArrowUp' && mode === 'ai') {
        setMode('overview');
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === ' ') {
        // In AI mode, space closing is conditional on chat text
        if (mode === 'ai') {
          if (isInput) {
            if (!chatMessage.trim()) {
              onClose();
              e.preventDefault();
              e.stopPropagation();
            }
          } else {
            onClose();
            e.preventDefault();
            e.stopPropagation();
          }
        } 
        // In Overview mode, space always closes (no chat input)
        else {
          onClose();
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [mode, chatMessage, onClose]);

  const handleSend = () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage.trim();
    const newMsgs = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMsgs);
    setChatMessage('');
    
    // Simulate thinking state
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: '...' }]);
      
      // Generate dynamic response based on EMR data
      setTimeout(() => {
        let response = "";
        const lower = userMsg.toLowerCase();
        
        if (lower.includes('med') || lower.includes('drug') || lower.includes('prescription') || lower.includes('rx')) {
          const activeMeds = Array.from(new Set(data.flatMap(d => d.prescriptions?.filter(p => p.isActive).map(p => p.name)).filter(Boolean)));
          response = activeMeds.length > 0 
            ? `The patient's current regimen consists of ${activeMeds.length} active prescriptions, including ${activeMeds.slice(0, 3).join(', ')}. No contraindications detected in recent systemic markers.`
            : `I've analyzed the longitudinal data and found no active pharmacological prescriptions currently on file for this patient.`;
        } else if (lower.includes('lab') || lower.includes('test') || lower.includes('flag') || lower.includes('result')) {
          response = flaggedLabs.length > 0
            ? `Diagnostic review indicates ${flaggedLabs.length} clinical flags. The most critical is ${flaggedLabs[0].label} (${flaggedLabs[0].value}), which remains ${flaggedLabs[0].status.toLowerCase()} as of the last visit.`
            : `Clinical diagnostics are clear. All recent laboratory markers are within their respective target therapeutic windows.`;
        } else if (lower.includes('visit') || lower.includes('history') || lower.includes('appointment')) {
          response = `Patient longitudinal history spans ${totalVisits} clinical encounters, with a primary diagnostic focus on ${leadSpecialty?.[0] || 'General Practice'}. History shows a ${flaggedLabs.length > 0 ? 'complex' : 'stable'} clinical trajectory.`;
        } else if (lower.includes('name')) {
          response = `I am the Meiosis Clinical Assistant, your secure interface for real-time patient data synthesis and longitudinal analysis.`;
        } else if (lower.includes('hello') || lower.includes('hi')) {
          response = `Hello Dr. Aditya. Systemic context for this patient is loaded. How can I assist with your clinical assessment today?`;
        } else {
          response = `Based on current systemic synthesis, the patient is maintaining a ${flaggedLabs.length > 0 ? 'guarded' : 'stable'} baseline. Would you like a detailed breakdown of their active medications or recent diagnostic flags?`;
        }

        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'ai', text: response };
          return copy;
        });
      }, 1200);
    }, 100);
  };

  const titleClr = darkMode ? 'var(--doctor-text, #f8fafc)' : '#0f172a';
  const muted = darkMode ? 'var(--doctor-muted, #8ca1b4)' : '#64748b';
  const accent = darkMode ? 'var(--doctor-accent, #52ff9d)' : '#0f766e';
  const cardBg = darkMode ? 'rgba(11, 22, 36, 0.98)' : 'rgba(255, 255, 255, 0.99)';
  const border = darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)';

  const specialtyCounts = data.reduce<Record<string, number>>((acc, apt) => {
    acc[apt.specialty] = (acc[apt.specialty] ?? 0) + 1;
    return acc;
  }, {});
  const sortedSpecialties = Object.entries(specialtyCounts).sort((a, b) => b[1] - a[1]);
  const prescriptionCount = data.reduce((sum, apt) => sum + apt.prescriptions.length, 0);
  const medicationCount = data.reduce((sum, apt) => sum + apt.medications.length, 0);
  const totalLabs = data.reduce((sum, apt) => sum + apt.labs.length, 0);

  // Simulated AI Engine for Insights (Dynamic Narrative)
  const aiInsights = useMemo(() => {
    // 1. Past Severe Reports
    const severeReports = data.filter(d => 
      d.severity === 'high' || 
      d.severity === 'critical' || 
      (d.type && d.type.toLowerCase().includes('emergency')) ||
      (d.notes && d.notes.toLowerCase().includes('severe'))
    );
    
    // 2. Active Medications
    const allMeds = data.flatMap(d => d.prescriptions || []);
    // Ensure we only count unique active meds by ID or name to prevent duplicates if data is messy
    const uniqueActiveMedsMap = new Map();
    allMeds.filter(p => p.isActive).forEach(p => {
        if (!uniqueActiveMedsMap.has(p.name)) {
            uniqueActiveMedsMap.set(p.name, p);
        }
    });
    const activeMeds = Array.from(uniqueActiveMedsMap.values());

    // 3. Labs
    const allLabs = data.flatMap(d => d.labs || []);
    const latestLabs = allLabs.slice(0, 3);
    const oldLabs = allLabs.slice(3, 8);

    // 4. Clinical Context
    const clinicalContext = data.slice(0, 5).map(d => ({
      date: d.date,
      type: d.type,
      specialty: d.specialty
    }));

    // 5. Generate story text
    let story = "";
    if (activeMeds.length > 0) {
      story += `The patient is currently maintained on an ongoing pharmacological regimen with ${activeMeds.length} active medication${activeMeds.length > 1 ? 's' : ''}, ensuring therapeutic continuity. `;
    } else {
      story += `Clinical review shows no pharmacological regimens currently active or ongoing for this patient. `;
    }

    if (severeReports.length > 0) {
      story += `Crucially, there is a history of severe clinical events, with the most recent occurring on ${severeReports[0].date}. This warrants elevated monitoring. `;
    } else {
      story += `The clinical history appears stable with no recent severe exacerbations recorded. `;
    }

    if (latestLabs.length > 0) {
      story += `Recent diagnostics show ${latestLabs[0].label} is currently ${latestLabs[0].value}, providing key context for their current baseline. `;
    }

    story += `Overall, the trajectory is ${severeReports.length > 0 ? 'complex' : 'stable'} with primary care concentrated in ${leadSpecialty ? leadSpecialty[0] : 'General Practice'}.`;

    // 6. Real Chronological Timeline Data
    const sortedTimeline = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const minTime = sortedTimeline.length > 0 ? new Date(sortedTimeline[0].date).getTime() : 0;
    const maxTime = sortedTimeline.length > 0 ? new Date(sortedTimeline[sortedTimeline.length - 1].date).getTime() : 1;
    const range = maxTime - minTime || 1;

    const timelinePoints = sortedTimeline.map((d, i) => {
      const x = ((new Date(d.date).getTime() - minTime) / range) * 100;
      // Organic Y-axis based on clinical intensity (meds + labs + severity)
      const intensity = (d.prescriptions?.length || 0) + (d.labs?.length || 0) + (d.severity === 'high' ? 5 : d.severity === 'critical' ? 8 : 2);
      const y = 85 - Math.min(70, intensity * 5); 
      
      return { x, y, data: d };
    });

    return {
      severeReports,
      activeMeds,
      latestLabs,
      oldLabs,
      clinicalContext,
      story,
      timelinePoints
    };
  }, [data, leadSpecialty]);

  const graphPath = useMemo(() => {
    if (!aiInsights.timelinePoints || aiInsights.timelinePoints.length < 2) return "";
    const pts = aiInsights.timelinePoints;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i+1];
      const cx = (curr.x + next.x) / 2;
      d += ` C ${cx} ${curr.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  }, [aiInsights.timelinePoints]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        padding: '24px',
      }}
    >
      <motion.div
        layoutId={mode === 'overview' ? 'overview-intelligence-panel' : 'ai-intelligence-panel'}
        style={{
          width: 'min(1540px, 96vw)',
          height: 'min(880px, 92vh)',
          background: cardBg,
          border: border,
          borderRadius: 32,
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 60px 150px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button (Top Right Corner of Card) */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, rotate: 90, background: accent, boxShadow: `0 0 20px ${accent}88` }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: accent,
            border: 'none',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10001,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <X size={18} strokeWidth={3} />
        </motion.button>
 
        {/* iOS-style Floating Segmented Toggle (Centered relative to the entire card) */}
        <div style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          padding: 4,
          background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
          borderRadius: 999,
          backdropFilter: 'blur(16px)',
          border: border,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', position: 'relative' }}>
            {/* Sliding Background Pill */}
            <motion.div
              layoutId="toggle-pill"
              animate={{ x: mode === 'overview' ? 0 : 150 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 150,
                height: '100%',
                background: accent,
                borderRadius: 999,
                zIndex: 0,
                boxShadow: `0 0 15px ${accent}44`,
              }}
            />
            
            <button
              onClick={() => setMode('overview')}
              style={{
                width: 150,
                padding: '10px 0',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: mode === 'overview' ? '#000' : muted,
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                zIndex: 1,
                transition: 'color 0.2s',
                position: 'relative',
              }}
            >
              CLINICAL OVERVIEW
            </button>
            
            <button
              onClick={() => setMode('ai')}
              style={{
                width: 150,
                padding: '10px 0',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: mode === 'ai' ? '#000' : muted,
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                zIndex: 1,
                transition: 'color 0.2s',
                position: 'relative',
              }}
            >
              AI ANALYSIS
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          {/* Removed local close button - now using global floating close */}

          {/* Sliding Container */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
             <motion.div
                animate={{ y: mode === 'overview' ? '0%' : '-100%' }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                style={{ height: '100%', width: '100%', overflow: 'visible' }}
             >
                {/* SLIDE 1: OVERVIEW */}
                <div className="intelligence-slide scroll-skin" style={{ height: '100%', width: '100%', overflowY: 'auto', padding: '48px 40px 120px' }}>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 48 }}>
                      {[
                        { 
                           label: 'Medical Status', 
                           value: !admissionRecord ? 'Normal' : (admissionRecord.type === 'observation' ? 'Observation' : 'Hospitalised'),
                           icon: <Activity size={22} />,
                           color: !admissionRecord ? '#22C55E' : (admissionRecord.type === 'observation' ? '#F97316' : '#EF4444')
                        },
                        { label: 'Total Visits', value: totalVisits, icon: <History size={22} /> },
                        { label: 'Specialties', value: sortedSpecialties.length, icon: <Stethoscope size={22} /> },
                        { label: 'Flagged Labs', value: flaggedLabs.length, icon: <ShieldAlert size={22} /> },
                        { label: 'Prescriptions', value: prescriptionCount + medicationCount, icon: <Pill size={22} /> },
                      ].map(stat => (
                        <div key={stat.label} style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 28, padding: '32px 16px', border: border, transition: 'transform 0.2s' }}>
                          <div style={{ color: (stat as any).color || accent, marginBottom: 20 }}>{stat.icon}</div>
                          <div style={{ fontSize: String(stat.value || '').length > 8 ? 20 : 28, fontWeight: 800, color: (stat as any).color || titleClr, lineHeight: 1.2 }}>{stat.value}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 10 }}>{stat.label}</div>
                        </div>
                      ))}
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                      <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderRadius: 32, padding: '32px', border: border }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                            <Activity size={20} color={accent} />
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Care Distribution</h3>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {sortedSpecialties.slice(0, 5).map(([spec, count]) => (
                              <div key={spec}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 10 }}>
                                    <span style={{ color: titleClr, fontWeight: 700 }}>{spec}</span>
                                    <span style={{ color: muted, fontWeight: 600 }}>{count} visits · {Math.round((count/totalVisits)*100)}%</span>
                                 </div>
                                 <div style={{ height: 8, background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count/totalVisits)*100}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} style={{ height: '100%', background: getAccent(spec) }} />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderRadius: 32, padding: '32px', border: border }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                            <Microscope size={20} color={accent} />
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Laboratory Dynamics</h3>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                               <div style={{ padding: '24px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#fff', borderRadius: 24, border: border }}>
                                  <div style={{ fontSize: 32, fontWeight: 800, color: titleClr }}>{totalLabs}</div>
                                  <div style={{ fontSize: 12, color: muted, fontWeight: 700, textTransform: 'uppercase' }}>Total Diagnostics</div>
                               </div>
                               <div style={{ padding: '24px', background: darkMode ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)', borderRadius: 24, border: '1px solid rgba(239,68,68,0.15)' }}>
                                  <div style={{ fontSize: 32, fontWeight: 800, color: '#EF4444' }}>{flaggedLabs.length}</div>
                                  <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 700, textTransform: 'uppercase' }}>Clinical Flags</div>
                               </div>
                            </div>
                            <div style={{ marginTop: 12, padding: '20px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 20 }}>
                               <p style={{ fontSize: 14, lineHeight: 1.7, color: muted, margin: 0 }}>
                                  Longitudinal review of {totalLabs} markers shows {flaggedLabs.length > 0 ? `active instability in ${flaggedLabs.length} areas.` : 'optimal systemic performance across all measured categories.'}
                               </p>
                            </div>
                         </div>
                      </div>

                      {/* NEW: Systemic Footprint (Ring Graph) */}
                      <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderRadius: 32, padding: '32px', border: border, display: 'flex', flexDirection: 'column' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                            <HeartPulse size={20} color={accent} />
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Systemic Footprint</h3>
                         </div>
                         <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            {(() => {
                               const total = totalVisits + totalLabs + prescriptionCount + medicationCount;
                               if (total === 0) return <div style={{ color: muted }}>No Data</div>;
                               
                               const visitPct = (totalVisits / total) * 100;
                               const labPct = (totalLabs / total) * 100;
                               const rxPct = ((prescriptionCount + medicationCount) / total) * 100;

                               const radius = 60;
                               const circumference = 2 * Math.PI * radius;
                               const visitDash = (visitPct / 100) * circumference;
                               const labDash = (labPct / 100) * circumference;
                               const rxDash = (rxPct / 100) * circumference;

                               return (
                                 <div style={{ position: 'relative', width: 160, height: 160 }}>
                                   <svg width="160" height="160" viewBox="-80 -80 160 160" style={{ transform: 'rotate(-90deg)' }}>
                                      <circle r={radius} cx="0" cy="0" fill="transparent" stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth="16" />
                                      {/* Visits (Accent) */}
                                      <motion.circle r={radius} cx="0" cy="0" fill="transparent" stroke={accent} strokeWidth="16" strokeDasharray={`${visitDash} ${circumference}`} strokeLinecap="round" initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1, delay: 0.2 }} />
                                      {/* Labs (Purple) */}
                                      <motion.circle r={radius} cx="0" cy="0" fill="transparent" stroke="#A855F7" strokeWidth="16" strokeDasharray={`${labDash} ${circumference}`} strokeDashoffset={-visitDash} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} />
                                      {/* Prescriptions (Orange) */}
                                      <motion.circle r={radius} cx="0" cy="0" fill="transparent" stroke="#F97316" strokeWidth="16" strokeDasharray={`${rxDash} ${circumference}`} strokeDashoffset={-(visitDash + labDash)} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.4 }} />
                                   </svg>
                                   <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontSize: 32, fontWeight: 900, color: titleClr }}>{total}</span>
                                      <span style={{ fontSize: 10, fontWeight: 800, color: muted, letterSpacing: '0.1em' }}>TOTAL</span>
                                   </div>
                                 </div>
                               );
                            })()}
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                               <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
                               <span style={{ fontSize: 11, color: muted, fontWeight: 700 }}>VISITS</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                               <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A855F7' }} />
                               <span style={{ fontSize: 11, color: muted, fontWeight: 700 }}>LABS</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                               <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316' }} />
                               <span style={{ fontSize: 11, color: muted, fontWeight: 700 }}>MEDS</span>
                            </div>
                         </div>
                      </div>
                   </div>
                    {/* Section 4: Health Graph - INTERACTIVE TIMELINE */}
                    {aiInsights.timelinePoints && aiInsights.timelinePoints.length > 0 && (
                      <div style={{ marginTop: 32, background: darkMode ? 'rgba(3, 21, 37, 0.5)' : 'rgba(255,255,255,0.6)', borderRadius: 32, padding: '24px', border: border, position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                                   <Activity size={20} />
                                </div>
                                <div>
                                   <h3 style={{ fontSize: 16, fontWeight: 900, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Longitudinal Patient Trajectory</h3>
                                   <div style={{ fontSize: 12, color: muted, fontWeight: 700, marginTop: 2 }}>REAL-TIME CHRONOLOGICAL EMR MAPPING</div>
                                </div>
                             </div>
                             <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                   <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, boxShadow: `0 0 10px ${accent}` }} />
                                   <span style={{ fontSize: 11, color: muted, fontWeight: 800 }}>SYSTEMIC INTENSITY</span>
                                </div>
                             </div>
                          </div>

                          <div style={{ height: 220, position: 'relative', width: '100%', padding: '0 20px' }}>
                              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                  <defs>
                                      <linearGradient id="lineGradient2" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
                                          <stop offset="100%" stopColor={accent} stopOpacity="0" />
                                      </linearGradient>
                                  </defs>
                                  
                                  {/* Grid Lines */}
                                  {[0, 25, 50, 75, 100].map(v => (
                                    <line key={v} x1="0" y1={v} x2="100" y2={v} stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} strokeWidth="0.5" />
                                  ))}

                                  {/* Area Fill */}
                                  <motion.path
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 1.5 }}
                                    d={`${graphPath} L 100 100 L 0 100 Z`}
                                    fill="url(#lineGradient2)"
                                  />

                                  {/* Main Line */}
                                  <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2.5, ease: "easeInOut" }}
                                    d={graphPath}
                                    fill="none"
                                    stroke={accent}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ filter: `drop-shadow(0 0 8px ${accent}44)` }}
                                  />

                                  {/* Data Points extracted to HTML for perfect circles */}
                              </svg>

                              {aiInsights.timelinePoints.map((pt, i) => (
                                <div key={i} style={{ position: 'absolute', left: `${pt.x}%`, top: `${pt.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: hoveredEMR === pt.data ? 1.5 : 1 }}
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      background: hoveredEMR === pt.data ? accent : cardBg,
                                      border: `2px solid ${accent}`,
                                      cursor: 'pointer',
                                      boxShadow: hoveredEMR === pt.data ? `0 0 12px ${accent}` : 'none'
                                    }}
                                    onMouseEnter={() => setHoveredEMR(pt.data)}
                                    onMouseLeave={() => setHoveredEMR(null)}
                                  />
                                  {hoveredEMR === pt.data && (
                                    <motion.div
                                      initial={{ scale: 1, opacity: 0.5 }}
                                      animate={{ scale: 2.5, opacity: 0 }}
                                      transition={{ repeat: Infinity, duration: 1.5 }}
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        background: accent,
                                        pointerEvents: 'none'
                                      }}
                                    />
                                  )}
                                </div>
                              ))}

                              {/* Interactive Tooltip */}
                              <AnimatePresence>
                                {hoveredEMR && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    style={{
                                      position: 'absolute',
                                      left: '50%',
                                      top: -60,
                                      transform: 'translateX(-50%)',
                                      background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                      backdropFilter: 'blur(12px)',
                                      padding: '12px 20px',
                                      borderRadius: 16,
                                      border: `1px solid ${accent}44`,
                                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                      zIndex: 100,
                                      minWidth: 240,
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                      <span style={{ fontSize: 13, fontWeight: 900, color: accent, textTransform: 'uppercase' }}>{hoveredEMR.type || 'Clinical Visit'}</span>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>{hoveredEMR.date}</span>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: titleClr, marginBottom: 4 }}>{hoveredEMR.specialty}</div>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 8, borderTop: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)' }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: muted }}>
                                        <span style={{ color: titleClr }}>{hoveredEMR.prescriptions?.length || 0}</span> MEDS
                                      </div>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: muted }}>
                                        <span style={{ color: titleClr }}>{hoveredEMR.labs?.length || 0}</span> LABS
                                      </div>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: muted }}>
                                        SEVERITY: <span style={{ color: hoveredEMR.severity === 'normal' ? accent : '#EF4444' }}>{hoveredEMR.severity?.toUpperCase()}</span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                          </div>
                      </div>
                    )}
                   {/* Bottom Spacer for breathing room */}
                   <div style={{ height: 40 }} />
                </div>

                {/* SLIDE 2: AI ANALYSIS */}
                <div className="intelligence-slide scroll-skin" style={{ height: '100%', width: '100%', overflowY: 'auto', padding: '48px 40px 120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
                       <Sparkles size={20} color={accent} style={{ filter: `drop-shadow(0 0 8px ${accent}66)` }} />
                       <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: accent }}>
                         Meiosis Intelligence Report
                       </span>
                    </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
                      {/* Section 1: Severe Reports */}
                      {aiInsights.severeReports.length > 0 && (
                        <div style={{ background: darkMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.03)', borderRadius: 32, padding: '24px', border: `1px solid rgba(239, 68, 68, ${darkMode ? 0.2 : 0.15})` }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                              <ShieldAlert size={20} color="#EF4444" />
                              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Critical Clinical Alerts</h3>
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                             {aiInsights.severeReports.map((report, idx) => (
                               <div key={idx} style={{ padding: '16px 20px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#fff', borderRadius: 16, border: `1px solid rgba(239,68,68,0.1)` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: titleClr }}>{report.type}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: muted }}>{report.date}</span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: 13, color: muted, lineHeight: 1.5 }}>{report.notes || 'No detailed notes provided for this severe event.'}</p>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}

                      {/* Section 2: Active Regimen */}
                      {aiInsights.activeMeds.length > 0 && (
                        <div style={{ background: darkMode ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.02)', borderRadius: 32, padding: '24px', border: `1px solid rgba(16, 185, 129, ${darkMode ? 0.15 : 0.1})` }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                              <Pill size={20} color="#10B981" />
                              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Active Pharmacological Regimen</h3>
                           </div>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                             {aiInsights.activeMeds.map((med, idx) => (
                               <div key={idx} style={{ padding: '16px 20px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#fff', borderRadius: 16, border: `1px solid rgba(16,185,129,0.1)` }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                                    <span style={{ fontSize: 14, fontWeight: 800, color: titleClr }}>{med.name}</span>
                                  </div>
                                  <div style={{ fontSize: 12, color: muted, fontWeight: 600 }}>{med.dose} · {med.frequency}</div>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}

                      {/* Section 6: AI Synthesis Story - MOVED UP */}
                      <div style={{ background: darkMode ? 'rgba(3, 21, 37, 0.7)' : 'rgba(240, 249, 255, 0.8)', borderRadius: 32, padding: '24px', border: `1px solid ${accent}40`, boxShadow: `0 20px 40px ${accent}15` }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <Sparkles size={24} color={accent} style={{ filter: `drop-shadow(0 0 10px ${accent})` }} />
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>AI Clinical Synthesis</h3>
                         </div>
                         <p style={{ fontSize: 16, lineHeight: 1.8, color: titleClr, margin: 0, fontWeight: 500 }}>
                            {aiInsights.story}
                         </p>
                      </div>

                      {/* Section 3: Diagnostics */}
                      {(aiInsights.latestLabs.length > 0 || aiInsights.oldLabs.length > 0) && (
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            {aiInsights.latestLabs.length > 0 && (
                              <div style={{ background: darkMode ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)', borderRadius: 32, padding: '24px', border: border }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <Microscope size={20} color={accent} />
                                    <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Latest Diagnostics</h3>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {aiInsights.latestLabs.map((lab, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: darkMode ? 'rgba(255,255,255,0.04)' : '#fff', borderRadius: 18, border: border }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: titleClr }}>{lab.label}</div>
                                            <div style={{ fontSize: 11, color: lab.status === 'PENDING' ? '#F59E0B' : muted, fontWeight: 700, marginTop: 2 }}>{lab.status}</div>
                                        </div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: titleClr }}>{lab.value}</div>
                                      </div>
                                    ))}
                                  </div>
                              </div>
                            )}

                            {aiInsights.oldLabs.length > 0 && (
                              <div style={{ background: darkMode ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)', borderRadius: 32, padding: '24px', border: border }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <History size={20} color={accent} />
                                    <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Historical Labs</h3>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {aiInsights.oldLabs.slice(0, 3).map((lab, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderRadius: 18, border: border }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: muted }}>{lab.label}</div>
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: muted }}>{lab.value}</div>
                                      </div>
                                    ))}
                                  </div>
                              </div>
                            )}
                         </div>
                )}

                      {/* Section 5: Clinical Context */}
                      {aiInsights.clinicalContext.length > 0 && (
                        <div style={{ background: darkMode ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)', borderRadius: 32, padding: '24px', border: border }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                              <Brain size={20} color={accent} />
                              <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Clinical Context Overview</h3>
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                             {aiInsights.clinicalContext.map((ctx, idx) => (
                               <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                  <div style={{ width: 12, height: 12, borderRadius: '50%', border: `3px solid ${accent}` }} />
                                  <div style={{ flex: 1, paddingBottom: idx !== aiInsights.clinicalContext.length - 1 ? 16 : 0, borderBottom: idx !== aiInsights.clinicalContext.length - 1 ? border : 'none' }}>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: titleClr }}>{ctx.type}</div>
                                    <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>{ctx.date} · {ctx.specialty}</div>
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}

                       {/* End of Insights */}

                   </div>
                </div>
             </motion.div>
          </div>
        </div>

        {/* AI Chat Sidebar (Conditionally Rendered) */}
        <AnimatePresence>
          {mode === 'ai' && (
             <motion.div 
               initial={{ width: 0, opacity: 0 }}
               animate={{ width: 480, opacity: 1 }}
               exit={{ width: 0, opacity: 0 }}
               transition={{ type: 'spring', stiffness: 200, damping: 25 }}
               style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
             >
                <div style={{ 
                  margin: '24px 24px 24px 12px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: border,
                  borderRadius: 32,
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                }}>
                   <div style={{ position: 'relative', width: 444, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ margin: '24px 24px 0 24px', padding: '16px 24px', borderRadius: 99, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)', border: border, backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Sparkles size={22} color={accent} style={{ filter: `drop-shadow(0 0 8px ${accent}66)` }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: titleClr, letterSpacing: '-0.01em' }}>AI Clinical Assistant</div>
                          <div style={{ fontSize: 10, color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Secure Clinical Context · Active</div>
                        </div>
                    </div>
</div>
                        <div 
                    className="scroll-skin" 
                    onScroll={handleChatScroll}
                    style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 140px 32px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}
                  >
                    {messages.map((msg, i) => (
                      <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                        <div style={{ 
                            padding: '16px 22px', 
                            borderRadius: msg.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                            background: msg.role === 'user' ? accent : (darkMode ? 'rgba(255,255,255,0.08)' : '#fff'),
                            color: msg.role === 'user' ? '#000' : titleClr,
                            border: msg.role === 'user' ? 'none' : border,
                            fontSize: 15,
                            lineHeight: 1.6,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            fontWeight: msg.role === 'user' ? 700 : 500,
                        }}>
                            {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} style={{ float: 'left', clear: 'both' }} />
                  </div>

                  <AnimatePresence>
                    {showScrollToBottom && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        style={{
                          position: 'absolute',
                          bottom: 100,
                          right: 32,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: darkMode ? 'rgba(255,255,255,0.1)' : '#fff',
                          border: border,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          zIndex: 10,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={titleClr} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <div style={{ position: 'absolute', bottom: 32, left: 32, right: 32 }}>
                    <div style={{ position: 'relative' }}>
                        <input 
                          ref={inputRef}
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          placeholder="Ask about patient history..."
                          style={{
                              width: '100%',
                              background: darkMode ? 'rgba(13, 21, 32, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                              border: border,
                              borderRadius: 99,
                              padding: '18px 60px 18px 28px',
                              fontSize: 15,
                              color: titleClr,
                              outline: 'none',
                              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                          }}
                        />
                        <button 
                          onClick={handleSend}
                          style={{ 
                              position: 'absolute', 
                              right: 8, 
                              top: 8, 
                              width: 40, 
                              height: 40, 
                              borderRadius: '50%', 
                              background: 'rgba(255, 255, 255, 0.08)', 
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: border, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${accent}88)` }}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                        </button>
                   </div>
                </div>
</div>
               </div>
              </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          .scroll-skin::-webkit-scrollbar {
            width: 6px;
          }
          .scroll-skin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scroll-skin::-webkit-scrollbar-thumb {
            background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
            border-radius: 10px;
          }
          .scroll-skin::-webkit-scrollbar-thumb:hover {
            background: ${accent};
          }
          .intelligence-slide {
            flex-shrink: 0;
            scrollbar-gutter: stable;
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}


function VisitHistoryDrawer({
  data,
  darkMode,
  onSelect,
  onClose,
  motion,
}: {
  data: AppointmentEntry[];
  darkMode?: boolean;
  onSelect: (apt: AppointmentEntry) => void;
  onClose: () => void;
  motion?: { dx: number; dy: number };
}) {
  const panelBg = darkMode
    ? 'linear-gradient(180deg, color-mix(in srgb, var(--doctor-card-tint) 96%, rgba(7,12,20,0.18)) 0%, color-mix(in srgb, var(--doctor-card-tint) 90%, transparent) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(241,245,249,0.92) 100%)';
  const border = darkMode
    ? '1px solid color-mix(in srgb, var(--doctor-accent-secondary) 14%, var(--doctor-border) 86%)'
    : '1px solid rgba(148,163,184,0.22)';
  const text = darkMode ? 'var(--doctor-text)' : '#0f172a';
  const muted = darkMode ? 'var(--doctor-muted)' : '#64748b';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        padding: '48px 32px',
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        aria-label="Close history"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          border: 'none',
          background: darkMode ? 'rgba(3, 9, 18, 0.34)' : 'rgba(15, 23, 42, 0.14)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          cursor: 'pointer',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 'min(920px, calc(100vw - 96px))',
          maxWidth: 'calc(100vw - 96px)',
          maxHeight: 'min(82vh, calc(100vh - 96px))',
          background: panelBg,
          border: border,
          borderRadius: 30,
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow: darkMode
            ? '0 34px 110px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 32px 80px rgba(37,67,112,0.20), inset 0 1px 0 rgba(255,255,255,0.65)',
          padding: '22px 22px 20px',
          overflow: 'hidden',
          ['--history-start-x' as string]: `${motion?.dx ?? 0}px`,
          ['--history-start-y' as string]: `${motion?.dy ?? -120}px`,
          transform: 'translate3d(-50%, -50%, 0)',
          animation: 'historyGenieIn 560ms cubic-bezier(0.19, 0.88, 0.22, 1) forwards',
          willChange: 'transform, opacity, filter',
          backfaceVisibility: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 1,
            borderRadius: 29,
            background: darkMode
              ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 18%, rgba(255,255,255,0.01) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.08) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: darkMode ? 'var(--doctor-accent)' : '#0f766e', marginBottom: 6 }}>
              Visit History
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: text, letterSpacing: '-0.02em' }}>Timeline Archive</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: border,
              background: darkMode ? 'color-mix(in srgb, var(--doctor-card-tint) 92%, transparent)' : 'rgba(255,255,255,0.82)',
              color: text,
              width: 38,
              height: 38,
              borderRadius: 14,
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
            maxHeight: 'calc(min(82vh, calc(100vh - 96px)) - 112px)',
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {data.map((apt, i) => {
            const clr = getAccent(apt.specialty);
            const isLast = i === data.length - 1;
            return (
              <div key={apt.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: clr, border: darkMode ? '2px solid rgba(255,255,255,0.14)' : '2px solid rgba(226,232,240,0.9)' }} />
                  {!isLast && <div style={{ width: 1.5, flexGrow: 1, minHeight: 42, background: darkMode ? 'var(--doctor-border)' : 'rgba(203,213,225,0.9)', marginTop: 6 }} />}
                </div>
                <div
                  onClick={() => { onSelect(apt); onClose(); }}
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    background: darkMode ? 'color-mix(in srgb, var(--doctor-card-tint) 90%, rgba(255,255,255,0.035))' : 'rgba(255,255,255,0.82)',
                    border: darkMode ? '1px solid var(--doctor-border)' : '1px solid rgba(148,163,184,0.18)',
                    borderRadius: 18,
                    padding: '14px 15px',
                    minHeight: 108,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: clr, marginBottom: 7 }}>
                    {apt.specialty}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: text, lineHeight: 1.35 }}>Consultation, {apt.date}</div>
                  <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>{apt.date} · {apt.doctor}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -- SimpleListView -----------------------------------------------
const TIMING_SLOTS_SL = ['Breakfast', 'Lunch', 'Dinner', 'Night'] as const;
function slPatternLabel(code: string | undefined): string {
  if (!code || !/^[01]{4}$/.test(code)) return code || '—';
  const slots = code.split('').map((b, i) => b === '1' ? TIMING_SLOTS_SL[i] : null).filter(Boolean);
  return slots.length ? (slots as string[]).join(' + ') : '—';
}
function slFmtDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SimpleListView({
  aptData,
  chromeDarkMode,
  onSelect,
  accessLevel,
}: {
  aptData: AppointmentEntry[];
  chromeDarkMode: boolean;
  onSelect: (apt: AppointmentEntry) => void;
  accessLevel?: 'full' | 'lab' | 'summary' | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(() => aptData[0]?.id ?? null);
  const [sort, setSort]   = useState<'recent' | 'oldest'>('recent');
  const [filter, setFilter] = useState<'all' | 'visits' | 'labs'>('all');

  const sorted = useMemo(() => {
    return [...aptData].sort((a, b) => {
      const dateA = new Date(a.startDate || a.date).getTime();
      const dateB = new Date(b.startDate || b.date).getTime();
      return sort === 'recent' ? dateB - dateA : dateA - dateB;
    });
  }, [aptData, sort]);

  const filtered = sorted.filter(apt => {
    if (filter === 'visits') return (apt.prescriptions?.length ?? 0) > 0;
    if (filter === 'labs')   return (apt.labs?.length ?? 0) > 0;
    return true;
  });

  // ── Theme tokens using doctor dashboard CSS variables ──────────────
  // ── Theme tokens using doctor dashboard CSS variables ──────────────
  const text        = chromeDarkMode ? 'var(--doctor-text, #f8fafc)'           : '#0f172a';
  const muted       = chromeDarkMode ? 'var(--doctor-muted, #8ca1b4)'          : '#64748b';
  const sectionLbl  = chromeDarkMode ? 'rgba(140,161,180,0.85)'                : '#64748b';
  const neon        = chromeDarkMode ? 'var(--doctor-accent, #52ff9d)'         : '#0d9488';
  const neonBg      = chromeDarkMode ? 'rgba(82,255,157,0.12)'                 : 'rgba(13,148,136,0.1)';
  const neonBdr     = chromeDarkMode ? 'rgba(82,255,157,0.32)'                 : 'rgba(13,148,136,0.2)';
  const cardBg      = chromeDarkMode
    ? 'rgba(13, 25, 41, 0.72)'
    : 'rgba(255, 255, 255, 0.9)';
  const cardBdr     = chromeDarkMode ? 'rgba(255, 255, 255, 0.06)'             : 'rgba(0, 0, 0, 0.08)';
  const cardActiveBdr = chromeDarkMode
    ? 'rgba(82, 255, 157, 0.45)'
    : 'rgba(13, 148, 136, 0.4)';
  const divider     = chromeDarkMode ? 'rgba(255, 255, 255, 0.05)'             : 'rgba(0, 0, 0, 0.06)';
  const rowBg       = chromeDarkMode ? 'rgba(255, 255, 255, 0.03)'             : 'rgba(0, 0, 0, 0.02)';
  const rowBdr      = chromeDarkMode ? 'rgba(255, 255, 255, 0.05)'             : 'rgba(0, 0, 0, 0.04)';
  
  // Refined control styles
  const ctrlBg      = chromeDarkMode ? 'rgba(15, 23, 42, 0.6)'                 : 'rgba(255, 255, 255, 0.7)';
  const ctrlBdr     = chromeDarkMode ? 'rgba(255, 255, 255, 0.08)'             : 'rgba(0, 0, 0, 0.1)';
  const ctrlActBg   = chromeDarkMode ? 'var(--doctor-accent, #52ff9d)'         : '#0f172a';
  const ctrlActClr  = chromeDarkMode ? '#06111d'                              : '#ffffff';

  return (
    <div style={{ padding: '0 0 100px', maxWidth: 840, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

      {/* ── Sticky toolbar (Pill Redesign) ─────────────────────────── */}
      <div style={{
        position: 'sticky', top: 12, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: '10px 24px',
        margin: '0 24px 24px',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderRadius: 100,
        border: `1px solid ${divider}`,
        background: chromeDarkMode ? 'rgba(13, 25, 41, 0.65)' : 'rgba(255, 255, 255, 0.7)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Sort toggle */}
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 100, background: chromeDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
          {(['recent', 'oldest'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)} style={{
              padding: '8px 20px', fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none',
              borderRadius: 100,
              background: sort === s ? ctrlActBg : 'transparent',
              color:      sort === s ? ctrlActClr : muted,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '0.03em',
              textTransform: 'uppercase'
            }}>
              {s === 'recent' ? 'Newest' : 'Oldest'}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: divider }} />

        {/* Type filter */}
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 100, background: chromeDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
          {(['all', 'visits', 'labs'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 20px', fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none',
              borderRadius: 100,
              background: filter === f ? ctrlActBg : 'transparent',
              color:      filter === f ? ctrlActClr : muted,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              {f === 'all' ? 'All' : f === 'visits' ? 'Visits' : 'Labs'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: neon, boxShadow: `0 0 10px ${neon}` }} />
          <span style={{ fontSize: 10, color: sectionLbl, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {filtered.length} Records
          </span>
        </div>
      </div>

      {/* ── Vertical timeline entries ───────────────────────────────────── */}
      <div style={{ padding: '12px 20px 0', position: 'relative' }}>
        {filtered.map((apt, idx) => {
          const isExpanded  = expandedId === apt.id;
          const isLast      = idx === filtered.length - 1;
          const aptAccent   = getAccent(apt.specialty, apt.severity, (apt as any).isLab, (apt as any).isHPNote);
          const isActive    = (apt.status ?? '').toUpperCase() === 'ACTIVE';
          
          const hasLabs     = (apt.labs?.length ?? 0) > 0 && (accessLevel === 'full' || accessLevel === 'lab');
          const hasMeds     = (apt.prescriptions?.length ?? 0) > 0 && accessLevel === 'full';
          const hasNotes    = !!(apt.chiefComplaint || apt.notes || apt.plan) && accessLevel === 'full';
          const hasVitals   = !!(apt.vitals && Object.values(apt.vitals).some(v => !!v)) && (accessLevel === 'full' || accessLevel === 'summary');

          // Year separator
          const aptYear  = new Date(apt.startDate || apt.date).getFullYear();
          const prevYear = idx > 0 ? new Date(filtered[idx - 1].startDate || filtered[idx - 1].date).getFullYear() : null;
          const showYearSep = isNaN(aptYear) ? false : (idx === 0 || aptYear !== prevYear);

          return (
            <div key={apt.id}>
              {/* ── Year separator ── */}
              {showYearSep && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, marginTop: idx > 0 ? 32 : 0, paddingLeft: 112 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 900, letterSpacing: '0.1em',
                    color: chromeDarkMode ? 'var(--doctor-accent, #52ff9d)' : '#0f172a',
                    opacity: 0.9
                  }}>
                    {aptYear}
                  </span>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${divider}, transparent)` }} />
                </div>
              )}

              {/* ── Row: date column + dot + card ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 2 }}>

                {/* Date label */}
                <div style={{
                  width: 88, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                  paddingRight: 24, paddingTop: 14,
                  position: 'relative',
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 800, 
                      lineHeight: 1, 
                      color: isExpanded ? neon : text, 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isExpanded ? 'translateX(-2px)' : 'translateX(0)'
                    }}>
                      {(() => { const d = new Date(apt.startDate || apt.date); return isNaN(d.getTime()) ? apt.date.split(' ')[0] : d.toLocaleDateString('en-GB', { day: '2-digit' }); })()}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {(() => { const d = new Date(apt.startDate || apt.date); return isNaN(d.getTime()) ? apt.date.split(' ')[1] : d.toLocaleDateString('en-GB', { month: 'short' }); })()}
                    </div>
                  </div>
                  {/* Vertical connector rail */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute', right: 5, top: 48,
                      bottom: isExpanded ? -32 : -20,
                      width: 1,
                      background: chromeDarkMode
                        ? 'linear-gradient(180deg, rgba(82,255,157,0.3) 0%, rgba(82,255,157,0.05) 100%)'
                        : 'linear-gradient(180deg, rgba(13,148,136,0.3) 0%, rgba(13,148,136,0.05) 100%)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  )}
                </div>

                {/* Timeline dot */}
                <div style={{ width: 12, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 18, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: isExpanded ? 10 : 8,
                    height: isExpanded ? 10 : 8,
                    borderRadius: '50%',
                    background: isExpanded ? neon : 'transparent',
                    border: `2px solid ${isExpanded ? neon : (chromeDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')}`,
                    boxShadow: isExpanded ? `0 0 15px ${neon}` : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>

                {/* Card */}
                <div style={{ flex: 1, paddingLeft: 16, paddingBottom: 20, minWidth: 0 }}>
                  <div
                    onClick={() => { if (accessLevel) setExpandedId(isExpanded ? null : apt.id); }}
                    style={{
                      borderRadius: 20,
                      border: `1px solid ${isExpanded ? cardActiveBdr : cardBdr}`,
                      background: cardBg,
                      backdropFilter: 'blur(30px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                      cursor: accessLevel ? 'pointer' : 'default',
                      overflow: 'hidden',
                      boxShadow: isExpanded
                        ? chromeDarkMode
                          ? '0 20px 50px -12px rgba(0,0,0,0.6), 0 0 20px rgba(82,255,157,0.05)'
                          : '0 20px 40px -12px rgba(0,0,0,0.1)'
                        : 'none',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isExpanded ? 'scale(1.005)' : 'scale(1)',
                    }}
                  >
                    {/* Specialty indicator line */}
                    <div style={{ 
                      height: 3, 
                      background: aptAccent, 
                      width: isExpanded ? '100%' : '40px',
                      opacity: isExpanded ? 1 : 0.6, 
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: '0 0 2px 0'
                    }} />

                    {/* Header */}
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Status + Specialty row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: aptAccent, padding: '3px 8px', borderRadius: 6,
                            background: `${aptAccent}12`, border: `1px solid ${aptAccent}25`,
                          }}>
                            {accessLevel ? apt.specialty : 'Restricted'}
                          </span>
                          
                          {accessLevel && (
                            <span style={{
                              fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                              color: isActive ? neon : muted,
                              opacity: 0.8
                            }}>
                              {apt.status ?? 'Completed'}
                            </span>
                          )}
                        </div>

                        {/* Visit title */}
                        <div style={{ 
                          fontSize: 15, 
                          fontWeight: 700, 
                          color: text, 
                          lineHeight: 1.2, 
                          marginBottom: 4,
                          letterSpacing: '-0.01em'
                        }}>
                          {accessLevel ? `Consultation, ${apt.date}` : 'Restricted Encounter'}
                        </div>

                        {/* Doctor + Details preview */}
                        <div style={{ fontSize: 12, color: muted, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600 }}>{accessLevel ? apt.doctor : 'Medical Professional'}</span>
                          {accessLevel && (hasLabs || hasMeds) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.7 }}>
                              <span style={{ width: 3, height: 3, borderRadius: '50%', background: muted }} />
                              {hasMeds && <span>{apt.prescriptions.length} Meds</span>}
                              {hasLabs && <span>{apt.labs.length} Labs</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chevron */}
                      {accessLevel && (
                        <div style={{
                          flexShrink: 0, width: 32, height: 32,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 10,
                          background: isExpanded ? neonBg : (chromeDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                          color: isExpanded ? neon : muted,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}>
                          <ChevronDown size={18} strokeWidth={2.5}
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                      )}
                    </div>

                    {/* ── Expandable detail panel ─────────────────────────── */}
                    {accessLevel && (
                      <div style={{
                        maxHeight: isExpanded ? 2400 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}>
                        <div style={{ padding: '0 20px 24px' }}>
                          <div style={{ height: 1, background: divider, marginBottom: 20 }} />

                          {/* Vitals Grid */}
                          {hasVitals && (
                            <div style={{ marginBottom: 24 }}>
                              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: sectionLbl, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Activity size={12} strokeWidth={2.5} />
                                Vitals
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                                {([
                                  ['BP',   apt.vitals?.bloodPressure],
                                  ['HR',   apt.vitals?.pulse],
                                  ['Temp', apt.vitals?.temperature],
                                  ['SpO₂', apt.vitals?.spo2],
                                  ['Ht',   apt.vitals?.height],
                                  ['Wt',   apt.vitals?.weight],
                                ] as [string, string | undefined][]).filter(([, v]) => !!v).map(([label, value]) => (
                                  <div key={label} style={{ padding: '10px 12px', borderRadius: 12, background: rowBg, border: `1px solid ${rowBdr}`, transition: 'all 0.2s ease' }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, color: muted, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: text }}>{value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Clinical Narrative */}
                          {hasNotes && (
                            <div style={{ marginBottom: 24 }}>
                              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: sectionLbl, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Stethoscope size={12} strokeWidth={2.5} />
                                Clinical Narrative
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {apt.chiefComplaint && (
                                  <div style={{ padding: '12px 16px', borderRadius: 14, background: rowBg, border: `1px solid ${rowBdr}` }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, color: muted, textTransform: 'uppercase', marginBottom: 6 }}>Chief Complaint</div>
                                    <div style={{ fontSize: 14, color: text, lineHeight: 1.6, fontWeight: 500 }}>{apt.chiefComplaint}</div>
                                  </div>
                                )}
                                {apt.notes && (
                                  <div style={{ padding: '12px 16px', borderRadius: 14, background: rowBg, border: `1px solid ${rowBdr}` }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, color: muted, textTransform: 'uppercase', marginBottom: 6 }}>Clinical Findings</div>
                                    <div style={{ fontSize: 14, color: text, lineHeight: 1.6, fontWeight: 500 }}>{apt.notes}</div>
                                  </div>
                                )}
                                {apt.plan && apt.plan !== apt.notes && (
                                  <div style={{ padding: '12px 16px', borderRadius: 14, background: rowBg, border: `1px solid ${rowBdr}` }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, color: muted, textTransform: 'uppercase', marginBottom: 6 }}>Plan & Guidance</div>
                                    <div style={{ fontSize: 14, color: text, lineHeight: 1.6, fontWeight: 500 }}>{apt.plan}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Treatment Plan */}
                          {hasMeds && (
                            <div style={{ marginBottom: hasLabs ? 24 : 0 }}>
                              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: sectionLbl, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Pill size={12} strokeWidth={2.5} />
                                Prescriptions · {apt.prescriptions.length}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {apt.prescriptions.map(med => (
                                  <div key={med.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 16px', borderRadius: 14,
                                    background: rowBg, border: `1px solid ${rowBdr}`,
                                    opacity: med.isActive === false ? 0.6 : 1,
                                  }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 14, fontWeight: 700, color: med.isActive === false ? muted : text }}>
                                        {med.name}
                                        {med.dose && <span style={{ fontSize: 13, color: muted, marginLeft: 8, fontWeight: 500 }}>{med.dose}</span>}
                                      </div>
                                      {med.frequency && (
                                        <div style={{ fontSize: 12, color: muted, marginTop: 4, fontWeight: 500 }}>
                                          {/^[01]{4}$/.test(med.frequency) ? slPatternLabel(med.frequency) : med.frequency}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      {med.duration && (
                                        <div style={{ fontSize: 11, color: sectionLbl, fontWeight: 700, textTransform: 'uppercase' }}>{med.duration}</div>
                                      )}
                                      {med.isActive === false && (
                                        <span style={{ fontSize: 9, fontWeight: 900, background: 'rgba(156,163,175,0.1)', color: '#9CA3AF', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', marginTop: 4, display: 'inline-block' }}>Inactive</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Diagnostics */}
                          {hasLabs && (
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: sectionLbl, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Microscope size={12} strokeWidth={2.5} />
                                Diagnostic Orders · {apt.labs.length}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {apt.labs.map(lab => (
                                  <div key={lab.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 16px', borderRadius: 14,
                                    background: rowBg, border: `1px solid ${rowBdr}`,
                                  }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_CLR.lab, boxShadow: `0 0 8px ${SEVERITY_CLR.lab}44` }} />
                                    <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{lab.label}</div>
                                    <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase' }}>Pending</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {!hasVitals && !hasNotes && !hasMeds && !hasLabs && (
                            <div style={{ padding: '24px 0', textAlign: 'center' }}>
                              <div style={{ fontSize: 12, color: muted, fontWeight: 500, fontStyle: 'italic' }}>
                                No supplementary clinical data recorded for this encounter.
                              </div>
                            </div>
                          )}

                          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); onSelect(apt); }}
                              style={{
                                padding: '10px 20px', borderRadius: 12, border: `1px solid ${neon}`,
                                background: 'transparent', color: neon, fontSize: 11, fontWeight: 800,
                                textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.04em',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex', alignItems: 'center', gap: 8
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = neonBg; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                              View Full Details
                              <TrendingUp size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -- BottomZoomSlider --------------------------------------------
function BottomZoomSlider({ value, onChange, chromeDarkMode }: { value: number; onChange: (v: number) => void; chromeDarkMode: boolean }) {
  const MIN_Z = 0.8;
  const MAX_Z = 1.4;
  const [active, setActive] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setActive(true);
    if (!trackRef.current) return;
    
    // Make sure we have the initial clientX captured
    const handleMove = (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      let ratio = (clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      onChange(MIN_Z + ratio * (MAX_Z - MIN_Z));
    };

    handleMove(e.clientX);
    
    const onMove = (ev: PointerEvent) => handleMove(ev.clientX);
    const onUp = () => {
      setActive(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const percent = ((value - MIN_Z) / (MAX_Z - MIN_Z)) * 100;
  const accent = chromeDarkMode ? 'var(--doctor-accent, #52ff9d)' : '#10B981';

  return (
    <div 
      tabIndex={-1}
      style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        outline: 'none',
        background: chromeDarkMode ? 'rgba(13, 25, 41, 0.45)' : 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(32px) saturate(160%)',
        WebkitBackdropFilter: 'blur(32px) saturate(160%)',
        border: chromeDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: chromeDarkMode ? '0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 16px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.4)',
        borderRadius: 999,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformOrigin: 'bottom center',
        ...(active ? { transform: 'translateX(-50%) scale(1.02)' } : {})
      }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: chromeDarkMode ? '#8ca1b4' : '#64748b', letterSpacing: '0.04em', userSelect: 'none' }}>ZOOM</span>
      
      <div 
        ref={trackRef}
        onPointerDown={handlePointerDown}
        style={{
          width: 140,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <div style={{
          width: '100%',
          height: active ? 10 : 4,
          background: chromeDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          borderRadius: 999,
          position: 'absolute',
          transition: 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }} />
        
        <div style={{
          width: `${percent}%`,
          height: active ? 10 : 4,
          background: accent,
          borderRadius: 999,
          position: 'absolute',
          transition: active ? 'none' : 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          boxShadow: `0 0 12px ${accent}40`
        }} />
        
        <div style={{
          position: 'absolute',
          left: `${percent}%`,
          width: active ? 18 : 14,
          height: active ? 18 : 14,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transform: 'translateX(-50%)',
          transition: active ? 'none' : 'width 0.3s cubic-bezier(0.2,0.8,0.2,1), height 0.3s cubic-bezier(0.2,0.8,0.2,1)',
        }} />
      </div>

      <span style={{ fontSize: 13, fontWeight: 800, color: chromeDarkMode ? '#f8fafc' : '#0f172a', width: 44, textAlign: 'right', userSelect: 'none', fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
// Using shared AdmissionRecord and AdmissionCard from ../Shared/AdmissionStatus.tsx

// -- TimelineView -------------------------------------------------
export function TimelineView({
  patientId,
  darkMode = false,
  timelineTheme = 'default',
  timelineWarp = false,
  singularityModern = false,
  timelineLayout = 'advanced',
  timelineZoom = 1,
  setTimelineZoom,
  accessLevel,
  onBack,
  onBuildEMR,
  onSelectHP,
  prescriptionLayout = 'classic',
  patient = null,
}: {
  patientId?: string | null;
  darkMode?: boolean;
  timelineTheme?: TimelineTheme;
  timelineWarp?: boolean;
  singularityModern?: boolean;
  timelineLayout?: 'simple' | 'advanced';
  timelineZoom?: number;
  setTimelineZoom?: (zoom: number) => void;
  accessLevel?: 'full' | 'lab' | 'summary' | null;
  onBack?: () => void;
  onBuildEMR?: () => void;
  onSelectHP?: () => void;
  prescriptionLayout?: 'classic' | 'wide';
  patient?: Patient | null;
}) {
  const [forcedDarker, setForcedDarker] = useState(false);
  const [listMode, setListMode] = useState(() => timelineLayout === 'simple');
  const effectiveTheme: TimelineTheme = forcedDarker ? 'dashboard-dark' : timelineTheme;
  const effectiveDarkMode = forcedDarker ? true : darkMode;

  const [hiId,    setHiId]    = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [selApt,  setSelApt]  = useState<AppointmentEntry | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [showDocOverlay, setShowDocOverlay] = useState(false);


  // Read admission record for this patient from patient payload
  const [admissionRecord, setAdmissionRecord] = useState<AdmissionRecord | null>(null);
  useEffect(() => {
    if (!patient?.meiosisCode) { setAdmissionRecord(null); return; }
    
    // Read from the backend patient payload which now has these fields
    if (patient.medicalStatus && patient.medicalStatus !== 'normal') {
      setAdmissionRecord({
        type: patient.medicalStatus as 'observation' | 'hospitalisation',
        bed: patient.admissionBed || '—',
        ward: patient.admissionWard || '—',
        timestamp: patient.admissionTime || new Date().toISOString(),
        meiosisId: patient.meiosisCode
      });
    } else {
      setAdmissionRecord(null);
    }
  }, [patient]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If we are in an input field, don't trigger shortcuts
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'o') {
        setIsOverviewExpanded(true);
        setIsAiExpanded(false);
        e.preventDefault();
      } else if (e.key.toLowerCase() === 'i') {
        setIsAiExpanded(true);
        setIsOverviewExpanded(false);
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && !isAiExpanded && !isOverviewExpanded) {
        setIsAiExpanded(true);
        setIsOverviewExpanded(false);
        e.preventDefault();
      } else if (e.key === 'ArrowUp' && !isAiExpanded && !isOverviewExpanded) {
        setIsOverviewExpanded(true);
        setIsAiExpanded(false);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Dynamic data state
  const [aptData,  setAptData]  = useState<AppointmentEntry[]>([]);
  const [loading,  setLoading]  = useState(false);
  const aptDataRef = useRef<AppointmentEntry[]>([]);
  const ioObsRef   = useRef<IntersectionObserver | null>(null);

  const cardRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs      = useRef<(SVGCircleElement | null)[]>([]);
  const rowRefs      = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef   = useRef<HTMLDivElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const shellRef     = useRef<HTMLDivElement>(null);
  const serpPathRef  = useRef<SVGPathElement>(null);
  const serpAnimDone = useRef(false);

  const mergedAptData = useMemo(() => {
    if (!patient?.pastAppointments) return aptData;
    
    const existingIds = new Set(aptData.map(a => a.id));
    const newApts = patient.pastAppointments.filter(pa => !existingIds.has(pa.id)).map(pa => {
      let displayDate = 'Unknown Date';
      try {
        const d = new Date(pa.date);
        if (!isNaN(d.getTime())) {
          displayDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch {}

      return {
        id: pa.id,
        date: displayDate,
        type: pa.purpose || 'Consultation',
        specialty: pa.specialty || 'General Practice',
        doctor: pa.doctorName || 'Unknown',
        metrics: pa.isHPNote ? 'H&P' : 'Review',
        status: 'COMPLETED',
        startDate: pa.date,
        isHPNote: pa.isHPNote,
        hpNoteData: pa.hpNoteData,
        labs: [],
        prescriptions: [],
        medications: []
      } as any;
    });

    const combined = [...newApts, ...aptData];
    return combined.sort((a, b) => new Date(b.startDate || b.date).getTime() - new Date(a.startDate || a.date).getTime());
  }, [aptData, patient?.pastAppointments]);

  const filteredData = useMemo(() => {
    if (!accessLevel) return [];
    if (accessLevel === 'full') return mergedAptData;
    if (accessLevel === 'lab') return mergedAptData.filter(apt => apt.labs.length > 0);
    if (accessLevel === 'summary') return mergedAptData; // Show all visits but gate clinical details inside cards
    return [];
  }, [mergedAptData, accessLevel]);

  const handleAddNoteSubmit = async () => {
    if (!newNoteText.trim() || !patientId) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch(`${API_BASE}/hp-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          patientId,
          title: 'Clinical Note',
          noteData: { isSimpleNote: true, text: newNoteText.trim() }
        })
      });
      if (res.ok) {
        setNewNoteText('');
        setShowAddNoteModal(false);
        if (patientId) {
          loadData(patientId);
        }
      }
    } catch (err) {
      console.error('[EMR] Error saving note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const [serpPath,    setSerpPath]     = useState('');
  const [svgH,        setSvgH]         = useState(0);
  const [visibleRows, setVisibleRows]  = useState<Set<number>>(new Set());
  const [mobile,      setMobile]       = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [shellWidth,  setShellWidth]   = useState(0);
  const isBeigeTheme = effectiveTheme === 'beige-light';
  const isDashboardTheme = effectiveTheme === 'dashboard-dark';
  const chromeDarkMode = isDashboardTheme ? true : effectiveDarkMode;
  const timelineBg = isDashboardTheme
    ? 'linear-gradient(180deg, var(--doctor-bg-start, #06111d) 0%, var(--doctor-bg-end, #10263d) 100%)'
    : effectiveDarkMode
    ? '#091e38'
    : BG;
  const bgWaveStroke = effectiveDarkMode
    ? 'color-mix(in srgb, var(--doctor-muted, #8ca1b4) 42%, var(--doctor-bg-start, #031525) 58%)'
    : 'rgba(44, 62, 80, 0.22)';
  const bgWaveSoft = effectiveDarkMode
    ? 'color-mix(in srgb, var(--doctor-muted, #8ca1b4) 26%, transparent)'
    : 'rgba(44, 62, 80, 0.10)';
  const stackAnalysisPanel = shellWidth > 0 && shellWidth < 1180;
  const analysisRailWidth = stackAnalysisPanel
    ? shellWidth
    : Math.max(288, Math.min(348, shellWidth * 0.26 || 348));
  const zoomScale = Math.max(0.8, Math.min(1.4, timelineZoom));
  const rawTimelineViewportWidth = Math.max(0, shellWidth - (stackAnalysisPanel ? 0 : analysisRailWidth));
  const layoutViewportWidth = rawTimelineViewportWidth > 0
    ? rawTimelineViewportWidth * (zoomScale < 1 ? zoomScale : 1)
    : rawTimelineViewportWidth;
  const layoutScale = Math.max(0.82, Math.min(1.08, (layoutViewportWidth || 1120) / 1120));
  const visualScale = Math.max(0.72, Math.min(1.5, layoutScale * (zoomScale > 1 ? zoomScale : 1)));
  const timelineHorizontalPad = Math.max(10, Math.min(40, (layoutViewportWidth * 0.028 || 20) * Math.max(0.9, layoutScale)));
  const spineWidth = Math.round((layoutViewportWidth < 1040 ? 24 : 32) * Math.max(0.92, Math.min(1.12, visualScale)));
  const sideColumnInset = Math.round((layoutViewportWidth < 1120 ? 10 : 16) * Math.max(0.94, Math.min(1.14, visualScale)));
  const backdropLeftBleed = stackAnalysisPanel ? 0 : Math.max(analysisRailWidth + 48, shellWidth * 0.28 || 0);
  const compactTimeline = layoutViewportWidth > 0 && layoutViewportWidth < 980;
  const groupGap = Math.max(4, Math.round((compactTimeline ? 4 : 6) * Math.max(0.94, Math.min(1.14, visualScale))));
  const sideUsableWidth = Math.max(
    280,
    ((layoutViewportWidth || rawTimelineViewportWidth || shellWidth || 960) - timelineHorizontalPad * 2 - spineWidth) / 2 - sideColumnInset
  );
  const secondaryCardWidth = Math.round(
    Math.max(
      Math.round(112 * Math.max(0.82, visualScale)),
      Math.min(
        Math.round(228 * Math.max(0.88, Math.min(1.06, visualScale))),
        sideUsableWidth * (compactTimeline ? 0.34 : 0.39) * Math.max(0.96, visualScale),
      ),
    ),
  );
  const primaryCardWidth = Math.round(
    Math.max(
      Math.round(184 * Math.max(0.82, visualScale)),
      Math.min(
        Math.round(360 * Math.max(0.88, Math.min(1.06, visualScale))),
        (sideUsableWidth - secondaryCardWidth - groupGap) * Math.max(0.98, visualScale),
      ),
    ),
  );
  const headerTopPad = Math.max(44, Math.round(52 * zoomScale));
  const headerBottomPad = Math.max(16, Math.round(16 * zoomScale));
  const contentBottomPad = Math.max(120, Math.round(120 * zoomScale));
  const rowGap = Math.max(52, Math.round((mobile ? 56 : 92) * Math.max(0.94, Math.min(1.12, visualScale))));
  const rightColumnPadTop = Math.max(72, Math.round((mobile ? 76 : 144) * Math.max(0.94, Math.min(1.12, visualScale))));

  useEffect(() => {
    setListMode(timelineLayout === 'simple');
  }, [timelineLayout]);

  // -- Fetch data when patientId changes ------------------------
  const loadData = async (pid: string, cancelled = { current: false }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/emr?patientId=${encodeURIComponent(pid)}`, {
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (cancelled.current) return;
      const formatted = buildTimelineData(data);
      setAptData(formatted);
      if (formatted.length === 0) {
        console.warn("[Meiosis] Timeline fetched but returned no records for patient:", pid);
      }
    } catch (err) {
      console.error("[Meiosis] Failed to fetch timeline records:", err);
      if (!cancelled.current) setAptData([]);
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!patientId) {
      setAptData([]);
      setLoading(false);
      setSelApt(null);
      return;
    }

    const state = { current: false };
    setAptData([]);
    setSelApt(null);
    serpAnimDone.current = false;

    loadData(patientId, state);

    return () => { state.current = true; };
  }, [patientId]);

  function computeSerpentine() {
    const container = contentRef.current;
    if (!container) return;
    setSvgH(container.scrollHeight);
    const data = filteredData;

    const cR = container.getBoundingClientRect();
    function toSvg(el: Element) {
      const r = el.getBoundingClientRect();
      return { left: r.left - cR.left, top: r.top - cR.top, w: r.width, h: r.height };
    }

    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < data.length; i++) {
      const dotEl  = dotRefs.current[i];
      if (!dotEl) continue;
      const d = toSvg(dotEl);
      pts.push({ x: d.left + d.w / 2, y: d.top + d.h / 2 });
    }
    if (pts.length === 0) {
      setSerpPath('');
      return;
    }

    const baseX = pts.reduce((sum, point) => sum + point.x, 0) / pts.length;
    const topLead = Math.max(46, Math.min(128, (layoutViewportWidth * 0.09 || 72) * Math.max(0.92, zoomScale)));
    const bottomLead = Math.max(40, Math.min(118, (layoutViewportWidth * 0.08 || 64) * Math.max(0.92, zoomScale)));
    const entryLead = Math.max(18, 20 * zoomScale);
    let path = `M ${baseX},${Math.max(0, pts[0].y - topLead)} C ${baseX},${pts[0].y - topLead * 0.35} ${pts[0].x},${pts[0].y - entryLead} ${pts[0].x},${pts[0].y}`;

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const dy = curr.y - prev.y;
      const bend = Math.max(28, Math.min(104, (layoutViewportWidth * 0.055 || 52) * Math.max(0.92, zoomScale), Math.abs(dy) * 0.42));
      const nextOnRight = i % 2 === 1;
      const sign = nextOnRight ? 1 : -1;
      const c1x = prev.x + sign * bend;
      const c1y = prev.y + dy * 0.34;
      const c2x = curr.x + sign * bend;
      const c2y = curr.y - dy * 0.34;
      path += ` C ${c1x},${c1y} ${c2x},${c2y} ${curr.x},${curr.y}`;
    }

    const last = pts[pts.length - 1];
    path += ` C ${last.x},${last.y + bottomLead * 0.22} ${baseX},${last.y + bottomLead * 0.6} ${baseX},${last.y + bottomLead}`;
    setSerpPath(path);
  }

  // Serpentine draw-in (one-time per data load)
  useEffect(() => {
    if (!serpPath || serpAnimDone.current) return;
    const el = serpPathRef.current;
    if (!el) return;
    serpAnimDone.current = true;
    const len = el.getTotalLength();
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1) 0.5s';
      el.style.strokeDashoffset = '0';
    });
    const t = setTimeout(() => {
      el.style.transition = '';
      el.style.strokeDasharray = '';
      el.style.strokeDashoffset = '';
    }, 3200);
    return () => clearTimeout(t);
  }, [serpPath]);

  // -- Infrastructure: scroll handler + resize observer (mount once) --
  useEffect(() => {
    const resObs = new ResizeObserver(() => {
      if (shellRef.current) setShellWidth(shellRef.current.getBoundingClientRect().width);
      computeSerpentine();
    });
    if (contentRef.current) resObs.observe(contentRef.current);
    if (shellRef.current) {
      resObs.observe(shellRef.current);
      setShellWidth(shellRef.current.getBoundingClientRect().width);
    }

    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      resObs.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // -- Data-driven: re-setup IntersectionObserver when aptData changes --
  useEffect(() => {
    if (filteredData.length === 0) {
      setVisibleRows(new Set());
      setSerpPath('');
      ioObsRef.current?.disconnect();
      ioObsRef.current = null;
      return;
    }

    setVisibleRows(new Set());
    serpAnimDone.current = false;

    const rafId = requestAnimationFrame(() => {
      computeSerpentine();

      ioObsRef.current?.disconnect();
      const scrollEl = scrollRef.current;
      const ioObs = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const idx = Number((entry.target as HTMLElement).dataset.rowIdx);
              setVisibleRows(prev => { const n = new Set(prev); n.add(idx); return n; });
              ioObs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -50px 0px', root: scrollEl }
      );
      rowRefs.current.forEach(el => { if (el) ioObs.observe(el); });
      ioObsRef.current = ioObs;
    });

    return () => {
      cancelAnimationFrame(rafId);
      ioObsRef.current?.disconnect();
      ioObsRef.current = null;
    };
  }, [aptData]);

  useEffect(() => {
    if (listMode || filteredData.length === 0) return;
    const rafId = requestAnimationFrame(() => computeSerpentine());
    return () => cancelAnimationFrame(rafId);
  }, [timelineZoom, listMode, filteredData.length, shellWidth]);

  return (
    <div
      ref={shellRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: timelineBg,
        display: 'grid',
        gridTemplateColumns: stackAnalysisPanel ? 'minmax(0, 1fr)' : `${analysisRailWidth}px minmax(0, 1fr)`,
        gridTemplateRows: stackAnalysisPanel ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)',
      }}
    >
      {timelineWarp && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', opacity: 0.8 }}>
          <SpacetimeSingularity modern={singularityModern} />
        </div>
      )}
      <style>{`
        @keyframes pInL      { from{opacity:0;transform:translateX(-22px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes pInR      { from{opacity:0;transform:translateX(22px)  scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes sIn       { from{opacity:0;transform:translateY(10px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes connFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes emrWaveDrift { 0%{transform:translate3d(-4%,0,0)} 50%{transform:translate3d(4%,-2%,0)} 100%{transform:translate3d(-4%,0,0)} }
        @keyframes emrWaveDriftAlt { 0%{transform:translate3d(3%,0,0)} 50%{transform:translate3d(-3%,2%,0)} 100%{transform:translate3d(3%,0,0)} }
        @keyframes emrParticleFloat { 0%{transform:translate3d(0,0,0) scale(0.92); opacity:0.12} 50%{transform:translate3d(0,-12px,0) scale(1); opacity:0.22} 100%{transform:translate3d(0,0,0) scale(0.92); opacity:0.12} }
        @keyframes emrSpiralShift { 0%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(-1.2%,1%,0) scale(1.015)} 100%{transform:translate3d(0,0,0) scale(1)} }
        @keyframes emrCardDrift { 0%,100%{transform:translate3d(0,0,0)} 25%{transform:translate3d(0.8px,-1.2px,0)} 50%{transform:translate3d(-0.6px,-2px,0)} 75%{transform:translate3d(-1px,-0.8px,0)} }
        @keyframes emrDashFlow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -160; } }
        @keyframes emrCyanPulse {
          0%, 100% { opacity: 0.58; filter: drop-shadow(0 0 2px rgba(103,232,249,0.16)); }
          50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(103,232,249,0.34)); }
        }
        @keyframes historyGenieIn {
          0% {
            opacity: 0;
            transform: translate3d(calc(-50% + var(--history-start-x, 0px)), calc(-50% + var(--history-start-y, -120px)), 0) scale3d(0.14, 0.1, 1);
            filter: blur(10px);
          }
          18% {
            opacity: 0.92;
            transform: translate3d(calc(-50% + (var(--history-start-x, 0px) * 0.62)), calc(-50% + (var(--history-start-y, -120px) * 0.58)), 0) scale3d(0.34, 0.14, 1);
            filter: blur(6px);
          }
          42% {
          68% {
            opacity: 1;
            transform: translate3d(-50%, -50%, 0) scale3d(0.992, 1.018, 1);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translate3d(-50%, -50%, 0) scale3d(1, 1, 1);
            filter: blur(0);
          }
        }
      `}</style>

      {/* Global Timeline Background Layer */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: timelineWarp ? 0 : 0.98,
          transition: 'opacity 0.4s ease-in-out',
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 1200 900"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: chromeDarkMode ? 0.72 : 0.92,
            filter: `drop-shadow(0 0 18px ${bgWaveSoft})`,
            animation: 'emrSpiralShift 43s ease-in-out infinite',
            transformOrigin: '62% 34%',
            willChange: 'transform',
          }}
        >
          <path
            d="M 1080 84 C 912 110 828 190 826 278 C 824 358 914 408 992 394 C 1082 378 1108 284 1048 228 C 982 166 846 188 770 270 C 698 348 698 466 780 534 C 870 608 1014 584 1094 492"
            fill="none"
            stroke={bgWaveStroke}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
            strokeDasharray="6 14"
            style={{ animation: 'emrWaveDrift 36.7s ease-in-out infinite, emrDashFlow 30s linear infinite' }}
          />
          <path
            d="M 968 128 C 842 144 776 206 774 272 C 772 334 840 380 906 372 C 980 364 1004 298 958 252 C 906 200 798 214 738 284 C 676 356 674 450 742 510 C 816 574 932 560 1002 494"
            fill="none"
            stroke={bgWaveStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.58"
            strokeDasharray="4 12"
            style={{ animation: 'emrWaveDriftAlt 40s ease-in-out infinite, emrDashFlow 33.3s linear infinite reverse' }}
          />
          <path
            d="M 860 640 C 744 622 660 650 620 716 C 584 778 610 838 670 854 C 736 872 808 836 822 774 C 836 712 772 652 686 656 C 584 660 504 732 492 826"
            fill="none"
            stroke={bgWaveStroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.56"
            strokeDasharray="5 13"
            style={{ animation: 'emrWaveDrift 46.7s ease-in-out infinite reverse, emrDashFlow 40s linear infinite' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: '-8% -10%',
            background: 'radial-gradient(60% 40% at 30% 24%, rgba(82,255,157,0.06), transparent 70%), radial-gradient(52% 34% at 72% 58%, rgba(82,255,157,0.04), transparent 72%)',
            filter: 'blur(28px)',
            animation: 'emrWaveDrift 30s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '-6% -8%',
            background: 'radial-gradient(44% 18% at 46% 32%, rgba(82,255,157,0.05), transparent 74%), radial-gradient(40% 16% at 58% 74%, rgba(82,255,157,0.035), transparent 76%)',
            filter: 'blur(40px)',
            animation: 'emrWaveDriftAlt 36.7s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        {BG_PARTICLES.map((particle, index) => (
          <span
            key={`${particle.top}-${particle.left}-${index}`}
            style={{
              position: 'absolute',
              top: particle.top,
              left: particle.left,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              background: 'rgba(110, 231, 183, 0.22)',
              boxShadow: '0 0 10px rgba(82,255,157,0.08)',
              animation: `emrParticleFloat ${particle.duration} ease-in-out ${particle.delay} infinite`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* Top-right button cluster */}
      <div style={{ position: 'absolute', top: 18, right: 24, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        
        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={() => setForcedDarker(v => !v)}
          title={forcedDarker ? 'Switch to default theme' : 'Switch to darker theme'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            border: chromeDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.18)',
            background: forcedDarker
              ? 'color-mix(in srgb, var(--doctor-accent, #52ff9d) 12%, transparent)'
              : chromeDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
            color: forcedDarker
              ? 'var(--doctor-accent, #52ff9d)'
              : chromeDarkMode ? 'var(--doctor-text, #f8fafc)' : '#0f172a',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: chromeDarkMode ? '0 8px 32px rgba(0,0,0,0.2)' : '0 8px 24px rgba(0,0,0,0.04)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.background = chromeDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = forcedDarker
              ? 'color-mix(in srgb, var(--doctor-accent, #52ff9d) 12%, transparent)'
              : chromeDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)';
          }}
        >
          {forcedDarker ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* New "+" button */}
        <button
          type="button"
          onClick={() => setShowDocOverlay(true)}
          title="Create New Document"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            border: '1px solid var(--doctor-accent, #52ff9d)',
            background: 'var(--doctor-accent, #52ff9d)',
            color: '#06111d',
            borderRadius: 12,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(82,255,157,0.2)',
            transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 10px 28px rgba(82,255,157,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(82,255,157,0.2)';
          }}
        >
          <Plus size={20} strokeWidth={3} />
        </button>

        <button
          type="button"
          onClick={() => setShowAddNoteModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #fbbf24',
            background: '#fbbf24',
            color: '#06111d',
            borderRadius: 99,
            padding: '10px 22px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            boxShadow: '0 8px 32px rgba(251, 191, 36, 0.22), 0 0 15px rgba(251, 191, 36, 0.3)',
            transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(251, 191, 36, 0.35), 0 0 20px rgba(251, 191, 36, 0.4)';
            e.currentTarget.style.filter = 'brightness(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(251, 191, 36, 0.22), 0 0 15px rgba(251, 191, 36, 0.3)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          <StickyNote size={18} />
          <span>Add Note</span>
        </button>

        {onBuildEMR && (
          <button
            type="button"
            onClick={onBuildEMR}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--doctor-accent, #52ff9d)',
              background: 'var(--doctor-accent, #52ff9d)',
              color: '#06111d',
              borderRadius: 99,
              padding: '10px 22px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 8px 32px rgba(82,255,157,0.22), 0 0 15px rgba(82,255,157,0.3)',
              transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(82,255,157,0.35), 0 0 20px rgba(82,255,157,0.4)';
              e.currentTarget.style.filter = 'brightness(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(82,255,157,0.22), 0 0 15px rgba(82,255,157,0.3)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            <PlusCircle size={18} strokeWidth={2.5} />
            <span>Build EMR</span>
          </button>
        )}
      </div>


      <div
        style={{
          position: 'relative',
          minWidth: 0,
          overflow: 'visible',
          zIndex: 2,
          gridColumn: 1,
          gridRow: stackAnalysisPanel ? 1 : 1,
          minHeight: stackAnalysisPanel ? 0 : '100%',
        }}
      >
        <AIAnalysisPanel 
          data={filteredData} 
          darkMode={chromeDarkMode} 
          stacked={stackAnalysisPanel} 
          accessLevel={accessLevel} 
          onBack={onBack}
          isAiExpanded={isAiExpanded}
          setIsAiExpanded={setIsAiExpanded}
          isOverviewExpanded={isOverviewExpanded}
          setIsOverviewExpanded={setIsOverviewExpanded}
          admissionRecord={admissionRecord}
        />
      </div>


      {/* -- Timeline column (flex: 1) -- */}
      <div
        style={{
          position: 'relative',
          minWidth: 0,
          height: '100%',
          overflowY: 'hidden',
          overflowX: 'visible',
          zIndex: 1,
          gridColumn: stackAnalysisPanel ? 1 : 2,
          gridRow: stackAnalysisPanel ? 2 : 1,
        }}
      >
        <div
          ref={contentRef}
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
          onScroll={(e) => {
            if (scrollRef.current) scrollRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
        >
          {/* -- Scroll region -- */}
          <div
            ref={scrollRef}
            style={{
              position: 'relative',
          zIndex: 1,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'visible',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          scrollbarGutter: 'stable both-edges',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          willChange: 'scroll-position',
        }}
      >

        {/* Header */}
        <div style={{ padding: `${headerTopPad}px ${timelineHorizontalPad}px ${headerBottomPad}px ${timelineHorizontalPad}px`, maxWidth: listMode ? 768 : layoutViewportWidth || undefined, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BBBBB9' }}>
            Medical Timeline
          </span>
        </div>

        {/* Admission Card (from Bed Management) */}
        {admissionRecord && (
          <div style={{ padding: `0 ${timelineHorizontalPad}px`, maxWidth: listMode ? 768 : layoutViewportWidth || undefined, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <AdmissionCard record={admissionRecord} chromeDarkMode={chromeDarkMode ?? false} />
          </div>
        )}

        {/* -- Restricted State -- */}
        {!loading && patientId && !accessLevel && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24, padding: '0 40px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 88, height: 88, borderRadius: 28, background: chromeDarkMode ? 'rgba(82,255,157,0.08)' : 'rgba(15,118,110,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${chromeDarkMode ? 'rgba(82,255,157,0.18)' : 'rgba(15,118,110,0.14)'}` }}>
                <ShieldAlert size={42} color={chromeDarkMode ? 'var(--doctor-accent, #52ff9d)' : '#0f766e'} />
              </div>
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: '50%', background: '#EF4444', border: '3px solid #06111D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 2, background: 'white', borderRadius: 1 }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: chromeDarkMode ? 'var(--doctor-text, #f3f8fc)' : '#0f172a', marginBottom: 12 }}>Access Restricted</div>
              <div style={{ fontSize: 14, color: chromeDarkMode ? 'var(--doctor-muted, #8ca1b4)' : '#5b6573', lineHeight: 1.6 }}>
                This patient has disabled clinical history sharing. You can still document a new visit using the consultation tools below.
              </div>
            </div>
          </div>
        )}

        {/* -- Empty / loading states -- */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid #E4E4E2',
              borderTopColor: '#111111',
              animation: 'spin 0.75s linear infinite',
            }} />
            <span style={{ fontSize: 12, color: '#ADADAD', fontWeight: 500 }}>Loading records…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && !patientId && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>No patient selected</div>
              <div style={{ fontSize: 12, color: '#ADADAD' }}>Search for a patient to view their medical timeline</div>
            </div>
          </div>
        )}

        {!loading && patientId && accessLevel && filteredData.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>No records found</div>
              <div style={{ fontSize: 12, color: '#ADADAD' }}>This patient has no records visible under current access levels</div>
            </div>
          </div>
        )}

        {/* -- Simple list mode -- */}
        {!loading && filteredData.length > 0 && listMode && accessLevel && (
          <SimpleListView
            aptData={filteredData}
            chromeDarkMode={chromeDarkMode ?? false}
            onSelect={setSelApt}
            accessLevel={accessLevel}
          />
        )}

        {/* -- Content wrapper (graph mode) -- */}
        {!loading && filteredData.length > 0 && !listMode && accessLevel && (
          <div
            ref={contentRef}
            style={{
              paddingTop: 8,
              paddingRight: timelineHorizontalPad,
              paddingBottom: contentBottomPad,
              paddingLeft: timelineHorizontalPad,
              width: '100%',
              maxWidth: layoutViewportWidth || undefined,
              margin: '0 auto',
              boxSizing: 'border-box',
              position: 'relative',
              isolation: 'isolate',
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            {/* Zig-zag spine connector */}
            <svg
              aria-hidden
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: svgH || '100%', pointerEvents: 'none', zIndex: -1, overflow: 'visible' }}
            >
              {serpPath && (
                <path
                  ref={serpPathRef}
                  d={serpPath}
                  fill="none"
                  stroke="rgba(103, 232, 249, 0.36)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.42}
                  style={{ animation: 'emrCyanPulse 2.8s ease-in-out infinite' }}
                />
              )}
            </svg>

            {/* -- Left column (independent stack) -- */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: rowGap, paddingRight: sideColumnInset, minWidth: 0 }}>
              {filteredData.filter((_, i) => i % 2 === 0).map((apt, i) => {
                const idx         = i * 2;
                const visible     = visibleRows.has(idx);
                const revealDelay = Math.min(idx * 0.04, 0.16);
                return (
                  <div
                    key={apt.id}
                    ref={el => { rowRefs.current[idx] = el; }}
                    data-row-idx={String(idx)}
                    style={{
                      opacity:   visible ? 1 : 0,
                      transform: visible ? 'translateY(0) scale(1)' : 'translateY(38px) scale(0.986)',
                      transition: `opacity 0.46s ${revealDelay}s cubic-bezier(0.2,0.84,0.24,1), transform 0.46s ${revealDelay}s cubic-bezier(0.2,0.84,0.24,1)`,
                      willChange: 'opacity, transform',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <div>
                        <TimelineGroup
                          apt={apt} side="left" baseDelay={idx * 120} floatDelay={idx * 0.72}
                          primaryCardWidth={primaryCardWidth}
                          secondaryCardWidth={secondaryCardWidth}
                          columnGap={groupGap}
                          scale={visualScale}
                          compact={compactTimeline}
                          timelineTheme={effectiveTheme}
                          hiId={hiId} focusId={focusId}
                          setHiId={setHiId} setFocusId={setFocusId}
                        onSelect={setSelApt}
                        onCardRef={el => { cardRefs.current[idx] = el; }}
                        onDotRef={el => { dotRefs.current[idx] = el; }}
                        accessLevel={accessLevel}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* -- Spine (shared) -- */}
            <div style={{ width: spineWidth, flexShrink: 0, position: 'relative', alignSelf: 'stretch' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: (spineWidth / 2) - 1, width: 2, background: LINE_CLR, boxShadow: '0 0 10px rgba(103,232,249,0.22)', animation: 'emrCyanPulse 2.6s ease-in-out infinite' }} />
            </div>

            {/* -- Right column (independent stack) -- */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: rowGap, paddingLeft: sideColumnInset, paddingTop: rightColumnPadTop, minWidth: 0 }}>
              {filteredData.filter((_, i) => i % 2 !== 0).map((apt, i) => {
                const idx         = i * 2 + 1;
                const visible     = visibleRows.has(idx);
                const revealDelay = Math.min(idx * 0.04, 0.16);
                return (
                  <div
                    key={apt.id}
                    ref={el => { rowRefs.current[idx] = el; }}
                    data-row-idx={String(idx)}
                    style={{
                      opacity:   visible ? 1 : 0,
                      transform: visible ? 'translateY(0) scale(1)' : 'translateY(38px) scale(0.986)',
                      transition: `opacity 0.46s ${revealDelay}s cubic-bezier(0.2,0.84,0.24,1), transform 0.46s ${revealDelay}s cubic-bezier(0.2,0.84,0.24,1)`,
                      willChange: 'opacity, transform',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <div>
                        <TimelineGroup
                          apt={apt} side="right" baseDelay={idx * 120} floatDelay={idx * 0.72}
                          primaryCardWidth={primaryCardWidth}
                          secondaryCardWidth={secondaryCardWidth}
                          columnGap={groupGap}
                          scale={visualScale}
                          compact={compactTimeline}
                          timelineTheme={effectiveTheme}
                          hiId={hiId} focusId={focusId}
                          setHiId={setHiId} setFocusId={setFocusId}
                          onSelect={setSelApt}
                          onCardRef={el => { cardRefs.current[idx] = el; }}
                          onDotRef={el => { dotRefs.current[idx] = el; }}
                          accessLevel={accessLevel}
                        />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>
      </div>{/* end contentRef wrapper */}
      </div>{/* end timeline column */}
      {/* -- Side panel or Wide Modal -- */}
      {selApt && (
        selApt.isNote ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm" onClick={() => setSelApt(null)}>
            <div className="w-full max-w-[500px] overflow-hidden rounded-3xl border border-amber-400/20 bg-[#0d1520] shadow-[0_32px_100px_rgba(0,0,0,0.75)]" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-white/[0.07] px-6 py-5 flex items-center justify-between bg-amber-400/[0.02]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><StickyNote className="text-amber-400" size={18} /> {selApt.type}</h3>
                <button onClick={() => setSelApt(null)} className="ghost-btn !px-2 !py-2 text-mist"><X size={16} /></button>
              </div>
              <div className="p-6">
                <div className="text-sm font-semibold text-amber-200/50 uppercase tracking-widest mb-3">Note Details</div>
                <p className="text-[15px] leading-relaxed text-white/90 whitespace-pre-wrap">{selApt.noteText}</p>
                <div className="mt-8 flex justify-between items-center text-[12px] text-mist/50 border-t border-white/[0.04] pt-4">
                  <span>Added by Dr. {selApt.doctor}</span>
                  <span>{selApt.date}</span>
                </div>
              </div>
            </div>
          </div>
        ) : selApt.isHPNote ? (
          <HPNotePanel appointment={selApt} onClose={() => setSelApt(null)} />
        ) : prescriptionLayout === 'wide' ? (
          <PrescriptionModal
            event={{
              kind: 'appointment',
              date: selApt.date,
              sortTs: new Date(selApt.date).getTime(),
              data: {
                id: selApt.id,
                date: selApt.date,
                doctorName: selApt.doctor,
                specialty: selApt.specialty,
                mode: 'In-person',
                status: selApt.status || 'Completed',
                purpose: selApt.type,
                diagnosis: selApt.notes,
                symptoms: selApt.chiefComplaint,
                medications: selApt.prescriptions.map(p => ({
                  name: p.name,
                  dose: p.dose,
                  frequency: p.frequency,
                  duration: p.duration,
                  notes: p.instructions
                })),
                notes: selApt.plan,
                documentPath: selApt.documentPath
              }
            } as TimelineEvent}
            patient={patient || { 
              id: patientId || 'unknown', 
              name: 'Patient', 
              age: 0, 
              gender: 'Other', 
              vitals: selApt.vitals || {},
              pastAppointments: [],
              medicalReports: [],
              prescriptions: [],
              chronicConditions: [],
              allergies: []
            } as unknown as Patient}
            layoutMode="wide"
            onClose={() => setSelApt(null)}
          />
        ) : (
          <SidePanel appointment={selApt} onClose={() => setSelApt(null)} darkMode={chromeDarkMode} accessLevel={accessLevel} />
        )
      )}

      {/* -- Bottom Floating Zoom Slider -- */}
      {setTimelineZoom && !selApt && !isAiExpanded && !isOverviewExpanded && (
        <BottomZoomSlider value={timelineZoom} onChange={setTimelineZoom} chromeDarkMode={chromeDarkMode || false} />
      )}

      {/* Document Builder Overlay */}
      <AnimatePresence>
        {showDocOverlay && (
          <DocumentBuilderOverlay 
            onClose={() => setShowDocOverlay(false)} 
            onSelectHP={onSelectHP}
            darkMode={chromeDarkMode} 
          />
        )}
      </AnimatePresence>

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm" onClick={() => setShowAddNoteModal(false)}>
          <div className="w-full max-w-[500px] overflow-hidden rounded-3xl border border-amber-400/20 bg-[#0d1520] shadow-[0_32px_100px_rgba(0,0,0,0.75)]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-white/[0.07] px-6 py-5 flex items-center justify-between bg-amber-400/[0.02]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><StickyNote className="text-amber-400" size={18} /> Add Clinical Note</h3>
              <button onClick={() => setShowAddNoteModal(false)} className="ghost-btn !px-2 !py-2 text-mist"><X size={16} /></button>
            </div>
            <div className="p-6">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type your important clinical note here..."
                className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50 resize-none mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAddNoteModal(false)} className="ghost-btn">Cancel</button>
                <button 
                  onClick={handleAddNoteSubmit} 
                  disabled={isSubmittingNote || !newNoteText.trim()}
                  className="action-btn !bg-amber-400/10 !border-amber-400/20 !text-amber-400 hover:!bg-amber-400/20 disabled:opacity-50"
                >
                  {isSubmittingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
