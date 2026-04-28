const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { authMiddleware } = require('../middleware/auth-middleware');
const {
  QR_SCOPE,
  clampTtlSeconds,
  createEphemeralEmrJwt,
  generateSignedQrUrl,
  isQrExpired,
  verifyEphemeralEmrJwt,
  verifySignedQrPayload,
} = require('../lib/qr-access');
const {
  buildPatientEmrPayload,
  getLinkedDoctorAccessLevel,
  resolvePatient,
} = require('../lib/emr-read');

const router = express.Router();

function noStore(res) {
  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('Pragma', 'no-cache');
}

function absoluteAppUrl(req, path) {
  const host = req.hostname || '';
  const hostHeader = req.get('host') || '';
  const port = hostHeader.includes(':') ? hostHeader.split(':').pop() : '';
  const isLocalBackend =
    (host === 'localhost' || host === '127.0.0.1') &&
    (port === String(process.env.PORT || 5002) || port === '5000');

  const base =
    process.env.DOCTOR_APP_URL ||
    process.env.PUBLIC_APP_URL ||
    (isLocalBackend ? `${req.protocol}://${host}:5173` : null) ||
    `${req.protocol}://${req.get('host')}`;
  const url = new URL(path, base.endsWith('/') ? base : `${base}/`);
  return url.toString();
}

function gatewayBaseUrl(req) {
  if (process.env.QR_GATEWAY_BASE_URL) return process.env.QR_GATEWAY_BASE_URL;
  if (process.env.PUBLIC_APP_URL) return new URL('/gateway', process.env.PUBLIC_APP_URL).toString();
  return `${req.protocol}://${req.get('host')}/gateway`;
}

async function getAccountFromRequest(req) {
  if (!req.user?.id) return null;
  return prisma.userAccount.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      role: true,
      name: true,
      patientId: true,
      doctorId: true,
      meiosisId: true,
    },
  });
}

function wantsHtml(req) {
  const accept = String(req.get('accept') || '');
  return accept.includes('text/html') && !accept.includes('application/json');
}

function tempAccessUrl(req, token) {
  const url = new URL(absoluteAppUrl(req, '/temp-access'));
  url.searchParams.set('token', token);
  return url.toString();
}

router.get('/qr', authMiddleware, asyncHandler(async (req, res) => {
  noStore(res);
  const account = await getAccountFromRequest(req);
  if (!account || account.role !== 'PATIENT' || !account.patientId) {
    return res.status(403).json({ error: 'patient_account_required' });
  }

  const patient = await prisma.patient.findUnique({
    where: { id: account.patientId },
    select: {
      id: true,
      name: true,
      meiosisId: true,
      universalCode: true,
    },
  });
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found.' });
  }

  const ttlSeconds = clampTtlSeconds(req.query.ttlSeconds || req.query.ttl);
  const signed = generateSignedQrUrl({
    patientId: patient.id,
    ttlSeconds,
    gatewayBaseUrl: gatewayBaseUrl(req),
  });

  res.json({
    status: 'QR_READY',
    scope: QR_SCOPE,
    patient,
    ttlSeconds,
    expiresAt: signed.expiresAt,
    gatewayUrl: signed.url,
    data: signed.data,
    sig: signed.sig,
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  noStore(res);
  
  let qrPayload;
  try {
    qrPayload = verifySignedQrPayload({
      data: req.query.data,
      sig: req.query.sig,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }

  const patient = await resolvePatient(qrPayload.p_id);
  if (!patient) {
    return res.status(404).json({ error: 'patient_not_found' });
  }

  // Create ephemeral token for the "Temp Access" fallback
  let temp;
  try {
    temp = createEphemeralEmrJwt({
      patientId: patient.id,
      qrPayload,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }

  const account = await getAccountFromRequest(req);
  const isDoctor = account && account.role === 'DOCTOR' && account.doctorId;

  if (wantsHtml(req)) {
    const doctorUrl = process.env.DOCTOR_APP_URL || "http://localhost:5173";
    const tempUrl = `/patient-record?token=${encodeURIComponent(temp.token)}&code=${encodeURIComponent(patient.universalCode || patient.id)}`;

    return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>MEIOSIS Gateway</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #080b14; color: #eef2ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px 24px; text-align: center; max-width: 320px; width: 100%; backdrop-filter: blur(12px); }
        .spinner { width: 40px; height: 40px; border: 3px solid rgba(0,255,163,0.1); border-top-color: #00ffa3; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        h2 { margin: 0 0 8px; font-size: 20px; font-weight: 600; }
        p { margin: 0; font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.5; }
    </style>
</head>
<body>
    <div class="card">
        <div class="spinner"></div>
        <h2>Connecting to MEIOSIS</h2>
        <p id="status">Checking for active Doctor Portal...</p>
    </div>
    <script>
        async function bridge() {
            const patientId = "${patient.id}";
            const doctorUrl = "${doctorUrl}";
            const tempUrl = "${tempUrl}";
            const statusEl = document.getElementById('status');
            let isResolved = false;
            
            // 1. Try to communicate with an existing Doctor Portal tab via BroadcastChannel
            try {
                const bc = new BroadcastChannel('meiosis_patient_highlight_channel');
                
                bc.onmessage = (msg) => {
                    if (msg.data === 'ACK:' + patientId) {
                        isResolved = true;
                        statusEl.textContent = "Dashboard updated. You can close this tab.";
                        bc.close();
                        // Attempt to close the tab automatically
                        setTimeout(() => window.close(), 1000);
                    }
                };
                
                bc.postMessage({ 
                    patientId, 
                    source: 'broadcast',
                    emittedAt: new Date().toISOString() 
                });
            } catch (e) {
                console.warn("Broadcast channel failed:", e);
            }

            // Wait for a short duration to see if any tab ACKs
            await new Promise(r => setTimeout(r, 800));
            if (isResolved) return;

            // 2. Fallback: Check if the portal is available and redirect
            if (isResolved) return; // Double check
            
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 1500);
                
                await fetch(doctorUrl + '/health', { 
                    mode: 'no-cors', 
                    cache: 'no-cache',
                    signal: controller.signal 
                });
                clearTimeout(timeout);
                
                statusEl.textContent = "Doctor Portal found. Redirecting...";
                window.location.href = doctorUrl + "/?highlightPatientId=" + patientId + "&qrStatus=LINKED&tempToken=" + encodeURIComponent("${temp.token}") + "&tempCode=" + encodeURIComponent("${patient.universalCode || patient.id}") + "&gatewayFallback=true";
            } catch (e) {
                console.log("Doctor portal not found or timed out:", e);
                statusEl.textContent = "Doctor Portal not found. Opening temporary access...";
                window.location.href = tempUrl;
            }
        }
        window.onload = bridge;
    </script>
</body>
</html>
    `);
  }

  // For JSON API requests:
  const accessLevel = isDoctor ? await getLinkedDoctorAccessLevel({
    patient,
    doctorId: account.doctorId,
  }) : null;

  if (accessLevel) {
    return res.json({
      status: 'LINKED',
      linked: true,
      patientId: patient.id,
      accessLevel,
      patient: {
        id: patient.id,
        name: patient.name,
        meiosisId: patient.meiosisId,
        universalCode: patient.universalCode,
      },
      highlight: {
        event: 'meiosis:patient-highlight',
        patientId: patient.id,
        doctorId: account.doctorId,
        storageKey: 'meiosis_patient_highlight_v1',
        emittedAt: new Date().toISOString(),
      },
    });
  }

  if (isQrExpired(qrPayload)) {
    return res.status(410).json({
      error: 'qr_expired',
      message: 'This patient QR access window has expired.',
    });
  }

  const redirectTo = tempAccessUrl(req, temp.token);
  res.json({
    status: 'TEMP_ACCESS',
    linked: false,
    patientId: patient.id,
    scope: QR_SCOPE,
    tokenType: 'Bearer',
    token: temp.token,
    expiresAt: temp.claims.exp,
    redirectTo,
  });
}));

router.get('/temp-emr', asyncHandler(async (req, res) => {
  noStore(res);
  console.log('[DEBUG] temp-emr request received. Token length:', String(req.query.token || '').length);
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : String(req.query.token || '');
  if (!token) {
    return res.status(401).json({ error: 'ephemeral_token_required' });
  }

  let claims;
  try {
    claims = verifyEphemeralEmrJwt(token);
  } catch (error) {
    const status = error instanceof jwt.TokenExpiredError ? 401 : (error.statusCode || 401);
    return res.status(status).json({ error: error.message || 'Invalid ephemeral token.' });
  }

  const patient = await resolvePatient(claims.p_id);
  if (!patient) {
    return res.status(404).json({ error: 'patient_not_found' });
  }

  const requestedPatientId = req.query.patientId ? String(req.query.patientId) : null;
  
  // Security Reinforcement: Ensure the requested code matches the securely resolved patient
  if (requestedPatientId && 
      requestedPatientId !== patient.id && 
      requestedPatientId !== patient.meiosisId && 
      requestedPatientId !== patient.universalCode) {
    return res.status(403).json({ error: 'token_patient_mismatch', message: 'Unauthorized access to this patient record.' });
  }

  const payload = await buildPatientEmrPayload({ patient, accessLevel: 'full' });
  res.json({
    ...payload,
    accessLevel: 'read_only_temp',
    scope: QR_SCOPE,
    tokenExpiresAt: claims.exp,
  });
}));

module.exports = router;
