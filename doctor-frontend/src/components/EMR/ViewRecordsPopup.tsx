import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  CalendarDays,
  FileText,
  FlaskConical,
  Pill,
  ScanLine,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { assetUrl } from '../../lib/api';
import type {
  Patient,
  PatientMedicalReport,
  PatientPastAppointment,
  PatientPrescriptionRecord,
} from '../../types/Patient';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type DetailPayload =
  | { kind: 'medication'; data: PatientPrescriptionRecord }
  | { kind: 'visit';      data: PatientPastAppointment }
  | { kind: 'lab';        data: PatientMedicalReport };

type ListKind = 'medications' | 'visits' | 'labs';

/* ─────────────────────────────────────────────
   Tiny helpers
───────────────────────────────────────────── */
const _TIMING_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Night'] as const;
function patternLabel(code: string | undefined): string {
  if (!code || !/^[01]{4}$/.test(code)) return '';
  const slots = code.split('').map((b, i) => b === '1' ? _TIMING_SLOTS[i] : null).filter(Boolean);
  return slots.length ? slots.join(' + ') : '';
}
function StatusBadge({ status }: { status: string }) {
  const colour =
    status === 'Active' || status === 'Completed'
      ? 'bg-[#e8f97a] text-[#4a5a00]'
      : status === 'Cancelled' || status === 'Expired'
      ? 'bg-red-100 text-red-700'
      : 'bg-[#f0f0ec] text-[#666]';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colour}`}>
      {status}
    </span>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aaa]">{label}</div>
      <div className="mt-0.5 text-[13px] text-[#1a1a1a]">{value}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Detail popup content per type
───────────────────────────────────────────── */
function MedicationDetail({ rx }: { rx: PatientPrescriptionRecord }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-[#e8f97a] p-2">
              <Pill size={15} className="text-[#4a5a00]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#1a1a1a]">{rx.title}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <StatusBadge status={rx.status} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4">
        <Field label="Prescribed" value={rx.prescribedOn} />
        <Field label="Doctor" value={rx.doctorName} />
      </div>
      {rx.summary && (
        <div className="rounded-2xl bg-white p-4">
          <Field label="Summary" value={rx.summary} />
        </div>
      )}
      {rx.medicines.length > 0 && (
        <div className="rounded-2xl bg-white p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aaa]">Medicines</div>
          <div className="space-y-2">
            {rx.medicines.map((med, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px] text-[#1a1a1a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8c840] flex-shrink-0" />
                {med}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VisitDetail({ appt }: { appt: PatientPastAppointment }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#1a1a1a] p-2">
          <CalendarDays size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-[#1a1a1a]">{appt.purpose || appt.diagnosis || 'Office Visit'}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <StatusBadge status={appt.status} />
            <span className="rounded-full bg-[#f0f0ec] px-2 py-0.5 text-[10px] font-medium text-[#666]">{appt.mode}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4">
        <Field label="Date" value={appt.date} />
        <Field label="Doctor" value={appt.doctorName} />
        <Field label="Specialty" value={appt.specialty} />
      </div>
      {(appt.chiefComplaint || appt.symptoms || appt.diagnosis) && (
        <div className="space-y-3 rounded-2xl bg-white p-4">
          <Field label="Chief Complaint" value={appt.chiefComplaint} />
          <Field label="Symptoms" value={appt.symptoms} />
          <Field label="Diagnosis" value={appt.diagnosis} />
        </div>
      )}
      {appt.medications && appt.medications.length > 0 && (
        <div className="rounded-2xl bg-white p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aaa]">Medications</div>
          <div className="space-y-2">
            {appt.medications.map((med, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="font-medium text-[#1a1a1a]">{med.name}</span>
                <span className="text-[#888]">
                  {med.dose} · <span className="font-mono text-[11px]">{med.frequency}</span>
                  {patternLabel(med.frequency) && <span className="text-[#aaa]"> ({patternLabel(med.frequency)})</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {(appt.notes || appt.followUp) && (
        <div className="space-y-3 rounded-2xl bg-white p-4">
          <Field label="Notes" value={appt.notes} />
          <Field label="Follow-up" value={appt.followUp} />
        </div>
      )}
    </div>
  );
}

function LabDetail({ report }: { report: PatientMedicalReport }) {
  const iconMap: Record<PatientMedicalReport['category'], typeof FlaskConical> = {
    Lab: FlaskConical,
    Imaging: Activity,
    Consultation: FileText,
    Discharge: FileText,
  };
  const Icon = iconMap[report.category];
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#1a1a1a] p-2">
          <Icon size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-[#1a1a1a]">{report.title}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e8f97a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4a5a00]">
              {report.category}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4">
        <Field label="Date" value={report.reportDate} />
        <Field label="Doctor" value={report.doctorName} />
        <Field label="File" value={report.fileLabel} />
      </div>
      {report.summary && (
        <div className="rounded-2xl bg-white p-4">
          <Field label="Summary" value={report.summary} />
        </div>
      )}
      {report.documentPath && (
        <a
          href={assetUrl(report.documentPath)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-2xl border border-[#1a1a1a]/10 bg-white px-4 py-3 text-[13px] font-semibold text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white"
        >
          <ScanLine size={14} /> View Document
        </a>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared detail popup shell
───────────────────────────────────────────── */
function DetailPopup({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 z-[20] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-y-auto rounded-[24px] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        style={{ backgroundColor: '#dfdfd7', maxHeight: '75vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a]/8 text-[#555] transition hover:bg-[#1a1a1a]/14"
        >
          <X size={14} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   List popup shells per type
───────────────────────────────────────────── */
function MedicationListPopup({
  prescriptions,
  onClose,
  onSelect,
}: {
  prescriptions: PatientPrescriptionRecord[];
  onClose: () => void;
  onSelect: (rx: PatientPrescriptionRecord) => void;
}) {
  return (
    <div
      className="absolute inset-0 z-[10] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.14)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
        style={{ backgroundColor: '#dfdfd7', maxHeight: '78vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <Pill size={15} className="text-[#888]" />
            <span className="text-[14px] font-bold text-[#1a1a1a]">All Medications</span>
            <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-semibold text-white">{prescriptions.length}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 transition hover:bg-black/[0.06]">
            <X size={14} className="text-[#555]" />
          </button>
        </div>
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(78vh - 60px)' }}>
          {prescriptions.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#aaa]">No medications on record.</p>
          ) : (
            <div className="space-y-2">
              {prescriptions.map((rx) => (
                <button
                  key={rx.id}
                  type="button"
                  onClick={() => onSelect(rx)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left transition hover:bg-[#f5f5f0]"
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${rx.status === 'Active' ? 'bg-[#e8f97a]' : 'bg-[#f0f0ec]'}`}>
                    <Pill size={14} className={rx.status === 'Active' ? 'text-[#4a5a00]' : 'text-[#aaa]'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[#1a1a1a] truncate">{rx.title}</div>
                    <div className="text-[11px] text-[#888] truncate">{rx.medicines.slice(0, 2).join(', ')}</div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={rx.status} />
                    <span className="text-[10px] text-[#bbb]">{rx.prescribedOn}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VisitListPopup({
  appointments,
  onClose,
  onSelect,
}: {
  appointments: PatientPastAppointment[];
  onClose: () => void;
  onSelect: (a: PatientPastAppointment) => void;
}) {
  return (
    <div
      className="absolute inset-0 z-[10] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.14)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
        style={{ backgroundColor: '#dfdfd7', maxHeight: '78vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-[#888]" />
            <span className="text-[14px] font-bold text-[#1a1a1a]">All Visits</span>
            <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-semibold text-white">{appointments.length}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 transition hover:bg-black/[0.06]">
            <X size={14} className="text-[#555]" />
          </button>
        </div>
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(78vh - 60px)' }}>
          {appointments.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#aaa]">No visits on record.</p>
          ) : (
            <div className="space-y-2">
              {appointments.map((appt) => (
                <button
                  key={appt.id}
                  type="button"
                  onClick={() => onSelect(appt)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left transition hover:bg-[#f5f5f0]"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#1a1a1a]">
                    <CalendarDays size={14} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[#1a1a1a] truncate">{appt.purpose || appt.diagnosis || 'Office Visit'}</div>
                    <div className="text-[11px] text-[#888]">{appt.specialty} · {appt.mode}</div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={appt.status} />
                    <span className="text-[10px] text-[#bbb]">{appt.date}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LabListPopup({
  reports,
  onClose,
  onSelect,
}: {
  reports: PatientMedicalReport[];
  onClose: () => void;
  onSelect: (r: PatientMedicalReport) => void;
}) {
  const iconMap: Record<PatientMedicalReport['category'], typeof FlaskConical> = {
    Lab: FlaskConical,
    Imaging: Activity,
    Consultation: FileText,
    Discharge: FileText,
  };
  return (
    <div
      className="absolute inset-0 z-[10] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.14)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
        style={{ backgroundColor: '#dfdfd7', maxHeight: '78vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <FlaskConical size={15} className="text-[#888]" />
            <span className="text-[14px] font-bold text-[#1a1a1a]">All Reports</span>
            <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-semibold text-white">{reports.length}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 transition hover:bg-black/[0.06]">
            <X size={14} className="text-[#555]" />
          </button>
        </div>
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(78vh - 60px)' }}>
          {reports.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#aaa]">No reports on record.</p>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => {
                const Icon = iconMap[report.category];
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => onSelect(report)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left transition hover:bg-[#f5f5f0]"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#f0f0ec]">
                      <Icon size={14} className="text-[#888]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#1a1a1a] truncate">{report.title}</div>
                      <div className="text-[11px] text-[#888] truncate">{report.summary}</div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className="rounded-full bg-[#e8f97a] px-2 py-0.5 text-[10px] font-semibold text-[#4a5a00]">{report.category}</span>
                      <span className="text-[10px] text-[#bbb]">{report.reportDate}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Wavy canvas background animation
───────────────────────────────────────────── */
function WavyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;

    const waves = [
      { amp: 16, freq: 0.016, speed: 0.55, yBase: 0.12, alpha: 0.18, lw: 2.5 },
      { amp: 28, freq: 0.011, speed: 0.35, yBase: 0.28, alpha: 0.15, lw: 3.2 },
      { amp: 12, freq: 0.023, speed: 0.82, yBase: 0.44, alpha: 0.22, lw: 1.8 },
      { amp: 34, freq: 0.008, speed: 0.27, yBase: 0.59, alpha: 0.13, lw: 3.8 },
      { amp: 20, freq: 0.018, speed: 0.66, yBase: 0.73, alpha: 0.19, lw: 2.4 },
      { amp: 10, freq: 0.029, speed: 1.05, yBase: 0.88, alpha: 0.16, lw: 1.5 },
    ];

    type Dot = { wx: number; wIdx: number; phase: number; r: number; alpha: number };
    const dots: Dot[] = Array.from({ length: 34 }, () => ({
      wx:    Math.random(),
      wIdx:  Math.floor(Math.random() * waves.length),
      phase: Math.random() * Math.PI * 2,
      r:     1.2 + Math.random() * 2.4,
      alpha: 0.06 + Math.random() * 0.18,
    }));

    function setSize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);

    function draw() {
      if (!ctx || !canvas) return;
      const { width: W, height: H } = canvas;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, W, H);

      waves.forEach((w) => {
        ctx.beginPath();
        ctx.lineWidth   = w.lw * dpr;
        ctx.strokeStyle = `rgba(0,0,0,${w.alpha})`;
        for (let px = 0; px <= W; px += 3) {
          const y = w.yBase * H + Math.sin(px * w.freq + t * w.speed) * w.amp * dpr;
          px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
      });

      dots.forEach((d) => {
        const w     = waves[d.wIdx];
        const px    = d.wx * W;
        const y     = w.yBase * H + Math.sin(px * w.freq + t * w.speed + d.phase) * w.amp * dpr;
        const pulse = 0.72 + 0.28 * Math.sin(t * 1.4 + d.phase);
        ctx.beginPath();
        ctx.arc(px, y, d.r * dpr * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${d.alpha})`;
        ctx.fill();
      });

      t += 0.018;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '280px',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Stack carousel — latest card front, rest peek behind
───────────────────────────────────────────── */
const CARD_W   = 130;
const CARD_H   = 96;
const PEEK     = 24;
const MAX_PEEK = 2;

function StackCarousel({ cards }: { cards: React.ReactNode[] }) {
  const [active, setActive] = useState(0);
  const ptrStart = useRef(0);
  const dragging = useRef(false);
  const n = cards.length;

  const onDown = (e: React.PointerEvent) => {
    ptrStart.current = e.clientX;
    dragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (Math.abs(e.clientX - ptrStart.current) > 8) dragging.current = true;
  };
  const onUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - ptrStart.current;
    if (dx < -32) setActive(a => Math.min(n - 1, a + 1));
    if (dx >  32) setActive(a => Math.max(0, a - 1));
    dragging.current = false;
  };

  const peekSlots = Math.min(n - 1 - active, MAX_PEEK);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          position: 'relative',
          width: CARD_W + peekSlots * PEEK,
          height: CARD_H,
          overflow: 'hidden',
          flexShrink: 0,
          cursor: n > 1 ? 'grab' : 'default',
          userSelect: 'none',
          touchAction: 'pan-y',
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        {cards.map((card, i) => {
          const rel      = i - active;
          const isActive = rel === 0;
          const isPast   = rel < 0;
          const isFar    = rel > MAX_PEEK;
          const tx = isPast ? -(CARD_W * 1.2) : isFar ? CARD_W + MAX_PEEK * PEEK + 20 : rel * PEEK;
          const scale   = isActive ? 1 : Math.max(0.78, 1 - rel * 0.07);
          const zIndex  = isPast || isFar ? 0 : MAX_PEEK + 4 - rel;
          const opacity = isPast || isFar ? 0 : isActive ? 1 : Math.max(0.55, 1 - rel * 0.25);
          return (
            <div key={i} style={{
              position: 'absolute', left: 0, bottom: 0,
              width: CARD_W, height: CARD_H,
              transform: `translateX(${tx}px) scale(${scale})`,
              transformOrigin: 'bottom left',
              zIndex, opacity,
              transition: 'transform 0.42s cubic-bezier(0.34,1.35,0.64,1), opacity 0.28s ease',
              pointerEvents: isActive ? 'auto' : 'none',
            }}>
              {card}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {cards.map((_, i) => (
            <button key={i} type="button" onClick={() => setActive(i)}
              style={{
                width: i === active ? 16 : 5, height: 5, borderRadius: 3,
                background: i === active ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.18)',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'width 0.28s ease, background 0.2s ease',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dock section cards (the bottom 3 panels)
───────────────────────────────────────────── */
function DockSection({
  title,
  onSectionClick,
  children,
}: {
  title: string;
  onSectionClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="dock-panel flex flex-col pt-5 pb-5 px-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(32px) saturate(200%) brightness(1.06)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%) brightness(1.06)',
        borderTop: '1px solid rgba(255,255,255,0.55)',
        borderLeft: '1px solid rgba(255,255,255,0.18)',
        borderRight: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.45)',
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[15px] font-bold tracking-tight text-[#1a1a1a]">{title}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSectionClick(); }}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition-opacity hover:opacity-80"
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {/* Horizontal scroll row */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Item cards inside the dock
───────────────────────────────────────────── */
function MedDockCard({ rx, onClick }: { rx: PatientPrescriptionRecord; onClick: () => void }) {
  const active = rx.status === 'Active';
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex flex-shrink-0 flex-col gap-2.5 rounded-[18px] p-3 text-left transition-opacity hover:opacity-90 ${
        active ? 'bg-[#d8ef60]/10' : 'bg-white/[0.04]'
      }`}
      style={{
        width: CARD_W, height: CARD_H,
        backdropFilter: 'blur(18px) saturate(180%) brightness(1.04)',
        WebkitBackdropFilter: 'blur(18px) saturate(180%) brightness(1.04)',
        border: active ? '1px solid rgba(200,220,60,0.30)' : '1px solid rgba(255,255,255,0.40)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.50)',
      }}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? 'bg-white/40' : 'bg-white/30'}`}>
        <Pill size={14} className={active ? 'text-[#4a5a00]' : 'text-[#777]'} />
      </div>
      <div>
        <div className="truncate text-[12px] font-bold leading-tight text-[#1a1a1a]">{rx.title}</div>
        <div className="mt-0.5 truncate text-[10px] text-[#888]">{rx.medicines[0] ?? '—'}</div>
      </div>
    </button>
  );
}

function VisitDockCard({ appt, onClick, highlight }: { appt: PatientPastAppointment; onClick: () => void; highlight?: boolean }) {
  const shortDate = (() => {
    const d = new Date(appt.date);
    if (isNaN(d.getTime())) return appt.date;
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
  })();
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex flex-shrink-0 flex-col gap-2.5 rounded-[18px] p-3 text-left transition-opacity hover:opacity-90 ${
        highlight ? 'bg-[#d8ef60]/10' : 'bg-white/[0.04]'
      }`}
      style={{
        width: CARD_W, height: CARD_H,
        backdropFilter: 'blur(18px) saturate(180%) brightness(1.04)',
        WebkitBackdropFilter: 'blur(18px) saturate(180%) brightness(1.04)',
        border: highlight ? '1px solid rgba(200,220,60,0.30)' : '1px solid rgba(255,255,255,0.40)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.50)',
      }}
    >
      <div className="text-[10px] font-semibold text-[#888]">{shortDate}</div>
      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/60">
          <CalendarDays size={12} className="text-[#555]" />
        </div>
        <div className="min-w-0">
          <div className="line-clamp-2 text-[11px] font-bold leading-tight text-[#1a1a1a]">
            {appt.purpose || appt.diagnosis || 'Office Visit'}
          </div>
          <div className="mt-0.5 truncate text-[9px] text-[#888]">{appt.mode}</div>
        </div>
      </div>
    </button>
  );
}

function LabDockCard({ report, onClick }: { report: PatientMedicalReport; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex flex-shrink-0 flex-col justify-between gap-2.5 rounded-[18px] bg-white/[0.04] p-3 text-left transition-opacity hover:opacity-90"
      style={{
        width: CARD_W, height: CARD_H,
        backdropFilter: 'blur(18px) saturate(180%) brightness(1.04)',
        WebkitBackdropFilter: 'blur(18px) saturate(180%) brightness(1.04)',
        border: '1px solid rgba(255,255,255,0.40)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.50)',
      }}
    >
      <div>
        <div className="truncate text-[12px] font-bold leading-tight text-[#1a1a1a]">{report.title}</div>
        {report.summary && (
          <div className="mt-0.5 line-clamp-1 text-[10px] text-[#888]">{report.summary}</div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-4 rounded-full bg-[#e8f97a]" />
        <div className="h-4 w-4 rounded-full bg-[#d0d0cc]" />
        <div className="h-3 w-3 rounded-full bg-[#b0b0aa]" />
        <div className="h-2 w-2 rounded-full bg-[#888884]" />
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Empty state card
───────────────────────────────────────────── */
function EmptyCard({ label }: { label: string }) {
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-[18px] bg-black/[0.04]" style={{ width: CARD_W, height: CARD_H }}>
      <span className="text-[11px] text-[#bbb]">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main export
───────────────────────────────────────────── */
interface ViewRecordsPopupProps {
  patient: Patient;
  onClose: () => void;
}

const DEMO_TEXT = `The human cardiovascular system is a complex and finely tuned network of organs, vessels, and electrical pathways that sustains life through continuous circulation of blood. At its core lies the heart, a muscular organ roughly the size of a fist, divided into four chambers: the right atrium, right ventricle, left atrium, and left ventricle. Each chamber serves a distinct role in directing blood either toward the lungs for oxygenation or outward to the rest of the body.

Deoxygenated blood returns from the body through the superior and inferior vena cava, entering the right atrium before being pushed into the right ventricle, which then contracts to send blood through the pulmonary arteries into the lungs. Within the lungs, carbon dioxide is exchanged for oxygen across thin alveolar membranes. Freshly oxygenated blood returns via the pulmonary veins to the left atrium, flows into the left ventricle, and is then pumped with considerable force through the aorta to supply all major organs and tissues.

The heart's rhythm is governed by an intrinsic electrical conduction system. The sinoatrial node, located in the right atrium, acts as the natural pacemaker, generating electrical impulses that spread across both atria, causing them to contract. The impulse then passes through the atrioventricular node, is briefly delayed, and continues down the bundle of His and into the Purkinje fibers, triggering coordinated ventricular contraction. This precise sequence ensures efficient pumping and prevents arrhythmias under normal conditions.

Blood pressure, the force exerted by circulating blood against arterial walls, is maintained through a balance of cardiac output and vascular resistance. Hormones such as adrenaline, angiotensin, and aldosterone modulate this balance by adjusting heart rate, vessel constriction, and fluid retention. Disruptions to these mechanisms underlie conditions like hypertension, heart failure, and arrhythmia, which remain leading causes of morbidity worldwide.`;

export function ViewRecordsPopup({ patient, onClose }: ViewRecordsPopupProps) {
  const [listView, setListView] = useState<ListKind | null>(null);
  const [detail, setDetail] = useState<DetailPayload | null>(null);

  const labs = patient.medicalReports;

  function openDetail(payload: DetailPayload) {
    setListView(null);
    setDetail(payload);
  }

  return (
    <div className="relative h-full overflow-hidden" style={{ backgroundColor: '#dfdfd7' }}>

      {/* ── Left scrollable text panel — starts below top bar, behind dock ── */}
      <div
        className="absolute left-0 z-0 overflow-y-auto px-7 py-4"
        style={{ width: '320px', top: '68px', height: 'calc(100vh - 68px)' }}
      >
        <p className="whitespace-pre-line text-[13px] leading-[1.9] tracking-[0.01em]" style={{ color: 'rgb(0, 0, 0)' }}>{DEMO_TEXT}</p>
      </div>

      {/* ── Top bar ── */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#1a1a1a]">{patient.name}</h2>
          <p className="text-[11px] text-[#888]">{patient.age} · {patient.gender} · {patient.id}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a]/8 text-[#555] transition hover:bg-[#1a1a1a]/14"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Wavy animation canvas (z-5, between text and dock) ── */}
      <WavyCanvas />

      {/* ── Bottom dock — absolute, on top of text ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 grid grid-cols-3 gap-[10px]">

        {/* Medications */}
        <DockSection
          title="Medications"
          onSectionClick={() => { setDetail(null); setListView('medications'); }}
        >
          {patient.prescriptions.length === 0 ? (
            <EmptyCard label="No medications" />
          ) : (
            patient.prescriptions.map((rx) => (
              <MedDockCard
                key={rx.id}
                rx={rx}
                onClick={() => openDetail({ kind: 'medication', data: rx })}
              />
            ))
          )}
        </DockSection>

        {/* Visits */}
        <DockSection
          title="Visits"
          onSectionClick={() => { setDetail(null); setListView('visits'); }}
        >
          {patient.pastAppointments.length === 0 ? (
            <EmptyCard label="No visits" />
          ) : (
            patient.pastAppointments.map((appt, i) => (
              <VisitDockCard
                key={appt.id}
                appt={appt}
                highlight={i === 0}
                onClick={() => openDetail({ kind: 'visit', data: appt })}
              />
            ))
          )}
        </DockSection>

        {/* Labs / Reports */}
        <DockSection
          title="Labs"
          onSectionClick={() => { setDetail(null); setListView('labs'); }}
        >
          {labs.length === 0 ? (
            <EmptyCard label="No reports" />
          ) : (
            labs.map((report) => (
              <LabDockCard
                key={report.id}
                report={report}
                onClick={() => openDetail({ kind: 'lab', data: report })}
              />
            ))
          )}
        </DockSection>
      </div>

      {/* ── List popups (z-20) ── */}
      {listView === 'medications' && !detail && (
        <MedicationListPopup
          prescriptions={patient.prescriptions}
          onClose={() => setListView(null)}
          onSelect={(rx) => openDetail({ kind: 'medication', data: rx })}
        />
      )}
      {listView === 'visits' && !detail && (
        <VisitListPopup
          appointments={patient.pastAppointments}
          onClose={() => setListView(null)}
          onSelect={(a) => openDetail({ kind: 'visit', data: a })}
        />
      )}
      {listView === 'labs' && !detail && (
        <LabListPopup
          reports={labs}
          onClose={() => setListView(null)}
          onSelect={(r) => openDetail({ kind: 'lab', data: r })}
        />
      )}

      {/* ── Detail popup (z-20, on top of list) ── */}
      {detail && (
        <DetailPopup onClose={() => setDetail(null)}>
          {detail.kind === 'medication' && <MedicationDetail rx={detail.data} />}
          {detail.kind === 'visit'      && <VisitDetail appt={detail.data} />}
          {detail.kind === 'lab'        && <LabDetail report={detail.data} />}
        </DetailPopup> 
      )}
    </div>
  );
}
