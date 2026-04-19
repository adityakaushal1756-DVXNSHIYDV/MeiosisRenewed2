import { Patient } from '../types/Patient';
import { CURRENT_DOCTOR } from '../config/doctorProfile';

const history = (index: number, label: string) => ([]);

const pastAppointments = (index: number, specialty: string, reason: string) => ([]);

const prescriptions = (index: number, label: string) => ([]);

const medicalReports = (index: number, label: string) => ([]);

function specialtyDoctor(label: string) {
  if (label === 'Diabetes' || label === 'Thyroid') return 'Dr. Emily Chen';
  if (label === 'Hypertension' || label === 'Cardiac risk' || label === 'Lipid') return 'Dr. Arjun Rao';
  return 'Dr. Sarah Mitchell';
}

function patientRecord(
  id: string,
  meiosisCode: string,
  name: string,
  phone: string,
  email: string,
  age: number,
  gender: 'Male' | 'Female' | 'Other',
  visitReason: string,
  lastVisitDate: string,
  allergies: string[],
  chronicConditions: string[],
  vitals: Patient['vitals'],
  historyIndex: number,
  historyLabel: string,
  specialty: string,
  primaryDoctorId: string = CURRENT_DOCTOR.id,
  primaryDoctorName: string = CURRENT_DOCTOR.name
): Patient {
  return {
    id,
    meiosisCode,
    primaryDoctorId,
    primaryDoctorName,
    name,
    phone,
    email,
    age,
    gender,
    visitReason,
    lastVisitDate,
    allergies,
    chronicConditions,
    vitals,
    history: history(historyIndex, historyLabel),
    pastAppointments: pastAppointments(historyIndex, specialty, historyLabel),
    prescriptions: prescriptions(historyIndex, historyLabel),
    medicalReports: medicalReports(historyIndex, historyLabel)
  };
}

export const mockPatients: Patient[] = [
  patientRecord('pat-001', '48291374', 'Aditya Sharma', '+91 98111 22334', 'aditya.sharma@example.com', 27, 'Male', 'Hypertension review', '2026-03-02', ['Penicillin'], ['Hypertension', 'Prediabetes'], { bloodPressure: '132/86', pulse: '76', temperature: '98.4F', spo2: '99%', height: '177 cm', weight: '74 kg' }, 1, 'Hypertension', 'Cardiology'),
  patientRecord('pat-002', '12345677', 'Nikita Mehra', '+91 98220 44556', 'nikita.mehra@example.com', 34, 'Female', 'Migraine follow-up', '2026-02-27', ['Sulfa drugs'], ['Migraine'], { bloodPressure: '118/76', pulse: '72', temperature: '98.1F', spo2: '100%', height: '164 cm', weight: '61 kg' }, 2, 'Migraine', 'Neurology'),
  patientRecord('pat-003', '12345666', 'Rahul Verma', '+91 98990 11223', 'rahul.verma@example.com', 51, 'Male', 'Diabetes management', '2026-03-06', [], ['Type 2 Diabetes', 'Dyslipidemia'], { bloodPressure: '140/90', pulse: '82', temperature: '98.8F', spo2: '98%', height: '171 cm', weight: '82 kg' }, 3, 'Diabetes', 'Endocrinology'),
  patientRecord('pat-004', '12345665', 'Sneha Iyer', '+91 98765 11111', 'sneha.iyer@example.com', 29, 'Female', 'PCOS review', '2026-02-21', ['Ibuprofen'], ['PCOS'], { bloodPressure: '122/80', pulse: '78', temperature: '98.5F', spo2: '99%', height: '160 cm', weight: '64 kg' }, 4, 'PCOS', 'Gynecology'),
  patientRecord('pat-005', '12345664', 'Siddharth Rao', '+91 98000 44444', 'siddharth.rao@example.com', 42, 'Male', 'Chest discomfort evaluation', '2026-02-11', [], ['Dyslipidemia'], { bloodPressure: '136/88', pulse: '80', temperature: '98.2F', spo2: '99%', height: '174 cm', weight: '79 kg' }, 5, 'Cardiac risk', 'Cardiology'),
  patientRecord('pat-006', '12345663', 'Aarav Bhatia', '+91 98123 45000', 'aarav.bhatia@example.com', 19, 'Male', 'Acne flare-up', '2026-03-03', ['Tetracycline'], ['Acne'], { bloodPressure: '110/70', pulse: '70', temperature: '98.0F', spo2: '100%', height: '180 cm', weight: '69 kg' }, 6, 'Dermatology', 'Dermatology'),
  patientRecord('pat-007', '12345662', 'Meera Nair', '+91 98123 45001', 'meera.nair@example.com', 46, 'Female', 'Thyroid review', '2026-02-18', [], ['Hypothyroidism'], { bloodPressure: '124/78', pulse: '75', temperature: '98.3F', spo2: '99%', height: '158 cm', weight: '66 kg' }, 7, 'Thyroid', 'Endocrinology'),
  patientRecord('pat-008', '12345661', 'Arjun Kapoor', '+91 98123 45002', 'arjun.kapoor@example.com', 39, 'Male', 'Back pain consult', '2026-02-24', ['Diclofenac'], ['Chronic back pain'], { bloodPressure: '128/82', pulse: '74', temperature: '98.6F', spo2: '99%', height: '176 cm', weight: '81 kg' }, 8, 'Orthopedic', 'Orthopedics'),
  patientRecord('pat-009', '12345660', 'Pooja Singh', '+91 98123 45003', 'pooja.singh@example.com', 31, 'Female', 'Allergy review', '2026-02-16', ['Dust', 'Shellfish'], ['Allergic rhinitis'], { bloodPressure: '116/72', pulse: '72', temperature: '98.1F', spo2: '100%', height: '162 cm', weight: '57 kg' }, 9, 'Allergy', 'Pulmonology'),
  patientRecord('pat-010', '12345659', 'Rohan Sethi', '+91 98123 45004', 'rohan.sethi@example.com', 37, 'Male', 'BP review', '2026-03-01', [], ['Hypertension'], { bloodPressure: '138/90', pulse: '79', temperature: '98.3F', spo2: '99%', height: '178 cm', weight: '84 kg' }, 10, 'Hypertension', 'Cardiology'),
  patientRecord('pat-011', '12345658', 'Lavanya Reddy', '+91 98123 45005', 'lavanya.reddy@example.com', 25, 'Female', 'Anemia review', '2026-02-28', [], ['Iron deficiency anemia'], { bloodPressure: '108/68', pulse: '84', temperature: '98.5F', spo2: '100%', height: '157 cm', weight: '52 kg' }, 11, 'Anemia', 'General Medicine'),
  patientRecord('pat-012', '12345657', 'Vikram Joshi', '+91 98123 45006', 'vikram.joshi@example.com', 55, 'Male', 'Lipid follow-up', '2026-03-04', ['Aspirin'], ['Hyperlipidemia'], { bloodPressure: '134/84', pulse: '77', temperature: '98.2F', spo2: '99%', height: '170 cm', weight: '76 kg' }, 12, 'Lipid', 'Cardiology'),
  patientRecord('pat-013', '12345656', 'Ananya Bose', '+91 98123 45007', 'ananya.bose@example.com', 33, 'Female', 'Dermatitis review', '2026-02-19', ['Fragrance'], ['Eczema'], { bloodPressure: '118/74', pulse: '73', temperature: '98.0F', spo2: '100%', height: '165 cm', weight: '58 kg' }, 13, 'Dermatology', 'Dermatology'),
  patientRecord('pat-014', '12345655', 'Dev Malhotra', '+91 98123 45008', 'dev.malhotra@example.com', 47, 'Male', 'Sleep apnea review', '2026-02-17', [], ['Sleep apnea'], { bloodPressure: '130/86', pulse: '80', temperature: '98.7F', spo2: '97%', height: '173 cm', weight: '88 kg' }, 14, 'Respiratory', 'Pulmonology'),
  patientRecord('pat-015', '12345654', 'Tanya Chawla', '+91 98123 45009', 'tanya.chawla@example.com', 30, 'Female', 'Vitamin D deficiency review', '2026-02-12', [], ['Vitamin D deficiency'], { bloodPressure: '114/72', pulse: '71', temperature: '98.3F', spo2: '100%', height: '161 cm', weight: '56 kg' }, 15, 'Deficiency', 'General Medicine'),
  patientRecord('pat-016', '12345653', 'Kunal Mehta', '+91 98123 45010', 'kunal.mehta@example.com', 44, 'Male', 'GERD symptoms', '2026-03-05', [], ['GERD'], { bloodPressure: '126/80', pulse: '76', temperature: '98.2F', spo2: '99%', height: '175 cm', weight: '78 kg' }, 16, 'Gastro', 'General Medicine'),
  patientRecord('pat-017', '12345652', 'Isha Anand', '+91 98123 45011', 'isha.anand@example.com', 22, 'Female', 'General check-up', '2026-02-13', [], [], { bloodPressure: '112/70', pulse: '69', temperature: '98.0F', spo2: '100%', height: '163 cm', weight: '54 kg' }, 17, 'General health', 'General Medicine'),
  patientRecord('pat-018', '12345651', 'Pranav Kulkarni', '+91 98123 45012', 'pranav.kulkarni@example.com', 49, 'Male', 'Arthritis pain review', '2026-02-09', ['Naproxen'], ['Osteoarthritis'], { bloodPressure: '129/81', pulse: '78', temperature: '98.4F', spo2: '99%', height: '169 cm', weight: '80 kg' }, 18, 'Arthritis', 'Orthopedics'),
  patientRecord('pat-019', '12345650', 'Sanya Khurana', '+91 98123 45013', 'sanya.khurana@example.com', 28, 'Female', 'Sinusitis review', '2026-02-07', ['Dust mites'], ['Sinusitis'], { bloodPressure: '117/75', pulse: '74', temperature: '98.5F', spo2: '100%', height: '159 cm', weight: '55 kg' }, 19, 'ENT', 'ENT'),
  patientRecord('pat-020', '12345649', 'Harsh Dubey', '+91 98123 45014', 'harsh.dubey@example.com', 58, 'Male', 'COPD review', '2026-03-07', [], ['COPD'], { bloodPressure: '131/83', pulse: '85', temperature: '98.7F', spo2: '96%', height: '168 cm', weight: '73 kg' }, 20, 'Respiratory', 'Pulmonology')
];
