const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');
const { uploadsRoot } = require('./storage-paths');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', options);
}

const _PDF_TIMING_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Night'];
function pdfPatternLabel(code) {
  if (!code || !/^[01]{4}$/.test(code)) return code || 'N/A';
  const slots = code.split('').map((b, i) => b === '1' ? _PDF_TIMING_SLOTS[i] : null).filter(Boolean);
  return slots.length ? slots.join(' + ') : 'N/A';
}

function safeName(value, fallback = 'document') {
  const normalized = String(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

async function renderPdfToFile(html, absolutePath) {
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });

    // Dynamic scaling logic to fit onto 1-2 pages
    const height = await page.evaluate(() => {
      const pageEl = document.querySelector('.page');
      return pageEl ? pageEl.offsetHeight : document.documentElement.offsetHeight;
    });
    
    // A4 at 96 DPI is 1122px high. 
    // Content area with 15mm margins top/bottom is approx 1000px.
    const onePageMaxHeight = 1008; 
    let scale = 1.0;

    if (height > onePageMaxHeight) {
      // Goal: Fit on 1 page if possible (down to 0.7 scale)
      const neededForOne = onePageMaxHeight / height;
      
      if (neededForOne >= 0.70) {
        scale = neededForOne;
      } else {
        // It's too long for 1 page. Let's aim for 2 pages max.
        const twoPageMaxHeight = onePageMaxHeight * 2;
        const neededForTwo = twoPageMaxHeight / height;
        
        // We'll scale it to fit on 2 pages if it's longer than 2 pages,
        // OR if it's close to 1.5 pages, we might just let it be.
        // But the user said "maximum 2", so if > 2 pages, we MUST scale.
        if (height > twoPageMaxHeight) {
          scale = Math.max(0.65, neededForTwo);
        } else {
          // If it's between 1 and 2 pages, we use scale 1.0 to keep it readable,
          // UNLESS it's very close to 1 page (e.g. 1.1 pages), then we scale to 1 page.
          // (Already handled by neededForOne >= 0.70)
          scale = 1.0;
        }
      }
    }

    await page.pdf({
      path: absolutePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
      scale: parseFloat(scale.toFixed(2)),
      timeout: 30000,
    });
  } finally {
    await browser.close();
  }
}

function baseHtml(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
      color: #0f1e17;
      background: #f0f6f2;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* ── Watermark — repeats on every page via @page pseudo-element trick ── */
    @page {
      size: A4;
      margin: 18mm 12mm;
      /* Page number in footer margin */
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9px;
        color: #7a9d8c;
        font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
      }
    }
    .watermark {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .watermark-text {
      font-size: 96px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(10, 80, 50, 0.045);
      transform: rotate(-32deg);
      white-space: nowrap;
      user-select: none;
    }
    /* ── Page-break safety ── */
    .section, .meta-grid, .hero {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    tr { break-inside: avoid; page-break-inside: avoid; }
    .note-row { break-inside: avoid; page-break-inside: avoid; }
    /* ── Layout ── */
    .page {
      position: relative;
      z-index: 1;
      padding: 30px 34px 36px;
      max-width: 820px;
      margin: 0 auto;
    }
    /* ── Top bar ── */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 22px;
      padding-bottom: 14px;
      border-bottom: 2px solid #2fcc77;
    }
    .brand {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.14em;
      color: #0b3d25;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #4a9068;
      margin-top: 2px;
    }
    .doc-meta {
      text-align: right;
      font-size: 11px;
      color: #4a9068;
      line-height: 1.6;
    }
    /* ── Hero card ── */
    .hero {
      border-radius: 16px;
      background: linear-gradient(135deg, #07261a 0%, #0f3d28 60%, #174d32 100%);
      color: #e8fef2;
      padding: 22px 26px;
      margin-bottom: 18px;
      position: relative;
      overflow: hidden;
    }
    .hero::after {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 180px; height: 180px;
      border-radius: 50%;
      background: rgba(47,204,119,0.07);
    }
    .eyebrow {
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #52ff9d;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .hero h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.25;
      margin-bottom: 10px;
    }
    .hero-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .chip-green  { background: rgba(82,255,157,0.2); color: #52ff9d; border: 1px solid rgba(82,255,157,0.3); }
    .chip-gray   { background: rgba(255,255,255,0.08); color: #b0c8bc; border: 1px solid rgba(255,255,255,0.15); }
    .chip-blue   { background: rgba(131,212,255,0.15); color: #83d4ff; border: 1px solid rgba(131,212,255,0.25); }
    .chip-amber  { background: rgba(255,180,50,0.15);  color: #ffb432; border: 1px solid rgba(255,180,50,0.25); }
    /* ── Grid ── */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .section .meta-grid { margin-bottom: 0; }
    .meta-card {
      background: #ffffff;
      border: 1px solid #cde6d8;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .meta-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #5a7d6c;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .meta-value {
      font-size: 13.5px;
      font-weight: 600;
      color: #0f1e17;
      line-height: 1.4;
    }
    /* ── Section ── */
    .section {
      background: #ffffff;
      border: 1px solid #cde6d8;
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #1a7a48;
      font-weight: 700;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2f0e8;
    }
    /* ── Medicine table ── */
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      padding: 8px 10px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #5a7d6c;
      border-bottom: 2px solid #e2f0e8;
      font-weight: 600;
    }
    td {
      padding: 10px 10px;
      font-size: 13px;
      border-bottom: 1px solid #f0f6f2;
      vertical-align: top;
      color: #1a2e22;
    }
    tr:last-child td { border-bottom: none; }
    .med-name { font-weight: 600; color: #0d5c32; }
    .med-note-row td {
      padding: 2px 10px 10px;
      font-size: 11.5px;
      color: #3d7060;
      font-style: italic;
      background: #f7fcf9;
      border-bottom: 1px solid #f0f6f2;
    }
    .med-note-label {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      font-style: normal;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #5a7d6c;
      margin-right: 8px;
    }
    /* ── Note rows ── */
    .note-row {
      display: flex;
      gap: 12px;
      margin-bottom: 10px;
      font-size: 13px;
      line-height: 1.65;
    }
    .note-row:last-child { margin-bottom: 0; }
    .note-key {
      flex-shrink: 0;
      min-width: 100px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #5a7d6c;
      padding-top: 2px;
    }
    .note-val { color: #1a2e22; }
    /* ── Adherence ── */
    .adhere-track {
      height: 7px;
      background: #e2f0e8;
      border-radius: 4px;
      margin-top: 6px;
      overflow: hidden;
    }
    .adhere-fill {
      height: 100%;
      border-radius: 4px;
      background: linear-gradient(90deg, #2fcc77, #1aa058);
    }
    /* ── Footer ── */
    .footer {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #7a9d8c;
      padding-top: 12px;
      border-top: 1px solid #cde6d8;
    }
    .footer-brand { font-weight: 700; color: #1a7a48; letter-spacing: 0.12em; }
    .meiosis-calligraphy {
      font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, 'Georgia', serif;
      font-size: 15px;
      font-weight: 700;
      font-style: italic;
      letter-spacing: 0.22em;
      color: #1a7a48;
      opacity: 0.85;
    }
    ul { padding-left: 18px; }
    li { margin-bottom: 6px; line-height: 1.5; font-size: 13px; }
  </style>
</head>
<body>
  <div class="watermark"><span class="watermark-text">MEIOSIS</span></div>
  <div class="page">${body}</div>
</body>
</html>`;
}

function parseDoctorNote(note) {
  const sections = [];
  const prefixes = [
    ['Chief Complaint: ', 'Chief Complaint'],
    ['Subjective: ',      'Symptoms'],
    ['Assessment: ',      'Diagnosis / Assessment'],
    ['Plan: ',            'Treatment Plan'],
  ];
  for (const line of (note || '').split('\n').filter(Boolean)) {
    if (line.startsWith('Vitals — ')) continue; // handled separately
    for (const [prefix, label] of prefixes) {
      if (line.startsWith(prefix)) {
        sections.push({ label, text: escapeHtml(line.slice(prefix.length)) });
        break;
      }
    }
  }
  return sections;
}

const _VITAL_DEFS = [
  { key: 'BP',   label: 'Blood Pressure', unit: 'mmHg' },
  { key: 'HR',   label: 'Heart Rate',     unit: 'bpm'  },
  { key: 'Temp', label: 'Temperature',    unit: '°C'   },
  { key: 'SpO2', label: 'SpO₂',           unit: '%'    },
  { key: 'Ht',   label: 'Height',         unit: 'cm'   },
  { key: 'Wt',   label: 'Weight',         unit: 'kg'   },
];

function parseVitalsFromNote(note) {
  const found = {};
  const line = (note || '').split('\n').find(l => l.startsWith('Vitals — '));
  if (line) {
    for (const part of line.replace('Vitals — ', '').split(' | ')) {
      const idx = part.indexOf(': ');
      if (idx !== -1) found[part.slice(0, idx).trim()] = part.slice(idx + 2).trim();
    }
  }
  return _VITAL_DEFS.map(def => ({ ...def, value: found[def.key] || null }));
}

async function createPrescriptionPdf(prescription, customHtmlTemplate = null) {
  const patient   = prescription.patient || {};
  const doctor    = prescription.doctor  || {};
  const items     = prescription.items   || [];
  const labOrders = prescription.labReports || [];
  const fileName  = `${safeName(patient.name, 'patient')}-${safeName(prescription.title, 'prescription')}-${prescription.id}.pdf`;
  const absolutePath = path.join(uploadsRoot, 'prescriptions', fileName);
  const publicPath   = `/uploads/prescriptions/${fileName}`;

  // Clinic identity — use actual doctor fields, fall back gracefully
  const clinicName        = doctor.clinicName || doctor.hospital || 'Medical Clinic';
  const doctorDisplayName = doctor.name ? `Dr. ${doctor.name.replace(/^Dr\.?\s*/i, '')}` : 'Physician';
  const doctorSpecialty   = doctor.specialty || 'General Medicine';
  const doctorPhone       = doctor.phone || '';
  const doctorEmail       = doctor.email || '';
  const doctorRegNo       = doctor.registrationNumber || '';
  const doctorAddress     = doctor.clinicAddress || '';
  const doctorQual        = doctor.qualification || '';

  const statusLabel = (prescription.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Active' : 'Completed';
  const chipClass   = statusLabel === 'Active' ? 'chip-green' : 'chip-gray';
  const adherence   = Number(prescription.adherenceScore || 0);

  const itemRows = items.length
    ? items.map(item => {
        let nameHtml = escapeHtml(item.medicine || 'N/A');
        if (item.generic_name && item.identifier_brand) {
          nameHtml = `<strong style="color:#0f3d28;font-weight:800;">${escapeHtml(item.generic_name.toUpperCase())}</strong> <br/><small style="color:#4a9068;font-size:9.5px;">(${escapeHtml(item.identifier_brand)})</small>`;
        }
        return `
        <tr>
          <td><span class="med-name" style="line-height:1.4;">${nameHtml}</span></td>
          <td>${escapeHtml(item.dose || 'N/A')}</td>
          <td><span style="font-family:monospace;font-size:10px;color:#9ab5a8;margin-right:4px;">${escapeHtml(item.frequency || 'N/A')}</span>${/^[01]{4}$/.test(item.frequency || '') ? escapeHtml(pdfPatternLabel(item.frequency)) : ''}</td>
          <td>${escapeHtml(item.timing || 'N/A')}</td>
        </tr>${item.reason ? `
        <tr class="med-note-row"><td colspan="4"><span class="med-note-label">Note</span>${escapeHtml(item.reason)}</td></tr>` : ''}`;
      }).join('')
    : '<tr><td colspan="4" style="color:#7a9d8c;font-style:italic;">No medicines prescribed.</td></tr>';

  const noteRows = parseDoctorNote(prescription.doctorNote).map(s => `
    <div class="note-row">
      <span class="note-key">${escapeHtml(s.label)}</span>
      <span class="note-val">${s.text}</span>
    </div>`).join('');

  const vitals = parseVitalsFromNote(prescription.doctorNote);
  const vitalCards = vitals.map(v => `
    <div class="meta-card">
      <p class="meta-label">${v.label}</p>
      <p class="meta-value" style="${v.value ? '' : 'color:#9ab5a8;font-style:italic;'}">${v.value ? `${v.value} ${v.unit}` : 'N/A'}</p>
    </div>`).join('');

  const labOrdersSection = labOrders.length ? `
    <div class="section">
      <p class="section-title">Lab Tests Ordered</p>
      ${labOrders.map(l => `
      <div class="note-row">
        <span class="note-key">${escapeHtml(l.testName)}</span>
        <span class="note-val" style="color:#5a7d6c;">${escapeHtml((l.status || 'Pending').charAt(0) + (l.status || 'Pending').slice(1).toLowerCase())}</span>
      </div>`).join('')}
    </div>` : '';

  // Parse "Added Note" field from doctorNote
  const addedNoteLine = (prescription.doctorNote || '').split('\n').find(l => l.startsWith('Added Note: '));
  const addedNoteHtml = addedNoteLine ? `
    <div class="section">
      <p class="section-title">Added Note</p>
      <div class="note-row">
        <span class="note-val" style="font-style:italic;color:#1a2e22;">${escapeHtml(addedNoteLine.replace('Added Note: ', ''))}</span>
      </div>
    </div>` : '';

  // Build contact block for the top-right header
  const contactParts = [
    doctorPhone && `📞 ${doctorPhone}`,
    doctorEmail && `✉ ${doctorEmail}`,
    doctorRegNo && `Reg: ${doctorRegNo}`,
    doctorAddress && doctorAddress,
  ].filter(Boolean);

  const credLine = [doctorQual, doctorSpecialty].filter(Boolean).join(' · ');

  const html = baseHtml(prescription.title || 'Prescription', `
    <!-- CLINIC HEADER -->
    <div class="topbar">
      <div>
        <div class="brand">${escapeHtml(clinicName)}</div>
        <div class="brand-sub">${escapeHtml(doctorDisplayName)}${credLine ? ` · ${escapeHtml(credLine)}` : ''}</div>
        ${doctorAddress ? `<div class="brand-sub" style="margin-top:1px;">${escapeHtml(doctorAddress)}</div>` : ''}
      </div>
      <div class="doc-meta">
        ${contactParts.map(c => `<div>${escapeHtml(c)}</div>`).join('')}
        <div style="margin-top:6px;">Issued: ${formatDate(new Date())}</div>
        <div>Ref: ${escapeHtml(prescription.id.slice(0, 8).toUpperCase())}</div>
      </div>
    </div>

    <div class="hero">
      <p class="eyebrow">Prescription Record</p>
      <h1>${escapeHtml(prescription.title || 'Consultation Record')}</h1>
      <div class="hero-chips">
        <span class="${chipClass} chip">${statusLabel}</span>
        <span class="chip chip-gray">${formatDate(prescription.startDate)} → ${formatDate(prescription.endDate)}</span>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-card"><p class="meta-label">Patient</p><p class="meta-value">${escapeHtml(patient.name || 'N/A')}</p></div>
      <div class="meta-card"><p class="meta-label">Patient ID</p><p class="meta-value" style="font-size:11.5px;">${escapeHtml(patient.meiosisId || patient.universalCode || 'N/A')}</p></div>
      <div class="meta-card"><p class="meta-label">Physician</p><p class="meta-value">${escapeHtml(doctorDisplayName)}</p></div>
      <div class="meta-card"><p class="meta-label">Follow-up Date</p><p class="meta-value">${formatDate(prescription.endDate)}</p></div>
      <div class="meta-card"><p class="meta-label">Duration</p><p class="meta-value">${prescription.durationDays || 'N/A'} days</p></div>
      <div class="meta-card"><p class="meta-label">Pharmacy</p><p class="meta-value" style="${prescription.pharmacy ? '' : 'color:#9ab5a8;font-style:italic;'}">${escapeHtml(prescription.pharmacy || 'N/A')}</p></div>
    </div>

    <div class="section">
      <p class="section-title">Medications</p>
      <table>
        <thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="font-size:9px;color:#5a7d6c;font-style:italic;margin-top:12px;text-align:center;">Note: Brand names are provided for representation/understanding only and do not act as a formal prescription or recommendation.</p>
    </div>

    <div class="section">
      <p class="section-title">Vitals</p>
      <div class="meta-grid">${vitalCards}</div>
    </div>

    ${noteRows ? `
    <div class="section">
      <p class="section-title">Clinical Notes</p>
      ${noteRows}
    </div>` : ''}

    ${addedNoteHtml}

    ${labOrdersSection}

    <div class="section">
      <p class="section-title">Adherence</p>
      <p style="font-size:12px;color:#5a7d6c;margin-bottom:4px;">${adherence}% compliance over the last 30 days</p>
      <div class="adhere-track"><div class="adhere-fill" style="width:${adherence}%"></div></div>
    </div>

    <!-- DOCTOR SIGNATURE -->
    <div style="margin-top:28px;display:flex;justify-content:flex-end;">
      <div style="text-align:center;border-top:2px solid #0b3d25;padding-top:10px;min-width:200px;">
        <p style="font-size:13px;font-weight:800;color:#0b3d25;">${escapeHtml(doctorDisplayName)}</p>
        ${credLine ? `<p style="font-size:10px;color:#4a9068;margin-top:2px;">${escapeHtml(credLine)}</p>` : ''}
        ${doctorRegNo ? `<p style="font-size:9px;color:#5a7d6c;margin-top:2px;letter-spacing:0.1em;">Reg. No: ${escapeHtml(doctorRegNo)}</p>` : ''}
        <p style="font-size:9px;color:#5a7d6c;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">Physician Signature</p>
      </div>
    </div>

    <div class="footer">
      <span>${escapeHtml(clinicName)} · Confidential Medical Record</span>
      <span class="footer-brand meiosis-calligraphy">𝔐𝔢𝔦𝔬𝔰𝔦𝔰</span>
    </div>
  `);

  let finalHtml = html;

  if (customHtmlTemplate) {
    // Clinic identity for custom template token substitution
    const _clinicName   = doctor.clinicName || doctor.hospital || 'Medical Clinic';
    const _drName       = doctor.name ? `Dr. ${doctor.name.replace(/^Dr\.?\s*/i, '')}` : 'Physician';
    const _credLine     = [doctor.qualification, doctor.specialty || 'General Medicine'].filter(Boolean).join(' · ');
    const tokens = {
      '{{clinic_name}}':       escapeHtml(_clinicName),
      '{{clinic_phone}}':      escapeHtml(doctor.phone || ''),
      '{{clinic_email}}':      escapeHtml(doctor.email || ''),
      '{{clinic_address}}':    escapeHtml(doctor.clinicAddress || ''),
      '{{doctor_hospital}}':   escapeHtml(_clinicName),
      '{{doctor_name}}':       escapeHtml(_drName),
      '{{doctor_specialty}}':  escapeHtml(doctor.specialty || 'General Medicine'),
      '{{doctor_qualification}}': escapeHtml(doctor.qualification || ''),
      '{{doctor_reg_no}}':     escapeHtml(doctor.registrationNumber || ''),
      '{{doctor_credentials}}': escapeHtml(_credLine),
      '{{prescription_date}}': formatDate(new Date()),
      '{{prescription_id}}':   escapeHtml(prescription.id.slice(0, 8).toUpperCase()),
      '{{patient_name}}':      escapeHtml(patient.name || 'N/A'),
      '{{patient_id}}':        escapeHtml(patient.meiosisId || patient.universalCode || 'N/A'),
      '{{follow_up_date}}':    formatDate(prescription.endDate),
      '{{medication_table}}':  `
        <table>
          <thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>`,
      '{{medication_name}}': items[0] ? escapeHtml(items[0].medicine || 'N/A') : 'N/A',
      '{{dose}}':            items[0] ? escapeHtml(items[0].dose || 'N/A') : 'N/A',
      '{{frequency}}':       items[0] ? escapeHtml(pdfPatternLabel(items[0].frequency)) : 'N/A',
      '{{duration}}':        items[0] ? escapeHtml(items[0].timing || 'N/A') : 'N/A',
      '{{vitals}}': vitals.filter(v => v.value).map(v => `${v.label}: ${v.value} ${v.unit}`).join(' | ') || 'N/A',
      '{{diagnosis}}': escapeHtml(prescription.title || 'N/A'),
      '{{advice}}':    escapeHtml(prescription.doctorNote.split('\n').find(l => l.startsWith('Plan: '))?.slice(6) || 'N/A'),
      '{{doctor_note}}': escapeHtml(prescription.doctorNote),
      '{{added_note}}':  escapeHtml((prescription.doctorNote || '').split('\n').find(l => l.startsWith('Added Note: '))?.replace('Added Note: ', '') || ''),
      '{{lab_orders}}': labOrders.length ? labOrders.map(l => `${l.testName} (${l.status})`).join(', ') : 'None',
      '{{adherence}}': String(prescription.adherenceScore || 0) + '%'
    };

    let processed = customHtmlTemplate;
    for (const [token, value] of Object.entries(tokens)) {
      processed = processed.split(token).join(value);
    }
    finalHtml = processed;
  }

  await renderPdfToFile(finalHtml, absolutePath);
  return { absolutePath, publicPath };
}

async function createLabReportPdf(labReport) {
  const patient = labReport.patient || {};
  const doctor  = labReport.doctor  || {};
  const fileName = `${safeName(patient.name, 'patient')}-${safeName(labReport.testName, 'lab')}-${labReport.id}.pdf`;
  const absolutePath = path.join(uploadsRoot, 'labs', fileName);
  const publicPath   = `/uploads/labs/${fileName}`;

  const status      = (labReport.status || 'PENDING').toUpperCase();
  const chipClass   = status === 'NORMAL' ? 'chip-green' : status === 'ABNORMAL' ? 'chip-amber' : 'chip-blue';
  const statusLabel = status.charAt(0) + status.slice(1).toLowerCase();

  const html = baseHtml(labReport.testName || 'Lab Report', `
    <div class="topbar">
      <div>
        <div class="brand">MEIOSIS</div>
        <div class="brand-sub">Lab Report</div>
      </div>
      <div class="doc-meta">
        Date: ${formatDate(labReport.reportDate)}<br/>
        Ref: ${escapeHtml(labReport.id.slice(0, 8).toUpperCase())}
      </div>
    </div>

    <div class="hero">
      <p class="eyebrow">Laboratory Report</p>
      <h1>${escapeHtml(labReport.testName || 'Lab Test')}</h1>
      <div class="hero-chips">
        <span class="${chipClass} chip">${statusLabel}</span>
        <span class="chip chip-gray">${formatDate(labReport.reportDate)}</span>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-card"><p class="meta-label">Patient</p><p class="meta-value">${escapeHtml(patient.name || '—')}</p></div>
      <div class="meta-card"><p class="meta-label">Ordered By</p><p class="meta-value">${escapeHtml(doctor.name || '—')}</p></div>
      <div class="meta-card"><p class="meta-label">Specialty</p><p class="meta-value">${escapeHtml(doctor.specialty || 'General Medicine')}</p></div>
      <div class="meta-card"><p class="meta-label">Status</p><p class="meta-value">${statusLabel}</p></div>
    </div>

    ${labReport.educationalAi ? `
    <div class="section">
      <p class="section-title">Clinical Summary</p>
      <p style="font-size:13.5px;line-height:1.7;color:#1a2e22;">${escapeHtml(labReport.educationalAi)}</p>
    </div>` : ''}

    <div class="footer">
      <span>MEIOSIS Health Platform · Confidential Medical Record</span>
      <span class="footer-brand">MEIOSIS</span>
    </div>
  `);

  await renderPdfToFile(html, absolutePath);
  return { absolutePath, publicPath };
}

async function createPatientSummaryPdf(patient) {
  const fileName = `${safeName(patient.name, 'patient')}-health-summary.pdf`;
  const absolutePath = path.join(uploadsRoot, 'generated', fileName);
  const publicPath = `/uploads/generated/${fileName}`;
  const prescriptions = patient.prescriptions || [];
  const labs = patient.labReports || [];
  const appointments = patient.appointments || [];

  const html = baseHtml(
    `${patient.name} Health Summary`,
    `
      <section class="hero">
        <p class="eyebrow">MEIOSIS Health Summary</p>
        <h1>${escapeHtml(patient.name || 'Patient')}</h1>
        <p class="subcopy">A concise patient record summary including appointments, prescriptions, and lab reports available in the MEIOSIS system.</p>
      </section>

      <section class="grid">
        <div class="card"><p class="label">Email</p><p class="value">${escapeHtml(patient.email || '—')}</p></div>
        <div class="card"><p class="label">Phone</p><p class="value">${escapeHtml(patient.phone || '—')}</p></div>
        <div class="card"><p class="label">Universal Code</p><p class="value">${escapeHtml(patient.universalCode || '—')}</p></div>
        <div class="card"><p class="label">Insurance</p><p class="value">${escapeHtml(patient.insurancePlan || '—')}</p></div>
      </section>

      <section class="section">
        <h2>Upcoming / Recent Appointments</h2>
        <ul>
          ${appointments.length
            ? appointments.slice(0, 8).map((appointment) => `<li>${formatDate(appointment.scheduledDate)} • ${escapeHtml(appointment.title || appointment.purpose || 'Consultation')}</li>`).join('')
            : '<li>No appointments available.</li>'}
        </ul>
      </section>

      <section class="section">
        <h2>Prescriptions</h2>
        <ul>
          ${prescriptions.length
            ? prescriptions.slice(0, 8).map((rx) => `<li>${escapeHtml(rx.title)} • ${formatDate(rx.startDate)} to ${formatDate(rx.endDate)}</li>`).join('')
            : '<li>No prescriptions available.</li>'}
        </ul>
      </section>

      <section class="section">
        <h2>Lab Reports</h2>
        <ul>
          ${labs.length
            ? labs.slice(0, 8).map((lab) => `<li>${escapeHtml(lab.testName)} • ${formatDate(lab.reportDate)} • ${escapeHtml(lab.status)}</li>`).join('')
            : '<li>No lab reports available.</li>'}
        </ul>
      </section>

      <div class="footer">Generated ${formatDate(new Date())} • MEIOSIS</div>
    `
  );

  await renderPdfToFile(html, absolutePath);
  return { absolutePath, publicPath };
}

async function createPatientAuditPdf(patient) {
  const fileName = `${safeName(patient.name, 'patient')}-audit-report.pdf`;
  const absolutePath = path.join(uploadsRoot, 'generated', fileName);
  const publicPath = `/uploads/generated/${fileName}`;

  const html = baseHtml(
    `${patient.name} Audit Report`,
    `
      <section class="hero">
        <p class="eyebrow">MEIOSIS Access Audit</p>
        <h1>${escapeHtml(patient.name || 'Patient')}</h1>
        <p class="subcopy">This report summarizes record-linked activity and generated document exports currently available in the prototype.</p>
      </section>

      <section class="section">
        <h2>Available Record Counts</h2>
        <ul>
          <li>${(patient.appointments || []).length} appointment record(s)</li>
          <li>${(patient.prescriptions || []).length} prescription record(s)</li>
          <li>${(patient.labReports || []).length} lab report(s)</li>
        </ul>
      </section>

      <section class="section">
        <h2>Audit Notes</h2>
        <ul>
          <li>QR, EMR-sharing, and file-access events should be stored as dedicated audit rows in production.</li>
          <li>This generated PDF is functional and downloadable, but the underlying audit data model in this prototype is limited.</li>
          <li>Recommended next step: add a first-class audit log table and write to it from EMR share, QR scan, and PDF access flows.</li>
        </ul>
      </section>

      <div class="footer">Generated ${formatDate(new Date())} • MEIOSIS</div>
    `
  );

  await renderPdfToFile(html, absolutePath);
  return { absolutePath, publicPath };
}

module.exports = {
  renderPdfToFile,
  createPrescriptionPdf,
  createLabReportPdf,
  createPatientSummaryPdf,
  createPatientAuditPdf
};
