import { create } from 'zustand';

interface UIState {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  isTriageModalOpen: boolean;
  selectedPatientId: string | null;
  openTriageModal: (patientId: string) => void;
  closeTriageModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  privacyMode: false,
  togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
  isTriageModalOpen: false,
  selectedPatientId: null,
  openTriageModal: (patientId) => set({ isTriageModalOpen: true, selectedPatientId: patientId }),
  closeTriageModal: () => set({ isTriageModalOpen: false, selectedPatientId: null }),
}));
