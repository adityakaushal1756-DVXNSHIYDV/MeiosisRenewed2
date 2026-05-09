/**
 * POST /api/extract
 * Accepts a doctor-patient consultation transcript and returns structured
 * medical data (symptoms, diagnosis, advice) extracted by Gemini 1.5 Flash.
 *
 * Pipeline:
 *   1. Validate input
 *   2. Audit-log the raw transcript in AiTranscriptLog (Prisma)
 *   3. Call Gemini 1.5 Flash with a medical-scribe system instruction
 *   4. Parse the JSON response and return { symptoms, diagnosis, advice }
 */

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { authMiddleware } = require('../middleware/auth-middleware');

const router = express.Router();

// ── Robust JSON extractor ─────────────────────────────────────
// Gemini may occasionally wrap JSON in markdown code fences.
function extractJson(raw) {
  // 1. Direct parse
  try { return JSON.parse(raw); } catch { /* fall through */ }

  // 2. Strip ```json ... ``` or ``` ... ```
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch { /* fall through */ }
  }

  // 3. Find first { ... } object in the text
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* fall through */ }
  }

  throw new Error('Could not parse AI response as JSON');
}

// ── Route ─────────────────────────────────────────────────────
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { transcript, patientId, appointmentId } = req.body;
  const doctorId = req.user.doctorId || req.user.id;

  if (!transcript?.trim()) {
    return res.status(400).json({ error: 'transcript is required' });
  }

  // ── 1. Compliance audit log ─────────────────────────────────
  // Stored unconditionally before any AI call so the raw transcript is
  // always on record even if extraction later fails.
  try {
    await prisma.aiTranscriptLog.create({
      data: {
        originalTranscript: transcript,
        patientId:    patientId    ?? null,
        doctorId:     doctorId     ?? null,
        appointmentId: appointmentId ?? null,
      },
    });
  } catch (auditErr) {
    // Non-fatal: log the error but do not abort the extraction
    console.error('[extract] Audit log write failed:', auditErr.message);
  }

  // ── 2. Gemini extraction ────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction:
      'You are a clinical medical scribe. ' +
      'Given a raw doctor-patient consultation transcript, extract the following three fields:\n' +
      '  - symptoms:  what the patient reports (subjective complaints)\n' +
      '  - diagnosis: the doctor\'s clinical assessment or impression\n' +
      '  - advice:    the treatment plan, medications mentioned, and follow-up instructions\n\n' +
      'Return ONLY a valid JSON object with exactly these three keys. ' +
      'Do not include any explanation, markdown, or code fences. ' +
      'If a field cannot be determined from the transcript, use an empty string.',
  });

  // implement a 25-second timeout to prevent Vercel function termination
  const aiTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI extraction timed out')), 25000);
  });

  let rawText;
  try {
    const result = await Promise.race([
      model.generateContent(transcript.trim()),
      aiTimeout
    ]);
    rawText = result.response.text();
  } catch (err) {
    console.error('[extract] Gemini call failed or timed out:', err.message);
    return res.status(err.message === 'AI extraction timed out' ? 504 : 502).json({
      error: 'AI scribe is currently unavailable or taking too long. Please try manual entry.'
    });
  }

  let extracted;
  try {
    extracted = extractJson(rawText);
  } catch {
    console.error('[extract] Could not parse Gemini response:', rawText);
    return res.status(502).json({ error: 'AI returned an unreadable response. Please try again or enter data manually.' });
  }

  res.json({
    symptoms:  String(extracted.symptoms  ?? ''),
    diagnosis: String(extracted.diagnosis ?? ''),
    advice:    String(extracted.advice    ?? ''),
  });
}));

module.exports = router;
