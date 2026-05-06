const express = require('express');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { createPrescriptionPdf } = require('../lib/pdf-documents');

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

router.get('/:prescriptionId/pdf', asyncHandler(async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: req.params.prescriptionId },
    include: {
      doctor: {
        select: {
          id: true, name: true, specialty: true, hospital: true,
          clinicName: true, phone: true, email: true,
          registrationNumber: true, clinicAddress: true, qualification: true,
          meiosisId: true,
        }
      },
      patient: true,
      items: true,
      labReports: true
    }
  });

  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }

  try {
    // Always regenerate with the built-in clinic-branded template.
    // This ensures clinic identity changes in Settings reflect immediately.
    const result = await createPrescriptionPdf(prescription);

    // Update stored path
    await prisma.prescription.update({
      where: { id: prescription.id },
      data: { documentPath: result.publicPath }
    });

    if (req.query.download === '1') { return res.download(result.absolutePath); }
    res.sendFile(result.absolutePath);
  } catch (pdfErr) {
    console.error('[PDF] Generation failed for prescription', prescription.id, ':', pdfErr.message);
    res.status(500).json({ error: 'PDF generation failed. Please try again.' });
  }
}));

module.exports = router;
