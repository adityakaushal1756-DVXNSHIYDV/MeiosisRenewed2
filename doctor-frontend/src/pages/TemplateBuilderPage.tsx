import { useState, useCallback, useRef } from 'react';
import {
  ArrowLeft, Save, CheckCircle, AlertTriangle, Plus, Trash2, GripVertical,
  FileText, User, Stethoscope, Pill, ClipboardList, Activity, CalendarCheck,
  Info, Upload, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { apiUrl, getAuthHeader } from '../lib/api';
import { CURRENT_DOCTOR } from '../config/doctorProfile';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TemplateBlock {
  id: string;
  type: 'header' | 'patient_info' | 'doctor_info' | 'medication_table' | 'vitals' | 'notes' | 'lab_orders' | 'footer' | 'custom_text' | 'signature';
  label: string;
  enabled: boolean;
  customContent?: string;
}

interface PdfTemplate {
  id: string;
  name: string;
  isActive: boolean;
  type: 'uploaded' | 'built';
  fields: string[];
  htmlTemplate: string;
  uploadedAt: string;
}

// ── Block definitions ─────────────────────────────────────────────────────────

const BLOCK_LIBRARY: { type: TemplateBlock['type']; label: string; icon: React.ReactNode; description: string; required?: boolean }[] = [
  { type: 'header',          label: 'Clinic Header',       icon: <Sparkles size={15} />,    description: 'Clinic name, doctor name, date, and prescription ID.', required: true },
  { type: 'patient_info',    label: 'Patient Information',  icon: <User size={15} />,        description: '{{patient_name}}, {{patient_id}}', required: true },
  { type: 'doctor_info',     label: 'Doctor Information',   icon: <Stethoscope size={15} />, description: '{{doctor_name}}, {{doctor_specialty}}, {{doctor_hospital}}' },
  { type: 'medication_table',label: 'Medication Table',     icon: <Pill size={15} />,        description: '{{medication_name}}, {{dose}}, {{frequency}}, {{duration}}', required: true },
  { type: 'vitals',          label: 'Vitals',               icon: <Activity size={15} />,    description: '{{vitals}} — Blood pressure, pulse, temperature, SpO₂' },
  { type: 'notes',           label: 'Clinical Notes',       icon: <ClipboardList size={15} />, description: '{{diagnosis}}, {{advice}}, {{doctor_note}}' },
  { type: 'lab_orders',      label: 'Lab Orders',           icon: <FileText size={15} />,    description: '{{lab_orders}} — Ordered tests and status' },
  { type: 'signature',       label: 'Doctor Signature',     icon: <CheckCircle size={15} />, description: 'Signature line with doctor name and registration number' },
  { type: 'footer',          label: 'Footer',               icon: <Info size={15} />,        description: 'Page footer with platform branding and disclaimer' },
  { type: 'custom_text',     label: 'Custom Text Block',    icon: <FileText size={15} />,    description: 'Write any custom text or instructions' },
];

const DEFAULT_CANVAS_BLOCKS: TemplateBlock[] = [
  { id: 'b1', type: 'header',           label: 'Clinic Header',       enabled: true },
  { id: 'b2', type: 'patient_info',     label: 'Patient Information', enabled: true },
  { id: 'b3', type: 'doctor_info',      label: 'Doctor Information',  enabled: true },
  { id: 'b4', type: 'medication_table', label: 'Medication Table',    enabled: true },
  { id: 'b5', type: 'vitals',           label: 'Vitals',              enabled: true },
  { id: 'b6', type: 'notes',            label: 'Clinical Notes',      enabled: true },
  { id: 'b7', type: 'footer',           label: 'Footer',              enabled: true },
];

const BASE_TEMPLATES: { name: string; blocks: TemplateBlock[] }[] = [
  {
    name: 'Clinical Minimal',
    blocks: [
      { id: 'tm1', type: 'header',           label: 'Clinic Header',       enabled: true },
      { id: 'tm2', type: 'patient_info',     label: 'Patient Information', enabled: true },
      { id: 'tm3', type: 'medication_table', label: 'Medication Table',    enabled: true },
      { id: 'tm4', type: 'footer',           label: 'Footer',              enabled: true },
    ],
  },
  {
    name: 'Traditional',
    blocks: [
      { id: 'tt1', type: 'header',           label: 'Clinic Header',       enabled: true },
      { id: 'tt2', type: 'patient_info',     label: 'Patient Information', enabled: true },
      { id: 'tt3', type: 'doctor_info',      label: 'Doctor Information',  enabled: true },
      { id: 'tt4', type: 'vitals',           label: 'Vitals',              enabled: true },
      { id: 'tt5', type: 'notes',            label: 'Clinical Notes',      enabled: true },
      { id: 'tt6', type: 'medication_table', label: 'Medication Table',    enabled: true },
      { id: 'tt7', type: 'lab_orders',       label: 'Lab Orders',          enabled: true },
      { id: 'tt8', type: 'signature',        label: 'Doctor Signature',    enabled: true },
      { id: 'tt9', type: 'footer',           label: 'Footer',              enabled: true },
    ],
  },
  {
    name: 'Branded Complete',
    blocks: DEFAULT_CANVAS_BLOCKS.map((b, i) => ({ ...b, id: `tb${i + 1}` })),
  },
];

// ── HTML generation from blocks ───────────────────────────────────────────────

function generateHtmlFromBlocks(blocks: TemplateBlock[], templateName: string): string {
  const blockHtml = blocks
    .filter(b => b.enabled)
    .map(b => {
      switch (b.type) {
        case 'header':
          return `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;padding-bottom:14px;border-bottom:2px solid #2fcc77;">
  <div>
    <div style="font-size:20px;font-weight:900;letter-spacing:0.14em;color:#0b3d25;text-transform:uppercase;">{{doctor_hospital}}</div>
    <div style="font-size:11px;letter-spacing:0.12em;color:#4a9068;margin-top:2px;">Dr. {{doctor_name}} · {{doctor_specialty}}</div>
  </div>
  <div style="text-align:right;font-size:11px;color:#4a9068;line-height:1.6;">
    Issued: {{prescription_date}}<br/>Ref: {{prescription_id}}
  </div>
</div>`;

        case 'patient_info':
          return `
<div style="background:#f0f6f2;border-radius:12px;padding:14px 18px;margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
  <div><p style="font-size:9px;text-transform:uppercase;letter-spacing:0.14em;color:#5a7d6c;margin-bottom:4px;font-weight:600;">Patient</p><p style="font-size:14px;font-weight:600;color:#0f1e17;">{{patient_name}}</p></div>
  <div><p style="font-size:9px;text-transform:uppercase;letter-spacing:0.14em;color:#5a7d6c;margin-bottom:4px;font-weight:600;">Patient ID</p><p style="font-size:14px;font-weight:600;color:#0f1e17;">{{patient_id}}</p></div>
</div>`;

        case 'doctor_info':
          return `
<div style="background:#fff;border:1px solid #cde6d8;border-radius:12px;padding:14px 18px;margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
  <div><p style="font-size:9px;text-transform:uppercase;letter-spacing:0.14em;color:#5a7d6c;margin-bottom:4px;font-weight:600;">Physician</p><p style="font-size:13px;font-weight:600;color:#0f1e17;">{{doctor_name}}</p></div>
  <div><p style="font-size:9px;text-transform:uppercase;letter-spacing:0.14em;color:#5a7d6c;margin-bottom:4px;font-weight:600;">Specialty</p><p style="font-size:13px;font-weight:600;color:#0f1e17;">{{doctor_specialty}}</p></div>
  <div><p style="font-size:9px;text-transform:uppercase;letter-spacing:0.14em;color:#5a7d6c;margin-bottom:4px;font-weight:600;">Follow-up</p><p style="font-size:13px;font-weight:600;color:#0f1e17;">{{follow_up_date}}</p></div>
</div>`;

        case 'medication_table':
          return `
<div style="background:#fff;border:1px solid #cde6d8;border-radius:14px;padding:16px 18px;margin-bottom:14px;">
  <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.16em;color:#1a7a48;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2f0e8;">Medications</p>
  {{medication_table}}
</div>`;

        case 'vitals':
          return `
<div style="background:#fff;border:1px solid #cde6d8;border-radius:14px;padding:16px 18px;margin-bottom:14px;">
  <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.16em;color:#1a7a48;font-weight:700;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2f0e8;">Vitals</p>
  <p style="font-size:13px;color:#1a2e22;line-height:1.65;">{{vitals}}</p>
</div>`;

        case 'notes':
          return `
<div style="background:#fff;border:1px solid #cde6d8;border-radius:14px;padding:16px 18px;margin-bottom:14px;">
  <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.16em;color:#1a7a48;font-weight:700;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2f0e8;">Clinical Notes</p>
  <div style="font-size:13px;color:#1a2e22;line-height:1.7;margin-bottom:8px;"><strong style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#5a7d6c;">Diagnosis:</strong> {{diagnosis}}</div>
  <div style="font-size:13px;color:#1a2e22;line-height:1.7;"><strong style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#5a7d6c;">Advice:</strong> {{advice}}</div>
</div>`;

        case 'lab_orders':
          return `
<div style="background:#fff;border:1px solid #cde6d8;border-radius:14px;padding:16px 18px;margin-bottom:14px;">
  <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.16em;color:#1a7a48;font-weight:700;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2f0e8;">Lab Tests Ordered</p>
  {{lab_orders}}
</div>`;

        case 'signature':
          return `
<div style="margin-top:32px;display:flex;justify-content:flex-end;">
  <div style="text-align:center;border-top:1px solid #0b3d25;padding-top:8px;min-width:180px;">
    <p style="font-size:12px;font-weight:700;color:#0b3d25;">{{doctor_name}}</p>
    <p style="font-size:9px;color:#5a7d6c;letter-spacing:0.12em;text-transform:uppercase;">Physician Signature</p>
  </div>
</div>`;

        case 'footer':
          return `
<div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#7a9d8c;padding-top:12px;border-top:1px solid #cde6d8;">
  <span>MEIOSIS Health Platform · Confidential Medical Record</span>
  <span style="font-weight:700;color:#1a7a48;">MEIOSIS</span>
</div>`;

        case 'custom_text':
          return `
<div style="background:#fff;border:1px solid #cde6d8;border-radius:14px;padding:16px 18px;margin-bottom:14px;">
  <p style="font-size:13px;color:#1a2e22;line-height:1.7;">${b.customContent || 'Custom text block — edit in the properties panel.'}</p>
</div>`;

        default:
          return '';
      }
    }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${templateName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #0f1e17; background: #f0f6f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 15mm 12mm; }
    .watermark { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; overflow: hidden; }
    .watermark-text { font-size: 96px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(10,80,50,0.045); transform: rotate(-32deg); white-space: nowrap; }
    .page { position: relative; z-index: 1; padding: 10px 0; max-width: 820px; margin: 0 auto; }
    .page > div { break-inside: avoid; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a7d6c; border-bottom: 2px solid #e2f0e8; font-weight: 600; }
    td { padding: 10px 10px; font-size: 13px; border-bottom: 1px solid #f0f6f2; vertical-align: top; color: #1a2e22; }
  </style>
</head>
<body>
  <div class="watermark"><span class="watermark-text">MEIOSIS</span></div>
  <div class="page">
${blockHtml}
  </div>
</body>
</html>`;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface TemplateBuilderPageProps {
  onBack: () => void;
  existingTemplates: PdfTemplate[];
  onSave: (templates: PdfTemplate[]) => void;
}

export function TemplateBuilderPage({ onBack, existingTemplates, onSave }: TemplateBuilderPageProps) {
  const [templateName, setTemplateName] = useState('My Prescription Template');
  const [blocks, setBlocks] = useState<TemplateBlock[]>(DEFAULT_CANVAS_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // ── Drag to reorder ────────────────────────────────────────────────────────
  const handleDragStart = (id: string) => { dragItem.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (targetId: string) => {
    if (!dragItem.current || dragItem.current === targetId) { setDragOverId(null); return; }
    const from = blocks.findIndex(b => b.id === dragItem.current);
    const to   = blocks.findIndex(b => b.id === targetId);
    if (from === -1 || to === -1) { setDragOverId(null); return; }
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setBlocks(next);
    setDragOverId(null);
    dragItem.current = null;
  };

  // ── Block actions ──────────────────────────────────────────────────────────
  const addBlock = useCallback((type: TemplateBlock['type']) => {
    const lib = BLOCK_LIBRARY.find(b => b.type === type);
    if (!lib) return;
    const id = `b_${Date.now()}`;
    setBlocks(prev => [...prev, { id, type, label: lib.label, enabled: true }]);
    setSelectedBlockId(id);
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    setSelectedBlockId(prev => prev === id ? null : prev);
  }, []);

  const toggleBlock = useCallback((id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  }, []);

  const updateCustomContent = useCallback((id: string, value: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, customContent: value } : b));
  }, []);

  // ── Load base template ──────────────────────────────────────────────────────
  const loadBaseTemplate = (name: string) => {
    const tpl = BASE_TEMPLATES.find(t => t.name === name);
    if (!tpl) return;
    setBlocks(tpl.blocks.map((b, i) => ({ ...b, id: `b_${Date.now()}_${i}` })));
    setTemplateName(tpl.name);
    setSelectedBlockId(null);
  };

  // ── Save & Activate ────────────────────────────────────────────────────────
  const handleSave = async (activate: boolean) => {
    setSaving(true);
    const htmlTemplate = generateHtmlFromBlocks(blocks, templateName);
    const fields = blocks.filter(b => b.enabled).map(b => b.type);

    const newTemplate: PdfTemplate = {
      id: `tpl_${Date.now()}`,
      name: templateName,
      isActive: activate,
      type: 'built',
      fields,
      htmlTemplate,
      uploadedAt: new Date().toISOString(),
    };

    // If activating, deactivate all others
    const updated = [
      ...existingTemplates.map(t => activate ? { ...t, isActive: false } : t),
      newTemplate,
    ];

    try {
      const res = await fetch(apiUrl(`/doctors/${CURRENT_DOCTOR.id}/preferences`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ pdfTemplates: updated }),
      });
      if (!res.ok) throw new Error('Save failed');
      onSave(updated);
      setSaveStatus('ok');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('err');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ── Preview HTML ────────────────────────────────────────────────────────────
  const previewHtml = generateHtmlFromBlocks(blocks, templateName);
  const previewUrl = `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`;

  return (
    <div className="min-h-screen bg-ink flex flex-col font-primary" style={{ fontFamily: 'var(--font-primary)' }}>

      {/* Top Bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-wire/10 bg-[#060d15]/90 backdrop-blur-xl shrink-0">
        <button onClick={onBack} className="ghost-btn !px-3 !py-2 flex items-center gap-2 text-sm">
          <ArrowLeft size={15} /> Back to Settings
        </button>
        <div className="h-5 w-px bg-wire/20" />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            className="bg-transparent text-white font-semibold text-lg outline-none border-b border-transparent focus:border-neon/40 transition-colors w-full max-w-xs"
            placeholder="Template name"
          />
          <p className="text-xs text-mist mt-0.5">PDF Template Builder</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Base template picker */}
          <div className="relative group">
            <button className="ghost-btn !px-3 !py-2 flex items-center gap-2 text-sm">
              <Sparkles size={14} /> Base Template
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-[#0b1827] border border-wire/10 rounded-2xl shadow-glass overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
              {BASE_TEMPLATES.map(t => (
                <button key={t.name} onClick={() => loadBaseTemplate(t.name)}
                  className="w-full text-left px-4 py-3 text-sm text-mist hover:text-white hover:bg-white/5 transition-colors border-b border-wire/5 last:border-0">
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setShowPreview(v => !v)}
            className="ghost-btn !px-3 !py-2 flex items-center gap-2 text-sm">
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="ghost-btn !px-4 !py-2 text-sm flex items-center gap-2"
          >
            <Save size={14} />
            Save Draft
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="action-btn !px-5 !py-2 text-sm flex items-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            ) : saveStatus === 'ok' ? (
              <CheckCircle size={14} />
            ) : (
              <CheckCircle size={14} />
            )}
            {saveStatus === 'ok' ? 'Activated!' : saveStatus === 'err' ? 'Save Failed' : 'Save & Activate'}
          </button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: Element Library */}
        <div className="w-[220px] shrink-0 border-r border-wire/10 bg-[#07101a] overflow-y-auto scroll-skin">
          <div className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-mist mb-3">Elements</p>
            <div className="space-y-1.5">
              {BLOCK_LIBRARY.map(item => (
                <button
                  key={item.type}
                  onClick={() => addBlock(item.type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-mist hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-wire/10 group"
                >
                  <span className="text-neon/70 group-hover:text-neon transition-colors">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-[12px] leading-tight truncate">{item.label}</div>
                    {item.required && <div className="text-[9px] text-neon/60 uppercase tracking-wider mt-0.5">required</div>}
                  </div>
                  <Plus size={12} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Canvas */}
        <div className={`flex-1 overflow-y-auto scroll-skin bg-[#04090f] ${showPreview ? 'hidden' : 'flex'} flex-col items-center py-8 px-4`}>
          <div className="w-[595px] max-w-full">
            <div className="mb-4 text-center">
              <p className="text-[10px] text-mist/50 uppercase tracking-widest">A4 Canvas · Drag blocks to reorder</p>
            </div>

            {/* Paper */}
            <div className="bg-white rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden min-h-[841px] p-8">
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <FileText size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">Click elements on the left to add them to your template</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blocks.map(block => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => handleDragStart(block.id)}
                      onDragOver={e => handleDragOver(e, block.id)}
                      onDrop={() => handleDrop(block.id)}
                      onDragEnd={() => setDragOverId(null)}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={[
                        'group relative border-2 rounded-lg transition-all cursor-pointer select-none',
                        selectedBlockId === block.id
                          ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.15)]'
                          : dragOverId === block.id
                          ? 'border-blue-400 bg-blue-50/20'
                          : 'border-transparent hover:border-slate-200',
                        !block.enabled && 'opacity-40',
                      ].join(' ')}
                    >
                      {/* Selection indicator */}
                      {selectedBlockId === block.id && (
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-400 rounded-full" />
                      )}

                      {/* Block action bar */}
                      <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1 shadow-lg">
                          <button
                            onClick={e => { e.stopPropagation(); toggleBlock(block.id); }}
                            className="text-slate-400 hover:text-white transition-colors p-0.5"
                            title={block.enabled ? 'Hide' : 'Show'}
                          >
                            {block.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          <div className="w-px h-3 bg-slate-600" />
                          <button
                            onClick={e => { e.stopPropagation(); removeBlock(block.id); }}
                            className="text-slate-400 hover:text-red-400 transition-colors p-0.5"
                            title="Remove block"
                          >
                            <Trash2 size={12} />
                          </button>
                          <div className="w-px h-3 bg-slate-600" />
                          <GripVertical size={12} className="text-slate-500 cursor-grab" />
                        </div>
                      </div>

                      {/* Block preview */}
                      <BlockPreview block={block} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER (when preview is on): iframe */}
        {showPreview && (
          <div className="flex-1 bg-[#04090f] overflow-hidden">
            <iframe
              src={previewUrl}
              title="Template Preview"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        )}

        {/* RIGHT: Properties Panel */}
        <div className="w-[260px] shrink-0 border-l border-wire/10 bg-[#07101a] overflow-y-auto scroll-skin">
          <div className="p-4">
            {selectedBlock ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-mist mb-4">Properties</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-mist mb-1.5">Block type</p>
                    <div className="rounded-xl bg-white/5 border border-wire/10 px-3 py-2 text-sm text-white font-medium">
                      {BLOCK_LIBRARY.find(l => l.type === selectedBlock.type)?.label || selectedBlock.type}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-mist">Visible</p>
                    <button
                      onClick={() => toggleBlock(selectedBlock.id)}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center ${selectedBlock.enabled ? 'bg-neon' : 'bg-white/10'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${selectedBlock.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {selectedBlock.type === 'custom_text' && (
                    <div>
                      <p className="text-xs text-mist mb-1.5">Content</p>
                      <textarea
                        value={selectedBlock.customContent || ''}
                        onChange={e => updateCustomContent(selectedBlock.id, e.target.value)}
                        rows={5}
                        className="w-full rounded-xl bg-white/5 border border-wire/10 px-3 py-2 text-sm text-white resize-none outline-none focus:border-neon/30 transition-colors"
                        placeholder="Enter custom text..."
                      />
                    </div>
                  )}

                  <div className="rounded-xl bg-white/[0.02] border border-wire/8 p-3">
                    <p className="text-[10px] font-semibold text-mist/60 uppercase tracking-wider mb-2">Data Tokens</p>
                    <p className="text-xs text-mist/50 leading-relaxed">
                      {BLOCK_LIBRARY.find(l => l.type === selectedBlock.type)?.description || 'No tokens for this block.'}
                    </p>
                  </div>

                  <button
                    onClick={() => removeBlock(selectedBlock.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-400/20 bg-red-400/5 text-red-300 text-sm transition-colors hover:bg-red-400/10"
                  >
                    <Trash2 size={14} /> Remove Block
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-mist mb-4">Template Info</p>
                <div className="rounded-xl bg-white/[0.02] border border-wire/8 p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-mist">Total blocks</span>
                    <span className="text-white font-medium">{blocks.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-mist">Visible blocks</span>
                    <span className="text-white font-medium">{blocks.filter(b => b.enabled).length}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-neon/5 border border-neon/15 p-3">
                  <p className="text-xs text-neon/80 leading-relaxed">
                    Click any block on the canvas to edit its properties, or drag blocks to reorder them.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Block Preview (lightweight render for canvas) ─────────────────────────────

function BlockPreview({ block }: { block: TemplateBlock }) {
  const style: React.CSSProperties = {
    fontFamily: '-apple-system, "Segoe UI", Arial, sans-serif',
    color: '#0f1e17',
    fontSize: '11px',
    padding: '10px 12px',
  };

  switch (block.type) {
    case 'header':
      return (
        <div style={style} className="flex justify-between items-start border-b-2 border-green-400 pb-2 mb-1">
          <div>
            <div style={{ fontWeight: 900, fontSize: '14px', color: '#0b3d25', letterSpacing: '0.1em' }}>CLINIC NAME</div>
            <div style={{ fontSize: '9px', color: '#4a9068', marginTop: '2px' }}>Dr. Name · Specialty</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9px', color: '#4a9068', lineHeight: '1.6' }}>
            Issued: DD Mon YYYY<br />Ref: XXXXXXXX
          </div>
        </div>
      );

    case 'patient_info':
      return (
        <div style={{ ...style, background: '#f0f6f2', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div><div style={{ fontSize: '7px', color: '#5a7d6c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Patient</div><div style={{ fontWeight: 600, color: '#0f1e17' }}>{'{{patient_name}}'}</div></div>
          <div><div style={{ fontSize: '7px', color: '#5a7d6c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Patient ID</div><div style={{ fontWeight: 600, color: '#0f1e17' }}>{'{{patient_id}}'}</div></div>
        </div>
      );

    case 'medication_table':
      return (
        <div style={{ ...style, background: '#fff', border: '1px solid #cde6d8', borderRadius: '8px' }}>
          <div style={{ fontSize: '7px', fontWeight: 700, color: '#1a7a48', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e2f0e8' }}>Medications</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
            <thead><tr style={{ background: '#f0f6f2' }}>
              {['Medicine', 'Dose', 'Frequency', 'Duration'].map(h => (
                <th key={h} style={{ padding: '4px 6px', textAlign: 'left', color: '#5a7d6c', fontWeight: 600, fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody><tr>
              <td style={{ padding: '4px 6px' }}>{'——————'}</td>
              <td style={{ padding: '4px 6px' }}>{'———'}</td>
              <td style={{ padding: '4px 6px' }}>{'————'}</td>
              <td style={{ padding: '4px 6px' }}>{'——'}</td>
            </tr></tbody>
          </table>
        </div>
      );

    case 'vitals':
      return (
        <div style={{ ...style, background: '#fff', border: '1px solid #cde6d8', borderRadius: '8px' }}>
          <div style={{ fontSize: '7px', fontWeight: 700, color: '#1a7a48', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '4px' }}>Vitals</div>
          <div style={{ color: '#5a7d6c', fontSize: '9px' }}>{'{{vitals}}'}</div>
        </div>
      );

    case 'notes':
      return (
        <div style={{ ...style, background: '#fff', border: '1px solid #cde6d8', borderRadius: '8px' }}>
          <div style={{ fontSize: '7px', fontWeight: 700, color: '#1a7a48', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '4px' }}>Clinical Notes</div>
          <div style={{ color: '#5a7d6c', fontSize: '9px' }}>Diagnosis · Advice · {'{{doctor_note}}'}</div>
        </div>
      );

    case 'lab_orders':
      return (
        <div style={{ ...style, background: '#fff', border: '1px solid #cde6d8', borderRadius: '8px' }}>
          <div style={{ fontSize: '7px', fontWeight: 700, color: '#1a7a48', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '4px' }}>Lab Tests Ordered</div>
          <div style={{ color: '#5a7d6c', fontSize: '9px' }}>{'{{lab_orders}}'}</div>
        </div>
      );

    case 'signature':
      return (
        <div style={{ ...style, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ borderTop: '1px solid #0b3d25', paddingTop: '6px', minWidth: '120px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#0b3d25', fontSize: '9px' }}>{'{{doctor_name}}'}</div>
            <div style={{ color: '#5a7d6c', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Signature</div>
          </div>
        </div>
      );

    case 'footer':
      return (
        <div style={{ ...style, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cde6d8', paddingTop: '6px', color: '#7a9d8c', fontSize: '8px' }}>
          <span>MEIOSIS Health Platform · Confidential</span>
          <span style={{ fontWeight: 700, color: '#1a7a48' }}>MEIOSIS</span>
        </div>
      );

    case 'custom_text':
      return (
        <div style={{ ...style, background: '#fff', border: '1px dashed #cde6d8', borderRadius: '8px' }}>
          <div style={{ color: '#9ab5a8', fontSize: '9px', fontStyle: 'italic' }}>{block.customContent || 'Custom text block'}</div>
        </div>
      );

    default:
      return (
        <div style={{ ...style, background: '#fff', border: '1px solid #e2f0e8', borderRadius: '8px' }}>
          <div style={{ color: '#5a7d6c', fontSize: '9px', fontWeight: 600 }}>{block.label}</div>
        </div>
      );
  }
}

export type { PdfTemplate };
