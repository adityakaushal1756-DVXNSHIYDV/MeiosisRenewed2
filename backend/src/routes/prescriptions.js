const express = require('express');
const path = require('path');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');
const { createPrescriptionPdf } = require('../lib/pdf-documents');
const { createTemplatedPdf } = require('../lib/pdf-template-engine');
const { resolveUploadPath } = require('../lib/storage-paths');

const router = express.Router();

function isRenderableDoctorTemplate(template) {
  if (!template || typeof template !== 'object') return false;
  if (template.isActive !== true) return false;
  if (template.type !== 'built') return false;
  if (typeof template.htmlTemplate !== 'string') return false;

  const trimmedHtml = template.htmlTemplate.trim();
  if (!trimmedHtml || trimmedHtml === '<!-- UPLOADED_PDF_PLACEHOLDER -->') {
    return false;
  }

  return /<html[\s>]|<body[\s>]|{{[a-z_]+}}/i.test(trimmedHtml);
}

function resolveActiveDoctorTemplate(pdfTemplates) {
  if (!Array.isArray(pdfTemplates)) return null;

  const activeTemplates = pdfTemplates.filter(isRenderableDoctorTemplate);
  if (!activeTemplates.length) return null;

  activeTemplates.sort((a, b) => {
    const aTime = new Date(a.uploadedAt || 0).getTime();
    const bTime = new Date(b.uploadedAt || 0).getTime();
    return bTime - aTime;
  });

  return activeTemplates[0];
}

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
  let prescription = await prisma.prescription.findUnique({
    where: { id: req.params.prescriptionId },
    include: {
      doctor: {
        select: {
          id: true, name: true, specialty: true, hospital: true,
          clinicName: true, phone: true, email: true,
          registrationNumber: true, clinicAddress: true, qualification: true,
          meiosisId: true,
          preferences: { select: { pdfTemplates: true } }
        }
      },
      patient: true,
      items: true,
      labReports: true
    }
  });

  if (!prescription) {
    res.status(404).json({ error: 'Prescription not found' });
    return;
  }

  // ── Resolve active PDF template (doctor-specific, from their DoctorPreferences) ──
  const prefs = prescription.doctor?.preferences;
  const activeTemplate = resolveActiveDoctorTemplate(prefs?.pdfTemplates);

  // ── Always regenerate PDF (never serve stale cached file) ────────────────────
  // This ensures clinic identity changes in Settings immediately reflect in PDFs.
  try {
    let result;

    if (activeTemplate) {
      // Custom template path — substitutes live data into the doctor's HTML template
      result = await createTemplatedPdf(prescription, activeTemplate.htmlTemplate);
    } else {
      // Default Meiosis template — passes fresh doctor clinic identity
      result = await createPrescriptionPdf(prescription);
      // Update stored path so other systems can reference it
      prescription = await prisma.prescription.update({
        where: { id: prescription.id },
        data: { documentPath: result.publicPath },
        include: {
          doctor: {
            select: {
              id: true, name: true, specialty: true, hospital: true,
              clinicName: true, phone: true, email: true,
              registrationNumber: true, clinicAddress: true, qualification: true,
              meiosisId: true
            }
          },
          patient: true, items: true, labReports: true
        }
      });
    }

    const absolutePath = result.absolutePath;
    if (req.query.download === '1') { res.download(absolutePath); return; }
    res.sendFile(absolutePath);
  } catch (pdfErr) {
    console.error('[PDF] Generation failed for prescription', prescription.id, ':', pdfErr.message);
    res.status(500).json({ error: 'PDF generation failed. Please try again.' });
  }
}));

module.exports = router;
