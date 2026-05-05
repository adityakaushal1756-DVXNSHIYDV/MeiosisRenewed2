export interface Patient {
  id: string;
  name: string;
  meiosisId: string;
  universalCode: string;
  phone: string;
  email: string;
  bloodGroup?: string;
  medicalStatus?: string;
  admissionWard?: string;
  admissionBed?: string;
}

export interface QueueEntry {
  id: string;
  sequenceNumber: number;
  status: 'WAITING' | 'WITH_DOCTOR' | 'COMPLETED' | 'NO_SHOW';
  patient: Patient;
  appointmentId?: string;
  checkInTime: string;
}

export interface QueueSession {
  id: string;
  doctorId: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
}
