const express = require('express');
const {
  AppointmentMode,
  AppointmentStatus,
  PaymentStatus,
  QueueStatus,
  RefundStatus,
  SlotStatus
} = require('@prisma/client');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { ensureFutureAppointmentSlots } = require('../lib/appointment-slots');

const router = express.Router();

const DEFAULT_PLATFORM_FEE = 20;
const REFUND_WINDOW_HOURS = 6;

function getAppointmentInclude(now = new Date()) {
  return {
    doctor: {
      include: {
        slots: {
          where: {
            available: true,
            startAt: { gte: now }
          },
          orderBy: { startAt: 'asc' }
        }
      }
    },
    patient: true,
    appointmentSlot: true,
    queueEntry: true,
    payment: true
  };
}

function normalizeMode(mode) {
  if (mode === AppointmentMode.TELECONSULT || mode === 'Teleconsult') return AppointmentMode.TELECONSULT;
  return AppointmentMode.IN_PERSON;
}

async function recalculateQueueNumbers(tx, appointmentSlotId) {
  if (!appointmentSlotId) return;

  const queueEntries = await tx.appointmentQueue.findMany({
    where: {
      doctorSlotId: appointmentSlotId,
      status: { not: QueueStatus.CANCELLED }
    },
    orderBy: [
      { appointmentTime: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  await Promise.all(queueEntries.map((entry, index) => tx.appointmentQueue.update({
    where: { id: entry.id },
    data: { queueNo: index + 1 }
  })));
}

router.get('/', asyncHandler(async (req, res) => {
  const { patientId, doctorId, status, upcoming, date } = req.query;

  // Require at least one scoping param to prevent leaking all appointments
  if (!patientId && !doctorId) {
    return res.status(400).json({ error: 'patientId or doctorId query parameter is required' });
  }

  await ensureFutureAppointmentSlots(prisma, doctorId || null);

  const where = {};
  if (patientId) where.patientId = patientId;
  if (doctorId) where.doctorId = doctorId;
  if (status) where.status = { in: status.split(',') };
  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    where.scheduledDate = { gte: dayStart, lte: dayEnd };
  } else if (upcoming === 'true') {
    where.scheduledDate = { gte: new Date() };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: getAppointmentInclude(),
    orderBy: { scheduledDate: 'asc' }
  });

  res.json(appointments);
}));

router.get('/:appointmentId', asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: getAppointmentInclude()
  });

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  res.json(appointment);
}));

router.post('/', asyncHandler(async (req, res) => {
  const {
    patientId,
    doctorId,
    appointmentSlotId,
    title,
    purpose,
    mode,
    notes,
    paymentMethod
  } = req.body;

  if (!patientId || !doctorId || !appointmentSlotId) {
    return res.status(400).json({ error: 'patientId, doctorId, and appointmentSlotId are required.' });
  }

  const slot = await prisma.appointmentSlot.findUnique({
    where: { id: appointmentSlotId },
    include: { doctor: true }
  });

  if (!slot || slot.doctorId !== doctorId) {
    return res.status(404).json({ error: 'Selected appointment slot was not found.' });
  }

  if (!slot.available) {
    return res.status(409).json({ error: 'Selected appointment slot is no longer available.' });
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        patientId,
        amount: slot.doctor.consultFee + DEFAULT_PLATFORM_FEE,
        gateway: paymentMethod || 'Mock Payment',
        status: PaymentStatus.MOCK_CONFIRMED
      }
    });

    const created = await tx.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentSlotId,
        paymentId: payment.id,
        title: title || 'Consultation',
        purpose: purpose || null,
        doctorFee: slot.doctor.consultFee,
        slotStartTime: slot.startAt,
        scheduledDate: slot.startAt,
        status: AppointmentStatus.CONFIRMED,
        mode: normalizeMode(mode || slot.mode),
        notes: notes || null,
        paymentMethod: paymentMethod || 'Mock Payment',
        paymentStatus: PaymentStatus.MOCK_CONFIRMED,
        paymentReference: `PAY-MOCK-${Date.now()}`,
        platformFee: DEFAULT_PLATFORM_FEE,
        refundStatus: RefundStatus.NONE
      }
    });

    await tx.appointmentSlot.update({
      where: { id: appointmentSlotId },
      data: {
        available: false,
        status: SlotStatus.BOOKED
      }
    });

    await tx.appointmentQueue.create({
      data: {
        appointmentId: created.id,
        doctorSlotId: appointmentSlotId,
        appointmentTime: slot.startAt,
        status: QueueStatus.WAITING
      }
    });

    await recalculateQueueNumbers(tx, appointmentSlotId);

    return tx.appointment.findUnique({
      where: { id: created.id },
      include: getAppointmentInclude()
    });
  });

  // Ensure a message thread exists between patient and doctor
  prisma.messageThread.findFirst({ where: { doctorId, patientId } })
    .then(existing => existing || prisma.messageThread.create({ data: { doctorId, patientId } }))
    .catch(() => {});

  // Auto-link doctor into patient's network on appointment booking
  prisma.patientDoctor.upsert({
    where:  { patientId_doctorId: { patientId, doctorId } },
    create: { patientId, doctorId },
    update: {},
  }).catch(() => {});

  res.status(201).json(appointment);
}));


router.patch('/:appointmentId', asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const {
    appointmentSlotId,
    scheduledDate,
    status,
    mode,
    notes,
    paymentMethod
  } = req.body;

  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: true,
      appointmentSlot: true,
      queueEntry: true,
      payment: true
    }
  });

  if (!existing) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }

  if (status === AppointmentStatus.COMPLETED || status === 'COMPLETED') {
    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.COMPLETED }
      });
      if (existing.queueEntry) {
        await tx.appointmentQueue.update({
          where: { appointmentId },
          data: { status: QueueStatus.COMPLETED }
        });
      }
      return tx.appointment.findUnique({
        where: { id: updated.id },
        include: getAppointmentInclude()
      });
    });
    return res.json(appointment);
  }

  if (status === AppointmentStatus.CANCELLED || status === 'CANCELLED') {
    const cancelledAt = new Date();
    const refundCutoff = new Date(existing.scheduledDate.getTime() - REFUND_WINDOW_HOURS * 60 * 60 * 1000);
    const refundEligible = cancelledAt < refundCutoff;
    const refundAmount = refundEligible ? (existing.doctorFee + (existing.platformFee || 0)) : 0;

    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelledAt,
          refundStatus: refundEligible ? RefundStatus.REFUND_INITIATED : RefundStatus.NOT_ELIGIBLE,
          refundAmount,
          paymentStatus: refundEligible ? PaymentStatus.REFUNDED : existing.paymentStatus
        }
      });

      if (existing.appointmentSlotId) {
        await tx.appointmentSlot.update({
          where: { id: existing.appointmentSlotId },
          data: {
            available: true,
            status: SlotStatus.AVAILABLE
          }
        });
      }

      if (existing.paymentId && refundEligible) {
        await tx.payment.update({
          where: { id: existing.paymentId },
          data: { status: PaymentStatus.REFUNDED }
        });
      }

      if (existing.queueEntry) {
        await tx.appointmentQueue.update({
          where: { appointmentId },
          data: {
            status: QueueStatus.CANCELLED,
            queueNo: 0
          }
        });
        await recalculateQueueNumbers(tx, existing.queueEntry.doctorSlotId);
      }

      return tx.appointment.findUnique({
        where: { id: updated.id },
        include: getAppointmentInclude()
      });
    });

    return res.json({
      ...appointment,
      refundEligible,
      refundWindowHours: REFUND_WINDOW_HOURS
    });
  }

  if (appointmentSlotId) {
    const nextSlot = await prisma.appointmentSlot.findUnique({
      where: { id: appointmentSlotId }
    });

    if (!nextSlot || nextSlot.doctorId !== existing.doctorId) {
      return res.status(404).json({ error: 'Requested reschedule slot was not found.' });
    }

    if (!nextSlot.available) {
      return res.status(409).json({ error: 'Requested reschedule slot is no longer available.' });
    }

    const appointment = await prisma.$transaction(async (tx) => {
      if (existing.appointmentSlotId) {
        await tx.appointmentSlot.update({
          where: { id: existing.appointmentSlotId },
          data: {
            available: true,
            status: SlotStatus.AVAILABLE
          }
        });
      }

      await tx.appointmentSlot.update({
        where: { id: appointmentSlotId },
        data: {
          available: false,
          status: SlotStatus.BOOKED
        }
      });

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          appointmentSlotId,
          doctorFee: existing.doctor.consultFee,
          slotStartTime: nextSlot.startAt,
          scheduledDate: nextSlot.startAt,
          mode: normalizeMode(mode || nextSlot.mode),
          notes: notes !== undefined ? notes : existing.notes,
          paymentMethod: paymentMethod || existing.paymentMethod || 'Mock Payment',
          status: AppointmentStatus.CONFIRMED,
          cancelledAt: null,
          refundStatus: RefundStatus.NONE,
          refundAmount: 0
        }
      });

      if (existing.queueEntry) {
        await tx.appointmentQueue.update({
          where: { appointmentId },
          data: {
            doctorSlotId: appointmentSlotId,
            appointmentTime: nextSlot.startAt,
            status: QueueStatus.WAITING,
            queueNo: 1
          }
        });
      } else {
        await tx.appointmentQueue.create({
          data: {
            appointmentId,
            doctorSlotId: appointmentSlotId,
            appointmentTime: nextSlot.startAt,
            status: QueueStatus.WAITING
          }
        });
      }

      if (existing.appointmentSlotId && existing.appointmentSlotId !== appointmentSlotId) {
        await recalculateQueueNumbers(tx, existing.appointmentSlotId);
      }
      await recalculateQueueNumbers(tx, appointmentSlotId);

      return tx.appointment.findUnique({
        where: { id: updated.id },
        include: getAppointmentInclude()
      });
    });

    return res.json(appointment);
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      ...(scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {}),
      ...(status ? { status } : {}),
      ...(mode ? { mode: normalizeMode(mode) } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(paymentMethod ? { paymentMethod } : {})
    },
    include: getAppointmentInclude()
  });

  res.json(appointment);
}));

module.exports = router;
