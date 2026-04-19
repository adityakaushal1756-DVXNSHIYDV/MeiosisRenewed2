import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  FileText,
  Clock3,
  ClipboardPlus,
  HeartPulse,
  LogOut,
  MoveRight,
  ScanLine,
  ShieldAlert,
  Sparkles,
  StopCircle,
  Users,
  FileUp,
  Printer,
  Settings,
  Wand2,
  Trash2,
} from "lucide-react";
import {
  lazy,
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { LANGUAGES } from "../i18n/translations";
import { Sidebar, NavKey } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { apiUrl } from "../lib/api";
import { CURRENT_DOCTOR } from "../config/doctorProfile";
const QueuePanel = lazy(() => import("../components/Queue/QueuePanel").then(m => ({ default: m.QueuePanel })));
const PatientSearch = lazy(() => import("../components/Patient/PatientSearch").then(m => ({ default: m.PatientSearch })));
const PatientProfile = lazy(() => import("../components/Patient/PatientProfile").then(m => ({ default: m.PatientProfile })));
const PatientRecordAccess = lazy(() => import("../components/Patient/PatientRecordAccess").then(m => ({ default: m.PatientRecordAccess })));
const EMRBuilder = lazy(() => import("../components/EMR/EMRBuilder").then(m => ({ default: m.EMRBuilder })));
const EMRBuilderModern = lazy(() => import("../components/EMR/EMRBuilderModern").then(m => ({ default: m.EMRBuilderModern })));
import { generateTodaySlots } from "../utils/slotGenerator";

// Lazy-loaded: these are large secondary features that most sessions never open.
// Vite code-splits each into its own chunk — downloaded only on first visit.
const ScheduleManager = lazy(() =>
  import("../components/Schedule/ScheduleManager").then((m) => ({
    default: m.ScheduleManager,
  })),
);
const MessagePanel = lazy(() =>
  import("../components/Messages/MessagePanel").then((m) => ({
    default: m.MessagePanel,
  })),
);
const MedicalCalendar = lazy(() =>
  import("../components/Calendar/MedicalCalendar").then((m) => ({
    default: m.MedicalCalendar,
  })),
);
import type { DoctorCompletedAppointment } from "../hooks/useDoctorAnalytics";
import { Appointment } from "../types/Appointment";
import { Patient } from "../types/Patient";
import { EMRState, PdfTemplate, PrescriptionTemplate } from "../types/EMR";
import { DailySchedule } from "../components/Schedule/ScheduleDayEditor";
import type { EmrShareRequest } from "../hooks/useEmrShareNotifications";

interface DashboardProps {
  nav: NavKey;
  onNavChange: (key: NavKey) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  consoleCollapsible: boolean;
  consoleCollapsed: boolean;
  consoleWidth: number;
  onToggleConsoleCollapsible: () => void;
  onToggleConsoleCollapsed: () => void;
  onConsoleWidthChange: (value: number) => void;
  darkMode: boolean;
  themeMode:
    | "dark"
    | "light"
    | "super-dark"
    | "green"
    | "orange"
    | "violet"
    | "yellow"
    | "custom";
  customTheme: { hue: number; brightness: number };
  onThemeModeChange: (
    theme:
      | "dark"
      | "light"
      | "super-dark"
      | "green"
      | "orange"
      | "violet"
      | "yellow"
      | "custom",
  ) => void;
  onCustomThemeChange: (theme: { hue: number; brightness: number }) => void;
  onToggleTheme: () => void;
  timelineTheme: "default" | "dashboard-dark" | "beige-light";
  onTimelineThemeChange: (
    theme: "default" | "dashboard-dark" | "beige-light",
  ) => void;
  emrBuilderV2Theme: "default" | "dashboard-dark" | "beige-light";
  onEmrBuilderV2ThemeChange: (
    theme: "default" | "dashboard-dark" | "beige-light",
  ) => void;
  emrBuilderLayout: "simple" | "modern";
  onEmrBuilderLayoutChange: (layout: "simple" | "modern") => void;
  timelineLayout: "simple" | "advanced";
  onTimelineLayoutChange: (layout: "simple" | "advanced") => void;
  currentTime: string;
  doctorName: string;
  clinicStatus: string;
  notifications: number;
  emrShareRequests: EmrShareRequest[];
  onRespondEmrShare: (
    request: EmrShareRequest,
    accepted: boolean,
  ) => void | Promise<void>;
  completedAppointments: DoctorCompletedAppointment[];
  queue: Appointment[];
  patients: Patient[];
  filteredPatients: Patient[];
  searchQuery: string;
  selectedPatient: Patient | null;
  selectedPatientId: string | null;
  activeAppointment: Appointment | null;
  activeAppointmentId: string | null;
  scannedPatient: Patient | null;
  expandedHistoryId: string | null;
  emr: EMRState;
  templates: PrescriptionTemplate[];
  activeTemplateId: string | null;
  emrComposerOpen: boolean;
  scheduleDays: DailySchedule[];
  slotDuration: number;
  onSlotDurationChange: (minutes: number) => void;
  queueBlockDuration: number;
  onQueueBlockDurationChange: (minutes: number) => void;
  followUpGapDays: number;
  onFollowUpGapDaysChange: (days: number) => void;
  pdfTemplates: PdfTemplate[];
  onPdfTemplatesChange: (templates: PdfTemplate[]) => void;
  vacationNote: string;
  lateStartDate: string;
  lateStartTime: string;
  isSyncingQueue?: boolean;
  isSyncingPatients?: boolean;
  isSyncingAnalytics?: boolean;
  onSearchChange: (value: string) => void;
  onSelectPatient: (patientId: string) => void;
  onSelectQueue: (appointmentId: string) => void;
  onStartQueueAppointment: (appointmentId: string) => void;
  onEndQueueAppointment: (appointmentId: string) => void;
  onSkipQueueAppointment: (appointmentId: string) => void;
  onMarkNoShow: (appointmentId: string) => void;
  onAddWalkIn: () => void;
  onRefreshQueue: () => void;
  onStartConsultation: () => void;
  onEndConsultation: () => void;
  onPauseConsultation: () => void;
  onResumeConsultation: () => void;
  onRandomScan: () => void;
  onHandleScanCode: (code: string) => void;
  onToggleHistory: (entryId: string) => void;
  onEmrFieldChange: (field: keyof EMRState, value: string) => void;
  onVitalChange: (field: keyof EMRState["vitals"], value: string) => void;
  onPrescriptionChange: (
    id: string,
    field: keyof EMRState["prescriptionRows"][number],
    value: string,
  ) => void;
  onAddPrescriptionRow: () => void;
  onRemovePrescriptionRow: (id: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onSaveTemplate: () => boolean;
  onDeleteTemplates: (templateIds: string[]) => void;
  emrSaving: boolean;
  emrToast: { ok: boolean; msg: string } | null;
  onSaveEMR: (severity?: string) => void;
  emrOpenedFromRecords?: boolean;
  onOpenEmrComposer: () => void;
  onCloseEmrComposer: () => void;
  onViewRecords: (patientId: string) => void;
  onCloseRecords: () => void;
  viewRecordsPatientId: string | null;
  onSyncSchedule: () => Promise<boolean>;
  onToggleDayOpen: (day: string) => void;
  onScheduleChange: (
    day: string,
    field: keyof Omit<DailySchedule, "day" | "open">,
    value: string,
  ) => void;
  onVacationNoteChange: (value: string) => void;
  onLateStartDateChange: (value: string) => void;
  onLateStartTimeChange: (value: string) => void;
  onLogout: () => void;
  isOnline?: boolean;
  syncStatus?: import("../hooks/useOfflineSync").SyncStatus;
  pendingCount?: number;
  accessLevel: "full" | "lab" | "summary" | null;
}

/* ── Shared primitives ───────────────────────────────────── */

function SectionHeader({
  icon,
  title,
  copy,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-2xl border border-wire/10 bg-white/[0.04] p-3 text-neon">
        {icon}
      </div>
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="section-copy">{copy}</p>
      </div>
    </div>
  );
}

function PlaceholderBlock({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children?: ReactNode;
}) {
  return (
    <section className="glass-card p-5">
      <SectionHeader icon={<Sparkles size={18} />} title={title} copy={copy} />
      <div className="rounded-3xl border border-wire/8 bg-white/[0.03] p-5 text-sm leading-6 text-white/80">
        {children}
      </div>
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: ReactNode;
  glow: string; // tailwind bg color class for the corner blur spot
  stripe: string; // bg color class for the top accent stripe
  iconRing: string; // border + bg class for icon box
  iconColor: string; // text color class for icon
  valueColor: string; // text color class for the big number
  animate?: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  glow,
  stripe,
  iconRing,
  iconColor,
  valueColor,
  animate,
}: StatCardProps) {
  return (
    <div
      className={`glass-card relative overflow-hidden bg-[linear-gradient(180deg,rgba(8,26,43,0.98),rgba(5,18,31,0.94))] p-5 ${animate ? "stat-live-glow" : ""}`}
    >
      {/* colored top accent stripe — always visible */}
      <div className={`absolute inset-x-0 top-0 h-[4px] ${stripe}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-mist">
            {label}
          </p>
          <p
            className={`mt-2 text-4xl font-bold leading-none tabular-nums drop-shadow-[0_0_18px_rgba(255,255,255,0.06)] ${valueColor}`}
          >
            {value}
          </p>
          {sub && <p className="mt-2 text-xs text-mist/75">{sub}</p>}
        </div>
        <div
          className={`flex-shrink-0 rounded-2xl border p-3 shadow-[0_10px_28px_rgba(0,0,0,0.18)] ${iconRing} ${iconColor}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

type AnalysisRange = "hour" | "day" | "month" | "year";

const ANALYSIS_RANGES: AnalysisRange[] = ["hour", "day", "month", "year"];

function buildAnalysisBuckets(
  appointments: DoctorCompletedAppointment[],
  range: AnalysisRange,
) {
  const now = new Date();
  const cleanAppointments = appointments
    .map((appointment) => ({
      patientId: appointment.patientId,
      date: new Date(appointment.scheduledDate),
    }))
    .filter((appointment) => !Number.isNaN(appointment.date.getTime()));

  const buckets: Array<{
    key: string;
    label: string;
    appointments: Array<{ patientId: string; date: Date }>;
  }> = [];

  if (range === "hour") {
    const base = new Date(now);
    base.setMinutes(0, 0, 0);
    for (let index = 11; index >= 0; index -= 1) {
      const start = new Date(base);
      start.setHours(base.getHours() - index);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);
      buckets.push({
        key: start.toISOString(),
        label: start
          .toLocaleTimeString("en-IN", { hour: "numeric", hour12: true })
          .replace(/\s/g, ""),
        appointments: cleanAppointments.filter(
          (appointment) => appointment.date >= start && appointment.date < end,
        ),
      });
    }
  } else if (range === "day") {
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    for (let index = 6; index >= 0; index -= 1) {
      const start = new Date(base);
      start.setDate(base.getDate() - index);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      buckets.push({
        key: start.toISOString(),
        label: start.toLocaleDateString("en-IN", { weekday: "short" }),
        appointments: cleanAppointments.filter(
          (appointment) => appointment.date >= start && appointment.date < end,
        ),
      });
    }
  } else if (range === "month") {
    const base = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let index = 5; index >= 0; index -= 1) {
      const start = new Date(base.getFullYear(), base.getMonth() - index, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      buckets.push({
        key: start.toISOString(),
        label: start.toLocaleDateString("en-IN", { month: "short" }),
        appointments: cleanAppointments.filter(
          (appointment) => appointment.date >= start && appointment.date < end,
        ),
      });
    }
  } else {
    const baseYear = now.getFullYear();
    for (let index = 4; index >= 0; index -= 1) {
      const year = baseYear - index;
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      buckets.push({
        key: String(year),
        label: String(year),
        appointments: cleanAppointments.filter(
          (appointment) => appointment.date >= start && appointment.date < end,
        ),
      });
    }
  }

  const series = buckets.map((bucket) => {
    const patientIds = new Set(
      bucket.appointments.map((appointment) => appointment.patientId),
    );
    return {
      key: bucket.key,
      label: bucket.label,
      visits: bucket.appointments.length,
      patients: patientIds.size,
    };
  });

  const periodPatientIds = new Set(
    series.flatMap(
      (bucket) =>
        buckets
          .find((candidate) => candidate.key === bucket.key)
          ?.appointments.map((appointment) => appointment.patientId) ?? [],
    ),
  );
  const totalVisits = series.reduce((sum, bucket) => sum + bucket.visits, 0);
  const maxVisits = Math.max(...series.map((bucket) => bucket.visits), 1);
  const peakBucket = series.reduce(
    (best, bucket) => (bucket.visits > best.visits ? bucket : best),
    series[0] ?? {
      key: "none",
      label: "--",
      visits: 0,
      patients: 0,
    },
  );

  return {
    series,
    totalVisits,
    totalPatients: periodPatientIds.size,
    averageVisits: series.length ? totalVisits / series.length : 0,
    maxVisits,
    peakBucket,
  };
}

function AnalysisCard({
  appointments,
}: {
  appointments: DoctorCompletedAppointment[];
}) {
  const [range, setRange] = useState<AnalysisRange>("day");
  const [rangeMotionKey, setRangeMotionKey] = useState(0);
  const rangeIndex = ANALYSIS_RANGES.indexOf(range);
  const analytics = useMemo(
    () => buildAnalysisBuckets(appointments, range),
    [appointments, range],
  );
  const rangeUnit =
    range === "hour"
      ? "hour"
      : range === "day"
        ? "day"
        : range === "month"
          ? "month"
          : "year";

  return (
    <section className="glass-card relative overflow-hidden p-4">
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.26em] text-sky/80">
              Your Analysis
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {analytics.totalPatients} patients treated
            </h2>
          </div>

          <div className="relative inline-grid grid-cols-4 rounded-full border border-wire/10 bg-slate-950/35 p-1">
            <div
              className="pointer-events-none absolute bottom-1 top-1 rounded-full bg-sky/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[left] duration-300 ease-out"
              style={{
                left: `calc(${rangeIndex * 25}% + 4px)`,
                width: "calc(25% - 8px)",
              }}
            />
            {ANALYSIS_RANGES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === range) return;
                  setRange(item);
                  setRangeMotionKey((current) => current + 1);
                }}
                className={`relative z-10 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition-colors duration-200 ${
                  range === item ? "text-white" : "text-mist hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-[26px] border border-wire/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.96),rgba(6,18,30,0.92))] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">
              {analytics.totalVisits} completed visits
            </p>
            <span className="chip border-sky/20 bg-sky/10 text-sky">
              <MoveRight size={12} />
              Peak {analytics.peakBucket.label}
            </span>
          </div>

          <div className="relative h-[172px] rounded-[22px] border border-wire/8 bg-slate-950/28 px-3 pb-3 pt-4">
            <div className="pointer-events-none absolute inset-x-3 top-7 border-t border-white/5" />
            <div className="pointer-events-none absolute inset-x-3 top-1/2 border-t border-white/5" />
            <div className="pointer-events-none absolute inset-x-3 bottom-10 border-t border-white/5" />
            <div className="flex h-full items-end gap-2">
              {analytics.series.map((bucket, index) => (
                <div
                  key={`${range}-${bucket.key}`}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    className="text-[10px] font-medium text-white/70 transition-[transform,opacity] duration-300 ease-out"
                    style={{ transitionDelay: `${index * 35}ms` }}
                  >
                    {bucket.visits}
                  </div>
                  <div className="flex h-[102px] w-full items-end justify-center">
                    <div
                      key={`${rangeMotionKey}-${index}`}
                      className="analysis-bar-live w-full max-w-[30px] rounded-t-[14px] bg-[linear-gradient(180deg,rgba(131,212,255,0.95),rgba(82,255,157,0.82))] transition-[height,transform,opacity,filter] duration-500 ease-out"
                      style={{
                        height: `${Math.max((bucket.visits / analytics.maxVisits) * 100, bucket.visits > 0 ? 12 : 4)}%`,
                        animationDelay: `${index * 45}ms`,
                      }}
                    />
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-[0.16em] text-mist transition-[transform,opacity] duration-300 ease-out"
                    style={{ transitionDelay: `${index * 35}ms` }}
                  >
                    {bucket.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-mist">
            <span>
              {analytics.averageVisits.toFixed(1)} avg per {rangeUnit}
            </span>
            <span>{analytics.peakBucket.visits} max</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FocusCard({
  eyebrow,
  title,
  copy,
  icon,
  tone = "neutral",
}: {
  eyebrow: string;
  title: string;
  copy: string;
  icon: ReactNode;
  tone?: "neutral" | "success" | "warning" | "info";
}) {
  const toneClasses = {
    neutral: "border-wire/10 bg-white/[0.03] text-white",
    success: "border-neon/20 bg-neon/[0.08] text-white",
    warning: "border-amber-400/20 bg-amber-400/[0.08] text-white",
    info: "border-sky/20 bg-sky/[0.08] text-white",
  }[tone];

  return (
    <article
      className={`rounded-[26px] border p-4 transition duration-300 hover:-translate-y-0.5 ${toneClasses}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/30 text-neon">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-mist">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/72">{copy}</p>
        </div>
      </div>
    </article>
  );
}

/* ── Apply Schedule Button ───────────────────────────────── */

function ApplyScheduleButton({ onSync }: { onSync: () => Promise<boolean> }) {
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">(
    "idle",
  );

  async function handleClick() {
    setStatus("saving");
    const ok = await onSync();
    setStatus(ok ? "ok" : "err");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "saving"}
      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
        status === "ok"
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : status === "err"
            ? "border-red-400/30 bg-red-400/10 text-red-300"
            : "border-neon/25 bg-neon/[0.08] text-neon hover:bg-neon/[0.14]"
      }`}
    >
      {status === "saving" && (
        <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {status === "ok"
        ? "Saved to schedule ✓"
        : status === "err"
          ? "Failed — retry"
          : status === "saving"
            ? "Applying…"
            : "Apply to Schedule"}
    </button>
  );
}

function DashboardLoadingFallback({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-mist/40 text-sm">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
      <span>{label}</span>
    </div>
  );
}

/* ── Dashboard component ─────────────────────────────────── */

export default function Dashboard(props: DashboardProps) {
  const { t, lang, setLang } = useTranslation();

  // If props is null or missing critical arrays, show loading state instead of crashing
  if (!props || !props.nav) {
    return <DashboardLoadingFallback label="Connecting to workspace..." />;
  }

  const [topbarCompact, setTopbarCompact] = useState(false);
  const topbarCompactRef = useRef(false);
  const topbarScrollRaf = useRef<number | null>(null);
  const settingsTemplatesRef = useRef<HTMLDivElement | null>(null);
  const [templateDeleteMode, setTemplateDeleteMode] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [respondingShareId, setRespondingShareId] = useState<string | null>(
    null,
  );
  const [templateToast, setTemplateToast] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const showToast = (ok: boolean, msg: string) => {
    setTemplateToast({ ok, msg });
    window.setTimeout(() => {
      setTemplateToast((current) => (current?.msg === msg ? null : current));
    }, 4000);
  };

  const {
    nav,
    onNavChange,
    sidebarOpen,
    onToggleSidebar,
    consoleCollapsible,
    consoleCollapsed,
    consoleWidth,
    onToggleConsoleCollapsible,
    onToggleConsoleCollapsed,
    onConsoleWidthChange,
    darkMode,
    themeMode,
    customTheme,
    onThemeModeChange,
    onCustomThemeChange,
    onToggleTheme,
    timelineTheme,
    onTimelineThemeChange,
    emrBuilderV2Theme,
    onEmrBuilderV2ThemeChange,
    emrBuilderLayout,
    onEmrBuilderLayoutChange,
    timelineLayout,
    onTimelineLayoutChange,
    currentTime = new Date().toLocaleTimeString(),
    doctorName = "Doctor",
    clinicStatus = "Available",
    notifications = 0,
    emrShareRequests = [],
    onRespondEmrShare,
    completedAppointments = [],
    queue = [],
    patients = [],
    filteredPatients = [],
    searchQuery = "",
    selectedPatient,
    selectedPatientId,
    activeAppointment,
    activeAppointmentId,
    expandedHistoryId,
    emr,
    templates = [],
    activeTemplateId,
    emrComposerOpen,
    scheduleDays = [],
    slotDuration = 15,
    onSlotDurationChange,
    queueBlockDuration = 10,
    onQueueBlockDurationChange,
    followUpGapDays = 14,
    onFollowUpGapDaysChange,
    pdfTemplates = [],
    onPdfTemplatesChange,
    vacationNote = "",
    lateStartDate = "",
    lateStartTime = "",
    onSearchChange,
    onSelectPatient,
    onSelectQueue,
    onStartQueueAppointment,
    onEndQueueAppointment,
    onSkipQueueAppointment,
    onMarkNoShow,
    onAddWalkIn,
    onRefreshQueue,
    onStartConsultation,
    onEndConsultation,
    onPauseConsultation,
    onResumeConsultation,
    onToggleHistory,
    onEmrFieldChange,
    onVitalChange,
    onPrescriptionChange,
    onAddPrescriptionRow,
    onRemovePrescriptionRow,
    onApplyTemplate,
    onSaveTemplate,
    onDeleteTemplates,
    emrSaving,
    emrToast,
    onSaveEMR,
    emrOpenedFromRecords = false,
    onOpenEmrComposer,
    onCloseEmrComposer,
    onViewRecords,
    onCloseRecords,
    viewRecordsPatientId,
    onSyncSchedule,
    onToggleDayOpen,
    onScheduleChange,
    onVacationNoteChange,
    onLateStartDateChange,
    onLateStartTimeChange,
    onLogout,
    isOnline = true,
    syncStatus,
    pendingCount = 0,
    isSyncingQueue = false,
    isSyncingPatients = false,
    isSyncingAnalytics = false,
    accessLevel = "full",
  } = props;

  const isSyncingAny = isSyncingQueue || isSyncingPatients || isSyncingAnalytics;
  const isRenderablePdfTemplate = (template: PdfTemplate) =>
    template.type === "built" &&
    typeof template.htmlTemplate === "string" &&
    template.htmlTemplate.trim() !== "" &&
    template.htmlTemplate.trim() !== "<!-- UPLOADED_PDF_PLACEHOLDER -->";
  const activePdfTemplate =
    pdfTemplates.find(
      (template: PdfTemplate) =>
        template.isActive && isRenderablePdfTemplate(template),
    ) ?? null;

  // Diagnostic Log
  useEffect(() => {
    console.log("[Meiosis Debug] Dashboard Render Props:", {
      nav,
      queueStatus: queue ? `Ready (${queue.length} items)` : 'Loading...',
      patientsStatus: patients ? `Ready (${patients.length} items)` : 'Loading...',
      analyticsStatus: completedAppointments ? `Ready (${completedAppointments.length} items)` : 'Loading...',
      scheduleStatus: scheduleDays ? `Ready (${scheduleDays.length} items)` : 'Loading...',
      selectedPatientId,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [nav, queue, patients, completedAppointments, scheduleDays, selectedPatientId]);

  useEffect(() => {
    setSelectedTemplateIds((current) =>
      current.filter((id) => templates.some((template) => template.id === id)),
    );
  }, [templates]);

  useEffect(() => {
    topbarCompactRef.current = topbarCompact;
  }, [topbarCompact]);

  useEffect(
    () => () => {
      if (topbarScrollRaf.current !== null) {
        cancelAnimationFrame(topbarScrollRaf.current);
      }
    },
    [],
  );

  const waiting = (queue || []).filter(
    (q) => q?.status === "WAITING" || q?.status === "LATE",
  ).length;
  const inSession = (queue || []).filter(
    (q) => q?.status === "IN_SESSION" || q?.status === "PAUSED",
  ).length;
  const completed = (queue || []).filter((q) => q?.status === "COMPLETED").length;
  const noShows = (queue || []).filter((q) => q?.status === "NO_SHOW").length;

  const activePatient = activeAppointment
    ? ((patients || []).find((p) => p?.id === activeAppointment?.patientId) ?? null)
    : null;
  const nextWaiting =
    (queue || []).find((item) => item?.status === "WAITING" || item?.status === "LATE") ??
    null;
  const nextWaitingPatient = nextWaiting
    ? ((patients || []).find((patient) => patient?.id === nextWaiting?.patientId) ?? null)
    : null;
  const scanReadyCount = (patients || []).filter(
    (patient) => patient?.meiosisCode,
  ).length;
  const allergyFlagCount = (patients || []).filter(
    (patient) => (patient?.allergies || []).length > 0,
  ).length;
  const chronicFlagCount = (patients || []).filter(
    (patient) => (patient?.chronicConditions || []).length > 0,
  ).length;
  const queuePressureLabel =
    waiting >= 6
      ? "High pressure queue"
      : waiting >= 3
        ? "Moderate queue load"
        : "Queue under control";
  const queuePressureCopy =
    waiting >= 6
      ? "Front desk and consultation flow should prioritize turnover in the next 60 minutes."
      : waiting >= 3
        ? "Steady traffic is building. Surfacing next-up context early will reduce idle transitions."
        : "The current pace leaves room for deeper review and chart completion between patients.";
  const latestNotifications: Array<{
    id: string;
    title: string;
    body: string;
    tone: "amber" | "green" | "blue";
  }> = [
    ...(queue?.filter?.((item) => item?.status === "LATE")?.length
      ? [
          {
            id: "notif-late",
            title: "Late arrivals in queue",
            body: `${queue.filter((item) => item.status === "LATE").length} patient${queue.filter((item) => item.status === "LATE").length === 1 ? "" : "s"} may need front-desk follow-up before consult handoff.`,
            tone: "amber" as const,
          },
        ]
      : []),
    ...(queue?.filter?.((item) => item?.status === "NO_SHOW")?.length
      ? [
          {
            id: "notif-no-show",
            title: "No-show patients flagged",
            body: `${queue.filter((item) => item.status === "NO_SHOW").length} patient${queue.filter((item) => item.status === "NO_SHOW").length === 1 ? "" : "s"} marked no-show in today’s queue.`,
            tone: "blue" as const,
          },
        ]
      : []),
    ...(completed
      ? [
          {
            id: "notif-completed",
            title: "Completed consultations synced",
            body: `${completed} consultation${completed === 1 ? "" : "s"} already archived in today’s workflow.`,
            tone: "green" as const,
          },
        ]
      : []),
  ];
  const activeConsultCopy = activeAppointment
    ? `${activePatient?.name ?? "Patient"} is live with ${activeAppointment?.visitReason?.toLowerCase() || "consultation"} at ${activeAppointment?.appointmentTime || "now"}.`
    : "No live consultation is open right now. You can launch the next session directly from the queue.";
  const selectedPatientCopy = selectedPatient
    ? `${selectedPatient?.name || "Patient"} has ${(selectedPatient?.history || []).length} prior visits, ${(selectedPatient?.prescriptions || []).length} prescription records, and ${(selectedPatient?.medicalReports || []).length} reports ready for review.`
    : "Select a patient to pin the clinical summary, historical risk, and accessible records into one workspace.";
  const nextPatientRiskLabel = nextWaitingPatient
    ? (nextWaitingPatient?.allergies || []).length > 0
      ? "Allergy review needed"
      : (nextWaitingPatient?.chronicConditions || []).length > 0
        ? "Chronic follow-up context"
        : "Standard review"
    : "Queue clear";

  /* ── Overview (Dashboard) ── */
  const overview = (
    <div className="space-y-5">
      {/* Background Sync Indicator */}
      {isSyncingAny && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon/5 border border-neon/10 animate-pulse w-fit ml-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-neon shadow-[0_0_8px_rgba(82,255,157,1)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-neon">Syncing Dashboard</span>
        </div>
      )}
      {/* Active consultation spotlight */}
      {activeAppointment && (
        <div className="stat-live-glow rounded-[28px] border border-neon/35 bg-gradient-to-r from-neon/[0.1] via-neon/[0.04] to-transparent p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-neon/30 bg-neon/[0.15] text-lg font-bold text-neon">
                {activePatient
                  ? activePatient.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()
                  : "?"}
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon">
                  <span
                    className="live-dot"
                    style={{
                      width: "5px",
                      height: "5px",
                      background: "#031525",
                    }}
                  />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="live-dot" />
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-neon/80">
                    Live Consultation
                  </span>
                </div>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  {activePatient?.name ?? "Patient"}
                </h3>
                <p className="text-sm text-mist">
                  {activeAppointment.visitReason} ·{" "}
                  {activeAppointment.appointmentTime}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenEmrComposer}
                className="action-btn gap-2"
              >
                <ClipboardPlus size={16} />
                Open EMR
              </button>
              <button
                type="button"
                onClick={() => {
                  if (emrComposerOpen) {
                    onSaveEMR("MILD");
                  } else {
                    onEndConsultation();
                  }
                }}
                className="ghost-btn gap-2 !border-red-400/25 !text-red-300 hover:!border-red-400/40 hover:!bg-red-400/[0.12]"
              >
                <StopCircle size={16} />
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total queue"
          value={queue?.length || 0}
          sub={`${waiting} waiting · ${inSession} in session`}
          icon={<Users size={18} />}
          glow="bg-sky-400"
          stripe="bg-sky"
          iconRing="border-sky/20 bg-sky/10"
          iconColor="text-sky"
          valueColor="text-sky"
        />
        <StatCard
          label="In session"
          value={inSession}
          sub={
            inSession === 1
              ? "consultation live now"
              : inSession > 1
                ? "consultations live"
                : "none active"
          }
          icon={<Activity size={18} />}
          glow="bg-neon"
          stripe="bg-neon"
          iconRing="border-neon/20 bg-neon/10"
          iconColor="text-neon"
          valueColor="text-neon"
          animate={inSession > 0}
        />
        <StatCard
          label="Completed"
          value={completed}
          sub={`${(queue?.length || 0) > 0 ? Math.round((completed / (queue?.length || 1)) * 100) : 0}% of today's queue`}
          icon={<CheckCircle2 size={18} />}
          glow="bg-emerald-400"
          stripe="bg-emerald-400"
          iconRing="border-emerald-400/20 bg-emerald-400/10"
          iconColor="text-emerald-400"
          valueColor="text-emerald-300"
        />
        <StatCard
          label="Alerts"
          value={(notifications || 0) + noShows}
          sub={
            noShows > 0
              ? `${noShows} no-show${noShows > 1 ? "s" : ""}`
              : "no critical alerts"
          }
          icon={<BellRing size={18} />}
          glow="bg-amber-400"
          stripe="bg-amber-300"
          iconRing="border-amber-400/20 bg-amber-400/10"
          iconColor="text-amber-300"
          valueColor="text-amber-200"
        />
      </div>

      {/* Upcoming patient + analysis row */}
      <div className="grid gap-5 min-h-0 items-stretch xl:grid-cols-[1.4fr_1fr]">
        <section className="glass-card relative flex h-full overflow-hidden p-4">
          <div className="relative flex h-full w-full flex-col">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.26em] text-neon/70">
                  Upcoming Patient
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {nextWaitingPatient
                    ? nextWaitingPatient.name
                    : "No patient waiting"}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`chip ${nextWaitingPatient ? (nextWaiting?.status === "LATE" ? "chip-amber" : "chip-blue") : "chip-green"}`}
                >
                  {nextWaitingPatient
                    ? nextWaiting?.status.replace("_", " ")
                    : "Queue clear"}
                </span>
                <span
                  className={`chip ${nextWaitingPatient ? (nextWaitingPatient.allergies.length > 0 ? "chip-red" : nextWaitingPatient.chronicConditions.length > 0 ? "chip-amber" : "chip-green") : "chip-green"}`}
                >
                  {nextPatientRiskLabel}
                </span>
              </div>
            </div>

            {nextWaitingPatient && nextWaiting ? (
              <div className="flex flex-1 rounded-[26px] border border-wire/10 bg-[linear-gradient(180deg,rgba(8,25,41,0.94),rgba(6,20,33,0.9))] p-4">
                <div className="grid w-full gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[22px] border border-wire/8 bg-slate-950/24 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip border-wire/10 bg-slate-950/35 text-white">
                        Queue {nextWaiting.queueNumber}
                      </span>
                      <span className="chip chip-blue">{nextWaiting.mode}</span>
                      <span
                        className={
                          nextWaiting.arrivalStatus === "CHECKED_IN"
                            ? "chip chip-green"
                            : "chip chip-amber"
                        }
                      >
                        {nextWaiting.arrivalStatus === "CHECKED_IN"
                          ? "Checked in"
                          : "Not arrived"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-wire/8 bg-slate-950/25 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-mist">
                          Appointment
                        </div>
                        <div className="mt-2 text-sm font-medium text-white">
                          {nextWaiting?.appointmentTime || "—"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-wire/8 bg-slate-950/25 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-mist">
                          Visit Reason
                        </div>
                        <div className="mt-2 text-sm font-medium text-white">
                          {nextWaiting?.visitReason || "Consultation"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-wire/8 bg-slate-950/25 p-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-mist">
                          Patient
                        </div>
                        <div className="mt-2 text-sm font-medium text-white">
                          {nextWaitingPatient?.age ?? 0} years •{" "}
                          {nextWaitingPatient?.gender || "Other"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3 rounded-[22px] border border-wire/8 bg-slate-950/24 p-4">
                    <div className="rounded-2xl border border-wire/8 bg-slate-950/30 p-3">
                      <div className="text-xs uppercase tracking-[0.22em] text-mist">
                        Clinical cue
                      </div>
                      <p className="mt-2 text-sm leading-5 text-white/78">
                        {(nextWaitingPatient?.allergies || []).length > 0
                          ? `Allergy check: ${nextWaitingPatient?.allergies.join(", ")}`
                          : (nextWaitingPatient?.chronicConditions || []).length > 0
                            ? `History: ${nextWaitingPatient?.chronicConditions.join(", ")}`
                            : "No high-priority risk flag on record."}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectQueue(nextWaiting.id);
                          onSelectPatient(nextWaiting.patientId);
                        }}
                        className="ghost-btn gap-2"
                      >
                        Open Patient Context
                        <ArrowRight size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectQueue(nextWaiting.id);
                          onStartQueueAppointment(nextWaiting.id);
                        }}
                        className="action-btn gap-2"
                      >
                        Start Upcoming Session
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[262px] flex-1 items-center justify-center rounded-[26px] border border-dashed border-wire/10 bg-white/[0.02] p-6 text-center">
                <div>
                  <p className="text-lg font-semibold text-white">
                    No upcoming patient right now
                  </p>
                  <p className="mt-2 text-sm leading-5 text-mist">
                    This card updates as soon as the next patient enters the
                    waiting flow.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <AnalysisCard appointments={completedAppointments} />
      </div>

      <section className="glass-card p-5">
        <SectionHeader
          icon={<ShieldAlert size={18} />}
          title="Shift Signals"
          copy="Quick operational reads so the doctor can act before the queue or charting flow degrades."
        />

        <div className="space-y-3">
          <div className="rounded-[24px] border border-wire/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-mist">
                  Queue pressure
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {queuePressureLabel}
                </h3>
              </div>
              <span
                className={`chip ${waiting >= 6 ? "chip-red" : waiting >= 3 ? "chip-amber" : "chip-green"}`}
              >
                {waiting} waiting
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              {queuePressureCopy}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-wire/8 bg-slate-950/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-mist">
                Scannable patients
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-2xl font-semibold text-white">
                  {scanReadyCount}
                </div>
                <ScanLine size={16} className="text-neon" />
              </div>
            </div>
            <div className="rounded-3xl border border-wire/8 bg-slate-950/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-mist">
                Allergy flags
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-2xl font-semibold text-white">
                  {allergyFlagCount}
                </div>
                <AlertTriangle size={16} className="text-amber-300" />
              </div>
            </div>
            <div className="rounded-3xl border border-wire/8 bg-slate-950/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-mist">
                Chronic follow-ups
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-2xl font-semibold text-white">
                  {chronicFlagCount}
                </div>
                <HeartPulse size={16} className="text-sky" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width record access — only when a patient is open */}
      {selectedPatient && (
        <PatientRecordAccess
          patient={selectedPatient}
          onViewRecords={onViewRecords}
          onBuildEMR={onStartConsultation}
        />
      )}
    </div>
  );

  /* ── Generated slots for today (memoised; regenerates when schedule or duration changes) ── */
  // generateTodaySlots is called inline in the Settings slot preview (below).
  // QueuePanel builds its own windows directly from appointment times + queueBlockMinutes.

  /* ── Today's Queue ── */
  const queueView = (
    <div className="queue-view-enter h-full">
      <QueuePanel
        queue={queue}
        patients={patients}
        activeAppointmentId={activeAppointmentId}
        slotDuration={slotDuration}
        queueBlockMinutes={queueBlockDuration}
        onSelect={onSelectQueue}
        onStart={onStartQueueAppointment}
        onEnd={onEndQueueAppointment}
        onSkip={onSkipQueueAppointment}
        onNoShow={onMarkNoShow}
        onAddWalkIn={onAddWalkIn}
        onRefresh={onRefreshQueue}
      />
    </div>
  );

  /* ── Patient Search ── */
  const searchView = (
    <div className="grid h-full min-h-0 gap-5 xl:grid-cols-[0.82fr_1.18fr]">
      <PatientSearch
        query={searchQuery}
        patients={filteredPatients}
        selectedPatientId={selectedPatientId}
        viewRecordsPatientId={viewRecordsPatientId}
        onQueryChange={onSearchChange}
        onSelectPatient={onSelectPatient}
        onViewRecords={onViewRecords}
        onCloseRecords={onCloseRecords}
      />
      <div className="scroll-skin min-h-0 overflow-auto pr-1">
        <div className="space-y-5">
          <PatientProfile patient={selectedPatient} accessLevel={accessLevel} />
        </div>
      </div>
    </div>
  );

  /* ── Schedule ── */
  const scheduleView = (
    <div className="h-full">
      <ScheduleManager
        days={scheduleDays}
        vacationNote={vacationNote}
        lateStartDate={lateStartDate}
        lateStartTime={lateStartTime}
        onToggleOpen={onToggleDayOpen}
        onChange={onScheduleChange}
        onVacationNoteChange={onVacationNoteChange}
        onLateStartDateChange={onLateStartDateChange}
        onLateStartTimeChange={onLateStartTimeChange}
      />
    </div>
  );

  /* ── Analytics ── */
  const analyticsView = (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
      <PlaceholderBlock
        title="Analytics"
        copy="Throughput, no-show rate, and completion trends."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-wire/8 bg-slate-950/20 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-mist">
              Average consult
            </div>
            <div className="mt-3 text-3xl font-semibold text-neon">11 min</div>
          </div>
          <div className="rounded-3xl border border-wire/8 bg-slate-950/20 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-mist">
              No-show rate
            </div>
            <div className="mt-3 text-3xl font-semibold text-amber-200">6%</div>
          </div>
          <div className="rounded-3xl border border-wire/8 bg-slate-950/20 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-mist">
              EMRs saved
            </div>
            <div className="mt-3 text-3xl font-semibold text-sky">
              {completed}
            </div>
          </div>
        </div>
      </PlaceholderBlock>
      <PlaceholderBlock
        title="Operational Alerts"
        copy="Late arrivals, pending follow-ups, and slot-pressure hotspots."
      >
        <ul className="space-y-3">
          <li className="rounded-2xl border border-wire/8 bg-slate-950/25 p-4">
            2 late arrivals need front-desk follow-up.
          </li>
          <li className="rounded-2xl border border-wire/8 bg-slate-950/25 p-4">
            3 patients flagged for repeat BP review within 2 weeks.
          </li>
          <li className="rounded-2xl border border-wire/8 bg-slate-950/25 p-4">
            Morning queue is heavier than evening slots today.
          </li>
        </ul>
      </PlaceholderBlock>
    </div>
  );

  /* ── Settings ── */
  const settingsView = (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-5">
        <PlaceholderBlock
          title="Dashboard Settings"
          copy="Theme, layout density, and notification routing."
        >
          <div className="space-y-4">
            {/* Language picker */}
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">
                    {t("settings.language")}
                  </div>
                  <div className="mt-1 text-sm text-mist">
                    {t("settings.language_desc")}
                  </div>
                </div>
                <div className="doctor-theme-field min-w-[180px]">
                  <label className="doctor-theme-label" htmlFor="doctorLang">
                    Language
                  </label>
                  <select
                    id="doctorLang"
                    className="doctor-theme-select"
                    value={lang}
                    onChange={(e) => setLang(e.target.value as typeof lang)}
                  >
                    {LANGUAGES.map(({ code, native, name }) => (
                      <option key={code} value={code}>
                        {native} — {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">Templates</div>
                  <div className="mt-1 text-sm text-mist">
                    Jump to the saved prescription template cards from Settings
                    and reuse them during consults.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    settingsTemplatesRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                  className="ghost-btn min-w-[108px]"
                >
                  Templates
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">Theme mode</div>
                    <div className="mt-1 text-sm text-mist">
                      Choose a doctor console theme or fine-tune a custom color
                      profile.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="ghost-btn min-w-[92px]"
                  >
                    {darkMode ? "Dark" : "Light"}
                  </button>
                </div>

                <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">
                        Timeline Theme
                      </div>
                      <div className="mt-1 text-sm text-mist">
                        Make EMR v2 use the doctor dashboard’s deeper theme
                        tones for the main timeline surfaces.
                      </div>
                    </div>
                    <div className="doctor-theme-field min-w-[220px]">
                      <label
                        className="doctor-theme-label"
                        htmlFor="doctorTimelineTheme"
                      >
                        Timeline Mode
                      </label>
                      <select
                        id="doctorTimelineTheme"
                        className="doctor-theme-select"
                        value={timelineTheme}
                        onChange={(event) =>
                          onTimelineThemeChange(
                            event.target
                              .value as DashboardProps["timelineTheme"],
                          )
                        }
                      >
                        <option value="default">Default</option>
                        <option value="dashboard-dark">Dashboard Dark</option>
                        <option value="beige-light">Beige Light</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">
                        EMR Builder V2 Theme
                      </div>
                      <div className="mt-1 text-sm text-mist">
                        Choose which EMR v2 timeline theme the builder should
                        use by default.
                      </div>
                    </div>
                    <div className="doctor-theme-field min-w-[220px]">
                      <label
                        className="doctor-theme-label"
                        htmlFor="doctorEmrBuilderV2Theme"
                      >
                        Builder Mode
                      </label>
                      <select
                        id="doctorEmrBuilderV2Theme"
                        className="doctor-theme-select"
                        value={emrBuilderV2Theme}
                        onChange={(event) =>
                          onEmrBuilderV2ThemeChange(
                            event.target
                              .value as DashboardProps["emrBuilderV2Theme"],
                          )
                        }
                      >
                        <option value="default">Default</option>
                        <option value="dashboard-dark">Dashboard Dark</option>
                        <option value="beige-light">Beige Light</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* EMR Builder Layout — macOS-style appearance picker */}
                <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
                  <div className="font-medium text-white">
                    EMR Builder Layout
                  </div>
                  <div className="mt-1 mb-4 text-sm text-mist">
                    Choose your preferred layout for the EMR builder.
                  </div>
                  <div className="flex gap-5">
                    {/* ── Simple option ── */}
                    <button
                      type="button"
                      onClick={() => onEmrBuilderLayoutChange("simple")}
                      className={[
                        "group flex flex-col items-center gap-2.5 rounded-2xl border-2 p-2 transition-all duration-200 focus:outline-none",
                        emrBuilderLayout === "simple"
                          ? "border-neon/55 shadow-[0_0_18px_rgba(82,255,157,0.12)]"
                          : "border-wire/12 hover:border-neon/20",
                      ].join(" ")}
                    >
                      {/* Preview thumbnail */}
                      <div className="w-[152px] h-[96px] rounded-xl overflow-hidden border border-wire/15 bg-[#070c18] relative select-none">
                        <svg
                          viewBox="0 0 152 96"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full h-full"
                        >
                          {/* Page background */}
                          <rect width="152" height="96" fill="#070c18" />
                          {/* Faint page content behind sheet */}
                          <rect
                            x="8"
                            y="7"
                            width="55"
                            height="4"
                            rx="2"
                            fill="#1e293b"
                            opacity="0.7"
                          />
                          <rect
                            x="8"
                            y="14"
                            width="38"
                            height="3"
                            rx="1.5"
                            fill="#1e293b"
                            opacity="0.5"
                          />
                          <rect
                            x="8"
                            y="20"
                            width="48"
                            height="3"
                            rx="1.5"
                            fill="#1e293b"
                            opacity="0.4"
                          />
                          {/* Dim overlay */}
                          <rect
                            width="152"
                            height="96"
                            fill="#000000"
                            opacity="0.35"
                          />
                          {/* Bottom sheet */}
                          <rect
                            x="0"
                            y="24"
                            width="152"
                            height="72"
                            rx="11"
                            fill="#111827"
                          />
                          {/* Drag handle */}
                          <rect
                            x="65"
                            y="29"
                            width="22"
                            height="3"
                            rx="1.5"
                            fill="#ffffff22"
                          />
                          {/* Top bar divider */}
                          <rect
                            x="0"
                            y="35"
                            width="152"
                            height="0.75"
                            fill="#ffffff10"
                          />
                          {/* Section card 1 — Chief Complaint */}
                          <rect
                            x="8"
                            y="39"
                            width="136"
                            height="14"
                            rx="5"
                            fill="#ffffff08"
                            stroke="#ffffff0a"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="14"
                            y="43"
                            width="28"
                            height="2"
                            rx="1"
                            fill="#ffffff35"
                          />
                          <rect
                            x="14"
                            y="47"
                            width="60"
                            height="1.5"
                            rx="0.75"
                            fill="#ffffff18"
                          />
                          {/* Section card 2 — Diagnosis */}
                          <rect
                            x="8"
                            y="56"
                            width="136"
                            height="14"
                            rx="5"
                            fill="#ffffff08"
                            stroke="#ffffff0a"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="14"
                            y="60"
                            width="22"
                            height="2"
                            rx="1"
                            fill="#ffffff35"
                          />
                          <rect
                            x="14"
                            y="64"
                            width="45"
                            height="1.5"
                            rx="0.75"
                            fill="#ffffff18"
                          />
                          {/* Section card 3 — Vitals */}
                          <rect
                            x="8"
                            y="73"
                            width="136"
                            height="14"
                            rx="5"
                            fill="#ffffff08"
                            stroke="#ffffff0a"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="14"
                            y="77"
                            width="18"
                            height="2"
                            rx="1"
                            fill="#ffffff35"
                          />
                          {/* Vital pills */}
                          <rect
                            x="14"
                            y="81"
                            width="14"
                            height="3.5"
                            rx="1.75"
                            fill="#52ff9d18"
                            stroke="#52ff9d30"
                            strokeWidth="0.4"
                          />
                          <rect
                            x="31"
                            y="81"
                            width="14"
                            height="3.5"
                            rx="1.75"
                            fill="#52ff9d18"
                            stroke="#52ff9d30"
                            strokeWidth="0.4"
                          />
                          <rect
                            x="48"
                            y="81"
                            width="14"
                            height="3.5"
                            rx="1.75"
                            fill="#52ff9d18"
                            stroke="#52ff9d30"
                            strokeWidth="0.4"
                          />
                        </svg>
                      </div>
                      {/* Label */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className={[
                            "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                            emrBuilderLayout === "simple"
                              ? "border-neon bg-neon"
                              : "border-wire/30 bg-transparent",
                          ].join(" ")}
                        >
                          {emrBuilderLayout === "simple" && (
                            <Check
                              size={10}
                              className="text-black"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium ${emrBuilderLayout === "simple" ? "text-neon" : "text-mist group-hover:text-white/70"}`}
                        >
                          Simple
                        </span>
                      </div>
                    </button>

                    {/* ── Modern option ── */}
                    <button
                      type="button"
                      onClick={() => onEmrBuilderLayoutChange("modern")}
                      className={[
                        "group flex flex-col items-center gap-2.5 rounded-2xl border-2 p-2 transition-all duration-200 focus:outline-none",
                        emrBuilderLayout === "modern"
                          ? "border-neon/55 shadow-[0_0_18px_rgba(82,255,157,0.12)]"
                          : "border-wire/12 hover:border-neon/20",
                      ].join(" ")}
                    >
                      {/* Preview thumbnail */}
                      <div className="w-[152px] h-[96px] rounded-xl overflow-hidden border border-wire/15 bg-[#070c18] relative select-none">
                        <svg
                          viewBox="0 0 152 96"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full h-full"
                        >
                          {/* Background */}
                          <rect width="152" height="96" fill="#070c18" />
                          {/* Top action bar */}
                          <rect
                            x="0"
                            y="0"
                            width="152"
                            height="13"
                            fill="#111827"
                          />
                          <rect
                            x="0"
                            y="13"
                            width="152"
                            height="0.75"
                            fill="#ffffff10"
                          />
                          {/* Bar buttons */}
                          <rect
                            x="4"
                            y="3.5"
                            width="24"
                            height="6"
                            rx="3"
                            fill="#52ff9d22"
                            stroke="#52ff9d45"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="31"
                            y="3.5"
                            width="13"
                            height="6"
                            rx="3"
                            fill="#ffffff0a"
                          />
                          <rect
                            x="47"
                            y="3.5"
                            width="13"
                            height="6"
                            rx="3"
                            fill="#ffffff0a"
                          />
                          <rect
                            x="100"
                            y="3.5"
                            width="13"
                            height="6"
                            rx="3"
                            fill="#ffffff0a"
                          />
                          <rect
                            x="116"
                            y="3.5"
                            width="13"
                            height="6"
                            rx="3"
                            fill="#ffffff0a"
                          />
                          <rect
                            x="132"
                            y="3.5"
                            width="16"
                            height="6"
                            rx="3"
                            fill="#52ff9d28"
                            stroke="#52ff9d50"
                            strokeWidth="0.5"
                          />
                          {/* Vertical divider */}
                          <rect
                            x="50"
                            y="14"
                            width="0.75"
                            height="82"
                            fill="#ffffff0e"
                          />
                          {/* ── Left column panels ── */}
                          {/* Patient strip */}
                          <rect
                            x="3"
                            y="17"
                            width="43"
                            height="7"
                            rx="3.5"
                            fill="#ffffff07"
                            stroke="#ffffff10"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="7"
                            y="20"
                            width="16"
                            height="2"
                            rx="1"
                            fill="#ffffff40"
                          />
                          {/* Chief Complaint panel */}
                          <rect
                            x="3"
                            y="27"
                            width="43"
                            height="14"
                            rx="3.5"
                            fill="#ffffff06"
                            stroke="#ffffff0d"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="7"
                            y="30"
                            width="22"
                            height="1.5"
                            rx="0.75"
                            fill="#ffffff28"
                          />
                          <rect
                            x="7"
                            y="33.5"
                            width="35"
                            height="4.5"
                            rx="2"
                            fill="#ffffff07"
                          />
                          {/* Diagnosis panel */}
                          <rect
                            x="3"
                            y="44"
                            width="43"
                            height="18"
                            rx="3.5"
                            fill="#ffffff06"
                            stroke="#ffffff0d"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="7"
                            y="47"
                            width="18"
                            height="1.5"
                            rx="0.75"
                            fill="#ffffff28"
                          />
                          {/* Severity pills */}
                          <rect
                            x="7"
                            y="51"
                            width="9"
                            height="4"
                            rx="2"
                            fill="#52ff9d12"
                            stroke="#52ff9d30"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="18"
                            y="51"
                            width="9"
                            height="4"
                            rx="2"
                            fill="#52ff9d30"
                            stroke="#52ff9d60"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="29"
                            y="51"
                            width="9"
                            height="4"
                            rx="2"
                            fill="#ffffff08"
                            stroke="#ffffff15"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="7"
                            y="57"
                            width="35"
                            height="3.5"
                            rx="1.75"
                            fill="#ffffff07"
                          />
                          {/* AI Assist panel */}
                          <rect
                            x="3"
                            y="65"
                            width="43"
                            height="28"
                            rx="3.5"
                            fill="#ffffff06"
                            stroke="#ffffff0d"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="7"
                            y="68"
                            width="16"
                            height="1.5"
                            rx="0.75"
                            fill="#ffffff28"
                          />
                          <rect
                            x="7"
                            y="72"
                            width="35"
                            height="18"
                            rx="2.5"
                            fill="#ffffff05"
                          />
                          {/* ── Right column panels ── */}
                          {/* Vitals */}
                          <rect
                            x="54"
                            y="17"
                            width="94"
                            height="11"
                            rx="3.5"
                            fill="#ffffff06"
                            stroke="#ffffff0d"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="58"
                            y="20"
                            width="12"
                            height="5"
                            rx="2.5"
                            fill="#52ff9d15"
                            stroke="#52ff9d25"
                            strokeWidth="0.4"
                          />
                          <rect
                            x="73"
                            y="20"
                            width="12"
                            height="5"
                            rx="2.5"
                            fill="#52ff9d15"
                            stroke="#52ff9d25"
                            strokeWidth="0.4"
                          />
                          <rect
                            x="88"
                            y="20"
                            width="12"
                            height="5"
                            rx="2.5"
                            fill="#52ff9d15"
                            stroke="#52ff9d25"
                            strokeWidth="0.4"
                          />
                          <rect
                            x="103"
                            y="20"
                            width="12"
                            height="5"
                            rx="2.5"
                            fill="#52ff9d15"
                            stroke="#52ff9d25"
                            strokeWidth="0.4"
                          />
                          <rect
                            x="118"
                            y="20"
                            width="12"
                            height="5"
                            rx="2.5"
                            fill="#52ff9d15"
                            stroke="#52ff9d25"
                            strokeWidth="0.4"
                          />
                          {/* Prescription */}
                          <rect
                            x="54"
                            y="31"
                            width="94"
                            height="34"
                            rx="3.5"
                            fill="#ffffff06"
                            stroke="#ffffff0d"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="58"
                            y="34"
                            width="30"
                            height="1.5"
                            rx="0.75"
                            fill="#ffffff28"
                          />
                          {/* Rx rows */}
                          <rect
                            x="58"
                            y="38.5"
                            width="86"
                            height="5"
                            rx="2"
                            fill="#ffffff06"
                          />
                          <rect
                            x="58"
                            y="45.5"
                            width="86"
                            height="5"
                            rx="2"
                            fill="#ffffff06"
                          />
                          <rect
                            x="58"
                            y="52.5"
                            width="65"
                            height="5"
                            rx="2"
                            fill="#ffffff06"
                          />
                          {/* Lab Reports */}
                          <rect
                            x="54"
                            y="68"
                            width="94"
                            height="25"
                            rx="3.5"
                            fill="#ffffff06"
                            stroke="#ffffff0d"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="58"
                            y="71"
                            width="24"
                            height="1.5"
                            rx="0.75"
                            fill="#ffffff28"
                          />
                          <rect
                            x="58"
                            y="75"
                            width="86"
                            height="7"
                            rx="3"
                            fill="#ffffff07"
                            stroke="#ffffff0d"
                            strokeWidth="0.5"
                          />
                          <rect
                            x="58"
                            y="84"
                            width="86"
                            height="7"
                            rx="3"
                            fill="#ffffff05"
                            stroke="#ffffff08"
                            strokeWidth="0.5"
                          />
                        </svg>
                      </div>
                      {/* Label */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className={[
                            "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                            emrBuilderLayout === "modern"
                              ? "border-neon bg-neon"
                              : "border-wire/30 bg-transparent",
                          ].join(" ")}
                        >
                          {emrBuilderLayout === "modern" && (
                            <Check
                              size={10}
                              className="text-black"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium ${emrBuilderLayout === "modern" ? "text-neon" : "text-mist group-hover:text-white/70"}`}
                        >
                          Modern
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Timeline Layout — visual picker */}
                <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
                  <div className="font-medium text-white">Timeline Style</div>
                  <div className="mt-1 mb-4 text-sm text-mist">
                    Choose which timeline view opens when you navigate to a patient's EMR record.
                  </div>
                  <div className="flex gap-5">

                    {/* ── Simple option ── */}
                    <button
                      type="button"
                      onClick={() => onTimelineLayoutChange("simple")}
                      className={[
                        "group flex flex-col items-center gap-2.5 rounded-2xl border-2 p-2 transition-all duration-200 focus:outline-none",
                        timelineLayout === "simple"
                          ? "border-neon/55 shadow-[0_0_18px_rgba(82,255,157,0.12)]"
                          : "border-wire/12 hover:border-neon/20",
                      ].join(" ")}
                    >
                      {/* Preview — dark vertical card list */}
                      <div className="w-[152px] h-[96px] rounded-xl overflow-hidden border border-wire/15 bg-[#070c18] relative select-none">
                        <svg viewBox="0 0 152 96" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                          <rect width="152" height="96" fill="#070c18" />
                          {/* Top bar */}
                          <rect x="0" y="0" width="152" height="11" fill="#0d1520" />
                          <rect x="0" y="11" width="152" height="0.6" fill="#ffffff0d" />
                          <rect x="5" y="3" width="30" height="5" rx="2.5" fill="#52ff9d22" stroke="#52ff9d45" strokeWidth="0.5" />
                          <rect x="118" y="3" width="28" height="5" rx="2.5" fill="#52ff9d28" stroke="#52ff9d50" strokeWidth="0.5" />
                          {/* Vertical timeline line */}
                          <rect x="21" y="14" width="1" height="80" fill="#ffffff0e" />
                          {/* Card 1 */}
                          <circle cx="21.5" cy="22" r="3" fill="#52ff9d" />
                          <rect x="29" y="15" width="116" height="14" rx="4" fill="#ffffff07" stroke="#ffffff0d" strokeWidth="0.5" />
                          <rect x="34" y="18" width="40" height="2" rx="1" fill="#ffffff40" />
                          <rect x="34" y="22.5" width="60" height="1.5" rx="0.75" fill="#ffffff20" />
                          <rect x="126" y="18" width="14" height="4" rx="2" fill="#52ff9d15" stroke="#52ff9d35" strokeWidth="0.4" />
                          {/* Card 2 */}
                          <circle cx="21.5" cy="40" r="3" fill="#83d4ff" />
                          <rect x="29" y="33" width="116" height="14" rx="4" fill="#ffffff07" stroke="#ffffff0d" strokeWidth="0.5" />
                          <rect x="34" y="36" width="32" height="2" rx="1" fill="#ffffff40" />
                          <rect x="34" y="40.5" width="52" height="1.5" rx="0.75" fill="#ffffff20" />
                          <rect x="126" y="36" width="14" height="4" rx="2" fill="#ffffff0a" stroke="#ffffff18" strokeWidth="0.4" />
                          {/* Card 3 */}
                          <circle cx="21.5" cy="58" r="3" fill="#52ff9d80" />
                          <rect x="29" y="51" width="116" height="14" rx="4" fill="#ffffff07" stroke="#ffffff0d" strokeWidth="0.5" />
                          <rect x="34" y="54" width="48" height="2" rx="1" fill="#ffffff40" />
                          <rect x="34" y="58.5" width="70" height="1.5" rx="0.75" fill="#ffffff20" />
                          <rect x="126" y="54" width="14" height="4" rx="2" fill="#52ff9d15" stroke="#52ff9d35" strokeWidth="0.4" />
                          {/* Card 4 (partial) */}
                          <circle cx="21.5" cy="76" r="3" fill="#ffffff30" />
                          <rect x="29" y="69" width="116" height="14" rx="4" fill="#ffffff05" stroke="#ffffff08" strokeWidth="0.5" />
                          <rect x="34" y="72" width="36" height="2" rx="1" fill="#ffffff25" />
                          <rect x="34" y="76.5" width="55" height="1.5" rx="0.75" fill="#ffffff12" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={["flex h-4 w-4 items-center justify-center rounded-full border transition-all", timelineLayout === "simple" ? "border-neon bg-neon" : "border-wire/30 bg-transparent"].join(" ")}>
                          {timelineLayout === "simple" && <Check size={10} className="text-black" strokeWidth={3} />}
                        </div>
                        <span className={`text-xs font-medium ${timelineLayout === "simple" ? "text-neon" : "text-mist group-hover:text-white/70"}`}>Simple</span>
                      </div>
                    </button>

                    {/* ── Advanced option ── */}
                    <button
                      type="button"
                      onClick={() => onTimelineLayoutChange("advanced")}
                      className={[
                        "group flex flex-col items-center gap-2.5 rounded-2xl border-2 p-2 transition-all duration-200 focus:outline-none",
                        timelineLayout === "advanced"
                          ? "border-neon/55 shadow-[0_0_18px_rgba(82,255,157,0.12)]"
                          : "border-wire/12 hover:border-neon/20",
                      ].join(" ")}
                    >
                      {/* Preview — light beige horizontal node graph */}
                      <div className="w-[152px] h-[96px] rounded-xl overflow-hidden border border-wire/15 bg-[#F5F5F3] relative select-none">
                        <svg viewBox="0 0 152 96" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                          <rect width="152" height="96" fill="#F5F5F3" />
                          {/* Subtle bg particle dots */}
                          <circle cx="18" cy="14" r="2" fill="#67E8F9" opacity="0.25" />
                          <circle cx="90" cy="82" r="3" fill="#E7F36E" opacity="0.2" />
                          <circle cx="138" cy="22" r="2.5" fill="#A78BFA" opacity="0.2" />
                          {/* Center horizontal timeline axis */}
                          <rect x="8" y="47" width="136" height="1.5" rx="0.75" fill="rgba(103,232,249,0.62)" />
                          {/* Node 1 — leftmost */}
                          <circle cx="24" cy="47.75" r="6" fill="#164e63" />
                          <circle cx="24" cy="47.75" r="3.5" fill="#67E8F9" />
                          {/* Card cluster above node 1 */}
                          <rect x="8" y="18" width="34" height="22" rx="4" fill="white" opacity="0.9" />
                          <rect x="13" y="22" width="18" height="2" rx="1" fill="#164e63" opacity="0.6" />
                          <rect x="13" y="26.5" width="22" height="1.5" rx="0.75" fill="#164e63" opacity="0.25" />
                          <rect x="13" y="29.5" width="16" height="1.5" rx="0.75" fill="#164e63" opacity="0.2" />
                          <rect x="13" y="33" width="20" height="3" rx="1.5" fill="#67E8F9" opacity="0.4" />
                          {/* Connector line node1 to card */}
                          <line x1="24" y1="41.75" x2="24" y2="40" stroke="#164e63" strokeWidth="0.8" strokeDasharray="2,1.5" opacity="0.35" />
                          {/* Node 2 */}
                          <circle cx="60" cy="47.75" r="6" fill="#164e63" />
                          <circle cx="60" cy="47.75" r="3.5" fill="#E7F36E" />
                          {/* Card cluster below node 2 */}
                          <rect x="44" y="58" width="34" height="22" rx="4" fill="white" opacity="0.9" />
                          <rect x="49" y="62" width="20" height="2" rx="1" fill="#164e63" opacity="0.6" />
                          <rect x="49" y="66.5" width="24" height="1.5" rx="0.75" fill="#164e63" opacity="0.25" />
                          <rect x="49" y="69.5" width="18" height="1.5" rx="0.75" fill="#164e63" opacity="0.2" />
                          <rect x="49" y="73" width="22" height="3" rx="1.5" fill="#E7F36E" opacity="0.5" />
                          {/* Connector node2 to card */}
                          <line x1="60" y1="53.75" x2="60" y2="58" stroke="#164e63" strokeWidth="0.8" strokeDasharray="2,1.5" opacity="0.35" />
                          {/* Node 3 */}
                          <circle cx="100" cy="47.75" r="6" fill="#164e63" />
                          <circle cx="100" cy="47.75" r="3.5" fill="#6EE7B7" />
                          {/* Card cluster above node 3 */}
                          <rect x="82" y="16" width="36" height="24" rx="4" fill="white" opacity="0.9" />
                          <rect x="87" y="20" width="22" height="2" rx="1" fill="#164e63" opacity="0.6" />
                          <rect x="87" y="24.5" width="26" height="1.5" rx="0.75" fill="#164e63" opacity="0.25" />
                          <rect x="87" y="27.5" width="18" height="1.5" rx="0.75" fill="#164e63" opacity="0.2" />
                          <rect x="87" y="31" width="10" height="3" rx="1.5" fill="#6EE7B7" opacity="0.6" />
                          <rect x="99" y="31" width="14" height="3" rx="1.5" fill="#6EE7B7" opacity="0.35" />
                          {/* Connector node3 to card */}
                          <line x1="100" y1="41.75" x2="100" y2="40" stroke="#164e63" strokeWidth="0.8" strokeDasharray="2,1.5" opacity="0.35" />
                          {/* Node 4 — rightmost */}
                          <circle cx="136" cy="47.75" r="5" fill="#164e63" opacity="0.5" />
                          <circle cx="136" cy="47.75" r="2.5" fill="#C8C8C4" />
                          {/* Connecting lines between nodes on axis */}
                          <rect x="30" y="47.25" width="24" height="1" fill="#C8C8C4" opacity="0.6" />
                          <rect x="66" y="47.25" width="28" height="1" fill="#C8C8C4" opacity="0.6" />
                          <rect x="106" y="47.25" width="24" height="1" fill="#C8C8C4" opacity="0.6" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={["flex h-4 w-4 items-center justify-center rounded-full border transition-all", timelineLayout === "advanced" ? "border-neon bg-neon" : "border-wire/30 bg-transparent"].join(" ")}>
                          {timelineLayout === "advanced" && <Check size={10} className="text-black" strokeWidth={3} />}
                        </div>
                        <span className={`text-xs font-medium ${timelineLayout === "advanced" ? "text-neon" : "text-mist group-hover:text-white/70"}`}>Advanced</span>
                      </div>
                    </button>

                  </div>
                </div>

                <div className="doctor-theme-field">
                  <label
                    className="doctor-theme-label"
                    htmlFor="doctorThemeMode"
                  >
                    Select Theme
                  </label>
                  <select
                    id="doctorThemeMode"
                    className="doctor-theme-select"
                    value={themeMode}
                    onChange={(event) =>
                      onThemeModeChange(
                        event.target.value as DashboardProps["themeMode"],
                      )
                    }
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="super-dark">Super Dark</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="violet">Violet</option>
                    <option value="yellow">Yellow</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div
                  className={`doctor-theme-custom ${themeMode === "custom" ? "" : "hidden"}`}
                >
                  <div className="doctor-theme-custom-header">
                    <div>
                      <div className="font-medium text-white">
                        Custom console accent
                      </div>
                      <div className="mt-1 text-sm text-mist">
                        Shape the dashboard color and brightness to your working
                        preference.
                      </div>
                    </div>
                    <span
                      className="doctor-theme-preview"
                      style={{
                        background: `linear-gradient(135deg, hsl(${customTheme.hue} 92% ${Math.min(Math.max(56 + (customTheme.brightness - 100) * 0.18, 44), 72)}%), hsl(${(customTheme.hue + 38) % 360} 86% ${Math.min(Math.max(48 + (customTheme.brightness - 100) * 0.14, 40), 66)}%))`,
                      }}
                    />
                  </div>

                  <label
                    className="doctor-theme-slider-row"
                    htmlFor="doctorThemeHue"
                  >
                    <span className="doctor-theme-slider-meta">
                      <span>RGB Tone</span>
                      <strong>{customTheme.hue}</strong>
                    </span>
                    <input
                      id="doctorThemeHue"
                      className="doctor-theme-slider doctor-theme-slider-hue"
                      type="range"
                      min="0"
                      max="360"
                      value={customTheme.hue}
                      onChange={(event) =>
                        onCustomThemeChange({
                          ...customTheme,
                          hue: Number(event.target.value),
                        })
                      }
                    />
                  </label>

                  <label
                    className="doctor-theme-slider-row"
                    htmlFor="doctorThemeBrightness"
                  >
                    <span className="doctor-theme-slider-meta">
                      <span>Brightness</span>
                      <strong>{customTheme.brightness}%</strong>
                    </span>
                    <input
                      id="doctorThemeBrightness"
                      className="doctor-theme-slider"
                      type="range"
                      min="70"
                      max="135"
                      value={customTheme.brightness}
                      onChange={(event) =>
                        onCustomThemeChange({
                          ...customTheme,
                          brightness: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">
                    Contractible console
                  </div>
                  <div className="mt-1 text-sm text-mist">
                    Enable an expandable doctor console that can collapse into a
                    compact rail.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleConsoleCollapsible}
                  className={`ghost-btn min-w-[92px] ${consoleCollapsible ? "!border-neon/35 !bg-neon/[0.12] !text-neon" : ""}`}
                >
                  {consoleCollapsible ? "On" : "Off"}
                </button>
              </div>
            </div>
            <div
              className={`rounded-2xl border border-wire/8 bg-slate-950/20 p-4 transition-[opacity,max-height,transform] duration-300 ease-out ${consoleCollapsible ? "max-h-64 opacity-100" : "pointer-events-none max-h-0 -translate-y-2 overflow-hidden border-transparent p-0 opacity-0"}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">Console state</div>
                    <div className="mt-1 text-sm text-mist">
                      Collapse or expand the left MEIOSIS doctor console with a
                      fluid layout adjustment.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleConsoleCollapsed}
                    className={`ghost-btn min-w-[110px] ${consoleCollapsed ? "!border-sky/30 !bg-sky/10 !text-sky" : ""}`}
                  >
                    {consoleCollapsed ? "Expand" : "Collapse"}
                  </button>
                </div>
                <label
                  className="doctor-theme-slider-row"
                  htmlFor="doctorConsoleWidth"
                >
                  <span className="doctor-theme-slider-meta">
                    <span>Console width</span>
                    <strong>{consoleWidth}px</strong>
                  </span>
                  <input
                    id="doctorConsoleWidth"
                    className="doctor-theme-slider"
                    type="range"
                    min="260"
                    max="380"
                    step="2"
                    value={consoleWidth}
                    onChange={(event) =>
                      onConsoleWidthChange(Number(event.target.value))
                    }
                  />
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
              <div className="font-medium text-white">Notification routing</div>
              <div className="mt-1 text-sm text-mist">
                Critical lab callbacks, high-risk allergies, and appointment
                overruns.
              </div>
            </div>
          </div>
        </PlaceholderBlock>

        {/* Appointment Scheduling */}
        <section className="glass-card p-5">
          <SectionHeader
            icon={<Clock3 size={18} />}
            title="Appointment Scheduling"
            copy="Drag the sliders to set how long you spend per patient and how large each queue block is. Slots are generated live from your clinic hours."
          />
          <div className="space-y-5">
            {/* ── Slider 1: Time per patient ────────────────────────────── */}
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">Time per patient</div>
                  <div className="mt-0.5 text-sm text-mist">
                    Each appointment slot is this long. Clinic hours ÷ this
                    value = total slots.
                  </div>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-3xl font-bold tabular-nums text-neon">
                    {slotDuration}
                  </span>
                  <span className="text-sm text-mist">min</span>
                </div>
              </div>

              {/* Slider track */}
              <div className="relative">
                <input
                  type="range"
                  min={4}
                  max={20}
                  step={1}
                  value={Math.min(Math.max(slotDuration, 4), 20)}
                  onChange={(e) => onSlotDurationChange(Number(e.target.value))}
                  className="scheduling-slider w-full"
                  aria-label="Time per patient in minutes"
                  title="Time per patient"
                  style={
                    {
                      "--pct": `${((Math.min(Math.max(slotDuration, 4), 20) - 4) / (20 - 4)) * 100}%`,
                    } as React.CSSProperties
                  }
                />
                <div className="mt-2 flex justify-between text-[10px] text-mist/50 tabular-nums">
                  {[4, 8, 12, 16, 20].map((v) => (
                    <span key={v}>{v}m</span>
                  ))}
                </div>
              </div>

              {/* Custom time input */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-mist">Custom:</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={slotDuration}
                  onChange={(e) => {
                    const v = Math.max(
                      1,
                      Math.min(120, Number(e.target.value) || 1),
                    );
                    onSlotDurationChange(v);
                  }}
                  aria-label="Custom time per patient in minutes"
                  title="Custom time per patient"
                  placeholder="min"
                  className="input-shell w-20 text-center text-sm tabular-nums"
                />
                <span className="text-xs text-mist">
                  min &nbsp;(1–120 for custom)
                </span>
              </div>

              {/* Derived stat + Apply button */}
              {(() => {
                const { slots } = generateTodaySlots(
                  scheduleDays,
                  slotDuration,
                  queueBlockDuration,
                );
                return (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    {slots.length > 0 ? (
                      <p className="text-xs text-mist/70">
                        →{" "}
                        <span className="font-semibold text-white">
                          {slots.length} slots
                        </span>{" "}
                        generated for today's clinic hours
                      </p>
                    ) : (
                      <p className="text-xs text-mist/50 italic">
                        No clinic hours for today
                      </p>
                    )}
                    <ApplyScheduleButton onSync={onSyncSchedule} />
                  </div>
                );
              })()}
            </div>

            {/* ── Slider 2: Queue block size ────────────────────────────── */}
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">
                    Queue block duration
                  </div>
                  <div className="mt-0.5 text-sm text-mist">
                    Consecutive slots are grouped into blocks of this length in
                    the queue panel.
                  </div>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-3xl font-bold tabular-nums text-sky">
                    {queueBlockDuration >= 60
                      ? `${queueBlockDuration / 60}`
                      : queueBlockDuration}
                  </span>
                  <span className="text-sm text-mist">
                    {queueBlockDuration >= 60 ? "hr" : "min"}
                  </span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min={30}
                  max={240}
                  step={30}
                  value={queueBlockDuration}
                  onChange={(e) =>
                    onQueueBlockDurationChange(Number(e.target.value))
                  }
                  className="scheduling-slider scheduling-slider--sky w-full"
                  aria-label="Queue block duration in minutes"
                  title="Queue block duration"
                  style={
                    {
                      "--pct": `${((queueBlockDuration - 30) / (240 - 30)) * 100}%`,
                    } as React.CSSProperties
                  }
                />
                <div className="mt-2 flex justify-between text-[10px] text-mist/50 tabular-nums">
                  {["30m", "1h", "1.5h", "2h", "3h", "4h"].map((v) => (
                    <span key={v}>{v}</span>
                  ))}
                </div>
              </div>

              {/* Derived stat */}
              {(() => {
                const { blocks } = generateTodaySlots(
                  scheduleDays,
                  slotDuration,
                  queueBlockDuration,
                );
                const slotsPerBlock = blocks[0]?.slots.length ?? 0;
                return blocks.length > 0 ? (
                  <p className="mt-3 text-xs text-mist/70">
                    →{" "}
                    <span className="font-semibold text-white">
                      {blocks.length} queue block
                      {blocks.length !== 1 ? "s" : ""}
                    </span>
                    {slotsPerBlock > 0 && (
                      <>
                        , ~
                        <span className="font-semibold text-white">
                          {slotsPerBlock} patients
                        </span>{" "}
                        per block
                      </>
                    )}
                  </p>
                ) : null;
              })()}
            </div>

            {/* ── Follow-up gap ──────────────────────────────────────────── */}
            <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">
                    Default follow-up gap
                  </div>
                  <div className="mt-0.5 text-sm text-mist">
                    EMR Builder auto-fills the follow-up date to today + this
                    many days.
                  </div>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-3xl font-bold tabular-nums text-neon">
                    {followUpGapDays}
                  </span>
                  <span className="text-sm text-mist">
                    day{followUpGapDays !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={followUpGapDays}
                  onChange={(e) => {
                    const v = Math.max(
                      1,
                      Math.min(365, Number(e.target.value) || 1),
                    );
                    onFollowUpGapDaysChange(v);
                  }}
                  aria-label="Follow-up gap in days"
                  className="input-shell w-24 text-center text-sm tabular-nums"
                />
                <span className="text-xs text-mist">days &nbsp;(1–365)</span>
              </div>
              <p className="mt-3 text-xs text-mist/70">
                → Follow-up will default to{" "}
                <span className="font-semibold text-white">
                  {new Date(
                    Date.now() + followUpGapDays * 86400000,
                  ).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>

            {/* ── Live slot preview ──────────────────────────────────────── */}
            {(() => {
              const { slots, blocks } = generateTodaySlots(
                scheduleDays,
                slotDuration,
                queueBlockDuration,
              );
              if (slots.length === 0) {
                return (
                  <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
                    <div className="text-sm text-mist italic">
                      No clinic hours scheduled for today — set your schedule
                      above.
                    </div>
                  </div>
                );
              }
              return (
                <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-white">
                      Today's slot preview
                    </div>
                    <span className="chip border-wire/10 bg-white/[0.04] text-white/70">
                      {slots.length} slots · {blocks.length} block
                      {blocks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className="rounded-xl border border-wire/8 bg-slate-950/30 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-widest text-neon/70">
                            {block.title}
                          </span>
                          <span className="text-xs text-mist">
                            {block.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {block.slots.map((slot) => (
                            <span
                              key={slot.id}
                              className="rounded-xl border border-wire/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/75"
                            >
                              {slot.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* Account / Logout */}
        <section className="glass-card p-5">
          <SectionHeader
            icon={<LogOut size={18} />}
            title="Account"
            copy="Manage your session and access."
          />
          <div className="rounded-2xl border border-wire/8 bg-slate-950/20 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon/30 to-sky/20 text-sm font-bold text-white">
                {doctorName
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white">{doctorName}</div>
                <div className="text-xs text-mist">
                  Doctor · MEIOSIS Console
                </div>
              </div>
            </div>
            <p className="mb-4 text-sm text-mist/75">
              Signed in as{" "}
              <span className="font-medium text-white">{doctorName}</span>.
              Logging out will clear your local session.
            </p>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition duration-200 hover:border-red-400/50 hover:bg-red-400/20 hover:scale-[1.02]"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </section>
      </div>

      <div ref={settingsTemplatesRef}>
        <PlaceholderBlock
          title="Template Controls"
          copy="Saved templates remain local on this device and stay ready for future prescriptions."
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm text-mist">
              Create a new template from the active prescription draft, or
              review the ones already saved.
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setTemplateDeleteMode((current) => !current);
                  setSelectedTemplateIds([]);
                }}
                className={`ghost-btn min-w-[124px] ${templateDeleteMode ? "!border-red-400/35 !bg-red-400/10 !text-red-300" : ""}`}
              >
                {templateDeleteMode ? "Cancel Delete" : "Delete Templates"}
              </button>
              <button
                type="button"
                onClick={onSaveTemplate}
                className="ghost-btn min-w-[132px]"
              >
                Create Template
              </button>
            </div>
          </div>
          {templateDeleteMode && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/18 bg-red-400/5 px-4 py-3">
              <div className="text-sm text-red-200/85">
                Choose the saved templates you want to remove, then confirm
                deletion.
              </div>
              <button
                type="button"
                disabled={!selectedTemplateIds.length}
                onClick={() => {
                  onDeleteTemplates(selectedTemplateIds);
                  setSelectedTemplateIds([]);
                  setTemplateDeleteMode(false);
                }}
                className={`ghost-btn min-w-[132px] ${selectedTemplateIds.length ? "!border-red-400/35 !bg-red-400/12 !text-red-300" : "cursor-not-allowed opacity-50"}`}
              >
                Delete Selected
              </button>
            </div>
          )}
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`rounded-2xl border bg-slate-950/20 p-4 transition ${
                  selectedTemplateIds.includes(template.id)
                    ? "border-red-400/30 shadow-[0_10px_26px_rgba(248,113,113,0.12)]"
                    : "border-wire/8"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">
                      {template.name}
                    </div>
                    <div className="mt-2 text-sm text-mist">
                      {template.rows.length} medicine rows ·{" "}
                      {template.diagnosis}
                    </div>
                  </div>
                  {templateDeleteMode && (
                    <label className="flex items-center gap-2 text-sm text-mist">
                      <input
                        type="checkbox"
                        checked={selectedTemplateIds.includes(template.id)}
                        onChange={(event) => {
                          setSelectedTemplateIds((current) =>
                            event.target.checked
                              ? [...current, template.id]
                              : current.filter((id) => id !== template.id),
                          );
                        }}
                      />
                      Select
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* New PDF Template Section */}
          <div className="mt-8 border-t border-wire/10 pt-8" id="settings-pdf-templates">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText size={20} className="text-neon" />
                Prescription PDF Templates
              </h3>
              <p className="mt-1 text-sm text-mist/60 leading-relaxed max-w-2xl">
                Upload your own clinical letterhead or use our visual builder to create a professional prescription template. 
                All templates are validated to ensure they contain required placeholders like patient name and medication table.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {/* Build Button Card */}
              <button 
                onClick={() => onNavChange('template-builder')}
                className="group relative flex flex-col items-center justify-center p-6 rounded-[32px] border border-wire/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all hover:border-neon/30"
              >
                <div className="w-12 h-12 rounded-full bg-neon/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles size={24} className="text-neon" />
                </div>
                <h4 className="text-sm font-semibold text-white">Visual Builder</h4>
                <p className="mt-1 text-xs text-mist/50 text-center">Figma-style drag-and-drop editor</p>
                <div className="absolute top-4 right-4 text-[10px] font-bold text-neon/40 uppercase tracking-widest">Recommended</div>
              </button>

              {/* Upload Button Card */}
              <label 
                className="group relative flex flex-col items-center justify-center p-6 rounded-[32px] border border-wire/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all hover:border-neon/30 cursor-pointer"
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('template', file);
                    
                    try {
                      const res = await fetch(apiUrl(`/doctors/${CURRENT_DOCTOR.id}/pdf-template/upload`), {
                        method: 'POST',
                        headers: { 
                          ...getAuthHeader()
                        },
                        body: formData
                      });
                      const data = await res.json();
                      
                      if (data.valid) {
                        const newTpl: PdfTemplate = {
                          id: `upl_${Date.now()}`,
                          name: file.name.replace('.pdf', ''),
                          isActive: false,
                          type: 'uploaded',
                          fields: data.found,
                          htmlTemplate: '<!-- UPLOADED_PDF_PLACEHOLDER -->', // Handle via backend
                          uploadedAt: new Date().toISOString()
                        };
                        const updated = [...pdfTemplates, newTpl];
                        onPdfTemplatesChange(updated);
                        showToast(true, "Template uploaded and validated. Generated prescription PDFs will use the active Visual Builder template.");
                      } else {
                        showToast(false, `Missing fields: ${data.missing.join(', ')}`);
                      }
                    } catch (err) {
                      showToast(false, "Failed to upload template.");
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-mist/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileUp size={24} className="text-mist" />
                </div>
                <h4 className="text-sm font-semibold text-white">Upload PDF</h4>
                <p className="mt-1 text-xs text-mist/50 text-center">Scan your existing clinical layout</p>
              </label>

              {/* Active Info Card */}
              {activePdfTemplate ? (
                <div className="p-6 rounded-[32px] border border-neon/20 bg-neon/[0.03] flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-neon/20 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-neon" />
                    </div>
                    <span className="text-[10px] font-bold text-neon uppercase tracking-tighter bg-neon/10 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{activePdfTemplate.name}</h4>
                  <p className="mt-1 text-xs text-mist/50">
                    Created via Visual Builder
                  </p>
                  <div className="mt-auto pt-4 flex items-center gap-2">
                    <button className="text-[10px] text-neon hover:underline font-bold uppercase tracking-wider">Preview</button>
                    <div className="w-1 h-1 rounded-full bg-mist/20" />
                    <button 
                      onClick={() => {
                        const updated = pdfTemplates.map((t: PdfTemplate) => ({ ...t, isActive: false }));
                        onPdfTemplatesChange(updated);
                      }}
                      className="text-[10px] text-mist/50 hover:text-red-400 font-bold uppercase tracking-wider transition-colors"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-[32px] border border-wire/10 bg-white/[0.01] flex flex-col items-center justify-center border-dashed">
                  <p className="text-xs text-mist/30 italic text-center px-4">No custom template active. Using default Meiosis layout.</p>
                  {pdfTemplates.some((template: PdfTemplate) => template.type === "uploaded") && (
                    <p className="mt-2 text-[11px] text-mist/40 text-center px-4">
                      Uploaded PDFs are validated and stored, but live prescription downloads use Visual Builder templates.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Template History List */}
            {pdfTemplates.length > 0 && (
              <div className="rounded-[32px] border border-wire/10 bg-white/[0.01] overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/[0.03] text-mist/40 text-[10px] font-bold uppercase tracking-widest border-b border-wire/10">
                      <th className="px-6 py-4">Template Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wire/5">
                    {pdfTemplates.map((tpl: PdfTemplate) => {
                      const isRenderable = isRenderablePdfTemplate(tpl);
                      const isActiveTemplate = tpl.isActive && isRenderable;

                      return (
                      <tr key={tpl.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActiveTemplate ? 'bg-neon/10 text-neon' : 'bg-mist/10 text-mist'}`}>
                              {tpl.type === 'built' ? <Wand2 size={14} /> : <FileText size={14} />}
                            </div>
                            <div>
                              <span className={`font-medium ${isActiveTemplate ? 'text-white' : 'text-mist/70'}`}>{tpl.name}</span>
                              {!isRenderable && (
                                <div className="text-[10px] uppercase tracking-[0.16em] text-mist/35">
                                  Validation only
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-mist/50 capitalize">{tpl.type}</td>
                        <td className="px-6 py-4 text-xs text-mist/50">{new Date(tpl.uploadedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isActiveTemplate && isRenderable && (
                              <button 
                                onClick={() => {
                                  const updated = pdfTemplates.map((t: PdfTemplate) => ({ ...t, isActive: t.id === tpl.id }));
                                  onPdfTemplatesChange(updated);
                                }}
                                className="p-2 rounded-xl text-mist hover:text-neon hover:bg-neon/10 transition-all"
                                title="Activate"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button 
                               onClick={() => {
                                 const updated = pdfTemplates.filter((t: PdfTemplate) => t.id !== tpl.id);
                                 onPdfTemplatesChange(updated);
                               }}
                               className="p-2 rounded-xl text-mist hover:text-red-400 hover:bg-red-400/10 transition-all"
                               title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </PlaceholderBlock>
      </div>
    </div>
  );

  /* ── Messages ── */
  const messagesView = (
    <div className="h-full min-h-0 overflow-hidden">
      <MessagePanel />
    </div>
  );

  const navBody: Record<NavKey, ReactNode> = {
    dashboard: (
      <Suspense fallback={<DashboardLoadingFallback label="Initializing Dashboard..." />}>
        {(queue.length === 0 && isSyncingQueue) ? <DashboardLoadingFallback label="Initializing Dashboard..." /> : overview}
      </Suspense>
    ),
    queue: (
      <Suspense fallback={<DashboardLoadingFallback label="Syncing Queue..." />}>
        {(queue.length === 0 && isSyncingQueue) ? <DashboardLoadingFallback label="Syncing Queue..." /> : queueView}
      </Suspense>
    ),
    search: (
      <Suspense fallback={<DashboardLoadingFallback label="Loading Patients..." />}>
        {(patients.length === 0 && isSyncingPatients) ? <DashboardLoadingFallback label="Loading Patients..." /> : searchView}
      </Suspense>
    ),
    messages: (
      <Suspense fallback={<DashboardLoadingFallback label="Loading Messages..." />}>
        {messagesView}
      </Suspense>
    ),
    schedule: (
      <Suspense fallback={<DashboardLoadingFallback label="Loading Schedule..." />}>
        {scheduleView}
      </Suspense>
    ),
    calendar: (
      <Suspense fallback={<DashboardLoadingFallback label="Preparing Calendar..." />}>
        <MedicalCalendar slotDuration={slotDuration} />
      </Suspense>
    ),
    analytics: (
      <Suspense fallback={<DashboardLoadingFallback label="Crunching Data..." />}>
        {analyticsView}
      </Suspense>
    ),
    settings: (
      <Suspense fallback={<DashboardLoadingFallback label="Loading Settings..." />}>
        {settingsView}
      </Suspense>
    ),
    "template-builder": (
      <Suspense fallback={<DashboardLoadingFallback label="Opening Template Builder..." />}>
        {settingsView}
      </Suspense>
    ),
  };

  return (
    <div
      className={`relative h-screen overflow-hidden ${darkMode ? "bg-ink text-white" : "bg-slate-100 text-slate-950"}`}
    >
      <div
        className="relative mx-auto flex h-full max-w-[1720px] gap-0 px-4 pb-4 pt-20 xl:gap-4 xl:px-6 xl:py-6"
      >
        <Sidebar
          active={nav}
          mobileOpen={sidebarOpen}
          collapsibleEnabled={consoleCollapsible}
          collapsed={consoleCollapsible && consoleCollapsed}
          consoleWidth={consoleWidth}
          onChange={onNavChange}
          onToggleMobile={onToggleSidebar}
          onToggleCollapsed={onToggleConsoleCollapsed}
        />

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className={`scroll-skin relative z-10 flex min-h-0 flex-1 flex-col ${(nav === "calendar" || nav === "search") ? "overflow-hidden" : "overflow-auto"}`}
            onScroll={(event) => {
              const scrollTop = event.currentTarget.scrollTop;
              if (topbarScrollRaf.current !== null) {
                cancelAnimationFrame(topbarScrollRaf.current);
              }
              topbarScrollRaf.current = requestAnimationFrame(() => {
                const shouldCompact = topbarCompactRef.current
                  ? scrollTop > 54
                  : scrollTop > 92;
                if (shouldCompact !== topbarCompactRef.current) {
                  topbarCompactRef.current = shouldCompact;
                  setTopbarCompact(shouldCompact);
                }
              });
            }}
          >
            {nav !== "calendar" && (
                <div className="sticky top-0 z-20 px-0 pb-4 pt-0">
                  <Topbar
                    doctorName={doctorName}
                    clinicStatus={clinicStatus}
                    currentTime={currentTime}
                    notifications={notifications}
                    darkMode={darkMode}
                    onToggleTheme={onToggleTheme}
                    onToggleNotifications={() =>
                      setNotificationsOpen((current) => !current)
                    }
                    onOpenCalendar={() => onNavChange("calendar")}
                    liveCount={inSession}
                    compact={nav === "search" || topbarCompact}
                    isOnline={isOnline}
                    syncStatus={syncStatus}
                    pendingCount={pendingCount}
                  />
                </div>
              )}

            <div className={(nav === "calendar" || nav === "search") ? "flex-1 min-h-0" : "space-y-6"}>
              <Suspense
                fallback={
                  <div className="flex h-64 items-center justify-center text-mist/40 text-sm">
                    Loading…
                  </div>
                }
              >
                {navBody[nav]}
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      {notificationsOpen && (
        <>
          <button
            type="button"
            aria-label="Close notifications panel"
            className="doctor-notification-backdrop fixed inset-0 z-[54]"
            onClick={() => setNotificationsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 z-[55] flex w-full justify-end">
            <aside
              className="doctor-notification-sheet relative flex h-full w-full max-w-[min(760px,52vw)] min-w-[420px] flex-col overflow-hidden border-l px-0 max-md:max-w-full max-md:min-w-0"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--doctor-accent-secondary) 14%, var(--doctor-border) 86%)",
                background:
                  "color-mix(in srgb, var(--doctor-card-tint) 90%, rgba(5,10,18,0.16))",
                boxShadow:
                  "-24px 0 80px rgba(2, 8, 18, 0.28), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <div className="relative flex items-center justify-between gap-3 border-b border-wire/8 px-7 py-6">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Notification Center
                  </div>
                  <div className="mt-1 text-xs text-mist">
                    Latest alerts, reminders, and console activity.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="ghost-btn min-w-[78px]"
                >
                  Close
                </button>
              </div>
              <div className="scroll-skin flex-1 overflow-auto px-6 py-6">
                {emrShareRequests.length || latestNotifications.length ? (
                  <div className="doctor-notification-content space-y-5">
                    {emrShareRequests.length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-mist">
                            Pending EMR shares
                          </div>
                          <div className="chip border-neon/20 bg-neon/10 text-neon">
                            {emrShareRequests.length} request
                            {emrShareRequests.length === 1 ? "" : "s"}
                          </div>
                        </div>
                        {emrShareRequests.map((request) => (
                          <article
                            key={request.id}
                            className="rounded-[28px] border border-neon/18 bg-neon/[0.05] p-5"
                          >
                            <div className="flex items-start gap-4">
                              <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-[18px] border border-neon/20 bg-neon/10 text-neon">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-base font-semibold text-white">
                                    {request.patient.name}
                                  </div>
                                  <span className="chip border-neon/20 bg-slate-950/25 text-neon">
                                    {request.recordCount} record
                                    {request.recordCount === 1 ? "" : "s"}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-mist">
                                  Shared EMR request for{" "}
                                  {request.scope.replace(/_/g, " ")}.
                                  Transaction {request.transactionId}.
                                </p>
                                <div className="mt-2 text-xs text-mist/80">
                                  {request.patient.meiosisId ||
                                    request.patient.universalCode}{" "}
                                  •{" "}
                                  {new Date(request.createdAt).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    },
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex gap-3">
                              <button
                                type="button"
                                disabled={respondingShareId === request.id}
                                onClick={async () => {
                                  setRespondingShareId(request.id);
                                  try {
                                    await onRespondEmrShare(request, true);
                                  } finally {
                                    setRespondingShareId((current) =>
                                      current === request.id ? null : current,
                                    );
                                  }
                                }}
                                className={`action-btn min-w-[120px] ${respondingShareId === request.id ? "cursor-wait opacity-70" : ""}`}
                              >
                                {respondingShareId === request.id
                                  ? "Saving..."
                                  : "Accept"}
                              </button>
                              <button
                                type="button"
                                disabled={respondingShareId === request.id}
                                onClick={async () => {
                                  setRespondingShareId(request.id);
                                  try {
                                    await onRespondEmrShare(request, false);
                                  } finally {
                                    setRespondingShareId((current) =>
                                      current === request.id ? null : current,
                                    );
                                  }
                                }}
                                className={`ghost-btn min-w-[120px] ${respondingShareId === request.id ? "cursor-wait opacity-70" : ""}`}
                              >
                                Reject
                              </button>
                            </div>
                          </article>
                        ))}
                      </section>
                    )}

                    {latestNotifications.length > 0 && (
                      <section className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-mist">
                          Console updates
                        </div>
                        {latestNotifications.map((notification) => (
                          <article
                            key={notification.id}
                            className={`rounded-[24px] border p-4 ${
                              notification.tone === "amber"
                                ? "border-amber-400/20 bg-amber-400/[0.06]"
                                : notification.tone === "green"
                                  ? "border-neon/20 bg-neon/[0.06]"
                                  : "border-sky/20 bg-sky/[0.06]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border ${
                                  notification.tone === "amber"
                                    ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                                    : notification.tone === "green"
                                      ? "border-neon/20 bg-neon/10 text-neon"
                                      : "border-sky/20 bg-sky/10 text-sky"
                                }`}
                              >
                                <Clock3 size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-white">
                                  {notification.title}
                                </div>
                                <p className="mt-1 text-sm leading-6 text-mist">
                                  {notification.body}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </section>
                    )}
                  </div>
                ) : (
                  <div className="doctor-notification-empty flex min-h-full flex-col items-center justify-center px-10 text-center">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-[22px] border text-white/80"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--doctor-accent-secondary) 18%, var(--doctor-border) 82%)",
                        background:
                          "linear-gradient(180deg, color-mix(in srgb, var(--doctor-accent-secondary) 10%, transparent), color-mix(in srgb, var(--doctor-accent) 10%, transparent))",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      <Clock3 size={24} />
                    </div>
                    <div className="mt-5 text-xl font-semibold text-white">
                      No notifications yet
                    </div>
                    <p className="mt-2 max-w-[260px] text-sm leading-6 text-mist">
                      New operational updates, reminders, and care alerts will
                      land here as they arrive.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </>
      )}

      {/* EMR save toast */}
      {(templateToast || emrToast) && (
        <div
          className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm transition-all ${
            (templateToast || emrToast)?.ok
              ? "border-neon/30 bg-slate-950/90 text-neon"
              : "border-red-400/30 bg-slate-950/90 text-red-300"
          }`}
        >
          <span>{(templateToast || emrToast)?.ok ? "✓" : "✕"}</span>
          {(templateToast || emrToast)?.msg}
        </div>
      )}

      {/* EMR Builder modal — Simple or Modern layout */}
      <Suspense fallback={<DashboardLoadingFallback label="Opening EMR Engine..." />}>
        {emrBuilderLayout === "modern" ? (
          <EMRBuilderModern
            patientName={selectedPatient?.name ?? null}
            patient={selectedPatient}
            appointment={activeAppointment}
            composerOpen={emrComposerOpen}
            onCloseComposer={onCloseEmrComposer}
            openedFromRecords={emrOpenedFromRecords}
            emr={emr}
            templates={templates}
            activeTemplateId={activeTemplateId}
            onStartConsultation={onStartConsultation}
            onEndConsultation={onEndConsultation}
            onPauseConsultation={onPauseConsultation}
            onResumeConsultation={onResumeConsultation}
            isSaving={emrSaving}
            onFieldChange={onEmrFieldChange}
            onVitalChange={onVitalChange}
            onPrescriptionChange={onPrescriptionChange}
            onAddPrescriptionRow={onAddPrescriptionRow}
            onRemovePrescriptionRow={onRemovePrescriptionRow}
            onApplyTemplate={onApplyTemplate}
            onSaveTemplate={onSaveTemplate}
            onSaveEMR={onSaveEMR}
            onNavigate={(key) => {
              onNavChange(key as NavKey);
              onCloseEmrComposer();
            }}
          />
        ) : (
          <EMRBuilder
            patientName={selectedPatient?.name ?? null}
            patient={selectedPatient}
            appointment={activeAppointment}
            composerOpen={emrComposerOpen}
            onCloseComposer={onCloseEmrComposer}
            emr={emr}
            templates={templates}
            activeTemplateId={activeTemplateId}
            onStartConsultation={onStartConsultation}
            onEndConsultation={onEndConsultation}
            onPauseConsultation={onPauseConsultation}
            onResumeConsultation={onResumeConsultation}
            isSaving={emrSaving}
            onFieldChange={onEmrFieldChange}
            onVitalChange={onVitalChange}
            onPrescriptionChange={onPrescriptionChange}
            onAddPrescriptionRow={onAddPrescriptionRow}
            onRemovePrescriptionRow={onRemovePrescriptionRow}
            onApplyTemplate={onApplyTemplate}
            onSaveTemplate={onSaveTemplate}
            onSaveEMR={onSaveEMR}
            onNavigate={(key) => {
              onNavChange(key as NavKey);
              onCloseEmrComposer();
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
