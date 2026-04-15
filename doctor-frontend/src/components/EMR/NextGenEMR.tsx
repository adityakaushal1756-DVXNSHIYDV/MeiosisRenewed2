import { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Plus, PlusCircle, Search, ShieldAlert, Stethoscope, X,
} from 'lucide-react';
import type { Patient } from '../../types/Patient';
import { buildTimeline, parseDateLabel, toTs, type TimelineEvent } from './EMRTimeline';
import { BodyMap, getEventSystems } from './BodyMap';
import { HorizontalTimeline } from './HorizontalTimeline';
import { MedicationDock } from './MedicationDock';

/* ─── Smart summary ─── */
function buildSummary(patient: Patient): string {
  const parts: string[] = [];
  const demo = `${patient.age}y ${patient.gender.toLowerCase()}`;
  const conds = patient.chronicConditions.slice(0, 2).join(', ');
  parts.push(conds ? `${demo} · ${conds}` : demo);

  const lastAppt = [...patient.pastAppointments].sort((a, b) => toTs(b.date) - toTs(a.date))[0];
  if (lastAppt) {
    const date = parseDateLabel(lastAppt.date).top;
    const event = lastAppt.diagnosis || lastAppt.symptoms || lastAppt.purpose;
    if (event) parts.push(`Last visit ${date} — ${event.slice(0, 55)}${event.length > 55 ? '…' : ''}`);
  }
  return parts.join('  ·  ');
}

/* ─── Emergency mode view ─── */
function EmergencyView({ patient, onExit }: { patient: Patient; onExit: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-6 bg-white">
      {/* Banner */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={18} className="text-red-500" />
          <span className="text-sm font-bold text-red-700 tracking-wide">Emergency Mode — Critical Info Only</span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-100"
        >
          <X size={11} /> Exit
        </button>
      </div>

      {/* 3-column critical cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Allergies */}
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600">
            <AlertTriangle size={10} /> Allergies
          </div>
          {patient.allergies.length === 0 ? (
            <p className="text-xs text-[#aaa] italic">None recorded</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map(a => (
                <span key={a} className="rounded-full border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-700">{a}</span>
              ))}
            </div>
          )}
        </div>

        {/* Active medications */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
            <Activity size={10} /> Active Medications
          </div>
          {patient.prescriptions.filter(r => r.status === 'Active').length === 0 ? (
            <p className="text-xs text-[#aaa] italic">None recorded</p>
          ) : (
            <div className="space-y-1.5">
              {patient.prescriptions.filter(r => r.status === 'Active').flatMap(rx =>
                rx.medicines.map((m, i) => (
                  <div key={`${rx.id}-${i}`} className="rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#555]">{m}</div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
            <Stethoscope size={10} /> Chronic Conditions
          </div>
          {patient.chronicConditions.length === 0 ? (
            <p className="text-xs text-[#aaa] italic">None recorded</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {patient.chronicConditions.map(c => (
                <span key={c} className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">{c}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vitals */}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#aaa]">Latest Vitals</div>
        <div className="flex flex-wrap gap-6">
          {[
            { label: 'BP', value: patient.vitals.bloodPressure },
            { label: 'HR', value: patient.vitals.pulse },
            { label: 'Temp', value: patient.vitals.temperature },
            { label: 'SpO₂', value: patient.vitals.spo2 },
            { label: 'Height', value: patient.vitals.height },
            { label: 'Weight', value: patient.vitals.weight },
          ].filter(v => v.value).map(v => (
            <div key={v.label} className="text-center">
              <div className="text-[9px] text-[#bbb] uppercase tracking-wide">{v.label}</div>
              <div className="mt-0.5 text-sm font-bold text-[#1a1a1a]">{v.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab type ─── */
type Tab = 'Overview' | 'Notes' | 'Documents' | 'Labs' | 'Imaging';
const TABS: Tab[] = ['Overview', 'Notes', 'Documents', 'Labs', 'Imaging'];

/* ─── Avatar placeholder circles ─── */
function AvatarStrip() {
  /* 4 small circular avatar placeholders + a "+" add button */
  const AVATAR_COLORS = ['#c8b89a', '#b0a890', '#d4c0a8', '#c0b498'];
  return (
    <div className="flex items-center flex-shrink-0">
      <div className="flex items-center" style={{ gap: '-8px' }}>
        {AVATAR_COLORS.map((color, i) => (
          <div
            key={i}
            className="rounded-full border-2 border-[#e5e0d4] flex-shrink-0"
            style={{
              width: '35px',
              height: '35px',
              backgroundColor: color,
              marginLeft: i === 0 ? '0' : '-8px',
              zIndex: AVATAR_COLORS.length - i,
              position: 'relative',
            }}
          />
        ))}
      </div>
      <button
        type="button"
        title="Add team member"
        className="flex items-center justify-center rounded-full bg-[#1a1a1a] text-white flex-shrink-0 transition hover:bg-black"
        style={{ width: '35px', height: '35px', marginLeft: '-8px', zIndex: 0, position: 'relative' }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

/* ─── Main component ─── */
interface NextGenEMRProps {
  patient: Patient | null;
  onBuildEMR: () => void;
  onClose?: () => void;
}

export function NextGenEMR({ patient, onBuildEMR, onClose }: NextGenEMRProps) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  const allEvents = useMemo(
    () => (patient ? buildTimeline(patient) : []),
    [patient],
  );

  const filteredEvents = useMemo(() => {
    if (!activeSystem) return allEvents;
    return allEvents.filter((ev) => getEventSystems(ev).includes(activeSystem));
  }, [allEvents, activeSystem]);

  /* No patient */
  if (!patient) {
    return (
      <div className="flex h-full items-center justify-center bg-[#dfdfd7] rounded-[24px]">
        <div className="text-center">
          <div className="mb-4 inline-flex rounded-2xl border border-black/[0.08] bg-white p-5 text-[#ccc]">
            <Stethoscope size={32} />
          </div>
          <p className="text-sm font-semibold text-[#888]">No patient selected</p>
          <p className="mt-1 text-xs text-[#bbb]">Search or scan an NFC code to open a record.</p>
        </div>
      </div>
    );
  }

  const summary = buildSummary(patient);
  const hasAlerts = patient.allergies.length > 0 || patient.chronicConditions.length > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#dfdfd7]">

      {/* ── macOS-style window chrome ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-3 pb-1">
        <button
          type="button"
          title="Close window"
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] transition-all duration-100 hover:brightness-90 active:scale-95"
        />
        <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d4a118]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#14a629]" />
        <span className="ml-2 text-[11px] font-medium text-[#999] select-none">
          EMR Records{patient ? ` — ${patient.name}` : ''}
        </span>
      </div>

      {/* ── Full-width top navigation bar ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 border-b border-black/[0.07]">

        {/* FAR LEFT: avatar strip */}
        <AvatarStrip />

        {/* CENTER: pill-shaped tab group */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1 rounded-full border border-black/[0.07] bg-white px-1 py-1 shadow-sm">
            {TABS.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-5 py-2 text-[12px] font-medium transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-[#1a1a1a] text-white shadow-sm'
                    : 'text-[#666] hover:text-[#1a1a1a]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* FAR RIGHT: search */}
        <div className="flex items-center gap-2 rounded-lg border border-black/[0.1] bg-white/70 px-3 py-1.5 flex-shrink-0 min-w-[160px]">
          <Search size={11} className="text-[#bbb] flex-shrink-0" />
          <span className="text-[10px] text-[#ccc]">Search patient</span>
        </div>
      </div>

      {/* ── Patient info strip ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2 border-b border-black/[0.05]">
        {/* Patient info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="text-[13px] font-bold text-[#1a1a1a]">{patient.name}</h2>
            <span className="text-[11px] text-[#888]">{patient.age} · {patient.gender}</span>
            <span className="font-mono text-[9px] text-[#aaa]">{patient.meiosisCode}</span>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-[#aaa]">{summary}</p>
        </div>

        {/* Alert chips */}
        {hasAlerts && !emergencyMode && (
          <div className="hidden items-center gap-1.5 lg:flex">
            {patient.allergies.slice(0, 2).map(a => (
              <span key={a} className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-medium text-red-600">
                {a}
              </span>
            ))}
            {patient.chronicConditions.slice(0, 2).map(c => (
              <span key={c} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-medium text-blue-600">
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {/* Filter notice when active system */}
          {activeSystem && !emergencyMode && (
            <div className="flex items-center gap-2 rounded-full border border-black/[0.07] bg-white px-3 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#e8e040]" />
              <span className="text-[9px] text-[#888]">
                Filter ·{' '}
                <span className="font-semibold text-[#555]">{filteredEvents.length} records</span>
              </span>
              <button
                type="button"
                title="Clear body system filter"
                onClick={() => { setActiveSystem(null); setSelectedEvent(null); }}
                className="text-[9px] text-[#bbb] transition hover:text-[#555]"
              >
                <X size={9} />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setEmergencyMode(v => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition ${
              emergencyMode
                ? 'border-red-300 bg-red-100 text-red-700'
                : 'border-black/[0.1] bg-white text-[#888] hover:border-red-300 hover:text-red-600'
            }`}
          >
            <ShieldAlert size={11} />
            {emergencyMode ? 'Emergency On' : 'Emergency'}
          </button>
          <button
            type="button"
            onClick={onBuildEMR}
            className="flex items-center gap-1.5 rounded-lg border border-black/[0.12] bg-[#1a1a1a] px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-black"
          >
            <PlusCircle size={11} /> Build EMR
          </button>
        </div>
      </div>

      {/* ── Emergency mode overlay ── */}
      {emergencyMode ? (
        <EmergencyView patient={patient} onExit={() => setEmergencyMode(false)} />
      ) : activeTab !== 'Overview' ? (
        /* ── Blank page view for non-Overview tabs ── */
        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-8">
          <div
            className="w-full max-w-2xl rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.10)]"
            style={{ backgroundColor: '#dfdfd7', minHeight: '700px' }}
          />
        </div>
      ) : (
        <>
          {/* ── 2-zone main body ── */}
          <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr] divide-x divide-black/[0.06] overflow-hidden">

            {/* Zone A: Body Map (300px = 155px anatomy + 145px conditions list) */}
            <div className="overflow-hidden">
              <BodyMap
                patient={patient}
                events={allEvents}
                activeSystem={activeSystem}
                onSystemSelect={sys => {
                  setActiveSystem(sys);
                  setSelectedEvent(null);
                }}
              />
            </div>

            {/* Zone B: Horizontal Timeline */}
            <div className="min-w-0 overflow-hidden">
              <HorizontalTimeline
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
              />
            </div>

          </div>

          {/* ── Medication Dock ── */}
          <MedicationDock patient={patient} />
        </>
      )}

    </div>
  );
}
