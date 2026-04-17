import { ActivitySquare, HeartPulse, Phone, ShieldAlert, Siren, Stethoscope, UserCircle2, Mail, Hash, Thermometer, Gauge, Activity, Lock, Database } from 'lucide-react';
import { Patient } from '../../types/Patient';

interface PatientProfileProps {
  patient: Patient | null;
  accessLevel: 'full' | 'lab' | 'summary' | null;
}

export function PatientProfile({ patient, accessLevel }: PatientProfileProps) {
  if (!patient) {
    return (
      <section className="glass-card flex h-full flex-col items-center justify-center p-8 text-center border-dashed border-wire/20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] border border-wire/10 bg-white/[0.04] text-mist/40">
          <UserCircle2 size={32} />
        </div>
        <h2 className="text-lg font-semibold text-white/50">Patient Snapshot</h2>
        <p className="mt-2 max-w-[240px] text-sm text-mist/40">Select a record to visualize clinical intelligence and biometric data.</p>
      </section>
    );
  }

  const canSeeVitals = accessLevel === "full" || accessLevel === "summary";
  const canSeeRisk = accessLevel === "full";

  const hasAllergies = patient.allergies.length > 0;
  const hasConditions = patient.chronicConditions.length > 0;
  
  const riskStatus = !canSeeRisk 
    ? { label: "Access Restricted", tone: "red" }
    : hasAllergies 
      ? { label: "Critical Allergies", tone: "red" } 
      : hasConditions 
        ? { label: "Chronic Context", tone: "amber" } 
        : { label: "Routine Care", tone: "green" };

  return (
    <section className="relative flex flex-col gap-6">
      
      {/* TIER 1: IDENTITY HEADER (Full Width) */}
      <div className="glass-card relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent p-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-48 w-48 rounded-full bg-neon/[0.07] blur-3xl" />
        
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[24px] border border-wire/15 bg-slate-950/40 text-neon shadow-xl">
            <UserCircle2 size={32} strokeWidth={1.5} />
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-mist/50">Clinical Snapshot</span>
              <span className={`chip chip-${riskStatus.tone} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider`}>
                {riskStatus.label}
              </span>
              <span className="chip border-wire/10 bg-white/5 text-[10px] font-mono tracking-tight text-mist/70">
                {patient.meiosisCode}
              </span>
            </div>
            
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white leading-none">
              {patient.name}
            </h2>
            
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mist/70">
              <span className="flex items-center gap-1.5"><Hash size={12} className="text-white/20" />{patient.id}</span>
              <span className="h-1 w-1 rounded-full bg-wire/20" />
              <span>{patient.age} years</span>
              <span className="h-1 w-1 rounded-full bg-wire/20" />
              <span className="capitalize">{patient.gender}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-wire/10 bg-white/[0.03] px-4 py-2 text-mist/80">
            <Stethoscope size={16} className="text-neon/60" />
            <span className="text-xs font-semibold">{patient.primaryDoctorName || "Unassigned"}</span>
          </div>
        </div>
      </div>

      {/* TIER 2: BIOMETRIC TELEMETRY & CONTEXT (8+4 Grid) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        
        {/* Left: Telemetry (8 cols) */}
        <div className="xl:col-span-8">
          <div className="glass-panel h-full p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-mist/40">
                <Gauge size={14} /> Biometric Telemetry
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neon/40">
                <div className="h-1 w-1 animate-pulse rounded-full bg-neon/80" />
                Live Sync Active
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* BP Card */}
              <div className="relative h-28 overflow-hidden rounded-[24px] border border-wire/8 bg-white/[0.02] p-4 group transition-all hover:bg-white/[0.04]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-mist/30">Blood Pressure</div>
                {canSeeVitals ? (
                  <div className="mt-2.5 text-2xl font-bold text-white tracking-tight">{patient.vitals.bloodPressure || "--/--"}</div>
                ) : (
                  <div className="mt-2.5 flex items-center gap-2 text-mist/30">
                    <Lock size={16} /><span className="text-[13px] font-medium tracking-wide">Secure</span>
                  </div>
                )}
                <div className="mt-auto pt-2 text-[9px] text-neon/40 font-bold uppercase tracking-widest">Triage Unit</div>
                <Activity size={20} className="absolute bottom-4 right-4 text-white/[0.03] group-hover:text-neon/10 transition-colors" />
              </div>

              {/* Heart/O2 Card */}
              <div className="relative h-28 overflow-hidden rounded-[24px] border border-wire/8 bg-white/[0.02] p-4 group transition-all hover:bg-white/[0.04]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-mist/30">Heart Rate / SpO2</div>
                {canSeeVitals ? (
                  <div className="mt-2.5 text-2xl font-bold text-white tracking-tight">{patient.vitals.pulse || "--"} <span className="text-sm font-medium text-mist/40">/ {patient.vitals.spo2 || "--"}%</span></div>
                ) : (
                  <div className="mt-2.5 flex items-center gap-2 text-mist/30">
                    <Lock size={16} /><span className="text-[13px] font-medium tracking-wide">Secure</span>
                  </div>
                )}
                <div className="mt-auto pt-2 text-[9px] text-sky-400/40 font-bold uppercase tracking-widest">Stable Mode</div>
                <HeartPulse size={20} className="absolute bottom-4 right-4 text-white/[0.03] group-hover:text-sky-400/10 transition-colors" />
              </div>

              {/* Temp/Weight Card */}
              <div className="relative h-28 overflow-hidden rounded-[24px] border border-wire/8 bg-white/[0.02] p-4 group transition-all hover:bg-white/[0.04]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-mist/30">Temp / Weight</div>
                {canSeeVitals ? (
                  <div className="mt-2.5 text-2xl font-bold text-white tracking-tight">{patient.vitals.temperature || "--"}° <span className="text-sm font-medium text-mist/40">/ {patient.vitals.weight || "--"}kg</span></div>
                ) : (
                  <div className="mt-2.5 flex items-center gap-2 text-mist/30">
                    <Lock size={16} /><span className="text-[13px] font-medium tracking-wide">Secure</span>
                  </div>
                )}
                <div className="mt-auto pt-2 text-[9px] text-amber-400/40 font-bold uppercase tracking-widest">Baseline</div>
                <Thermometer size={20} className="absolute bottom-4 right-4 text-white/[0.03] group-hover:text-amber-400/10 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Context (4 cols) */}
        <div className="xl:col-span-4">
          <div className="glass-panel h-full p-5 flex flex-col">
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-mist/40">Patient Context</div>
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-wire/8 text-mist/60"><Phone size={14} /></div>
                <div>
                  <div className="text-xs font-semibold text-white/90">{patient.phone || "No phone"}</div>
                  <div className="text-[10px] text-mist/50">{patient.email || "No email"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-wire/8 text-mist/60"><ActivitySquare size={14} /></div>
                <div>
                  <div className="text-xs font-semibold text-white/90">{patient.lastVisitDate || "No visit history"}</div>
                  <div className="text-[10px] text-mist/50 line-clamp-1">{patient.visitReason}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TIER 3: CLINICAL INTELLIGENCE HUB (Full Width 3-Panel Grid) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:grid-cols-12">
        
        {/* Panel 1: Safety Alerts */}
        <div className="glass-panel p-5 border-l-4 border-l-red-500/30 md:col-span-4 flex flex-col">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400/80">
            <ShieldAlert size={14} /> Safety Warnings
          </div>
          <div className="space-y-4 flex-1">
            <div className="rounded-xl bg-white/[0.02] p-3 border border-wire/5">
              <div className="text-[9px] font-bold text-mist/30 uppercase tracking-widest mb-1.5">Allergies</div>
              <div className="text-[13px] font-medium text-white/90">
                {!canSeeRisk ? <span className="text-mist/30 italic">Restricted</span> : (patient.allergies.join(", ") || "No known flags")}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.02] p-3 border border-wire/5">
              <div className="text-[9px] font-bold text-mist/30 uppercase tracking-widest mb-1.5">Chronic Context</div>
              <div className="text-[13px] font-medium text-white/90">
                {!canSeeRisk ? <span className="text-mist/30 italic">Restricted</span> : (patient.chronicConditions.join(", ") || "No clinical markers")}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: MEIOSIS Insights */}
        <div className="glass-panel relative overflow-hidden p-5 border-l-4 border-l-neon/30 md:col-span-5 bg-gradient-to-br from-neon/[0.02] to-transparent flex flex-col">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neon/70">
            <Siren size={14} /> Augmented Intelligence
          </div>
          <p className="text-[13px] leading-6 text-white/80 pr-4">
            {!canSeeRisk 
              ? 'High-level clinical summary is unavailable for restricted profiles.'
              : hasAllergies
                ? `Critical: Cross-reference ${patient.allergies.join(', ')} with the active formula before confirming prescription rows.`
                : hasConditions
                  ? `Maintenance focus: Patient is managing ${patient.chronicConditions.join(', ')}. Review longitudinal trends for deviation.`
                  : 'Clinical snapshot confirms no outlier clinical safety markers for the current observation period.'}
          </p>
          <div className="mt-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neon/40 pt-4 border-t border-wire/5">
            <ActivitySquare size={12} /> Insight Engine v1.4
          </div>
        </div>

        {/* Panel 3: Data Coverage & Coverage Logic */}
        <div className="glass-panel p-5 bg-slate-950/20 md:col-span-3 flex flex-col">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-mist/40">
            <Database size={14} /> Data Coverage
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="flex flex-col items-center justify-center rounded-[20px] border border-wire/8 bg-white/[0.02] py-2 transition-all hover:bg-white/[0.04]">
              <div className="text-lg font-bold text-white leading-none">{canSeeRisk ? patient.history.length : '-'}</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-mist/40 mt-1.5">Visits</div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-[20px] border border-wire/8 bg-white/[0.02] py-2 transition-all hover:bg-white/[0.04]">
              <div className="text-lg font-bold text-white">{canSeeRisk ? patient.prescriptions.length : '-'}</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-mist/40 mt-1.5">Rx</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-neon/10 bg-neon/5 py-2">
            <ShieldAlert size={12} className="text-neon/50" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-neon/70">Secure Medical Sync</span>
          </div>
        </div>

      </div>
    </section>
  );
}
