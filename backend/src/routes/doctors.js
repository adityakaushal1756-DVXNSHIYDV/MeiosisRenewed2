const express = require('express');
const multer = require('multer');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { ensureFutureAppointmentSlots } = require('../lib/appointment-slots');
const { extractFieldsFromPdf, validateTemplateFields, REQUIRED_FIELDS } = require('../lib/pdf-template-engine');

const router = express.Router();

// multer: hold uploaded PDF in memory for parsing (no disk write needed)
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted for template upload.'));
  },
});

router.get('/', asyncHandler(async (req, res) => {
  await ensureFutureAppointmentSlots(prisma);
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const doctors = await prisma.doctor.findMany({
    orderBy: { name: 'asc' }
  });

  const filtered = q
    ? doctors.filter((doctor) => (
      doctor.name.toLowerCase().includes(q) ||
      doctor.specialty.toLowerCase().includes(q) ||
      doctor.hospital.toLowerCase().includes(q) ||
      doctor.meiosisId.toLowerCase().includes(q)
    ))
    : doctors;

  res.json(filtered);
}));

router.get('/:doctorId/slots', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query; // optional YYYY-MM-DD

  await ensureFutureAppointmentSlots(prisma, doctorId);

  const where = {
    doctorId,
    available: true,
    startAt: { gte: new Date() }
  };

  if (date) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    where.startAt = { gte: dayStart, lte: dayEnd };
  }

  const slots = await prisma.appointmentSlot.findMany({
    where,
    orderBy: { startAt: 'asc' }
  });

  res.json(slots);
}));

router.get('/:doctorId/available-dates', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  await ensureFutureAppointmentSlots(prisma, doctorId);

  const slots = await prisma.appointmentSlot.findMany({
    where: {
      doctorId,
      available: true,
      startAt: { gte: new Date() }
    },
    select: { startAt: true },
    orderBy: { startAt: 'asc' }
  });

  // Return unique YYYY-MM-DD strings so the frontend can highlight a calendar
  const dates = [...new Set(
    slots.map((s) => s.startAt.toISOString().slice(0, 10))
  )];

  res.json(dates);
}));

router.get('/:doctorId/schedules', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const schedules = await prisma.doctorSchedule.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: 'asc' }
  });

  res.json(schedules);
}));

router.get('/:doctorId/schedule-overrides', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const overrides = await prisma.doctorScheduleOverride.findMany({
    where: {
      doctorId,
      overrideDate: { gte: new Date() }
    },
    orderBy: { overrideDate: 'asc' }
  });

  res.json(overrides);
}));

// Lightweight endpoint: update slotDuration on all active schedules + regenerate slots.
// Called automatically by the doctor frontend when the slider changes (debounced).
router.patch('/:doctorId/slot-duration', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const slotDuration = Number(req.body.slotDuration);

  if (!Number.isFinite(slotDuration) || slotDuration < 1) {
    return res.status(400).json({ error: 'slotDuration must be a positive number.' });
  }

  const updated = await prisma.doctorSchedule.updateMany({
    where: { doctorId, isActive: true },
    data: { slotDuration }
  });

  if (updated.count === 0) {
    // No active schedules yet — nothing to regenerate, but not an error.
    return res.json({ ok: true, slotDuration, schedulesUpdated: 0 });
  }

  // Delete only future available (un-booked) slots, then regenerate.
  await prisma.appointmentSlot.deleteMany({
    where: { doctorId, available: true, startAt: { gte: new Date() } }
  });

  await ensureFutureAppointmentSlots(prisma, doctorId);

  res.json({ ok: true, slotDuration, schedulesUpdated: updated.count });
}));

router.put('/:doctorId/schedules', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { schedules } = req.body;

  if (!Array.isArray(schedules) || !schedules.length) {
    return res.status(400).json({ error: 'schedules array is required.' });
  }

  const normalized = schedules.map((schedule) => ({
    dayOfWeek: Number(schedule.dayOfWeek),
    startTime: String(schedule.startTime || ''),
    endTime: String(schedule.endTime || ''),
    slotDuration: Number(schedule.slotDuration || 30),
    breakStart: schedule.breakStart ? String(schedule.breakStart) : null,
    breakEnd: schedule.breakEnd ? String(schedule.breakEnd) : null,
    isActive: schedule.isActive !== false
  }));

  const invalid = normalized.find((schedule) => (
    !Number.isInteger(schedule.dayOfWeek) ||
    schedule.dayOfWeek < 0 ||
    schedule.dayOfWeek > 6 ||
    !schedule.startTime ||
    !schedule.endTime ||
    schedule.slotDuration <= 0
  ));

  if (invalid) {
    return res.status(400).json({ error: 'Each schedule needs dayOfWeek, startTime, endTime, and positive slotDuration.' });
  }

  await prisma.$transaction(async (tx) => {
    for (const schedule of normalized) {
      const existing = await tx.doctorSchedule.findFirst({
        where: {
          doctorId,
          dayOfWeek: schedule.dayOfWeek
        },
        orderBy: { createdAt: 'asc' }
      });

      if (existing) {
        await tx.doctorSchedule.update({
          where: { id: existing.id },
          data: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration,
            breakStart: schedule.breakStart,
            breakEnd: schedule.breakEnd,
            isActive: schedule.isActive
          }
        });

        await tx.doctorSchedule.deleteMany({
          where: {
            doctorId,
            dayOfWeek: schedule.dayOfWeek,
            id: { not: existing.id }
          }
        });
      } else {
        await tx.doctorSchedule.create({
          data: {
            doctorId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration,
            breakStart: schedule.breakStart,
            breakEnd: schedule.breakEnd,
            isActive: schedule.isActive
          }
        });
      }
    }
  });

  await prisma.appointmentSlot.deleteMany({
    where: {
      doctorId,
      available: true,
      startAt: { gte: new Date() }
    }
  });

  await ensureFutureAppointmentSlots(prisma, doctorId);

  const updatedSchedules = await prisma.doctorSchedule.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: 'asc' }
  });

  res.json(updatedSchedules);
}));

router.delete('/:doctorId/schedule-overrides/:overrideDate', asyncHandler(async (req, res) => {
  const { doctorId, overrideDate } = req.params;

  const date = new Date(`${overrideDate.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return res.status(400).json({ error: 'Invalid date. Use YYYY-MM-DD format.' });
  }

  const existing = await prisma.doctorScheduleOverride.findUnique({
    where: { doctorId_overrideDate: { doctorId, overrideDate: date } }
  });

  if (!existing) {
    return res.status(404).json({ error: 'Override not found.' });
  }

  await prisma.doctorScheduleOverride.delete({
    where: { doctorId_overrideDate: { doctorId, overrideDate: date } }
  });

  // Regenerate slots for this date now that the override is gone
  await prisma.appointmentSlot.deleteMany({
    where: { doctorId, available: true, startAt: { gte: new Date() } }
  });
  await ensureFutureAppointmentSlots(prisma, doctorId);

  res.json({ deleted: true, overrideDate });
}));

router.put('/:doctorId/schedule-overrides', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { overrides } = req.body;

  if (!Array.isArray(overrides)) {
    return res.status(400).json({ error: 'overrides array is required.' });
  }

  const normalized = overrides.map((override) => ({
    overrideDate: new Date(`${String(override.overrideDate).slice(0, 10)}T00:00:00.000Z`),
    isOffDay: Boolean(override.isOffDay),
    startTime: override.startTime ? String(override.startTime) : null,
    endTime: override.endTime ? String(override.endTime) : null,
    slotDuration: override.slotDuration ? Number(override.slotDuration) : null,
    breakStart: override.breakStart ? String(override.breakStart) : null,
    breakEnd: override.breakEnd ? String(override.breakEnd) : null,
    note: override.note ? String(override.note) : null
  }));

  const invalid = normalized.find((override) => (
    Number.isNaN(override.overrideDate.getTime()) ||
    (!override.isOffDay && (!override.startTime || !override.endTime)) ||
    (override.slotDuration !== null && override.slotDuration <= 0)
  ));

  if (invalid) {
    return res.status(400).json({ error: 'Each override needs a valid date and either off-day or custom working hours.' });
  }

  await prisma.$transaction(async (tx) => {
    for (const override of normalized) {
      await tx.doctorScheduleOverride.upsert({
        where: {
          doctorId_overrideDate: {
            doctorId,
            overrideDate: override.overrideDate
          }
        },
        update: {
          isOffDay: override.isOffDay,
          startTime: override.isOffDay ? null : override.startTime,
          endTime: override.isOffDay ? null : override.endTime,
          slotDuration: override.isOffDay ? null : override.slotDuration,
          breakStart: override.isOffDay ? null : override.breakStart,
          breakEnd: override.isOffDay ? null : override.breakEnd,
          note: override.note
        },
        create: {
          doctorId,
          overrideDate: override.overrideDate,
          isOffDay: override.isOffDay,
          startTime: override.isOffDay ? null : override.startTime,
          endTime: override.isOffDay ? null : override.endTime,
          slotDuration: override.isOffDay ? null : override.slotDuration,
          breakStart: override.isOffDay ? null : override.breakStart,
          breakEnd: override.isOffDay ? null : override.breakEnd,
          note: override.note
        }
      });
    }
  });

  await prisma.appointmentSlot.deleteMany({
    where: {
      doctorId,
      available: true,
      startAt: { gte: new Date() }
    }
  });

  await ensureFutureAppointmentSlots(prisma, doctorId);

  const updatedOverrides = await prisma.doctorScheduleOverride.findMany({
    where: {
      doctorId,
      overrideDate: { gte: new Date() }
    },
    orderBy: { overrideDate: 'asc' }
  });

  res.json(updatedOverrides);
}));

// ── Doctor Preferences ─────────────────────────────────────────────────────
// GET  /api/doctors/:doctorId/preferences  — fetch (or auto-create) prefs row
// PATCH /api/doctors/:doctorId/preferences — partial update (only sent keys)

const PREF_ALLOWED_FIELDS = new Set([
  'themeMode', 'customThemeHue', 'customThemeBrightness',
  'timelineTheme', 'emrBuilderV2Theme', 'emrBuilderLayout', 'timelineLayout',
  'consoleCollapsible', 'consoleCollapsed', 'consoleWidth',
  'slotDuration', 'queueBlockDuration', 'followUpGapDays',
  'lang', 'prescriptionTemplates', 'pdfTemplates',
]);

// ── PDF Template Upload & Analysis ────────────────────────────────────────────
// POST /api/doctors/:doctorId/pdf-template/upload
// Accepts a PDF file, extracts {{field}} placeholders, validates required fields.
// Returns { valid, missing, found, requiredFields } — does NOT save; the frontend
// saves the structured template via PATCH /preferences after the user confirms.
router.post(
  '/:doctorId/pdf-template/upload',
  pdfUpload.single('template'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file was uploaded. Attach the file as form field "template".' });
    }

    let foundFields;
    try {
      foundFields = await extractFieldsFromPdf(req.file.buffer);
    } catch (err) {
      console.error('[PDF Template] Extraction failed:', err.message);
      return res.status(422).json({
        error: 'Could not read the uploaded PDF. Make sure it is a valid PDF with text-based {{field}} placeholders.',
      });
    }

    const { valid, missing, found } = validateTemplateFields(foundFields);

    res.json({
      valid,
      missing,
      found,
      requiredFields: REQUIRED_FIELDS,
      message: valid
        ? 'Template is valid. All required fields are present.'
        : `Template is missing ${missing.length} required field(s). Add the placeholders listed in "missing" and re-upload.`,
    });
  })
);

router.get('/:doctorId/preferences', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  // upsert with no update fields → returns existing row or creates defaults
  const prefs = await prisma.doctorPreferences.upsert({
    where: { doctorId },
    create: { doctorId },
    update: {},
  });
  res.json(prefs);
}));

router.patch('/:doctorId/preferences', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const data = {};
  for (const key of PREF_ALLOWED_FIELDS) {
    if (key in req.body) data[key] = req.body[key];
  }
  if (!Object.keys(data).length) {
    return res.status(400).json({ error: 'No valid preference fields provided.' });
  }
  const prefs = await prisma.doctorPreferences.upsert({
    where: { doctorId },
    create: { doctorId, ...data },
    update: data,
  });
  res.json(prefs);
}));

router.get('/:doctorId/patients', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const patientSelect = { id: true, name: true, meiosisId: true, universalCode: true, phone: true, email: true };
  const [apptRows, rxRows] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId },
      select: { patient: { select: patientSelect } },
      distinct: ['patientId']
    }),
    prisma.prescription.findMany({
      where: { doctorId },
      select: { patient: { select: patientSelect } },
      distinct: ['patientId']
    })
  ]);
  const map = new Map();
  [...apptRows, ...rxRows].forEach(r => { if (r.patient) map.set(r.patient.id, r.patient); });
  res.json([...map.values()]);
}));

module.exports = router;
