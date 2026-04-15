/**
 * POST /api/sarvam/transcribe
 *
 * Receives a short audio segment (WebM / OGG / WAV) from the browser,
 * forwards it to Sarvam AI's saaras:v2 speech-to-text model, and returns
 * the transcript as plain JSON.
 *
 * This proxy keeps SARVAM_API_KEY off the client and avoids CORS issues.
 */

const express      = require('express');
const multer       = require('multer');
const asyncHandler = require('../lib/async-handler');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 25 * 1024 * 1024 },  // 25 MB max segment
});

router.post('/transcribe', upload.single('audio'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided.' });
  }
  if (!process.env.SARVAM_API_KEY) {
    return res.status(503).json({ error: 'SARVAM_API_KEY is not configured on the server.' });
  }

  // Derive file extension from MIME type so Sarvam can identify the codec
  const mime = req.file.mimetype || 'audio/webm';
  let ext = 'webm';
  if (mime.includes('ogg'))  ext = 'ogg';
  else if (mime.includes('wav'))  ext = 'wav';
  else if (mime.includes('mp3') || mime.includes('mpeg')) ext = 'mp3';
  else if (mime.includes('flac')) ext = 'flac';

  // Build multipart body for Sarvam API
  const form = new FormData();
  form.append(
    'file',
    new Blob([req.file.buffer], { type: mime }),
    `segment.${ext}`,
  );
  form.append('model',           'saaras:v2');
  form.append('language_code',   req.body.language_code ?? 'en-IN');
  form.append('with_timestamps', 'false');
  form.append('with_disfluencies', 'false');

  const sarvamRes = await fetch('https://api.sarvam.ai/speech-to-text', {
    method:  'POST',
    headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
    body:    form,
  });

  let data;
  try {
    data = await sarvamRes.json();
  } catch {
    return res.status(502).json({ error: 'Sarvam returned a non-JSON response.' });
  }

  if (!sarvamRes.ok) {
    const msg = data?.message ?? data?.error ?? `Sarvam error ${sarvamRes.status}`;
    return res.status(sarvamRes.status).json({ error: msg });
  }

  res.json({ transcript: data.transcript ?? '' });
}));

module.exports = router;
