const express = require('express');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');

const router = express.Router();

// In-memory OTP store: universalCode → { otp, expiresAt, patientId }
const otpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// In-memory revoked codes: cleared when the patient rescans (new OTP request)
const revokedCodes = new Set();

function generate4DigitOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function purgeExpired() {
  const now = Date.now();
  for (const [key, val] of otpStore) {
    if (val.expiresAt <= now) otpStore.delete(key);
  }
}

// POST /api/otp/request
// Called by scan.html when it loads — generates OTP for a patient code
router.post('/request', asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [
        { universalCode: String(code) },
        { meiosisId: String(code) },
        { id: String(code) }
      ]
    },
    select: { id: true }
  });

  if (!patient) return res.status(404).json({ error: 'Patient not found for this code.' });

  purgeExpired();

  // Clear any prior revocation — fresh scan resets access
  revokedCodes.delete(String(code));

  const otp = generate4DigitOtp();
  const expiresAt = Date.now() + OTP_TTL_MS;
  otpStore.set(String(code), { otp, expiresAt, patientId: patient.id });

  res.json({ requested: true, expiresAt });
}));

// POST /api/otp/verify
// Called by scan.html when the doctor submits the OTP
router.post('/verify', asyncHandler(async (req, res) => {
  const { code, otp } = req.body;
  if (!code || !otp) return res.status(400).json({ error: 'code and otp are required' });

  purgeExpired();

  const entry = otpStore.get(String(code));
  if (!entry) {
    return res.status(400).json({ error: 'No active OTP for this code. Please rescan the QR.' });
  }
  if (Date.now() >= entry.expiresAt) {
    otpStore.delete(String(code));
    return res.status(400).json({ error: 'OTP has expired. Please rescan the QR.' });
  }
  if (entry.otp !== String(otp).trim()) {
    return res.status(400).json({ error: 'Incorrect OTP — please try again.' });
  }

  // Valid — consume the OTP (one-time use)
  otpStore.delete(String(code));
  res.json({ valid: true });
}));

// GET /api/otp/current?patientId=XXX
// Called by the patient's app to show them their current OTP (if a scan is in progress)
router.get('/current', asyncHandler(async (req, res) => {
  const { patientId } = req.query;
  if (!patientId) return res.status(400).json({ error: 'patientId is required' });

  purgeExpired();

  for (const [code, val] of otpStore) {
    if (val.patientId === String(patientId)) {
      return res.json({
        active: true,
        otp: val.otp,
        expiresAt: val.expiresAt,
        code
      });
    }
  }

  res.json({ active: false });
}));

// POST /api/otp/revoke
// Called by the patient to immediately revoke active record access
router.post('/revoke', asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  revokedCodes.add(String(code));
  res.json({ revoked: true });
}));

// GET /api/otp/revoke/check?code=XXX
// Called by scan.html to poll whether the patient has revoked access
router.get('/revoke/check', asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'code is required' });
  res.json({ revoked: revokedCodes.has(String(code)) });
}));

module.exports = router;
