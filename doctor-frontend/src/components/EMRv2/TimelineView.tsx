import { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { FlaskConical, Pill, Stethoscope, ChevronDown, Sparkles, Activity, ShieldAlert, TrendingUp, History, Moon, Sun, ArrowLeft, PlusCircle, X, Brain, HeartPulse, Microscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, getAuthHeader } from '../../lib/api';
import { SidePanel } from './SidePanel';
import type { AppointmentEntry } from './types';
import { SpacetimeSingularity } from '../Patient/SpacetimeSingularity';
import { PrescriptionModal } from '../EMR/EMRTimeline';
import type { TimelineEvent } from '../EMR/EMRTimeline';
import type { Patient } from '../../types/Patient';

const API_BASE = API_BASE_URL;

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
function getAccent(specialty: string, severity?: string, isLab?: boolean): string {
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
  critical: '#EF4444', // Red
  mild:     '#F97316', // Orange
  low:      '#22C55E', // Green
  lab:      '#D946EF', // Purple/Pink
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
      prescriptions: (rx.items ?? []).map((item: any) => ({
        id:        item.id,
        name:      item.medicine || 'Medicine',
        dose:      item.dose      || '—',
        frequency: item.frequency || undefined,
        duration:  item.timing    || undefined,
        instructions: item.reason || undefined,
      })),
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

  return results.sort((a, b) => new Date(b.startDate || b.date).getTime() - new Date(a.startDate || a.date).getTime());
}

// -- Secondary item union -----------------------------------------
type SItem =
  | { kind: 'lab';  id: string; label: string; value: string; unit?: string; status?: string }
  | { kind: 'rx';   id: string; label: string; value: string; sub?: string }
  | { kind: 'med';  id: string; label: string; value: string; sub?: string };

function flatten(apt: AppointmentEntry): SItem[] {
  return [
    ...apt.labs.map(l         => ({ kind: 'lab' as const, id: l.id, label: l.label, value: l.value, unit: l.unit,  status: l.status })),
    ...apt.prescriptions.map(p => ({ kind: 'rx'  as const, id: p.id, label: p.name,  value: p.dose,  sub: p.frequency })),
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
      ? 'color-mix(in srgb, var(--doctor-bg-end, #10253d) 84%, var(--doctor-card-tint, rgba(28,56,78,0.9)) 16%)'
      : isBeigeTheme
      ? '#FAF7F2'
      : '#1d384c';
    const groupedBorder = useDashboardTheme
      ? '1px solid color-mix(in srgb, rgba(255,255,255,0.18) 54%, var(--doctor-border, rgba(108, 156, 204, 0.22)) 46%)'
      : isBeigeTheme
      ? '1px solid rgba(120, 95, 70, 0.16)'
      : '1px solid color-mix(in srgb, rgba(255,255,255,0.30) 62%, var(--doctor-border, rgba(108, 156, 204, 0.08)) 38%)';
    const idleBorder = useDashboardTheme
      ? '1px solid color-mix(in srgb, rgba(255,255,255,0.16) 48%, var(--doctor-border, rgba(108, 156, 204, 0.2)) 52%)'
      : isBeigeTheme
      ? '1px solid rgba(120, 95, 70, 0.12)'
      : '1px solid color-mix(in srgb, rgba(255,255,255,0.24) 58%, var(--doctor-border, rgba(108, 156, 204, 0.08)) 42%)';

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
          opacity: noAnim ? 1 : 0,
          animation: noAnim ? 'none' : `sIn 0.38s ${delay}ms ease forwards`,
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
    <div
      ref={ref}
        onClick={() => onSel(apt)}
        onMouseEnter={() => { setHiId(apt.id); setFocusId(null); }}
        onMouseLeave={() => setHiId(null)}
        style={{
          position: 'relative',
          background: timelineTheme === 'dashboard-dark'
            ? 'color-mix(in srgb, var(--doctor-bg-end, #0d2239) 86%, var(--doctor-card-tint, rgba(23,50,77,0.88)) 14%)'
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
            ? `1px solid color-mix(in srgb, ${accent} 34%, rgba(255,255,255,0.30))`
            : timelineTheme === 'dashboard-dark'
            ? '1px solid color-mix(in srgb, rgba(255,255,255,0.16) 48%, var(--doctor-border, rgba(108, 156, 204, 0.22)) 52%)'
            : timelineTheme === 'beige-light'
            ? '1px solid rgba(118, 94, 70, 0.14)'
            : '1px solid color-mix(in srgb, rgba(255,255,255,0.28) 64%, var(--doctor-border, rgba(108, 156, 204, 0.08)) 36%)',
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
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: accent }} />
          <span style={{ fontSize: Math.max(9, 9 * scale), fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: accent }}>
            {apt.specialty}
          </span>
        </div>
  
        <div style={{ position: 'relative', zIndex: 1, fontSize: Math.max(15, 16 * scale), fontWeight: 800, color: timelineTheme === 'beige-light' ? '#2e2418' : '#FFFFFF', lineHeight: 1.3, marginBottom: 5, textShadow: timelineTheme === 'beige-light' ? '0 1px 0 rgba(255,255,255,0.18)' : '0 1px 0 rgba(0,0,0,0.16)' }}>
          Consultation, {apt.date}
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
      </div>
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
  const accent = getAccent(apt.specialty, apt.severity, (apt as any).isLab);
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
  setIsOverviewExpanded
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
              onClick={onBack}
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
  initialMode
}: { 
  data: AppointmentEntry[]; 
  darkMode?: boolean; 
  onClose: () => void;
  leadSpecialty: [string, number] | undefined;
  flaggedLabs: any[];
  totalVisits: number;
  initialMode: 'overview' | 'ai';
}) {
  const [mode, setMode] = useState<'overview' | 'ai'>(initialMode);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello Dr. Aditya, I've analyzed this patient's longitudinal data. How can I assist with your clinical assessment today?" }
  ]);

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
      } else if (e.key.toLowerCase() === 'i' && !isInput) {
        setMode('ai');
        e.preventDefault();
      }

      if (e.key === 'ArrowDown' && mode === 'overview') {
        setMode('ai');
        e.preventDefault();
      } else if (e.key === 'ArrowUp' && mode === 'ai') {
        setMode('overview');
        e.preventDefault();
      }

      if (e.key === ' ') {
        // In AI mode, space closing is conditional on chat text
        if (mode === 'ai') {
          if (isInput) {
            if (!chatMessage.trim()) {
              onClose();
              e.preventDefault();
            }
          } else {
            onClose();
            e.preventDefault();
          }
        } 
        // In Overview mode, space always closes (no chat input)
        else {
          onClose();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, chatMessage, onClose]);

  const handleSend = () => {
    if (!chatMessage.trim()) return;
    const newMsgs = [...messages, { role: 'user' as const, text: chatMessage }];
    setMessages(newMsgs);
    setChatMessage('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: "Based on the recent lab trends and clinical history, the patient shows strong stability. I recommend continuing the current regimen and monitoring metabolic markers in 3 months." }]);
    }, 1000);
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
      {/* Global Floating Close Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
        whileHover={{ scale: 1.1, rotate: 90, background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 1)' }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 32,
          right: 32,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: darkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          border: `2px solid ${accent}`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10001,
          boxShadow: `0 0 25px ${accent}44`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <X size={26} strokeWidth={2.5} />
      </motion.button>

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
        {/* Main Content Area (SLIDING SLIDES) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: mode === 'ai' ? border : 'none', position: 'relative', overflow: 'hidden' }}>
          
          {/* Static Header */}
          <div style={{ 
            padding: '32px 40px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            zIndex: 30,
            background: cardBg
          }}>
            <div 
              onClick={() => setMode('overview')}
              style={{ 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                opacity: mode === 'overview' ? 1 : 0.4,
                transition: 'opacity 0.3s'
              }}
            >
              <Activity size={16} color={accent} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: titleClr }}>
                Clinical Overview
              </span>
            </div>
            <div 
              onClick={() => setMode('ai')}
              style={{ 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                opacity: mode === 'ai' ? 1 : 0.4,
                transition: 'opacity 0.3s'
              }}
            >
              <Sparkles size={16} color={accent} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: titleClr }}>
                AI Analysis Report
              </span>
            </div>
            
            <motion.div 
              animate={{ x: mode === 'overview' ? 0 : 165 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 40, 
                width: 135, 
                height: 2, 
                background: accent 
              }} 
            />
          </div>

          {/* Removed local close button - now using global floating close */}

          {/* Sliding Container */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
             <motion.div
                animate={{ y: mode === 'overview' ? '0%' : '-100%' }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                style={{ height: '100%', width: '100%' }}
             >
                {/* SLIDE 1: OVERVIEW */}
                <div className="intelligence-slide scroll-skin" style={{ height: '100%', width: '100%', overflowY: 'auto', padding: '40px' }}>
                   <h2 style={{ fontSize: 32, fontWeight: 800, color: titleClr, marginBottom: 40, letterSpacing: '-0.02em' }}>Patient Health Matrix</h2>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
                      {[
                        { label: 'Total Visits', value: totalVisits, icon: <History size={22} /> },
                        { label: 'Specialties', value: sortedSpecialties.length, icon: <Stethoscope size={22} /> },
                        { label: 'Flagged Labs', value: flaggedLabs.length, icon: <ShieldAlert size={22} /> },
                        { label: 'Prescriptions', value: prescriptionCount + medicationCount, icon: <Pill size={22} /> },
                      ].map(stat => (
                        <div key={stat.label} style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 28, padding: '32px 24px', border: border, transition: 'transform 0.2s' }}>
                          <div style={{ color: accent, marginBottom: 20 }}>{stat.icon}</div>
                          <div style={{ fontSize: 40, fontWeight: 800, color: titleClr, lineHeight: 1 }}>{stat.value}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 10 }}>{stat.label}</div>
                        </div>
                      ))}
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
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
                   </div>
                </div>

                {/* SLIDE 2: AI ANALYSIS */}
                <div className="intelligence-slide scroll-skin" style={{ height: '100%', width: '100%', overflowY: 'auto', padding: '40px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Sparkles size={20} color={accent} />
                      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent }}>
                        Meiosis Intelligence Report
                      </span>
                   </div>
                   <h2 style={{ fontSize: 32, fontWeight: 800, color: titleClr, marginBottom: 40, letterSpacing: '-0.02em' }}>Deep Clinical Insights</h2>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                      <div style={{ background: darkMode ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)', borderRadius: 32, padding: '32px', border: border }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <Brain size={20} color={accent} />
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Clinical Trajectory</h3>
                          </div>
                          <p style={{ fontSize: 15, lineHeight: 1.75, color: muted, marginBottom: 32 }}>
                            Primary focus on <strong style={{ color: titleClr }}>{leadSpecialty ? leadSpecialty[0] : 'general health'}</strong> ({leadSpecialty ? Math.round((leadSpecialty[1] / totalVisits) * 100) : 0}%).
                            The data suggests a strong correlation between therapeutic adherence and long-term stabilization of primary metabolic indicators.
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: muted, fontWeight: 700 }}>Diagnostic Certainty</span>
                                <span style={{ fontWeight: 800, color: accent }}>92%</span>
                            </div>
                            <div style={{ height: 8, background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ duration: 1.5, ease: 'easeOut' }} style={{ height: '100%', background: accent }} />
                            </div>
                          </div>
                      </div>

                      <div style={{ background: darkMode ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)', borderRadius: 32, padding: '32px', border: border }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <Microscope size={20} color={accent} />
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Focused Lab Trends</h3>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {flaggedLabs.length > 0 ? (
                                flaggedLabs.slice(0, 3).map((lab, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: darkMode ? 'rgba(255,255,255,0.04)' : '#fff', borderRadius: 18, border: border }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: titleClr }}>{lab.label}</div>
                                        <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 2 }}>{lab.status} · RED FLAG</div>
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: titleClr }}>{lab.value}</div>
                                  </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '32px 0', border: '1px dashed rgba(120,120,120,0.2)', borderRadius: 20 }}>
                                  <div style={{ fontSize: 14, color: muted }}>All markers within target range.</div>
                                </div>
                            )}
                          </div>
                      </div>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                      <div style={{ background: darkMode ? 'rgba(3, 21, 37, 0.4)' : 'rgba(0,0,0,0.02)', borderRadius: 32, padding: '32px', border: border }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <Pill size={20} color={accent} />
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Pharmacological Impact</h3>
                          </div>
                          <p style={{ fontSize: 14, lineHeight: 1.7, color: muted, margin: 0 }}>
                            Ongoing regimen with <strong style={{ color: titleClr }}>Metformin XR</strong> continues to drive positive systemic responses. Recommended to maintain current titration.
                          </p>
                      </div>

                      <div style={{ background: darkMode ? 'rgba(3, 21, 37, 0.4)' : 'rgba(0,0,0,0.02)', borderRadius: 32, padding: '32px', border: border }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <Activity size={20} color={accent} />
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Next Milestones</h3>
                          </div>
                          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 14, color: muted, lineHeight: 1.8 }}>
                            <li>Metabolic panel follow-up (4 weeks)</li>
                            <li>Specialist review for cardiovascular stability</li>
                          </ul>
                      </div>
                   </div>

                   <div style={{ background: darkMode ? 'rgba(3, 21, 37, 0.5)' : 'rgba(255,255,255,0.6)', borderRadius: 32, padding: '32px', border: border, minHeight: 240 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: titleClr, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24 }}>Longitudinal Trend Analysis</h3>
                      <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 14, padding: '0 10px 10px' }}>
                          {Array.from({ length: 20 }).map((_, i) => {
                            const h = 20 + Math.random() * 80;
                            return (
                              <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: 0.2 + i * 0.04, duration: 0.8 }}
                                style={{ 
                                  flex: 1, 
                                  background: i === 19 ? accent : darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', 
                                  borderRadius: '6px 6px 0 0',
                                  position: 'relative'
                                }}
                              >
                                {i === 19 && (
                                  <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 900, color: accent }}>
                                    REAL-TIME
                                  </div>
                                )}
                              </motion.div>
                            )
                          })}
                      </div>
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
              animate={{ width: 440, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              style={{ display: 'flex', flexDirection: 'column', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderLeft: border, overflow: 'hidden' }}
            >
               <div style={{ width: 440, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '32px', borderBottom: border }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${accent}44` }}>
                          <Sparkles size={22} color="#000" />
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: titleClr, letterSpacing: '-0.01em' }}>AI Clinical Assistant</div>
                          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Secure Clinical Context · Active</div>
                        </div>
                    </div>
                  </div>

                  <div className="scroll-skin" style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                  </div>

                  <div style={{ padding: '32px', borderTop: border, background: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }}>
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
                              background: darkMode ? 'rgba(255,255,255,0.06)' : '#fff',
                              border: border,
                              borderRadius: 20,
                              padding: '18px 60px 18px 24px',
                              fontSize: 15,
                              color: titleClr,
                              outline: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          }}
                        />
                        <button 
                          onClick={handleSend}
                          style={{ 
                              position: 'absolute', 
                              right: 10, 
                              top: 10, 
                              width: 44, 
                              height: 44, 
                              borderRadius: 14, 
                              background: accent, 
                              border: 'none', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: `0 4px 12px ${accent}44`
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                        </button>
                    </div>
                    <div style={{ fontSize: 11, textAlign: 'center', color: muted, marginTop: 16, fontWeight: 700, letterSpacing: '0.04em' }}>
                        Powered by Meiosis Clinical Engine
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
  const text        = chromeDarkMode ? 'var(--doctor-text, #f8fafc)'           : '#0f172a';
  const muted       = chromeDarkMode ? 'var(--doctor-muted, #8ca1b4)'          : '#64748b';
  const sectionLbl  = chromeDarkMode ? 'rgba(140,161,180,0.70)'                : '#94a3b8';
  const neon        = chromeDarkMode ? 'var(--doctor-accent, #52ff9d)'         : '#0f766e';
  const neonBg      = chromeDarkMode ? 'rgba(82,255,157,0.10)'                 : 'rgba(15,118,110,0.08)';
  const neonBdr     = chromeDarkMode ? 'rgba(82,255,157,0.28)'                 : 'rgba(15,118,110,0.28)';
  const cardBg      = chromeDarkMode
    ? 'color-mix(in srgb, var(--doctor-card-tint, rgba(8,26,43,0.82)) 94%, transparent)'
    : 'rgba(255,255,255,0.82)';
  const cardBdr     = chromeDarkMode ? 'var(--doctor-border, rgba(108,156,204,0.08))' : 'rgba(148,163,184,0.2)';
  const cardActiveBdr = chromeDarkMode
    ? 'color-mix(in srgb, var(--doctor-accent, #52ff9d) 38%, var(--doctor-border, rgba(108,156,204,0.08)) 62%)'
    : 'rgba(15,118,110,0.38)';
  const divider     = chromeDarkMode ? 'rgba(103,232,249,0.09)'                : 'rgba(148,163,184,0.14)';
  const rowBg       = chromeDarkMode ? 'rgba(103,232,249,0.05)'                : 'rgba(0,0,0,0.03)';
  const rowBdr      = chromeDarkMode ? 'rgba(103,232,249,0.10)'                : 'rgba(148,163,184,0.14)';
  const ctrlBg      = chromeDarkMode ? 'rgba(6, 18, 42, 0.72)'                : 'rgba(255,255,255,0.88)';
  const ctrlBdr     = chromeDarkMode ? 'rgba(103,232,249,0.18)'               : 'rgba(148,163,184,0.25)';
  const ctrlActBg   = chromeDarkMode ? 'rgba(82,255,157,0.16)'                : '#0f766e';
  const ctrlActClr  = chromeDarkMode ? '#52ff9d'                              : '#ffffff';

  return (
    <div style={{ padding: '0 0 80px', maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

      {/* ── Sticky toolbar ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 8,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '12px 20px 10px',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: `1px solid ${divider}`,
        marginBottom: 4,
      }}>
        {/* Sort toggle */}
        <div style={{ display: 'flex', borderRadius: 12, border: `1px solid ${ctrlBdr}`, background: ctrlBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', overflow: 'hidden' }}>
          {(['recent', 'oldest'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)} style={{
              padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: sort === s ? ctrlActBg : 'transparent',
              color:      sort === s ? ctrlActClr : muted,
              transition: 'background 0.15s, color 0.15s',
            }}>
              {s === 'recent' ? 'Newest' : 'Oldest'}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div style={{ display: 'flex', borderRadius: 12, border: `1px solid ${ctrlBdr}`, background: ctrlBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', overflow: 'hidden' }}>
          {(['all', 'visits', 'labs'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: filter === f ? ctrlActBg : 'transparent',
              color:      filter === f ? ctrlActClr : muted,
              transition: 'background 0.15s, color 0.15s',
              textTransform: 'capitalize' as const,
            }}>
              {f === 'all' ? 'All' : f === 'visits' ? 'Visits' : 'Labs'}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 11, color: sectionLbl, fontWeight: 500 }}>
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* ── Vertical timeline entries ───────────────────────────────────── */}
      <div style={{ padding: '12px 20px 0', position: 'relative' }}>
        {filtered.map((apt, idx) => {
          const isExpanded  = expandedId === apt.id;
          const isLast      = idx === filtered.length - 1;
          const aptAccent   = getAccent(apt.specialty, apt.severity, (apt as any).isLab);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: idx > 0 ? 6 : 0, paddingLeft: 112 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: chromeDarkMode ? 'var(--doctor-accent, #52ff9d)' : '#0f766e',
                    background: chromeDarkMode ? 'rgba(82,255,157,0.08)' : 'rgba(15,118,110,0.07)',
                    border: `1px solid ${chromeDarkMode ? 'rgba(82,255,157,0.22)' : 'rgba(15,118,110,0.22)'}`,
                    padding: '3px 10px', borderRadius: 8,
                  }}>
                    {aptYear}
                  </span>
                  <div style={{ flex: 1, height: 1, background: divider }} />
                </div>
              )}

              {/* ── Row: date column + dot + card ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>

                {/* Date label */}
                <div style={{
                  width: 88, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                  paddingRight: 14, paddingTop: 13,
                  position: 'relative',
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2, color: isExpanded ? aptAccent : text, transition: 'color 0.22s' }}>
                      {(() => { const d = new Date(apt.startDate || apt.date); return isNaN(d.getTime()) ? apt.date : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); })()}
                    </div>
                    <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>
                      {(() => { const d = new Date(apt.startDate || apt.date); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { weekday: 'short' }); })()}
                    </div>
                  </div>
                  {/* Vertical connector rail */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute', right: 5, top: 38,
                      bottom: isExpanded ? -22 : -16,
                      width: 2, borderRadius: 1,
                      background: chromeDarkMode
                        ? 'linear-gradient(180deg, rgba(103,232,249,0.30) 0%, rgba(103,232,249,0.06) 100%)'
                        : 'linear-gradient(180deg, rgba(148,163,184,0.38) 0%, rgba(148,163,184,0.08) 100%)',
                      transition: 'bottom 0.42s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  )}
                </div>

                {/* Timeline dot */}
                <div style={{ width: 20, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 16, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: isExpanded ? 14 : 10,
                    height: isExpanded ? 14 : 10,
                    borderRadius: '50%',
                    background: isExpanded ? aptAccent : (chromeDarkMode ? 'rgba(103,232,249,0.30)' : 'rgba(148,163,184,0.48)'),
                    border: `2px solid ${isExpanded ? aptAccent : (chromeDarkMode ? 'rgba(103,232,249,0.16)' : 'rgba(148,163,184,0.26)')}`,
                    boxShadow: isExpanded ? `0 0 0 4px ${aptAccent}22, 0 0 14px ${aptAccent}44` : 'none',
                    transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>

                {/* Card */}
                <div style={{ flex: 1, paddingLeft: 10, paddingBottom: 14, minWidth: 0 }}>
                  <div
                    onClick={() => { if (accessLevel) setExpandedId(isExpanded ? null : apt.id); }}
                    style={{
                      borderRadius: 16,
                      border: `1.5px solid ${isExpanded ? cardActiveBdr : cardBdr}`,
                      background: cardBg,
                      backdropFilter: 'blur(22px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(22px) saturate(160%)',
                      cursor: accessLevel ? 'pointer' : 'default',
                      overflow: 'hidden',
                      boxShadow: isExpanded
                        ? chromeDarkMode
                          ? '0 0 0 1px rgba(82,255,157,0.10), 0 8px 36px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.06)'
                          : '0 0 0 2px rgba(15,118,110,0.10), 0 8px 28px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.85)'
                        : chromeDarkMode
                          ? '0 2px 10px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)'
                          : '0 1px 5px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.72)',
                      transition: 'border-color 0.25s, box-shadow 0.25s',
                    }}
                  >
                    {/* Specialty colour stripe */}
                    <div style={{ height: 2.5, background: `linear-gradient(90deg, ${aptAccent}, ${aptAccent}88)`, opacity: isExpanded ? 1 : 0.45, transition: 'opacity 0.25s' }} />

                    {/* Header */}
                    <div style={{ padding: '11px 14px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Pills row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
                            color: aptAccent, padding: '2px 8px', borderRadius: 6,
                            background: `${aptAccent}1a`, border: `1px solid ${aptAccent}33`,
                          }}>
                            {accessLevel ? apt.specialty : 'Restricted'}
                          </span>
                          {accessLevel && (
                            <>
                              <span style={{
                                fontSize: 10, fontWeight: 600,
                                color: isActive ? neon : muted,
                                padding: '2px 8px', borderRadius: 6,
                                background: isActive ? neonBg : (chromeDarkMode ? 'rgba(103,232,249,0.06)' : 'rgba(0,0,0,0.04)'),
                                border: `1px solid ${isActive ? neonBdr : (chromeDarkMode ? 'rgba(103,232,249,0.12)' : 'rgba(148,163,184,0.18)')}`,
                              }}>
                                {apt.status ?? 'Completed'}
                              </span>
                              {hasMeds && (
                                <span style={{ fontSize: 10, color: muted, padding: '2px 7px', borderRadius: 6, background: rowBg, border: `1px solid ${rowBdr}` }}>
                                  {apt.prescriptions.length} med{apt.prescriptions.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {hasLabs && (
                                <span style={{ fontSize: 10, color: muted, padding: '2px 7px', borderRadius: 6, background: rowBg, border: `1px solid ${rowBdr}` }}>
                                  {apt.labs.length} lab{apt.labs.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {/* Visit title */}
                        <div style={{ fontSize: 14, fontWeight: 700, color: text, lineHeight: 1.35, marginBottom: 4 }}>
                          {accessLevel ? `Consultation, ${apt.date}` : 'Restricted Encounter'}
                        </div>
                        {/* Doctor + chief complaint preview */}
                        <div style={{ fontSize: 12, color: muted, lineHeight: 1.45 }}>
                          {accessLevel ? apt.doctor : 'Medical Professional'}
                          {accessLevel && apt.chiefComplaint && (
                            <> · <span style={{ color: chromeDarkMode ? 'rgba(200,220,240,0.65)' : '#475569', fontStyle: 'italic' }}>
                              {apt.chiefComplaint.slice(0, 72)}{apt.chiefComplaint.length > 72 ? '…' : ''}
                            </span></>
                          )}
                        </div>
                      </div>
                      {/* Chevron */}
                      {accessLevel && (
                        <div style={{
                          flexShrink: 0, width: 28, height: 28,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 8, marginTop: 2,
                          background: isExpanded ? (chromeDarkMode ? 'rgba(82,255,157,0.12)' : 'rgba(15,118,110,0.10)') : 'transparent',
                          color: isExpanded ? neon : muted,
                          transition: 'background 0.2s, color 0.2s',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* ── Expandable detail panel ─────────────────────────── */}
                    {accessLevel && (
                      <div style={{
                        maxHeight: isExpanded ? 1800 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.44s cubic-bezier(0.4,0,0.2,1)',
                      }}>
                        <div style={{ borderTop: `1px solid ${divider}`, padding: '15px 14px 17px' }}>

                          {/* Vitals — shown first, most immediately clinical */}
                          {hasVitals && (
                            <div style={{ marginBottom: hasNotes || hasMeds || hasLabs ? 15 : 0 }}>
                              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: sectionLbl, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                                Vitals
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                {([
                                  ['BP',   apt.vitals?.bloodPressure],
                                  ['HR',   apt.vitals?.pulse],
                                  ['Temp', apt.vitals?.temperature],
                                  ['SpO₂', apt.vitals?.spo2],
                                  ['Ht',   apt.vitals?.height],
                                  ['Wt',   apt.vitals?.weight],
                                ] as [string, string | undefined][]).filter(([, v]) => !!v).map(([label, value]) => (
                                  <div key={label} style={{ padding: '8px 10px', borderRadius: 10, background: rowBg, border: `1px solid ${rowBdr}` }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: sectionLbl, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Clinical Notes */}
                          {hasNotes && (
                            <div style={{ borderTop: hasVitals ? `1px solid ${divider}` : 'none', paddingTop: hasVitals ? 15 : 0, marginBottom: hasMeds || hasLabs ? 15 : 0 }}>
                              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: sectionLbl, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                Clinical Notes
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {apt.chiefComplaint && (
                                  <div style={{ padding: '9px 11px', borderRadius: 10, background: rowBg, border: `1px solid ${rowBdr}` }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: sectionLbl, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 4 }}>Chief Complaint</div>
                                    <div style={{ fontSize: 13, color: text, lineHeight: 1.6 }}>{apt.chiefComplaint}</div>
                                  </div>
                                )}
                                {apt.notes && (
                                  <div style={{ padding: '9px 11px', borderRadius: 10, background: rowBg, border: `1px solid ${rowBdr}` }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: sectionLbl, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 4 }}>Assessment</div>
                                    <div style={{ fontSize: 13, color: text, lineHeight: 1.6 }}>{apt.notes}</div>
                                  </div>
                                )}
                                {apt.plan && apt.plan !== apt.notes && (
                                  <div style={{ padding: '9px 11px', borderRadius: 10, background: rowBg, border: `1px solid ${rowBdr}` }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: sectionLbl, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 4 }}>Plan</div>
                                    <div style={{ fontSize: 13, color: text, lineHeight: 1.6 }}>{apt.plan}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Prescriptions */}
                          {hasMeds && (
                            <div style={{ borderTop: hasVitals || hasNotes ? `1px solid ${divider}` : 'none', paddingTop: hasVitals || hasNotes ? 15 : 0, marginBottom: hasLabs ? 15 : 0 }}>
                              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: sectionLbl, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                                Prescriptions · {apt.prescriptions.length}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {apt.prescriptions.map(med => (
                                  <div key={med.id} style={{
                                    display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 10px',
                                    padding: '9px 11px', borderRadius: 10,
                                    background: rowBg, border: `1px solid ${rowBdr}`,
                                    alignItems: 'center',
                                  }}>
                                    <div>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: neon }}>{med.name}</span>
                                      {med.dose && <span style={{ fontSize: 12, color: muted, marginLeft: 6 }}>{med.dose}</span>}
                                      {med.frequency && (
                                        <div style={{ fontSize: 11, color: sectionLbl, marginTop: 2 }}>
                                          {/^[01]{4}$/.test(med.frequency) ? slPatternLabel(med.frequency) : med.frequency}
                                        </div>
                                      )}
                                    </div>
                                    {med.duration && (
                                      <span style={{ fontSize: 11, color: sectionLbl, whiteSpace: 'nowrap', textAlign: 'right' }}>{med.duration}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Labs */}
                          {hasLabs && (
                            <div style={{ borderTop: hasVitals || hasNotes || hasMeds ? `1px solid ${divider}` : 'none', paddingTop: hasVitals || hasNotes || hasMeds ? 15 : 0 }}>
                              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: sectionLbl, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/><path d="M14.5 16h-5"/></svg>
                                Lab Orders · {apt.labs.length}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {apt.labs.map(lab => {
                                  const labClr = lab.status === 'critical' ? '#ef4444' : lab.status === 'high' ? '#f97316' : lab.status === 'low' ? '#60a5fa' : muted;
                                  const flagged = lab.status && lab.status !== 'normal';
                                  return (
                                    <div key={lab.id} style={{
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      padding: '8px 11px', borderRadius: 10,
                                      background: flagged ? `${labClr}0d` : rowBg,
                                      border: `1px solid ${flagged ? labClr + '33' : rowBdr}`,
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        {flagged && <span style={{ width: 6, height: 6, borderRadius: '50%', background: labClr, flexShrink: 0 }} />}
                                        <span style={{ fontSize: 13, fontWeight: 600, color: text }}>{lab.label}</span>
                                      </div>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: labClr }}>
                                        {lab.value}{lab.unit ? ` ${lab.unit}` : ''}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {!hasNotes && !hasMeds && !hasVitals && !hasLabs && (
                            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                              <span style={{ fontSize: 12, color: sectionLbl }}>No detailed records for this visit.</span>
                            </div>
                          )}

                          {/* Footer */}
                          <div style={{ borderTop: `1px solid ${divider}`, marginTop: 14, paddingTop: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            {apt.endDate
                              ? <span style={{ fontSize: 12, color: muted }}>Follow-up: <strong style={{ color: text, fontWeight: 600 }}>{slFmtDate(apt.endDate)}</strong></span>
                              : <span />}
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); onSelect(apt); }}
                              style={{
                                padding: '8px 16px', borderRadius: 10,
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                border: `1px solid ${neonBdr}`,
                                background: neonBg, color: neon,
                                transition: 'background 0.15s',
                              }}
                            >
                              View Full Details →
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
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

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

  const filteredData = useMemo(() => {
    if (!accessLevel) return [];
    if (accessLevel === 'full') return aptData;
    if (accessLevel === 'lab') return aptData.filter(apt => apt.labs.length > 0);
    if (accessLevel === 'summary') return aptData; // Show all visits but gate clinical details inside cards
    return [];
  }, [aptData, accessLevel]);

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
  useEffect(() => {
    if (!patientId) {
      setAptData([]);
      setLoading(false);
      setSelApt(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setAptData([]);
    setSelApt(null);
    serpAnimDone.current = false;

    fetch(`${API_BASE}/emr?patientId=${encodeURIComponent(patientId)}`, {
      headers: getAuthHeader()
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        const formatted = buildTimelineData(data);
        setAptData(formatted);
        if (formatted.length === 0) {
          console.warn("[Meiosis] Timeline fetched but returned no records for patient:", patientId);
        }
      })
      .catch(err => {
        console.error("[Meiosis] Failed to fetch timeline records:", err);
        if (!cancelled) setAptData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
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
            borderRadius: 12,
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
        prescriptionLayout === 'wide' ? (
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
    </div>
  );
}
