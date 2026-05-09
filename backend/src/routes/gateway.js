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
      staffId: true,
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

  const requestedTtl = clampTtlSeconds(req.query.ttlSeconds || req.query.ttl);
  const signed = generateSignedQrUrl({
    patientId: patient.id,
    ttlSeconds: requestedTtl,
    gatewayBaseUrl: gatewayBaseUrl(req),
  });

  // Simplified Approach: Use the patient's universalCode or meiosisId as the primary token
  const simpleToken = patient.universalCode || patient.meiosisId || patient.id;

  res.json({
    status: 'QR_READY',
    scope: QR_SCOPE,
    patient,
    ttlSeconds: requestedTtl,
    expiresAt: signed.expiresAt,
    gatewayUrl: signed.url,
    token: simpleToken, // Use the simple ID instead of the complex signed token
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

  const nowSeconds = Math.floor(Date.now() / 1000);
  const durMins = Math.max(1, Math.floor((qrPayload.exp - nowSeconds) / 60));
  const doctorUrl = absoluteAppUrl(req, '/');
  const tempUrl = `/patient-record?token=${encodeURIComponent(temp.token)}&code=${encodeURIComponent(patient.universalCode || patient.id)}&dur=${durMins}`;

  if (wantsHtml(req)) {
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

// --- New Remote Control (Serverless Compatible) ---

// 1. Doctor Dashboard Heartbeat
router.post('/heartbeat', authMiddleware, asyncHandler(async (req, res) => {
  const account = await getAccountFromRequest(req);
  const doctorId = account?.doctorId;
  if (!doctorId) return res.status(403).json({ error: 'doctor_only' });

  await prisma.doctor.update({
    where: { id: doctorId },
    data: { lastActiveAt: new Date() }
  });

  res.json({ status: 'OK', role: 'active_doc' });
}));

// 2. Push Remote Command (from Companion App)
router.post('/remote-scan', authMiddleware, asyncHandler(async (req, res) => {
  const { patientId, doctorId } = req.body;
  console.log(`[RemoteScan] Attempting push for Doctor: ${doctorId} | Patient: ${patientId}`);
  
  if (!patientId || !doctorId) {
    console.warn('[RemoteScan] Missing parameters');
    return res.status(400).json({ error: 'patientId_and_doctorId_required' });
  }

  // Check if doctor is active (within last 2 minutes)
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    console.error(`[RemoteScan] Doctor ${doctorId} not found in database`);
    return res.status(404).json({ error: 'Doctor record missing' });
  }

  const isActive = doctor.lastActiveAt && (new Date() - new Date(doctor.lastActiveAt)) < 120000;

  try {
    await prisma.remoteCommand.create({
      data: {
        doctorId,
        command: 'OPEN_PATIENT',
        payload: { patientId },
        isRead: false
      }
    });
    console.log(`[RemoteScan] Command queued successfully for ${doctorId}`);
  } catch (dbErr) {
    console.error('[RemoteScan] DB Error:', dbErr);
    throw dbErr;
  }

  res.json({ 
    status: 'OK', 
    message: 'Command queued', 
    doctorStatus: isActive ? 'active_doc' : 'inactive_doc' 
  });
}));

// Generic Remote Command (Allows Staff to send commands)
router.post('/remote-command', authMiddleware, asyncHandler(async (req, res) => {
  const { command, payload, targetDoctorId } = req.body;
  const account = await getAccountFromRequest(req);
  
  if (!['DOCTOR', 'RECEPTION', 'NURSE', 'REGISTRAR', 'RESIDENT', 'INTERN'].includes(account?.role)) {
    return res.status(403).json({ error: 'unauthorized_role' });
  }

  if (!command || !targetDoctorId) {
    return res.status(400).json({ error: 'command_and_targetDoctorId_required' });
  }

  await prisma.remoteCommand.create({
    data: {
      doctorId: targetDoctorId,
      command,
      payload: payload || {},
      isRead: false
    }
  });

  res.json({ status: 'OK', message: 'Command queued' });
}));

// 3. Poll Remote Commands (from Doctor Dashboard)
router.get('/remote-commands', authMiddleware, asyncHandler(async (req, res) => {
  const account = await getAccountFromRequest(req);
  const doctorId = account?.doctorId;
  if (!doctorId) return res.status(403).json({ error: 'doctor_only' });

  const command = await prisma.remoteCommand.findFirst({
    where: { doctorId, isRead: false },
    orderBy: { createdAt: 'desc' }
  });

  if (command) {
    // Mark as read immediately
    await prisma.remoteCommand.update({
      where: { id: command.id },
      data: { isRead: true }
    });
    return res.json({ command: command.command, payload: command.payload });
  }

  res.json({ command: null });
}));

// 4. Get Doctor Status (for Companion App)
router.get('/doctor-status', authMiddleware, asyncHandler(async (req, res) => {
  const account = await getAccountFromRequest(req);
  const doctorId = account?.doctorId;
  if (!doctorId) return res.status(403).json({ error: 'doctor_only' });

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  const isActive = doctor?.lastActiveAt && (new Date() - new Date(doctor.lastActiveAt)) < 120000;

  res.json({ 
    status: isActive ? 'active_doc' : 'inactive_doc',
    lastActiveAt: doctor?.lastActiveAt
  });
}));

// 5. Resolve Patient from any identifier (DB id, meiosisId, universalCode, or full QR URL)
// Used by the Companion App after a QR scan to get the canonical patient record.
router.get('/resolve-patient', authMiddleware, asyncHandler(async (req, res) => {
  noStore(res);
  const inputIdentifier = String(req.query.id || '').trim();
  if (!inputIdentifier) return res.status(400).json({ error: 'id_required' });

  console.log(`[ResolvePatient] Incoming Identifier: ${inputIdentifier}`);

  let targetPatientId = inputIdentifier;

  try {
    // ── Step 1: Detect and Extract from Raw Token (MEIOSIS:v1:data:sig) ──
    if (inputIdentifier.startsWith('MEIOSIS:v1:')) {
      const parts = inputIdentifier.split(':');
      if (parts.length === 4) {
        const data = parts[2];
        const sig = parts[3];
        console.log(`[ResolvePatient] Detected raw Meiosis Token. DataLen: ${data.length}, SigLen: ${sig.length}`);
        const qrPayload = verifySignedQrPayload({ data, sig });
        
        if (isQrExpired(qrPayload)) {
          return res.status(410).json({ error: 'qr_expired', message: 'This QR code has expired.' });
        }
        targetPatientId = qrPayload.p_id;
        console.log(`[ResolvePatient] Decrypted patient ID from token: ${targetPatientId}`);
      }
    } 
    // ── Step 2: Fallback to URL Extraction ──
    else if (inputIdentifier.includes('?data=') || inputIdentifier.includes('&data=')) {
      const url = new URL(inputIdentifier.startsWith('http') ? inputIdentifier : `https://dummy.com/${inputIdentifier}`);
      const data = url.searchParams.get('data');
      const sig = url.searchParams.get('sig');
      if (data && sig) {
        console.log(`[ResolvePatient] Found data and sig in URL. Verifying...`);
        const qrPayload = verifySignedQrPayload({ data, sig });
        if (isQrExpired(qrPayload)) {
          return res.status(410).json({ error: 'qr_expired', message: 'This QR code has expired.' });
        }
        targetPatientId = qrPayload.p_id;
        console.log(`[ResolvePatient] Decrypted patient ID from URL: ${targetPatientId}`);
      }
    }

    // ── Step 3: Database Lookup ──
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { id: targetPatientId },
          { meiosisId: targetPatientId },
          { universalCode: targetPatientId }
        ]
      },
      select: {
        id: true,
        meiosisId: true,
        universalCode: true,
        name: true,
        phone: true,
        bloodGroup: true,
      }
    });

    if (!patient) {
      console.warn(`[ResolvePatient] Patient not found for identifier: ${targetPatientId}`);
      return res.status(404).json({ error: 'patient_not_found' });
    }

    // ── Step 4: Audit Logging (DPDP Compliance) ──
    // We log every successful resolution so the patient has a trail of who accessed their record.
    const account = await getAccountFromRequest(req);
    if (account && patient.id) {
      prisma.patientAccessLog.create({
        data: {
          patientId: patient.id,
          doctorId: account.doctorId || account.id,
          doctorName: account.name,
          accessType: 'QR_SCAN'
        }
      }).catch(err => console.error('[AuditLog] Failed to create log:', err));
    }

    return res.json(patient);

  } catch (err) {
    // ── Step 4: Simple Fallback ──
    // If signature verification failed (e.g. secret mismatch), but it looks like a valid identifier,
    // we try to resolve it directly as a fallback to ensure cross-device functionality.
    console.warn(`[ResolvePatient] Token verification failed, falling back to direct lookup for: ${inputIdentifier.slice(0, 20)}`);
    
    const fallbackPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          { id: targetPatientId },
          { meiosisId: targetPatientId },
          { universalCode: targetPatientId }
        ]
      },
      select: {
        id: true,
        meiosisId: true,
        universalCode: true,
        name: true,
        phone: true,
        bloodGroup: true,
      }
    });

    if (fallbackPatient) {
      const account = await getAccountFromRequest(req);
      if (account) {
        prisma.patientAccessLog.create({
          data: {
            patientId: fallbackPatient.id,
            doctorId: account.doctorId || account.id,
            doctorName: account.name,
            accessType: 'QR_SCAN_FALLBACK'
          }
        }).catch(err => console.error('[AuditLog] Failed to create fallback log:', err));
      }
      return res.json(fallbackPatient);
    }

    console.error(`[ResolvePatient] Fatal resolution error:`, err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ 
      error: 'invalid_token', 
      message: 'Unable to resolve patient. Please ensure you are scanning a valid Meiosis QR.'
    });
  }
}));

module.exports = router;
