import { useState, useEffect } from 'react';
import { User, Bell, Palette, LogOut, KeyRound, Edit3, SmartphoneNfc, Activity, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '../components/Sidebar';
import { useAuth } from '../lib/auth';
import { usePatientProfile } from '../hooks/usePatientProfile';
import { apiUrl, getAuthHeader } from '../lib/api';

export function SettingsPage() {
  const { session, logout } = useAuth();
  const { data: profile, isLoading, error, refresh } = usePatientProfile(session?.patientId);
  const [isEditingLifestyle, setIsEditingLifestyle] = useState(false);
  const [isSavingLifestyle, setIsSavingLifestyle] = useState(false);
  const [lifestyleForm, setLifestyleForm] = useState({
    breakfastTime: '',
    breakfastDetails: '',
    lunchTime: '',
    lunchDetails: '',
    dinnerTime: '',
    dinnerDetails: '',
    snacksDetails: '',
    sleepTime: '',
    wakeupTime: '',
    teaCoffeeDetails: '',
    exerciseHabits: '',
    smokingStatus: '',
    alcoholConsumption: '',
    lifestyleNotes: ''
  });

  useEffect(() => {
    if (profile) {
      setLifestyleForm({
        breakfastTime: profile.breakfastTime || '',
        breakfastDetails: profile.breakfastDetails || '',
        lunchTime: profile.lunchTime || '',
        lunchDetails: profile.lunchDetails || '',
        dinnerTime: profile.dinnerTime || '',
        dinnerDetails: profile.dinnerDetails || '',
        snacksDetails: profile.snacksDetails || '',
        sleepTime: profile.sleepTime || '',
        wakeupTime: profile.wakeupTime || '',
        teaCoffeeDetails: profile.teaCoffeeDetails || '',
        exerciseHabits: profile.exerciseHabits || '',
        smokingStatus: profile.smokingStatus || '',
        alcoholConsumption: profile.alcoholConsumption || '',
        lifestyleNotes: profile.lifestyleNotes || ''
      });
    }
  }, [profile]);

  const handleSaveLifestyle = async () => {
    if (!session?.patientId) return;
    setIsSavingLifestyle(true);
    try {
      const response = await fetch(apiUrl(`patient/${session.patientId}/lifestyle`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(lifestyleForm)
      });
      if (!response.ok) throw new Error('Failed to save lifestyle info');
      await refresh();
      setIsEditingLifestyle(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingLifestyle(false);
    }
  };

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
    <div className="patient-page patient-settings-page p-4 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-4xl mx-auto min-h-full flex flex-col">
      <header className="patient-page-header mb-6 mt-2 shrink-0">
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

          <div className="flex flex-wrap gap-2 md:gap-3">
            <button className="ghost-btn" disabled={isLoading}>Edit Profile</button>
            <button className="ghost-btn group" disabled={isLoading}><KeyRound className="w-4 h-4 mr-2 group-hover:text-neon" /> Change Password</button>
            <button className="ghost-btn group border-sky/30 text-sky hover:bg-sky/10" disabled={isLoading}><SmartphoneNfc className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Open NFC ID</button>
          </div>
        </div>

        {/* Notifications & Theme */}
        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
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

        {/* Lifestyle & Personal Info */}
        <div className="glass-card p-6 border border-wire/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <Edit3 
               className={cn("w-5 h-5 cursor-pointer transition-colors", isEditingLifestyle ? "text-neon" : "text-mist hover:text-white")} 
               onClick={() => setIsEditingLifestyle(!isEditingLifestyle)}
             />
          </div>
          
          <h2 className="section-title flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-sky" /> Lifestyle & Habit Profile
          </h2>

          {isEditingLifestyle ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-mist">Meal Timing</h3>
                   <div>
                     <label className="text-[10px] text-mist/60 uppercase block mb-1">Breakfast</label>
                     <input type="time" value={lifestyleForm.breakfastTime} onChange={e => setLifestyleForm({...lifestyleForm, breakfastTime: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky" />
                     <textarea placeholder="Breakfast details..." value={lifestyleForm.breakfastDetails} onChange={e => setLifestyleForm({...lifestyleForm, breakfastDetails: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-xs mt-2 min-h-[60px] outline-none" />
                   </div>
                   <div>
                     <label className="text-[10px] text-mist/60 uppercase block mb-1">Lunch</label>
                     <input type="time" value={lifestyleForm.lunchTime} onChange={e => setLifestyleForm({...lifestyleForm, lunchTime: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky" />
                     <textarea placeholder="Lunch details..." value={lifestyleForm.lunchDetails} onChange={e => setLifestyleForm({...lifestyleForm, lunchDetails: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-xs mt-2 min-h-[60px] outline-none" />
                   </div>
                   <div>
                     <label className="text-[10px] text-mist/60 uppercase block mb-1">Dinner</label>
                     <input type="time" value={lifestyleForm.dinnerTime} onChange={e => setLifestyleForm({...lifestyleForm, dinnerTime: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky" />
                     <textarea placeholder="Dinner details..." value={lifestyleForm.dinnerDetails} onChange={e => setLifestyleForm({...lifestyleForm, dinnerDetails: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-xs mt-2 min-h-[60px] outline-none" />
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-mist">Sleep & Drinks</h3>
                   <div>
                     <label className="text-[10px] text-mist/60 uppercase block mb-1">Wakeup Time</label>
                     <input type="time" value={lifestyleForm.wakeupTime} onChange={e => setLifestyleForm({...lifestyleForm, wakeupTime: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky" />
                   </div>
                   <div>
                     <label className="text-[10px] text-mist/60 uppercase block mb-1">Sleep Time</label>
                     <input type="time" value={lifestyleForm.sleepTime} onChange={e => setLifestyleForm({...lifestyleForm, sleepTime: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky" />
                   </div>
                   <div>
                     <label className="text-[10px] text-mist/60 uppercase block mb-1">Tea / Coffee / Beverages</label>
                     <textarea placeholder="e.g. 2 cups of tea, 1 black coffee..." value={lifestyleForm.teaCoffeeDetails} onChange={e => setLifestyleForm({...lifestyleForm, teaCoffeeDetails: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-sm min-h-[100px] outline-none" />
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-mist">Other Info</h3>
                   <div>
                     <label className="text-[10px] text-mist/60 uppercase block mb-1">Snacks & Cravings</label>
                     <textarea placeholder="Any mid-day snacks..." value={lifestyleForm.snacksDetails} onChange={e => setLifestyleForm({...lifestyleForm, snacksDetails: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-sm min-h-[80px] outline-none" />
                   </div>
                   <div>
                     <label className="text-[10px] text-mist/60 uppercase block mb-1">Exercise Habits</label>
                     <textarea placeholder="e.g. 30 mins walk, gym 3x week..." value={lifestyleForm.exerciseHabits} onChange={e => setLifestyleForm({...lifestyleForm, exerciseHabits: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-sm min-h-[60px] outline-none" />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-mist/60 uppercase block mb-1">Smoking</label>
                        <select value={lifestyleForm.smokingStatus} onChange={e => setLifestyleForm({...lifestyleForm, smokingStatus: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-2 py-2 text-white text-xs outline-none">
                          <option value="">Select...</option>
                          <option value="Never">Never</option>
                          <option value="Ex-smoker">Ex-smoker</option>
                          <option value="Current">Current</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-mist/60 uppercase block mb-1">Alcohol</label>
                        <select value={lifestyleForm.alcoholConsumption} onChange={e => setLifestyleForm({...lifestyleForm, alcoholConsumption: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-2 py-2 text-white text-xs outline-none">
                          <option value="">Select...</option>
                          <option value="None">None</option>
                          <option value="Occasional">Occasional</option>
                          <option value="Regular">Regular</option>
                        </select>
                      </div>
                   </div>
                   <div>
                     <label className="text-[10px] text-mist/60 uppercase block mb-1">General Lifestyle Notes</label>
                     <textarea placeholder="Any other medical info..." value={lifestyleForm.lifestyleNotes} onChange={e => setLifestyleForm({...lifestyleForm, lifestyleNotes: e.target.value})} className="w-full bg-white/5 border border-wire/10 rounded-lg px-3 py-2 text-white text-sm min-h-[80px] outline-none" />
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-wire/10">
                 <button onClick={() => setIsEditingLifestyle(false)} className="px-4 py-2 text-sm text-mist hover:text-white">Cancel</button>
                 <button 
                   onClick={handleSaveLifestyle} 
                   disabled={isSavingLifestyle}
                   className="px-6 py-2 bg-sky text-ink font-bold rounded-xl flex items-center gap-2 hover:bg-white transition-colors"
                 >
                   {isSavingLifestyle ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
                 </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-mist mb-2">Daily Meals</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                       <span className="text-xs text-white/50">Breakfast</span>
                       <div className="text-right">
                         <div className="text-xs text-white font-medium">{lifestyleForm.breakfastTime || '--:--'}</div>
                         <div className="text-[10px] text-mist italic max-w-[120px] truncate">{lifestyleForm.breakfastDetails || 'None'}</div>
                       </div>
                    </div>
                    <div className="flex justify-between items-start">
                       <span className="text-xs text-white/50">Lunch</span>
                       <div className="text-right">
                         <div className="text-xs text-white font-medium">{lifestyleForm.lunchTime || '--:--'}</div>
                         <div className="text-[10px] text-mist italic max-w-[120px] truncate">{lifestyleForm.lunchDetails || 'None'}</div>
                       </div>
                    </div>
                    <div className="flex justify-between items-start">
                       <span className="text-xs text-white/50">Dinner</span>
                       <div className="text-right">
                         <div className="text-xs text-white font-medium">{lifestyleForm.dinnerTime || '--:--'}</div>
                         <div className="text-[10px] text-mist italic max-w-[120px] truncate">{lifestyleForm.dinnerDetails || 'None'}</div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-mist mb-2">Rest & Fluids</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                       <span className="text-xs text-white/50">Wakeup</span>
                       <span className="text-xs text-white font-medium">{lifestyleForm.wakeupTime || '--:--'}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-xs text-white/50">Bedtime</span>
                       <span className="text-xs text-white font-medium">{lifestyleForm.sleepTime || '--:--'}</span>
                    </div>
                    <div>
                       <span className="text-xs text-white/50 block mb-1">Tea / Coffee</span>
                       <p className="text-[10px] text-mist leading-relaxed">{lifestyleForm.teaCoffeeDetails || 'None recorded'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-mist mb-2">Social & Activity</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                       <span className="text-xs text-white/50">Exercise</span>
                       <span className="text-xs text-white font-medium truncate max-w-[100px]">{lifestyleForm.exerciseHabits || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-xs text-white/50">Smoking</span>
                       <span className="text-xs text-white font-medium">{lifestyleForm.smokingStatus || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-xs text-white/50">Alcohol</span>
                       <span className="text-xs text-white font-medium">{lifestyleForm.alcoholConsumption || 'Not set'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-mist mb-2">General Notes</h4>
                  <div className="bg-white/[0.02] border border-wire/5 rounded-xl p-3 min-h-[60px]">
                     <p className="text-[10px] text-mist leading-relaxed italic">{lifestyleForm.lifestyleNotes || 'No notes.'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
