export interface PrescriptionRow {
  id: string;
  medicineId?: string;
  medicineName: string;
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
  notes: string;
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  diagnosis: string;
  advice: string;
  rows: PrescriptionRow[];
}

export interface EMRState {
  abdmCareContextId?: string;
  patientInfo: string;
  vitals: {
    bloodPressure: string;
    pulse: string;
    temperature: string;
    spo2: string;
    height: string;
    weight: string;
  };
  symptoms: string;
  symptomCode?: string;
  diagnosis: string;
  diagnosisCode?: string;
  labTests: string;
  advice: string;
  followUpDate: string;
  prescriptionRows: PrescriptionRow[];
}
