import { useState, Fragment, useEffect } from 'react';
import { Download, User, Stethoscope, Calendar } from 'lucide-react';
import type { AppointmentEntry } from './types';
import { apiUrl, getAuthHeader, handleAuthError } from '../../lib/api';

const TIMING_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Night'] as const;
function patternLabel(code: string | undefined): string {
  if (!code || !/^[01]{4}$/.test(code)) return code || '—';
  const slots = code.split('').map((b, i) => b === '1' ? TIMING_SLOTS[i] : null).filter(Boolean);
  return slots.length ? slots.join(' + ') : '—';
}

interface SidePanelProps {
  appointment: AppointmentEntry;
  onClose: () => void;
  darkMode?: boolean;
  accessLevel?: 'full' | 'lab' | 'summary' | null;
}

function fmtDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MetaTile({
  label, value, icon: Icon,
}: {
  label: string; value: string; icon?: any;
}) {
  return (
    <div className="flex flex-1 items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 backdrop-blur-md transition-all hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-white/40">
          <Icon size={18} strokeWidth={1.5} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-mist/40">{label}</p>
        <p className="mt-1 truncate text-[15px] font-bold text-white/90">{value || '—'}</p>
      </div>
    </div>
  );
}

function NoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-4 border-t border-white/5">
      <span className="w-[160px] flex-shrink-0 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist/55">
        {label}
      </span>
      <p className="flex-1 text-[13px] leading-6 text-white/80">{value}</p>
    </div>
  );
}

export function SidePanel({ appointment, onClose, accessLevel = 'full' }: SidePanelProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Auto-expand all medication instructions on load
  useEffect(() => {
    if (appointment?.prescriptions) {
      const ids = new Set<string>();
      appointment.prescriptions.forEach(p => {
        if (p.instructions) ids.add(p.id);
      });
      setExpandedNotes(ids);
    }
  }, [appointment]);

  function toggleNote(id: string) {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function fallbackFileName() {
    const doctorSlug = (appointment.doctor || 'doctor').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
    const dateSlug = (appointment.startDate || appointment.date || 'prescription').replace(/[^0-9a-z]+/gi, '_');
    return `Prescription_${doctorSlug || 'doctor'}_${dateSlug || 'prescription'}.pdf`;
  }

  function getDownloadFileName(contentDisposition: string | null) {
    if (!contentDisposition) return fallbackFileName();

    const utfMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utfMatch?.[1]) {
      try {
        return decodeURIComponent(utfMatch[1]).replace(/^["']|["']$/g, '');
      } catch {
        return utfMatch[1].replace(/^["']|["']$/g, '');
      }
    }

    const asciiMatch = contentDisposition.match(/filename\s*=\s*("?)([^";]+)\1/i);
    return asciiMatch?.[2] || fallbackFileName();
  }

  const handleDownloadPDF = async () => {
    alert("PDF generation is disabled pending system redesign.");
  };

  const canSeeLabs = accessLevel === 'full' || accessLevel === 'lab';
  const canSeeMeds = accessLevel === 'full';
  const canSeeNotes = accessLevel === 'full';
  const canSeeVitals = accessLevel === 'full' || accessLevel === 'summary';

  const meds    = (canSeeMeds ? (appointment.prescriptions ?? []) : []);
  const vitals  = (canSeeVitals ? (appointment.vitals ?? {}) : {});
  const labs    = (canSeeLabs ? (appointment.labs ?? []) : []);

  const isActive   = (appointment.status ?? '').toUpperCase() === 'ACTIVE';
  const statusLabel = isActive ? 'Active' : (appointment.status ?? 'Completed');
  const dateRange   = `${fmtDate(appointment.startDate)}${appointment.endDate ? ` → ${fmtDate(appointment.endDate)}` : ''}`;

  const hasNotes = canSeeNotes && !!(appointment.chiefComplaint || appointment.notes || appointment.plan);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/65 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[1000px] overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0d1520] shadow-[0_32px_100px_rgba(0,0,0,0.75)]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Hero ── */}
        <div className="border-b border-white/[0.07] px-8 pt-8 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neon/70">
                MEIOSIS PRESCRIPTION
              </p>
              <h3 className="mt-2 text-[24px] font-bold tracking-tight text-white">
                {appointment.type || 'Consultation Record'}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wide ${
                isActive
                  ? 'bg-neon/[0.13] text-neon shadow-[0_0_15px_rgba(0,255,163,0.1)]'
                  : 'bg-white/[0.07] text-white/55'
              }`}>
                {statusLabel}
              </span>
              <span className="text-[12px] font-medium text-mist/65">{dateRange}</span>
            </div>
          </div>
        </div>

        {/* ── Meta tiles ── */}
        <div className="flex flex-wrap gap-4 border-b border-white/[0.07] p-6 bg-white/[0.01]">
          <MetaTile label="Attending Physician" value={appointment.doctor ?? '—'} icon={User} />
          <MetaTile label="Clinical Specialty"  value={appointment.specialty ?? '—'} icon={Stethoscope} />
          <MetaTile label="Encounter Date"      value={appointment.date ?? '—'} icon={Calendar} />
        </div>

        {/* ── Medications table ── */}
        {canSeeMeds && (
          <div className="border-b border-white/[0.07] px-8 py-6">
            <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.14em] text-white/90">
              💊 Medications
            </p>
            {meds.length === 0 ? (
              <p className="text-[13px] italic text-mist/50">No medicines prescribed.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr>
                      {['MEDICINE', 'DOSE', 'TIMING CODE', 'DURATION', ''].map((h) => (
                        <th
                          key={h}
                          className="pb-2 pr-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-mist/55 last:pr-0 last:w-7"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {meds.map((med) => (
                      <Fragment key={med.id}>
                        <tr className="border-t border-white/[0.05]">
                          <td className="py-2 pr-3 text-neon leading-snug">
                            {(() => {
                              const match = med.name.match(/^(.+?)\s*\((.+?)\)$/);
                              if (match) {
                                return (
                                  <>
                                    <strong className="block font-bold tracking-wide">{match[1].trim()}</strong>
                                    <span className="text-[9.5px] font-medium text-neon/60">({match[2].trim()})</span>
                                  </>
                                );
                              }
                              return <span className="font-semibold">{med.name}</span>;
                            })()}
                          </td>
                          <td className="py-2 pr-3 text-white/75">{med.dose || '—'}</td>
                          <td className="py-2 pr-3 text-white/75">
                            {/^[01]{4}$/.test(med.frequency ?? '') ? (
                              <span>
                                <span className="font-mono text-[10px] text-white/35 mr-1">{med.frequency}</span>
                                {patternLabel(med.frequency)}
                              </span>
                            ) : (med.frequency || '—')}
                          </td>
                          <td className="py-2 pr-3 text-white/75">{med.duration || '—'}</td>
                          <td className="py-2 text-right">
                            {med.instructions && (
                              <button
                                type="button"
                                onClick={() => toggleNote(med.id)}
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.15] text-[13px] font-bold leading-none text-mist/50 transition-colors hover:border-neon/40 hover:text-neon"
                              >
                                {expandedNotes.has(med.id) ? '−' : '+'}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedNotes.has(med.id) && med.instructions && (
                          <tr>
                            <td colSpan={5} className="pb-3 pt-0">
                              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                                <p className="text-[11px] leading-5 text-mist/70">{med.instructions}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3.5 text-center text-[10px] italic text-mist/40">Note: Brand names are provided for representation/understanding only and do not act as a formal prescription or recommendation.</p>
          </div>
        )}
        {/* ── Vitals ── */}
        {canSeeVitals && (
          <div className="border-b border-white/[0.07] px-8 py-6">
            <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.14em] text-white/90">
              🩺 Vitals
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {([
                { label: 'BLOOD PRESSURE', value: vitals.bloodPressure },
                { label: 'HEART RATE',     value: vitals.pulse         },
                { label: 'TEMPERATURE',    value: vitals.temperature   },
                { label: 'SPO2',           value: vitals.spo2          },
                { label: 'HEIGHT',         value: vitals.height        },
                { label: 'WEIGHT',         value: vitals.weight        },
              ] as const).map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                  <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-mist/55">{label}</p>
                  <p className={`mt-1 text-[13px] font-semibold ${value ? 'text-white' : 'text-mist/35'}`}>
                    {value || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Clinical Notes ── */}
        {hasNotes && (
          <div className="border-b border-white/[0.07] px-8 py-6">
            <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.14em] text-white/90">
              📋 Clinical Notes
            </p>
            <div className="space-y-3">
              {appointment.chiefComplaint && (
                <NoteRow label="CHIEF COMPLAINT"        value={appointment.chiefComplaint} />
              )}
              {appointment.notes && (
                <NoteRow label="DIAGNOSIS / ASSESSMENT" value={appointment.notes} />
              )}
              {appointment.plan && appointment.plan !== appointment.notes && (
                <NoteRow label="TREATMENT PLAN"         value={appointment.plan} />
              )}
            </div>
          </div>
        )}

        {/* ── Lab Orders ── */}
        {canSeeLabs && labs.length > 0 && (
          <div className="border-b border-white/[0.07] px-5 py-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
              🔬 Lab Orders
            </p>
            <div className="space-y-2">
              {labs.map((lab) => (
                <div
                  key={lab.id}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5"
                >
                  <span className="text-[13px] font-semibold text-white">{lab.label}</span>
                  <span className={`text-[11px] font-medium ${
                    lab.status === 'critical' ? 'text-red-300' :
                    lab.status === 'high'     ? 'text-amber-300' :
                    lab.status === 'low'      ? 'text-sky/80' :
                    'text-mist/65'
                  }`}>
                    {lab.value}{lab.unit ? ` ${lab.unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Adherence ── */}
        {accessLevel === 'full' && appointment.adherenceScore !== undefined && (
          <div className="border-b border-white/[0.07] px-5 py-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
              📊 Adherence
            </p>
            <p className="mb-2 text-[12px] text-mist/65">
              {appointment.adherenceScore}% compliance over last 30 days
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-neon/70 transition-all"
                style={{ width: `${Math.min(appointment.adherenceScore, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        {downloadError && (
          <div className="px-5 pt-5 text-sm text-rose-300">
            {downloadError}
          </div>
        )}
        <div className="modal-actions flex gap-3 px-5 py-5">
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="action-btn flex flex-1 items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
          >
            {isGenerating ? 'Preparing PDF...' : <><Download size={14} /> Download PDF</>}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ghost-btn flex-1 py-3 text-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
