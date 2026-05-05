import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragEndEvent,
  DragStartEvent,
  DropAnimation
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  Search, 
  Plus, 
  Power, 
  Eye, 
  EyeOff, 
  LayoutGrid, 
  Users, 
  Clock, 
  Zap, 
  MoreVertical, 
  Activity,
  ArrowUpRight,
  Shield,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatientLaunchCard } from './PatientLaunchCard';
import { QueueEntryCard } from './QueueEntryCard';
import { TriageModal } from './TriageModal';
import { useUIStore } from '../../store/useUIStore';
import { Patient, QueueEntry } from '../../types';
import { api } from '../../lib/api';

export function CommandDashboard() {
  const { privacyMode, togglePrivacyMode, isTriageModalOpen, openTriageModal, closeTriageModal, selectedPatientId } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [launchpadPatients, setLaunchpadPatients] = useState<Patient[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(true);

  // Sensors for DND
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const doctorId = 'doc-001'; 
        const [sessionRes, patientsRes] = await Promise.all([
          api.get(`/queue/session?doctorId=${doctorId}`),
          api.get(`/doctors/${doctorId}/patients`)
        ]);
        
        const session = sessionRes.data;
        setIsSessionOpen(!session.closedAt);
        
        const queueRes = await api.get(`/queue/entries?doctorId=${doctorId}${session.sessionCode ? `&sessionCode=${session.sessionCode}` : ''}`);
        
        setLaunchpadPatients(patientsRes.data.slice(0, 5));
        setQueueEntries(queueRes.data);
      } catch (err) {
        console.error('Data sync failed', err);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async (id: string) => {
    try {
      const res = await api.get(`/gateway/resolve-patient?id=${id}`);
      if (res.data) {
        // If patient found, add to launchpad or highlight
        setLaunchpadPatients(prev => {
          if (prev.find(p => p.id === res.data.id)) return prev;
          return [res.data, ...prev];
        });
      }
    } catch (err) {
      console.error('Patient lookup failed', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    if (event.active.data.current?.type === 'launchpad') {
      setActivePatient(event.active.data.current.patient);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActivePatient(null);

    if (!over) return;

    // Logic for dragging from Launchpad to Queue (Check-in)
    if (active.data.current?.type === 'launchpad' && over.id === 'queue-container') {
      const patient = active.data.current.patient;
      try {
        const res = await api.post('/queue/entries', {
          patientId: patient.id,
          doctorId: 'doc-001',
          status: 'WAITING'
        });
        setQueueEntries(prev => [...prev, res.data]);
        setLaunchpadPatients(prev => prev.filter(p => p.id !== patient.id));
        openTriageModal(patient.id);
      } catch (err) {
        console.error('Check-in failed', err);
      }
      return;
    }

    // Logic for reordering within the Queue
    if (active.id !== over.id) {
      const oldIndex = queueEntries.findIndex(e => e.id === active.id);
      const newIndex = queueEntries.findIndex(e => e.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(queueEntries, oldIndex, newIndex);
        setQueueEntries(newOrder);
        
        // Sync new order to backend
        try {
          await api.patch('/queue/batch', {
            entries: newOrder.map((entry, index) => ({
              id: entry.id,
              sequenceNumber: index + 1
            }))
          });
        } catch (err) {
          console.error('Reorder sync failed', err);
        }
      }
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } }
    })
  };

  const selectedPatient = queueEntries.find(e => e.patient.id === selectedPatientId)?.patient || 
                         launchpadPatients.find(p => p.id === selectedPatientId);

  const handleLaunchToDoctor = async (patientId: string) => {
    try {
      await api.post('/gateway/remote-command', {
        targetDoctorId: 'doc-001',
        command: 'OPEN_PATIENT',
        payload: { patientId }
      });
      // Optionally update status to WITH_DOCTOR
    } catch (err) {
      console.error('Remote launch failed', err);
    }
  };

  return (
    <div className="flex h-screen bg-ink overflow-hidden font-sans selection:bg-neon-green/30">
      {/* Sidebar */}
      <aside className="w-20 flex flex-col items-center py-8 border-r border-white/5 bg-black/40 backdrop-blur-xl z-50">
        <div className="w-12 h-12 bg-neon-green rounded-2xl flex items-center justify-center font-black text-2xl text-black shadow-lg shadow-neon-green/20 mb-12">
          M
        </div>
        
        <nav className="flex-1 space-y-6">
          <SidebarIcon icon={<LayoutGrid size={22} />} active />
          <SidebarIcon icon={<Users size={22} />} />
          <SidebarIcon icon={<Clock size={22} />} />
          <SidebarIcon icon={<Activity size={22} />} />
        </nav>

        <div className="space-y-6">
          <button 
            onClick={togglePrivacyMode}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${privacyMode ? 'bg-amber-500/20 text-amber-500' : 'text-mist/20 hover:text-white hover:bg-white/5'}`}
          >
            {privacyMode ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
          <SidebarIcon icon={<Power size={22} className="text-red-500/60" />} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8 z-40">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              Reception Command Center
              <span className="px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[9px] font-black uppercase tracking-widest border border-neon-green/20">Live</span>
            </h1>

            <div className="h-10 w-[400px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-mist/20" size={18} />
              <input 
                type="text" 
                placeholder="Lookup 8-digit Meiosis ID..." 
                maxLength={8}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.length === 8) {
                    handleSearch(val);
                  }
                }}
                className="w-full h-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-mist/20 outline-none focus:border-neon-green/30 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-mist/20 uppercase tracking-[0.2em]">Daily Session</span>
              <span className="text-sm font-bold text-emerald-400">Open • 09:00 AM Started</span>
            </div>
            <button className="px-6 py-2.5 bg-neon-green text-black rounded-xl font-black text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-neon-green/10">
              New Walk-in
            </button>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex overflow-hidden p-8 gap-8">
            {/* Live Queue (Left) */}
            <div className="flex-[1.5] flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">Active Clinical Pipeline</h2>
                    <p className="text-[10px] text-mist/30 font-bold uppercase tracking-widest">{queueEntries.length} Patients in Sequence</p>
                  </div>
                </div>
                <button className="text-mist/20 hover:text-white transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div 
                id="queue-container"
                className="flex-1 bg-white/[0.01] border border-dashed border-white/5 rounded-[32px] p-4 overflow-y-auto custom-scrollbar"
              >
                <SortableContext
                  items={queueEntries.map(e => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {queueEntries.map((entry) => (
                      <QueueEntryCard 
                        key={entry.id} 
                        entry={entry} 
                        onTriage={(pid) => openTriageModal(pid)}
                        onLaunch={(pid) => handleLaunchToDoctor(pid)}
                      />
                    ))}
                    {queueEntries.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-20">
                        <Shield size={48} className="mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">Pipeline Empty</p>
                        <p className="text-xs mt-1">Drag patients here to begin clinical check-in</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </div>

            {/* Launchpad (Right) */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center text-neon-green">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Launchpad Pool</h2>
                  <p className="text-[10px] text-mist/30 font-bold uppercase tracking-widest">Incoming & Scheduled</p>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {launchpadPatients.map((patient) => (
                  <PatientLaunchCard 
                    key={patient.id} 
                    patient={patient} 
                    appointmentTime="11:30 AM"
                  />
                ))}
                
                <div className="mt-8 pt-8 border-t border-white/5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-mist/20 mb-4 ml-2">Quick Access Walk-ins</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-all flex flex-col items-center gap-3 text-mist/40 hover:text-white group">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">New Identity</span>
                    </button>
                    <button className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-all flex flex-col items-center gap-3 text-mist/40 hover:text-white group">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Recent Visits</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeId && activePatient ? (
              <div className="w-80 shadow-2xl scale-105 pointer-events-none">
                <PatientLaunchCard patient={activePatient} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isTriageModalOpen && selectedPatient && (
          <TriageModal 
            isOpen={isTriageModalOpen}
            onClose={closeTriageModal}
            patientName={selectedPatient.name}
            onSave={async (vitals) => {
              console.log('Saving vitals:', vitals);
              // API call to save vitals and admission status
              await api.patch(`/patients/${selectedPatient.id}/admission`, {
                medicalStatus: vitals.ward ? 'hospitalisation' : 'normal',
                admissionWard: vitals.ward,
                admissionBed: vitals.bed
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarIcon({ icon, active }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${active ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20' : 'text-mist/20 hover:text-white hover:bg-white/5'}`}>
      {icon}
    </div>
  );
}
