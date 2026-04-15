import type { AppointmentEntry } from './types';

export const timelineData: AppointmentEntry[] = [
  {
    id: 'apt1',
    date: 'Jan 10, 2024',
    type: 'Cardiology Visit',
    specialty: 'Cardiology',
    doctor: 'Dr. R. Sharma',
    metrics: '62–180 bpm',
    notes:
      'Irregular rhythm detected on resting ECG. 24-hour Holter monitor ordered. Patient advised to avoid caffeine and report palpitations immediately.',
    labs: [
      { id: 'l1', label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'normal' },
      { id: 'l2', label: 'Heart Rate', value: '88', unit: 'bpm', status: 'normal' },
      { id: 'l3', label: 'ECG Result', value: 'Irregular rhythm', status: 'critical' },
    ],
    prescriptions: [
      { id: 'p1', name: 'Ibuprofen', dose: '200mg', frequency: 'Twice daily' },
      { id: 'p2', name: 'Aspirin', dose: '75mg', frequency: 'Once daily' },
    ],
    medications: [
      { id: 'm1', name: 'Eliquis', dose: '5mg', ongoing: true },
    ],
  },
  {
    id: 'apt2',
    date: 'Feb 3, 2024',
    type: 'Cardiology Follow-up',
    specialty: 'Cardiology',
    doctor: 'Dr. R. Sharma',
    metrics: 'Holter: 72 avg',
    notes:
      'Holter results reviewed. Stable paroxysmal atrial fibrillation confirmed. Rate control strategy initiated. No structural abnormalities on echo.',
    labs: [
      { id: 'l4', label: 'Holter Avg HR', value: '72', unit: 'bpm', status: 'normal' },
      { id: 'l5', label: 'QTc Interval', value: '440', unit: 'ms', status: 'normal' },
    ],
    prescriptions: [
      { id: 'p3', name: 'Metoprolol', dose: '25mg', frequency: 'Once daily' },
    ],
    medications: [
      { id: 'm2', name: 'Eliquis', dose: '5mg', ongoing: true },
      { id: 'm3', name: 'Metoprolol', dose: '25mg', ongoing: true },
    ],
  },
  {
    id: 'apt3',
    date: 'Mar 15, 2024',
    type: 'Nephrology Check',
    specialty: 'Nephrology',
    doctor: 'Dr. P. Verma',
    metrics: 'eGFR: 68',
    notes:
      'Mild CKD Stage 2 identified. Low sodium, low protein diet advised. Referred to dietitian. Renal ultrasound shows no obstruction.',
    labs: [
      { id: 'l6', label: 'eGFR', value: '68', unit: 'mL/min', status: 'low' },
      { id: 'l7', label: 'Creatinine', value: '1.3', unit: 'mg/dL', status: 'high' },
      { id: 'l8', label: 'BUN', value: '22', unit: 'mg/dL', status: 'normal' },
    ],
    prescriptions: [
      { id: 'p4', name: 'Losartan', dose: '50mg', frequency: 'Once daily' },
    ],
    medications: [
      { id: 'm4', name: 'Losartan', dose: '50mg', ongoing: true },
    ],
  },
  {
    id: 'apt4',
    date: 'Apr 22, 2024',
    type: 'General OPD',
    specialty: 'General Medicine',
    doctor: 'Dr. A. Mehta',
    metrics: 'Temp: 98.6°F',
    notes:
      'Seasonal influenza. Adequate rest and hydration advised. Follow up if fever persists beyond 3 days or respiratory symptoms worsen.',
    labs: [
      { id: 'l9', label: 'Temperature', value: '98.6', unit: '°F', status: 'normal' },
      { id: 'l10', label: 'WBC Count', value: '11.2', unit: 'K/µL', status: 'high' },
    ],
    prescriptions: [
      { id: 'p5', name: 'Paracetamol', dose: '500mg', frequency: 'Three times daily' },
      { id: 'p6', name: 'Cetirizine', dose: '10mg', frequency: 'Once at night' },
    ],
    medications: [],
  },
  {
    id: 'apt5',
    date: 'Jun 5, 2024',
    type: 'Cardiology Review',
    specialty: 'Cardiology',
    doctor: 'Dr. R. Sharma',
    metrics: '70 bpm resting',
    notes:
      'AF well-controlled on current regimen. INR therapeutic. No new symptoms reported. Advised to continue medications without change. Next review in 3 months.',
    labs: [
      { id: 'l11', label: 'INR', value: '2.3', unit: '', status: 'normal' },
      { id: 'l12', label: 'Potassium', value: '4.1', unit: 'mEq/L', status: 'normal' },
    ],
    prescriptions: [],
    medications: [
      { id: 'm5', name: 'Eliquis', dose: '5mg', ongoing: true },
      { id: 'm6', name: 'Metoprolol', dose: '25mg', ongoing: true },
      { id: 'm7', name: 'Losartan', dose: '50mg', ongoing: true },
    ],
  },
  {
    id: 'apt6',
    date: 'Aug 18, 2024',
    type: 'Nephrology Review',
    specialty: 'Nephrology',
    doctor: 'Dr. P. Verma',
    metrics: 'eGFR: 71',
    notes:
      'Kidney function slightly improved. Dietary compliance confirmed. Continue current medications. Proteinuria resolved. Annual ultrasound scheduled.',
    labs: [
      { id: 'l13', label: 'eGFR', value: '71', unit: 'mL/min', status: 'normal' },
      { id: 'l14', label: 'Creatinine', value: '1.1', unit: 'mg/dL', status: 'normal' },
    ],
    prescriptions: [],
    medications: [
      { id: 'm8', name: 'Losartan', dose: '50mg', ongoing: true },
    ],
  },
];
