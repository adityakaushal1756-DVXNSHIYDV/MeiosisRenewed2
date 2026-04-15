import { FileText, ScanLine, Shuffle, UserRoundSearch } from 'lucide-react';
import { useState } from 'react';
import { Patient } from '../../types/Patient';

interface NFCScannerProps {
  scannedPatient: Patient | null;
  onRandomScan: () => void;
  onCodeScan: (code: string) => void;
  onViewRecords: (patientId: string) => void;
}

const demoCodes = ['12345678', '12345677', '12345666'];

export function NFCScanner({ scannedPatient, onRandomScan, onCodeScan, onViewRecords }: NFCScannerProps) {
  const [manualCode, setManualCode] = useState('');

  return (
    <section className="glass-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="section-title">MEIOSIS Code Scan</h2>
          <p className="section-copy">Mock patient access flow replacing NFC for this prototype.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="action-btn gap-2" onClick={onRandomScan}>
            <Shuffle size={16} />
            Simulate NFC Scan
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="soft-panel relative overflow-hidden p-5">
          <div className="absolute inset-x-8 top-10 h-px bg-gradient-to-r from-transparent via-neon/70 to-transparent" />
          <div className="absolute left-8 right-8 top-10 h-14 animate-pulse rounded-full bg-gradient-to-b from-neon/20 to-transparent blur-xl" />
          <div className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-[2rem] border border-neon/25 bg-slate-950/40 shadow-[0_0_60px_rgba(82,255,157,0.12)]">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[1.5rem] border border-dashed border-neon/40">
              <span className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-neon/70" />
              <ScanLine className="text-neon" size={32} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {demoCodes.map((code) => (
              <button key={code} className="ghost-btn" onClick={() => onCodeScan(code)}>
                Scan {code}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              className="input-shell"
              placeholder="Enter MEIOSIS code"
            />
            <button className="ghost-btn whitespace-nowrap" onClick={() => onCodeScan(manualCode)}>
              Open patient
            </button>
          </div>
        </div>

        <div className="soft-panel p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl border border-wire/10 bg-white/[0.04] p-3 text-neon">
              <UserRoundSearch size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Latest scanned patient</h3>
              <p className="text-sm text-mist">Opens profile, history, and EMR instantly.</p>
            </div>
          </div>

          {scannedPatient ? (
            <div className="space-y-3 text-sm text-white/85">
              <div className="rounded-2xl border border-neon/15 bg-neonSoft/60 p-4">
                <div className="text-lg font-semibold text-white">{scannedPatient.name}</div>
                <div className="mt-1 text-mist">{scannedPatient.id} • Code {scannedPatient.meiosisCode}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-wire/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-mist">Last Visit</div>
                  <div className="mt-2 font-medium text-white">{scannedPatient.lastVisitDate}</div>
                </div>
                <div className="rounded-2xl border border-wire/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-mist">Reason</div>
                  <div className="mt-2 font-medium text-white">{scannedPatient.visitReason}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onViewRecords(scannedPatient.id)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neon/20 bg-neonSoft py-2.5 text-sm font-medium text-neon transition hover:border-neon/40 hover:bg-neon/15"
              >
                <FileText size={15} />
                View Records
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-wire/10 bg-white/[0.02] p-6 text-sm text-mist">
              No scan yet. Trigger a simulated scan to open a mock consultation instantly.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
