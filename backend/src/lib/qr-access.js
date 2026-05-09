const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth-middleware');

const DEFAULT_QR_TTL_SECONDS = 60 * 60;
const MAX_QR_TTL_SECONDS = 6 * 60 * 60;
const DEFAULT_TEMP_JWT_TTL_SECONDS = 15 * 60;
const QR_SCOPE = 'READ_ONLY_EMR';

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function getQrSigningSecret() {
  const secret = process.env.QR_SIGNING_SECRET || process.env.TEMP_ACCESS_JWT_SECRET || JWT_SECRET;
  if (secret === 'meiosis-super-secret-dev-key') {
    console.warn('[QR-Access] Using DEFAULT development secret. Signature mismatch likely in production.');
  }
  return secret;
}

function getTempAccessSecret() {
  const secret = process.env.TEMP_ACCESS_JWT_SECRET || JWT_SECRET;
  if (secret === 'meiosis-super-secret-dev-key') {
    console.warn('[QR-Access] Using DEFAULT temp access secret.');
  }
  return secret;
}

function clampTtlSeconds(ttlSeconds) {
  const parsed = Number.parseInt(String(ttlSeconds ?? ''), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_QR_TTL_SECONDS;
  return Math.min(Math.max(parsed, 5 * 60), MAX_QR_TTL_SECONDS);
}

function createSignature(data) {
  return crypto
    .createHmac('sha256', getQrSigningSecret())
    .update(String(data))
    .digest('base64url');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function encryptPatientId(patientId) {
  const secret = getQrSigningSecret();
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(String(patientId), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  
  return {
    iv: iv.toString('base64'),
    data: encrypted,
    tag: authTag
  };
}

function decryptPatientId(encryptedPayload) {
  const secret = getQrSigningSecret();
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = Buffer.from(encryptedPayload.iv, 'base64');
  const authTag = Buffer.from(encryptedPayload.tag, 'base64');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedPayload.data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

function createQrPayload({ patientId, ttlSeconds, now = Date.now(), nonce }) {
  if (!patientId) {
    throw new Error('patientId is required');
  }

  const ttl = clampTtlSeconds(ttlSeconds);
  const enc = encryptPatientId(patientId);

  return {
    p_enc: enc,
    exp: Math.floor(now / 1000) + ttl,
    nonce: nonce || crypto.randomBytes(16).toString('hex'),
  };
}

function generateSignedQrUrl({ patientId, ttlSeconds, gatewayBaseUrl, now = Date.now() }) {
  const payload = createQrPayload({ patientId, ttlSeconds, now });
  const data = base64UrlEncode(JSON.stringify(payload));
  const sig = createSignature(data);
  const url = new URL(gatewayBaseUrl || 'https://meiosis.app/gateway');
  url.searchParams.set('data', data);
  url.searchParams.set('sig', sig);
  console.log(`[QR-Access] Generated URL. Env: ${process.env.NODE_ENV}, DataLen: ${data.length}`);

  return {
    url: url.toString(),
    data,
    sig,
    payload,
    expiresAt: payload.exp,
  };
}

function verifySignedQrPayload({ data, sig }) {
  if (!data || !sig) {
    const err = new Error('QR payload and signature are required.');
    err.statusCode = 400;
    throw err;
  }

  const expectedSig = createSignature(data);
  if (!safeEqual(expectedSig, sig)) {
    const err = new Error('QR signature verification failed.');
    err.statusCode = 401;
    throw err;
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(data));
  } catch {
    const err = new Error('QR payload is malformed.');
    err.statusCode = 400;
    throw err;
  }

  if (!payload || typeof payload !== 'object' || !Number.isFinite(Number(payload.exp)) || !payload.nonce) {
    const err = new Error('QR payload is missing required claims.');
    err.statusCode = 400;
    throw err;
  }

  try {
    if (payload.p_enc) {
      payload.p_id = decryptPatientId(payload.p_enc);
    } else if (!payload.p_id) {
      throw new Error('Missing patient identification.');
    }
  } catch (decErr) {
    const err = new Error('Failed to decrypt secure QR payload.');
    err.statusCode = 401;
    throw err;
  }

  return {
    p_id: String(payload.p_id),
    exp: Number(payload.exp),
    nonce: String(payload.nonce),
  };
}

function isQrExpired(payload, now = Date.now()) {
  const nowSecs = Math.floor(now / 1000);
  const expSecs = Number(payload.exp);
  // Allow 10 minutes of clock skew (some systems might be slightly ahead/behind)
  const gracePeriod = 10 * 60;
  return expSecs + gracePeriod <= nowSecs;
}

function createEphemeralEmrJwt({ patientId, qrPayload, now = Math.floor(Date.now() / 1000) }) {
  if (!patientId) throw new Error('patientId is required');
  const qrExpiry = Number(qrPayload?.exp || 0);
  const jwtTtl = clampTtlSeconds(process.env.TEMP_ACCESS_JWT_TTL_SECONDS || DEFAULT_TEMP_JWT_TTL_SECONDS);
  const exp = Math.min(qrExpiry, now + Math.min(jwtTtl, DEFAULT_TEMP_JWT_TTL_SECONDS));

  if (!Number.isFinite(exp) || exp <= now) {
    const err = new Error('QR access window has expired.');
    err.statusCode = 410;
    throw err;
  }

  const claims = {
    type: 'ephemeral_emr',
    scope: QR_SCOPE,
    p_id: String(patientId),
    nonce: String(qrPayload?.nonce || crypto.randomBytes(16).toString('hex')),
    iat: now,
    exp,
    aud: 'meiosis-temp-access',
    iss: 'meiosis-gateway',
  };

  return {
    token: jwt.sign(claims, getTempAccessSecret(), { algorithm: 'HS256' }),
    claims,
  };
}

function verifyEphemeralEmrJwt(token) {
  const decoded = jwt.verify(token, getTempAccessSecret(), {
    algorithms: ['HS256'],
    audience: 'meiosis-temp-access',
    issuer: 'meiosis-gateway',
  });

  if (decoded?.type !== 'ephemeral_emr' || decoded?.scope !== QR_SCOPE || !decoded?.p_id) {
    const err = new Error('Ephemeral token does not include READ_ONLY_EMR scope.');
    err.statusCode = 403;
    throw err;
  }

  return decoded;
}

module.exports = {
  DEFAULT_QR_TTL_SECONDS,
  MAX_QR_TTL_SECONDS,
  QR_SCOPE,
  clampTtlSeconds,
  createEphemeralEmrJwt,
  generateSignedQrUrl,
  isQrExpired,
  verifyEphemeralEmrJwt,
  verifySignedQrPayload,
};
