const express = require('express');
const path = require('path');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');

const router = express.Router();

router.get('/', asyncHandler(async (_req, res) => {
  const prescriptions = await prisma.prescription.findMany({
    include: {
      doctor: true,
      patient: true,
      items: true
    },
    orderBy: { startDate: 'desc' }
  });

  res.json(prescriptions);
}));

router.get('/:prescriptionId', asyncHandler(async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: req.params.prescriptionId },
    include: {
      doctor: true,
      patient: true,
      items: true
    }
  });

  if (!prescription) {
    res.status(404).json({ error: 'Prescription not found' });
    return;
  }

  res.json(prescription);
}));

module.exports = router;
