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
  // Slot generation is decommissioned. Returning existing slots only.

  // Only return slots from today onwards (up to 7 days for the UI)
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeStart.getDate() + 7);

  const slots = await prisma.appointmentSlot.findMany({
    where: { 
      doctorId,
      startAt: {
        gte: rangeStart,
        lt: rangeEnd
      }
    },
    orderBy: { startAt: 'asc' }
  });
  res.json(slots);
}));

// ── Staff Management ────────────────────────────────────────────────────────
router.get('/:doctorId/staff', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  console.log(`[Staff Fetch] Request for Doctor ID: ${doctorId}`);
  
  if (!doctorId || doctorId === 'undefined') {
    return res.status(400).json({ error: 'Valid Doctor ID is required.' });
  }

  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
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

router.post('/:doctorId/staff', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { name, email, password, role } = req.body;
  console.log(`[Staff Add] Request for Doctor ID: ${doctorId}`, { name, email, role });

  if (!name || !email || !password || !role) {
    console.warn('[Staff Add] Missing required fields');
    return res.status(400).json({ error: 'name, email, password, and role are required.' });
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    console.error(`[Staff Add] Doctor not found: ${doctorId}`);
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

// ── Schedule Management ──────────────────────────────────────────────────────
router.put('/:doctorId/schedules', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime, breakStart, breakEnd, slotDuration, isActive }

  if (!Array.isArray(schedules)) {
    return res.status(400).json({ error: 'Schedules must be an array.' });
  }

  await prisma.$transaction(async (tx) => {
    // 1. Clear existing active schedules for this doctor
    await tx.doctorSchedule.deleteMany({
      where: { doctorId }
    });

    // 2. Create new schedules
    if (schedules.length > 0) {
      await tx.doctorSchedule.createMany({
        data: schedules.map(s => ({
          doctorId,
          dayOfWeek: Number(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime,
          breakStart: s.breakStart || null,
          breakEnd: s.breakEnd || null,
          slotDuration: Number(s.slotDuration || 30),
          isActive: s.isActive !== undefined ? s.isActive : true
        }))
      });
    }
  });


  res.json({ success: true, message: 'Schedule updated and slots synchronized.' });
}));

// ── Preference Management ───────────────────────────────────────────────────
router.get('/:doctorId/preferences', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const prefs = await prisma.doctorPreferences.findUnique({
    where: { doctorId }
  });
  
  if (!prefs) {
    // Return default empty or basic prefs if none exist
    return res.json({ doctorId });
  }
  
  res.json(prefs);
}));

router.patch('/:doctorId/preferences', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const patch = req.body;

  // Whitelist of valid fields to prevent Prisma errors from extra/invalid keys
  const allowedFields = [
    'themeMode', 'customThemeHue', 'customThemeBrightness',
    'timelineTheme', 'emrBuilderV2Theme', 'emrBuilderLayout', 'timelineLayout',
    'consoleCollapsible', 'consoleCollapsed', 'consoleWidth',
    'slotDuration', 'queueBlockDuration', 'followUpGapDays', 'lang',
    'prescriptionTemplates', 'pdfTemplates', 'timelineZoom', 'timelineWarp',
    'singularityEnabled', 'singularityModern', 'singularitySpeed', 'singularityPages',
    'prescriptionLayout', 'autoPrintEnabled'
  ];

  const filteredPatch = {};
  for (const key of allowedFields) {
    if (patch[key] !== undefined) {
      filteredPatch[key] = patch[key];
    }
  }

  // We use upsert to ensure the preferences record exists
  const prefs = await prisma.doctorPreferences.upsert({
    where: { doctorId },
    create: {
      doctorId,
      ...filteredPatch
    },
    update: filteredPatch
  });

  res.json(prefs);
}));

module.exports = router;
