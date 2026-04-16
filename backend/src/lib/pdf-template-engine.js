'use strict';

const pdfParse = require('pdf-parse');
const path = require('path');
const { renderPdfToFile } = require('./pdf-documents');
const { uploadsRoot } = require('./storage-paths');

// ── Field registry ────────────────────────────────────────────────────────────
// These are the placeholder tokens a template must contain (in {{field}} format)
// for it to be considered valid for prescription generation.

const REQUIRED_FIELDS = [
  'patient_name',
  'doctor_name',
  'prescription_date',
  'medication_name',
  'dose',
  'frequency',
  'duration',
];

const OPTIONAL_FIELDS = [
  'diagnosis',
  'advice',
  'follow_up_date',
  'doctor_specialty',
  'doctor_hospital',
  'patient_id',
  'prescription_id',
  'vitals',
  'lab_orders',
  'adherence',
  'doctor_note',
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

// ── Field extraction ──────────────────────────────────────────────────────────

/**
 * Extracts {{field_name}} placeholders from raw text.
 * @param {string} text
 * @returns {string[]} list of found field keys (without braces)
 */
function extractPlaceholders(text) {
  const matches = text.match(/\{\{([a-z_]+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

/**
 * Parses a PDF buffer and returns all {{field}} placeholders found in it.
 * @param {Buffer} pdfBuffer
 * @returns {Promise<string[]>}
 */
async function extractFieldsFromPdf(pdfBuffer) {
  const data = await pdfParse(pdfBuffer);
  return extractPlaceholders(data.text);
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validates that a set of found fields contains all required fields.
 * @param {string[]} foundFields
 * @returns {{ valid: boolean, missing: string[], found: string[] }}
 */
function validateTemplateFields(foundFields) {
  const missing = REQUIRED_FIELDS.filter(f => !foundFields.includes(f));
  return {
    valid: missing.length === 0,
    missing,
    found: foundFields,
  };
}

// ── Data substitution ─────────────────────────────────────────────────────────

const _PDF_TIMING_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Night'];
function pdfPatternLabel(code) {
  if (!code || !/^[01]{4}$/.test(code)) return code || 'N/A';
  const slots = code.split('').map((b, i) => b === '1' ? _PDF_TIMING_SLOTS[i] : null).filter(Boolean);
  return slots.length ? slots.join(' + ') : 'N/A';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Builds the substitution map from a prescription record.
 * @param {object} prescription - Full Prisma prescription with doctor, patient, items, labReports
 * @returns {Record<string, string>}
 */
function buildSubstitutionMap(prescription) {
  const patient = prescription.patient || {};
  const doctor = prescription.doctor || {};
  const items = prescription.items || [];
  const labOrders = prescription.labReports || [];

  // Build a medication block (HTML table rows for multi-med)
  const medRows = items.length
    ? items.map(item => {
        const freq = item.frequency || 'N/A';
        const freqLabel = /^[01]{4}$/.test(freq) ? `${freq} (${pdfPatternLabel(freq)})` : freq;
        return `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e2f0e8;font-weight:600;">${escapeHtml(item.medicine || 'N/A')}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2f0e8;">${escapeHtml(item.dose || 'N/A')}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2f0e8;">${escapeHtml(freqLabel)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2f0e8;">${escapeHtml(item.timing || 'N/A')}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="4" style="padding:8px;color:#9ab5a8;font-style:italic;">No medicines prescribed.</td></tr>';

  const medTable = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:#f0f6f2;">
      <th style="padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#5a7d6c;">Medicine</th>
      <th style="padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#5a7d6c;">Dose</th>
      <th style="padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#5a7d6c;">Frequency</th>
      <th style="padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#5a7d6c;">Duration</th>
    </tr></thead>
    <tbody>${medRows}</tbody>
  </table>`;

  // For single-medicine templates using individual tokens
  const firstItem = items[0] || {};

  // Lab orders
  const labBlock = labOrders.length
    ? labOrders.map(l => `<div>${escapeHtml(l.testName)} — ${escapeHtml(l.status || 'Pending')}</div>`).join('')
    : '<div style="color:#9ab5a8;font-style:italic;">None ordered.</div>';

  // Doctor note parsing
  const note = prescription.doctorNote || '';
  const extractNote = prefix => {
    const line = note.split('\n').find(l => l.startsWith(prefix));
    return line ? line.slice(prefix.length).trim() : '';
  };

  return {
    patient_name: escapeHtml(patient.name || 'N/A'),
    patient_id: escapeHtml(patient.universalCode || patient.meiosisId || prescription.patientId || 'N/A'),
    doctor_name: escapeHtml(doctor.name || 'N/A'),
    doctor_specialty: escapeHtml(doctor.specialty || 'General Medicine'),
    doctor_hospital: escapeHtml(doctor.hospital || 'N/A'),
    prescription_date: formatDate(prescription.startDate),
    prescription_id: escapeHtml(prescription.id.slice(0, 8).toUpperCase()),
    follow_up_date: formatDate(prescription.endDate),
    medication_name: escapeHtml(firstItem.medicine || 'N/A'),
    dose: escapeHtml(firstItem.dose || 'N/A'),
    frequency: escapeHtml(firstItem.frequency ? pdfPatternLabel(firstItem.frequency) : 'N/A'),
    duration: escapeHtml(firstItem.timing || 'N/A'),
    medication_table: medTable,
    diagnosis: escapeHtml(extractNote('Assessment: ') || 'N/A'),
    advice: escapeHtml(extractNote('Plan: ') || 'N/A'),
    doctor_note: escapeHtml(note),
    lab_orders: labBlock,
    adherence: String(prescription.adherenceScore || 0) + '%',
    vitals: (() => {
      const vitalLine = note.split('\n').find(l => l.startsWith('Vitals — ')) || '';
      return escapeHtml(vitalLine.replace('Vitals — ', '') || 'N/A');
    })(),
  };
}

/**
 * Substitutes {{field}} tokens in an HTML string with live data.
 * @param {string} htmlTemplate
 * @param {Record<string, string>} data
 * @returns {string}
 */
function substituteFields(htmlTemplate, data) {
  return htmlTemplate.replace(/\{\{([a-z_]+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match; // leave unknown tokens as-is
  });
}

// ── PDF generation from template ──────────────────────────────────────────────

/**
 * Generates a PDF from a doctor's custom HTML template + live prescription data.
 * @param {object} prescription - Full Prisma prescription
 * @param {string} htmlTemplate - The doctor's stored HTML template with {{tokens}}
 * @returns {Promise<{ absolutePath: string, publicPath: string }>}
 */
async function createTemplatedPdf(prescription, htmlTemplate) {
  const patient = prescription.patient || {};
  const fname = `${safeName(patient.name)}-${safeName(prescription.title)}-${prescription.id}-custom.pdf`;
  const absolutePath = path.join(uploadsRoot, 'prescriptions', fname);
  const publicPath = `/uploads/prescriptions/${fname}`;

  const data = buildSubstitutionMap(prescription);
  const populatedHtml = substituteFields(htmlTemplate, data);

  await renderPdfToFile(populatedHtml, absolutePath);
  return { absolutePath, publicPath };
}

function safeName(value, fallback = 'doc') {
  const n = String(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return n || fallback;
}

module.exports = {
  extractFieldsFromPdf,
  validateTemplateFields,
  createTemplatedPdf,
  buildSubstitutionMap,
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  ALL_FIELDS,
};
