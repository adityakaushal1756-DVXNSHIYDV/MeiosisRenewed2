import { useCallback, useEffect, useMemo, useState } from 'react';
import { Patient } from '../types/Patient';
import { API_BASE_URL, getAuthHeader } from '../lib/api';
import { saveToCache, loadFromCache } from '../utils/persistentCache';

export function normalizePatient(p: any): Patient {
  return {
    id: String(p.id),
    meiosisCode: p.meiosisCode || p.universalCode || p.meiosisId || String(p.id),
    name: p.name || 'Unknown Patient',
    phone: p.phone || '',
    email: p.email || '',
    age: p.age || 0,
    gender: p.gender || 'Other',
    visitReason: p.visitReason || 'General Consultation',
    lastVisitDate: p.lastVisitDate || new Date().toISOString().slice(0, 10),
    allergies: Array.isArray(p.allergies) ? p.allergies : [],
    chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions : [],
    vitals: p.vitals || { bloodPressure: '', pulse: '', temperature: '', spo2: '', height: '', weight: '' },
    history: Array.isArray(p.history) ? p.history : [],
    pastAppointments: Array.isArray(p.pastAppointments) ? p.pastAppointments : [],
    prescriptions: Array.isArray(p.prescriptions) ? p.prescriptions : [],
    medicalReports: Array.isArray(p.medicalReports) ? p.medicalReports : []
  };
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>(() => loadFromCache<Patient[]>('patients') || []);
  const [isSyncing, setIsSyncing] = useState(false);

  const updatePatient = useCallback((patientId: string, updater: (p: Patient) => Patient) => {
    setPatients((prev) => {
      const next = prev.map((p) => (p.id === patientId ? normalizePatient(updater(p)) : p));
      saveToCache('patients', next);
      return next;
    });
  }, []);

  // Sync is now managed by App.tsx to ensure it uses the network-gated DOCTOR endpoint exclusively.
  const [query, setQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(q) ||
      patient.phone.toLowerCase().includes(q) ||
      patient.id.toLowerCase().includes(q) ||
      patient.meiosisCode.toLowerCase().includes(q)
    );
  }, [patients, query]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  );

  return {
    patients,
    setPatients,
    query,
    setQuery,
    filteredPatients,
    selectedPatient,
    selectedPatientId,
    setSelectedPatientId,
    expandedHistoryId,
    setExpandedHistoryId,
    updatePatient,
    isSyncing
  };
}

