import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BookmarkPlus,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Cpu,
  LayoutTemplate,
  Loader,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Pause,
  Play,
  Save,
  Square,
  X,
} from 'lucide-react';
import { Appointment } from '../../types/Appointment';
import { EMRState, PrescriptionRow, PrescriptionTemplate } from '../../types/EMR';
import { Patient } from '../../types/Patient';
import { PrescriptionTable } from './PrescriptionTable';

import { HoverRevealSidebar } from '../HoverRevealSidebar';

/* ── Keyframe animations (injected once) ─────────────────── */
const ANIMATIONS_CSS = `
@keyframes emr-simple-mini-in {
  from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.90); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
}
.emr-simple-mini { animation: emr-simple-mini-in 0.30s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

@keyframes severity-pop-simple {
  0%   { transform: scale(1); }
  30%  { transform: scale(0.80); }
  65%  { transform: scale(1.18); }
  85%  { transform: scale(0.96); }
  100% { transform: scale(1); }
}
.severity-btn-popping-simple { animation: severity-pop-simple 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
`;

let _styleInjected = false;
function injectStyles() {
  if (_styleInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = ANIMATIONS_CSS;
  document.head.appendChild(el);
  _styleInjected = true;
}

interface EMRBuilderProps {
  patientName: string | null;
  patient?: Patient | null;
  appointment?: Appointment | null;
  composerOpen?: boolean;
  onCloseComposer?: () => void;
  openedFromRecords?: boolean;
  emr: EMRState;
  templates: PrescriptionTemplate[];
  activeTemplateId: string | null;
  onStartConsultation?: () => void;
  onEndConsultation?: () => void;
  onPauseConsultation?: () => void;
  onResumeConsultation?: () => void;
  onFieldChange: (field: keyof EMRState, value: string) => void;
  onVitalChange: (field: keyof EMRState['vitals'], value: string) => void;
  onPrescriptionChange: (id: string, field: keyof PrescriptionRow, value: string) => void;
  onAddPrescriptionRow: () => void;
  onRemovePrescriptionRow: (id: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onSaveTemplate: () => boolean;
  isSaving?: boolean;
  onSaveEMR: (severity: Severity) => void;
  onNavigate?: (key: string) => void;
}

/* ─── Collapsible section card ───────────────────────────── */
function Section({
  title,
  badge,
  children,
  defaultOpen = true,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-wire/8 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.025]"
      >
        <div className="flex items-center gap-2.5">
          <ChevronDown
            size={14}
            className={`shrink-0 text-mist/50 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          />
          <span className="text-[13px] font-semibold text-white/80">{title}</span>
        </div>
        {badge}
      </button>
      {open && (
        <div className="border-t border-wire/8 px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Inline vital pill ──────────────────────────────────── */
function VitalPill({
  label,
  value,
  unit,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  unit: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex cursor-text items-center gap-1.5 rounded-2xl border border-wire/10 bg-white/[0.05] px-3 py-2 transition focus-within:border-neon/40 focus-within:ring-2 focus-within:ring-neon/15">
      <span className="text-xs font-semibold text-neon/80">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-[80px] bg-transparent text-sm font-medium text-white outline-none placeholder:text-mist"
      />
      <span className="text-xs text-mist">{unit}</span>
    </label>
  );
}



/* ─── Severity picker ────────────────────────────────────── */
type Severity = 'LOW' | 'MILD' | 'SEVERE';

const SEVERITY_ACTIVE_CLS = 'border-neon/40 bg-neon/[0.12] text-neon';
const SEVERITY_ACTIVE_GLOW = '0 0 10px rgba(82,255,157,0.35), 0 0 24px rgba(82,255,157,0.15)';
const SEVERITY_IDLE_CLS = 'border-wire/10 bg-transparent text-mist/70 hover:border-wire/20 hover:bg-white/[0.04] hover:text-white/80';

function SeverityPicker({
  value,
  onChange,
}: {
  value: Severity;
  onChange: (v: Severity) => void;
}) {
  const [popping, setPopping] = useState<Severity | null>(null);
  const opts: Severity[] = ['LOW', 'MILD', 'SEVERE'];

  function handleClick(o: Severity) {
    onChange(o);
    setPopping(o);
    setTimeout(() => setPopping(null), 400);
  }

  return (
    <div className="flex gap-2">
      {opts.map((o) => {
        const isActive = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => handleClick(o)}
            className={[
              'rounded-2xl border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150',
              isActive ? SEVERITY_ACTIVE_CLS : SEVERITY_IDLE_CLS,
              popping === o ? 'severity-btn-popping-simple' : '',
            ].join(' ')}
            style={isActive ? { boxShadow: SEVERITY_ACTIVE_GLOW } : undefined}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════ */
export function EMRBuilder({
  patientName,
  patient,
  appointment,
  composerOpen = true,
  onCloseComposer,
  openedFromRecords = false,
  emr,
  templates,
  activeTemplateId,
  onEndConsultation,
  onPauseConsultation,
  onResumeConsultation,
  onFieldChange,
  onVitalChange,
  onPrescriptionChange,
  onAddPrescriptionRow,
  onRemovePrescriptionRow,
  onApplyTemplate,
  onSaveTemplate,
  isSaving = false,
  onSaveEMR,
  onNavigate,
}: EMRBuilderProps) {
  injectStyles();

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [severity, setSeverity] = useState<Severity>('LOW');
  const [minimized, setMinimized] = useState(false);

  /* Follow-up date quick-set */
  function setFollowUpOffset(days: number | null) {
    if (days === null) { onFieldChange('followUpDate', ''); return; }
    const d = new Date();
    d.setDate(d.getDate() + days);
    onFieldChange('followUpDate', d.toISOString().slice(0, 10));
  }

  const handleEndConsultation = useCallback(() => {
    onEndConsultation?.();
  }, [onEndConsultation]);

  if (!composerOpen) return null;

  const inSession    = appointment?.status === 'IN_SESSION';
  const paused       = appointment?.status === 'PAUSED';

  /* ── Minimised pill ── */
  if (minimized) {
    return (
      <div
        className="emr-simple-mini fixed bottom-6 z-[999]"
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.15] bg-slate-900/80 px-4 py-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <span className={`h-2 w-2 shrink-0 rounded-full ${inSession ? 'animate-pulse bg-neon' : 'bg-white/25'}`} />
          <span className="max-w-[160px] truncate text-[13px] font-semibold text-white">
            {patientName ?? 'EMR Builder'}
          </span>
          <span className="h-4 w-px shrink-0 rounded-full bg-white/15" />
          <button
            type="button"
            onClick={() => setMinimized(false)}
            title="Expand EMR"
            className="flex items-center gap-1.5 rounded-xl border border-neon/30 bg-neon/[0.10] px-2.5 py-1.5 text-[12px] font-semibold text-neon transition hover:border-neon/55 hover:bg-neon/[0.18] active:scale-95"
          >
            <Maximize2 size={11} /> Expand
          </button>
          <button
            type="button"
            onClick={onCloseComposer}
            title="Close EMR"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.12] text-white/45 transition hover:border-white/25 hover:text-white/75 active:scale-90"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    /* ── Bottom-sheet overlay ── */
    <div
      className="emr-backdrop fixed inset-0 z-[80] flex items-end justify-center"
      onClick={onCloseComposer}
    >
      {onNavigate && <HoverRevealSidebar onNavigate={onNavigate} zIndex={82} />}
      <div
        className="emr-sheet relative flex w-full max-h-[92vh] flex-col overflow-hidden rounded-t-[32px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top bar ── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-wire/8 px-5 py-3">
          {/* Left: Close + patient name */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCloseComposer}
              className="flex items-center gap-1.5 rounded-2xl border border-wire/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/80 transition hover:border-wire/20 hover:bg-white/[0.07]"
            >
              <X size={14} />
              Close
            </button>
            {patientName && (
              <span className="rounded-2xl border border-wire/8 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white/60">
                {patientName}
              </span>
            )}
          </div>

          {/* Right: Minimize + Save */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMinimized(true)}
              title="Minimise"
              className="flex items-center gap-1.5 rounded-2xl border border-wire/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/70 transition hover:border-wire/20 hover:bg-white/[0.07]"
            >
              <Minimize2 size={14} /> Minimise
            </button>
            <button
              type="button"
              onClick={() => onSaveEMR(severity)}
              disabled={isSaving}
              className="action-btn gap-2 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── Consultation controls sub-bar (only visible when a session is active) ── */}
        {patient && !openedFromRecords && (inSession || paused) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-wire/8 px-5 py-2.5">
            {inSession && onPauseConsultation && (
              <button type="button" onClick={onPauseConsultation} className="ghost-btn gap-1.5 py-1.5 text-xs">
                <Pause size={13} /> Pause
              </button>
            )}
            {paused && onResumeConsultation && (
              <button type="button" onClick={onResumeConsultation} className="action-btn gap-1.5 py-1.5 text-xs">
                <Play size={13} /> Resume
              </button>
            )}
            {onEndConsultation && (
              <button type="button" onClick={handleEndConsultation} className="ghost-btn gap-1.5 py-1.5 text-xs">
                <Square size={13} /> End Consultation
              </button>
            )}
          </div>
        )}

        {/* ── Two-column body ── */}
        <div className="flex flex-1 overflow-hidden">



          {/* ── RIGHT: Form sections ── */}
          <div className="scroll-skin flex-1 overflow-y-auto">
            <div className="space-y-3 px-6 py-5 pb-10">

              <Section title="Chief Complaint">
                <input
                  className="input-shell w-full"
                  value={emr.patientInfo}
                  onChange={(e) => onFieldChange('patientInfo', e.target.value)}
                  placeholder="High blood pressure over past week..."
                />
              </Section>

              <Section title="Vitals">
                <div className="flex flex-wrap gap-2">
                  <VitalPill label="BP"   value={emr.vitals.bloodPressure} unit="mmHg" placeholder="120/80" onChange={(v) => onVitalChange('bloodPressure', v)} />
                  <VitalPill label="HR"   value={emr.vitals.pulse}         unit="bpm"  placeholder="72"     onChange={(v) => onVitalChange('pulse', v)} />
                  <VitalPill label="Temp" value={emr.vitals.temperature}   unit="°F"   placeholder="98.6"   onChange={(v) => onVitalChange('temperature', v)} />
                  <VitalPill label="SpO2" value={emr.vitals.spo2}          unit="%"    placeholder="99"     onChange={(v) => onVitalChange('spo2', v)} />
                  <VitalPill label="Ht"   value={emr.vitals.height}        unit="cm"   placeholder="170"    onChange={(v) => onVitalChange('height', v)} />
                  <VitalPill label="Wt"   value={emr.vitals.weight}        unit="kg"   placeholder="70"     onChange={(v) => onVitalChange('weight', v)} />
                </div>
              </Section>

              <Section
                title="Prescription"
                badge={
                  <span className="chip chip-green text-xs">
                    <ClipboardCheck size={12} />
                    {emr.prescriptionRows.length} medicines
                  </span>
                }
              >
                <PrescriptionTable
                  rows={emr.prescriptionRows}
                  onAdd={onAddPrescriptionRow}
                  onOpenTemplates={() => setTemplatePickerOpen(true)}
                  onChange={onPrescriptionChange}
                  onRemove={onRemovePrescriptionRow}
                />
              </Section>

              <Section title="Assessment">
                <div className="space-y-3">
                  <SeverityPicker value={severity} onChange={setSeverity} />
                  <div className="relative">
                    <textarea
                      className="input-shell w-full min-h-[88px] resize-none"
                      value={emr.diagnosis}
                      onChange={(e) => onFieldChange('diagnosis', e.target.value)}
                      placeholder="Hypertension management. Clinical impression and differential..."
                    />
                  </div>
                </div>
              </Section>

              <Section title="Lab Orders">
                <textarea
                  className="input-shell w-full min-h-[88px] resize-none"
                  value={emr.labTests}
                  onChange={(e) => onFieldChange('labTests', e.target.value)}
                  placeholder="CBC, HbA1c, ECG, fasting lipid profile..."
                />
              </Section>

              <Section
                title="Follow-up Date"
                badge={
                  <span className="chip border-wire/10 bg-white/[0.03] text-xs text-white/70">
                    <CalendarDays size={12} />
                    Follow-up
                  </span>
                }
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-mist/60">Quick set:</span>
                  <div className="flex items-center gap-0.5 rounded-xl border border-wire/10 bg-white/[0.04] px-1 py-0.5">
                    {([1, 3, 5, 7] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFollowUpOffset(d)}
                        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-mist transition hover:bg-white/10 hover:text-white"
                      >
                        {d}d
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFollowUpOffset(null)}
                      className="rounded-lg px-2 py-1 text-[11px] font-semibold text-mist transition hover:bg-white/10 hover:text-white"
                      title="Clear follow-up date"
                    >
                      C
                    </button>
                  </div>
                  <input
                    type="date"
                    aria-label="Follow-up date"
                    title="Follow-up date"
                    className="input-shell max-w-[220px]"
                    value={emr.followUpDate}
                    onChange={(e) => onFieldChange('followUpDate', e.target.value)}
                  />
                </div>
              </Section>

            </div>
          </div>

        </div>

      </div>

      {/* ── Template picker ── */}
      {templatePickerOpen && (
        <div
          className="template-picker-overlay absolute inset-0 z-10 flex items-end justify-center"
          onClick={() => setTemplatePickerOpen(false)}
        >
          <div
            className="emr-sheet w-full max-w-3xl overflow-hidden rounded-t-[28px] border-x border-t border-wire/10 shadow-[0_-20px_60px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-[5px] w-10 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between border-b border-wire/8 px-5 py-3">
              <button
                type="button"
                onClick={() => setTemplatePickerOpen(false)}
                className="flex items-center gap-1.5 rounded-2xl border border-wire/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.07]"
              >
                <X size={14} /> Close
              </button>
              <div className="flex items-center gap-2">
                <LayoutTemplate size={14} className="text-neon/70" />
                <h3 className="text-[15px] font-semibold text-white/90">Prescription Templates</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  const saved = onSaveTemplate();
                  if (saved) setTemplatePickerOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-2xl border border-wire/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/70 transition hover:border-neon/20 hover:bg-neon/[0.06] hover:text-neon"
              >
                <BookmarkPlus size={14} /> Create template
              </button>
            </div>

            <div className="scroll-skin max-h-[55vh] overflow-y-auto p-5">
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <LayoutTemplate size={32} className="mb-3 text-mist/30" />
                  <p className="text-sm text-mist">No templates yet.</p>
                  <p className="mt-1 text-xs text-mist/60">Fill a prescription and click "Create template" to save it.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {templates.map((tpl) => {
                    const isActive = activeTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => { onApplyTemplate(tpl.id); setTemplatePickerOpen(false); }}
                        className={[
                          'group rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.015]',
                          isActive
                            ? 'border-neon/35 bg-[linear-gradient(135deg,rgba(82,255,157,0.10),rgba(82,255,157,0.03))] shadow-[0_4px_20px_rgba(82,255,157,0.10)]'
                            : 'border-wire/8 bg-white/[0.02] hover:border-neon/25 hover:bg-neon/[0.04]'
                        ].join(' ')}
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <span className={`text-sm font-semibold ${isActive ? 'text-neon' : 'text-white'}`}>
                            {tpl.name}
                          </span>
                          <span className="flex-shrink-0 rounded-full border border-wire/10 bg-white/[0.06] px-2 py-0.5 text-[10px] text-mist">
                            {tpl.rows.length} med{tpl.rows.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="mb-3 line-clamp-1 text-[11px] text-mist/80">{tpl.diagnosis}</p>
                        <div className="space-y-1.5">
                          {tpl.rows.slice(0, 3).map((row) => (
                            <div key={row.id} className="flex items-center gap-2">
                              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-neon/40" />
                              <span className="min-w-0 flex-1 truncate text-xs text-white/80">{row.medicineName}</span>
                              <span className="flex-shrink-0 text-[10px] text-mist">
                                {row.dose} · {row.frequency}
                              </span>
                            </div>
                          ))}
                          {tpl.rows.length > 3 && (
                            <p className="pl-3 text-[10px] text-mist/60">+{tpl.rows.length - 3} more medicine{tpl.rows.length - 3 !== 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
