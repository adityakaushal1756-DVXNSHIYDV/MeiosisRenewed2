const express = require('express');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   Shared helper — ensure a PatientDoctor link exists (idempotent).
   Call this from anywhere: appointment booking, manual add, etc.
───────────────────────────────────────────────────────────── */
async function ensureNetworkLink(patientId, doctorId, tx = prisma) {
  if (!patientId || !doctorId) return null;
  return tx.patientDoctor.upsert({
    where:  { patientId_doctorId: { patientId, doctorId } },
    create: { patientId, doctorId },
    update: {},            // already linked — no-op
  });
}

// Export for use in appointments.js
router.ensureNetworkLink = ensureNetworkLink;

/* ─────────────────────────────────────────────────────────────
   GET /api/network/doctors/:patientId
   All doctors linked to this patient (their care team).
───────────────────────────────────────────────────────────── */
router.get('/doctors/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const links = await prisma.patientDoctor.findMany({
    where: { patientId },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
          hospital: true,
          clinicName: true,
          clinicAddress: true,
          email: true,
          phone: true,
          consultFee: true,
          rating: true,
          workingHours: true,
          qualification: true,
          yearsExperience: true,
          meiosisId: true,
        }
      }
    },
    orderBy: { linkedAt: 'desc' }
  });

  res.json(links.map(l => ({ ...l.doctor, linkedAt: l.linkedAt })));
}));

/* ─────────────────────────────────────────────────────────────
   GET /api/network/patients/:doctorId
   All patients linked to this doctor.
───────────────────────────────────────────────────────────── */
router.get('/patients/:doctorId', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const links = await prisma.patientDoctor.findMany({
    where: { doctorId },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          meiosisId: true,
          universalCode: true,
          email: true,
          phone: true,
          bloodGroup: true,
          shareSettings: true,
        }
      }
    },
    orderBy: { linkedAt: 'desc' }
  });

  res.json(links.map(l => ({ ...l.patient, linkedAt: l.linkedAt })));
}));

/* ─────────────────────────────────────────────────────────────
   GET /api/network/search?q=&patientId=
   Search ALL doctors in the database.
   Marks which ones the patient has already linked.
   Searchable by name, specialty, clinicName, hospital, email.
───────────────────────────────────────────────────────────── */
router.get('/search', asyncHandler(async (req, res) => {
  const q          = (req.query.q || '').toString().trim().toLowerCase();
  const patientId  = (req.query.patientId || '').toString().trim();

  const doctors = await prisma.doctor.findMany({
    where: q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { specialty: { contains: q, mode: 'insensitive' } },
        { hospital: { contains: q, mode: 'insensitive' } },
        { clinicName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ]
    } : {},
    select: {
      id: true,
      name: true,
      specialty: true,
      hospital: true,
      clinicName: true,
      clinicAddress: true,
      email: true,
      phone: true,
      consultFee: true,
      rating: true,
      workingHours: true,
      qualification: true,
      yearsExperience: true,
      meiosisId: true,
    },
    orderBy: { name: 'asc' },
    take: 50 // Limit to top 50 results for speed
  });

  const filtered = doctors;

  // If patientId provided, mark which ones are already linked
  let linkedSet = new Set();
  if (patientId) {
    const links = await prisma.patientDoctor.findMany({
      where: { patientId },
      select: { doctorId: true }
    });
    linkedSet = new Set(links.map(l => l.doctorId));
  }

  const result = filtered.map(d => ({
    ...d,
    isLinked: linkedSet.has(d.id),
  }));

  res.json(result);
}));

/* ─────────────────────────────────────────────────────────────
   POST /api/network/link
   Body: { patientId, doctorId }
   Instantly link a doctor to a patient (patient self-service).
   Idempotent — safe to call multiple times.
───────────────────────────────────────────────────────────── */
router.post('/link', asyncHandler(async (req, res) => {
  const { patientId, doctorId } = req.body;

  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'patientId and doctorId are required.' });
  }

  // Verify both exist
  const [patient, doctor] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId }, select: { id: true, name: true } }),
    prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, name: true, specialty: true, clinicName: true, hospital: true, email: true, consultFee: true, rating: true, meiosisId: true }
    }),
  ]);

  if (!patient) return res.status(404).json({ error: 'Patient not found.' });
  if (!doctor)  return res.status(404).json({ error: 'Doctor not found.' });

  const link = await ensureNetworkLink(patientId, doctorId);

  // Ensure a message thread exists between patient and doctor
  await prisma.messageThread.upsert({
    where:  { doctorId_patientId: { doctorId, patientId } },
    create: { doctorId, patientId },
    update: {},
  });

  res.status(201).json({
    ok: true,
    link,
    doctor: { ...doctor, isLinked: true },
  });
}));

/* ─────────────────────────────────────────────────────────────
   DELETE /api/network/unlink
   Body: { patientId, doctorId }
   Remove a doctor from the patient's network.
───────────────────────────────────────────────────────────── */
router.delete('/unlink', asyncHandler(async (req, res) => {
  const { patientId, doctorId } = req.body;

  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'patientId and doctorId are required.' });
  }

  const existing = await prisma.patientDoctor.findUnique({
    where: { patientId_doctorId: { patientId, doctorId } }
  });

  if (!existing) {
    // Already unlinked — idempotent, return OK
    return res.json({ ok: true, alreadyUnlinked: true });
  }

  await prisma.patientDoctor.delete({
    where: { patientId_doctorId: { patientId, doctorId } }
  });

  res.json({ ok: true });
}));

/* ─────────────────────────────────────────────────────────────
   GET /api/network/check?patientId=&doctorId=
   Quick membership check — used by EMR gate before serving data.
───────────────────────────────────────────────────────────── */
router.get('/check', asyncHandler(async (req, res) => {
  const { patientId, doctorId } = req.query;
  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'patientId and doctorId are required.' });
  }

  const link = await prisma.patientDoctor.findUnique({
    where: { patientId_doctorId: { patientId: String(patientId), doctorId: String(doctorId) } },
  });

  res.json({ isLinked: !!link, linkedAt: link?.linkedAt ?? null });
}));

module.exports = router;
