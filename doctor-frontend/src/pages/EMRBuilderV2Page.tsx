import { useEffect, useRef, useState } from 'react';
import { EMRBuilder } from '../components/EMR/EMRBuilder';
import { PrescriptionTemplate, EMRState, PrescriptionRow } from '../types/EMR';
import { Patient } from '../types/Patient';

export interface EMRBuilderV2PageProps {
  selectedPatient: Patient | null;
  templates?: PrescriptionTemplate[];
  followUpGapDays?: number;
  timelineTheme?: 'default' | 'dashboard-dark' | 'beige-light';
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calcFollowUpDate(gapDays: number): string {
  const next = new Date();
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + gapDays);
  return formatDateInput(next);
}

function newPrescriptionRow(): PrescriptionRow {
  return {
    id: Math.random().toString(36).slice(2),
    medicineName: '',
    dose: '',
    frequency: 'OD',
    duration: '',
    notes: '',
  };
}

function createInitialEmr(followUpGapDays: number, patient: Patient | null): EMRState {
  return {
    patientInfo: patient?.visitReason ?? '',
    vitals: {
      bloodPressure: patient?.vitals.bloodPressure ?? '',
      pulse: patient?.vitals.pulse ?? '',
      temperature: patient?.vitals.temperature ?? '',
      spo2: patient?.vitals.spo2 ?? '',
      height: patient?.vitals.height ?? '',
      weight: patient?.vitals.weight ?? '',
    },
    symptoms: '',
    diagnosis: '',
    labTests: '',
    advice: '',
    followUpDate: calcFollowUpDate(followUpGapDays),
    prescriptionRows: [newPrescriptionRow()],
  };
}

export function EMRBuilderV2Page({
  selectedPatient,
  templates = [],
  followUpGapDays = 7,
}: EMRBuilderV2PageProps) {
  const [emr, setEmr] = useState<EMRState>(() => createInitialEmr(followUpGapDays, selectedPatient));
  const [localTemplates, setLocalTemplates] = useState<PrescriptionTemplate[]>(templates);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalTemplates(templates);
  }, [templates]);

  useEffect(() => {
    setEmr(createInitialEmr(followUpGapDays, selectedPatient));
    setActiveTemplateId(null);
    setIsSaving(false);
  }, [followUpGapDays, selectedPatient?.id]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const updateField = (field: keyof EMRState, value: string) => {
    setEmr((current) => ({ ...current, [field]: value }));
  };

  const updateVital = (field: keyof EMRState['vitals'], value: string) => {
    setEmr((current) => ({
      ...current,
      vitals: {
        ...current.vitals,
        [field]: value,
      },
    }));
  };

  const updatePrescription = (id: string, field: keyof PrescriptionRow, value: string) => {
    setEmr((current) => ({
      ...current,
      prescriptionRows: current.prescriptionRows.map((row) => (
        row.id === id ? { ...row, [field]: value } : row
      )),
    }));
  };

  const addPrescriptionRow = () => {
    setEmr((current) => ({
      ...current,
      prescriptionRows: [...current.prescriptionRows, newPrescriptionRow()],
    }));
  };

  const removePrescriptionRow = (id: string) => {
    setEmr((current) => ({
      ...current,
      prescriptionRows: current.prescriptionRows.length > 1
        ? current.prescriptionRows.filter((row) => row.id !== id)
        : current.prescriptionRows,
    }));
  };

  const applyTemplate = (templateId: string) => {
    const template = localTemplates.find((item) => item.id === templateId);
    if (!template) return;

    setActiveTemplateId(templateId);
    setEmr((current) => ({
      ...current,
      diagnosis: template.diagnosis || current.diagnosis,
      advice: template.advice || current.advice,
      prescriptionRows: template.rows.length > 0
        ? template.rows.map((row) => ({ ...row, id: Math.random().toString(36).slice(2) }))
        : current.prescriptionRows,
    }));
  };

  const saveTemplate = () => {
    const meaningfulRows = emr.prescriptionRows.filter((row) => row.medicineName.trim());
    if (!meaningfulRows.length) return false;

    const templateId = `tpl-${Math.random().toString(36).slice(2)}`;
    const templateName = emr.diagnosis.trim() || selectedPatient?.visitReason?.trim() || `Template ${localTemplates.length + 1}`;
    const template: PrescriptionTemplate = {
      id: templateId,
      name: templateName,
      diagnosis: emr.diagnosis,
      advice: emr.advice,
      rows: meaningfulRows.map((row) => ({ ...row, id: Math.random().toString(36).slice(2) })),
    };

    setLocalTemplates((current) => [template, ...current]);
    setActiveTemplateId(templateId);
    return true;
  };

  const saveEmr = () => {
    if (!selectedPatient) return;
    setIsSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setIsSaving(false), 1200);
  };

  return (
    <div className="h-full min-h-0">
      <EMRBuilder
        patientName={selectedPatient?.name ?? null}
        patient={selectedPatient}
        appointment={null}
        composerOpen
        onCloseComposer={() => {}}
        emr={emr}
        templates={localTemplates}
        activeTemplateId={activeTemplateId}
        onFieldChange={updateField}
        onVitalChange={updateVital}
        onPrescriptionChange={updatePrescription}
        onAddPrescriptionRow={addPrescriptionRow}
        onRemovePrescriptionRow={removePrescriptionRow}
        onApplyTemplate={applyTemplate}
        onSaveTemplate={saveTemplate}
        isSaving={isSaving}
        onSaveEMR={saveEmr}
      />
    </div>
  );
}
