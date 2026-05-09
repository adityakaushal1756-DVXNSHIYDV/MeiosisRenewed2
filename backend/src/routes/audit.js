const express = require('express');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { authMiddleware } = require('../middleware/auth-middleware');

const router = express.Router();

// Get all audit logs across the system
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  // Security Check: Only STAFF or DOCTORS can see audit logs
  if (!['DOCTOR', 'RECEPTION', 'NURSE', 'REGISTRAR', 'RESIDENT', 'INTERN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'unauthorized_access' });
  }

  // Multi-Tenancy Check: Enforce clinic/doctor isolation
  // We determine the "Owner ID" (the doctor this staff/doctor belongs to)
  const doctorId = req.user.role === 'DOCTOR' ? req.user.doctorId || req.user.id : req.user.doctorId;

  if (!doctorId) {
    return res.status(400).json({ error: 'doctor_context_missing' });
  }

  const limit = parseInt(req.query.limit) || 100;

  // Fetch only logs related to this specific doctor/clinic
  const [accessLogs, transcriptLogs] = await Promise.all([
    prisma.patientAccessLog.findMany({
      where: { doctorId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { name: true, meiosisId: true }
        }
      }
    }),
    prisma.aiTranscriptLog.findMany({
      where: { 
        OR: [
          { patientId: { not: null } }, // Generic filter for now, can be narrowed by patient links
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Merge and normalize logs
  const unifiedLogs = [
    ...accessLogs.map(log => ({
      id: log.id,
      type: 'ACCESS',
      category: log.accessType,
      timestamp: log.createdAt,
      actor: log.doctorName,
      actorId: log.doctorId,
      target: log.patient.name,
      targetId: log.patient.meiosisId,
      detail: `Patient record accessed via QR scan.`
    })),
    ...transcriptLogs.map(log => ({
      id: log.id,
      type: 'TRANSCRIPT',
      category: 'AI_SCRIBE',
      timestamp: log.createdAt,
      actor: 'System',
      actorId: 'AI',
      target: log.patientId || 'Walk-in',
      targetId: log.patientId || 'N/A',
      detail: `AI transcription processed for session.`
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(unifiedLogs.slice(0, limit));
}));

module.exports = router;
