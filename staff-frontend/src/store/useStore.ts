import { create } from 'zustand';

export type NavView = 'dashboard' | 'queue' | 'search' | 'registration' | 'calendar' | 'billing' | 'audit' | 'settings';

export interface StaffSession {
  id?: string;
  name: string;
  email: string;
  role: string;
  token: string;
  doctorId?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface StoreState {
  // Navigation
  activeView: NavView;
  setActiveView: (view: NavView) => void;

  // Session
  session: StaffSession | null;
  setSession: (session: StaffSession | null) => void;

  // Selected patient
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;

  // Clinic status
  isClinicOpen: boolean;
  toggleClinicStatus: () => void;

  // Privacy mode
  privacyMode: boolean;
  togglePrivacyMode: () => void;

  // Sidebar collapsed (for smaller screens)
  sidebarExpanded: boolean;
  toggleSidebar: () => void;

  // Active billing patient
  billingPatientId: string | null;
  openBilling: (patientId: string) => void;
  closeBilling: () => void;

  // Triage modal
  triagePatientId: string | null;
  openTriage: (patientId: string) => void;
  closeTriage: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;

  // Search query (global)
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

let toastCounter = 0;

export const useStore = create<StoreState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),

  session: null,
  setSession: (session) => set({ session }),

  selectedPatientId: null,
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),

  isClinicOpen: true,
  toggleClinicStatus: () => set((s) => ({ isClinicOpen: !s.isClinicOpen })),

  privacyMode: false,
  togglePrivacyMode: () => set((s) => ({ privacyMode: !s.privacyMode })),

  sidebarExpanded: true,
  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),

  billingPatientId: null,
  openBilling: (id) => set({ billingPatientId: id }),
  closeBilling: () => set({ billingPatientId: null }),

  triagePatientId: null,
  openTriage: (id) => set({ triagePatientId: id }),
  closeTriage: () => set({ triagePatientId: null }),

  toasts: [],
  addToast: (type, message) => {
    const id = `toast_${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  globalSearch: '',
  setGlobalSearch: (q) => set({ globalSearch: q }),
}));
