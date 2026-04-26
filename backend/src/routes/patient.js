const express = require('express');
const path = require('path');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { ensureFutureAppointmentSlots } = require('../lib/appointment-slots');
const { createPatientSummaryPdf, createPatientAuditPdf } = require('../lib/pdf-documents');

const { authMiddleware } = require('../middleware/auth-middleware');

const router = express.Router();

// Get all patients
router.get('/', asyncHandler(async (req, res) => {
  const patients = await prisma.patient.findMany({
    orderBy: { name: 'asc' }
  });
  res.json(patients);
}));

// Check if a 10-digit code is available (not taken by any patient)
router.get('/check-code', asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code || !/^\d{10}$/.test(String(code))) {
    return res.status(400).json({ error: 'code must be exactly 10 digits.' });
  }
  const existing = await prisma.patient.findUnique({ where: { universalCode: String(code) } });
  res.json({ available: !existing });
}));

// Set the patient's chosen Meiosis code
router.patch('/setup-code', asyncHandler(async (req, res) => {
  const { patientId, code } = req.body;
  if (!patientId || !code || !/^\d{10}$/.test(String(code))) {
    return res.status(400).json({ error: 'patientId and a 10-digit code are required.' });
  }
  const existing = await prisma.patient.findUnique({ where: { universalCode: String(code) } });
  if (existing && existing.id !== patientId) {
    return res.status(409).json({ error: 'This code is already taken. Please choose another.' });
  }
  const updated = await prisma.patient.update({
    where: { id: String(patientId) },
    data: { universalCode: String(code) }
  });
  res.json({ success: true, universalCode: updated.universalCode });
}));

router.get('/profile', asyncHandler(async (req, res) => {
  await ensureFutureAppointmentSlots(prisma);
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'id query parameter is required' });
  }
  const patient = await prisma.patient.findFirst({
    where: { OR: [{ id: String(id) }, { meiosisId: String(id) }, { universalCode: String(id) }] },
    include: {
      appointments: {
        include: {
          doctor: {
            include: {
              slots: {
                where: {
                  available: true,
                  startAt: { gte: new Date() }
                },
                orderBy: { startAt: 'asc' }
              }
            }
          },
          appointmentSlot: true,
          queueEntry: true,
          payment: true
        },
        orderBy: { scheduledDate: 'asc' }
      },
      prescriptions: {
        include: { doctor: true, items: true },
        orderBy: { startDate: 'desc' }
      },
      labReports: {
        include: { doctor: true },
        orderBy: { reportDate: 'desc' }
      },
      doctorLinks: {
        include: { doctor: true }
      }
    }
  });

  res.json(patient);
}));

async function loadPatientWithRecords(id) {
  return prisma.patient.findFirst({
    where: { OR: [{ id: String(id) }, { meiosisId: String(id) }, { universalCode: String(id) }] },
    include: {
      appointments: {
        include: {
          doctor: true,
          appointmentSlot: true,
          queueEntry: true,
          payment: true
        },
        orderBy: { scheduledDate: 'asc' }
      },
      prescriptions: {
        include: { doctor: true, items: true },
        orderBy: { startDate: 'desc' }
      },
      labReports: {
        include: { doctor: true },
        orderBy: { reportDate: 'desc' }
      }
    }
  });
}

router.get('/:id/summary-pdf', asyncHandler(async (req, res) => {
  const patient = await loadPatientWithRecords(req.params.id);
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const { absolutePath } = await createPatientSummaryPdf(patient);
  if (req.query.download === '1') {
    res.download(absolutePath);
    return;
  }
  res.sendFile(path.resolve(absolutePath));
}));

router.get('/:id/audit-pdf', asyncHandler(async (req, res) => {
  const patient = await loadPatientWithRecords(req.params.id);
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const { absolutePath } = await createPatientAuditPdf(patient);
  if (req.query.download === '1') {
    res.download(absolutePath);
    return;
  }
  res.sendFile(path.resolve(absolutePath));
}));

/* ─────────────────────────────────────────────────────────────
   GET /api/patients/:id/share-settings
   Returns patient's share settings { fullAccess, labOnly, summaryOnly }
   :id can be patient DB id, meiosisId, or universalCode
───────────────────────────────────────────────────────────── */
router.get('/:id/share-settings', asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findFirst({
    where: { OR: [{ id: req.params.id }, { meiosisId: req.params.id }, { universalCode: req.params.id }] },
    select: { shareSettings: true }
  });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const defaults = { fullAccess: false, labOnly: false, summaryOnly: false };
  const settings = patient.shareSettings
    ? { ...defaults, ...(patient.shareSettings) }
    : defaults;

  res.json(settings);
}));

/* ─────────────────────────────────────────────────────────────
   PATCH /api/patients/:id/share-settings
   Body: { fullAccess?, labOnly?, summaryOnly? }
   Saves the patient's share control choices
───────────────────────────────────────────────────────────── */
router.patch('/:id/share-settings', asyncHandler(async (req, res) => {
  const { fullAccess, labOnly, summaryOnly } = req.body;

  const patient = await prisma.patient.findFirst({
    where: { OR: [{ id: req.params.id }, { meiosisId: req.params.id }, { universalCode: req.params.id }] }
  });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const current = (patient.shareSettings && typeof patient.shareSettings === 'object')
    ? patient.shareSettings
    : { fullAccess: false, labOnly: false, summaryOnly: false };

  const updated = {
    fullAccess:   typeof fullAccess   === 'boolean' ? fullAccess   : current.fullAccess,
    labOnly:      typeof labOnly      === 'boolean' ? labOnly      : current.labOnly,
    summaryOnly:  typeof summaryOnly  === 'boolean' ? summaryOnly  : current.summaryOnly,
  };

  await prisma.patient.update({
    where: { id: patient.id },
    data: { shareSettings: updated }
  });

  res.json(updated);
}));

/* ─────────────────────────────────────────────────────────────
   PATCH /api/patients/:id/admission
   Body: { medicalStatus, admissionWard, admissionBed }
   Updates the patient's current hospital admission status
───────────────────────────────────────────────────────────── */
router.patch('/:id/admission', asyncHandler(async (req, res) => {
  const { medicalStatus, admissionWard, admissionBed } = req.body;
  
  const patient = await prisma.patient.findFirst({
    where: { OR: [{ id: req.params.id }, { meiosisId: req.params.id }, { universalCode: req.params.id }] }
  });
  
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  
  const updated = await prisma.patient.update({
    where: { id: patient.id },
    data: {
      medicalStatus: medicalStatus || 'normal',
      admissionWard: medicalStatus && medicalStatus !== 'normal' ? admissionWard : null,
      admissionBed: medicalStatus && medicalStatus !== 'normal' ? admissionBed : null,
      admissionTime: medicalStatus && medicalStatus !== 'normal' ? new Date() : null
    }
  });
  
  res.json(updated);
}));

/* ─────────────────────────────────────────────────────────────
   GET /api/patients/admissions/all
   Fetches all currently admitted patients (hospitalised or observation)
───────────────────────────────────────────────────────────── */
router.get('/admissions/all', asyncHandler(async (req, res) => {
  const patients = await prisma.patient.findMany({
    where: {
      medicalStatus: { in: ['observation', 'hospitalisation'] }
    },
    select: {
      id: true,
      meiosisId: true,
      name: true,
      medicalStatus: true,
      admissionWard: true,
      admissionBed: true,
      admissionTime: true
    }
  });
  res.json(patients);
}));

module.exports = router;
