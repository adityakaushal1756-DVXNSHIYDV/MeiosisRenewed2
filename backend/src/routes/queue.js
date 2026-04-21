const express = require('express');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');

const router = express.Router();

/**
 * Generate a unique session code: YYYYMMDD-HHMM-<DOCTORID_SHORT>
 */
function generateSessionCode(doctorId, clinicName) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 5).replace(':', '');
  // Clinic code: first 8 chars of doctorId, uppercased
  const clinicCode = (clinicName || doctorId).replace(/\s+/g, '-').toUpperCase().slice(0, 10);
  return `${date}-${time}-${clinicCode}`;
}

/**
 * GET /api/queue/session?doctorId=&date=
 * Returns today's QueueSession for the doctor, or creates one if it doesn't exist.
 * date param is optional, defaults to today (YYYY-MM-DD in local time).
 */
router.get('/session', asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId) return res.status(400).json({ error: 'doctorId is required' });

  // Build date range for today
  const targetDate = date ? new Date(date) : new Date();
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Look for existing session
  let session = await prisma.queueSession.findFirst({
    where: {
      doctorId,
      date: { gte: dayStart, lte: dayEnd }
    }
  });

  if (!session) {
    // Get the doctor's clinic name for the session code
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    const clinicName = doctor?.clinicName || doctor?.hospital || doctorId;
    const sessionCode = generateSessionCode(doctorId, clinicName);

    session = await prisma.queueSession.create({
      data: {
        sessionCode,
        doctorId,
        clinicName,
        date: dayStart
      }
    });
  }

  res.json(session);
}));

/**
 * PATCH /api/queue/session/:sessionCode/close
 * Closes the session (marks closedAt).
 */
router.patch('/session/:sessionCode/close', asyncHandler(async (req, res) => {
  const { sessionCode } = req.params;

  const session = await prisma.queueSession.update({
    where: { sessionCode },
    data: { closedAt: new Date() }
  });

  res.json(session);
}));

/**
 * PATCH /api/queue/batch
 * Body: { updates: [{ appointmentId, status, sessionCode? }] }
 * Updates AppointmentQueue entries in bulk. Only provided fields are changed.
 * This is the low-cost dirty-sync endpoint — only changed items are sent.
 */
router.patch('/batch', asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'updates array is required' });
  }

  const results = await Promise.allSettled(
    updates.map(async ({ appointmentId, status, sessionCode }) => {
      if (!appointmentId) return null;

      const data = {};
      if (status) data.status = status;
      if (sessionCode !== undefined) data.sessionCode = sessionCode;

      if (Object.keys(data).length === 0) return null;

      return prisma.appointmentQueue.update({
        where: { appointmentId },
        data
      });
    })
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  res.json({ succeeded, failed, total: updates.length });
}));

/**
 * POST /api/queue/walkin
 * Body: { doctorId, meiosisId, visitReason?, sessionCode? }
 * Looks up the patient by Meiosis ID, creates a real Appointment + AppointmentQueue entry.
 * Returns the full appointment so the frontend can merge it into the live queue.
 */
router.post('/walkin', asyncHandler(async (req, res) => {
  const { doctorId, meiosisId, visitReason, sessionCode } = req.body;

  if (!doctorId || !meiosisId) {
    return res.status(400).json({ error: 'doctorId and meiosisId are required' });
  }

  // Explicitly look up patient by universalCode as requested by USER
  const patient = await prisma.patient.findFirst({
    where: { universalCode: meiosisId }
  });

  if (!patient) {
    return res.status(404).json({ error: `No patient found with Meiosis ID: ${meiosisId}` });
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  // Find or create a walk-in slot (we use a special sentinel DoctorSlot for walk-ins)
  // Walk-ins don't consume a real slot — we find a placeholder or create one
  let walkInSlot = await prisma.appointmentSlot.findFirst({
    where: {
      doctorId,
      status: 'AVAILABLE',
      location: 'Walk-in'
    }
  });

  if (!walkInSlot) {
    // Create a temporary slot for this walk-in
    const now = new Date();
    const endTime = new Date(now.getTime() + 30 * 60 * 1000);
    walkInSlot = await prisma.appointmentSlot.create({
      data: {
        doctorId,
        startAt: now,
        endAt: endTime,
        available: false,
        location: 'Walk-in',
        mode: 'IN_PERSON',
        status: 'BOOKED',
        slotDuration: 30
      }
    });
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Create appointment
    const appointment = await tx.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        appointmentSlotId: walkInSlot.id,
        title: 'Walk-in Consultation',
        purpose: visitReason || 'Walk-in consultation',
        scheduledDate: now,
        status: 'CONFIRMED',
        mode: 'IN_PERSON',
        doctorFee: doctor.consultFee || 0,
        slotStartTime: now,
        paymentStatus: 'MOCK_CONFIRMED',
        paymentReference: `WALKIN-${Date.now()}`,
        platformFee: 0,
        refundStatus: 'NONE'
      }
    });

    // Create queue entry and link to session if provided
    const queueEntry = await tx.appointmentQueue.create({
      data: {
        appointmentId: appointment.id,
        doctorSlotId: walkInSlot.id,
        appointmentTime: now,
        status: 'WAITING',
        sessionCode: sessionCode || null
      }
    });

    // Auto-link to patient-doctor network
    await tx.patientDoctor.upsert({
      where: { patientId_doctorId: { patientId: patient.id, doctorId } },
      create: { patientId: patient.id, doctorId },
      update: {}
    });

    return { appointment, queueEntry, patient };
  });

  res.status(201).json({
    appointment: result.appointment,
    queueEntry: result.queueEntry,
    patient: result.patient
  });
}));

module.exports = router;
