const express = require('express');
const { randomUUID } = require('crypto');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { resolvePatient } = require('../lib/emr-read');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   POST /api/hp-notes
   Save a full H&P note snapshot for a patient.
   Body: {
     patientId,   // DB id or meiosisId
     doctorId,
     title,       // optional, defaults to "H&P Note <date>"
     noteData     // HPNoteSnapshot JSON blob (vitals, ros, pe, etc.)
   }
───────────────────────────────────────────────────────────── */
router.post('/', asyncHandler(async (req, res) => {
  const { patientId, doctorId, title, noteData } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }
  if (!noteData || typeof noteData !== 'object') {
    return res.status(400).json({ error: 'noteData is required and must be an object' });
  }

  // Resolve patient
  const patient = await resolvePatient(patientId);
  if (!patient) {
    // Patient not yet in DB (mock/walk-in) — return success so frontend optimistic update still works
    return res.status(201).json({ ok: true, saved: false, reason: 'patient_not_in_db' });
  }

  // Resolve doctor
  let doctor = doctorId
    ? await prisma.doctor.findUnique({ where: { id: doctorId } }).catch(() => null)
    : null;
  if (!doctor) {
    doctor = await prisma.doctor.findFirst();
  }
  if (!doctor) {
    return res.status(404).json({ error: 'No doctor record found in database' });
  }

  const now = new Date();
  const noteTitle = title?.trim() || `H&P Note — ${now.toISOString().slice(0, 10)}`;

  const hpNote = await prisma.hPNote.create({
    data: {
      id: randomUUID(),
      patientId: patient.id,
      doctorId: doctor.id,
      noteDate: now,
      title: noteTitle,
      noteData,
    },
    include: { doctor: true },
  });

  // Auto-link doctor to patient network (same as EMR)
  try {
    await prisma.patientDoctor.upsert({
      where: { patientId_doctorId: { patientId: patient.id, doctorId: doctor.id } },
      create: { patientId: patient.id, doctorId: doctor.id },
      update: {},
    });
  } catch (linkErr) {
    console.error('[HPNote] Failed to auto-link doctor to patient network:', linkErr);
  }

  res.status(201).json({ ok: true, patientId: patient.id, doctorId: doctor.id, hpNote });
}));

/* ─────────────────────────────────────────────────────────────
   GET /api/hp-notes?patientId=<id>
   Retrieve all HP notes for a patient (most recent first).
───────────────────────────────────────────────────────────── */
router.get('/', asyncHandler(async (req, res) => {
  const { patientId } = req.query;
  if (!patientId) {
    return res.status(400).json({ error: 'patientId query param is required' });
  }

  const patient = await resolvePatient(patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const hpNotes = await prisma.hPNote.findMany({
    where: { patientId: patient.id },
    include: { doctor: true },
    orderBy: { noteDate: 'desc' },
  });

  res.json(hpNotes);
}));

module.exports = router;
