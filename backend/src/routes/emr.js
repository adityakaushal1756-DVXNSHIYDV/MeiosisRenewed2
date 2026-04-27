const express = require('express');
const { randomUUID } = require('crypto');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { createPrescriptionPdf } = require('../lib/pdf-documents');
const { parseDurationToDays } = require('../lib/parse-duration');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   Shared helper: compute real-time isActive for a prescription
   item given the parent prescription's startDate.
   
   Priority:
     1. item.durationDays  (stored numeric — set at creation time)
     2. parseDurationToDays(item.timing)  (self-healing: parse the raw text field)
     3. rx.durationDays    (prescription-wide fallback for legacy records)
     4. 30 days            (absolute hard default)
────────────────────────────────────────────────────────────── */
function computeItemIsActive(item, rxStartDate, rxDurationDays) {
  const now = new Date();
  const startDate = rxStartDate ? new Date(rxStartDate) : now;
  const itemDays =
    item.durationDays ??
    parseDurationToDays(item.timing) ??
    rxDurationDays ??
    30;
  // expiry = startDate + itemDays days (at the *end* of that day)
  const expiryMs = startDate.getTime() + itemDays * 24 * 60 * 60 * 1000;
  return now.getTime() <= expiryMs;
}

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
    followUpDate,
    severity
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

  /* ── Generate PDF ── */
  try {
    const { publicPath } = await createPrescriptionPdf(saved.prescription, req.body.pdfTemplateHtml);
    saved.prescription = await prisma.prescription.update({
      where: { id: saved.prescription.id },
      data: { documentPath: publicPath },
      include: { items: true }
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

  // ── Access control for doctor callers ──────────────────────
  let accessLevel = 'full';
  if (caller && caller.role === 'DOCTOR') {
    const doctorAccount = await prisma.userAccount.findUnique({
      where: { id: caller.id },
      select: { doctorId: true }
    });
    const doctorId = doctorAccount?.doctorId;

    if (doctorId) {
      const link = await prisma.patientDoctor.findUnique({
        where: { patientId_doctorId: { patientId: patient.id, doctorId } }
      });

      if (!link) {
        res.status(403).json({
          error: 'not_in_network',
          message: 'This patient has not added you to their doctor network.'
        });
        return;
      }

      const settings = (patient.shareSettings && typeof patient.shareSettings === 'object')
        ? patient.shareSettings
        : {};
      if (settings.fullAccess === true)        accessLevel = 'full';
      else if (settings.labOnly === true)      accessLevel = 'lab';
      else if (settings.summaryOnly === true)  accessLevel = 'summary';
      else                                     accessLevel = 'full';
    }
  }

  // ── Fetch data ──────────────────────────────────────────────
  const [prescriptions, labReports, appointments] = await Promise.all([
    prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { doctor: true, items: accessLevel !== 'lab' },
      orderBy: { startDate: 'desc' }
    }),
    prisma.labReport.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { reportDate: 'desc' }
    }),
    prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { scheduledDate: 'desc' }
    })
  ]);

  // ── Apply access-level filtering ────────────────────────────
  let prescriptionsOut = prescriptions;

  if (accessLevel === 'lab') {
    prescriptionsOut = [];
  } else if (accessLevel === 'summary') {
    prescriptionsOut = prescriptions.map(rx => ({
      ...rx,
      doctorNote: null,
      items: [],
    }));
  }

  // ── Enrich prescriptions with real-time isActive ────────────
  // This is computed on the fly so it's always accurate without a cron job.
  prescriptionsOut = prescriptionsOut.map(rx => {
    const enrichedItems = (rx.items || []).map(item => ({
      ...item,
      isActive: computeItemIsActive(item, rx.startDate, rx.durationDays),
    }));

    // Prescription is active if:
    //   • has items → at least one item is still active
    //   • has no items → use the prescription-level durationDays
    const rxIsActive = enrichedItems.length > 0
      ? enrichedItems.some(i => i.isActive)
      : computeItemIsActive({ durationDays: null }, rx.startDate, rx.durationDays);

    return { ...rx, items: enrichedItems, isActive: rxIsActive };
  });

  res.json({
    patient,
    prescriptions: prescriptionsOut,
    labReports,
    appointments,
    accessLevel,
  });
}));

module.exports = router;
