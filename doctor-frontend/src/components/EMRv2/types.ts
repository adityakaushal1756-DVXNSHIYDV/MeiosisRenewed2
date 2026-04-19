export interface LabEntry {
  id: string;
  label: string;
  value: string;
  unit?: string;
  status?: 'normal' | 'high' | 'low' | 'critical';
}

export interface PrescriptionEntry {
  id: string;
  name: string;
  dose: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface MedicationEntry {
  id: string;
  name: string;
  dose: string;
  ongoing?: boolean;
}

export interface AppointmentEntry {
  id: string;
  date: string;
  type: string;
  specialty: string;
  doctor: string;
  metrics: string;
  severity?: 'critical' | 'mild' | 'low';
  notes?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  adherenceScore?: number;
  chiefComplaint?: string;
  plan?: string;
  vitals?: {
    bloodPressure?: string;
    pulse?: string;
    temperature?: string;
    spo2?: string;
    height?: string;
    weight?: string;
  };
  labs: LabEntry[];
  prescriptions: PrescriptionEntry[];
  medications: MedicationEntry[];
  documentPath?: string;
}
