const express = require('express');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');

const router = express.Router();

// GET /api/analytics?patientId=xxx&period=day|week|month|year
router.get('/', asyncHandler(async (req, res) => {
  const { patientId, period } = req.query;
  if (!patientId) return res.status(400).json({ error: 'patientId is required' });

  const now = new Date();
  const buckets = [];

  if (period === 'day') {
    // Last 24 hours, one bucket per hour
    for (let i = 23; i >= 0; i--) {
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setHours(now.getHours() - i);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);
      const h = start.getHours();
      const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
      buckets.push({ start, end, label });
    }
  } else if (period === 'week') {
    // Last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      buckets.push({ start, end, label: days[start.getDay()] });
    }
  } else if (period === 'month') {
    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      buckets.push({ start, end, label: `Wk ${4 - i}` });
    }
  } else {
    // year — last 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ start, end, label: months[start.getMonth()] });
    }
  }

  const rangeStart = buckets[0].start;
  const rangeEnd = buckets[buckets.length - 1].end;

  const [appointments, prescriptions, labs] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId, scheduledDate: { gte: rangeStart, lt: rangeEnd } },
      select: { scheduledDate: true }
    }),
    prisma.prescription.findMany({
      where: { patientId, startDate: { gte: rangeStart, lt: rangeEnd } },
      select: { startDate: true }
    }),
    prisma.labReport.findMany({
      where: { patientId, reportDate: { gte: rangeStart, lt: rangeEnd } },
      select: { reportDate: true }
    })
  ]);

  const result = buckets.map(bucket => ({
    label: bucket.label,
    appointments: appointments.filter(a =>
      new Date(a.scheduledDate) >= bucket.start && new Date(a.scheduledDate) < bucket.end
    ).length,
    prescriptions: prescriptions.filter(p =>
      new Date(p.startDate) >= bucket.start && new Date(p.startDate) < bucket.end
    ).length,
    labs: labs.filter(l =>
      new Date(l.reportDate) >= bucket.start && new Date(l.reportDate) < bucket.end
    ).length
  }));

  res.json(result);
}));

module.exports = router;
