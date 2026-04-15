import { useState, Fragment } from 'react';
import { Download } from 'lucide-react';
import type { AppointmentEntry } from './types';
import { assetUrl } from '../../lib/api';

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

/* ── Two shared primitives matching PrescriptionModal in EMRTimeline ── */

function MetaTile({
  label, value, border, topBorder,
}: {
  label: string; value: string; border?: boolean; topBorder?: boolean;
}) {
  return (
    <div className={[
      'bg-white/[0.02] px-4 py-3',
      border    ? 'border-l border-white/[0.07]' : '',
      topBorder ? 'border-t border-white/[0.07]' : '',
    ].join(' ')}>
      <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-mist/55">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-white">{value || '—'}</p>
    </div>
  );
}

function NoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-[160px] flex-shrink-0 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist/55">
        {label}
      </span>
      <p className="flex-1 text-[13px] leading-6 text-white/80">{value}</p>
    </div>
  );
}

export function SidePanel({ appointment, onClose, accessLevel = 'full' }: SidePanelProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  function toggleNote(id: string) {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const canSeeLabs = accessLevel === 'full' || accessLevel === 'lab';
  const canSeeMeds = accessLevel === 'full';
  const canSeeNotes = accessLevel === 'full';
  const canSeeVitals = accessLevel === 'full' || accessLevel === 'summary';

  const meds    = (canSeeMeds ? (appointment.prescriptions ?? []) : []);
  const vitals  = (canSeeVitals ? (appointment.vitals ?? {}) : {});
  const labs    = (canSeeLabs ? (appointment.labs ?? []) : []);
  const docPath = canSeeMeds ? appointment.documentPath : undefined;

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
        className="w-full max-w-[700px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1520] shadow-[0_32px_100px_rgba(0,0,0,0.75)]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Hero ── */}
        <div className="border-b border-white/[0.07] px-6 pt-6 pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neon/70">
            MEIOSIS PRESCRIPTION
          </p>
          <h3 className="mt-1.5 text-[18px] font-bold leading-snug text-white">
            {appointment.type || 'Consultation Record'}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              isActive
                ? 'bg-neon/[0.13] text-neon'
                : 'bg-white/[0.07] text-white/55'
            }`}>
              {statusLabel}
            </span>
            <span className="text-[12px] text-mist/65">{dateRange}</span>
          </div>
        </div>

        {/* ── Meta tiles ── */}
        <div className="grid grid-cols-4 border-b border-white/[0.07]">
          <MetaTile label="DOCTOR"         value={appointment.doctor    ?? '—'} />
          <MetaTile label="SPECIALTY"      value={appointment.specialty ?? '—'} border />
          <MetaTile label="FOLLOW-UP DATE" value={fmtDate(appointment.endDate)} border />
          <MetaTile
            label="DURATION"
            value={appointment.durationDays ? `${appointment.durationDays} days` : '—'}
            border
          />
        </div>

        {/* ── Medications table ── */}
        {canSeeMeds && (
          <div className="border-b border-white/[0.07] px-5 py-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
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
                                title={expandedNotes.has(med.id) ? 'Hide note' : 'Show note'}
                                aria-expanded={expandedNotes.has(med.id)}
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
          <div className="border-b border-white/[0.07] px-5 py-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
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
          <div className="border-b border-white/[0.07] px-5 py-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
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
        <div className="flex gap-3 px-5 py-5">
          {docPath && (
            <a
              href={assetUrl(docPath)}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn flex flex-1 items-center justify-center gap-2 py-3 text-sm"
            >
              <Download size={14} /> Download PDF
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`ghost-btn py-3 text-sm ${docPath ? 'flex-1' : 'w-full'}`}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
