const path = require('path');
const express = require('express');
const multer = require('multer');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');

const { uploadsRoot } = require('../lib/storage-paths');

const router = express.Router();
const labUploadsDir = path.join(uploadsRoot, 'labs');

const storage = multer.diskStorage({
  destination: labUploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `lab-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.get('/', asyncHandler(async (_req, res) => {
  const labs = await prisma.labReport.findMany({
    include: { doctor: true, patient: true },
    orderBy: { reportDate: 'desc' }
  });
  res.json(labs);
}));



/* PATCH /api/labs/:labId/upload — patient uploads their lab result file */
router.patch('/:labId/upload', upload.single('file'), asyncHandler(async (req, res) => {
  const { labId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or unsupported file type (PDF/JPEG/PNG only).' });
  }

  const documentPath = `/uploads/labs/${req.file.filename}`;

  const updated = await prisma.labReport.update({
    where: { id: labId },
    data: { documentPath },
    include: { doctor: true }
  });

  res.json(updated);
}));

module.exports = router;
