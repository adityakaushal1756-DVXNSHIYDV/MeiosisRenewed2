import React, { useState } from 'react';
import { Heart, Thermometer, Activity, Save, X } from 'lucide-react';
import { Modal, Button, Input } from '../components/ui';
import { useStore } from '../store/useStore';

interface TriageData {
  bp: string; hr: string; temp: string; spo2: string; weight: string; notes: string;
}

export function TriageModal() {
  const { triagePatientId, closeTriage, addToast } = useStore();
  const [data, setData] = useState<TriageData>({ bp: '', hr: '', temp: '', spo2: '', weight: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof TriageData, v: string) => setData(d => ({ ...d, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    addToast('success', 'Triage vitals recorded successfully.');
    setLoading(false);
    closeTriage();
  };

  return (
    <Modal
      isOpen={!!triagePatientId}
      onClose={closeTriage}
      title="Triage Input"
      subtitle="Record patient vitals on arrival"
      icon={<Activity size={16} />}
      iconBg="bg-blue-500/10 text-blue-400"
      width="max-w-lg"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 justify-center" onClick={closeTriage}>Cancel</Button>
          <Button variant="primary" className="flex-1 justify-center" loading={loading} icon={<Save size={14} />} onClick={handleSave}>
            Save Vitals
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Biometric Telemetry */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4">Biometric Telemetry</p>
          <div className="grid grid-cols-2 gap-3">
            <TriageField icon={<Activity size={14} />} label="Blood Pressure" placeholder="120/80" value={data.bp} onChange={v => set('bp', v)} unit="mmHg" />
            <TriageField icon={<Heart size={14} />} label="Heart Rate" placeholder="72" value={data.hr} onChange={v => set('hr', v)} unit="bpm" color="text-red-400" />
            <TriageField icon={<Thermometer size={14} />} label="Temperature" placeholder="98.6" value={data.temp} onChange={v => set('temp', v)} unit="°F" color="text-amber-400" />
            <TriageField icon={<Activity size={14} />} label="SpO₂" placeholder="98" value={data.spo2} onChange={v => set('spo2', v)} unit="%" color="text-cyan-400" />
          </div>
        </div>

        <Input label="Weight (kg)" placeholder="65" value={data.weight} onChange={e => set('weight', e.target.value)} />

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1.5">Clinical Notes</p>
          <textarea
            value={data.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Chief complaint, observed symptoms, urgency flags..."
            rows={3}
            className="input-base w-full py-2.5 px-3 text-sm resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

function TriageField({ icon, label, placeholder, value, onChange, unit, color = 'text-blue-400' }: {
  icon: React.ReactNode; label: string; placeholder: string; value: string;
  onChange: (v: string) => void; unit: string; color?: string;
}) {
  return (
    <div className="triage-field">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={color}>{icon}</span>
        <p className="triage-label text-[10px] font-bold uppercase tracking-widest text-muted transition-colors">{label}</p>
      </div>
      <div className="relative">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-base w-full py-2.5 pl-3 pr-12 text-sm font-mono"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted">{unit}</span>
      </div>
    </div>
  );
}
