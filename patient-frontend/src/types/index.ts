// Mirror of Backend Prisma Enum / Models

export type AppointmentStatus = 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type AppointmentMode = 'IN_PERSON' | 'TELECONSULT';
export type PrescriptionStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  rating?: number;
}

export interface PrescriptionItem {
  id: string;
  medicine: string;
  dose: string;
  frequency: string;
  timing: string;
  reason: string;
}

export interface Prescription {
  id: string;
  title: string;
  status: PrescriptionStatus;
  durationDays: number;
  startDate: string;
  endDate: string;
  doctorNote: string;
  doctor: Doctor;
  items: PrescriptionItem[];
}

export interface Appointment {
  id: string;
  doctorId: string;
  title: string;
  scheduledDate: string;
  slotStartTime?: string;
  status: AppointmentStatus;
  mode: AppointmentMode;
  location?: string;
  doctor: Doctor;
}

export interface LabReport {
  id: string;
  testName: string;
  title?: string;
  labName?: string;
  status: string;
  reportDate: string;
  educationalAi: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: string;
  address: string;
  healthScore: number;
  meiosisId: string;
  universalCode: string;
  insurancePlan?: string;
  appointments: Appointment[];
  prescriptions: Prescription[];
  labReports: LabReport[];
}
