require('dotenv').config();
const { verifySignedQrPayload, createEphemeralEmrJwt, generateSignedQrUrl } = require('../backend/src/lib/qr-access');

const patientId = "PAT-12345";
const signed = generateSignedQrUrl({ patientId, ttlSeconds: 3600, gatewayBaseUrl: "https://example.com/gateway" });
console.log("Generated URL:", signed.url);

const url = new URL(signed.url);
const data = url.searchParams.get('data');
const sig = url.searchParams.get('sig');

try {
  const payload = verifySignedQrPayload({ data, sig });
  console.log("Verified Patient ID:", payload.p_id);
} catch (e) {
  console.error("Verification failed:", e.message);
}
