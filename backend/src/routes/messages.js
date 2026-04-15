const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { uploadsRoot } = require('../lib/storage-paths');

const router = express.Router();
const uploadsDir = path.join(uploadsRoot, 'messages');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '') || (file.mimetype.startsWith('audio/') ? '.webm' : '.bin');
    cb(null, `message-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'audio/webm',
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg'
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

const MESSAGE_ATTACHMENT_PREFIX = '__MEIOSIS_ATTACHMENT__::';

function buildAttachmentPayload(file, attachmentType = 'image') {
  return MESSAGE_ATTACHMENT_PREFIX + JSON.stringify({
    kind: 'attachment',
    attachmentType,
    url: `/uploads/messages/${file.filename}`,
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  });
}

/* Get or create a thread between a doctor and patient */
async function getOrCreateThread(doctorId, patientId) {
  const existing = await prisma.messageThread.findFirst({ where: { doctorId, patientId } });
  if (existing) return existing;
  return prisma.messageThread.create({ data: { doctorId, patientId } });
}

router.post('/threads', asyncHandler(async (req, res) => {
  const { doctorId, patientId } = req.body;
  if (!doctorId || !patientId) {
    return res.status(400).json({ error: 'doctorId and patientId are required' });
  }
  const thread = await getOrCreateThread(doctorId, patientId);
  const full = await prisma.messageThread.findUnique({
    where: { id: thread.id },
    include: { doctor: true, patient: true, messages: { orderBy: { createdAt: 'asc' } } }
  });
  res.status(201).json(full);
}));

router.get('/threads', asyncHandler(async (req, res) => {
  const { doctorId, patientId } = req.query;
  const where = {};
  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;

  const threads = await prisma.messageThread.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: {
      doctor: true,
      patient: true,
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  res.json(threads);
}));

router.post('/threads/:threadId/messages', asyncHandler(async (req, res) => {
  const { threadId } = req.params;
  const { sender, text } = req.body;

  const [message] = await prisma.$transaction([
    prisma.message.create({ data: { threadId, sender, text } }),
    prisma.messageThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } })
  ]);

  res.status(201).json(message);
}));

router.post('/threads/:threadId/attachments', upload.single('file'), asyncHandler(async (req, res) => {
  const { threadId } = req.params;
  const { sender, attachmentType } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No attachment uploaded or unsupported file type.' });
  }

  const normalizedType = attachmentType === 'voice' ? 'voice' : 'image';
  const payload = buildAttachmentPayload(req.file, normalizedType);

  const [message] = await prisma.$transaction([
    prisma.message.create({ data: { threadId, sender, text: payload } }),
    prisma.messageThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } })
  ]);

  res.status(201).json(message);
}));

module.exports = router;
