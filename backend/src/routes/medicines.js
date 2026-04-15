/**
 * POST /api/medicines/upload
 * Accepts a PDF file of medicines, uses Gemini to extract all drug/medicine names,
 * and returns them as a JSON array.
 */

const express = require('express');
const multer  = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const asyncHandler = require('../lib/async-handler');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/upload', upload.single('pdf'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file provided.' });
  }
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'Only PDF files are accepted.' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
  }

  const pdfBase64 = req.file.buffer.toString('base64');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([
    {
      inlineData: {
        data: pdfBase64,
        mimeType: 'application/pdf',
      },
    },
    `Extract every medicine, drug, and pharmaceutical product name from this document.
Include both generic names and brand names as separate entries.
Return ONLY a valid JSON array of strings — one name per entry.
Do not include dosage, form, or any other information, just the name itself.
Do not include markdown, code fences, or any explanation.
Example: ["Amoxicillin","Augmentin","Paracetamol","Calpol","Metformin"]`,
  ]);

  const rawText = result.response.text().trim();

  // Extract JSON array from response
  let medicines;
  try {
    // Direct parse
    medicines = JSON.parse(rawText);
  } catch {
    // Strip code fences
    const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) {
      try { medicines = JSON.parse(fenced[1]); } catch { /* fall through */ }
    }
    // Find first [...] array
    if (!medicines) {
      const arrMatch = rawText.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        try { medicines = JSON.parse(arrMatch[0]); } catch { /* fall through */ }
      }
    }
  }

  if (!Array.isArray(medicines)) {
    return res.status(502).json({ error: 'Could not parse medicine list from AI response.' });
  }

  // Clean: strings only, trim whitespace, deduplicate
  const cleaned = [...new Set(
    medicines
      .filter((m) => typeof m === 'string' && m.trim().length > 0)
      .map((m) => m.trim())
  )];

  res.json({ medicines: cleaned, count: cleaned.length });
}));

module.exports = router;
