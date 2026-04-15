const express = require('express');
const { randomUUID } = require('crypto');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { createPrescriptionPdf } = require('../lib/pdf-documents');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   POST /api/emr
   Save a complete consultation record (prescription + lab orders)
   Body: {
     patientId,       // DB id OR meiosisId OR universalCode
     doctorId,        // DB id (optional — falls back to first doctor)
     patientInfo,     // chief complaint
     vitals,          // { bloodPressure, pulse, temperature, spo2, height, weight }
     symptoms,
     diagnosis,
     advice,
     prescriptionRows, // [{ medicineName, dose, frequency, duration, notes }]
     labTests,        // newline/comma separated string
     followUpDate     // "YYYY-MM-DD" (optional)
   }
───────────────────────────────────────────────────────────── */
router.post('/', asyncHandler(async (req, res) => {
  const {
    patientId,
    doctorId,
    patientInfo,
    vitals = {},
    symptoms,
    diagnosis,
    diagnosisCode,
    symptomCode,
    abdmCareContextId,
    advice,
    prescriptionRows = [],
    labTests,
    followUpDate
  } = req.body;

  if (!patientId) {
    res.status(400).json({ error: 'patientId is required' });
    return;
  }

  /* ── Resolve patient (by DB id, meiosisId, or universalCode) ── */
  let patient = await prisma.patient.findUnique({ where: { id: patientId } }).catch(() => null);

  if (!patient) {
    patient = await prisma.patient.findFirst({
      where: { OR: [{ meiosisId: patientId }, { universalCode: patientId }] }
    });
  }

  if (!patient) {
    // Patient is a mock / not yet seeded — skip DB write, return success so
    // the frontend can still do its local optimistic update.
    res.status(201).json({ ok: true, saved: false, reason: 'patient_not_in_db' });
    return;
  }

  /* ── Resolve doctor (by id, or first available) ── */
  let doctor = doctorId
    ? await prisma.doctor.findUnique({ where: { id: doctorId } }).catch(() => null)
    : null;

  if (!doctor) {
    doctor = await prisma.doctor.findFirst();
  }

  if (!doctor) {
    res.status(404).json({ error: 'No doctor record found in database' });
    return;
  }

  /* ── Date calculations ── */
  const now = new Date();
  const endDate = followUpDate
    ? new Date(followUpDate)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const durationDays = Math.max(1, Math.round((endDate - now) / (1000 * 60 * 60 * 24)));

  const doctorNote = [
    patientInfo   && `Chief Complaint: ${patientInfo}`,
    symptoms      && `Subjective: ${symptoms}`,
    diagnosis     && `Assessment: ${diagnosis}`,
    advice        && `Plan: ${advice}`,
    (() => {
      const parts = [
        vitals.bloodPressure && `BP: ${vitals.bloodPressure}`,
        vitals.pulse         && `HR: ${vitals.pulse}`,
        vitals.temperature   && `Temp: ${vitals.temperature}`,
        vitals.spo2          && `SpO2: ${vitals.spo2}`,
        vitals.height        && `Ht: ${vitals.height}`,
        vitals.weight        && `Wt: ${vitals.weight}`,
      ].filter(Boolean);
      return parts.length ? `Vitals — ${parts.join(' | ')}` : null;
    })()
  ].filter(Boolean).join('\n');

  const saved = {};

  /* ── Always create a Prescription/consultation record ── */
  const medicines = prescriptionRows.filter(r => r.medicineName?.trim());

  const title = diagnosis?.trim()
    ? diagnosis.slice(0, 80)
    : `Consultation ${now.toISOString().slice(0, 10)}`;

  saved.prescription = await prisma.prescription.create({
    data: {
      id: randomUUID(),
      patientId: patient.id,
      doctorId: doctor.id,
      title,
      status: 'ACTIVE',
      durationDays,
      refillCount: 0,
      adherenceScore: 0,
      startDate: now,
      endDate,
      doctorNote: doctorNote || 'Consultation record.',
      abdmCareContextId: abdmCareContextId || null,
      diagnosisCode: diagnosisCode || null,
      symptomCode: symptomCode || null,
      ...(medicines.length > 0 && {
        items: {
          create: medicines.map(r => ({
            medicine:                r.medicineName,
            medicineId:              r.medicineId || null,
            identifier_brand:        r.identifier_brand || null,
            generic_name:            r.generic_name || null,
            substance_identifier:    r.substance_identifier || null,
            route_of_administration: r.route_of_administration || null,
            dose_form:               r.dose_form || null,
            therapeutic_role:        r.therapeutic_role || null,
            iupac_name:              r.iupac_name || null,
            molecular_formula:       r.molecular_formula || null,
            dose:                    r.dose      || '—',
            frequency:               r.frequency || '—',
            timing:                  r.duration  || '—',
            reason:                  r.notes     || diagnosis || 'As prescribed'
          }))
        }
      })
    },
    include: { patient: true, doctor: true, items: true }
  });

  /* ── Generate PDF ── */
  // On Vercel, we MUST await this to ensure the function doesn't exit before the
  // PDF is written to storage/DB is updated.
  try {
    const { publicPath } = await createPrescriptionPdf(saved.prescription);
    saved.prescription = await prisma.prescription.update({
      where: { id: saved.prescription.id },
      data: { documentPath: publicPath },
      include: { items: true } // refreshing with the new document path
    });
  } catch (pdfError) {
    console.error('[EMR] Prescription PDF generation failed:', pdfError);
    // Non-fatal, let the request continue
  }

  /* ── Create LabReport entries (one per ordered test) ── */
  if (labTests?.trim()) {
    const tests = labTests
      .split(/[,\n]/)
      .map(t => t.trim())
      .filter(Boolean);

    saved.labReports = await Promise.all(
      tests.map(testName =>
        prisma.labReport.create({
          data: {
            id: randomUUID(),
            patientId:      patient.id,
            doctorId:       doctor.id,
            prescriptionId: saved.prescription.id,
            testName,
            status: 'PENDING',
            reportDate: now,
            educationalAi: [
              `${testName} ordered by Dr. ${doctor.name}.`,
              advice ? `Clinical guidance: ${advice}` : '',
              `Follow up date: ${endDate.toISOString().slice(0, 10)}.`
            ].filter(Boolean).join(' ')
          }
        })
      )
    );
  }

  // Ensure a message thread exists between patient and doctor
  try {
    const thread = await prisma.messageThread.findFirst({
      where: { doctorId: doctor.id, patientId: patient.id }
    });
    if (!thread) {
      await prisma.messageThread.create({
        data: { doctorId: doctor.id, patientId: patient.id }
      });
    }
  } catch (threadErr) {
    console.error('[EMR] Failed to ensure message thread:', threadErr);
  }

  res.status(201).json({ ok: true, patientId: patient.id, doctorId: doctor.id, ...saved });
}));

/* ─────────────────────────────────────────────────────────────
   GET /api/emr?patientId=<id|meiosisCode>
   Retrieve all prescriptions + lab reports for a patient
───────────────────────────────────────────────────────────── */
router.get('/', asyncHandler(async (req, res) => {
  const { patientId } = req.query;

  if (!patientId) {
    res.status(400).json({ error: 'patientId query param is required' });
    return;
  }

  let patient = await prisma.patient.findUnique({ where: { id: patientId } }).catch(() => null);

  if (!patient) {
    patient = await prisma.patient.findFirst({
      where: { OR: [{ meiosisId: patientId }, { universalCode: patientId }] }
    });
  }

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const [prescriptions, labReports] = await Promise.all([
    prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { doctor: true, items: true },
      orderBy: { startDate: 'desc' }
    }),
    prisma.labReport.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { reportDate: 'desc' }
    })
  ]);

  res.json({ patient, prescriptions, labReports });
}));

module.exports = router;
