const express = require('express');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { getDatabaseErrorPayload } = require('../lib/database-errors');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth-middleware');

const router = express.Router();

function sanitizeUser(account) {
  return {
    id: account.id,
    role: account.role,
    name: account.name,
    email: account.email,
    meiosisId: account.meiosisId,
    patientId: account.patientId || null,
    doctorId: account.doctorId || null
  };
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function generateMeiosisId(role, count) {
  // New plan: Patients use universal code, Doctors use 8-digit random numeric
  if (role === 'DOCTOR') {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }
  // For patients, we sync it with universal code
  return generateUniversalCode(count);
}

function generateUniversalCode(count) {
  return String(48290000 + count + 1);
}

/* ─── GET /api/auth/check-email?email=<addr>
   Real-time email availability check used during signup flow.
   Returns { available: true } if the email is free, { available: false } if taken.
─────────────────────────────────────────────────────────────────────────────── */
router.get('/check-email', asyncHandler(async (req, res) => {
  const { email } = req.query;
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  const existing = await prisma.userAccount.findUnique({ where: { email: normalized } });
  res.json({ available: !existing });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'identifier and password are required.' });
  }

  const account = await prisma.userAccount.findFirst({
    where: {
      OR: [
        { email: String(identifier).trim().toLowerCase() },
        { meiosisId: String(identifier).trim() }
      ]
    }
  });

  if (!account || account.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { id: account.id, role: account.role, meiosisId: account.meiosisId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    redirect: account.role === 'DOCTOR' ? 'doctor' : 'patient',
    user: sanitizeUser(account),
    token
  });
}));

router.post('/signup', asyncHandler(async (req, res) => {
  const {
    role,
    name,
    email,
    password,
    phone,
    bloodGroup,
    emergencyContact,
    insurancePlan,
    healthGoal,
    address,
    specialty,
    hospital,
    qualification,
    registrationNumber,
    yearsExperience,
    clinicAddress,
    consultFee
  } = req.body;

  console.log('[signup] received role:', role, '| name:', name, '| email:', email);

  if (!role || !name || !email || !password) {
    return res.status(400).json({ error: 'role, name, email, and password are required.' });
  }

  const normalizedRole = String(role).toUpperCase();
  console.log('[signup] normalizedRole:', normalizedRole);
  if (!['PATIENT', 'DOCTOR'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'role must be PATIENT or DOCTOR.' });
  }

  const emailValue = String(email).trim().toLowerCase();
  const existingEmail = await prisma.userAccount.findUnique({ where: { email: emailValue } });
  if (existingEmail) {
    return res.status(409).json({ error: 'Email is already registered.' });
  }

  // Count from the entity table (not userAccount) so seeded records don't cause ID collisions
  const entityCount = normalizedRole === 'PATIENT'
    ? await prisma.patient.count()
    : await prisma.doctor.count();
  const meiosisId = generateMeiosisId(normalizedRole, entityCount);

  let created;
  try {
    created = await prisma.$transaction(async (tx) => { // eslint-disable-line
    if (normalizedRole === 'PATIENT') {
      const patient = await tx.patient.create({
        data: {
          meiosisId,
          universalCode: generateUniversalCode(entityCount),
          name: String(name).trim(),
          email: emailValue,
          phone: phone ? String(phone).trim() : '+91-0000000000',
          bloodGroup: bloodGroup ? String(bloodGroup).trim() : 'Unknown',
          address: address ? String(address).trim() : 'To be updated',
          healthScore: 80,
          insurancePlan: insurancePlan ? String(insurancePlan).trim() : (healthGoal ? String(healthGoal).trim() : 'Not Added'),
          emergencyContact: emergencyContact ? String(emergencyContact).trim() : 'To be updated'
        }
      });

      return tx.userAccount.create({
        data: {
          role: 'PATIENT',
          name: patient.name,
          email: patient.email,
          meiosisId,
          password: String(password),
          patientId: patient.id
        }
      });
    }

    const doctorId = `doc-${String(entityCount + 1).padStart(3, '0')}`;
    const doctor = await tx.doctor.create({
      data: {
        id: doctorId,
        meiosisId,
        name: String(name).trim(),
        email: emailValue,
        phone: phone ? String(phone).trim() : null,
        specialty: specialty ? String(specialty).trim() : 'General Medicine',
        qualification: qualification ? String(qualification).trim() : 'MBBS',
        registrationNumber: registrationNumber ? String(registrationNumber).trim() : `REG-${entityCount + 1001}`,
        yearsExperience: parseInteger(yearsExperience, 1),
        hospital: hospital ? String(hospital).trim() : 'MEIOSIS Partner Clinic',
        clinicAddress: clinicAddress ? String(clinicAddress).trim() : 'To be updated',
        consultFee: parseInteger(consultFee, 800),
        rating: 4.5,
        workingHours: 'Mon-Sat | 09:00 AM - 01:00 PM'
      }
    });

    await tx.doctorSchedule.createMany({
      data: [
        { doctorId: doctor.id, dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true },
        { doctorId: doctor.id, dayOfWeek: 2, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true },
        { doctorId: doctor.id, dayOfWeek: 3, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true },
        { doctorId: doctor.id, dayOfWeek: 4, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true },
        { doctorId: doctor.id, dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true },
        { doctorId: doctor.id, dayOfWeek: 6, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true }
      ]
    });

    return tx.userAccount.create({
      data: {
        role: 'DOCTOR',
        name: doctor.name,
        email: emailValue,
        meiosisId,
        password: String(password),
        doctorId: doctor.id
      }
    });
  });
  } catch (txErr) {
    console.error('[signup] transaction failed:', txErr);
    const payload = getDatabaseErrorPayload(txErr);
    if (payload) {
      return res.status(payload.status).json({ error: payload.error });
    }
    return res.status(500).json({ error: txErr.message });
  }

  const token = jwt.sign(
    { id: created.id, role: created.role, meiosisId: created.meiosisId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    success: true,
    redirect: created.role === 'DOCTOR' ? 'doctor' : 'patient',
    user: sanitizeUser(created),
    token
  });
}));

module.exports = router;
