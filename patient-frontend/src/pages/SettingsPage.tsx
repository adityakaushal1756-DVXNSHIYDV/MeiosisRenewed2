import { User, Bell, Palette, LogOut, KeyRound, Edit3, SmartphoneNfc, Activity, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '../components/Sidebar';
import { useAuth } from '../lib/auth';
import { usePatientProfile } from '../hooks/usePatientProfile';

export function SettingsPage() {
  const { session, logout } = useAuth();
  const { data: profile, isLoading, error } = usePatientProfile(session?.patientId);

  const renderAccountField = (label: string, value: string | undefined, isCode = false) => {
    if (isLoading) {
      return (
        <li className="flex flex-col sm:flex-row justify-between pb-3 border-b border-wire/10 gap-1 animate-pulse">
          <span className="text-mist w-32">{label}</span>
          <div className="h-4 w-32 bg-white/10 rounded" />
        </li>
      );
    }
    
    return (
      <li className="flex flex-col sm:flex-row justify-between pb-3 border-b border-wire/10 gap-1">
        <span className="text-mist w-32">{label}</span>
        {isCode ? (
          <div className="flex items-center gap-2">
            <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded border border-wire/10 tracking-widest">{value || 'Not Assigned'}</span>
            <button className="text-sky hover:text-white transition-colors" title="Edit Universal ID">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-white font-medium">{value || 'Not provided'}</span>
        )}
      </li>
    );
  };

  return (
    <div className="p-6 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-4xl mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Patient Settings</h1>
        <p className="text-mist">Manage profile, security, notifications, and preferences.</p>
      </header>

      <div className="flex-1 overflow-y-auto scroll-skin no-scrollbar pb-12 queue-scroll space-y-6">
        
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Account */}
        <div className="glass-card p-6 border border-wire/10">
          <h2 className="section-title flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-sky" /> Account Profile
          </h2>
          
          <ul className="space-y-4 text-sm mb-6">
            {renderAccountField('Name', profile?.name || session?.name)}
            {renderAccountField('Email', profile?.email || session?.email)}
            {renderAccountField('Phone', profile?.phone)}
            {renderAccountField('MEIOSIS Code', profile?.meiosisId, true)}
            {profile?.universalCode && profile.universalCode !== profile.meiosisId && (
              renderAccountField('Universal ID', profile.universalCode)
            )}
          </ul>

          <div className="flex flex-wrap gap-3">
            <button className="ghost-btn" disabled={isLoading}>Edit Profile</button>
            <button className="ghost-btn group" disabled={isLoading}><KeyRound className="w-4 h-4 mr-2 group-hover:text-neon" /> Change Password</button>
            <button className="ghost-btn group border-sky/30 text-sky hover:bg-sky/10" disabled={isLoading}><SmartphoneNfc className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Open NFC ID</button>
          </div>
        </div>

        {/* Notifications & Theme */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6 border border-wire/10">
            <h2 className="section-title flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-neon" /> Notifications
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Medication reminders', checked: true },
                { label: 'Appointment reminders', checked: true },
                { label: 'Lab report alerts', checked: true },
                { label: 'Promotional updates', checked: false }
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center transition-colors",
                    item.checked ? "bg-neon text-ink" : "border border-wire/30 group-hover:border-neon"
                  )}>
                    {item.checked && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7l2.5 3L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="text-white text-sm group-hover:text-neon transition-colors">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 border border-wire/10">
            <h2 className="section-title flex items-center gap-2 mb-6">
              <KeyRound className="w-5 h-5 text-sky" /> Typography
            </h2>
            <div className="mb-4">
              <label className="text-xs font-semibold text-mist mb-2 block">System Font Family</label>
              <select 
                value={localStorage.getItem('meiosis_font_v1') || 'plex'}
                onChange={(e) => {
                  localStorage.setItem('meiosis_font_v1', e.target.value);
                  window.location.reload();
                }}
                className="w-full bg-white/5 border border-wire/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none appearance-none cursor-pointer"
              >
                <option value="plex" className="bg-ink text-white">Clinical Precision (IBM Plex Sans)</option>
                <option value="instrument" className="bg-ink text-white">Technical Serious (Instrument Sans)</option>
                <option value="outfit" className="bg-ink text-white">Premium Display (Outfit)</option>
                <option value="inter" className="bg-ink text-white">Modern Professional (Inter)</option>
                <option value="manrope" className="bg-ink text-white">Clinical Technical (Manrope)</option>
                <option value="space" className="bg-ink text-white">High-Tech Laboratory (Space)</option>
              </select>
            </div>
            <p className="text-xs text-mist leading-relaxed">Select a professional font system tailored for clinical clarity and high-fidelity aesthetics.</p>
          </div>

          <div className="glass-card p-6 border border-wire/10">
            <h2 className="section-title flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5 text-purple-400" /> UI Theme
            </h2>
            <div className="mb-4">
              <label className="text-xs font-semibold text-mist mb-2 block">Theme Palette</label>
              <select 
                value={localStorage.getItem('meiosis_theme_v1') || 'super-dark'}
                onChange={(e) => {
                  localStorage.setItem('meiosis_theme_v1', e.target.value);
                  window.location.reload();
                }}
                className="w-full bg-white/5 border border-wire/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none appearance-none cursor-pointer"
              >
                <option value="super-dark" className="bg-ink text-white">Super Dark (Default)</option>
                <option value="dark" className="bg-ink text-white">Dark</option>
                <option value="green" className="bg-ink text-white">Green</option>
                <option value="orange" className="bg-ink text-white">Orange</option>
                <option value="violet" className="bg-ink text-white">Violet</option>
                <option value="light" className="bg-slate-100 text-slate-900">Light Mode</option>
              </select>
            </div>
            <p className="text-xs text-mist leading-relaxed hidden sm:block">Changes your dashboard's accent color and background glow. Glassmorphism adapts automatically.</p>
          </div>

          <div className="glass-card p-6 border border-neon/10 bg-neon/[0.01]">
            <h2 className="section-title flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-neon" /> Clinical Visualization
            </h2>
            <div className="mb-4">
              <label className="text-xs font-semibold text-mist mb-2 block">Timeline Engine</label>
              <select 
                value={localStorage.getItem('meiosis_timeline_v2') || 'modern'}
                onChange={(e) => {
                  localStorage.setItem('meiosis_timeline_v2', e.target.value);
                  window.dispatchEvent(new Event('storage'));
                  window.location.reload();
                }}
                className="w-full bg-white/5 border border-wire/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none appearance-none cursor-pointer"
              >
                <option value="modern" className="bg-ink text-white">Focus Timeline (Modern)</option>
                <option value="graphics" className="bg-ink text-white">Graphical Overview</option>
              </select>
            </div>
            <p className="text-xs text-mist leading-relaxed">Choose how your clinical history is visualized. 'Focus Timeline' provides an interactive node-based view inspired by doctor EMR systems.</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-card p-6 border-red-500/20 bg-gradient-to-r from-red-500/5 to-transparent flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold mb-1">Sign Out</h3>
            <p className="text-xs text-mist">End your current session across this device.</p>
          </div>
          <button 
            onClick={logout}
            className="action-btn !bg-red-500/20 !border-red-500/40 !text-red-300 hover:!bg-red-500/30 group"
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Logout
          </button>
        </div>

      </div>
    </div>
  );
}

