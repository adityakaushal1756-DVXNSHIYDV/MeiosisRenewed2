const express = require('express');
const { randomUUID } = require('crypto');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');

const { parseDurationToDays } = require('../lib/parse-duration');
const {
  buildPatientEmrPayload,
  getLinkedDoctorAccessLevel,
  resolvePatient,
} = require('../lib/emr-read');

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
    simpleNote,
    prescriptionRows = [],
    labTests,
    followUpDate,
    severity
  } = req.body;

  if (!patientId) {
    res.status(400).json({ error: 'patientId is required' });
    return;
  }

  /* ── Resolve patient (by DB id, meiosisId, or universalCode) ── */
  let patient = await resolvePatient(patientId);

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

  // Parse per-item durations from the doctor's prescription rows
  const medicines = prescriptionRows.filter(r => r.medicineName?.trim());
  const parsedItemDays = medicines.map(r => parseDurationToDays(r.duration));

  // Overall prescription duration = max of all individual item durations.
  // Falls back to followUpDate calculation if no items had parseable durations.
  const maxItemDays = parsedItemDays.filter(d => d !== null).reduce((max, d) => Math.max(max, d), 0);

  let durationDays;
  let endDate;
  if (maxItemDays > 0) {
    durationDays = maxItemDays;
    endDate = new Date(now.getTime() + maxItemDays * 24 * 60 * 60 * 1000);
  } else if (followUpDate) {
    endDate = new Date(followUpDate);
    durationDays = Math.max(1, Math.round((endDate - now) / (1000 * 60 * 60 * 24)));
  } else {
    // Default: 30 days
    durationDays = 30;
    endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const doctorNote = [
    patientInfo   && `Chief Complaint: ${patientInfo}`,
    symptoms      && `Subjective: ${symptoms}`,
    diagnosis     && `Assessment: ${diagnosis}`,
    simpleNote    && `Added Note: ${simpleNote}`,
    severity      && `Severity: ${severity}`,
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
      severity: severity || null,
      abdmCareContextId: abdmCareContextId || null,
      diagnosisCode: diagnosisCode || null,
      symptomCode: symptomCode || null,
      ...(medicines.length > 0 && {
        items: {
          create: medicines.map((r, idx) => ({
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
            reason:                  r.notes     || diagnosis || 'As prescribed',
            // ── Per-item duration (the core of the fix) ──────────────
            // parsedItemDays[idx] is null if the doctor's text couldn't be parsed;
            // in that case we fall back to null and the frontend uses rx.durationDays.
            durationDays:            parsedItemDays[idx] ?? null,
          }))
        }
      })
    },
    include: { patient: true, doctor: true, items: true }
  });


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

  // Automatically link the doctor to the patient's network after treating them.
  try {
    await prisma.patientDoctor.upsert({
      where: { patientId_doctorId: { patientId: patient.id, doctorId: doctor.id } },
      create: { patientId: patient.id, doctorId: doctor.id },
      update: {}, // Already linked — no-op
    });
  } catch (linkErr) {
    console.error('[EMR] Failed to auto-link doctor to patient network:', linkErr);
  }

  res.status(201).json({ ok: true, patientId: patient.id, doctorId: doctor.id, ...saved });
}));

/* ─────────────────────────────────────────────────────────────
   GET /api/emr?patientId=<id|meiosisCode>
   Retrieve prescriptions + lab reports for a patient.
   
   Each PrescriptionItem in the response is enriched with:
     isActive: boolean  — computed from item.durationDays (or rx.durationDays) + rx.startDate
   Each Prescription in the response is enriched with:
     isActive: boolean  — true if at least one item is active (or no items but rx not expired)
───────────────────────────────────────────────────────────── */
router.get('/', asyncHandler(async (req, res) => {
  const { patientId } = req.query;
  const caller = req.user;

  if (!patientId) {
    res.status(400).json({ error: 'patientId query param is required' });
    return;
  }

  let patient = await resolvePatient(patientId);

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  let accessLevel = 'full';
  if (caller && caller.role === 'DOCTOR') {
    const doctorAccount = await prisma.userAccount.findUnique({
      where: { id: caller.id },
      select: { doctorId: true }
    });
    const doctorId = doctorAccount?.doctorId;

    if (!doctorId) {
      res.status(403).json({
        error: 'doctor_account_missing',
        message: 'Authenticated user is not attached to a doctor profile.'
      });
      return;
    }

    const linkedAccessLevel = await getLinkedDoctorAccessLevel({ patient, doctorId });
    if (!linkedAccessLevel) {
      res.status(403).json({
        error: 'not_in_network',
        message: 'This patient has not added you to their doctor network.'
      });
      return;
    }
    accessLevel = linkedAccessLevel;
  }

  res.json(await buildPatientEmrPayload({ patient, accessLevel }));
}));

module.exports = router;
