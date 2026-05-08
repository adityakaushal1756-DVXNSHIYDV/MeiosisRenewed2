const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { ensureFutureAppointmentSlots } = require('../lib/appointment-slots');

// ── Patient Discovery ────────────────────────────────────────────────────────
router.get('/discover/:meiosisId', asyncHandler(async (req, res) => {
  const { meiosisId } = req.params;
  const patient = await prisma.patient.findUnique({
    where: { meiosisId },
    select: {
      name: true,
      meiosisId: true,
      bloodGroup: true,
      phone: true
    }
  });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
}));

router.get('/:doctorId/patients', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const links = await prisma.doctorPatientLink.findMany({
    where: { doctorId },
    include: { patient: true },
    orderBy: { linkedAt: 'desc' }
  });
  res.json(links.map(l => ({ ...l.patient, linkedAt: l.linkedAt })));
}));

router.get('/:doctorId/slots', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  await ensureFutureAppointmentSlots(prisma, doctorId);
  const slots = await prisma.appointmentSlot.findMany({
    where: { doctorId },
    orderBy: { startAt: 'asc' }
  });
  res.json(slots);
}));

// ── Staff Management ────────────────────────────────────────────────────────
router.get('/:meiosisId/staff', asyncHandler(async (req, res) => {
  const { meiosisId } = req.params;
  console.log(`[Staff Fetch] Request for Doctor MeiosisID: ${meiosisId}`);
  
  if (!meiosisId || meiosisId === 'undefined') {
    return res.status(400).json({ error: 'Valid Doctor MeiosisID is required.' });
  }

  try {
    const doctor = await prisma.doctor.findUnique({ where: { meiosisId } });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const staff = await prisma.staff.findMany({
      where: { doctorId: doctor.id },
      orderBy: { name: 'asc' }
    });
    res.json(staff);
  } catch (err) {
    console.error('[Staff Fetch] DB Error:', err);
    res.status(500).json({ error: 'Failed to retrieve staff records.' });
  }
}));

router.post('/:meiosisId/staff', asyncHandler(async (req, res) => {
  const { meiosisId } = req.params;
  const { name, email, password, role } = req.body;
  console.log(`[Staff Add] Request for Doctor MeiosisID: ${meiosisId}`, { name, email, role });

  if (!name || !email || !password || !role) {
    console.warn('[Staff Add] Missing required fields');
    return res.status(400).json({ error: 'name, email, password, and role are required.' });
  }

  const doctor = await prisma.doctor.findUnique({ where: { meiosisId } });
  if (!doctor) {
    console.error(`[Staff Add] Doctor not found: ${meiosisId}`);
    return res.status(404).json({ error: 'Doctor record not found.' });
  }

  const existingUser = await prisma.userAccount.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    console.warn(`[Staff Add] Email already exists: ${email}`);
    return res.status(409).json({ error: 'Email already registered.' });
  }

  const accountCount = await prisma.userAccount.count({ where: { role: { notIn: ['PATIENT', 'DOCTOR'] } } });
  const staffMeiosisId = `STF-${1001 + accountCount}`;

  try {
    const createdStaff = await prisma.$transaction(async (tx) => {
      const staff = await tx.staff.create({
        data: {
          name,
          email: email.toLowerCase(),
          role,
          doctorId: doctor.id
        }
      });

      await tx.userAccount.create({
        data: {
          role,
          name,
          email: email.toLowerCase(),
          meiosisId: staffMeiosisId,
          password: String(password),
          staffId: staff.id
        }
      });

      return staff;
    });

    console.log(`[Staff Add] Successfully onboarded: ${name} (${staffMeiosisId})`);
    res.status(201).json(createdStaff);
  } catch (err) {
    console.error('[Staff Add] Transaction Error:', err);
    res.status(500).json({ error: 'Failed to onboard staff member.' });
  }
}));

module.exports = router;
