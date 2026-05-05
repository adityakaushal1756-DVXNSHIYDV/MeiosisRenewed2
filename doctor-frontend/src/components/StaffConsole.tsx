import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Lock, ShieldCheck, ChevronRight, Search, X, Loader2, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl, getAuthHeader } from '../lib/api';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface StaffConsoleProps {
  doctorId: string;
  onClose: () => void;
  showToast: (success: boolean, message: string) => void;
}

export function StaffConsole({ doctorId, onClose, showToast }: StaffConsoleProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECEPTION'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMode, setSuccessMode] = useState(false);

  const roles = [
    { id: 'RECEPTION', label: 'Reception', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { id: 'NURSE', label: 'Nurse', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { id: 'REGISTRAR', label: 'Registrar', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { id: 'RESIDENT', label: 'Resident', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { id: 'INTERN', label: 'Intern', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' }
  ];

  const fetchStaff = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const url = apiUrl(`/doctors/${doctorId}/staff`);
      const authHeader = getAuthHeader();
      
      const res = await fetch(url, {
        headers: authHeader
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[StaffConsole] Fetch failed:', res.status, errorData);
        throw new Error(errorData.error || `Error ${res.status}`);
      }
      
      const data = await res.json();
      setStaffList(data);
    } catch (err: any) {
      console.error('[StaffConsole] fetchStaff error:', err);
      setFetchError(err.message);
      showToast(false, 'Unable to load clinic staff.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) fetchStaff();
  }, [doctorId]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      showToast(false, 'Doctor session is missing. Please re-login.');
      return;
    }
    console.log('[StaffConsole] Attempting to add staff for doctor:', doctorId, formData);
    setIsSubmitting(true);
    try {
      const url = apiUrl(`/doctors/${doctorId}/staff`);
      console.log('[StaffConsole] Target URL:', url);
      
      const authHeader = getAuthHeader();
      console.log('[StaffConsole] Auth Header:', authHeader);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify(formData)
      });
      
      console.log('[StaffConsole] Response status:', res.status);
      const text = await res.text();
      console.log('[StaffConsole] Raw response:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Server returned an invalid response.');
      }

      if (!res.ok) throw new Error(data.error || 'Failed to add staff');
      
      setSuccessMode(true);
      setStaffList(prev => [...prev, data]);
      setFormData({ name: '', email: '', password: '', role: 'RECEPTION' });
      
      setTimeout(() => {
        setSuccessMode(false);
        setIsAdding(false);
        showToast(true, `Successfully onboarded ${data.name}`);
      }, 2000);
    } catch (err: any) {
      showToast(false, err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Users className="text-purple-400" />
            Clinic Staff Registry
          </h2>
          <p className="text-sm text-mist/60 mt-1">Manage your clinic's workforce and access roles.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-2xl font-bold text-sm hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20"
        >
          <UserPlus size={18} />
          Add Staff Member
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-mist/40" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-mist/30 focus:border-purple-500/50 outline-none transition-all"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-mist/40">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Syncing staff records...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-[32px] flex items-center justify-center mb-6 border border-dashed border-red-500/20 text-red-500/40">
              <X size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">Connection Failed</h3>
            <p className="text-sm text-mist/40 max-w-xs mt-2 mb-8">
              We couldn't reach the clinic database. Please check your connection and try again.
            </p>
            <button 
              onClick={() => fetchStaff()}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredStaff.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map(staff => {
              const roleInfo = roles.find(r => r.id === staff.role) || roles[0];
              return (
                <motion.div 
                  key={staff.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-mist/40 group-hover:scale-110 transition-transform">
                      <UserCircle2 size={24} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{staff.name}</h3>
                  <p className="text-xs text-mist/50 flex items-center gap-2 mb-4">
                    <Mail size={12} />
                    {staff.email}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] text-mist/30 font-medium">Added {new Date(staff.createdAt).toLocaleDateString()}</span>
                    <button className="text-xs font-bold text-purple-400 hover:text-white transition-colors">Manage Permissions</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mb-6 border border-dashed border-white/10 text-mist/20">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">No Staff Found</h3>
            <p className="text-sm text-mist/40 max-w-xs mt-2">
              {searchQuery ? "No staff members match your search criteria." : "Start building your clinic's workforce by adding your first staff member."}
            </p>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#0F172A]/90 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-2xl"
            >
              <AnimatePresence mode="wait">
                {successMode ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="p-20 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                      >
                        <ShieldCheck size={48} className="text-emerald-400" />
                      </motion.div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Staff Saved</h2>
                    <p className="text-mist">Credentials generated and role linked successfully.</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="p-8 pb-0 flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Add Staff Member</h2>
                        <p className="text-mist/60 mt-1">Onboard a new member to your clinic team.</p>
                      </div>
                      <button 
                        onClick={() => setIsAdding(false)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-mist hover:text-white hover:bg-white/10 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleAddStaff} className="p-8 space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-mist/50 ml-1 mb-2 block">Full Name</label>
                          <div className="relative">
                            <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-mist/40" size={18} />
                            <input 
                              required
                              type="text" 
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="John Doe"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-purple-500/50 transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-mist/50 ml-1 mb-2 block">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-mist/40" size={18} />
                              <input 
                                required
                                type="email" 
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="john@clinic.com"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-purple-500/50 transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-mist/50 ml-1 mb-2 block">Temporary Password</label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-mist/40" size={18} />
                              <input 
                                required
                                type="password" 
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-purple-500/50 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-mist/50 ml-1 mb-2 block">Organizational Role</label>
                          <div className="grid grid-cols-3 gap-2">
                            {roles.map(role => (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                                className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                                  formData.role === role.id 
                                    ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20' 
                                    : 'bg-white/5 border-white/5 text-mist/60 hover:bg-white/10 hover:border-white/10'
                                }`}
                              >
                                {role.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button 
                          type="button"
                          onClick={() => setIsAdding(false)}
                          className="flex-1 py-4 rounded-2xl font-bold text-mist hover:text-white hover:bg-white/5 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 py-4 bg-purple-500 text-white rounded-2xl font-bold shadow-xl shadow-purple-500/20 hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="animate-spin" size={20} />
                              Adding Staff...
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={20} />
                              Confirm Onboarding
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
