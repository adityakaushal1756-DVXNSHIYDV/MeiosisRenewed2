// Mirror of backend Prisma models - identical to patient-frontend types

export type AppointmentStatus = 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type AppointmentMode = 'IN_PERSON' | 'TELECONSULT';
export type PrescriptionStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  clinicName?: string;
  clinicAddress?: string;
  email?: string;
  phone?: string;
  consultFee?: number;
  rating?: number;
  workingHours?: string;
  qualification?: string;
  yearsExperience?: number;
  meiosisId?: string;
  isLinked?: boolean;
  linkedAt?: string;
}

export interface PrescriptionItem {
  id: string;
  medicine: string;
  dose: string;
  frequency: string;
  timing: string;
  reason: string;
  durationDays?: number | null;
  isActive?: boolean;
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
  isActive?: boolean;
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
  hpNotes?: any[];
  doctorLinks?: DoctorLink[];

  // Lifestyle & Habits
  breakfastTime?: string | null;
  breakfastDetails?: string | null;
  lunchTime?: string | null;
  lunchDetails?: string | null;
  dinnerTime?: string | null;
  dinnerDetails?: string | null;
  snacksDetails?: string | null;
  sleepTime?: string | null;
  wakeupTime?: string | null;
  teaCoffeeDetails?: string | null;
  exerciseHabits?: string | null;
  smokingStatus?: string | null;
  alcoholConsumption?: string | null;
  lifestyleNotes?: string | null;
}

export interface DoctorLink {
  id: string;
  patientId: string;
  doctorId: string;
  doctor: Doctor;
  linkedAt: string;
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  startAt: string;
  endAt: string;
  mode: AppointmentMode;
  location: string;
  available: boolean;
  slotDuration?: number;
}
