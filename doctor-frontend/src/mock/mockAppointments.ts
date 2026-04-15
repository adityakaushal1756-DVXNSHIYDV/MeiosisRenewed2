import { Appointment } from '../types/Appointment';
import { PrescriptionTemplate } from '../types/EMR';

export const mockAppointments: Appointment[] = [
  { id: 'apt-001', patientId: 'pat-001', queueNumber: 1, appointmentTime: '09:15 AM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Hypertension review', mode: 'In-person' },
  { id: 'apt-002', patientId: 'pat-002', queueNumber: 2, appointmentTime: '09:30 AM', arrivalStatus: 'NOT_ARRIVED', status: 'LATE', visitReason: 'Migraine follow-up', mode: 'In-person' },
  { id: 'apt-003', patientId: 'pat-003', queueNumber: 3, appointmentTime: '09:45 AM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Diabetes management', mode: 'Teleconsult' },
  { id: 'apt-004', patientId: 'pat-004', queueNumber: 4, appointmentTime: '10:00 AM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'PCOS review', mode: 'In-person' },
  { id: 'apt-005', patientId: 'pat-005', queueNumber: 5, appointmentTime: '10:15 AM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Chest discomfort evaluation', mode: 'In-person' },
  { id: 'apt-006', patientId: 'pat-006', queueNumber: 6, appointmentTime: '10:30 AM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Acne flare-up', mode: 'In-person' },
  { id: 'apt-007', patientId: 'pat-007', queueNumber: 7, appointmentTime: '10:45 AM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Thyroid review', mode: 'Teleconsult' },
  { id: 'apt-008', patientId: 'pat-008', queueNumber: 8, appointmentTime: '11:00 AM', arrivalStatus: 'NOT_ARRIVED', status: 'WAITING', visitReason: 'Back pain consult', mode: 'In-person' },
  { id: 'apt-009', patientId: 'pat-009', queueNumber: 9, appointmentTime: '11:15 AM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Allergy review', mode: 'In-person' },
  { id: 'apt-010', patientId: 'pat-010', queueNumber: 10, appointmentTime: '11:30 AM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'BP review', mode: 'In-person' },
  { id: 'apt-011', patientId: 'pat-011', queueNumber: 11, appointmentTime: '11:45 AM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Anemia review', mode: 'Teleconsult' },
  { id: 'apt-012', patientId: 'pat-012', queueNumber: 12, appointmentTime: '12:00 PM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Lipid follow-up', mode: 'In-person' },
  { id: 'apt-013', patientId: 'pat-013', queueNumber: 13, appointmentTime: '12:15 PM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Dermatitis review', mode: 'In-person' },
  { id: 'apt-014', patientId: 'pat-014', queueNumber: 14, appointmentTime: '12:30 PM', arrivalStatus: 'NOT_ARRIVED', status: 'WAITING', visitReason: 'Sleep apnea review', mode: 'Teleconsult' },
  { id: 'apt-015', patientId: 'pat-015', queueNumber: 15, appointmentTime: '12:45 PM', arrivalStatus: 'CHECKED_IN', status: 'WAITING', visitReason: 'Vitamin deficiency review', mode: 'In-person' }
];

export const mockPrescriptionTemplates: PrescriptionTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Hypertension Follow-up',
    diagnosis: 'Essential hypertension, stable',
    advice: 'Low sodium diet, continue home BP monitoring, regular exercise.',
    rows: [
      { id: 'tpl-rx-1', medicineName: 'Amlodipine', dose: '5 mg', frequency: 'OD', duration: '30 days', notes: 'After breakfast' },
      { id: 'tpl-rx-2', medicineName: 'Telmisartan', dose: '40 mg', frequency: 'OD', duration: '30 days', notes: 'At bedtime' }
    ]
  },
  {
    id: 'tpl-002',
    name: 'Diabetes Review',
    diagnosis: 'Type 2 diabetes follow-up',
    advice: 'Diet control, post-meal walking, weekly fasting glucose log.',
    rows: [
      { id: 'tpl-rx-3', medicineName: 'Metformin XR', dose: '500 mg', frequency: 'BD', duration: '45 days', notes: 'After meals' }
    ]
  },
  {
    id: 'tpl-003',
    name: 'Migraine Support',
    diagnosis: 'Migraine without aura',
    advice: 'Trigger diary, sleep regularity, hydration, avoid skipping meals.',
    rows: [
      { id: 'tpl-rx-4', medicineName: 'Naproxen', dose: '250 mg', frequency: 'SOS', duration: '15 days', notes: 'Max 2 tabs/day' }
    ]
  }
];

