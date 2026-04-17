export interface HistoryEntry {
  id: string;
  date: string;
  chiefComplaint: string;
  diagnosis: string;
  prescriptionSummary: string;
  doctorNotes: string;
  labs: string[];
  advice: string;
}

export interface PatientVitalsSnapshot {
  bloodPressure: string;
  pulse: string;
  temperature: string;
  spo2: string;
  height: string;
  weight: string;
}

export interface AppointmentMedication {
  medicineId?: string;
  name: string;
  identifier_brand?: string;
  generic_name?: string;
  substance_identifier?: string;
  route_of_administration?: string;
  dose_form?: string;
  therapeutic_role?: string;
  iupac_name?: string;
  molecular_formula?: string;
  dose: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface PatientPastAppointment {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  mode: 'In-person' | 'Teleconsult';
  status: 'Completed' | 'Cancelled';
  severity?: string;
  purpose: string;
  chiefComplaint?: string;
  // Rich EMR fields — populated when saved from the EMR builder
  symptoms?: string;
  diagnosis?: string;
  medications?: AppointmentMedication[];
  followUp?: string;
  notes?: string;
  documentPath?: string;
}

export interface PatientPrescriptionRecord {
  id: string;
  title: string;
  prescribedOn: string;
  doctorName: string;
  summary: string;
  medicines: string[];
  status: 'Active' | 'Completed' | 'Expired';
}

export interface PatientMedicalReport {
  id: string;
  title: string;
  category: 'Lab' | 'Imaging' | 'Consultation' | 'Discharge';
  reportDate: string;
  doctorName: string;
  summary: string;
  fileLabel: string;
  documentPath?: string;
}

export interface Patient {
  id: string;
  meiosisCode: string;
  abhaId?: string;
  abhaAddress?: string;
  /** DB id of the patient's primary/GP doctor (e.g. 'doc-001') */
  primaryDoctorId?: string;
  /** Display name of the primary doctor (e.g. 'Dr. Sarah Mitchell') */
  primaryDoctorName?: string;
  name: string;
  phone: string;
  email: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  visitReason: string;
  lastVisitDate: string;
  allergies: string[];
  chronicConditions: string[];
  vitals: PatientVitalsSnapshot;
  history: HistoryEntry[];
  pastAppointments: PatientPastAppointment[];
  prescriptions: PatientPrescriptionRecord[];
  medicalReports: PatientMedicalReport[];
}
