export const PATIENT_HIGHLIGHT_EVENT = 'meiosis:patient-highlight';
export const PATIENT_HIGHLIGHT_CHANNEL = 'meiosis_patient_highlight_channel';
export const PATIENT_HIGHLIGHT_STORAGE_KEY = 'meiosis_patient_highlight_v1';

export interface PatientHighlightEvent {
  patientId: string;
  doctorId?: string;
  source: 'gateway' | 'url' | 'local' | 'broadcast';
  emittedAt: string;
}

const channel = typeof window !== 'undefined' ? new BroadcastChannel(PATIENT_HIGHLIGHT_CHANNEL) : null;

export function publishPatientHighlight(event: PatientHighlightEvent) {
  try {
    localStorage.setItem(PATIENT_HIGHLIGHT_STORAGE_KEY, JSON.stringify(event));
  } catch {}

  // Local event dispatch for the current tab
  window.dispatchEvent(
    new CustomEvent<PatientHighlightEvent>(PATIENT_HIGHLIGHT_EVENT, {
      detail: event,
    }),
  );

  // Broadcast to other tabs
  if (channel && event.source !== 'broadcast') {
    channel.postMessage(event);
  }
}

export function subscribeToHighlightBroadcast(callback: (event: PatientHighlightEvent) => void) {
  if (!channel) return () => {};
  
  const listener = (ev: MessageEvent) => {
    if (ev.data && ev.data.patientId) {
      callback({ ...ev.data, source: 'broadcast' });
    }
  };
  
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
}

export function readStoredPatientHighlight(): PatientHighlightEvent | null {
  try {
    const raw = localStorage.getItem(PATIENT_HIGHLIGHT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.patientId ? parsed : null;
  } catch {
    return null;
  }
}
