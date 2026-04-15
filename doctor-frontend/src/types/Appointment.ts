export type ArrivalStatus = 'CHECKED_IN' | 'NOT_ARRIVED';
export type QueueStatus = 'READY' | 'WAITING' | 'IN_SESSION' | 'COMPLETED' | 'LATE' | 'NO_SHOW' | 'PAUSED';

export interface Appointment {
  id: string;
  patientId: string;
  queueNumber: number;
  appointmentTime: string;
  arrivalStatus: ArrivalStatus;
  status: QueueStatus;
  visitReason: string;
  mode: 'In-person' | 'Teleconsult';
}
