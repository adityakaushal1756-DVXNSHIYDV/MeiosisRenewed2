const express = require('express');
const { randomUUID } = require('crypto');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   GET /api/emr-shares/pending?doctorId=<id>
   Returns all PENDING share requests sent to a doctor
───────────────────────────────────────────────────────────── */
router.get('/pending', asyncHandler(async (req, res) => {
  const { doctorId } = req.query;
  if (!doctorId) {
    return res.status(400).json({ error: 'doctorId is required' });
  }

  const pending = await prisma.emrShare.findMany({
    where: { doctorId, status: 'PENDING' },
    include: { patient: true },
    orderBy: { createdAt: 'asc' }
  });

  res.json(pending);
}));

/* ─────────────────────────────────────────────────────────────
   GET /api/emr-shares
   List all shares (admin/debug)
───────────────────────────────────────────────────────────── */
router.get('/', asyncHandler(async (_req, res) => {
  const shares = await prisma.emrShare.findMany({
    include: { patient: true, doctor: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(shares);
}));

/* ─────────────────────────────────────────────────────────────
   POST /api/emr-shares
   Patient sends an EMR share request to a doctor (PENDING)
   Body: { patientId, doctorId, appointmentIds[], scope? }
───────────────────────────────────────────────────────────── */
router.post('/', asyncHandler(async (req, res) => {
  const { patientId, doctorId, appointmentIds = [], scope = 'full_record' } = req.body;

  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'patientId and doctorId are required' });
  }

  const [patient, doctor] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.doctor.findUnique({ where: { id: doctorId } })
  ]);

  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  if (!doctor)  return res.status(404).json({ error: 'Doctor not found' });

  const transactionId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;

  const share = await prisma.emrShare.create({
    data: {
      patientId,
      doctorId,
      transactionId,
      recordCount: appointmentIds.length,
      scope,
      status: 'PENDING',
      payload: { appointmentIds }
    },
    include: { patient: true, doctor: true }
  });

  res.status(201).json(share);
}));

/* ─────────────────────────────────────────────────────────────
   PATCH /api/emr-shares/:shareId/respond
   Doctor accepts or rejects a pending EMR share
   Body: { accepted: true | false }
───────────────────────────────────────────────────────────── */
router.patch('/:shareId/respond', asyncHandler(async (req, res) => {
  const { shareId } = req.params;
  const { accepted } = req.body;

  const share = await prisma.emrShare.findUnique({
    where: { id: shareId },
    include: { patient: true }
  });

  if (!share) {
    return res.status(404).json({ error: 'Share request not found' });
  }
  if (share.status !== 'PENDING') {
    return res.status(409).json({ error: 'Share request already responded to' });
  }

  if (!accepted) {
    const updated = await prisma.emrShare.update({
      where: { id: shareId },
      data: { status: 'REJECTED' }
    });
    return res.json(updated);
  }

  // ── Accept: copy prescriptions from original doctors to this doctor ──
  const appointmentIds = share.payload?.appointmentIds || [];

  await prisma.$transaction(async (tx) => {
    await tx.emrShare.update({ where: { id: shareId }, data: { status: 'ACCEPTED' } });

    // Resolve the doctorIds referenced by the shared appointments
    const appointments = appointmentIds.length > 0
      ? await tx.appointment.findMany({
          where: { id: { in: appointmentIds } },
          include: { doctor: true }
        })
      : [];

    const origDoctorIds = [...new Set(appointments.map(a => a.doctorId))];

    // Copy prescriptions (with items) from each original doctor to the new doctor
    for (const origDoctorId of origDoctorIds) {
      const prescriptions = await tx.prescription.findMany({
        where: { patientId: share.patientId, doctorId: origDoctorId },
        include: { items: true }
      });

      for (const rx of prescriptions) {
        // Avoid creating duplicates if already accepted before
        const duplicate = await tx.prescription.findFirst({
          where: {
            patientId: share.patientId,
            doctorId: share.doctorId,
            title: rx.title,
            startDate: rx.startDate
          }
        });
        if (duplicate) continue;

        const createdPrescription = await tx.prescription.create({
          data: {
            id: randomUUID(),
            patientId: share.patientId,
            doctorId: share.doctorId,
            title: rx.title,
            status: rx.status,
            durationDays: rx.durationDays,
            refillCount: rx.refillCount,
            adherenceScore: rx.adherenceScore,
            pharmacy: rx.pharmacy ?? null,
            startDate: rx.startDate,
            endDate: rx.endDate,
            doctorNote: `[Shared EMR — TX: ${share.transactionId}]\n${rx.doctorNote}`,
            items: {
              create: rx.items.map(item => ({
                medicine:  item.medicine,
                dose:      item.dose,
                frequency: item.frequency,
                timing:    item.timing,
                reason:    item.reason
              }))
            }
          }
        });

        const linkedLabs = await tx.labReport.findMany({
          where: {
            patientId: share.patientId,
            doctorId: origDoctorId,
            prescriptionId: rx.id
          }
        });

        for (const lab of linkedLabs) {
          const duplicateLab = await tx.labReport.findFirst({
            where: {
              patientId: share.patientId,
              doctorId: share.doctorId,
              testName: lab.testName,
              reportDate: lab.reportDate
            }
          });
          if (duplicateLab) continue;

          await tx.labReport.create({
            data: {
              id: randomUUID(),
              patientId: share.patientId,
              doctorId: share.doctorId,
              prescriptionId: createdPrescription.id,
              testName: lab.testName,
              status: lab.status,
              reportDate: lab.reportDate,
              educationalAi: lab.educationalAi,
              documentPath: lab.documentPath
            }
          });
        }
      }

      const standaloneLabs = await tx.labReport.findMany({
        where: {
          patientId: share.patientId,
          doctorId: origDoctorId,
          prescriptionId: null
        }
      });

      for (const lab of standaloneLabs) {
        const duplicateLab = await tx.labReport.findFirst({
          where: {
            patientId: share.patientId,
            doctorId: share.doctorId,
            testName: lab.testName,
            reportDate: lab.reportDate
          }
        });
        if (duplicateLab) continue;

        await tx.labReport.create({
          data: {
            id: randomUUID(),
            patientId: share.patientId,
            doctorId: share.doctorId,
            prescriptionId: null,
            testName: lab.testName,
            status: lab.status,
            reportDate: lab.reportDate,
            educationalAi: lab.educationalAi,
            documentPath: lab.documentPath
          }
        });
      }
    }

    // Ensure a message thread exists between patient and accepting doctor
    await tx.messageThread.upsert({
      where: { doctorId_patientId: { doctorId: share.doctorId, patientId: share.patientId } },
      create: { doctorId: share.doctorId, patientId: share.patientId },
      update: {}
    });
  });

  const updated = await prisma.emrShare.findUnique({
    where: { id: shareId },
    include: { patient: true }
  });

  res.json(updated);
}));

module.exports = router;
