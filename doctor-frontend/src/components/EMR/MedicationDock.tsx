import { useState } from 'react';
import { Activity, ArrowUpRight, FlaskConical, Pill, Settings2 } from 'lucide-react';
import type { Patient } from '../../types/Patient';

interface MedicationDockProps {
  patient: Patient | null;
}

const CRITICAL_KEYWORDS = [
  'warfarin', 'heparin', 'aspirin', 'clopidogrel', 'rivaroxaban', 'apixaban',
  'insulin', 'methotrexate', 'digoxin', 'lithium', 'phenytoin', 'amiodarone',
  'tacrolimus', 'cyclosporine', 'morphine', 'fentanyl', 'oxycodone',
];

function isCritical(name: string) {
  return CRITICAL_KEYWORDS.some(k => name.toLowerCase().includes(k));
}

export function MedicationDock({ patient }: MedicationDockProps) {
  const [medPeriod, setMedPeriod] = useState<'Weeks' | 'Months'>('Weeks');

  if (!patient) return null;

  const activeRxs = patient.prescriptions.filter(r => r.status === 'Active');
  const meds = activeRxs.flatMap(rx =>
    rx.medicines.map(name => ({
      name,
      rxTitle: rx.title,
      doctorName: rx.doctorName,
      critical: isCritical(name),
    }))
  );

  const recentVisits = [...patient.pastAppointments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const labReports = [...patient.medicalReports]
    .filter(r => r.category === 'Lab')
    .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
    .slice(0, 4);

  return (
    <div
      className="flex-shrink-0 flex border-t border-black/[0.08] bg-[#e5e0d4]"
      style={{ height: '120px' }}
    >

      {/* ── MEDICATIONS ── */}
      <div className="flex flex-col min-w-0 flex-1 border-r border-black/[0.08] px-4 py-2.5">
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <span className="text-[11px] font-bold text-[#1a1a1a]">Medications</span>
          {/* "Weeks ▼" pill button */}
          <button
            type="button"
            onClick={() => setMedPeriod(p => p === 'Weeks' ? 'Months' : 'Weeks')}
            className="ml-auto flex items-center gap-0.5 rounded-full border border-black/[0.12] bg-white px-2.5 py-0.5 text-[9px] font-medium text-[#555] hover:bg-black/[0.03] transition shadow-sm"
          >
            {medPeriod} <span className="text-[7px] opacity-60 ml-0.5">▼</span>
          </button>
          {/* Black circle expand button */}
          <button
            type="button"
            title="Expand medications"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition hover:bg-black flex-shrink-0"
          >
            <ArrowUpRight size={9} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
          {meds.length === 0 ? (
            <p className="text-[10px] text-[#bbb] italic self-center">No active medications</p>
          ) : meds.map((med, i) => (
            <div
              key={i}
              className={`flex-shrink-0 flex items-center gap-2 rounded-xl border bg-white px-2.5 py-1.5 ${med.critical ? 'border-red-200' : 'border-black/[0.07]'}`}
              style={{ minWidth: '145px', height: '52px' }}
            >
              {/* Pill icon in beige circle (36px) */}
              <div
                className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full ${med.critical ? 'bg-red-50' : 'bg-[#f0ece5]'}`}
              >
                <Pill size={14} className={med.critical ? 'text-red-500' : 'text-[#a09080]'} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-[#1a1a1a] truncate">{med.name}</div>
                <div className="text-[8.5px] text-[#aaa] truncate">{med.rxTitle.slice(0, 18)}</div>
              </div>
              <Settings2 size={10} className="flex-shrink-0 text-[#d0ccc6]" />
            </div>
          ))}
        </div>
      </div>

      {/* ── VISITS ── */}
      <div className="flex flex-col min-w-0 flex-1 border-r border-black/[0.08] px-4 py-2.5">
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <span className="text-[11px] font-bold text-[#1a1a1a]">Visits</span>
          {/* Black circle button with Activity icon */}
          <button
            type="button"
            title="View all visits"
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition hover:bg-black flex-shrink-0"
          >
            <Activity size={9} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
          {recentVisits.length === 0 ? (
            <p className="text-[10px] text-[#bbb] italic self-center">No visits</p>
          ) : recentVisits.map((visit, i) => {
            const d = new Date(visit.date);
            const dateLabel = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            const isFirst = i === 0;
            return (
              <div
                key={visit.id}
                className={`flex-shrink-0 flex flex-col justify-between rounded-xl border px-2.5 py-1.5 cursor-pointer transition-all ${
                  isFirst
                    ? 'border-[#1a1a1a] bg-[#1a1a1a]'
                    : 'border-black/[0.08] bg-white hover:border-black/[0.2]'
                }`}
                style={{ minWidth: '85px', height: '52px' }}
              >
                <div className={`text-[8px] ${isFirst ? 'text-white/50' : 'text-[#bbb]'}`}>{dateLabel}</div>
                <div>
                  <div className={`text-[9.5px] font-bold leading-tight ${isFirst ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    {(visit.purpose || visit.diagnosis || 'Visit').slice(0, 13)}
                  </div>
                  <div className={`text-[8px] mt-0.5 ${isFirst ? 'text-white/40' : 'text-[#ccc]'}`}>
                    {visit.mode === 'Teleconsult' ? 'Teleconsult' : 'Office visit'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LABS ── */}
      <div className="flex flex-col min-w-0 flex-1 px-4 py-2.5">
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <span className="text-[11px] font-bold text-[#1a1a1a]">Labs</span>
          {/* Black circle button with FlaskConical icon */}
          <button
            type="button"
            title="View all labs"
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition hover:bg-black flex-shrink-0"
          >
            <FlaskConical size={9} />
          </button>
        </div>
        <div className="space-y-1.5 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
          {labReports.length === 0 ? (
            <p className="text-[10px] text-[#bbb] italic">No lab results</p>
          ) : labReports.map((lab) => (
            <div key={lab.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-[#1a1a1a] truncate">{lab.title}</div>
                <div className="text-[8.5px] text-[#aaa]">{(lab.summary || lab.fileLabel || '').slice(0, 22)}</div>
              </div>
              {/* 4 dot indicators: yellow, gray, gray, black circle */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {[0, 1, 2, 3].map(j => (
                  <div
                    key={j}
                    className="rounded-full"
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: j === 0 ? '#e8e040' : j === 3 ? '#1a1a1a' : '#ddd',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
