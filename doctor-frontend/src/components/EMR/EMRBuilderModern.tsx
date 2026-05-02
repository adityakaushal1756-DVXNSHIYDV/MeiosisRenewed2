import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  BookmarkPlus,
  LayoutTemplate,
  Loader,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  Play,
  Pause,
  Save,
  Square,
  Trash2,
  X,
  Cpu,
  FlaskConical,
  ChevronDown,
} from "lucide-react";
import { Appointment } from "../../types/Appointment";
import {
  EMRState,
  PrescriptionRow,
  PrescriptionTemplate,
} from "../../types/EMR";
import { Patient } from "../../types/Patient";

import { MedicineAutocomplete } from "./MedicineAutocomplete";
import { HoverRevealSidebar } from "../HoverRevealSidebar";

export type Severity = "LOW" | "MILD" | "SEVERE";

interface EMRBuilderModernProps {
  patientName: string | null;
  patient?: Patient | null;
  appointment?: Appointment | null;
  composerOpen?: boolean;
  onCloseComposer?: () => void;
  openedFromRecords?: boolean;
  emr: EMRState;
  templates: PrescriptionTemplate[];
  activeTemplateId: string | null;
  onStartConsultation?: () => void;
  onEndConsultation?: () => void;
  onPauseConsultation?: () => void;
  onResumeConsultation?: () => void;
  onFieldChange: (field: keyof EMRState, value: string) => void;
  onVitalChange: (field: keyof EMRState["vitals"], value: string) => void;
  onPrescriptionChange: (
    id: string,
    field: keyof PrescriptionRow,
    value: string,
  ) => void;
  onAddPrescriptionRow: () => void;
  onRemovePrescriptionRow: (id: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onSaveTemplate: () => boolean;
  isSaving?: boolean;
  onSaveEMR: (severity: Severity) => void;
  onNavigate?: (key: string) => void;
}

/* ── Keyframe animations (injected once) ──────────────────── */
const ANIMATIONS_CSS = `
@keyframes severity-pop {
  0%   { transform: scale(1); }
  30%  { transform: scale(0.80); }
  65%  { transform: scale(1.18); }
  85%  { transform: scale(0.96); }
  100% { transform: scale(1); }
}
@keyframes emr-slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes mini-bar-in {
  from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.90); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
}

/* ── Professional minimize: shrinks to bottom-center with blur */
@keyframes emr-shrink-out {
  0%   { transform: scale(1)    translateY(0);    opacity: 1;   filter: blur(0px);   }
  60%  { transform: scale(0.55) translateY(30vh); opacity: 0.5; filter: blur(2px);   }
  100% { transform: scale(0.08) translateY(86vh); opacity: 0;   filter: blur(8px);   }
}
@keyframes emr-shrink-in {
  0%   { transform: scale(0.08) translateY(86vh); opacity: 0;   filter: blur(8px);   }
  40%  { transform: scale(0.55) translateY(30vh); opacity: 0.5; filter: blur(2px);   }
  100% { transform: scale(1)    translateY(0);    opacity: 1;   filter: blur(0px);   }
}

.severity-btn-popping { animation: severity-pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.emr-modern-sheet    { animation: emr-slide-up 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.emr-mini-bar        { animation: mini-bar-in  0.34s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.emr-shrink-out      {
  animation: emr-shrink-out 0.38s cubic-bezier(0.4, 0, 0.8, 0.2) forwards;
  pointer-events: none;
  transform-origin: bottom center;
}
.emr-shrink-in       {
  animation: emr-shrink-in 0.40s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: bottom center;
}
`;

let _styleInjected = false;
function injectStyles() {
  if (_styleInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.textContent = ANIMATIONS_CSS;
  document.head.appendChild(el);
  _styleInjected = true;
}



/* ── Vital pill ──────────────────────────────────────────── */
function VitalPill({
  label,
  value,
  unit,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label
      className="inline-flex cursor-text items-center gap-1.5 rounded-2xl border border-wire/10 bg-white/[0.05] px-3 py-2 transition focus-within:border-neon/40 focus-within:ring-2 focus-within:ring-neon/15"
      style={{ flex: "1 1 0", minWidth: 0 }}
    >
      <span className="text-xs font-semibold text-neon/80 shrink-0">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-mist"
        style={{ width: 44 }}
      />
      <span className="text-xs text-mist shrink-0">{unit}</span>
    </label>
  );
}

/* ── Prescription row (flat, no card wrapper) ────────────── */
const SLOT_LABELS = ["Breakfast", "Lunch", "Dinner", "Night"] as const;
const EXCLUDED_PATTERNS = new Set(["0011", "0101", "1001", "0111", "1101"]);

const NOTE_QUICK_TAGS = [
  "Before meals",
  "After meals",
  "With meals",
  "Empty stomach",
  "With water",
  "Half tablet",
  "At bedtime",
  "Avoid dairy",
  "Avoid alcohol",
  "Chew before swallow",
] as const;

function generatePatterns(count: number): string[] {
  const results: string[] = [];
  for (let i = 0; i < 16; i++) {
    const bits = i.toString(2).padStart(4, "0");
    if (
      bits.split("").filter((b) => b === "1").length === count &&
      !EXCLUDED_PATTERNS.has(bits)
    )
      results.push(bits);
  }
  return results;
}

function patternLabel(pattern: string): string {
  return pattern
    .split("")
    .map((b, i) => (b === "1" ? SLOT_LABELS[i] : null))
    .filter(Boolean)
    .join(" + ");
}

function isValidPattern(s: string): boolean {
  return /^[01]{4}$/.test(s);
}

function ModernPrescriptionRow({
  row,
  onChange,
  onRemove,
}: {
  row: PrescriptionRow;
  onChange: (id: string, field: keyof PrescriptionRow, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const currentPattern = isValidPattern(row.frequency) ? row.frequency : "1000";
  const currentCount = currentPattern.split("").filter((b) => b === "1").length;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(() => row.notes !== "");
  const [noteExpanded, setNoteExpanded] = useState(false);

  const [fusedMode, setFusedMode] = useState(false);
  const [fusedText, setFusedText] = useState("");
  const fusedInputRef = useRef<HTMLInputElement>(null);
  const noteBtnRef = useRef<HTMLButtonElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const noteAreaRef = useRef<HTMLDivElement>(null);

  // Collapse pattern dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [dropdownOpen]);

  // Collapse note to compact view on outside click
  useEffect(() => {
    if (!noteExpanded) return;
    function handleOutside(e: MouseEvent) {
      if (
        noteAreaRef.current &&
        !noteAreaRef.current.contains(e.target as Node)
      ) {
        setNoteExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [noteExpanded]);

  function handleNoteToggle() {
    if (noteOpen) {
      setNoteOpen(false);
      setNoteExpanded(false);
    } else {
      setNoteOpen(true);
      setNoteExpanded(true);
    }
  }

  function handleCountChange(count: number) {
    onChange(row.id, "frequency", generatePatterns(count)[0]);
  }

  function handlePatternChange(pattern: string) {
    onChange(row.id, "frequency", pattern);
    setDropdownOpen(false);
  }

  function handleTagClick(tag: string) {
    const active = row.notes.toLowerCase().includes(tag.toLowerCase());
    if (active) {
      const cleaned = row.notes
        .replace(
          new RegExp(`(;\\s*)?${tag}(;\\s*)?`, "i"),
          (_: string, pre: string, post: string) => (pre && post ? "; " : ""),
        )
        .trim()
        .replace(/^;\s*/, "")
        .replace(/;\s*$/, "");
      onChange(row.id, "notes", cleaned);
    } else {
      const separator = row.notes.trim() ? "; " : "";
      onChange(row.id, "notes", row.notes.trim() + separator + tag);
    }
  }

  const patternOptions = generatePatterns(currentCount);
  const labelText = patternLabel(currentPattern);
  const labelIsLong = labelText.length > 9;

  return (
    <div className="border-b border-wire/[0.06] last:border-0">
      {/* Main row */}
      <div className="flex items-center gap-1.5 py-1.5">
        {/* Medicine name */}
        <MedicineAutocomplete
          className="flex-[1.0] min-w-0"
          value={row.medicineName}
          onChange={(val) => onChange(row.id, "medicineName", val)}
          onSelect={(med) => {
            onChange(row.id, "medicineId", String(med.id));
            onChange(row.id, "identifier_brand", med.identifier_brand);
            onChange(row.id, "generic_name", med.generic_name);
            if (med.substance_identifier)
              onChange(
                row.id,
                "substance_identifier",
                med.substance_identifier,
              );
            if (med.route_of_administration)
              onChange(
                row.id,
                "route_of_administration",
                med.route_of_administration,
              );
            if (med.dose_form) onChange(row.id, "dose_form", med.dose_form);
            if (med.therapeutic_role)
              onChange(row.id, "therapeutic_role", med.therapeutic_role);
            if (med.iupac_name) onChange(row.id, "iupac_name", med.iupac_name);
            if (med.molecular_formula)
              onChange(row.id, "molecular_formula", med.molecular_formula);
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              setFusedMode(true);
              setTimeout(() => fusedInputRef.current?.focus(), 0);
            }
          }}
          placeholder="Medicine name"
        />
        {fusedMode ? (
          <input
            ref={fusedInputRef}
            className="input-shell flex-[2.1] min-w-0 py-1.5 text-sm"
            value={fusedText}
            onChange={(e) => setFusedText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                const text = fusedText.trim();
                const freqMatch = text.match(/[01]{4}/);
                if (freqMatch) {
                  onChange(row.id, "frequency", freqMatch[0]);
                }
                const duration = text.replace(/[01]{4}/, "").trim();
                if (duration) {
                  onChange(row.id, "duration", duration);
                }
                setFusedMode(false);
                setTimeout(() => noteBtnRef.current?.focus(), 0);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.stopPropagation();
              }
            }}
            placeholder="Type code (e.g. 1101 5 Days)"
          />
        ) : (
          <>
            {/* Dose */}
            <input
              className="input-shell w-[58px] shrink-0 py-1.5 text-sm"
              value={row.dose}
              onChange={(e) => onChange(row.id, "dose", e.target.value)}
              placeholder="Dose"
            />
            {/* Frequency count selector */}
            <div
              className={`flex shrink-0 overflow-hidden rounded-xl border border-wire/10 ${labelIsLong ? "opacity-80" : ""}`}
            >
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCountChange(n)}
                  className={`${labelIsLong ? "px-1" : "px-1.5"} py-1.5 text-xs font-semibold transition-colors ${
                    currentCount === n
                      ? "bg-neon/20 text-neon"
                      : "bg-transparent text-mist hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {n}×
                </button>
              ))}
            </div>
            {/* Pattern dropdown */}
            <div className="relative flex-[1.1] min-w-[120px]" ref={dropdownRef}>
              <button
                type="button"
                aria-label="Dose timing pattern"
                onClick={() => setDropdownOpen((v) => !v)}
                className="input-shell flex w-full items-center gap-1.5 py-1.5 text-left"
              >
                <span className="font-mono text-[10px] text-white/35 shrink-0 tracking-widest">
                  {currentPattern}
                </span>
                <span className="flex-1 truncate text-xs text-white/80">
                  {labelText}
                </span>
                <ChevronDown
                  size={11}
                  className={`shrink-0 text-mist transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-[200] min-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-md">
                  {patternOptions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePatternChange(p)}
                      className={`flex w-full items-center px-3 py-2.5 text-xs transition-colors ${
                        p === currentPattern
                          ? "bg-neon/15 text-neon"
                          : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span className="w-12 shrink-0 font-mono text-[10px] tracking-widest opacity-45">
                        {p}
                      </span>
                      <span className="flex-1 text-left">{patternLabel(p)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {/* Note toggle button */}
        <button
          ref={noteBtnRef}
          type="button"
          onClick={handleNoteToggle}
          title={noteOpen ? "Hide note" : "Add doctor's note"}
          aria-expanded={noteOpen}
          className={`shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border text-[14px] font-bold leading-none transition-all duration-150 ${
            noteOpen || row.notes
              ? "border-neon/40 bg-neon/[0.07] text-neon"
              : "border-wire/20 text-mist/50 hover:border-neon/30 hover:text-neon"
          }`}
        >
          {noteOpen ? "−" : "+"}
        </button>
        {/* Duration */}
        {!fusedMode && (
          <input
            className="input-shell w-[70px] shrink-0 py-1.5 text-sm"
            value={row.duration}
            onChange={(e) => onChange(row.id, "duration", e.target.value)}
            placeholder="Duration"
          />
        )}
        {/* Remove */}
        <button
          type="button"
          aria-label="Remove medicine row"
          onClick={() => onRemove(row.id)}
          className="shrink-0 p-1 text-red-400/60 transition-colors hover:text-red-400 active:scale-90"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Note section */}
      {noteOpen && (
        <div ref={noteAreaRef} className="pb-2.5 pt-0.5">
          {noteExpanded ? (
            /* ── Expanded: textarea + quick-tag rail ── */
            <div className="flex gap-2">
              <textarea
                autoFocus
                rows={2}
                className="input-shell flex-1 min-w-0 resize-none py-1.5 text-xs leading-5"
                value={row.notes}
                onChange={(e) => onChange(row.id, "notes", e.target.value)}
                placeholder="Doctor's note (e.g. take after meals, avoid with dairy…)"
              />
              {/* Quick-tag rail */}
              <div className="flex flex-col gap-[3px] shrink-0 w-[118px]">
                {NOTE_QUICK_TAGS.map((tag) => {
                  const active = row.notes
                    .toLowerCase()
                    .includes(tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`rounded-md px-2 py-[3px] text-[10.5px] text-left font-medium leading-[1.35] transition-all duration-200 ease-out border ${
                        active
                          ? "border-neon/50 bg-neon/[0.12] text-neon scale-[1.02] shadow-[0_0_10px_rgba(0,255,136,0.15)]"
                          : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white/85 hover:border-white/20 hover:bg-white/[0.07]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Compact: pill preview + expand button ── */
            <div className="flex items-center gap-2">
              <div
                className="flex-1 min-w-0 cursor-text rounded-xl border border-wire/10 bg-white/[0.03] px-3 py-1.5"
                onClick={() => setNoteExpanded(true)}
              >
                {row.notes ? (
                  <p className="truncate text-xs text-white/70">{row.notes}</p>
                ) : (
                  <p className="text-xs text-white/25 italic">
                    Add doctor's note…
                  </p>
                )}
              </div>
              <button
                type="button"
                title="Expand note"
                onClick={() => setNoteExpanded(true)}
                className="shrink-0 flex items-center gap-1 rounded-lg border border-wire/10 bg-white/[0.03] px-2 py-1.5 text-[10px] text-white/40 transition-all hover:border-white/15 hover:text-white/70"
              >
                <Maximize2 size={10} />
                <span>Expand</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Section wrapper ─────────────────────────────────────── */
/* NOTE: overflow-visible so prescription dropdowns can escape the panel boundary */
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-wire/8 bg-white/[0.025] transition-all duration-200">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-white/50">
          {title}
        </span>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

/* ── Severity picker with iOS pop + neon glow ────────────── */

/* Active: same neon theme as Save EMR / action-btn */
const SEVERITY_ACTIVE_CLS = "border-neon/40 bg-neon/[0.12] text-neon";
const SEVERITY_ACTIVE_GLOW =
  "0 0 10px rgba(82,255,157,0.35), 0 0 24px rgba(82,255,157,0.15)";

/* Idle: plain ghost, no colour tinting */
const SEVERITY_IDLE_CLS =
  "border-wire/10 bg-transparent text-mist/70 hover:border-wire/20 hover:bg-white/[0.04] hover:text-white/80";

function SeverityPicker({
  value,
  onChange,
}: {
  value: Severity;
  onChange: (v: Severity) => void;
}) {
  const [popping, setPopping] = useState<Severity | null>(null);
  const opts: Severity[] = ["LOW", "MILD", "SEVERE"];

  function handleClick(o: Severity) {
    onChange(o);
    setPopping(o);
    setTimeout(() => setPopping(null), 400);
  }

  return (
    <div className="flex gap-2">
      {opts.map((o) => {
        const isActive = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => handleClick(o)}
            className={[
              "rounded-2xl border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              isActive ? SEVERITY_ACTIVE_CLS : SEVERITY_IDLE_CLS,
              popping === o ? "severity-btn-popping" : "",
            ].join(" ")}
            style={isActive ? { boxShadow: SEVERITY_ACTIVE_GLOW } : undefined}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════ */
export function EMRBuilderModern({
  patientName,
  patient,
  appointment,
  composerOpen = true,
  onCloseComposer,
  openedFromRecords = false,
  emr,
  templates,
  activeTemplateId,
  onStartConsultation,
  onEndConsultation,
  onPauseConsultation,
  onResumeConsultation,
  onFieldChange,
  onVitalChange,
  onPrescriptionChange,
  onAddPrescriptionRow,
  onRemovePrescriptionRow,
  onApplyTemplate,
  onSaveTemplate,
  isSaving = false,
  onSaveEMR,
  onNavigate,
}: EMRBuilderModernProps) {
  injectStyles();

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [severity, setSeverity] = useState<Severity>("LOW");
  const [minimized, setMinimized] = useState(false);
  const [minimizing, setMinimizing] = useState(false); // genie-out playing
  const [restoring, setRestoring] = useState(false); // genie-in playing

  /* Quick follow-up date shortcuts */
  function setFollowUpOffset(days: number | null) {
    if (days === null) {
      onFieldChange("followUpDate", "");
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    onFieldChange("followUpDate", d.toISOString().slice(0, 10));
  }

  const handleStartConsultation = useCallback(() => {
    onStartConsultation?.();
  }, [onStartConsultation]);

  const handleEndConsultation = useCallback(() => {
    onEndConsultation?.();
  }, [onEndConsultation]);

  if (!composerOpen) return null;

  const inSession = appointment?.status === "IN_SESSION";
  const paused = appointment?.status === "PAUSED";

  /* ── Minimize handler ── */
  function handleMinimize() {
    setMinimizing(true);
    setTimeout(() => {
      setMinimizing(false);
      setMinimized(true);
    }, 380);
  }

  /* ── Restore handler ── */
  function handleRestore() {
    setMinimized(false);
    setRestoring(true);
    setTimeout(() => setRestoring(false), 400);
  }

  /* ── Minimized state — visible pill ── */
  if (minimized) {
    return (
      <div
        className="emr-mini-bar fixed bottom-6 z-[999]"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
          style={{
            background: "linear-gradient(135deg, #0f1f17 0%, #0d1a20 100%)",
            border: "1px solid rgba(82,255,157,0.30)",
            boxShadow:
              "0 0 0 1px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.7), 0 0 28px rgba(82,255,157,0.12), inset 0 1px 0 rgba(82,255,157,0.08)",
          }}
        >
          {/* Status indicator — pulsing ring when in session */}
          <span className="relative flex shrink-0 items-center justify-center">
            {inSession && (
              <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-neon/30" />
            )}
            <span
              className={`relative h-2.5 w-2.5 rounded-full ${
                inSession
                  ? "bg-neon shadow-[0_0_8px_rgba(82,255,157,0.8)]"
                  : "bg-white/40"
              }`}
            />
          </span>

          {/* Label block */}
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="max-w-[160px] truncate text-[13px] font-semibold text-white">
              {patientName ?? "EMR Builder"}
            </span>
            <span className="text-[10px] font-medium text-neon/60 tracking-wide">
              {inSession ? "In session" : "EMR open"}
            </span>
          </div>

          {/* Separator */}
          <span className="h-5 w-px shrink-0 rounded-full bg-white/10" />

          {/* Expand button */}
          <button
            type="button"
            onClick={handleRestore}
            title="Expand EMR"
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-[#0d1a20] transition active:scale-95"
            style={{
              background: "linear-gradient(135deg, #52ff9d 0%, #00e67a 100%)",
              boxShadow: "0 2px 12px rgba(82,255,157,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 2px 20px rgba(82,255,157,0.55)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 2px 12px rgba(82,255,157,0.35)";
            }}
          >
            <Maximize2 size={11} /> Expand
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onCloseComposer}
            title="Close EMR"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/[0.08] hover:text-white/80 active:scale-90"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="emr-backdrop fixed inset-0 z-[999]"
      onClick={onCloseComposer}
    >
      {onNavigate && (
        <HoverRevealSidebar onNavigate={onNavigate} zIndex={1001} />
      )}
      <div
        className={[
          "emr-sheet absolute inset-0 flex flex-col",
          restoring
            ? "emr-shrink-in"
            : minimizing
              ? "emr-shrink-out"
              : "emr-modern-sheet",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top action bar ── */}
        <div className="flex items-center gap-1.5 flex-wrap px-4 py-2 border-b border-wire/8 shrink-0">
          {/* Consultation controls — hidden when opened from records */}
          {!openedFromRecords &&
            !inSession &&
            !paused &&
            onStartConsultation && (
              <button
                type="button"
                onClick={handleStartConsultation}
                className="action-btn gap-1.5 py-1.5 text-xs"
              >
                <Play size={13} /> Start Consultation
              </button>
            )}
          {inSession && onPauseConsultation && (
            <button
              type="button"
              onClick={onPauseConsultation}
              className="ghost-btn gap-1.5 py-1.5 text-xs"
            >
              <Pause size={13} /> Pause
            </button>
          )}
          {paused && onResumeConsultation && (
            <button
              type="button"
              onClick={onResumeConsultation}
              className="action-btn gap-1.5 py-1.5 text-xs"
            >
              <Play size={13} /> Resume
            </button>
          )}
          {(inSession || paused) && onEndConsultation && (
            <button
              type="button"
              onClick={handleEndConsultation}
              className="ghost-btn gap-1.5 py-1.5 text-xs border-red-400/25 text-red-300 hover:bg-red-400/10"
            >
              <Square size={13} /> End
            </button>
          )}

          {/* Follow-up quick-set */}
          <div className="flex items-center gap-0.5 rounded-xl border border-wire/10 bg-white/[0.04] px-1 py-0.5">
            {([1, 3, 5, 7] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setFollowUpOffset(d)}
                className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-mist transition hover:bg-white/10 hover:text-white"
              >
                {d}d
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFollowUpOffset(null)}
              className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-mist transition hover:bg-white/10 hover:text-white"
              title="Clear follow-up date"
            >
              C
            </button>
          </div>

          {/* Follow-up date picker */}
          <input
            type="date"
            aria-label="Follow-up date"
            title="Follow-up date"
            className="input-shell py-1 text-xs max-w-[150px]"
            value={emr.followUpDate}
            onChange={(e) => onFieldChange("followUpDate", e.target.value)}
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Template */}
          <button
            type="button"
            onClick={() => setTemplatePickerOpen(true)}
            className="ghost-btn gap-1.5 py-1.5 text-xs"
          >
            <LayoutTemplate size={13} /> Template
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onCloseComposer}
            className="ghost-btn gap-1.5 py-1.5 text-xs"
          >
            <X size={13} /> Close
          </button>

          {/* Minimize — triggers genie effect */}
          <button
            type="button"
            onClick={handleMinimize}
            title="Minimize EMR"
            className="ghost-btn gap-1.5 py-1.5 text-xs"
          >
            <Minimize2 size={13} /> Minimise
          </button>

          {/* Save EMR */}
          <button
            type="button"
            onClick={() => onSaveEMR(severity)}
            disabled={isSaving}
            className="action-btn gap-1.5 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={13} />
            {isSaving ? "Saving…" : "Save EMR"}
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div
          className="grid flex-1 overflow-hidden"
          style={{ gridTemplateColumns: "0.9fr 1.65fr", minHeight: 0 }}
        >
          {/* ── Left panel ── */}
          <div className="scroll-skin overflow-y-auto border-r border-wire/8 px-4 py-4 space-y-4">
            {/* Patient name strip */}
            {patientName && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-wire/8 bg-white/[0.03] px-4 py-2.5">
                <span className="text-sm font-semibold text-white">
                  {patientName}
                </span>
                <span className="ml-auto rounded-full border border-wire/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-mist">
                  {appointment?.status?.replace("_", " ") ?? "READY"}
                </span>
              </div>
            )}

            {/* Chief Complaint */}
            <Panel title="Chief Complaint">
              <textarea
                className="input-shell min-h-[80px] w-full resize-none text-sm"
                value={emr.patientInfo}
                onChange={(e) => onFieldChange("patientInfo", e.target.value)}
                placeholder="High blood pressure over past week..."
              />
            </Panel>

            {/* Assessment */}
            <Panel
              title="Assessment"
              action={
                <SeverityPicker value={severity} onChange={setSeverity} />
              }
            >
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    className="input-shell min-h-[72px] w-full resize-none text-sm"
                    value={emr.diagnosis}
                    onChange={(e) => onFieldChange("diagnosis", e.target.value)}
                    placeholder="Hypertension management..."
                  />
                </div>
              </div>
            </Panel>

            {/* Added Note / Simple Note */}
            <Panel title="Added Note">
              <textarea
                className="input-shell min-h-[72px] w-full resize-none text-sm"
                value={emr.simpleNote || ""}
                onChange={(e) => onFieldChange("simpleNote", e.target.value)}
                placeholder="Additional clinical note, observations, or subjective findings..."
              />
            </Panel>

          </div>

          {/* ── Right panel ── */}
          <div className="scroll-skin overflow-y-auto px-4 py-4 space-y-4">
            {/* Vitals */}
            <Panel title="Vitals">
              <div className="flex flex-wrap gap-2">
                <VitalPill
                  label="BP"
                  value={emr.vitals.bloodPressure}
                  unit="mmHg"
                  placeholder="120/80"
                  onChange={(v) => onVitalChange("bloodPressure", v)}
                />
                <VitalPill
                  label="HR"
                  value={emr.vitals.pulse}
                  unit="bpm"
                  placeholder="72"
                  onChange={(v) => onVitalChange("pulse", v)}
                />
                <VitalPill
                  label="Temp"
                  value={emr.vitals.temperature}
                  unit="°F"
                  placeholder="98.6"
                  onChange={(v) => onVitalChange("temperature", v)}
                />
                <VitalPill
                  label="SpO2"
                  value={emr.vitals.spo2}
                  unit="%"
                  placeholder="99"
                  onChange={(v) => onVitalChange("spo2", v)}
                />
                <VitalPill
                  label="Ht"
                  value={emr.vitals.height}
                  unit="cm"
                  placeholder="170"
                  onChange={(v) => onVitalChange("height", v)}
                />
                <VitalPill
                  label="Wt"
                  value={emr.vitals.weight}
                  unit="kg"
                  placeholder="70"
                  onChange={(v) => onVitalChange("weight", v)}
                />
              </div>
            </Panel>

            {/* Prescription */}
            <Panel
              title={`Prescription · ${emr.prescriptionRows.length} medicine${emr.prescriptionRows.length !== 1 ? "s" : ""}`}
            >
              <div>
                {/* Column headers — mirrors flex layout of each row */}
                {emr.prescriptionRows.length > 0 && (
                  <div className="hidden lg:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-mist/45 px-0.5 pb-1">
                    <span className="flex-[1.0] min-w-0">Medicine</span>
                    <span className="w-[58px] shrink-0">Dose</span>
                    <span className="w-[72px] shrink-0">Freq</span>
                    <span className="flex-[1.4] min-w-[160px]">
                      Code · Timing
                    </span>
                    <span className="w-[70px] shrink-0">Duration</span>
                    <span className="w-6 shrink-0" />
                  </div>
                )}
                {/* Rows */}
                <div>
                  {emr.prescriptionRows.map((row) => (
                    <ModernPrescriptionRow
                      key={row.id}
                      row={row}
                      onChange={onPrescriptionChange}
                      onRemove={onRemovePrescriptionRow}
                    />
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onAddPrescriptionRow}
                    className="ghost-btn gap-2 text-xs py-1.5"
                  >
                    + Add medicine
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplatePickerOpen(true)}
                    className="ghost-btn gap-2 text-xs py-1.5"
                  >
                    <LayoutTemplate size={13} /> Templates
                  </button>
                </div>
              </div>
            </Panel>

            {/* Lab Reports */}
            <Panel
              title="Lab Reports"
              action={
                <button
                  type="button"
                  onClick={() => setTemplatePickerOpen(true)}
                  className="ghost-btn gap-1.5 py-1 text-xs"
                >
                  <LayoutTemplate size={12} /> Templates
                </button>
              }
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-wire/10 bg-white/[0.03] px-4 py-2.5 cursor-pointer hover:bg-white/[0.05] transition-colors">
                  <span className="text-sm text-mist">Select lab reports</span>
                  <ChevronDown size={14} className="text-mist" />
                </div>

                <div className="rounded-2xl border border-wire/8 bg-slate-950/20 overflow-hidden">
                  <div className="px-4 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-mist/50">
                      Selected
                    </span>
                  </div>
                  <div className="px-4 pb-2">
                    {emr.labTests.trim() ? (
                      <p className="text-sm text-white/80 whitespace-pre-wrap">
                        {emr.labTests}
                      </p>
                    ) : (
                      <p className="text-sm italic text-mist/50">
                        No lab reports selected
                      </p>
                    )}
                  </div>
                  <textarea
                    className="input-shell w-full resize-none rounded-none border-0 border-t border-wire/8 bg-transparent text-sm"
                    rows={2}
                    value={emr.labTests}
                    onChange={(e) => onFieldChange("labTests", e.target.value)}
                    placeholder="CBC, HbA1c, ECG, fasting lipid profile..."
                  />
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* ── Template picker overlay ── */}
        {templatePickerOpen && (
          <div
            className="template-picker-overlay absolute inset-0 z-10 flex items-end justify-center"
            onClick={() => setTemplatePickerOpen(false)}
          >
            <div
              className="emr-sheet w-full overflow-hidden rounded-t-[28px] border-x border-t border-wire/10 shadow-[0_-20px_60px_rgba(0,0,0,0.7)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pb-1 pt-3">
                <div className="h-[5px] w-10 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between border-b border-wire/8 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setTemplatePickerOpen(false)}
                  className="flex items-center gap-1.5 rounded-2xl border border-wire/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.07]"
                >
                  <X size={14} /> Close
                </button>
                <div className="flex items-center gap-2">
                  <LayoutTemplate size={14} className="text-neon/70" />
                  <h3 className="text-[15px] font-semibold text-white/90">
                    Prescription Templates
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const saved = onSaveTemplate();
                    if (saved) setTemplatePickerOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-2xl border border-wire/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/70 transition hover:border-neon/20 hover:bg-neon/[0.06] hover:text-neon"
                >
                  <BookmarkPlus size={14} /> Create template
                </button>
              </div>

              <div className="scroll-skin max-h-[55vh] overflow-y-auto p-5">
                {templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <LayoutTemplate size={32} className="mb-3 text-mist/30" />
                    <p className="text-sm text-mist">No templates yet.</p>
                    <p className="mt-1 text-xs text-mist/60">
                      Fill a prescription and click "Create template" to save
                      it.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {templates.map((tpl) => {
                      const isActive = activeTemplateId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            onApplyTemplate(tpl.id);
                            setTemplatePickerOpen(false);
                          }}
                          className={[
                            "group rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.015]",
                            isActive
                              ? "border-neon/35 bg-[linear-gradient(135deg,rgba(82,255,157,0.10),rgba(82,255,157,0.03))] shadow-[0_4px_20px_rgba(82,255,157,0.10)]"
                              : "border-wire/8 bg-white/[0.02] hover:border-neon/25 hover:bg-neon/[0.04]",
                          ].join(" ")}
                        >
                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <span
                              className={`text-sm font-semibold ${isActive ? "text-neon" : "text-white"}`}
                            >
                              {tpl.name}
                            </span>
                            <span className="flex-shrink-0 rounded-full border border-wire/10 bg-white/[0.06] px-2 py-0.5 text-[10px] text-mist">
                              {tpl.rows.length} med
                              {tpl.rows.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="mb-3 line-clamp-1 text-[11px] text-mist/80">
                            {tpl.diagnosis}
                          </p>
                          <div className="space-y-1.5">
                            {tpl.rows.slice(0, 3).map((row) => (
                              <div
                                key={row.id}
                                className="flex items-center gap-2"
                              >
                                <span className="h-1 w-1 flex-shrink-0 rounded-full bg-neon/40" />
                                <span className="min-w-0 flex-1 truncate text-xs text-white/80">
                                  {row.medicineName}
                                </span>
                                <span className="flex-shrink-0 text-[10px] text-mist">
                                  {row.dose} · {row.frequency}
                                </span>
                              </div>
                            ))}
                            {tpl.rows.length > 3 && (
                              <p className="pl-3 text-[10px] text-mist/60">
                                +{tpl.rows.length - 3} more medicine
                                {tpl.rows.length - 3 !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
