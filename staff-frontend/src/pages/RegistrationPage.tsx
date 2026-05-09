import React, { useState } from 'react';
import { UserPlus, User, Mail, Phone, Droplets, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';
import { GlassCard, Input, Button, Badge } from '../components/ui';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';

interface RegForm {
  name: string; email: string; phone: string;
  bloodGroup: string; address: string;
  emergencyContact: string; insurancePlan: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function RegistrationPage() {
  const { addToast } = useStore();
  const [form, setForm] = useState<RegForm>({ name: '', email: '', phone: '', bloodGroup: 'O+', address: '', emergencyContact: '', insurancePlan: 'Basic OPD' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ meiosisId: string; name: string } | null>(null);

  const setField = (k: keyof RegForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      addToast('error', 'Name, email, and phone are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        ...form,
        role: 'PATIENT',
        password: form.phone,
      });
      const data = res.data.user || res.data;
      setSuccess({ meiosisId: data.meiosisId || 'N/A', name: form.name });
      setForm({ name: '', email: '', phone: '', bloodGroup: 'O+', address: '', emergencyContact: '', insurancePlan: 'Basic OPD' });
    } catch (err: any) {
      addToast('error', err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header title="Patient Registration" subtitle="Rapid entry form" icon={<UserPlus size={16} />} />
        <div className="flex-1 flex items-center justify-center p-8">
          <GlassCard className="max-w-sm w-full p-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-black text-primary mb-1">Patient Registered</h2>
            <p className="text-sm text-secondary mb-4">{success.name} has been successfully onboarded.</p>
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-6">
              <p className="text-[10px] text-muted uppercase tracking-widest mb-1">Meiosis ID</p>
              <p className="text-xl font-black font-mono text-green-400">{success.meiosisId}</p>
            </div>
            <Button variant="primary" className="w-full justify-center" onClick={() => setSuccess(null)}>
              Register Another Patient
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Patient Registration"
        subtitle="Alt+N — Rapid entry form"
        icon={<UserPlus size={16} />}
        actions={<Badge variant="green">Rapid Entry</Badge>}
      />
      <div className="flex-1 overflow-y-auto custom-scroll p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <GlassCard className="p-6 mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400 mb-5">Patient Identity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name *" placeholder="Priya Sharma" value={form.name} onChange={e => setField('name', e.target.value)} icon={<User size={14} />} />
              <Input label="Phone Number *" placeholder="+91 98765 43210" value={form.phone} onChange={e => setField('phone', e.target.value)} icon={<Phone size={14} />} />
              <Input label="Email Address *" placeholder="patient@email.com" type="email" value={form.email} onChange={e => setField('email', e.target.value)} icon={<Mail size={14} />} className="md:col-span-2" />
            </div>
          </GlassCard>

          <GlassCard className="p-6 mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-5">Medical Profile</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Blood Group</p>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setField('bloodGroup', bg)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.bloodGroup === bg ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-white/[0.03] border-white/[0.08] text-muted hover:border-white/20'}`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Insurance Plan" placeholder="Basic OPD / Corporate" value={form.insurancePlan} onChange={e => setField('insurancePlan', e.target.value)} />
            </div>
          </GlassCard>

          <GlassCard className="p-6 mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-5">Contact & Emergency</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Home Address" placeholder="123 Main St, City" value={form.address} onChange={e => setField('address', e.target.value)} icon={<MapPin size={14} />} className="md:col-span-2" />
              <Input label="Emergency Contact" placeholder="+91 99999 00000" value={form.emergencyContact} onChange={e => setField('emergencyContact', e.target.value)} icon={<AlertCircle size={14} />} />
            </div>
          </GlassCard>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setForm({ name: '', email: '', phone: '', bloodGroup: 'O+', address: '', emergencyContact: '', insurancePlan: 'Basic OPD' })}>
              Clear Form
            </Button>
            <Button type="submit" variant="primary" loading={loading} icon={<UserPlus size={15} />}>
              Register Patient
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
