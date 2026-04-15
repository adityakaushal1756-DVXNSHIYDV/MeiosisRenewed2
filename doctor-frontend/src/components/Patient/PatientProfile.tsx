import { ActivitySquare, HeartPulse, Phone, ShieldAlert, Siren, Stethoscope, UserCircle2 } from 'lucide-react';
import { Patient } from '../../types/Patient';

interface PatientProfileProps {
  patient: Patient | null;
  accessLevel: 'full' | 'lab' | 'summary' | null;
}

export function PatientProfile({ patient, accessLevel }: PatientProfileProps) {
  if (!patient) {
    return (
      <section className="glass-card p-5">
        <h2 className="section-title">Patient Profile</h2>
        <p className="mt-3 text-sm text-mist">Select a patient from queue, search, or MEIOSIS scan to view the clinical summary.</p>
      </section>
    );
  }

  const canSeeVitals = accessLevel === "full" || accessLevel === "summary";
  const canSeeRisk = accessLevel === "full";

  const hasAllergies = patient.allergies.length > 0;
  const hasConditions = patient.chronicConditions.length > 0;
  const riskTone = !canSeeRisk
    ? "Access Restricted"
    : hasAllergies
      ? "Needs allergy review"
      : hasConditions
        ? "Chronic follow-up context"
        : "Low known risk";

  const bp = canSeeVitals
    ? patient.vitals.bloodPressure || "Not recorded"
    : "Restricted";
  const pulseSpo2 = canSeeVitals
    ? [patient.vitals.pulse, patient.vitals.spo2]
        .filter(Boolean)
        .join(" • ") || "Not recorded"
    : "Restricted";
  const tempWeight = canSeeVitals
    ? [patient.vitals.temperature, patient.vitals.weight]
        .filter(Boolean)
        .join(" • ") || "Not recorded"
    : "Restricted";

  const allergyDisplay = canSeeRisk
    ? patient.allergies.join(", ") || "No known allergy"
    : "Restricted";
  const conditionDisplay = canSeeRisk
    ? patient.chronicConditions.join(", ") || "No chronic condition"
    : "Restricted";

  return (
    <section className="glass-card relative overflow-hidden p-5">
      <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-neon/[0.09] blur-3xl" />

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[22px] border border-wire/10 bg-white/[0.04] text-neon">
            <UserCircle2 size={26} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.22em] text-neon/70">
                Patient Snapshot
              </p>
              <span
                className={`chip ${!canSeeRisk ? "chip-red" : hasAllergies ? "chip-red" : hasConditions ? "chip-amber" : "chip-green"}`}
              >
                {riskTone}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {patient.name}
            </h2>
            <p className="mt-1 text-sm text-mist">
              {patient.id} • {patient.age} years • {patient.gender}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Opening reason: <span className="text-white">{patient.visitReason}</span>.
              Last recorded touchpoint was{" "}
              <span className="text-white">
                {patient.lastVisitDate || "not available"}
              </span>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-blue">Code {patient.meiosisCode}</span>
          <span className="chip border-wire/10 bg-white/[0.04] text-white/75">
            <Stethoscope size={12} />
            {patient.primaryDoctorName || "Primary doctor not tagged"}
          </span>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="soft-panel p-4">
          <div className="flex items-center gap-2 text-mist">
            <Phone size={14} />
            Contact
          </div>
          <div className="mt-3 text-sm font-medium text-white">
            {patient.phone || "Phone unavailable"}
          </div>
          <div className="text-sm text-mist">{patient.email || "Email unavailable"}</div>
        </div>
        <div className="soft-panel p-4">
          <div className="flex items-center gap-2 text-mist">
            <ShieldAlert size={14} />
            Allergy Flags
          </div>
          <div className="mt-3 text-sm font-medium text-white">{allergyDisplay}</div>
        </div>
        <div className="soft-panel p-4">
          <div className="flex items-center gap-2 text-mist">
            <HeartPulse size={14} />
            Chronic Conditions
          </div>
          <div className="mt-3 text-sm font-medium text-white">
            {conditionDisplay}
          </div>
        </div>
        <div className="soft-panel p-4">
          <div className="flex items-center gap-2 text-mist"><ActivitySquare size={14} />Recent Visit Context</div>
          <div className="mt-3 text-sm font-medium text-white">{patient.lastVisitDate || 'No date logged'}</div>
          <div className="text-sm text-mist">{patient.visitReason}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-wire/8 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-mist">Blood pressure</div>
            <span className="chip border-wire/10 bg-slate-950/30 text-white/70">Triage</span>
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{bp}</div>
        </div>
        <div className="rounded-3xl border border-wire/8 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-mist">Pulse / SpO2</div>
            <span className="chip border-wire/10 bg-slate-950/30 text-white/70">Monitoring</span>
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{pulseSpo2}</div>
        </div>
        <div className="rounded-3xl border border-wire/8 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-mist">Temp / Weight</div>
            <span className="chip border-wire/10 bg-slate-950/30 text-white/70">Baseline</span>
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{tempWeight}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-wire/8 bg-slate-950/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <Siren size={16} className="text-amber-300" />
            Quick clinical reading
          </div>
          <p className="text-sm leading-6 text-white/78">
            {!canSeeRisk 
              ? 'Clinical summary restricted by patient.'
              : hasAllergies
                ? `Review allergy precautions before medication updates. Logged allergies: ${patient.allergies.join(', ')}.`
                : hasConditions
                  ? `Longitudinal follow-up matters here. Active chronic context includes ${patient.chronicConditions.join(', ')}.`
                  : 'No major allergy or chronic-condition warning is surfaced in the current snapshot.'}
          </p>
        </div>
        <div className="rounded-3xl border border-wire/8 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-mist">Record coverage</div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 px-3 py-3">
              <div className="text-lg font-semibold text-white">{canSeeRisk ? patient.history.length : '-'}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-mist">Visits</div>
            </div>
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 px-3 py-3">
              <div className="text-lg font-semibold text-white">{canSeeRisk ? patient.prescriptions.length : '-'}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-mist">Rx</div>
            </div>
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 px-3 py-3">
              <div className="text-lg font-semibold text-white">{canSeeRisk || accessLevel === 'lab' ? patient.medicalReports.length : '-'}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-mist">Reports</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
