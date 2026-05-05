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
 * GET /api/queue/entries
 * Query: doctorId=... & sessionCode=... (optional)
 * Returns all active queue entries for the doctor/session.
 */
router.get('/entries', asyncHandler(async (req, res) => {
  const { doctorId, sessionCode } = req.query;
  if (!doctorId) return res.status(400).json({ error: 'doctorId is required' });

  let where = {
    appointment: { doctorId },
    status: { notIn: ['COMPLETED', 'NO_SHOW'] }
  };

  if (sessionCode) {
    where.sessionCode = sessionCode;
  }

  const entries = await prisma.appointmentQueue.findMany({
    where,
    orderBy: { queueNo: 'asc' },
    include: {
      appointment: {
        include: {
          patient: true
        }
      }
    }
  });

  // Flatten the response for the frontend
  res.json(entries.map(e => ({
    id: e.id,
    sequenceNumber: e.queueNo,
    status: e.status,
    checkInTime: e.createdAt,
    patient: e.appointment.patient,
    appointmentId: e.appointmentId
  })));
}));

/**
 * PATCH /api/queue/batch
 * Body: { entries: [{ id, sequenceNumber, status? }] }
 * Updates sequence and/or status for multiple queue entries.
 */
router.patch('/batch', asyncHandler(async (req, res) => {
  const { entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'entries array is required' });
  }

  const results = await prisma.$transaction(
    entries.map(({ id, sequenceNumber, status }) => {
      const data = {};
      if (sequenceNumber !== undefined) data.queueNo = sequenceNumber;
      if (status) data.status = status;

      return prisma.appointmentQueue.update({
        where: { id },
        data
      });
    })
  );

  res.json({ success: true, count: results.length });
}));

/**
 * POST /api/queue/entries
 * Body: { patientId, doctorId, status?, sessionCode? }
 * Checks in an existing patient into the live queue.
 */
router.post('/entries', asyncHandler(async (req, res) => {
  const { patientId, doctorId, status, sessionCode } = req.body;
  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'patientId and doctorId are required' });
  }

  // Find most recent appointment for today or create a virtual one
  let appointment = await prisma.appointment.findFirst({
    where: { 
      patientId, 
      doctorId,
      status: 'CONFIRMED',
      scheduledDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    },
    orderBy: { scheduledDate: 'desc' }
  });

  if (!appointment) {
    // Create a virtual appointment for this check-in if none exists today
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        title: 'Walk-in / Check-in',
        purpose: 'Clinical Consultation',
        scheduledDate: new Date(),
        status: 'CONFIRMED',
        mode: 'IN_PERSON',
        doctorFee: doctor?.consultFee || 0
      }
    });
  }

  // Find max queueNo for today
  const lastEntry = await prisma.appointmentQueue.findFirst({
    where: { appointment: { doctorId } },
    orderBy: { queueNo: 'desc' }
  });
  const nextQueueNo = (lastEntry?.queueNo || 0) + 1;

  // Find a slot for this appointment if none linked
  let slotId = appointment.appointmentSlotId;
  if (!slotId) {
    const slot = await prisma.appointmentSlot.findFirst({
      where: { doctorId, status: 'AVAILABLE' }
    });
    slotId = slot?.id;
  }

  const entry = await prisma.appointmentQueue.create({
    data: {
      appointmentId: appointment.id,
      doctorSlotId: slotId || 'placeholder-slot', // Fallback for demo
      appointmentTime: new Date(),
      queueNo: nextQueueNo,
      status: status || 'WAITING',
      sessionCode: sessionCode || null
    },
    include: {
      appointment: {
        include: {
          patient: true
        }
      }
    }
  });

  res.status(201).json({
    id: entry.id,
    sequenceNumber: entry.queueNo,
    status: entry.status,
    checkInTime: entry.createdAt,
    patient: entry.appointment.patient,
    appointmentId: entry.appointmentId
  });
}));
/**
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
        purpose: visitReason || null, // Allow null if no reason provided
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
