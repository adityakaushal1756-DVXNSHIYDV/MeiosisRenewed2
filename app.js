const AUTH_SESSION_KEY = "meiosis_auth_session_v1";

function loadAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (error) {
    return;
  }
}

const authSession = loadAuthSession();
if (!authSession || authSession.role !== "PATIENT") {
  window.location.href = "./login.html";
}
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".page-section");
const themeSelect = document.getElementById("themeSelect");
const themeCustomControls = document.getElementById("themeCustomControls");
const themeColorSlider = document.getElementById("themeColorSlider");
const themeBrightnessSlider = document.getElementById("themeBrightnessSlider");
const themeColorValue = document.getElementById("themeColorValue");
const themeBrightnessValue = document.getElementById("themeBrightnessValue");
const themePreviewSwatch = document.getElementById("themePreviewSwatch");
const tabs = document.querySelectorAll(".tab");
const doseButtons = document.querySelectorAll("[data-dose-btn]");
const doseCards = document.querySelectorAll("[data-dose-card]");

const detailModal = document.getElementById("detailModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const toastStack = document.getElementById("toastStack");
const appointmentsList = document.getElementById("appointmentsList");
const appointmentFilterUpcomingBtn = document.getElementById(
  "appointmentFilterUpcoming",
);
const appointmentFilterPastBtn = document.getElementById(
  "appointmentFilterPast",
);
const appointmentFilterCancelledBtn = document.getElementById(
  "appointmentFilterCancelled",
);
const appointmentListAllBtn = document.getElementById("appointmentListAllBtn");
const upcomingCount = document.getElementById("upcomingCount");
const homeUpcomingDoctor = document.getElementById("homeUpcomingDoctor");
const homeUpcomingDateTime = document.getElementById("homeUpcomingDateTime");
const homeUpcomingHospital = document.getElementById("homeUpcomingHospital");
const homeUpcomingMeta = document.getElementById("homeUpcomingMeta");
const homeViewDetailsBtn = document.getElementById("homeViewDetailsBtn");
const homeRescheduleBtn = document.getElementById("homeRescheduleBtn");
const homeUpcomingTimeline = document.getElementById("homeUpcomingTimeline");
const homeLatestPrescriptionIssued = document.getElementById(
  "homeLatestPrescriptionIssued",
);
const homeLatestPrescriptionStatus = document.getElementById(
  "homeLatestPrescriptionStatus",
);
const homeLatestPrescriptionTitle = document.getElementById(
  "homeLatestPrescriptionTitle",
);
const homeLatestPrescriptionDoctor = document.getElementById(
  "homeLatestPrescriptionDoctor",
);
const homeLatestPrescriptionChips = document.getElementById(
  "homeLatestPrescriptionChips",
);
const homeLatestPrescriptionDuration = document.getElementById(
  "homeLatestPrescriptionDuration",
);
const homeLatestPrescriptionRefills = document.getElementById(
  "homeLatestPrescriptionRefills",
);
const homeLatestPrescriptionNote = document.getElementById(
  "homeLatestPrescriptionNote",
);
const homeLatestPrescriptionViewBtn = document.getElementById(
  "homeLatestPrescriptionViewBtn",
);
const healthSlopeGraph = document.getElementById("healthSlopeGraph");
const homeAppointmentSummaryCount = document.getElementById(
  "homeAppointmentSummaryCount",
);
const homeAppointmentChartCount = document.getElementById(
  "homeAppointmentChartCount",
);
const homeAppointmentChartMeta = document.getElementById(
  "homeAppointmentChartMeta",
);
const homeAppointmentChartCountPrimary = document.getElementById(
  "homeAppointmentChartCountPrimary",
);
const homeAppointmentChartMetaPrimary = document.getElementById(
  "homeAppointmentChartMetaPrimary",
);
const homePrescriptionChartCount = document.getElementById(
  "homePrescriptionChartCount",
);
const homePrescriptionChartMeta = document.getElementById(
  "homePrescriptionChartMeta",
);
const homeLabChartCount = document.getElementById("homeLabChartCount");
const homeLabChartMeta = document.getElementById("homeLabChartMeta");
const homeAppointmentActivityLead = document.getElementById(
  "homeAppointmentActivityLead",
);
const homeAppointmentRangeChip = document.getElementById(
  "homeAppointmentRangeChip",
);
const homeAppointmentRangeValue = document.getElementById(
  "homeAppointmentRangeValue",
);
const homeAppointmentRangeSlider = document.getElementById(
  "homeAppointmentRangeSlider",
);
const homeAppointmentBars = document.getElementById("homeAppointmentBars");
const homePrescriptionBars = document.getElementById("homePrescriptionBars");
const homeLabBars = document.getElementById("homeLabBars");
const homeAppointmentLabels = document.getElementById("homeAppointmentLabels");
const slopeTooltip = document.getElementById("slopeTooltip");
const nfcCardStatus = document.getElementById("nfcCardStatus");
const nfcEmergencyStatus = document.getElementById("nfcEmergencyStatus");
const nfcToggleCardBtn = document.querySelector(
  '#nfc [data-action="disable-card"]',
);
const nfcLastUsedEl = document.getElementById("nfcLastUsed");
const nfcLinkedHospitalsEl = document.getElementById("nfcLinkedHospitals");
const nfcLinkedDoctorsEl = document.getElementById("nfcLinkedDoctors");
const nfcCardsStripEl = document.getElementById("nfcCardsStrip");
const nfcIdentityUrlEl = document.getElementById("nfcIdentityUrl");
const nfcCardPasscodeEl = document.getElementById("nfcCardPasscode");

const medsDate = document.getElementById("medsDate");
const medProgressValue = document.getElementById("medProgressValue");
const medProgressBar = document.getElementById("medProgressBar");
const medProgressPercent = document.getElementById("medProgressPercent");
const nextDoseText = document.getElementById("nextDoseText");
const dailyMedicineGroups = document.getElementById("dailyMedicineGroups");
const medplanSection = document.getElementById("medplan");
const medplanCompletionBanner = document.getElementById(
  "medplanCompletionBanner",
);
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarSearchInput = document.getElementById("sidebarSearchInput");
const sidebarSearchBtn = document.getElementById("sidebarSearchBtn");
const profileNameEl = document.getElementById("profileName");
const profileEmailEl = document.getElementById("profileEmail");
const profilePhoneEl = document.getElementById("profilePhone");
const profileAddressEl = document.getElementById("profileAddress");
const profileLanguageEl = document.getElementById("profileLanguage");
const dashboardGreeting = document.getElementById("dashboardGreeting");
const activePrescriptionCount = document.getElementById(
  "activePrescriptionCount",
);
const newReportsCount = document.getElementById("newReportsCount");
const nfcUniversalCodeEl = document.getElementById("nfcUniversalCode");
const settingsUniversalCodeEl = document.getElementById(
  "settingsUniversalCode",
);
const myQrPatientNameEl = document.getElementById("myQrPatientName");
const myQrCodeEl = document.getElementById("myQrCode");
const myQrAccessUrlEl = document.getElementById("myQrAccessUrl");
const editUniversalIdBtn = document.getElementById("editUniversalIdBtn");
const weatherLocateBtn = document.getElementById("weatherLocateBtn");
const weatherRefreshBtn = document.getElementById("weatherRefreshBtn");
const weatherUpdatedAt = document.getElementById("weatherUpdatedAt");
const weatherLocation = document.getElementById("weatherLocation");
const weatherSummary = document.getElementById("weatherSummary");
const weatherIcon = document.getElementById("weatherIcon");
const weatherTemp = document.getElementById("weatherTemp");
const weatherFeelsLike = document.getElementById("weatherFeelsLike");
const weatherCondition = document.getElementById("weatherCondition");
const weatherSunrise = document.getElementById("weatherSunrise");
const weatherSunset = document.getElementById("weatherSunset");
const weatherDaylight = document.getElementById("weatherDaylight");
const weatherUvNow = document.getElementById("weatherUvNow");
const weatherUvMax = document.getElementById("weatherUvMax");
const weatherHumidity = document.getElementById("weatherHumidity");
const weatherWind = document.getElementById("weatherWind");
const weatherPressure = document.getElementById("weatherPressure");
const weatherVisibility = document.getElementById("weatherVisibility");
const weatherPollen = document.getElementById("weatherPollen");
const weatherPm25 = document.getElementById("weatherPm25");
const weatherPm10 = document.getElementById("weatherPm10");
const weatherAdvice = document.getElementById("weatherAdvice");
const weatherHourly = document.getElementById("weatherHourly");
const weatherDaily = document.getElementById("weatherDaily");
const sunTimeline = document.getElementById("sunTimeline");
const sunNowTime = document.getElementById("sunNowTime");
const messagesDoctorList = document.getElementById("messagesDoctorList");
const messagesShell = document.getElementById("messagesShell");
const messagesChatTitle = document.getElementById("messagesChatTitle");
const messagesChatMeta = document.getElementById("messagesChatMeta");
const messagesChatAvatar = document.getElementById("messagesChatAvatar");
const messagesThread = document.getElementById("messagesThread");
const messagesInput = document.getElementById("messagesInput");
const messagesSendBtn = document.getElementById("messagesSendBtn");
const messagesBackBtn = document.getElementById("messagesBackBtn");
const messagesImageInput = document.getElementById("messagesImageInput");
const messagesImageBtn = document.getElementById("messagesImageBtn");
const messagesVoiceBtn = document.getElementById("messagesVoiceBtn");
const messagesComposerMeta = document.getElementById("messagesComposerMeta");
const messagesVoiceOverlay = document.getElementById("messagesVoiceOverlay");
const messagesVoiceDoneBtn = document.getElementById("messagesVoiceDoneBtn");
const messagesVoiceCancelBtn = document.getElementById(
  "messagesVoiceCancelBtn",
);
const messagesVoiceStatus = document.getElementById("messagesVoiceStatus");
const networkDoctorList = document.getElementById("networkDoctorList");
const networkCareTeamCount = document.getElementById("networkCareTeamCount");
const networkConnectedCount = document.getElementById("networkConnectedCount");
const prescriptionActivePlans = document.getElementById(
  "prescriptionActivePlans",
);
const prescriptionRefillsPending = document.getElementById(
  "prescriptionRefillsPending",
);
const prescriptionAdherenceAvg = document.getElementById(
  "prescriptionAdherenceAvg",
);
const prescriptionNextReview = document.getElementById(
  "prescriptionNextReview",
);
const prescriptionsSection = document.getElementById("prescriptions");
const prescriptionPageLead = document.getElementById("prescriptionPageLead");
const prescriptionOverviewShell = document.getElementById(
  "prescriptionOverviewShell",
);
const prescriptionTimelineShell = document.getElementById(
  "prescriptionTimelineShell",
);
const prescriptionTimelineSearch = document.getElementById(
  "prescriptionTimelineSearch",
);
const prescriptionCards = document.getElementById("prescriptionCards");
const prescriptionDocsList = document.getElementById("prescriptionDocsList");
const prescriptionOverviewList = document.getElementById(
  "prescriptionOverviewList",
);
const prescriptionTimelineLead = document.getElementById(
  "prescriptionTimelineLead",
);
const prescriptionTimelineMeta = document.getElementById(
  "prescriptionTimelineMeta",
);
const prescriptionTimeline = document.getElementById("prescriptionTimeline");
const labsTableBody = document.getElementById("labsTableBody");
const labsAiNote = document.getElementById("labsAiNote");
const labReportsList = document.getElementById("labReportsList");
const labDocsList = document.getElementById("labDocsList");
const medicalReportsArchive = document.getElementById("medicalReportsArchive");

const APPOINTMENTS_STORAGE_KEY = "meiosis_patient_appointments_v1";
const UNIVERSAL_ID_STORAGE_KEY = "meiosis_universal_id_v1";
const MEDICATION_STATE_STORAGE_KEY = "meiosis_medication_state_v1";
const CUSTOM_DOCTORS_STORAGE_KEY = "meiosis_custom_doctors_v1";
const LAST_PATIENT_KEY = "meiosis_last_patient_id_v1";
const runtimeConfig = window.MEIOSIS_RUNTIME_CONFIG || {};
const API = String(runtimeConfig.backendOrigin || 'http://localhost:5002').replace(/\/+$/, '') + '/api';
const API_BASE_URL = API;
const MESSAGE_ATTACHMENT_PREFIX = "__MEIOSIS_ATTACHMENT__::";
const THEME_STORAGE_KEY = "meiosis_patient_theme_v2";
const CUSTOM_THEME_STORAGE_KEY = "meiosis_patient_custom_theme_v1";
let messagesMediaRecorder = null;
let messagesVoiceChunks = [];
let messagesVoiceStream = null;
let messagesVoiceSending = false;
let messagesVoiceFinalizeMode = "send";
let messagesFocusMode = false;
const homeActivityAnimationFrames = {
  chart: null,
  summary: null,
  appointments: null,
  prescriptions: null,
  labs: null,
};
let homeDashboardMotionFrame = null;
let homeAppointmentRangeIndex = Number(homeAppointmentRangeSlider?.value || 1);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function loadStoredCustomTheme() {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (!raw) return { hue: 152, brightness: 100 };
    const parsed = JSON.parse(raw);
    return {
      hue: clamp(Number(parsed?.hue) || 152, 0, 360),
      brightness: clamp(Number(parsed?.brightness) || 100, 70, 135),
    };
  } catch (error) {
    return { hue: 152, brightness: 100 };
  }
}

let customThemeConfig = loadStoredCustomTheme();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeMessagePayload(text) {
  if (typeof text !== "string" || !text.startsWith(MESSAGE_ATTACHMENT_PREFIX)) {
    return { kind: "text", text: text || "" };
  }
  try {
    const payload = JSON.parse(text.slice(MESSAGE_ATTACHMENT_PREFIX.length));
    if (payload?.kind === "attachment" && payload?.url) return payload;
  } catch (error) {
    // Ignore malformed payloads and fall back to raw text.
  }
  return { kind: "text", text };
}

function encodeAttachmentPayload(payload) {
  return `${MESSAGE_ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}

function setMessagesVoiceButtonState(recording) {
  if (!messagesVoiceBtn) return;
  messagesVoiceBtn.setAttribute(
    "aria-label",
    recording ? "Stop recording voice note" : "Record voice note",
  );
  messagesVoiceBtn.setAttribute(
    "title",
    recording ? "Stop recording voice note" : "Record voice note",
  );
  messagesVoiceBtn.innerHTML = recording
    ? `
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="5.5" y="5.5" width="9" height="9" rx="2.2" fill="currentColor"/>
      </svg>
    `
    : `
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="7" y="3.2" width="6" height="9.2" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/>
        <path d="M5.5 9.7a4.5 4.5 0 0 0 9 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M10 14.4v2.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M7.4 16.8h5.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      </svg>
    `;
}

function formatAudioTime(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function initialiseMessageAudioPlayers(scope = document) {
  scope.querySelectorAll("[data-audio-player]").forEach((player) => {
    if (player.dataset.ready === "1") return;
    const audio = player.querySelector("[data-audio-element]");
    const toggle = player.querySelector("[data-audio-toggle]");
    const icon = player.querySelector("[data-audio-icon]");
    const progress = player.querySelector("[data-audio-progress]");
    const time = player.querySelector("[data-audio-time]");
    if (!audio || !toggle || !icon || !progress || !time) return;

    const sync = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const current = Number.isFinite(audio.currentTime)
        ? audio.currentTime
        : 0;
      progress.value = duration ? String((current / duration) * 100) : "0";
      time.textContent = `${formatAudioTime(current)} / ${formatAudioTime(duration)}`;
      icon.textContent = audio.paused ? "▶" : "❚❚";
      player.classList.toggle("is-playing", !audio.paused);
    };

    toggle.addEventListener("click", () => {
      document.querySelectorAll("[data-audio-element]").forEach((candidate) => {
        if (candidate !== audio) candidate.pause();
      });
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });

    progress.addEventListener("input", () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (!duration) return;
      audio.currentTime = (Number(progress.value) / 100) * duration;
      sync();
    });

    audio.addEventListener("loadedmetadata", sync);
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", sync);
    sync();

    player.dataset.ready = "1";
  });
}

function openMessagesVoiceOverlay() {
  if (!messagesVoiceOverlay) return;
  messagesVoiceOverlay.hidden = false;
  requestAnimationFrame(() => messagesVoiceOverlay.classList.add("is-visible"));
}

function closeMessagesVoiceOverlay() {
  if (!messagesVoiceOverlay) return;
  messagesVoiceOverlay.classList.remove("is-visible");
  setTimeout(() => {
    if (
      messagesVoiceOverlay &&
      !messagesVoiceOverlay.classList.contains("is-visible")
    ) {
      messagesVoiceOverlay.hidden = true;
    }
  }, 220);
}

function getMessagePreview(message) {
  const payload = decodeMessagePayload(message?.text || "");
  if (payload.kind === "attachment") {
    return payload.attachmentType === "voice"
      ? "Voice note"
      : "Image attachment";
  }
  return payload.text || "No messages yet";
}

function renderMessagesLayoutMode() {
  if (messagesShell) {
    messagesShell.classList.toggle("messages-shell-focused", messagesFocusMode);
  }
  if (messagesBackBtn) {
    messagesBackBtn.hidden = !messagesFocusMode;
  }
}

function buildPatientMessageBubble(message) {
  const payload = decodeMessagePayload(message.text);
  if (payload.kind !== "attachment") {
    return `<p>${escapeHtml(payload.text)}</p>`;
  }

  if (payload.attachmentType === "voice") {
    return `
      <div class="msg-attachment msg-attachment-voice">
        <div class="msg-attachment-label">Voice note</div>
        <div class="msg-audio-player" data-audio-player>
          <button class="msg-audio-toggle" type="button" data-audio-toggle aria-label="Play voice note">
            <span class="msg-audio-toggle-icon" data-audio-icon>▶</span>
          </button>
          <div class="msg-audio-body">
            <div class="msg-audio-meta">
              <span>Voice note</span>
              <span data-audio-time>0:00 / 0:00</span>
            </div>
            <input class="msg-audio-progress" data-audio-progress type="range" min="0" max="100" value="0" />
          </div>
          <audio preload="metadata" src="${escapeHtml(payload.url)}" data-audio-element></audio>
        </div>
      </div>
    `;
  }

  return `
    <div class="msg-attachment msg-attachment-image">
      <div class="msg-attachment-label">${escapeHtml(payload.name || "Image attachment")}</div>
      <a href="${escapeHtml(payload.url)}" target="_blank" rel="noreferrer">
        <img src="${escapeHtml(payload.url)}" alt="${escapeHtml(payload.name || "Shared image")}" loading="lazy" />
      </a>
    </div>
  `;
}

// If the logged-in patient changed since the last page load, wipe all
// patient-specific localStorage so stale data from a previous account
// never bleeds into a new one.
(function clearStaleLocalStorageIfUserChanged() {
  const currentPatientId = authSession?.patientId || null;
  const lastPatientId = localStorage.getItem(LAST_PATIENT_KEY);
  if (currentPatientId !== lastPatientId) {
    localStorage.removeItem(APPOINTMENTS_STORAGE_KEY);
    localStorage.removeItem(UNIVERSAL_ID_STORAGE_KEY);
    localStorage.removeItem(MEDICATION_STATE_STORAGE_KEY);
    localStorage.removeItem(CUSTOM_DOCTORS_STORAGE_KEY);
    if (currentPatientId)
      localStorage.setItem(LAST_PATIENT_KEY, currentPatientId);
    else localStorage.removeItem(LAST_PATIENT_KEY);
  }
})();

const appointments = {};
const doctorDirectory = [];

const addAppointmentFlow = {
  searchTerm: "",
  doctorId: null,
  slotIndex: null,
  selectedDate: null,
};
let pendingAppointmentFocusId = null;
let isAppointmentsLoading = true;
let appointmentViewMode = "upcoming";
let appointmentListMode = false;
const shareEmrFlow = {
  selectedDoctorId: null,
  searchTerm: "",
  selectedAppointmentIds: [],
  txId: null,
};
const refillCatalog = [];
const refillFlow = {
  selectedIds: [],
  quantities: {},
  paymentMethod: "UPI",
};
const messageState = {
  selectedDoctorId: null,
  threads: {},
  threadIds: {},
  _renderedId: null,
  _renderedCount: 0,
};
const customDoctorsState = [];
const doctorDiscoveryCatalog = [];
const networkAddFlow = {
  name: "",
  specialty: "",
  hospital: "",
};
let modalLastFocusedElement = null;
let isNfcCardActive = false;
const nfcCards = [];
let activeNfcCardId = null;
const usedNfcIdentityUrls = new Set();
const usedNfcPasscodes = new Set();
const addNfcFlow = {
  readerConnected: false,
};
let medicationCompletionCelebrated = false;
const defaultReminderProfile = {
  breakfast: "08:00",
  lunch: "13:30",
  snacks: "",
  dinner: "20:30",
  wakeUp: "06:30",
  sleep: "22:30",
  reminderLead: 15,
};
const medicationState = {
  reminders: { ...defaultReminderProfile },
  prescriptionEndAt: null,
  prescriptionEndedHandled: false,
};
let emergencyOverrideActive = false;
let emergencyOverrideUntil = null;
let weatherLoaded = false;
let weatherCoords = null;
let weatherSunState = { sunrise: null, sunset: null };
let weatherSunTimerStarted = false;
const prescriptionUiState = { timelineView: "overview" };
const prescriptionTimelineState = { query: "", filter: "all" };
let nfcAccessToken = `MTK-${Math.floor(100000 + Math.random() * 900000)}`;
let nfcTokenIssuedAt = new Date();
const nfcScanHistory = [];
const takenUniversalCodes = new Set();

const universalIdState = {
  code: "----------",
  lockDays: 0,
  lastUpdatedAt: null,
};
const profileState = {
  name: authSession?.name || "",
  email: authSession?.email || "",
  phone: "",
  address: "",
  language: "English",
  bloodGroup: "",
  insurancePlan: "",
  emergencyContact: "",
};
const prescriptionState = [];
const labReportsState = [];
const medicalReportsState = [];
const backendState = {
  patientId: null,
  online: false,
};

const actionDetails = {
  "open-access-log": {
    title: "Transparent Access Log",
    body: "<ul><li>2026-03-03 10:20 - Dr. Rao - ECG report viewed</li><li>2026-03-02 09:05 - Nova Lab Admin - Lipid panel viewed</li><li>2026-03-01 16:48 - Dr. Chen - Prescription updated</li></ul>",
  },
  "share-emr": {
    title: "Share EMR",
    body: "<p>Select sharing scope:</p><ul><li>Full record (time-limited)</li><li>Labs only</li><li>Summary only</li></ul><p>Default expiration: 30 days. Access is fully auditable.</p>",
  },
  "download-summary": {
    title: "Health Summary",
    body: "<p>Generated summary includes diagnoses, medications, lab trends, and latest physician notes for the last 6 months.</p>",
  },
  "book-appointment": {
    title: "Book Appointment",
    body: "<p>Specialties available: Cardiology, Endocrinology, General Medicine, Dermatology, Neurology.</p><p>Fastest slot: March 4, 2026 - 4:15 PM (Teleconsult).</p>",
  },
  "upload-report": {
    title: "Upload External Report",
    body: "<p>Accepted formats: PDF, JPG, PNG (max 20MB). OCR auto-extracts test names, values, and dates.</p>",
  },
  "emergency-qr": {
    title: "Emergency Access QR",
    body: "<p>QR grants 60-minute emergency view of allergies, medications, and critical conditions only.</p>",
  },
  "set-access-expiry": {
    title: "Set Access Expiration",
    body: "<p>Set how long each doctor can access your records. Manage per-doctor settings in your Network tab.</p>",
  },
  "preview-shared-data": {
    title: "Shared Data Preview",
    body: "<p>Current share package includes allergies, active medications, recent labs, and diagnosis summary. Imaging is excluded.</p>",
  },
  "disable-card": {
    title: "Disable NFC Card",
    body: "<p>NFC card will be blocked immediately. Emergency override still possible from app with OTP verification.</p>",
  },
  "regenerate-token": {
    title: "Regenerate Token",
    body: "<p>New token generated. Previous token will expire in 60 seconds.</p>",
  },
  "view-scan-history": {
    title: "Scan History",
    body: '<p class="hint">Loading scan history...</p>',
  },
  "emergency-override": {
    title: "Emergency Override",
    body: "<p>Enable one-click emergency release for critical clinicians. This action is logged and alerts your emergency contact.</p>",
  },
  "show-calendar": {
    title: "Calendar View",
    body: "<p>View your appointments in calendar format. Reschedule from each card to pick alternate slots.</p>",
  },
  "show-list": {
    title: "List View",
    body: "<p>Sorted by date with quick filters by specialty and status.</p>",
  },
  "chat-doctor": {
    title: "Doctor Chat",
    body: "<p>Secure channel opened. Attach reports, send voice notes, and receive follow-up instructions.</p>",
  },
  "configure-reminders": {
    title: "Medicine Reminders",
    body: "<p>Reminder mode enabled for 15 mins before each dose and at exact dose time. Sound + push notifications active.</p>",
  },
  "open-full-plan": {
    title: "Full Medication Plan",
    body: "<p>Your full weekly medication plan is shown in the Medicines tab. Follow-up review date is set by your doctor.</p>",
  },
  "download-rx-pdf": {
    title: "Prescription PDF",
    body: "<p>Signed digital prescription includes dosage chart, refill limits, and pharmacy validation QR.</p>",
  },
  "request-refill": {
    title: "Refill Request",
    body: "<p>Refill submitted to doctor and linked pharmacy. Typical approval time: 2-6 hours.</p>",
  },
  "ask-doctor-rx": {
    title: "Ask Doctor",
    body: "<p>Common questions: missed dose, side effects, medicine interaction, and timing with meals.</p>",
  },
  "view-lab": {
    title: "Lab Report Details",
    body: "<p>Detailed report includes reference range, trend vs prior test, and doctor annotation with next-step recommendation.</p>",
  },
  "second-opinion": {
    title: "Second Opinion Request",
    body: "<p>Select target doctor and share subset:</p><ul><li>Cardio + Labs</li><li>Imaging only</li><li>Full summary</li></ul>",
  },
  "open-chat": {
    title: "Message Center",
    body: "<p>Open the Messages tab to chat with your connected doctors.</p>",
  },
  "attach-file": {
    title: "Attach File",
    body: "<p>Upload report, image, or audio note to this consultation thread.</p>",
  },
  "save-privacy": {
    title: "Privacy Controls Saved",
    body: "<p>Your consent and access expiry settings were updated successfully.</p>",
  },
  "download-audit": {
    title: "Audit Report",
    body: "<p>Downloading access ledger as encrypted PDF for 2026-01-01 to 2026-03-03.</p>",
  },
  insights: {
    title: "MEIOSIS Insights",
    body: '<p class="hint">AI health insights will appear here once your doctor has recorded your health data across multiple visits.</p>',
  },
};

function openModal(title, html) {
  modalLastFocusedElement = document.activeElement;
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  detailModal.classList.remove("hidden");
  detailModal.setAttribute("aria-hidden", "false");
  closeModal.focus();
}

function closeDetailModal() {
  detailModal.classList.add("hidden");
  detailModal.setAttribute("aria-hidden", "true");
  if (
    modalLastFocusedElement &&
    typeof modalLastFocusedElement.focus === "function"
  ) {
    modalLastFocusedElement.focus();
  }
}

function openSmoothSuccessModal(title, detailsHtml) {
  openModal(
    title,
    `
      <div class="smooth-success">
        <div class="smooth-success-tick" aria-hidden="true">
          <svg viewBox="0 0 80 80">
            <circle class="smooth-tick-ring" cx="40" cy="40" r="34"></circle>
            <path class="smooth-tick-path" d="M23 41 L36 54 L58 28"></path>
          </svg>
        </div>
        <div class="smooth-success-body">
          ${detailsHtml}
        </div>
      </div>
    `,
  );
}

function playListButtonTickAnimation() {
  if (!appointmentListAllBtn) return;
  appointmentListAllBtn.classList.remove("list-btn-tick", "list-btn-updated");
  appointmentListAllBtn.textContent = "?";
  appointmentListAllBtn.classList.add("list-btn-tick");

  setTimeout(() => {
    if (!appointmentListAllBtn) return;
    appointmentListAllBtn.classList.remove("list-btn-tick", "list-btn-updated");
    appointmentListAllBtn.textContent = appointmentListMode ? "Grid" : "List";
  }, 640);
}

function showToast(message, type = "success") {
  if (!toastStack) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function weatherCodeToText(code) {
  if ([0].includes(code)) return "Clear sky";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if ([3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Weather update";
}

function weatherCodeToIconMode(code) {
  if ([61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code))
    return "rainy";
  if ([1, 2, 3, 45, 48].includes(code)) return "cloudy";
  return "sunny";
}

function computePollenRisk(hourly, idx) {
  const fields = [
    "alder_pollen",
    "birch_pollen",
    "grass_pollen",
    "mugwort_pollen",
    "ragweed_pollen",
  ];
  const values = fields
    .map((f) => hourly?.[f]?.[idx])
    .filter((v) => typeof v === "number");
  if (!values.length) return { level: "Unavailable", score: null };
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum < 20) return { level: "Low", score: sum };
  if (sum < 60) return { level: "Moderate", score: sum };
  return { level: "High", score: sum };
}

function setWeatherLoadingState(message = "Loading weather...") {
  if (weatherSummary) weatherSummary.textContent = message;
  if (weatherTemp) weatherTemp.textContent = "--°C";
  if (weatherHourly)
    weatherHourly.innerHTML =
      '<div class="hour-chip"><p>--</p><strong>--</strong></div>';
  if (weatherDaily)
    weatherDaily.innerHTML =
      '<div class="day-row"><span>--</span><span>--</span><span>--</span><span>--</span></div>';
}

function updateSunTimelineMotion() {
  if (!sunTimeline || !weatherSunState.sunrise || !weatherSunState.sunset)
    return;
  const nowMs = Date.now();
  const start = weatherSunState.sunrise.getTime();
  const end = weatherSunState.sunset.getTime();
  let pct = 0;
  if (nowMs <= start) pct = 0;
  else if (nowMs >= end) pct = 100;
  else pct = ((nowMs - start) / (end - start)) * 100;

  sunTimeline.style.setProperty("--sun-progress", `${pct.toFixed(1)}%`);
  if (sunNowTime) {
    sunNowTime.textContent = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function renderWeather(data, placeLabel) {
  const current = data.current || {};
  const daily = data.daily || {};
  const hourly = data.hourly || {};
  const nowTime = current.time;
  const hourIdx = Array.isArray(hourly.time)
    ? Math.max(0, hourly.time.indexOf(nowTime))
    : 0;

  const code = Number(current.weather_code ?? 0);
  const conditionText = weatherCodeToText(code);
  const iconMode = weatherCodeToIconMode(code);
  if (weatherIcon) weatherIcon.className = `weather-icon ${iconMode}`;

  if (weatherLocation)
    weatherLocation.textContent = placeLabel || "Current Location";
  if (weatherSummary)
    weatherSummary.textContent = "Real-time local weather context";
  if (weatherTemp)
    weatherTemp.textContent = `${Math.round(current.temperature_2m ?? 0)}°C`;
  if (weatherFeelsLike)
    weatherFeelsLike.textContent = `${Math.round(current.apparent_temperature ?? 0)}°C`;
  if (weatherCondition) weatherCondition.textContent = conditionText;
  if (weatherHumidity)
    weatherHumidity.textContent = `${Math.round(current.relative_humidity_2m ?? 0)}%`;
  if (weatherWind)
    weatherWind.textContent = `${Math.round(current.wind_speed_10m ?? 0)} km/h`;
  if (weatherPressure)
    weatherPressure.textContent = `${Math.round(current.surface_pressure ?? 0)} hPa`;
  if (weatherVisibility)
    weatherVisibility.textContent =
      current.visibility != null
        ? `${(current.visibility / 1000).toFixed(1)} km`
        : "--";
  if (weatherUvNow)
    weatherUvNow.textContent = `${(current.uv_index ?? 0).toFixed(1)}`;
  if (weatherUvMax)
    weatherUvMax.textContent =
      daily.uv_index_max?.[0] != null
        ? `${Number(daily.uv_index_max[0]).toFixed(1)}`
        : "--";

  const sunrise = daily.sunrise?.[0] ? new Date(daily.sunrise[0]) : null;
  const sunset = daily.sunset?.[0] ? new Date(daily.sunset[0]) : null;
  if (weatherSunrise)
    weatherSunrise.textContent = sunrise
      ? sunrise.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--";
  if (weatherSunset)
    weatherSunset.textContent = sunset
      ? sunset.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--";
  if (weatherDaylight) {
    if (sunrise && sunset) {
      const mins = Math.max(0, Math.round((sunset - sunrise) / 60000));
      weatherDaylight.textContent = `${Math.floor(mins / 60)}h ${mins % 60}m`;
    } else weatherDaylight.textContent = "--";
  }

  if (sunTimeline) {
    weatherSunState.sunrise = sunrise;
    weatherSunState.sunset = sunset;
    updateSunTimelineMotion();
    if (!weatherSunTimerStarted) {
      weatherSunTimerStarted = true;
      setInterval(updateSunTimelineMotion, 60 * 1000);
    }
  }

  const pollen = computePollenRisk(hourly, hourIdx);
  if (weatherPollen)
    weatherPollen.textContent =
      pollen.score == null
        ? pollen.level
        : `${pollen.level} (${Math.round(pollen.score)})`;
  if (weatherPm25)
    weatherPm25.textContent =
      hourly.pm2_5?.[hourIdx] != null
        ? `${Number(hourly.pm2_5[hourIdx]).toFixed(1)} ug/m3`
        : "-- ug/m3";
  if (weatherPm10)
    weatherPm10.textContent =
      hourly.pm10?.[hourIdx] != null
        ? `${Number(hourly.pm10[hourIdx]).toFixed(1)} ug/m3`
        : "-- ug/m3";

  const uv = Number(current.uv_index ?? 0);
  const advice =
    uv >= 8 || pollen.level === "High"
      ? "Mask + SPF advised"
      : uv >= 5
        ? "Carry sun protection"
        : "Conditions manageable";
  if (weatherAdvice) weatherAdvice.textContent = advice;

  if (weatherHourly) {
    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const uvs = hourly.uv_index || [];
    const codes = hourly.weather_code || [];
    const start = Math.max(0, hourIdx);
    const chips = [];
    for (let i = start; i < Math.min(start + 12, times.length); i += 1) {
      const t = new Date(times[i]).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const isNow = i === start ? "now" : "";
      const cond = weatherCodeToText(Number(codes[i] ?? code)).split(" ")[0];
      chips.push(`
        <div class="hour-chip ${isNow}">
          <div class="hour-head"><p>${t}</p><span class="hour-icon"></span></div>
          <strong>${Math.round(temps[i] ?? 0)}°C</strong>
          <p>${cond}</p>
          <p>UV ${Number(uvs[i] ?? 0).toFixed(1)}</p>
        </div>
      `);
    }
    weatherHourly.innerHTML =
      chips.join("") || '<div class="hour-chip"><p>No hourly data</p></div>';
  }

  if (weatherDaily) {
    const dates = daily.time || [];
    const maxT = daily.temperature_2m_max || [];
    const minT = daily.temperature_2m_min || [];
    const maxUv = daily.uv_index_max || [];
    const precip = daily.precipitation_probability_max || [];
    const rows = [];
    for (let i = 0; i < Math.min(5, dates.length); i += 1) {
      const day = new Date(`${dates[i]}T00:00:00`).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      rows.push(
        `<div class="day-row"><span>${day}</span><span>${Math.round(minT[i] ?? 0)}°/${Math.round(maxT[i] ?? 0)}°</span><span>UV ${Number(maxUv[i] ?? 0).toFixed(1)}</span><span>Rain ${Math.round(precip[i] ?? 0)}%</span></div>`,
      );
    }
    weatherDaily.innerHTML =
      rows.join("") ||
      '<div class="day-row"><span>No forecast data</span></div>';
  }

  weatherLoaded = true;
  if (weatherUpdatedAt) {
    weatherUpdatedAt.textContent = `Last updated: ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  }
}

function requestWeatherByLocation() {
  if (!navigator.geolocation) {
    setWeatherLoadingState("Geolocation not supported by this browser.");
    return;
  }
  setWeatherLoadingState("Locating you...");
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      weatherCoords = { latitude, longitude };
      setWeatherLoadingState("Fetching weather...");
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,surface_pressure,visibility,uv_index&hourly=temperature_2m,weather_code,uv_index,pm2_5,pm10&daily=sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=7`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather API error");
        const data = await res.json();
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        );
        const geoData = geoRes.ok ? await geoRes.json() : null;
        const city =
          geoData?.address?.city ||
          geoData?.address?.town ||
          geoData?.address?.state ||
          "Your Location";
        renderWeather(data, city);
        showToast("Weather updated.", "success");
      } catch {
        setWeatherLoadingState("Could not load weather data. Try again later.");
      }
    },
    () => {
      setWeatherLoadingState(
        "Location access denied. Enable location to see your weather.",
      );
    },
    { timeout: 10000 },
  );
}

function loadWeatherFallback() {
  requestWeatherByLocation();
}

function saveUniversalIdState() {
  try {
    localStorage.setItem(
      UNIVERSAL_ID_STORAGE_KEY,
      JSON.stringify(universalIdState),
    );
  } catch (error) {
    // Ignore storage failures.
  }
}

function loadUniversalIdState() {
  try {
    const raw = localStorage.getItem(UNIVERSAL_ID_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.code && /^\d{8}$/.test(parsed.code)) {
      universalIdState.code = parsed.code;
      universalIdState.lastUpdatedAt = parsed.lastUpdatedAt || null;
    }
  } catch (error) {
    // Ignore bad persisted data and continue defaults.
  }
}

function getDefaultPrescriptionEndIso() {
  const end = new Date();
  end.setDate(end.getDate() + 5);
  end.setHours(23, 59, 0, 0);
  return end.toISOString();
}

function saveMedicationState() {
  try {
    localStorage.setItem(
      MEDICATION_STATE_STORAGE_KEY,
      JSON.stringify({
        reminders: medicationState.reminders,
      }),
    );
  } catch (error) {
    // Ignore storage failures.
  }
}

function loadMedicationState() {
  try {
    const raw = localStorage.getItem(MEDICATION_STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.reminders && typeof parsed.reminders === "object") {
        medicationState.reminders = {
          ...defaultReminderProfile,
          ...parsed.reminders,
        };
      }
    }
  } catch (error) {
    // Ignore bad persisted data and continue defaults.
  }

  // Completion state is intentionally session-only:
  // refresh should always restore normal medication view.
  medicationState.prescriptionEndAt = getDefaultPrescriptionEndIso();
  medicationState.prescriptionEndedHandled = false;
}

function getPrescriptionTimerInfo() {
  const endAt = new Date(
    medicationState.prescriptionEndAt || getDefaultPrescriptionEndIso(),
  );
  const msLeft = endAt.getTime() - Date.now();
  if (msLeft <= 0) {
    return {
      expired: true,
      shortText: "Prescription ended",
      detailText: "Prescription ended",
    };
  }

  const totalMinutes = Math.floor(msLeft / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  let shortText = "";
  if (days > 0) shortText = `${days}d ${hours}h left`;
  else shortText = `${hours}h ${minutes}m left`;

  return {
    expired: false,
    shortText,
    detailText: `Prescription ends in ${days}d ${hours}h ${minutes}m`,
  };
}

function renderDoseTimers() {
  const timer = getPrescriptionTimerInfo();
  const liveDoseCards = Array.from(
    document.querySelectorAll("[data-dose-card]"),
  );

  liveDoseCards.forEach((card) => {
    let timerEl = card.querySelector("[data-dose-timer]");
    if (!timerEl) {
      timerEl = document.createElement("p");
      timerEl.className = "hint dose-timer";
      timerEl.setAttribute("data-dose-timer", "true");
      const button = card.querySelector("[data-dose-btn]");
      if (button) card.insertBefore(timerEl, button);
      else card.appendChild(timerEl);
    }
    timerEl.textContent = timer.expired
      ? "Doctor timer: prescription ended"
      : `Doctor timer: ${timer.shortText}`;
  });
}

function openConfigureRemindersModal() {
  const reminders = medicationState.reminders;
  const timer = getPrescriptionTimerInfo();
  openModal(
    "Configure Medicine Reminders",
    `
      <p class="hint">Set your routine so reminders are easier to follow.</p>
      <div class="card-grid two-col">
        <label>Breakfast time<input class="add-flow-search" type="time" data-reminder-input="breakfast" value="${reminders.breakfast}" /></label>
        <label>Lunch time<input class="add-flow-search" type="time" data-reminder-input="lunch" value="${reminders.lunch}" /></label>
        <label>Snacks time (optional)<input class="add-flow-search" type="time" data-reminder-input="snacks" value="${reminders.snacks}" /></label>
        <label>Dinner time<input class="add-flow-search" type="time" data-reminder-input="dinner" value="${reminders.dinner}" /></label>
        <label>Wake-up time<input class="add-flow-search" type="time" data-reminder-input="wakeUp" value="${reminders.wakeUp}" /></label>
        <label>Night dose / Bedtime<input class="add-flow-search" type="time" data-reminder-input="sleep" value="${reminders.sleep}" /></label>
      </div>
      <label>Reminder before dose (minutes)
        <input class="add-flow-search" type="number" min="0" max="120" step="5" data-reminder-input="reminderLead" value="${reminders.reminderLead}" />
      </label>
      <p class="hint">Current doctor timer: ${timer.detailText}</p>
      <div class="button-row">
        <button class="btn" data-action="save-reminders">Save Reminders</button>
        <button class="ghost-btn" data-action="cancel-reminders">Cancel</button>
      </div>
    `,
  );
}

function completePrescriptionCycle(silent = false) {
  const scheduleCard = document
    .querySelector("#medicines .dose-grid")
    ?.closest(".glass.card");
  if (scheduleCard) {
    scheduleCard.innerHTML = `
      <h2>Today's Schedule</h2>
      <div class="meds-all-good">
        <div class="meds-all-good-tick" aria-hidden="true">?</div>
        <p>Your prescription is over, If not satisfied, please consult your medical councellor.</p>
        <p><strong>All looks good.</strong></p>
      </div>
    `;
  }

  if (medProgressValue) medProgressValue.textContent = "0/0";
  if (medProgressBar) medProgressBar.style.width = "100%";
  if (nextDoseText) nextDoseText.textContent = "All looks good.";

  if (!silent) {
    openSmoothSuccessModal(
      "Prescription Completed",
      `
        <p>Your prescription is over, If not satisfied, please consult your medical councellor.</p>
        <p><strong>All looks good.</strong></p>
      `,
    );
    showToast("Prescription course completed.", "success");
  }

  medicationState.prescriptionEndedHandled = true;
  saveMedicationState();
  renderMedicationPlanCompletionState();
}

function evaluatePrescriptionTimerState() {
  renderDoseTimers();
  const timer = getPrescriptionTimerInfo();
  if (timer.expired) {
    const hasDoseChecklist = Boolean(
      document.querySelector("#medicines [data-dose-card]"),
    );
    if (hasDoseChecklist) {
      completePrescriptionCycle(medicationState.prescriptionEndedHandled);
    }
  }
  renderMedicationPlanCompletionState();
}

function renderMedicationPlanCompletionState() {
  if (!medplanCompletionBanner || !medplanSection) return;
  const timer = getPrescriptionTimerInfo();
  const isCompleted = medicationState.prescriptionEndedHandled || timer.expired;
  if (!isCompleted) {
    medplanSection.classList.remove("medplan-complete-only");
    medplanCompletionBanner.classList.remove("active");
    medplanCompletionBanner.innerHTML = "";
    return;
  }

  medplanSection.classList.add("medplan-complete-only");
  medplanCompletionBanner.classList.add("active");
  medplanCompletionBanner.innerHTML = `<span>Your're all set ${profileState.name}</span>`;
}

function getUniversalIdLockInfo() {
  if (!universalIdState.lastUpdatedAt)
    return { locked: false, remainingText: "" };
  const updated = new Date(universalIdState.lastUpdatedAt);
  const unlockAt = new Date(
    updated.getTime() + universalIdState.lockDays * 24 * 60 * 60 * 1000,
  );
  const msLeft = unlockAt.getTime() - Date.now();
  if (msLeft <= 0) return { locked: false, remainingText: "" };

  const days = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  return { locked: true, remainingText: `${days} day${days > 1 ? "s" : ""}` };
}

let _qrInstance = null;
let _qrDurMins = 60;

function buildQrUrl() {
  return `${API_BASE_URL.replace("/api", "")}/patient-record?code=${encodeURIComponent(universalIdState.code)}&dur=${_qrDurMins}`;
}

function generateQrCode(url) {
  const container = document.getElementById("myQrCanvas");
  if (!container) return;
  if (typeof QRCode === "undefined") {
    // QRCode library not yet loaded — retry shortly
    setTimeout(() => generateQrCode(url), 300);
    return;
  }
  container.innerHTML = "";
  _qrInstance = new QRCode(container, {
    text: url,
    width: 220,
    height: 220,
    colorDark: "#52ff9d",
    colorLight: "#061220",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

function renderUniversalIdState() {
  if (nfcUniversalCodeEl)
    nfcUniversalCodeEl.textContent = universalIdState.code;
  if (settingsUniversalCodeEl)
    settingsUniversalCodeEl.textContent = universalIdState.code;
  if (myQrCodeEl) myQrCodeEl.textContent = universalIdState.code;
  const accessUrl = buildQrUrl();
  if (myQrAccessUrlEl) myQrAccessUrlEl.textContent = accessUrl;
  generateQrCode(accessUrl);

  if (editUniversalIdBtn) {
    const lock = getUniversalIdLockInfo();
    editUniversalIdBtn.disabled = lock.locked;
    editUniversalIdBtn.textContent = lock.locked
      ? `Edit Universal ID (Unavailable ${lock.remainingText})`
      : "Edit Universal ID";
    editUniversalIdBtn.style.opacity = lock.locked ? "0.55" : "1";
    editUniversalIdBtn.style.cursor = lock.locked ? "not-allowed" : "pointer";
  }
}

function openUniversalIdEditModal() {
  const lock = getUniversalIdLockInfo();
  if (lock.locked) {
    openModal(
      "Universal ID Temporarily Locked",
      `<p>You can update your Universal ID again in ${lock.remainingText}.</p>`,
    );
    showToast("Universal ID edit is temporarily unavailable.", "error");
    return;
  }

  openModal(
    "Edit Universal ID (OTP Required)",
    `
      <p>Current MEIOSIS Code: <strong>${universalIdState.code}</strong></p>
      <p class="hint">Enter your new 10-digit code and the OTP sent to your registered mobile.</p>
      <input class="add-flow-search" data-uid-new-code type="text" maxlength="10" inputmode="numeric" placeholder="New 10-digit MEIOSIS code" />
      <input class="add-flow-search" data-uid-otp type="text" maxlength="6" inputmode="numeric" placeholder="6-digit OTP" autocomplete="one-time-code" />
      <div class="button-row">
        <button class="btn" data-uid-save>Verify & Save</button>
        <button class="ghost-btn" data-uid-cancel>Cancel</button>
      </div>
    `,
  );
}

function saveUniversalId(newCode) {
  universalIdState.code = newCode;
  universalIdState.lastUpdatedAt = new Date().toISOString();
  saveUniversalIdState();
  renderUniversalIdState();
}

function renderProfileState() {
  if (profileNameEl) profileNameEl.textContent = profileState.name;
  if (myQrPatientNameEl) myQrPatientNameEl.textContent = profileState.name;
  if (profileEmailEl) profileEmailEl.textContent = profileState.email;
  if (profilePhoneEl) profilePhoneEl.textContent = profileState.phone;
  if (profileAddressEl) profileAddressEl.textContent = profileState.address;
  if (profileLanguageEl) profileLanguageEl.textContent = profileState.language;
  if (dashboardGreeting) {
    const hour = new Date().getHours();
    const salutation =
      hour < 12
        ? "Good Morning"
        : hour < 17
          ? "Good Afternoon"
          : "Good Evening";
    dashboardGreeting.textContent = `${salutation}, ${profileState.name}`;
  }
  renderMedicationPlanCompletionState();
}

function formatDisplayDate(
  dateInput,
  options = { day: "2-digit", month: "short", year: "numeric" },
) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-IN", options);
}

function animateHomeAppointmentCount(targetCount, element, frameKey = "chart") {
  if (!element) return;
  const frameRef = homeActivityAnimationFrames[frameKey] || null;
  if (frameRef) cancelAnimationFrame(frameRef);

  const safeTarget = Math.max(0, Number(targetCount) || 0);
  const startTime = performance.now();
  const duration = 640;

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(safeTarget * eased);
    element.textContent = `${value}`;
    if (progress < 1) {
      homeActivityAnimationFrames[frameKey] = requestAnimationFrame(step);
    } else {
      homeActivityAnimationFrames[frameKey] = null;
    }
  };

  element.textContent = "0";
  homeActivityAnimationFrames[frameKey] = requestAnimationFrame(step);
}

function getHomeAppointmentActivityConfig(index) {
  return (
    [
      { label: "24hrs", bucketCount: 6, type: "hour-block" },
      { label: "Week", bucketCount: 4, type: "week" },
      { label: "Month", bucketCount: 4, type: "month" },
      { label: "Year", bucketCount: 4, type: "year" },
    ][index] || { label: "Week", bucketCount: 4, type: "week" }
  );
}

function buildHomeActivityBuckets(config, entries) {
  const now = new Date();
  const buckets = [];

  if (config.type === "hour-block") {
    const base = new Date(now);
    base.setMinutes(0, 0, 0);
    for (let index = config.bucketCount - 1; index >= 0; index -= 1) {
      const start = new Date(base);
      start.setHours(base.getHours() - index * 4 - 3);
      const end = new Date(start);
      end.setHours(start.getHours() + 4);
      buckets.push({
        label: start
          .toLocaleTimeString("en-IN", { hour: "numeric", hour12: true })
          .replace(/\s/g, ""),
        fullLabel: `${start.toLocaleTimeString("en-IN", { hour: "numeric", hour12: true })} - ${new Date(end.getTime() - 1).toLocaleTimeString("en-IN", { hour: "numeric", hour12: true })}`,
        items: entries.filter(
          (entry) => entry.date >= start && entry.date < end,
        ),
      });
    }
  } else if (config.type === "week") {
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    for (let index = config.bucketCount - 1; index >= 0; index -= 1) {
      const end = new Date(base);
      end.setDate(base.getDate() - index * 7 + 1);
      const start = new Date(end);
      start.setDate(end.getDate() - 7);
      const endDisplay = new Date(end.getTime() - 86400000);
      buckets.push({
        label: `${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`,
        fullLabel: `${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${endDisplay.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
        items: entries.filter(
          (entry) => entry.date >= start && entry.date < end,
        ),
      });
    }
  } else if (config.type === "month") {
    const base = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let index = config.bucketCount - 1; index >= 0; index -= 1) {
      const start = new Date(base.getFullYear(), base.getMonth() - index, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      buckets.push({
        label: start.toLocaleDateString("en-IN", { month: "short" }),
        fullLabel: start.toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        }),
        items: entries.filter(
          (entry) => entry.date >= start && entry.date < end,
        ),
      });
    }
  } else {
    const baseYear = now.getFullYear();
    for (let index = config.bucketCount - 1; index >= 0; index -= 1) {
      const year = baseYear - index;
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      buckets.push({
        label: String(year),
        fullLabel: String(year),
        items: entries.filter(
          (entry) => entry.date >= start && entry.date < end,
        ),
      });
    }
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    fullLabel: bucket.fullLabel,
    count: bucket.items.length,
  }));
}

function buildHomeMetricEntries(collection, dateKeys) {
  return collection
    .map((entry) => {
      const value = dateKeys
        .map((key) => entry?.[key])
        .find(
          (candidate) =>
            candidate && !Number.isNaN(new Date(candidate).getTime()),
        );
      if (!value) return null;
      return { entry, date: new Date(value) };
    })
    .filter(Boolean);
}

function renderHomeMetricBars(container, series, kind) {
  if (!container) return;
  const max = Math.max(...series.map((bucket) => bucket.count), 1);
  container.style.setProperty("--appointment-bar-count", String(series.length));
  container.innerHTML = series
    .map((bucket, index) => {
      const ratio = bucket.count / max;
      const height = bucket.count === 0 ? 3 : Math.max(ratio * 100, 4);
      return `
      <button
        type="button"
        class="home-appointment-bar-wrap"
        data-activity-kind="${kind}"
        data-activity-label="${bucket.fullLabel}"
        data-activity-count="${bucket.count}"
        style="--bar-delay:${index * 50}ms;"
        aria-label="${bucket.fullLabel}: ${bucket.count} ${kind}"
      >
        <span class="home-appointment-bar-value">${bucket.count}</span>
        <span class="home-appointment-bar" style="height:${height}%"></span>
      </button>
    `;
    })
    .join("");
}

function renderHomeAppointmentActivity() {
  const config = getHomeAppointmentActivityConfig(homeAppointmentRangeIndex);
  const appointmentSeries = buildHomeActivityBuckets(
    config,
    buildHomeMetricEntries(Object.values(appointments), ["scheduledDate"]),
  );
  const prescriptionSeries = buildHomeActivityBuckets(
    config,
    buildHomeMetricEntries(prescriptionState, [
      "startDate",
      "createdAt",
      "endDate",
    ]),
  );
  const labSeries = buildHomeActivityBuckets(
    config,
    buildHomeMetricEntries(labReportsState, [
      "reportDate",
      "createdAt",
      "updatedAt",
    ]),
  );
  const total = appointmentSeries.reduce(
    (sum, bucket) => sum + bucket.count,
    0,
  );
  const totalPrescriptions = prescriptionSeries.reduce(
    (sum, bucket) => sum + bucket.count,
    0,
  );
  const totalLabs = labSeries.reduce((sum, bucket) => sum + bucket.count, 0);
  const combinedTotal = total + totalPrescriptions + totalLabs;
  const appointmentPeak = appointmentSeries.reduce(
    (best, bucket) => (bucket.count > best.count ? bucket : best),
    appointmentSeries[0] || { label: "--", fullLabel: "No data", count: 0 },
  );
  const prescriptionPeak = prescriptionSeries.reduce(
    (best, bucket) => (bucket.count > best.count ? bucket : best),
    prescriptionSeries[0] || { label: "--", fullLabel: "No data", count: 0 },
  );
  const labPeak = labSeries.reduce(
    (best, bucket) => (bucket.count > best.count ? bucket : best),
    labSeries[0] || { label: "--", fullLabel: "No data", count: 0 },
  );
  const allBookedCount = Object.values(appointments).length;
  const upcomingCountValue = Object.values(appointments).filter(
    (appointment) => {
      const scheduled = new Date(
        `${appointment.scheduledDate}T${appointment.scheduledTime || "00:00"}`,
      );
      return (
        !Number.isNaN(scheduled.getTime()) &&
        scheduled >= new Date() &&
        String(appointment.status || "").toLowerCase() !== "cancelled"
      );
    },
  ).length;

  if (homeAppointmentRangeChip)
    homeAppointmentRangeChip.textContent = config.label;
  if (homeAppointmentRangeValue)
    homeAppointmentRangeValue.textContent = config.label;
  if (homeAppointmentActivityLead)
    homeAppointmentActivityLead.textContent = `Appointments, prescriptions, and lab reports across ${config.label.toLowerCase()} from your actual record.`;
  if (homeAppointmentChartMeta) {
    homeAppointmentChartMeta.textContent = combinedTotal
      ? `${combinedTotal} total record events in this range`
      : "No record activity in this range yet";
  }
  if (homeAppointmentChartMetaPrimary) {
    homeAppointmentChartMetaPrimary.textContent = appointmentPeak.count
      ? `Peak ${appointmentPeak.fullLabel} • ${appointmentPeak.count} booked`
      : "No booked appointments in this range";
  }
  if (homePrescriptionChartMeta) {
    homePrescriptionChartMeta.textContent = prescriptionPeak.count
      ? `Peak ${prescriptionPeak.fullLabel} • ${prescriptionPeak.count} prescriptions`
      : "No prescriptions in this range";
  }
  if (homeLabChartMeta) {
    homeLabChartMeta.textContent = labPeak.count
      ? `Peak ${labPeak.fullLabel} • ${labPeak.count} lab reports`
      : "No lab reports in this range";
  }
  if (homeAppointmentLabels) {
    homeAppointmentLabels.style.setProperty(
      "--appointment-bar-count",
      String(appointmentSeries.length),
    );
    homeAppointmentLabels.innerHTML = appointmentSeries
      .map((bucket) => `<span>${bucket.label}</span>`)
      .join("");
  }
  if (homeAppointmentRangeSlider) {
    homeAppointmentRangeSlider.value = String(homeAppointmentRangeIndex);
  }

  renderHomeMetricBars(homeAppointmentBars, appointmentSeries, "appointments");
  renderHomeMetricBars(
    homePrescriptionBars,
    prescriptionSeries,
    "prescriptions",
  );
  renderHomeMetricBars(homeLabBars, labSeries, "labs");

  animateHomeAppointmentCount(
    combinedTotal,
    homeAppointmentChartCount,
    "chart",
  );
  animateHomeAppointmentCount(
    total,
    homeAppointmentChartCountPrimary,
    "appointments",
  );
  animateHomeAppointmentCount(
    totalPrescriptions,
    homePrescriptionChartCount,
    "prescriptions",
  );
  animateHomeAppointmentCount(totalLabs, homeLabChartCount, "labs");
  animateHomeAppointmentCount(
    allBookedCount,
    homeAppointmentSummaryCount,
    "summary",
  );
  if (upcomingCount) upcomingCount.textContent = String(upcomingCountValue);
}

function replayHomeDashboardAnimations() {
  const homeSection = document.getElementById("home");
  if (!homeSection || !homeSection.classList.contains("active")) return;

  homeSection.classList.remove("home-dashboard-live");
  if (healthSlopeGraph) healthSlopeGraph.classList.remove("is-animated");
  if (homeDashboardMotionFrame) cancelAnimationFrame(homeDashboardMotionFrame);

  homeDashboardMotionFrame = requestAnimationFrame(() => {
    homeSection.classList.add("home-dashboard-live");
    if (healthSlopeGraph) {
      requestAnimationFrame(() =>
        healthSlopeGraph.classList.add("is-animated"),
      );
    }
    renderHomeAppointmentActivity();
  });
}

function renderHomeLatestPrescription() {
  const prescriptionsSortedLatest = [...prescriptionState].sort((a, b) => {
    const aTime = new Date(a.startDate || a.createdAt || 0).getTime();
    const bTime = new Date(b.startDate || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
  const rx = prescriptionsSortedLatest[0] || null;

  if (!rx) {
    if (homeLatestPrescriptionIssued)
      homeLatestPrescriptionIssued.textContent = "No prescriptions on file";
    if (homeLatestPrescriptionStatus) {
      homeLatestPrescriptionStatus.textContent = "Pending";
      homeLatestPrescriptionStatus.className = "chip";
    }
    if (homeLatestPrescriptionTitle)
      homeLatestPrescriptionTitle.textContent = "No prescription issued yet";
    if (homeLatestPrescriptionDoctor)
      homeLatestPrescriptionDoctor.textContent =
        "The latest doctor-issued plan will appear here.";
    if (homeLatestPrescriptionChips)
      homeLatestPrescriptionChips.innerHTML =
        '<span class="med-chip">Medication timeline empty</span>';
    if (homeLatestPrescriptionDuration)
      homeLatestPrescriptionDuration.textContent = "--";
    if (homeLatestPrescriptionRefills)
      homeLatestPrescriptionRefills.textContent = "--";
    if (homeLatestPrescriptionNote)
      homeLatestPrescriptionNote.textContent =
        "Visit Prescriptions to review documents, refills, and treatment details.";
    if (homeLatestPrescriptionViewBtn) {
      homeLatestPrescriptionViewBtn.dataset.docTitle = "";
      homeLatestPrescriptionViewBtn.dataset.docCode = "";
      homeLatestPrescriptionViewBtn.dataset.docFile = "";
      homeLatestPrescriptionViewBtn.disabled = true;
    }
    return;
  }

  const doctor = rx.doctor || {};
  const items = Array.isArray(rx.items) ? rx.items.filter(Boolean) : [];
  const displayStatus = toUiStatus(rx.status) || "Recorded";

  if (homeLatestPrescriptionIssued)
    homeLatestPrescriptionIssued.textContent = `Issued ${formatDisplayDate(rx.startDate || rx.createdAt)}`;
  if (homeLatestPrescriptionStatus) {
    homeLatestPrescriptionStatus.textContent = displayStatus;
    homeLatestPrescriptionStatus.className = `chip ${String(rx.status || "").toUpperCase() === "ACTIVE" ? "active" : "complete"}`;
  }
  if (homeLatestPrescriptionTitle)
    homeLatestPrescriptionTitle.textContent = rx.title || "Latest prescription";
  if (homeLatestPrescriptionDoctor) {
    homeLatestPrescriptionDoctor.textContent = `${doctor.name || "Doctor"}${doctor.specialty ? ` • ${doctor.specialty}` : ""}${doctor.hospital ? ` • ${doctor.hospital}` : ""}`;
  }
  if (homeLatestPrescriptionChips) {
    homeLatestPrescriptionChips.innerHTML = items.length
      ? items
          .slice(0, 3)
          .map(
            (item) =>
              `<span class="med-chip">${item.medicine}${item.dose ? ` ${item.dose}` : ""}</span>`,
          )
          .join("")
      : '<span class="med-chip">Medication details in file</span>';
  }
  if (homeLatestPrescriptionDuration) {
    homeLatestPrescriptionDuration.textContent = rx.durationDays
      ? `${rx.durationDays} days`
      : "--";
  }
  if (homeLatestPrescriptionRefills) {
    homeLatestPrescriptionRefills.textContent = Number.isFinite(
      Number(rx.refillCount),
    )
      ? `${rx.refillCount} refills`
      : "--";
  }
  if (homeLatestPrescriptionNote) {
    homeLatestPrescriptionNote.textContent =
      rx.doctorNote ||
      `${items.length ? `${items.length} medicine instructions available for review.` : "Prescription synced to your patient record."}`;
  }
  if (homeLatestPrescriptionViewBtn) {
    homeLatestPrescriptionViewBtn.dataset.docTitle = `${rx.title} - ${doctor.name || "Doctor"}`;
    homeLatestPrescriptionViewBtn.dataset.docCode = rx.id || "";
    homeLatestPrescriptionViewBtn.dataset.docFile = rx.documentPath || "";
    homeLatestPrescriptionViewBtn.disabled = false;
  }
}

function toUiStatus(value) {
  return (value || "")
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getChipClassFromLabStatus(status) {
  const key = (status || "").toString().toUpperCase();
  if (key === "NORMAL") return "active";
  if (key === "LOW") return "expired";
  return "expired";
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`API request failed: ${path}`);
  return response.json();
}

async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(data?.error || `API request failed: ${path}`);
    }
    return data;
  } catch (error) {
    if (
      error instanceof Error &&
      /Failed to fetch|NetworkError|Load failed/i.test(error.message)
    ) {
      throw new Error("Backend not reachable.");
    }
    throw error;
  }
}

function getLoggedInPatientId() {
  return authSession?.patientId || backendState.patientId || null;
}

function toAbsoluteDocumentUrl(filePath) {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${API_BASE_URL.replace("/api", "")}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
}

function resolveDocumentUrl(
  docType,
  docCode,
  _currentFile = "",
  mode = "view",
) {
  // Always route through the API — ensures latest PDF template + watermark is used
  if (docType === "prescription" && docCode) {
    return `${API_BASE_URL}/prescriptions/${encodeURIComponent(docCode)}/pdf${mode === "download" ? "?download=1" : ""}`;
  }

  if (docType === "lab" && docCode) {
    return `${API_BASE_URL}/labs/${encodeURIComponent(docCode)}/pdf${mode === "download" ? "?download=1" : ""}`;
  }

  if (docType === "summary") {
    const patientId = getLoggedInPatientId();
    if (!patientId) return "";
    return `${API_BASE_URL}/patient/${encodeURIComponent(patientId)}/summary-pdf${mode === "download" ? "?download=1" : ""}`;
  }

  if (docType === "audit") {
    const patientId = getLoggedInPatientId();
    if (!patientId) return "";
    return `${API_BASE_URL}/patient/${encodeURIComponent(patientId)}/audit-pdf${mode === "download" ? "?download=1" : ""}`;
  }

  return "";
}

function triggerDocumentDownload(url, filenameHint = "document.pdf") {
  const link = document.createElement("a");
  link.href = url;
  link.download = filenameHint;
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const _VITAL_DEFS = [
  { key: "BP", label: "Blood Pressure", unit: "mmHg" },
  { key: "HR", label: "Heart Rate", unit: "bpm" },
  { key: "Temp", label: "Temperature", unit: "°F" },
  { key: "SpO2", label: "SpO2", unit: "%" },
  { key: "Ht", label: "Height", unit: "cm" },
  { key: "Wt", label: "Weight", unit: "kg" },
];

function parseVitalsFromNote(doctorNote) {
  const found = {};
  const line = (doctorNote || "")
    .split("\n")
    .find((l) => l.startsWith("Vitals — "));
  if (line) {
    for (const part of line.replace("Vitals — ", "").split(" | ")) {
      const idx = part.indexOf(": ");
      if (idx !== -1)
        found[part.slice(0, idx).trim()] = part.slice(idx + 2).trim();
    }
  }
  return _VITAL_DEFS.map((def) => ({ ...def, value: found[def.key] || null }));
}

/* ── iOS-style Prescription View Modal ──────────────────────── */
function buildRxViewHtml(code) {
  const rx = prescriptionState.find((r) => r.id === code);
  if (!rx)
    return `<p class="hint">Prescription data not found. Try refreshing your records.</p>`;

  const doctor = rx.doctor || {};
  const items = Array.isArray(rx.items) ? rx.items : [];
  const status =
    (rx.status || "").toUpperCase() === "ACTIVE" ? "active" : "complete";
  const statusLabel = status === "active" ? "Active" : "Completed";
  const startDate = formatDisplayDate(rx.startDate, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const endDate = formatDisplayDate(rx.endDate, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const adherence = Number(rx.adherenceScore || 0);
  const dlUrl = resolveDocumentUrl("prescription", code, "", "download");

  // Labs ordered under this prescription
  const linkedLabs = labReportsState.filter((l) => l.prescriptionId === rx.id);

  // Parse vitals separately so they get a dedicated grid
  const vitals = parseVitalsFromNote(rx.doctorNote);

  // Parse clinical note sections (skip the vitals line)
  const noteLines = (rx.doctorNote || "").split("\n").filter(Boolean);
  const prefixes = [
    ["Chief Complaint: ", "Chief Complaint"],
    ["Subjective: ", "Symptoms"],
    ["Assessment: ", "Diagnosis / Assessment"],
    ["Plan: ", "Plan"],
  ];
  const noteRows = noteLines
    .flatMap((line) => {
      if (line.startsWith("Vitals — ")) return [];
      for (const [prefix, label] of prefixes) {
        if (line.startsWith(prefix)) {
          return [
            `<div class="rx-view-note-row">
          <span class="rx-view-note-key">${label}</span>
          <p class="rx-view-note-val">${line.slice(prefix.length)}</p>
        </div>`,
          ];
        }
      }
      return [];
    })
    .join("");

  const medRows = items
    .map(
      (i) => `
    <tr>
      <td>
        <span class="rx-med-name">${i.medicine || "N/A"}</span>
        ${i.reason && i.reason !== "N/A" && i.reason !== "—" ? `
        <p class="rx-med-doctor-note">
          <span class="rx-med-doctor-note-label">DOCTOR'S NOTE</span>
          ${i.reason}
        </p>` : ""}
      </td>
      <td>${i.dose || "N/A"}</td>
      <td>${i.frequency || "N/A"}</td>
      <td>${i.timing || "N/A"}</td>
    </tr>`,
    )
    .join("");

  const noMedRow = `<tr><td colspan="4" style="color:var(--muted);font-style:italic;padding:12px 0;">No medicines prescribed.</td></tr>`;

  return `
    <div class="rx-view">
      <div class="rx-view-hero">
        <p class="rx-view-eyebrow">MEIOSIS Prescription</p>
        <h3 class="rx-view-hero-title">${rx.title || "Consultation Record"}</h3>
        <div class="rx-view-hero-foot">
          <span class="chip ${status}">${statusLabel}</span>
          <span class="hint">${startDate} → ${endDate}</span>
        </div>
      </div>

      <div class="rx-view-meta">
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Doctor</p>
          <p class="rx-view-tile-value">${doctor.name || "N/A"}</p>
        </div>
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Specialty</p>
          <p class="rx-view-tile-value">${doctor.specialty || "General Medicine"}</p>
        </div>
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Follow-up Date</p>
          <p class="rx-view-tile-value">${endDate}</p>
        </div>
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Duration</p>
          <p class="rx-view-tile-value">${rx.durationDays || "N/A"} days</p>
        </div>
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Pharmacy</p>
          <p class="rx-view-tile-value${rx.pharmacy ? "" : " rx-view-not-entered"}">${rx.pharmacy || "N/A"}</p>
        </div>
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Adherence</p>
          <p class="rx-view-tile-value">${adherence}%</p>
        </div>
      </div>

      <div class="rx-view-section">
        <p class="rx-view-section-head">💊 Medications</p>
        <table class="rx-med-table">
          <thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th></tr></thead>
          <tbody>${items.length > 0 ? medRows : noMedRow}</tbody>
        </table>
      </div>

      <div class="rx-view-section">
        <p class="rx-view-section-head">🩺 Vitals</p>
        <div class="rx-view-meta">
          ${vitals
            .map(
              (v) => `
          <div class="rx-view-tile">
            <p class="rx-view-tile-label">${v.label}</p>
            <p class="rx-view-tile-value${v.value ? "" : " rx-view-not-entered"}">${v.value ? `${v.value} ${v.unit}` : "N/A"}</p>
          </div>`,
            )
            .join("")}
        </div>
      </div>

      ${
        noteRows
          ? `
      <div class="rx-view-section">
        <p class="rx-view-section-head">📋 Clinical Notes</p>
        ${noteRows}
      </div>`
          : ""
      }

      ${
        linkedLabs.length > 0
          ? `
      <div class="rx-view-section">
        <p class="rx-view-section-head">🔬 Lab Tests Ordered</p>
        ${linkedLabs
          .map(
            (l) => `
        <div class="rx-view-note-row">
          <span class="rx-view-note-key">${l.testName}</span>
          <p class="rx-view-note-val" style="color:var(--muted);">${(l.status || "Pending").charAt(0) + (l.status || "Pending").slice(1).toLowerCase()}</p>
        </div>`,
          )
          .join("")}
      </div>`
          : ""
      }

      <div class="rx-view-section">
        <p class="rx-view-section-head">📊 Adherence</p>
        <p class="hint" style="margin-bottom:6px;">${adherence}% compliance over last 30 days</p>
        <div class="rx-adhere-bar"><div class="rx-adhere-fill" style="width:${adherence}%"></div></div>
      </div>

      <div class="button-row">
        <a class="btn" href="${dlUrl}" target="_blank" rel="noopener noreferrer">Download PDF</a>
        <button class="ghost-btn" onclick="closeDetailModal()">Close</button>
      </div>
    </div>`;
}

/* ── iOS-style Lab Report View Modal ─────────────────────────── */
function buildLabViewHtml(code) {
  const lab = labReportsState.find((l) => l.id === code);
  if (!lab)
    return `<p class="hint">Lab report data not found. Try refreshing your records.</p>`;

  const doctor = lab.doctor || {};
  const status = (lab.status || "PENDING").toUpperCase();
  const chipCls =
    status === "ABNORMAL"
      ? "error"
      : status === "LOW"
        ? "pending"
        : status === "NORMAL"
          ? "active"
          : "pending";
  const dateStr = formatDisplayDate(lab.reportDate, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const dlUrl = resolveDocumentUrl("lab", code, "", "download");

  return `
    <div class="lab-view">
      <div class="lab-view-hero">
        <p class="lab-view-eyebrow">MEIOSIS Lab Report</p>
        <h3 class="lab-view-title">${lab.testName}</h3>
        <span class="chip ${chipCls}">${toUiStatus(status)}</span>
      </div>

      <div class="rx-view-meta">
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Doctor</p>
          <p class="rx-view-tile-value">${doctor.name || "—"}</p>
        </div>
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Report Date</p>
          <p class="rx-view-tile-value">${dateStr}</p>
        </div>
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Status</p>
          <p class="rx-view-tile-value">${toUiStatus(status)}</p>
        </div>
        <div class="rx-view-tile">
          <p class="rx-view-tile-label">Specialty</p>
          <p class="rx-view-tile-value">${doctor.specialty || "General Medicine"}</p>
        </div>
      </div>

      ${
        lab.educationalAi
          ? `
      <div class="lab-view-section">
        <p class="lab-view-section-head">🔬 Clinical Summary</p>
        <p style="font-size:13.5px;line-height:1.7;margin:0;">${lab.educationalAi}</p>
      </div>`
          : ""
      }

      <div class="button-row">
        <a class="btn" href="${dlUrl}" target="_blank" rel="noopener noreferrer">Download PDF</a>
        <button class="ghost-btn" onclick="closeDetailModal()">Close</button>
      </div>
    </div>`;
}

async function loadDoctorSlotsFromApi(doctorId) {
  try {
    const slots = await apiGet(`/doctors/${doctorId}/slots`);
    return slots.map((slot) => {
      const startAt = new Date(slot.startAt);
      return {
        date: startAt.toISOString().slice(0, 10),
        time: startAt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mode: slot.mode === "TELECONSULT" ? "Teleconsult" : "In-person",
        wait: slot.mode === "TELECONSULT" ? "5 mins" : "12 mins",
        location: slot.location || "Backend slot",
        token: slot.id,
      };
    });
  } catch (error) {
    return [];
  }
}

function mergeDoctorData(apiDoctors) {
  doctorDirectory.length = 0;
  apiDoctors.forEach((doctor) => {
    doctorDirectory.push({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      hospital: doctor.hospital,
      consultFee: doctor.consultFee,
      rating: doctor.rating,
      workingHours: doctor.workingHours,
      meiosisId: doctor.meiosisId,
      slots: doctor.slots || [],
    });
  });
}

function mergeAppointmentData(apiAppointments) {
  Object.keys(appointments).forEach((key) => delete appointments[key]);
  apiAppointments.forEach((appointment) => {
    const scheduledAt = new Date(appointment.scheduledDate);
    appointments[appointment.id] = {
      doctor: appointment.doctor?.name || "Doctor",
      doctorId: appointment.doctorId || appointment.doctor?.id || "",
      specialty: appointment.doctor?.specialty || "General Medicine",
      hospital: appointment.doctor?.hospital || "Hospital",
      mode: appointment.mode === "TELECONSULT" ? "Teleconsult" : "In-person",
      purpose: appointment.purpose || appointment.title || "Consultation",
      scheduledDate: scheduledAt.toISOString().slice(0, 10),
      scheduledTime: scheduledAt.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: toUiStatus(appointment.status),
      appointmentSlotId:
        appointment.appointmentSlotId ||
        appointment.doctorSlotId ||
        appointment.id,
      slotId:
        appointment.appointmentSlotId ||
        appointment.doctorSlotId ||
        appointment.id,
      notes: appointment.notes || "",
      queueNumber: appointment.queueEntry?.queueNo || null,
      paymentMethod: appointment.paymentMethod || "",
      paymentStatus: appointment.paymentStatus || "PENDING",
      paymentAmount:
        appointment.payment?.amount ||
        (appointment.doctorFee || 0) + (appointment.platformFee || 0),
      refundStatus: appointment.refundStatus || "NONE",
      refundAmount: appointment.refundAmount || 0,
      slots: appointment.doctor?.slots || [],
    };
  });
}

async function refreshSchedulingDataFromBackend() {
  if (!backendState.online) return false;

  try {
    const [appointmentsPayload, doctorsPayload] = await Promise.all([
      apiGet("/appointments"),
      apiGet("/doctors"),
    ]);

    const doctorsWithSlots = await Promise.all(
      doctorsPayload.map(async (doctor) => ({
        ...doctor,
        slots: await loadDoctorSlotsFromApi(doctor.id),
      })),
    );

    mergeDoctorData(doctorsWithSlots);
    mergeAppointmentData(appointmentsPayload);
    renderDoctorNetwork();
    renderMessagesDoctorList();
    renderAppointments();
    return true;
  } catch (error) {
    backendState.online = false;
    return false;
  }
}

function mergeMessageThreads(apiThreads) {
  messageState.selectedDoctorId =
    messageState.selectedDoctorId || apiThreads[0]?.doctorId || null;
  messageState.threads = {};
  messageState.threadIds = {};
  apiThreads.forEach((thread) => {
    messageState.threadIds[thread.doctorId] = thread.id;
    messageState.threads[thread.doctorId] = (thread.messages || []).map(
      (message) => ({
        from:
          (message.sender || "").toLowerCase() === "patient"
            ? "user"
            : "doctor",
        text: message.text,
        time: new Date(message.createdAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }),
    );
  });
  // NOTE: do NOT reset _renderedCount here — the render cursor is managed by
  // renderMessagesThread so only genuinely new messages get appended each poll.
}

function renderHomeSummary() {
  const activePlans = prescriptionState.filter(
    (item) => (item.status || "").toUpperCase() === "ACTIVE",
  ).length;
  const abnormalLabs = labReportsState.filter((item) =>
    ["ABNORMAL", "LOW"].includes((item.status || "").toUpperCase()),
  ).length;
  if (activePrescriptionCount)
    activePrescriptionCount.textContent = `${activePlans}`;
  if (newReportsCount) newReportsCount.textContent = `${abnormalLabs}`;
  renderHomeLatestPrescription();
  renderHomeAppointmentActivity();
}

function renderHealthRecords() {
  const allAppts = Object.values(appointments);
  const activeRx = prescriptionState.filter(
    (r) => (r.status || "").toUpperCase() === "ACTIVE",
  );
  const activeMeds = [
    ...new Set(
      activeRx.flatMap((r) =>
        (r.items || []).map((i) => i.medicine).filter(Boolean),
      ),
    ),
  ];
  const latestLab = labReportsState[0];
  const attentionLabs = labReportsState.filter((l) =>
    ["ABNORMAL", "LOW"].includes((l.status || "").toUpperCase()),
  );
  const uniqueDoctors = [
    ...new Map(
      allAppts
        .filter((a) => a.doctorId)
        .map((a) => [
          a.doctorId,
          { name: a.doctor, specialty: a.specialty, hospital: a.hospital },
        ]),
    ).values(),
  ];

  const timeAgoShort = (dateInput) => {
    if (!dateInput) return "No recent update";
    const parsed = new Date(dateInput);
    if (Number.isNaN(parsed.getTime())) return "No recent update";
    const diffDays = Math.max(
      0,
      Math.floor((Date.now() - parsed.getTime()) / 86400000),
    );
    if (diffDays === 0) return "Updated today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.round(diffDays / 30);
    return diffMonths <= 1 ? "1 month ago" : `${diffMonths} months ago`;
  };

  // ── KPI row ──────────────────────────────────────────────────────────
  const recKpiGrid = document.getElementById("recKpiGrid");
  if (recKpiGrid) {
    const attnClass = attentionLabs.length ? "records-attention-card" : "";
    recKpiGrid.innerHTML = `
      <article class="glass card stat-card records-stat-card">
        <p>Active Prescriptions</p><h3>${activeRx.length}</h3>
        <span class="hint">${
          activeRx
            .map((r) => r.title)
            .slice(0, 2)
            .join(", ") || "None active"
        }</span>
      </article>
      <article class="glass card stat-card records-stat-card">
        <p>Active Medications</p><h3>${activeMeds.length}</h3>
        <span class="hint">${activeMeds.slice(0, 2).join(", ") || "None"}</span>
      </article>
      <article class="glass card stat-card records-stat-card">
        <p>Latest Lab Cycle</p>
        <h3>${latestLab ? formatDisplayDate(latestLab.reportDate, { day: "2-digit", month: "short" }) : "—"}</h3>
        <span class="hint">${latestLab ? toUiStatus(latestLab.status) : "No labs yet"}</span>
      </article>
      <article class="glass card stat-card records-stat-card ${attnClass}">
        <p>Attention Flags</p><h3>${attentionLabs.length || "—"}</h3>
        <span class="hint">${
          attentionLabs.length
            ? attentionLabs
                .slice(0, 2)
                .map((l) => l.testName)
                .join(", ")
            : "All clear"
        }</span>
      </article>`;
  }

  // ── Overview hero chips ───────────────────────────────────────────────
  const recOverviewChips = document.getElementById("recOverviewChips");
  if (recOverviewChips) {
    const chips = [
      profileState.bloodGroup
        ? `<span class="chip">Blood Group: ${profileState.bloodGroup}</span>`
        : "",
      profileState.insurancePlan
        ? `<span class="chip active">${profileState.insurancePlan}</span>`
        : "",
      profileState.emergencyContact
        ? `<span class="chip">Emergency Contact Ready</span>`
        : "",
      activeRx.length
        ? `<span class="chip active">${activeRx.length} Active Rx</span>`
        : "",
    ].filter(Boolean);
    recOverviewChips.innerHTML =
      chips.join("") || '<span class="hint">Loading profile data…</span>';
  }

  // ── Clinical profile list ─────────────────────────────────────────────
  const recProfileList = document.getElementById("recProfileList");
  if (recProfileList) {
    const nextAppt = allAppts
      .filter((a) => ["Confirmed", "Pending"].includes(a.status))
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0];
    recProfileList.innerHTML = [
      profileState.bloodGroup
        ? `<li><strong>Blood Group:</strong> ${profileState.bloodGroup}</li>`
        : "",
      `<li><strong>Active Medicines:</strong> ${activeMeds.length ? activeMeds.join(", ") : "None"}</li>`,
      `<li><strong>Care Team:</strong> ${uniqueDoctors.length ? uniqueDoctors.map((d) => d.name).join(", ") : "None linked yet"}</li>`,
      profileState.insurancePlan
        ? `<li><strong>Insurance:</strong> ${profileState.insurancePlan}</li>`
        : "",
      profileState.emergencyContact
        ? `<li><strong>Emergency Contact:</strong> ${profileState.emergencyContact}</li>`
        : "",
      nextAppt
        ? `<li><strong>Next Appointment:</strong> ${formatDisplayDate(nextAppt.scheduledDate)} · ${nextAppt.doctor}</li>`
        : "<li><strong>Next Appointment:</strong> None scheduled</li>",
    ]
      .filter(Boolean)
      .join("");
  }

  // ── Clinical journey timeline ─────────────────────────────────────────
  const recTimelineGraph = document.getElementById("recTimelineGraph");
  if (recTimelineGraph) {
    const events = [
      ...allAppts.map((a) => ({
        date: new Date(a.scheduledDate),
        shortDate: formatDisplayDate(a.scheduledDate, {
          day: "2-digit",
          month: "short",
        }),
        fullDate: formatDisplayDate(a.scheduledDate, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        title: a.purpose || "Consultation",
        detail: `${a.doctor} · ${a.status}`,
        cls:
          a.status === "Completed"
            ? "done"
            : a.status === "Cancelled"
              ? "cancelled"
              : "current",
      })),
      ...prescriptionState.map((r) => ({
        date: new Date(r.startDate),
        shortDate: formatDisplayDate(r.startDate, {
          day: "2-digit",
          month: "short",
        }),
        fullDate: formatDisplayDate(r.startDate, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        title: r.title,
        detail: `Prescribed by ${r.doctor?.name || "Doctor"} · ${toUiStatus(r.status)}`,
        cls: (r.status || "").toUpperCase() === "ACTIVE" ? "current" : "done",
      })),
    ]
      .sort((a, b) => a.date - b.date)
      .slice(-7);

    if (events.length) {
      recTimelineGraph.innerHTML =
        '<div class="timeline-line"></div>' +
        events
          .map(
            (ev) => `
        <div class="event ${ev.cls}">
          <div class="records-event-head">
            <span class="records-event-date-chip">${ev.shortDate}</span>
            <span class="records-event-date-detail">${ev.fullDate}</span>
          </div>
          <p>${ev.title}</p>
          <small>${ev.detail}</small>
        </div>`,
          )
          .join("");
    } else {
      recTimelineGraph.innerHTML =
        '<div class="timeline-line"></div><p class="hint" style="padding:16px 0;">No clinical events yet.</p>';
    }
  }

  // ── Clinical signals (from lab results) ──────────────────────────────
  const recAlertList = document.getElementById("recAlertList");
  if (recAlertList) {
    if (!labReportsState.length) {
      recAlertList.innerHTML =
        '<p class="hint" style="padding:12px 0;">No lab reports on file.</p>';
    } else {
      recAlertList.innerHTML = labReportsState
        .slice(0, 5)
        .map((lab) => {
          const st = (lab.status || "").toUpperCase();
          const lvl =
            st === "ABNORMAL" ? "high" : st === "LOW" ? "medium" : "low";
          const note =
            lab.educationalAi ||
            (st === "NORMAL"
              ? "Within normal range."
              : "Review with your doctor.");
          return `<div class="records-alert-item ${lvl}">
          <div class="records-alert-meta">
            <span class="records-alert-date">${formatDisplayDate(lab.reportDate, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
            <span class="records-alert-status">${toUiStatus(lab.status)}</span>
          </div>
          <strong>${lab.testName}</strong>
          <p>${note}</p>
        </div>`;
        })
        .join("");
    }
  }

  // ── Care team ─────────────────────────────────────────────────────────
  const recCareGrid = document.getElementById("recCareGrid");
  if (recCareGrid) {
    if (uniqueDoctors.length) {
      recCareGrid.innerHTML = uniqueDoctors
        .map(
          (d) => `
        <div class="records-care-item">
          <strong>${d.name}</strong>
          <span>${d.specialty || "General"}</span>
          <small>${d.hospital || ""}</small>
        </div>`,
        )
        .join("");
    } else {
      recCareGrid.innerHTML =
        '<p class="hint">No doctors linked yet. Book an appointment to build your care team.</p>';
    }
  }

  // ── Records composition ───────────────────────────────────────────────
  const recPie = document.getElementById("recPie");
  const recLegend = document.getElementById("recLegend");
  const recCompositionLead = document.getElementById("recCompositionLead");
  const recCompositionStatus = document.getElementById("recCompositionStatus");
  const recCompositionTotal = document.getElementById("recCompositionTotal");
  const recInsightGrid = document.getElementById("recInsightGrid");
  if (recPie && recLegend && recInsightGrid) {
    const labCnt = labReportsState.length;
    const visitCnt = allAppts.filter((a) => a.status === "Completed").length;
    const rxCnt = prescriptionState.length;
    const totals = [
      {
        key: "labs",
        label: "Lab reports",
        count: labCnt,
        color: "var(--accent)",
        hint: labCnt
          ? `${attentionLabs.length ? `${attentionLabs.length} need review` : "Monitoring baseline captured"}`
          : "No lab reports uploaded yet",
      },
      {
        key: "visits",
        label: "Visit history",
        count: visitCnt,
        color: "#31cb83",
        hint: visitCnt
          ? `${uniqueDoctors.length || 1} clinician${uniqueDoctors.length === 1 ? "" : "s"} involved`
          : "No completed visits on record",
      },
      {
        key: "rx",
        label: "Prescriptions",
        count: rxCnt,
        color: "#ffbf4a",
        hint: rxCnt
          ? `${activeRx.length} currently active`
          : "No prescriptions issued yet",
      },
    ];
    const totalRecords = totals.reduce((sum, item) => sum + item.count, 0);
    const baseTotal = totalRecords || 1;
    const labPct = Math.round((labCnt / baseTotal) * 100);
    const visitPct = Math.round((visitCnt / baseTotal) * 100);
    const rxPct = totalRecords ? Math.max(0, 100 - labPct - visitPct) : 0;

    const datedEvents = [
      ...allAppts
        .filter((a) => a.scheduledDate)
        .map((a) => ({ type: "Visit", date: a.scheduledDate })),
      ...prescriptionState
        .filter((r) => r.startDate)
        .map((r) => ({ type: "Prescription", date: r.startDate })),
      ...labReportsState
        .filter((l) => l.reportDate)
        .map((l) => ({ type: "Lab", date: l.reportDate })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestEvent = datedEvents[0];
    const docsWithFiles = [
      ...prescriptionState.filter((r) => r.documentPath),
      ...labReportsState.filter((l) => l.documentPath),
    ].length;
    const coverageRatio = totalRecords
      ? Math.round(
          (((labCnt ? 1 : 0) +
            (visitCnt ? 1 : 0) +
            (rxCnt ? 1 : 0) +
            (docsWithFiles ? 1 : 0)) /
            4) *
            100,
        )
      : 0;

    recPie.style.setProperty(
      "--pie",
      `conic-gradient(var(--accent) 0 ${labPct}%, #31cb83 ${labPct}% ${labPct + visitPct}%, #ffbf4a ${labPct + visitPct}% 100%)`,
    );
    if (recCompositionTotal)
      recCompositionTotal.textContent = `${totalRecords}`;
    if (recCompositionLead) {
      recCompositionLead.textContent = totalRecords
        ? `Your file blends diagnostics, treatment plans, and visit history in one readable view.`
        : "As records arrive, this view will map where your medical history is building out.";
    }
    if (recCompositionStatus) {
      recCompositionStatus.textContent = totalRecords
        ? `${coverageRatio}% coverage`
        : "Awaiting records";
    }
    recInsightGrid.innerHTML = `
      <div class="records-summary-tile">
        <span>Latest update</span>
        <strong>${latestEvent ? `${latestEvent.type} · ${timeAgoShort(latestEvent.date)}` : "No recent updates"}</strong>
        <small>${latestEvent ? formatDisplayDate(latestEvent.date, { day: "2-digit", month: "short", year: "numeric" }) : "Your first synced record will appear here."}</small>
      </div>
      <div class="records-summary-tile">
        <span>Coverage pulse</span>
        <strong>${coverageRatio}% file readiness</strong>
        <small>${attentionLabs.length ? `${attentionLabs.length} flagged result${attentionLabs.length === 1 ? "" : "s"} worth revisiting.` : "Core record categories are organized for easy review."}</small>
      </div>
      <div class="records-summary-tile">
        <span>Share-ready docs</span>
        <strong>${docsWithFiles} exportable file${docsWithFiles === 1 ? "" : "s"}</strong>
        <small>${docsWithFiles ? "Signed prescriptions and uploaded labs are ready to open or download." : "Files will appear here as soon as reports or PDFs are available."}</small>
      </div>`;
    recLegend.innerHTML = totals
      .map((item) => {
        const share = totalRecords
          ? Math.round((item.count / totalRecords) * 100)
          : 0;
        return `
        <div class="records-breakdown-item" style="--segment:${item.color}; --fill:${share};">
          <div class="records-breakdown-copy">
            <div class="records-breakdown-head">
              <div class="records-breakdown-label">
                <i class="records-breakdown-swatch"></i>
                <div>
                  <strong>${item.label}</strong>
                  <small>${item.hint}</small>
                </div>
              </div>
              <div class="records-breakdown-value">
                <strong>${item.count}</strong>
                <small>${share}% of file</small>
              </div>
            </div>
            <div class="records-breakdown-meter"></div>
          </div>
        </div>`;
      })
      .join("");
  }

  // ── Recent records ────────────────────────────────────────────────────
  const recDocsList = document.getElementById("recDocsList");
  if (recDocsList) {
    const items = [
      ...labReportsState.slice(0, 3).map((l) => ({
        type: "Lab",
        chipClass: getChipClassFromLabStatus(l.status),
        title: l.testName,
        hint: `${formatDisplayDate(l.reportDate, { day: "2-digit", month: "short", year: "numeric" })} · ${toUiStatus(l.status)}`,
      })),
      ...prescriptionState.slice(0, 2).map((r) => ({
        type: "Rx",
        chipClass: (r.status || "").toUpperCase() === "ACTIVE" ? "active" : "",
        title: r.title,
        hint: `${formatDisplayDate(r.startDate, { day: "2-digit", month: "short", year: "numeric" })} · ${r.doctor?.name || "Doctor"}`,
      })),
    ].slice(0, 5);
    if (items.length) {
      recDocsList.innerHTML = items
        .map(
          (it) => `
        <div class="records-file-item">
          <span class="chip ${it.chipClass}">${it.type}</span>
          <div><strong>${it.title}</strong><p class="hint">${it.hint}</p></div>
        </div>`,
        )
        .join("");
    } else {
      recDocsList.innerHTML = '<p class="hint">No records found.</p>';
    }
  }
}

function renderPrescriptionsSection() {
  const formatTimelineDate = (...candidates) => {
    const value = candidates.find(
      (entry) => entry && !Number.isNaN(new Date(entry).getTime()),
    );
    if (!value) {
      return {
        timestamp: 0,
        shortLabel: "Undated",
        fullLabel: "Date unavailable",
      };
    }
    return {
      timestamp: new Date(value).getTime(),
      shortLabel: formatDisplayDate(value, { day: "2-digit", month: "short" }),
      fullLabel: formatDisplayDate(value, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  };

  const historyEntries = [
    ...prescriptionState.map((rx) => {
      const dateMeta = formatTimelineDate(rx.startDate, rx.endDate);
      const items = Array.isArray(rx.items) ? rx.items.filter(Boolean) : [];
      const doctor = rx.doctor || {};
      const medPreview = items.length
        ? items
            .slice(0, 2)
            .map((item) => item.medicine)
            .join(" • ")
        : "Medication plan saved to your record.";
      const actionButtons = `
        <button class="ghost-btn" data-action="open-mock-pdf" data-doc-title="${rx.title} - ${doctor.name || "Doctor"}" data-doc-code="${rx.id}" data-doc-type="prescription" data-doc-file="${rx.documentPath || ""}">View PDF</button>
        <button class="ghost-btn" data-action="download-rx-pdf" data-doc-title="${rx.title} - ${doctor.name || "Doctor"}" data-doc-code="${rx.id}" data-doc-type="prescription" data-doc-file="${rx.documentPath || ""}">Download</button>
      `;
      return {
        timestamp: dateMeta.timestamp,
        shortLabel: dateMeta.shortLabel,
        fullLabel: dateMeta.fullLabel,
        tone: "rx",
        kindLabel: "Prescription",
        railLabel: "RX",
        iconLabel: "RX",
        badge: toUiStatus(rx.status) || "Recorded",
        title: rx.title,
        subtitle: `${doctor.name || "Doctor"}${doctor.specialty ? ` · ${doctor.specialty}` : ""}`,
        context: `Issued ${dateMeta.fullLabel}`,
        detail:
          rx.doctorNote ||
          `${items.length ? `${items.length} medicines included in this plan.` : "Medication plan saved to your record."}`,
        meta: [
          medPreview || "Prescription on file",
          rx.durationDays ? `${rx.durationDays} day plan` : "Duration pending",
          Number.isFinite(Number(rx.refillCount))
            ? `${rx.refillCount} refills left`
            : "Refill data unavailable",
        ],
        actions: actionButtons,
      };
    }),
    ...labReportsState.map((lab) => {
      const dateMeta = formatTimelineDate(
        lab.reportDate,
        lab.createdAt,
        lab.updatedAt,
      );
      const doctor = lab.doctor || {};
      return {
        timestamp: dateMeta.timestamp,
        shortLabel: dateMeta.shortLabel,
        fullLabel: dateMeta.fullLabel,
        tone: "lab",
        kindLabel: "Lab Result",
        railLabel: "LAB",
        iconLabel: "LB",
        badge: toUiStatus(lab.status) || "Logged",
        title: lab.testName,
        subtitle: `${doctor.name || "Doctor"}${doctor.specialty ? ` · ${doctor.specialty}` : ""}`,
        context: `Reported ${dateMeta.fullLabel}`,
        detail:
          lab.educationalAi || "Lab result uploaded to your health record.",
        meta: [
          lab.documentPath ? "Attached PDF ready" : "No file attached",
          `Status: ${toUiStatus(lab.status) || "Pending"}`,
          "Clinical signal available",
        ],
        actions: lab.documentPath
          ? `<button class="ghost-btn" data-action="view-lab" data-doc-title="${lab.testName} Report" data-doc-code="${lab.id}" data-doc-type="lab" data-doc-file="${lab.documentPath || ""}">Open report</button>`
          : "",
      };
    }),
    ...medicalReportsState.map((report) => {
      const dateMeta = formatTimelineDate(
        report.reportDate,
        report.createdAt,
        report.updatedAt,
      );
      const doctor = report.doctor || {};
      return {
        timestamp: dateMeta.timestamp,
        shortLabel: dateMeta.shortLabel,
        fullLabel: dateMeta.fullLabel,
        tone: "doc",
        kindLabel: "Document",
        railLabel: "FILE",
        iconLabel: "DOC",
        badge: report.category || "Archive",
        title: report.title,
        subtitle: `${doctor.name || "Doctor"}${doctor.specialty ? ` · ${doctor.specialty}` : ""}`,
        context: `Archived ${dateMeta.fullLabel}`,
        detail: report.summary || "Clinical document stored in your archive.",
        meta: [
          report.category || "General record",
          report.documentPath ? "Download available" : "Summary only",
          "Archived in patient record",
        ],
        actions: report.documentPath
          ? `<button class="ghost-btn" data-action="view-lab" data-doc-title="${report.title}" data-doc-code="${report.id}" data-doc-type="lab" data-doc-file="${report.documentPath || ""}">Open document</button>`
          : "",
      };
    }),
  ].sort((a, b) => b.timestamp - a.timestamp);
  const timelineFilter = prescriptionTimelineState.filter || "all";
  const timelineQuery = (prescriptionTimelineState.query || "")
    .trim()
    .toLowerCase();
  const filteredHistoryEntries = historyEntries.filter((entry) => {
    const filterMatch =
      timelineFilter === "all" || entry.tone === timelineFilter;
    if (!filterMatch) return false;
    if (!timelineQuery) return true;
    const haystack = [
      entry.title,
      entry.subtitle,
      entry.context,
      entry.detail,
      entry.kindLabel,
      ...(entry.meta || []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(timelineQuery);
  });
  const prescriptionsSortedLatest = [...prescriptionState].sort((a, b) => {
    const aTime = new Date(a.startDate || a.createdAt || 0).getTime();
    const bTime = new Date(b.startDate || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
  const latestPrescription = prescriptionsSortedLatest[0] || null;

  if (prescriptionActivePlans) {
    const active = prescriptionState.filter(
      (item) => (item.status || "").toUpperCase() === "ACTIVE",
    );
    const adherenceAvg = active.length
      ? Math.round(
          active.reduce(
            (sum, item) => sum + Number(item.adherenceScore || 0),
            0,
          ) / active.length,
        )
      : 0;
    const nextReviewDate = active.map((item) => item.endDate).sort()[0];
    prescriptionActivePlans.textContent = `${active.length}`;
    prescriptionRefillsPending.textContent = `${active.filter((item) => Number(item.refillCount || 0) <= 1).length}`;
    prescriptionAdherenceAvg.textContent = `${adherenceAvg}%`;
    prescriptionNextReview.textContent = nextReviewDate
      ? formatDisplayDate(nextReviewDate, { day: "2-digit", month: "short" })
      : "--";
  }

  if (prescriptionCards) {
    prescriptionCards.classList.remove("prescription-cards-carousel");
    if (!prescriptionState.length) {
      prescriptionCards.innerHTML =
        '<article class="glass card empty-card"><h2>No Prescriptions Yet</h2><p class="hint">Prescriptions issued by your doctor will appear here.</p></article>';
    } else {
      const listItems = prescriptionsSortedLatest
        .map((rx) => {
          const doctor = rx.doctor || {};
          const items = Array.isArray(rx.items) ? rx.items : [];
          const medPreview = items.length
            ? items
                .slice(0, 3)
                .map((i) => `${i.medicine}${i.dose ? " " + i.dose : ""}`)
                .join(" · ")
            : "Consultation record";
          const docFile = rx.documentPath || "";
          const statusCls =
            (rx.status || "").toUpperCase() === "ACTIVE"
              ? "active"
              : "complete";
          return `
          <div class="rx-list-item">
            <div class="rx-list-item-top">
              <div>
                <strong>${rx.title}</strong>
                <p class="hint">${doctor.name || "Doctor"}${doctor.specialty ? " · " + doctor.specialty : ""} · ${formatDisplayDate(rx.startDate, { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
              <span class="chip ${statusCls}">${toUiStatus(rx.status)}</span>
            </div>
            <p class="rx-list-meds">${medPreview}</p>
            ${rx.doctorNote ? `<p class="hint rx-list-note">${rx.doctorNote.split("\n")[0]}</p>` : ""}
            <div class="button-row">
              <button class="ghost-btn" data-action="open-mock-pdf" data-doc-title="${rx.title} - ${doctor.name || "Doctor"}" data-doc-code="${rx.id}" data-doc-type="prescription" data-doc-file="${docFile}">View PDF</button>
              ${docFile ? `<button class="ghost-btn" data-action="download-rx-pdf" data-doc-title="${rx.title} - ${doctor.name || "Doctor"}" data-doc-code="${rx.id}" data-doc-type="prescription" data-doc-file="${docFile}">Download</button>` : ""}
            </div>
          </div>`;
        })
        .join("");
      prescriptionCards.innerHTML = `
        <article class="glass card prescription-support-card">
          <div class="prescription-support-head">
            <h2>All Prescriptions</h2>
            <span class="hint">${prescriptionsSortedLatest.length} total</span>
          </div>
          <div class="rx-list-scroll">${listItems}</div>
        </article>`;
    }
  }

  if (prescriptionDocsList) {
    const docsWithFile = prescriptionsSortedLatest.filter(
      (rx) => rx.documentPath,
    );
    prescriptionDocsList.innerHTML = docsWithFile.length
      ? docsWithFile
          .map(
            (rx) => `
          <button class="prescription-doc-item" data-action="open-mock-pdf" data-doc-title="${rx.title} - ${rx.doctor?.name || "Doctor"}" data-doc-code="${rx.id}" data-doc-type="prescription" data-doc-file="${rx.documentPath}">
            <strong>${rx.title}</strong>
            <span>${rx.doctor?.name || "Doctor"} · ${formatDisplayDate(rx.startDate, { day: "2-digit", month: "short", year: "numeric" })}</span>
          </button>
        `,
          )
          .join("")
      : '<p class="hint" style="padding:12px 0;">No prescription documents yet.</p>';
  }

  if (prescriptionOverviewList) {
    const windows = [
      ["Morning Window", []],
      ["Evening Window", []],
      ["Night Window", []],
      ["Weekly Therapy", []],
    ];
    prescriptionState.forEach((rx) => {
      (rx.items || []).forEach((item) => {
        const timing = (item.timing || "").toLowerCase();
        if (timing.includes("morning")) windows[0][1].push(item.medicine);
        if (timing.includes("evening")) windows[1][1].push(item.medicine);
        if (timing.includes("night")) windows[2][1].push(item.medicine);
        if (timing.includes("sunday") || timing.includes("weekly"))
          windows[3][1].push(item.medicine);
      });
    });
    prescriptionOverviewList.innerHTML = windows
      .map(
        ([label, meds]) => `
      <div><strong>${label}</strong><span>${meds.length ? meds.join(" + ") : "--"}</span></div>
    `,
      )
      .join("");
  }

  if (prescriptionTimelineLead) {
    prescriptionTimelineLead.textContent =
      prescriptionUiState.timelineView === "timeline"
        ? "Your prescriptions, lab results, and archived files are now arranged in one long-form clinical timeline."
        : "This keeps the familiar quick overview. Switch to Timeline whenever you want the full EMR-style history.";
  }

  if (prescriptionPageLead) {
    prescriptionPageLead.textContent =
      prescriptionUiState.timelineView === "timeline"
        ? "Switch between your usual prescription workspace and a focused longitudinal timeline view."
        : "Prescription status, doctor instructions, refills, and downloadable documents in one place.";
  }

  if (prescriptionsSection) {
    prescriptionsSection.classList.toggle(
      "timeline-mode",
      prescriptionUiState.timelineView === "timeline",
    );
  }

  if (prescriptionOverviewShell) {
    prescriptionOverviewShell.hidden =
      prescriptionUiState.timelineView !== "overview";
  }

  if (prescriptionTimelineShell) {
    prescriptionTimelineShell.hidden =
      prescriptionUiState.timelineView !== "timeline";
  }

  document
    .querySelectorAll(
      '#prescriptions [data-action="set-prescription-timeline-view"]',
    )
    .forEach((toggleBtn) => {
      const isActive =
        toggleBtn.dataset.timelineView === prescriptionUiState.timelineView;
      toggleBtn.classList.toggle("active", isActive);
      toggleBtn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

  if (
    prescriptionTimelineSearch &&
    prescriptionTimelineSearch.value !== prescriptionTimelineState.query
  ) {
    prescriptionTimelineSearch.value = prescriptionTimelineState.query;
  }

  document
    .querySelectorAll(
      '#prescriptions [data-action="set-prescription-timeline-filter"]',
    )
    .forEach((filterBtn) => {
      const isActive =
        filterBtn.dataset.timelineFilter === prescriptionTimelineState.filter;
      filterBtn.classList.toggle("active", isActive);
      filterBtn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

  if (prescriptionTimelineMeta) {
    prescriptionTimelineMeta.innerHTML = `
      <span class="prescription-timeline-pill active">${prescriptionUiState.timelineView === "timeline" ? "Timeline mode" : "Overview mode"}</span>
      <span class="prescription-timeline-pill ${prescriptionUiState.timelineView === "timeline" ? "active" : ""}">${filteredHistoryEntries.length} visible records</span>
      <span class="prescription-timeline-pill">${prescriptionState.length} prescriptions</span>
      <span class="prescription-timeline-pill">${labReportsState.length} lab results</span>
      <span class="prescription-timeline-pill">${medicalReportsState.length} documents</span>
    `;
  }

  if (prescriptionTimeline) {
    if (prescriptionUiState.timelineView === "timeline") {
      if (!filteredHistoryEntries.length) {
        prescriptionTimeline.innerHTML = `
          <div class="prescription-history-shell prescription-timeline-empty">
            <p class="hint">${historyEntries.length ? "No timeline items match the current search or filter." : "Prescriptions, lab results, and archived documents will appear here as soon as your record starts building out."}</p>
          </div>
        `;
      } else {
        prescriptionTimeline.innerHTML = `
          <div class="prescription-history-shell">
            <div class="prescription-history-fade top"></div>
            <div class="prescription-history-fade bottom"></div>
            <div class="prescription-history-scroll">
              <div class="prescription-history-track">
                ${filteredHistoryEntries
                  .map(
                    (entry, index) => `
                  <article class="prescription-history-item ${entry.tone} ${index === 0 ? "focus" : ""}" style="animation-delay:${index * 60}ms">
                    <div class="prescription-history-date">
                      <strong>${entry.shortLabel}</strong>
                      <span>${entry.railLabel}</span>
                    </div>
                    <div class="prescription-history-node"><span></span></div>
                    <div class="prescription-history-card">
                      <div class="prescription-history-card-top">
                        <div class="prescription-history-card-layout">
                          <div class="prescription-history-icon">${entry.iconLabel}</div>
                          <div class="prescription-history-copy">
                            <div class="prescription-history-kicker">
                              <h3>${entry.title}</h3>
                              <span class="prescription-history-badge">${entry.badge}</span>
                            </div>
                            <p class="prescription-history-subtitle">${entry.subtitle}</p>
                            <p class="prescription-history-context">${entry.context}</p>
                          </div>
                        </div>
                        <span class="prescription-history-arrow" aria-hidden="true">&gt;</span>
                      </div>
                      <p class="prescription-history-detail">${entry.detail}</p>
                      <div class="prescription-history-meta">
                        ${entry.meta.map((metaItem) => `<span>${metaItem}</span>`).join("")}
                      </div>
                      ${entry.actions ? `<div class="button-row prescription-history-actions">${entry.actions}</div>` : ""}
                    </div>
                  </article>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        `;
      }
    } else {
      const sorted = [...prescriptionState].sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate),
      );
      if (!sorted.length) {
        prescriptionTimeline.innerHTML = `
          <div class="prescription-status-empty">
            <p class="hint">No prescription timeline yet. Once a doctor issues medication, it will appear here.</p>
          </div>
        `;
      } else {
        prescriptionTimeline.innerHTML = `
          <div class="timeline-graph compact prescription-overview-timeline">
            <div class="timeline-line"></div>
            ${sorted
              .map((rx, index) => {
                const doctor = rx.doctor || {};
                const items = Array.isArray(rx.items)
                  ? rx.items.filter(Boolean)
                  : [];
                const status = (rx.status || "").toUpperCase();
                return `
                <article class="event ${status === "ACTIVE" ? "current" : "done"}" style="animation-delay:${index * 70}ms">
                  <span>${formatDisplayDate(rx.startDate, { month: "short" })}</span>
                  <h3>${rx.title}</h3>
                  <p class="prescription-overview-doctor">${doctor.name || "Doctor"}${doctor.hospital ? ` · ${doctor.hospital}` : ""}</p>
                  <small>${items[0]?.medicine || "Medication plan ready"} · ${toUiStatus(rx.status)}${rx.durationDays ? ` · ${rx.durationDays} days` : ""}</small>
                </article>
              `;
              })
              .join("")}
          </div>
        `;
      }
    }
  }
}

function openAllPrescriptionsModal() {
  const prescriptionsSortedLatest = [...prescriptionState].sort((a, b) => {
    const aTime = new Date(a.startDate || a.createdAt || 0).getTime();
    const bTime = new Date(b.startDate || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  if (!prescriptionsSortedLatest.length) {
    openModal(
      "All Prescriptions",
      '<p class="hint">No prescriptions are available for this user yet.</p>',
    );
    return;
  }

  openModal(
    "All Prescriptions",
    `
      <div class="prescription-modal-list">
        ${prescriptionsSortedLatest
          .map((rx) => {
            const doctor = rx.doctor || {};
            const items = Array.isArray(rx.items) ? rx.items : [];
            return `
            <article class="glass card prescription-modal-item">
              <div class="prescription-card-top">
                <div>
                  <p class="prescription-label">${formatDisplayDate(rx.startDate)}</p>
                  <h2>${rx.title}</h2>
                  <p class="hint">Prescribed by ${doctor.name || "Doctor"}${doctor.hospital ? ` · ${doctor.hospital}` : ""}</p>
                </div>
                <span class="chip ${(rx.status || "").toUpperCase() === "ACTIVE" ? "active" : "complete"}">${toUiStatus(rx.status)}</span>
              </div>
              <div class="chip-row">
                ${items.length ? items.map((item) => `<span class="med-chip">${item.medicine} ${item.dose}</span>`).join("") : ""}
              </div>
              <p class="hint">${rx.durationDays ? `${rx.durationDays} day plan` : "Duration pending"} · Ends ${formatDisplayDate(rx.endDate)}</p>
              <div class="button-row">
                <button class="ghost-btn" data-action="open-mock-pdf" data-doc-title="${rx.title} - ${doctor.name || "Doctor"}" data-doc-code="${rx.id}" data-doc-type="prescription" data-doc-file="${rx.documentPath || ""}">View</button>
                <button class="ghost-btn" data-action="download-rx-pdf" data-doc-title="${rx.title} - ${doctor.name || "Doctor"}" data-doc-code="${rx.id}" data-doc-type="prescription" data-doc-file="${rx.documentPath || ""}">Download</button>
                <button class="ghost-btn" data-action="ask-doctor-rx" data-doctor-id="${doctor.id || ""}">Ask Doctor</button>
              </div>
            </article>
          `;
          })
          .join("")}
      </div>
    `,
  );
}

function openAllLabsModal() {
  if (!labReportsState.length) {
    openModal(
      "All Lab Reports",
      '<p class="hint">No lab reports available yet.</p>',
    );
    return;
  }
  openModal(
    "All Lab Reports",
    `<div class="prescription-modal-list">${labReportsState
      .map((lab) => {
        const doctor = lab.doctor || {};
        const statusCls = getChipClassFromLabStatus(lab.status);
        return `
        <article class="glass card prescription-modal-item">
          <div class="prescription-card-top">
            <div>
              <p class="prescription-label">${formatDisplayDate(lab.reportDate, { day: "2-digit", month: "short", year: "numeric" })}</p>
              <h2>${lab.testName}</h2>
              <p class="hint">${doctor.name || "Doctor"}${doctor.specialty ? " · " + doctor.specialty : ""}</p>
            </div>
            <span class="chip ${statusCls}">${toUiStatus(lab.status)}</span>
          </div>
          ${lab.educationalAi ? `<p class="hint">${lab.educationalAi}</p>` : ""}
          <div class="button-row">
            <button class="ghost-btn" data-action="view-lab" data-doc-title="${lab.testName} Report" data-doc-code="${lab.id}" data-doc-type="lab" data-doc-file="${lab.documentPath || ""}">View Report</button>
          </div>
        </article>`;
      })
      .join("")}</div>`,
  );
}

if (prescriptionTimelineSearch) {
  prescriptionTimelineSearch.addEventListener("input", (event) => {
    prescriptionTimelineState.query = event.target.value || "";
    renderPrescriptionsSection();
  });
}

function buildLabListItem(lab) {
  const doctor = lab.doctor || {};
  const statusCls = getChipClassFromLabStatus(lab.status);
  return `
    <div class="rx-list-item">
      <div class="rx-list-item-top">
        <div>
          <strong>${lab.testName}</strong>
          <p class="hint">${doctor.name || "Doctor"}${doctor.specialty ? " · " + doctor.specialty : ""} · ${formatDisplayDate(lab.reportDate, { day: "2-digit", month: "short", year: "numeric" })}</p>
        </div>
        <span class="chip ${statusCls}">${toUiStatus(lab.status)}</span>
      </div>
      ${lab.educationalAi ? `<p class="rx-list-note">${lab.educationalAi.split(".")[0]}.</p>` : ""}
      <div class="button-row">
        <button class="ghost-btn" data-action="view-lab" data-doc-title="${lab.testName} Report" data-doc-code="${lab.id}" data-doc-type="lab" data-doc-file="${lab.documentPath || ""}">View</button>
      </div>
    </div>`;
}

function renderLabsSection() {
  if (labReportsList) {
    if (!labReportsState.length) {
      labReportsList.innerHTML =
        '<p class="hint" style="padding:12px 0;">No lab reports yet.</p>';
    } else {
      labReportsList.innerHTML = labReportsState
        .slice(0, 4)
        .map(buildLabListItem)
        .join("");
    }
  }

  if (labDocsList) {
    const docsWithFile = labReportsState.filter((l) => l.documentPath);
    labDocsList.innerHTML = docsWithFile.length
      ? docsWithFile
          .map(
            (lab) => `
          <button class="prescription-doc-item" data-action="view-lab" data-doc-title="${lab.testName} Report" data-doc-code="${lab.id}" data-doc-type="lab" data-doc-file="${lab.documentPath}">
            <strong>${lab.testName}</strong>
            <span>${lab.doctor?.name || "Doctor"} · ${formatDisplayDate(lab.reportDate, { day: "2-digit", month: "short", year: "numeric" })}</span>
          </button>`,
          )
          .join("")
      : '<p class="hint" style="padding:12px 0;">No lab documents yet.</p>';
  }

  if (labsTableBody) {
    if (!labReportsState.length) {
      labsTableBody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted,#98aabe);">No lab reports yet.</td></tr>';
    } else {
      labsTableBody.innerHTML = labReportsState
        .map(
          (lab) => `
        <tr>
          <td data-label="Test">${lab.testName}</td>
          <td data-label="Date">${formatDisplayDate(lab.reportDate, { day: "2-digit", month: "short" })}</td>
          <td data-label="Status"><span class="chip ${getChipClassFromLabStatus(lab.status)}">${toUiStatus(lab.status)}</span></td>
          <td data-label="Doctor">${lab.doctor?.name || "Doctor"}</td>
          <td data-label="Report"><button class="ghost-btn" data-action="view-lab" data-doc-title="${lab.testName} Report" data-doc-code="${lab.id}" data-doc-type="lab" data-doc-file="${lab.documentPath || ""}">View</button></td>
        </tr>
      `,
        )
        .join("");
    }
  }

  if (labsAiNote) {
    labsAiNote.textContent =
      labReportsState[0]?.educationalAi || "No AI note available.";
  }

  if (medicalReportsArchive) {
    if (!medicalReportsState.length) {
      medicalReportsArchive.innerHTML =
        '<p class="hint" style="padding:16px 0;">No medical reports yet. Reports uploaded by your doctor will appear here.</p>';
    } else {
      medicalReportsArchive.innerHTML = medicalReportsState
        .map(
          (report) => `
        <article class="report-archive-item">
          <div class="report-archive-top">
            <span class="chip chip-blue">${report.category}</span>
            <span class="hint">${formatDisplayDate(report.reportDate, { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <h3>${report.title}</h3>
          <p class="hint">${report.doctor?.name || "Doctor"}</p>
          <p>${report.summary}</p>
          <div class="button-row">
            <button class="ghost-btn" data-action="view-lab" data-doc-title="${report.title}" data-doc-code="${report.id}" data-doc-type="lab" data-doc-file="${report.documentPath || ""}">View Report</button>
          </div>
        </article>
      `,
        )
        .join("");
    }
  }
}

async function hydrateFrontendFromBackend() {
  try {
    const session = loadAuthSession();
    const pid = session?.patientId;
    const profilePath = pid
      ? `/patient/profile?id=${encodeURIComponent(pid)}`
      : "/patient/profile";
    const [profilePayload, doctorsPayload, threadsPayload] = await Promise.all([
      apiGet(profilePath),
      apiGet("/doctors"),
      apiGet("/messages/threads"),
    ]);

    const doctorsWithSlots = await Promise.all(
      (doctorsPayload || []).map(async (doctor) => ({
        ...doctor,
        slots: await loadDoctorSlotsFromApi(doctor.id),
      })),
    );

    backendState.online = true;
    backendState.patientId = profilePayload?.id || null;

    if (profilePayload) {
      Object.assign(profileState, {
        name: profilePayload.name || profileState.name,
        email: profilePayload.email || profileState.email,
        phone: profilePayload.phone || profileState.phone,
        address: profilePayload.address || profileState.address,
        language: profileState.language,
        healthScore: profilePayload.healthScore || 87,
        bloodGroup: profilePayload.bloodGroup || profileState.bloodGroup,
        insurancePlan:
          profilePayload.insurancePlan || profileState.insurancePlan,
        emergencyContact:
          profilePayload.emergencyContact || profileState.emergencyContact,
      });
      if (profilePayload.universalCode) {
        universalIdState.code = profilePayload.universalCode;
        saveUniversalIdState();
        renderUniversalIdState();
      }

      prescriptionState.length = 0;
      (profilePayload.prescriptions || []).forEach((item) =>
        prescriptionState.push(item),
      );
      labReportsState.length = 0;
      (profilePayload.labReports || []).forEach((item) =>
        labReportsState.push(item),
      );
      medicalReportsState.length = 0;
      (profilePayload.medicalReports || []).forEach((item) =>
        medicalReportsState.push(item),
      );
      mergeAppointmentData(profilePayload.appointments || []);
    }

    mergeDoctorData(doctorsWithSlots);
    mergeMessageThreads(threadsPayload || []);
    loadCustomDoctorsState();
    renderProfileState();
    renderHomeSummary();
    renderPrescriptionsSection();
    renderLabsSection();
    renderAppointments();
    renderDoctorNetwork();
    renderMessagesDoctorList();
    renderMessagesThread();
    renderHealthRecords();
    renderMedicinesSection();
    loadShareSettings();
    showToast("Connected to backend data.", "success");
  } catch (error) {
    backendState.online = false;
    renderHomeSummary();
    renderPrescriptionsSection();
    renderLabsSection();
    showToast(
      "Backend not reachable. Check that the backend is running.",
      "error",
    );
  }
}

/* ── Share-Controls helpers ──────────────────────────────────────────── */

function updateShareControlsUI(settings) {
  const chipEl   = document.getElementById("shareStatusChip");
  const noteEl   = document.getElementById("shareNoteText");
  const fullBox  = document.getElementById("shareFullAccess");
  const labBox   = document.getElementById("shareLabOnly");
  const sumBox   = document.getElementById("shareSummaryOnly");

  if (fullBox)  fullBox.checked  = !!settings.fullAccess;
  if (labBox)   labBox.checked   = !!settings.labOnly;
  if (sumBox)   sumBox.checked   = !!settings.summaryOnly;

  let label = "None";
  let note  = "No access granted to doctors.";
  if (settings.fullAccess)  { label = "Full Access"; note = "Doctors can view all your prescriptions, visits, and lab reports."; }
  else if (settings.labOnly)  { label = "Labs Only";   note = "Doctors can view only your lab reports."; }
  else if (settings.summaryOnly) { label = "Summary";  note = "Doctors can view a read-only summary of your health data."; }

  if (chipEl) {
    chipEl.textContent = label;
    chipEl.className = settings.fullAccess || settings.labOnly || settings.summaryOnly
      ? "chip active"
      : "chip";
  }
  if (noteEl) noteEl.textContent = note;
}

async function loadShareSettings() {
  const patientId = getLoggedInPatientId();
  if (!patientId) return;
  try {
    const settings = await apiGet(`/patient/${encodeURIComponent(patientId)}/share-settings`);
    updateShareControlsUI(settings);
  } catch {
    // backend offline — leave UI as-is
  }
}

async function saveShareSettings() {
  const patientId = getLoggedInPatientId();
  if (!patientId) {
    showToast("Not logged in — cannot save settings.", "error");
    return;
  }

  const fullAccess  = !!(document.getElementById("shareFullAccess")?.checked);
  const labOnly     = !!(document.getElementById("shareLabOnly")?.checked);
  const summaryOnly = !!(document.getElementById("shareSummaryOnly")?.checked);

  const btn = document.getElementById("saveShareSettingsBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }

  try {
    const updated = await apiRequest(
      `/patient/${encodeURIComponent(patientId)}/share-settings`,
      { method: "PATCH", body: JSON.stringify({ fullAccess, labOnly, summaryOnly }) }
    );
    updateShareControlsUI(updated);
    showToast("Share settings saved.", "success");
  } catch {
    showToast("Could not save settings — backend unreachable.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Save Settings"; }
  }
}

function openEditProfileModal() {
  openModal(
    "Edit Profile",
    `
      <div class="card-grid two-col">
        <label>Name<input class="add-flow-search" data-profile-input="name" type="text" value="${profileState.name.replace(/"/g, "&quot;")}" /></label>
        <label>Email<input class="add-flow-search" data-profile-input="email" type="email" value="${profileState.email.replace(/"/g, "&quot;")}" /></label>
        <label>Phone<input class="add-flow-search" data-profile-input="phone" type="text" value="${profileState.phone.replace(/"/g, "&quot;")}" /></label>
        <label>Address<input class="add-flow-search" data-profile-input="address" type="text" value="${profileState.address.replace(/"/g, "&quot;")}" /></label>
      </div>
      <label>Language
        <select class="add-flow-search" data-profile-input="language">
          <option ${profileState.language === "English" ? "selected" : ""}>English</option>
          <option ${profileState.language === "Hindi" ? "selected" : ""}>Hindi</option>
          <option ${profileState.language === "Kannada" ? "selected" : ""}>Kannada</option>
        </select>
      </label>
      <div class="button-row">
        <button class="btn" data-profile-save>Save Profile</button>
        <button class="ghost-btn" data-profile-cancel>Cancel</button>
      </div>
    `,
  );
}

function getMessageDoctorMeta(doctorId) {
  return doctorDirectory.find((doctor) => doctor.id === doctorId) || null;
}

function renderMessagesDoctorList() {
  if (!messagesDoctorList) return;
  const listHtml = doctorDirectory
    .filter((doctor) => hasAppointmentWithDoctor(doctor.id))
    .map((doctor) => {
      const selected = messageState.selectedDoctorId === doctor.id;
      const initials = doctor.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
      return `
      <button class="messages-doctor-row ${selected ? "active" : ""}" data-action="messages-open-doctor" data-doctor-id="${doctor.id}">
        <div class="messages-doctor-avatar">${initials}</div>
        <div class="messages-doctor-copy">
          <div class="messages-doctor-topline">
            <p><strong>${doctor.name}</strong></p>
          </div>
          <p class="messages-doctor-clinic">${doctor.hospital || doctor.specialty || "Clinic unavailable"}</p>
        </div>
      </button>
    `;
    })
    .join("");
  messagesDoctorList.innerHTML = listHtml;
}

function renderMessagesThread() {
  if (
    !messagesThread ||
    !messagesChatTitle ||
    !messagesChatMeta ||
    !messagesInput ||
    !messagesSendBtn
  )
    return;
  const doctorId = messageState.selectedDoctorId;
  if (!doctorId) {
    messagesChatTitle.textContent = "Select a doctor to start chat";
    messagesChatMeta.textContent = "Encrypted consultation channel";
    if (messagesChatAvatar) messagesChatAvatar.textContent = "M";
    messagesThread.innerHTML = `
      <div class="messages-empty">
        <div class="messages-empty-card">
          <span class="messages-empty-icon">+</span>
          <h3>Your secure care conversation</h3>
          <p>Select a doctor from the left to open the consultation chat.</p>
        </div>
      </div>
    `;
    messagesInput.disabled = true;
    messagesSendBtn.disabled = true;
    if (messagesImageBtn) messagesImageBtn.disabled = true;
    if (messagesVoiceBtn) messagesVoiceBtn.disabled = true;
    setMessagesVoiceButtonState(false);
    if (messagesComposerMeta)
      messagesComposerMeta.textContent =
        "Attach a medical image or record a voice note directly in this secure thread.";
    messageState._renderedId = null;
    messageState._renderedCount = 0;
    return;
  }

  const doctor = getMessageDoctorMeta(doctorId);
  const thread = messageState.threads[doctorId] || [];
  messagesChatTitle.textContent = doctor ? doctor.name : "Doctor Chat";
  messagesChatMeta.textContent = doctor
    ? `${doctor.specialty} \u00b7 ${doctor.hospital}`
    : "Encrypted consultation channel";
  if (messagesChatAvatar) {
    messagesChatAvatar.textContent = doctor
      ? doctor.name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
      : "M";
  }
  messagesInput.disabled = false;
  messagesSendBtn.disabled = false;
  if (messagesImageBtn) messagesImageBtn.disabled = false;
  if (messagesVoiceBtn) messagesVoiceBtn.disabled = false;
  setMessagesVoiceButtonState(messagesVoiceSending);
  if (messagesComposerMeta) {
    messagesComposerMeta.textContent = messagesVoiceSending
      ? "Recording in progress. Finish from the center recorder."
      : "Attach a medical image or record a voice note directly in this secure thread.";
  }

  // Full clear when switching doctors
  if (messageState._renderedId !== doctorId) {
    messageState._renderedId = doctorId;
    messageState._renderedCount = 0;
    messagesThread.innerHTML = "";
  }

  // Append only new messages (avoids animation replay for old ones)
  const newMsgs = thread.slice(messageState._renderedCount);
  if (newMsgs.length === 0) return;

  const emptyEl = messagesThread.querySelector(".messages-empty");
  if (emptyEl) emptyEl.remove();

  newMsgs.forEach((msg, index) => {
    const row = document.createElement("div");
    row.className = `msg-row ${msg.from === "user" ? "user" : "doctor"}`;
    const bubble = document.createElement("div");
    bubble.className = `msg-bubble ${msg.from === "user" ? "user" : "doctor"} msg-anim`;
    bubble.style.setProperty("--msg-delay", `${Math.min(220, index * 42)}ms`);
    bubble.innerHTML = buildPatientMessageBubble(msg);
    const span = document.createElement("span");
    span.textContent = msg.time;
    bubble.appendChild(span);
    initialiseMessageAudioPlayers(bubble);
    row.appendChild(bubble);
    messagesThread.appendChild(row);
  });

  messageState._renderedCount = thread.length;
  messagesThread.scrollTop = messagesThread.scrollHeight;
}

function openMessagesDoctorChat(doctorId) {
  if (!doctorId) return;
  if (!messageState.threads[doctorId]) messageState.threads[doctorId] = [];
  messageState.selectedDoctorId = doctorId;
  messagesFocusMode = true;
  renderMessagesLayoutMode();
  renderMessagesDoctorList();
  renderMessagesThread();
  if (messagesInput) messagesInput.focus();
}

function sendMessagesChat() {
  const doctorId = messageState.selectedDoctorId;
  const text = messagesInput?.value?.trim() || "";
  if (!doctorId) {
    showToast("Select a doctor first.", "error");
    return;
  }
  if (!text) return;
  const threadId = messageState.threadIds[doctorId];
  const now = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!messageState.threads[doctorId]) messageState.threads[doctorId] = [];
  messageState.threads[doctorId].push({ from: "user", text, time: now });
  if (messagesInput) messagesInput.value = "";
  renderMessagesDoctorList();
  renderMessagesThread();
  if (!threadId) return; // no thread yet — optimistic only
  fetch(
    `${API_BASE_URL}/messages/threads/${encodeURIComponent(threadId)}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "PATIENT", text }),
    },
  ).catch(() => {});
}

function buildAttachmentMessagePayload({
  attachmentType,
  url,
  name,
  mimeType,
  size,
}) {
  return encodeAttachmentPayload({
    kind: "attachment",
    attachmentType,
    url,
    name,
    mimeType,
    size,
  });
}

async function uploadMessagesAttachment(file, attachmentType) {
  const doctorId = messageState.selectedDoctorId;
  if (!doctorId) {
    showToast("Select a doctor first.", "error");
    return;
  }
  const threadId = messageState.threadIds[doctorId];
  if (!threadId) {
    showToast("Message thread is not ready yet.", "error");
    return;
  }

  const now = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const optimisticPayload = buildAttachmentMessagePayload({
    attachmentType,
    url: URL.createObjectURL(file),
    name: file.name,
    mimeType: file.type,
    size: file.size,
  });

  if (!messageState.threads[doctorId]) messageState.threads[doctorId] = [];
  messageState.threads[doctorId].push({
    from: "user",
    text: optimisticPayload,
    time: now,
  });
  renderMessagesDoctorList();
  renderMessagesThread();

  const form = new FormData();
  form.append("file", file, file.name);
  form.append("sender", "PATIENT");
  form.append("attachmentType", attachmentType);

  try {
    const response = await fetch(
      `${API_BASE_URL}/messages/threads/${encodeURIComponent(threadId)}/attachments`,
      {
        method: "POST",
        body: form,
      },
    );
    if (!response.ok) throw new Error("upload-failed");
  } catch (error) {
    showToast(
      `Could not send ${attachmentType === "voice" ? "voice note" : "image"}.`,
      "error",
    );
  }
}

async function toggleMessagesVoiceNote() {
  if (!messageState.selectedDoctorId) {
    showToast("Select a doctor first.", "error");
    return;
  }

  if (messagesMediaRecorder && messagesMediaRecorder.state === "recording") {
    openMessagesVoiceOverlay();
    return;
  }

  if (
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    showToast("Voice notes are not supported in this browser.", "error");
    return;
  }

  try {
    messagesVoiceStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    messagesVoiceChunks = [];
    messagesMediaRecorder = new MediaRecorder(messagesVoiceStream);
    messagesVoiceSending = true;
    messagesVoiceFinalizeMode = "send";
    openMessagesVoiceOverlay();
    if (messagesVoiceStatus)
      messagesVoiceStatus.textContent =
        "Your microphone is live. Tap done when you finish.";

    messagesMediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) messagesVoiceChunks.push(event.data);
    });

    messagesMediaRecorder.addEventListener(
      "stop",
      async () => {
        const mimeType = messagesMediaRecorder?.mimeType || "audio/webm";
        const extension = mimeType.includes("mpeg")
          ? "mp3"
          : mimeType.includes("wav")
            ? "wav"
            : mimeType.includes("ogg")
              ? "ogg"
              : "webm";
        const audioBlob = new Blob(messagesVoiceChunks, { type: mimeType });
        const file = new File(
          [audioBlob],
          `voice-note-${Date.now()}.${extension}`,
          { type: mimeType },
        );
        messagesVoiceSending = false;
        messagesVoiceStream?.getTracks().forEach((track) => track.stop());
        messagesVoiceStream = null;
        messagesMediaRecorder = null;
        messagesVoiceChunks = [];
        if (messagesVoiceFinalizeMode === "send") {
          await uploadMessagesAttachment(file, "voice");
        }
        messagesVoiceFinalizeMode = "send";
        closeMessagesVoiceOverlay();
        setMessagesVoiceButtonState(false);
        if (messagesComposerMeta)
          messagesComposerMeta.textContent =
            "Attach a medical image or record a voice note directly in this secure thread.";
      },
      { once: true },
    );

    messagesMediaRecorder.start();
    setMessagesVoiceButtonState(true);
    if (messagesComposerMeta)
      messagesComposerMeta.textContent =
        "Recording in progress. Finish from the center recorder.";
  } catch (error) {
    showToast("Could not start voice recording.", "error");
  }
}

function saveCustomDoctorsState() {
  try {
    localStorage.setItem(
      CUSTOM_DOCTORS_STORAGE_KEY,
      JSON.stringify(customDoctorsState),
    );
  } catch (error) {
    // Ignore storage failures.
  }
}

function getNextDoctorId() {
  const numbers = doctorDirectory
    .map((doctor) => Number((doctor.id || "").replace("doc-", "")))
    .filter((num) => Number.isFinite(num) && num > 0);
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `doc-${String(next).padStart(3, "0")}`;
}

function loadCustomDoctorsState() {
  try {
    const raw = localStorage.getItem(CUSTOM_DOCTORS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    parsed.forEach((doctor) => {
      if (!doctor?.id || !doctor?.name) return;
      const exists = doctorDirectory.some((entry) => entry.id === doctor.id);
      if (exists) return;
      doctorDirectory.push({
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty || "General Medicine",
        hospital: doctor.hospital || "Independent Clinic",
        rating: Number.isFinite(Number(doctor.rating))
          ? Number(doctor.rating)
          : 4.6,
        consultFee: Number(doctor.consultFee) || 700,
        slots: Array.isArray(doctor.slots) ? doctor.slots : [],
      });
      customDoctorsState.push({
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty || "General Medicine",
        hospital: doctor.hospital || "Independent Clinic",
        rating: Number.isFinite(Number(doctor.rating))
          ? Number(doctor.rating)
          : 4.6,
        consultFee: Number(doctor.consultFee) || 700,
      });
      if (!messageState.threads[doctor.id])
        messageState.threads[doctor.id] = [];
    });
  } catch (error) {
    // Ignore bad persisted data and continue defaults.
  }
}

function hasAppointmentWithDoctor(doctorId) {
  return Object.values(appointments).some((apt) => apt.doctorId === doctorId);
}

function renderDoctorNetwork() {
  if (!networkDoctorList || !networkCareTeamCount || !networkConnectedCount)
    return;

  const getDoctorRating = (doctor) => {
    if (Number.isFinite(Number(doctor.rating)))
      return Number(doctor.rating).toFixed(1);
    const seed = Number((doctor.id || "doc-001").replace("doc-", "")) || 1;
    return (4.3 + (seed % 7) * 0.1).toFixed(1);
  };

  const getDoctorHours = (doctor) => {
    const seed = Number((doctor.id || "doc-001").replace("doc-", "")) || 1;
    const windows = [
      "Mon-Sat - 09:00 AM - 01:00 PM",
      "Mon-Fri - 10:30 AM - 04:30 PM",
      "Tue-Sun - 08:00 AM - 12:00 PM",
      "Mon-Sat - 05:00 PM - 09:00 PM",
      "Mon-Fri - 11:00 AM - 06:00 PM",
    ];
    return windows[seed % windows.length];
  };

  const visibleDoctors = doctorDirectory.filter(
    (doctor) =>
      hasAppointmentWithDoctor(doctor.id) ||
      customDoctorsState.some((cd) => cd.id === doctor.id),
  );

  const careTeamCount = Math.max(
    1,
    Math.min(visibleDoctors.length, 3 + customDoctorsState.length),
  );
  networkCareTeamCount.textContent = `${careTeamCount}`;
  networkConnectedCount.textContent = `${visibleDoctors.length}`;

  const listHtml = visibleDoctors
    .map((doctor) => {
      const doctorMeiosisId = `M-${doctor.id.replace("doc-", "").padStart(3, "0")}`;
      const rating = getDoctorRating(doctor);
      const workingHours = getDoctorHours(doctor);
      const initials = doctor.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
      const canMessage = hasAppointmentWithDoctor(doctor.id);
      return `
      <article class="doctor-card-square network-doctor-card">
        <div class="network-doctor-top">
          <div class="network-doctor-avatar">${initials}</div>
          <div class="network-doctor-copy">
            <p class="network-doctor-name"><strong>${doctor.name}</strong></p>
            <p class="hint">${doctor.specialty}</p>
            <p class="hint">${doctor.hospital}</p>
          </div>
        </div>

        <div class="network-chip-row">
          <span class="chip">★ ${rating}/5</span>
          <span class="chip">Fee Rs ${Number(doctor.consultFee || 700)}</span>
        </div>

        <ul class="info-list network-doctor-meta">
          <li><strong>Working Hours:</strong> ${workingHours}</li>
          <li><strong>Doctor MEIOSIS ID:</strong> ${doctorMeiosisId}</li>
        </ul>

        <div class="button-row network-doctor-actions">
          ${canMessage ? `<button class="btn" data-action="messages-open-doctor" data-doctor-id="${doctor.id}">Message</button>` : ""}
          <button class="ghost-btn" data-action="doctor-info" data-doctor-id="${doctor.id}">Info</button>
        </div>
      </article>
    `;
    })
    .join("");

  networkDoctorList.innerHTML =
    listHtml || '<p class="hint">No doctors connected yet.</p>';
}

function openDoctorInfoModal(doctorId) {
  const doctor = doctorDirectory.find((item) => item.id === doctorId);
  if (!doctor) {
    showToast("Doctor details not found.", "error");
    return;
  }

  const doctorMeiosisId = `M-${doctor.id.replace("doc-", "").padStart(3, "0")}`;
  const rating = Number.isFinite(Number(doctor.rating))
    ? Number(doctor.rating).toFixed(1)
    : "4.6";
  const seed = Number((doctor.id || "doc-001").replace("doc-", "")) || 1;
  const hours = [
    "Mon-Sat - 09:00 AM - 01:00 PM",
    "Mon-Fri - 10:30 AM - 04:30 PM",
    "Tue-Sun - 08:00 AM - 12:00 PM",
    "Mon-Sat - 05:00 PM - 09:00 PM",
    "Mon-Fri - 11:00 AM - 06:00 PM",
  ][seed % 5];
  const experience = 6 + (seed % 9);
  const languages = [
    "English, Hindi",
    "English, Kannada",
    "English, Hindi, Tamil",
    "English, Marathi",
  ];
  const languageText = languages[seed % languages.length];

  openModal(
    `${doctor.name} - Doctor Details`,
    `
      <div class="card-grid two-col">
        <div>
          <p><strong>Specialty:</strong> ${doctor.specialty}</p>
          <p><strong>Hospital:</strong> ${doctor.hospital}</p>
          <p><strong>Consultation Fee:</strong> Rs ${Number(doctor.consultFee || 700)}</p>
          <p><strong>Doctor MEIOSIS ID:</strong> ${doctorMeiosisId}</p>
        </div>
        <div>
          <p><strong>Rating:</strong> ${rating}/5</p>
          <p><strong>Working Hours:</strong> ${hours}</p>
          <p><strong>Experience:</strong> ${experience} years</p>
          <p><strong>Languages:</strong> ${languageText}</p>
        </div>
      </div>
      <p class="hint">Use Message for direct consultation chat.</p>
      <div class="button-row">
        <button class="btn" data-action="messages-open-doctor" data-doctor-id="${doctor.id}">Message Doctor</button>
      </div>
    `,
  );
}

function openAddPersonalDoctorModal() {
  const criteria = networkAddFlow;
  openModal(
    "Add Personal Doctor - Enter Criteria",
    `
      <p class="hint">Enter details to find matching doctors, then choose one to add.</p>
      <div class="card-grid two-col">
        <label>Doctor Name
          <input class="add-flow-search" data-network-doctor-name type="text" placeholder="e.g. Dr. Neha Kapoor" value="${(criteria.name || "").replace(/"/g, "&quot;")}" />
        </label>
        <label>Specialty
          <input class="add-flow-search" data-network-doctor-specialty type="text" placeholder="e.g. General Medicine" value="${(criteria.specialty || "").replace(/"/g, "&quot;")}" />
        </label>
        <label>Hospital/Clinic
          <input class="add-flow-search" data-network-doctor-hospital type="text" placeholder="e.g. City Care Clinic" value="${(criteria.hospital || "").replace(/"/g, "&quot;")}" />
        </label>
      </div>
      <div class="button-row">
        <button class="btn" data-action="network-find-doctors">Find Doctors</button>
        <button class="ghost-btn" data-action="network-cancel-doctor">Cancel</button>
      </div>
    `,
  );
}

function addDoctorToNetwork(doctorInput) {
  const name = doctorInput.name?.trim() || "";
  const specialty = doctorInput.specialty?.trim() || "";
  const hospital = doctorInput.hospital?.trim() || "";
  const consultFee = Number(doctorInput.consultFee || 700);
  const rating = Number(doctorInput.rating || 4.6);
  if (!name || !specialty || !hospital) return false;
  const alreadyExists = doctorDirectory.some(
    (doctor) =>
      doctor.name.toLowerCase() === name.toLowerCase() &&
      doctor.hospital.toLowerCase() === hospital.toLowerCase(),
  );
  if (alreadyExists) {
    showToast("This doctor is already in your network.", "error");
    return false;
  }
  const id = getNextDoctorId();
  const doctor = {
    id,
    name,
    specialty,
    hospital,
    rating: Number.isFinite(rating) ? rating : 4.6,
    consultFee:
      Number.isFinite(consultFee) && consultFee > 0 ? consultFee : 700,
    slots: [],
  };
  doctorDirectory.push(doctor);
  customDoctorsState.push({
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialty,
    hospital: doctor.hospital,
    rating: doctor.rating,
    consultFee: doctor.consultFee,
  });
  if (!messageState.threads[doctor.id]) messageState.threads[doctor.id] = [];

  saveCustomDoctorsState();
  renderDoctorNetwork();
  renderMessagesDoctorList();
  return true;
}

function findDoctorsByCriteria(criteria) {
  const nameQ = (criteria.name || "").trim().toLowerCase();
  const specQ = (criteria.specialty || "").trim().toLowerCase();
  const hospQ = (criteria.hospital || "").trim().toLowerCase();
  const hasAny = Boolean(nameQ || specQ || hospQ);
  if (!hasAny) return [];
  return doctorDiscoveryCatalog.filter(
    (doctor) =>
      (!nameQ || doctor.name.toLowerCase().includes(nameQ)) &&
      (!specQ || doctor.specialty.toLowerCase().includes(specQ)) &&
      (!hospQ || doctor.hospital.toLowerCase().includes(hospQ)),
  );
}

function openNetworkDoctorResultsModal() {
  const matches = findDoctorsByCriteria(networkAddFlow);
  const listHtml = matches
    .map((doctor) => {
      const isConnected = doctorDirectory.some(
        (entry) =>
          entry.name.toLowerCase() === doctor.name.toLowerCase() &&
          entry.hospital.toLowerCase() === doctor.hospital.toLowerCase(),
      );
      return `
      <div class="doctor-item emr-doctor-item ${isConnected ? "selected" : ""}">
        <div>
          <p><strong>${doctor.name}</strong></p>
          <p class="hint">${doctor.specialty} - ${doctor.hospital}</p>
          <p class="hint"><strong>Consultation Fee:</strong> Rs ${doctor.consultFee}</p>
          <p class="hint">Rating: <strong>${doctor.rating.toFixed(1)}/5</strong></p>
        </div>
        <button class="${isConnected ? "ghost-btn" : "btn"}" data-action="network-add-candidate" data-network-candidate-id="${doctor.extId}" ${isConnected ? "disabled" : ""}>
          ${isConnected ? "Added" : "Add"}
        </button>
      </div>
    `;
    })
    .join("");

  openModal(
    "Matching Doctors",
    `
      <p class="hint">Select a doctor from matching results.</p>
      <div class="doctor-list">
        ${listHtml || '<p class="hint">No matches found for these criteria.</p>'}
      </div>
      <div class="button-row">
        ${matches.length ? '<button class="btn" data-action="network-add-custom">Add as New Doctor</button>' : ""}
        <button class="ghost-btn" data-action="network-back-search">Back</button>
      </div>
    `,
  );
}

function addPersonalDoctorFromCriteria() {
  const name = networkAddFlow.name || "";
  const specialty = networkAddFlow.specialty || "General Medicine";
  const hospital = networkAddFlow.hospital || "Independent Clinic";
  if (name.length < 3) {
    showToast(
      "Enter at least doctor name (3+ chars) to add as new doctor.",
      "error",
    );
    return;
  }
  const added = addDoctorToNetwork({
    name,
    specialty,
    hospital,
    consultFee: 700,
    rating: 4.6,
  });
  if (!added) return;
  closeDetailModal();
  showToast("Personal doctor added to your network.", "success");
}

function getActiveNfcCard() {
  return (
    nfcCards.find((card) => card.id === activeNfcCardId) || nfcCards[0] || null
  );
}

function getNfcCardById(cardId) {
  return nfcCards.find((card) => card.id === cardId) || null;
}

function generateUniqueNfcIdentity(cardId) {
  let identityUrl = "";
  let passcode = "";
  do {
    const suffix = Math.floor(100000 + Math.random() * 900000);
    identityUrl = `https://id.meiosis.health/p/PAT-${universalIdState.code}/c/${cardId}-${suffix}`;
  } while (usedNfcIdentityUrls.has(identityUrl));

  do {
    passcode = `PC-${Math.floor(100000 + Math.random() * 900000)}`;
  } while (usedNfcPasscodes.has(passcode));

  usedNfcIdentityUrls.add(identityUrl);
  usedNfcPasscodes.add(passcode);
  return { identityUrl, passcode };
}

function renderNfcCardsStrip() {
  if (!nfcCardsStripEl) return;
  if (!nfcCards.length) {
    nfcCardsStripEl.innerHTML = '<div class="hint">No linked cards yet.</div>';
    return;
  }

  nfcCardsStripEl.innerHTML = nfcCards
    .map((card) => {
      const isActiveCard = card.id === activeNfcCardId;
      const statusClass = card.status === "Active" ? "active" : "expired";
      const showActivated = isActiveCard && card.status === "Active";
      return `
      <article class="glass nfc-mini-card ${isActiveCard ? "selected" : ""}">
        <p class="nfc-mini-id">${card.id}</p>
        <h3>${card.label}</h3>
        <p class="hint">${card.hospital}</p>
        <p class="hint">Issued: ${card.issuedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
        <p class="hint">URL: ${card.identityUrl}</p>
        <p class="hint">Passcode: ${card.passcode}</p>
        <span class="chip ${statusClass}">${card.status}</span>
        <div class="button-row">
          <button class="${showActivated ? "ghost-btn" : "btn"}" data-action="select-nfc-card" data-nfc-card-id="${card.id}" ${showActivated ? "disabled" : ""}>
            ${showActivated ? "Activated" : "Activate Card"}
          </button>
        </div>
      </article>
    `;
    })
    .join("");
}

function renderNfcCardState() {
  if (!nfcCardStatus) return;
  const activeCard = getActiveNfcCard();
  if (!activeCard) return;

  isNfcCardActive = activeCard.status === "Active";

  const hospitalCount = new Set(nfcCards.map((card) => card.hospital)).size;
  const linkedDoctors = Math.max(
    ...nfcCards.map((card) => card.linkedDoctorCount || 0),
    5,
  );
  if (nfcLastUsedEl) nfcLastUsedEl.textContent = activeCard.lastUsed;
  if (nfcLinkedHospitalsEl)
    nfcLinkedHospitalsEl.textContent = String(hospitalCount);
  if (nfcLinkedDoctorsEl)
    nfcLinkedDoctorsEl.textContent = String(linkedDoctors);
  if (nfcIdentityUrlEl)
    nfcIdentityUrlEl.textContent = activeCard.identityUrl || "--";
  if (nfcCardPasscodeEl)
    nfcCardPasscodeEl.textContent = activeCard.passcode || "--";
  nfcCardStatus.classList.remove("active", "expired");
  if (isNfcCardActive) {
    nfcCardStatus.classList.add("active");
    nfcCardStatus.textContent = "Active";
    if (nfcToggleCardBtn) {
      nfcToggleCardBtn.textContent = "Disable Card";
      nfcToggleCardBtn.classList.remove("btn");
      nfcToggleCardBtn.classList.add("ghost-btn");
    }
  } else {
    nfcCardStatus.classList.add("expired");
    nfcCardStatus.textContent = "Deactivated";
    if (nfcToggleCardBtn) {
      nfcToggleCardBtn.textContent = "Enable Card";
      nfcToggleCardBtn.classList.remove("ghost-btn");
      nfcToggleCardBtn.classList.add("btn");
    }
  }
  renderNfcCardsStrip();
}

function renderEmergencyStatus() {
  if (!nfcEmergencyStatus) return;
  nfcEmergencyStatus.classList.remove(
    "active",
    "pending",
    "complete",
    "expired",
  );
  if (emergencyOverrideActive) {
    nfcEmergencyStatus.classList.add("pending");
    const untilText = emergencyOverrideUntil
      ? emergencyOverrideUntil.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "set";
    nfcEmergencyStatus.textContent = `On (till ${untilText})`;
  } else {
    nfcEmergencyStatus.classList.add("complete");
    nfcEmergencyStatus.textContent = "Off";
  }
}

function openDisableCardSelectionStep() {
  const cardsHtml = nfcCards
    .map((card) => {
      const isActive = card.status === "Active";
      return `
      <div class="doctor-item emr-doctor-item">
        <div>
          <p><strong>${card.label}</strong> <span class="hint">(${card.id})</span></p>
          <p class="hint">${card.hospital} - Status: ${card.status}</p>
        </div>
        <button class="${isActive ? "danger" : "ghost-btn"}" ${isActive ? "" : "disabled"} data-nfc-disable-pick data-nfc-card-id="${card.id}">
          ${isActive ? "Disable" : "Already Disabled"}
        </button>
      </div>
    `;
    })
    .join("");

  openModal(
    "Disable NFC Card",
    `
      <p>Select which NFC card you want to disable.</p>
      <div class="doctor-list">${cardsHtml}</div>
      <div class="button-row">
        <button class="ghost-btn" data-nfc-disable-cancel>Cancel</button>
      </div>
    `,
  );
}

function openDisableCardConfirmStep(cardId) {
  const card = getNfcCardById(cardId);
  if (!card) return;
  if (card.status !== "Active") {
    openModal(
      "NFC Card Already Deactivated",
      `<p><strong>${card.label}</strong> is already deactivated.</p>`,
    );
    return;
  }

  openModal(
    "Disable NFC Card",
    `
      <div class="confirm-box">
        <p><strong>Are you sure you want to deactivate <em>${card.label}</em> (${card.id})?</strong></p>
        <p>After deactivation, hospital scan access via this card will stop immediately.</p>
        <div class="button-row">
          <button class="danger" data-nfc-disable-confirm data-nfc-card-id="${card.id}">Yes, Continue</button>
          <button class="ghost-btn" data-nfc-disable-cancel>Cancel</button>
        </div>
      </div>
    `,
  );
}

function openDisableCardOtpStep(cardId) {
  openModal(
    "OTP Verification",
    `
      <p>Enter the 6-digit OTP sent to your registered mobile number.</p>
      <input class="add-flow-search" data-nfc-otp-input type="text" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit OTP" autocomplete="one-time-code" />
      <div class="button-row">
        <button class="btn" data-nfc-disable-submit data-nfc-card-id="${cardId}">Verify & Deactivate</button>
        <button class="ghost-btn" data-nfc-disable-cancel>Cancel</button>
      </div>
    `,
  );
}

function completeDisableCard(cardId) {
  const card = getNfcCardById(cardId);
  if (!card) return;
  card.status = "Deactivated";
  card.lastUsed = `${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - Card manually disabled`;
  activeNfcCardId = card.id;
  renderNfcCardState();
  openModal(
    "Card Successfully Deactivated",
    `<p><strong>${card.label}</strong> access is now disabled. You can still use app-based emergency controls.</p>`,
  );
  showToast("NFC card deactivated successfully.", "success");
}

function openEnableCardConfirmStep() {
  if (isNfcCardActive) {
    openModal(
      "NFC Card Already Active",
      "<p>Your NFC card is already active and ready for scans.</p>",
    );
    return;
  }

  openModal(
    "Enable NFC Card",
    `
      <div class="confirm-box">
        <p><strong>Enable this NFC card again?</strong></p>
        <p>Hospital scan access will resume immediately after confirmation.</p>
        <div class="button-row">
          <button class="btn" data-nfc-enable-confirm>Yes, Enable</button>
          <button class="ghost-btn" data-nfc-disable-cancel>Cancel</button>
        </div>
      </div>
    `,
  );
}

function completeEnableCard() {
  const activeCard = getActiveNfcCard();
  if (!activeCard) return;
  activeCard.status = "Active";
  activeCard.lastUsed = `${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - Card re-enabled`;
  renderNfcCardState();
  openModal(
    "Card Successfully Enabled",
    "<p>NFC card access is now active again. You can use scan-based access as usual.</p>",
  );
  showToast("NFC card enabled successfully.", "success");
}

function openAddNfcCardCodeStep() {
  addNfcFlow.readerConnected = false;
  openModal(
    "Add New NFC Card - Verify Code",
    `
      <p>Enter your 10-digit MEIOSIS code to continue.</p>
      <input class="add-flow-search" data-nfc-add-code type="text" maxlength="10" inputmode="numeric" placeholder="Enter 10-digit MEIOSIS code" />
      <div class="button-row">
        <button class="btn" data-nfc-add-code-verify>Verify Code</button>
        <button class="ghost-btn" data-nfc-add-cancel>Cancel</button>
      </div>
    `,
  );
}

function openAddNfcCardOtpStep() {
  openModal(
    "Add New NFC Card - OTP Verification",
    `
      <p>Enter the 6-digit OTP sent to your registered mobile number.</p>
      <input class="add-flow-search" data-nfc-add-otp type="text" maxlength="6" inputmode="numeric" placeholder="Enter 6-digit OTP" autocomplete="one-time-code" />
      <div class="button-row">
        <button class="btn" data-nfc-add-otp-verify>Verify OTP</button>
        <button class="ghost-btn" data-nfc-add-cancel>Cancel</button>
      </div>
    `,
  );
}

function openAddNfcCardScanStep() {
  const nextNo = nfcCards.length + 1;
  openModal(
    "Add New NFC Card - Reader Scan",
    `
      <div class="nfc-scan-stage">
        <p><strong>Step 3:</strong> Connect NFC reader and scan card to provision.</p>
        <div class="nfc-qr-scanner" aria-hidden="true">
          <div class="qr-grid"></div>
          <div class="qr-corner tl"></div>
          <div class="qr-corner tr"></div>
          <div class="qr-corner bl"></div>
          <div class="qr-corner br"></div>
          <div class="qr-scan-line"></div>
          <div class="qr-glow"></div>
        </div>
        <div class="nfc-scan-bars" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <p class="hint">${addNfcFlow.readerConnected ? "Reader connected. Ready to scan." : "Reader not connected."}</p>
      </div>
      <label>Card Label
        <input class="add-flow-search" data-nfc-card-label type="text" maxlength="24" value="Backup Card ${nextNo}" placeholder="e.g. Wallet Card / Family Backup" />
      </label>
      <label>Assign to Hospital
        <select class="add-flow-search" data-nfc-card-hospital>
          <option>City General</option>
          <option>Nova Care</option>
          <option>Sunrise Clinic</option>
        </select>
      </label>
      <div class="button-row">
        <button class="ghost-btn" data-nfc-reader-connect>${addNfcFlow.readerConnected ? "Reader Connected" : "Connect NFC Reader"}</button>
        <button class="btn" data-nfc-add-submit ${addNfcFlow.readerConnected ? "" : "disabled"}>Scan & Add Card</button>
        <button class="ghost-btn" data-nfc-add-cancel>Cancel</button>
      </div>
      <p class="hint">Connect your MEIOSIS NFC card to this account.</p>
    `,
  );
}

function openAddNfcScanSuccessStep(label, hospital) {
  openModal(
    "NFC Card Scan Successful",
    `
      <div class="nfc-scan-stage">
        <p><strong>Card detected.</strong> Finalizing secure provisioning...</p>
        <div class="nfc-qr-scanner success" aria-hidden="true">
          <div class="qr-grid"></div>
          <div class="qr-corner tl"></div>
          <div class="qr-corner tr"></div>
          <div class="qr-corner bl"></div>
          <div class="qr-corner br"></div>
          <div class="qr-scan-line"></div>
          <div class="qr-glow"></div>
          <svg class="qr-big-tick" viewBox="0 0 80 80">
            <circle class="qr-tick-circle" cx="40" cy="40" r="34"></circle>
            <path class="qr-tick-path" d="M22 41 L35 54 L58 29"></path>
          </svg>
        </div>
      </div>
    `,
  );

  setTimeout(() => {
    completeAddNfcCard(label, hospital);
  }, 950);
}

function completeAddNfcCard(label, hospital) {
  const nextNumber = nfcCards.length + 1;
  const cardId = `CARD-${String(nextNumber).padStart(3, "0")}`;
  const identity = generateUniqueNfcIdentity(cardId);
  nfcCards.push({
    id: cardId,
    label,
    hospital,
    status: "Active",
    linkedDoctorCount: 5 + nfcCards.length,
    lastUsed: `Just now (provisioned at ${hospital})`,
    issuedAt: new Date(),
    identityUrl: identity.identityUrl,
    passcode: identity.passcode,
  });
  activeNfcCardId = cardId;
  nfcScanHistory.unshift({
    time: new Date().toLocaleString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    location: `${hospital} NFC Desk`,
    hospital,
    type: `Card Provisioning (${label})`,
    result: "Granted",
  });
  renderNfcCardState();
  openModal(
    "New Card Added",
    `<p><strong>${label}</strong> is now active and linked.</p>
     <p>Provisioned at: ${hospital}</p>
     <p>Total linked cards: ${nfcCards.length}</p>`,
  );
  showToast("New NFC card added and activated.", "success");
}

function openDoctorScanAutoFetchModal() {
  const activeCard = getActiveNfcCard();
  if (!activeCard) return;
  if (activeCard.status !== "Active") {
    showToast("Activate this card before scan-based identity fetch.", "error");
    return;
  }

  openModal(
    "Doctor Scan in Progress",
    `
      <div class="nfc-scan-stage">
        <div class="nfc-qr-scanner" aria-hidden="true">
          <div class="qr-grid"></div>
          <div class="qr-corner tl"></div>
          <div class="qr-corner tr"></div>
          <div class="qr-corner bl"></div>
          <div class="qr-corner br"></div>
          <div class="qr-scan-line"></div>
          <div class="qr-glow"></div>
        </div>
        <p class="lead">Scanning NFC identity and fetching patient history...</p>
        <div class="loading-line" style="width:min(320px, 92%);"></div>
      </div>
    `,
  );

  setTimeout(() => {
    const sortedAppointments = getSortedAppointments();
    const upcoming = sortedAppointments.filter(
      ([, appt]) => getAppointmentDateObj(appt) >= new Date(),
    );
    const past = sortedAppointments.filter(
      ([, appt]) => getAppointmentDateObj(appt) < new Date(),
    );
    const upcomingRows =
      upcoming
        .slice(0, 4)
        .map(
          ([, appt]) =>
            `<li>${getAppointmentDateTime(appt)} - ${appt.doctor} (${appt.specialty})</li>`,
        )
        .join("") || "<li>None</li>";
    const pastRows =
      past
        .slice(0, 4)
        .map(
          ([, appt]) =>
            `<li>${getAppointmentDateTime(appt)} - ${appt.doctor} (${appt.specialty})</li>`,
        )
        .join("") || "<li>None</li>";

    nfcScanHistory.unshift({
      time: new Date().toLocaleString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      location: "Doctor Dashboard Terminal",
      hospital: activeCard.hospital,
      type: `Identity Fetch (${activeCard.id})`,
      result: "Granted",
    });
    activeCard.lastUsed = `${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - Doctor dashboard fetch`;
    renderNfcCardState();

    openModal(
      "Patient Identity Auto-Fetch Complete",
      `
        <div class="mock-pdf" role="document" aria-label="Doctor Auto Fetch">
          <div class="mock-pdf-header">
            <strong>MEIOSIS Identity Packet</strong>
            <span class="hint">${activeCard.id} - ${activeCard.passcode}</span>
          </div>
          <div class="mock-pdf-page">
            <p><strong>Patient:</strong> ${profileState.name}</p>
            <p><strong>Universal ID:</strong> ${universalIdState.code}</p>
            <p><strong>Identity URL:</strong> ${activeCard.identityUrl}</p>
            <p><strong>Allergies:</strong> Penicillin, Dust mites</p>
            <p><strong>Chronic Conditions:</strong> Hypertension, Prediabetes</p>
          </div>
          <div class="mock-pdf-page">
            <p><strong>Upcoming Appointments</strong></p>
            <ul>${upcomingRows}</ul>
            <p><strong>Past Appointments</strong></p>
            <ul>${pastRows}</ul>
          </div>
          <div class="mock-pdf-page">
            <p><strong>Auto-loaded Modules:</strong></p>
            <ul>
              <li>EMR timeline + visit notes</li>
              <li>Lab reports and imaging references</li>
              <li>Prescription history and active medications</li>
              <li>Access logs and emergency controls</li>
            </ul>
            <p class="hint">Mock doctor-side auto-fetch preview from NFC identity scan.</p>
          </div>
        </div>
      `,
    );
    showToast("Doctor scan fetched full patient history.", "success");
  }, 1100);
}

function openNfcScanHistoryModal() {
  const rows = nfcScanHistory.length
    ? nfcScanHistory
        .map(
          (entry) => `
        <tr>
          <td>${entry.time}</td>
          <td>${entry.location}</td>
          <td>${entry.hospital}</td>
          <td>${entry.type}</td>
          <td><span class="chip ${entry.result === "Granted" ? "active" : "pending"}">${entry.result}</span></td>
        </tr>
      `,
        )
        .join("")
    : '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted,#98aabe);">No scan events recorded yet.</td></tr>';

  openModal(
    "NFC Scan History",
    `
      <div class="card-grid two-col">
        <article class="glass card">
          <h2>Scan Summary</h2>
          <ul class="info-list">
            <li><strong>Total Scans (30 days):</strong> ${nfcScanHistory.length}</li>
            <li><strong>Last Scan:</strong> ${nfcScanHistory[0]?.time || "--"}</li>
            <li><strong>Denied Attempts:</strong> 0</li>
          </ul>
        </article>
        <article class="glass card">
          <h2>Security Note</h2>
          <p class="hint">All scans are timestamped and patient-auditable. Limited emergency reads are separately flagged.</p>
          <div class="button-row">
            <button class="ghost-btn" data-action="download-audit">Download Audit Report</button>
          </div>
        </article>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Time</th><th>Location</th><th>Hospital</th><th>Type</th><th>Result</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `,
  );
}

function openRegenerateTokenConfirmModal() {
  openModal(
    "Regenerate Access Token",
    `
      <div class="confirm-box">
        <p><strong>Generate a new NFC access token?</strong></p>
        <p>Current token: <code>${nfcAccessToken}</code></p>
        <p class="hint">Old token will be invalidated after regeneration.</p>
        <div class="button-row">
          <button class="btn" data-nfc-token-confirm>Regenerate Now</button>
          <button class="ghost-btn" data-nfc-token-cancel>Cancel</button>
        </div>
      </div>
    `,
  );
}

function regenerateNfcToken() {
  const oldToken = nfcAccessToken;
  nfcAccessToken = `MTK-${Math.floor(100000 + Math.random() * 900000)}`;
  nfcTokenIssuedAt = new Date();
  const issued = nfcTokenIssuedAt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const expiry = new Date(
    nfcTokenIssuedAt.getTime() + 30 * 60 * 1000,
  ).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" });

  openModal(
    "Access Token Regenerated",
    `
      <div class="mock-pdf">
        <div class="mock-pdf-header">
          <strong>NFC Token Updated</strong>
          <span class="hint">Issued: ${issued}</span>
        </div>
        <div class="mock-pdf-page">
          <p><strong>Old Token:</strong> ${oldToken}</p>
          <p><strong>New Token:</strong> <code id="newNfcToken">${nfcAccessToken}</code></p>
          <p><strong>Valid Till:</strong> ${expiry}</p>
          <p class="hint">Use this token for secure scan-based access sync.</p>
        </div>
        <div class="button-row">
          <button class="btn" data-nfc-token-copy>Copy Token</button>
          <button class="ghost-btn" data-action="view-scan-history">View Scan History</button>
        </div>
      </div>
    `,
  );
  showToast("New access token generated.", "success");
}

function openEmergencyOverridePanel() {
  const statusLine = emergencyOverrideActive
    ? `Currently active until ${emergencyOverrideUntil?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) || "-"}`
    : "Currently disabled";

  openModal(
    "Emergency Override Controls",
    `
      <div class="card-grid two-col">
        <article class="glass card">
          <h2>Current Status</h2>
          <p><strong>${statusLine}</strong></p>
          <p class="hint">When enabled, emergency teams get limited, time-bound access to critical data.</p>
          <div class="button-row">
            <button class="btn" data-emg-start data-emg-duration="30">Enable for 30 mins</button>
            <button class="ghost-btn" data-emg-start data-emg-duration="120">Enable for 2 hours</button>
            <button class="danger" data-emg-disable>Disable Override</button>
          </div>
        </article>
        <article class="glass card">
          <h2>Access Scope</h2>
          <ul class="timeline-list">
            <li>Visible: allergies, active medications, chronic conditions</li>
            <li>Hidden: financial data, full consult notes, non-critical files</li>
            <li>Audit: all emergency reads are logged and exportable</li>
          </ul>
        </article>
      </div>
    `,
  );
}

function openEmergencyDoctorIdStep(durationMinutes) {
  const acceptedDoctorIds = doctorDirectory
    .map((doctor) => `M-${doctor.id.replace("doc-", "").padStart(3, "0")}`)
    .join(", ");

  openModal(
    "Emergency Override Doctor Verification",
    `
      <p>Confirm emergency override for <strong>${durationMinutes} minutes</strong>.</p>
      <input class="add-flow-search" data-emg-doctor-id-input type="text" maxlength="8" placeholder="Enter Doctor MEIOSIS ID (e.g. M-001)" />
      <p class="validation-text">Mock valid Doctor MEIOSIS IDs: ${acceptedDoctorIds}</p>
      <div class="button-row">
        <button class="btn" data-emg-doctor-id-submit data-emg-duration="${durationMinutes}">Verify & Enable</button>
        <button class="ghost-btn" data-emg-cancel>Cancel</button>
      </div>
    `,
  );
}

function enableEmergencyOverride(durationMinutes) {
  emergencyOverrideActive = true;
  emergencyOverrideUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  renderEmergencyStatus();
  openModal(
    "Emergency Override Enabled",
    `<p>Emergency override is active for ${durationMinutes} minutes.</p>
     <p>Expires at: ${emergencyOverrideUntil.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>`,
  );
  showToast("Emergency override enabled.", "success");
}

function disableEmergencyOverride() {
  emergencyOverrideActive = false;
  emergencyOverrideUntil = null;
  renderEmergencyStatus();
  openModal(
    "Emergency Override Disabled",
    "<p>Emergency override access has been turned off.</p>",
  );
  showToast("Emergency override disabled.", "success");
}

function formatDateTime(dateString, timeString) {
  const date = new Date(`${dateString}T00:00:00`);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${formattedDate} - ${timeString}`;
}

function getAppointmentDateTime(appt) {
  return formatDateTime(appt.scheduledDate, appt.scheduledTime);
}

function getAppointmentSlotDisplay(appt) {
  if (appt.queueNumber) return `Queue ${appt.queueNumber}`;
  if (appt.status && String(appt.status).toLowerCase() === "pending")
    return "Awaiting assignment";
  return "Assigned";
}

function getSlotDateTimeIso(slot) {
  const [time, period] = (slot.time || "12:00 AM").split(" ");
  const [hh, mm] = time.split(":").map(Number);
  let hours = hh;
  if (period === "PM" && hh !== 12) hours += 12;
  if (period === "AM" && hh === 12) hours = 0;
  const date = new Date(`${slot.date}T00:00:00`);
  date.setHours(hours, mm, 0, 0);
  return date.toISOString();
}

function saveAppointmentsState() {
  try {
    localStorage.setItem(
      APPOINTMENTS_STORAGE_KEY,
      JSON.stringify(appointments),
    );
  } catch (error) {
    // Ignore storage failures so UI still works in restricted modes.
  }
}

function loadAppointmentsState() {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.keys(appointments).forEach((id) => delete appointments[id]);
    Object.entries(parsed).forEach(([id, appt]) => {
      appointments[id] = appt;
    });
  } catch (error) {
    // Ignore corrupt or unavailable storage.
  }
}

function getAppointmentDateObj(appt) {
  const [time, period] = appt.scheduledTime.split(" ");
  const [hh, mm] = time.split(":").map(Number);
  let hours = hh;
  if (period === "PM" && hh !== 12) hours += 12;
  if (period === "AM" && hh === 12) hours = 0;

  const date = new Date(`${appt.scheduledDate}T00:00:00`);
  date.setHours(hours, mm, 0, 0);
  return date;
}

function getSortedAppointments() {
  return Object.entries(appointments).sort(
    (a, b) => getAppointmentDateObj(a[1]) - getAppointmentDateObj(b[1]),
  );
}

/* ── OTP polling ── */
let _otpPollTimer = null;

function startOtpPolling() {
  const patientId = authSession && authSession.patientId;
  if (!patientId) return;
  stopOtpPolling();
  pollOtpStatus();
  _otpPollTimer = setInterval(pollOtpStatus, 5000);
}

function stopOtpPolling() {
  if (_otpPollTimer) {
    clearInterval(_otpPollTimer);
    _otpPollTimer = null;
  }
  const section = document.getElementById("myQrOtpSection");
  if (section) section.classList.add("hidden");
}

async function pollOtpStatus() {
  const patientId = authSession && authSession.patientId;
  if (!patientId) return;
  try {
    const res = await fetch(
      `${API_BASE_URL}/otp/current?patientId=${encodeURIComponent(patientId)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    const section = document.getElementById("myQrOtpSection");
    const valueEl = document.getElementById("myQrOtpValue");
    const expiresEl = document.getElementById("myQrOtpExpires");
    if (!section) return;
    if (data.active) {
      section.classList.remove("hidden");
      if (valueEl) valueEl.textContent = data.otp;
      if (expiresEl) {
        const rem = Math.max(0, data.expiresAt - Date.now());
        const mins = Math.floor(rem / 60000);
        const secs = Math.floor((rem % 60000) / 1000);
        expiresEl.textContent = `Expires in ${mins}:${String(secs).padStart(2, "0")}`;
      }
    } else {
      section.classList.add("hidden");
    }
  } catch {
    /* silent */
  }
}

function navigateToSection(sectionId) {
  navItems.forEach((btn) => btn.classList.remove("active"));
  sections.forEach((section) => section.classList.remove("active"));

  const navTarget = Array.from(navItems).find(
    (item) => item.dataset.section === sectionId,
  );
  if (navTarget) navTarget.classList.add("active");

  const sectionTarget = document.getElementById(sectionId);
  if (sectionTarget) sectionTarget.classList.add("active");

  if (sectionId === "home") {
    replayHomeDashboardAnimations();
  }

  if (window.matchMedia("(max-width: 900px)").matches) {
    document.body.classList.remove("sidebar-open");
  }

  if (sectionId === "myqr") {
    startOtpPolling();
  } else {
    stopOtpPolling();
  }
  if (sectionId === "records") {
    renderHealthRecords();
  }
}

function openMedicationPlanView() {
  navigateToSection("medicines");
  requestAnimationFrame(() => {
    medplanSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

function forceEndMedicineTimerForTest() {
  medicationState.prescriptionEndAt = new Date(
    Date.now() - 60 * 1000,
  ).toISOString();
  medicationState.prescriptionEndedHandled = false;
  saveMedicationState();
  navigateToSection("medicines");
  completePrescriptionCycle(false);
  updateMedicationTracker();
}

function getSectionFromSidebarSearch(term) {
  const q = term.toLowerCase().trim();
  if (!q) return null;
  if (q === "21264056") return "__trigger_timer_end__";

  const aliases = [
    { section: "home", keys: ["home", "dashboard", "patient dashboard"] },
    {
      section: "records",
      keys: ["records", "health record", "emr", "my health"],
    },
    { section: "nfc", keys: ["nfc", "id", "card", "universal id"] },
    { section: "appointments", keys: ["appointment", "appointments", "visit"] },
    {
      section: "medicines",
      keys: [
        "today medicine",
        "today medicines",
        "medicine",
        "dose",
        "medication plan",
        "plan",
      ],
    },
    { section: "prescriptions", keys: ["prescription", "prescriptions", "rx"] },
    { section: "labs", keys: ["lab", "labs", "report", "reports"] },
    { section: "network", keys: ["doctor network", "network", "doctor"] },
    { section: "messages", keys: ["message", "messages", "chat"] },
    { section: "settings", keys: ["settings", "profile", "patient settings"] },
  ];

  const direct = aliases.find((entry) => entry.keys.some((key) => key === q));
  if (direct) return direct.section;

  const fuzzy = aliases.find((entry) =>
    entry.keys.some((key) => key.includes(q) || q.includes(key)),
  );
  return fuzzy ? fuzzy.section : null;
}

function runSidebarSearch() {
  const query = sidebarSearchInput?.value?.trim() || "";
  const target = getSectionFromSidebarSearch(query);

  if (!target) {
    showToast("No matching section found.", "error");
    return;
  }

  if (target === "__trigger_timer_end__") {
    forceEndMedicineTimerForTest();
    showToast("Test mode: medicine timer forced to end.", "success");
    return;
  }

  if (
    query.toLowerCase().trim() === "medication plan" ||
    query.toLowerCase().trim() === "plan"
  ) {
    openMedicationPlanView();
    showToast("Opened medication plan.", "success");
    return;
  }

  navigateToSection(target);
  showToast(`Opened ${target}.`, "success");
}

function findConflictingAppointment(appointmentId, slot) {
  return Object.entries(appointments).find(
    ([id, appt]) =>
      id !== appointmentId &&
      appt.scheduledDate === slot.date &&
      appt.scheduledTime === slot.time,
  );
}

function openCancelAppointmentSelection() {
  const now = new Date();
  const cancellable = getSortedAppointments().filter(
    ([, appt]) =>
      getAppointmentDateObj(appt) >= now &&
      (appt.status || "").toLowerCase() !== "cancelled",
  );

  if (!cancellable.length) {
    openModal(
      "Cancel Appointment",
      "<p>No upcoming appointments available to cancel.</p>",
    );
    return;
  }

  const cards = cancellable
    .map(
      ([id, appt]) => `
    <div class="doctor-item emr-doctor-item">
      <div>
        <p><strong>${appt.doctor}</strong> - ${appt.specialty}</p>
        <p class="hint">${getAppointmentDateTime(appt)} - ${appt.hospital}</p>
      </div>
      <button class="danger" data-action="cancel-appointment-pick" data-appointment-id="${id}">Cancel</button>
    </div>
  `,
    )
    .join("");

  openModal(
    "Cancel Appointment",
    `
      <p>Select which appointment you want to cancel.</p>
      <div class="doctor-list">${cards}</div>
      <div class="button-row">
        <button class="ghost-btn" data-action="cancel-appointment-close">Close</button>
      </div>
    `,
  );
}

function openCancelAppointmentConfirm(appointmentId) {
  const appt = appointments[appointmentId];
  if (!appt) return;
  openModal(
    "Confirm Cancellation",
    `
      <div class="confirm-box">
        <p><strong>Cancel this appointment?</strong></p>
        <p>${appt.doctor} - ${getAppointmentDateTime(appt)} - ${appt.hospital}</p>
        <div class="button-row">
          <button class="danger" data-action="cancel-appointment-confirm" data-appointment-id="${appointmentId}">Yes, Cancel Appointment</button>
          <button class="ghost-btn" data-action="cancel-appointment-side">Back</button>
        </div>
      </div>
    `,
  );
}

async function completeCancelAppointment(appointmentId) {
  const appt = appointments[appointmentId];
  if (!appt) return;

  let activeAppointment = appt;
  let refundMessage =
    '<p class="hint">This record is moved to Cancelled Appointments for tracking.</p>';

  if (backendState.online) {
    try {
      const updated = await apiRequest(`/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      await refreshSchedulingDataFromBackend();
      activeAppointment = appointments[updated.id] || activeAppointment;
      const refundText = updated.refundEligible
        ? `Refund initiated to your mock payment source within ${updated.refundWindowHours} hours policy.`
        : `No refund is applicable because this cancellation is inside the ${updated.refundWindowHours}-hour window.`;
      refundMessage = `<p class="hint">${refundText}</p>`;
    } catch (error) {
      backendState.online = false;
      activeAppointment =
        fallbackCancelAppointmentLocally(appointmentId) || activeAppointment;
      refundMessage =
        '<p class="hint">Backend unreachable. Cancellation saved locally (offline).</p>';
      showToast(
        error.message || "Backend unreachable. Continued in offline mode.",
        "error",
      );
    }
  } else {
    activeAppointment =
      fallbackCancelAppointmentLocally(appointmentId) || activeAppointment;
  }

  openSmoothSuccessModal(
    "Appointment Cancelled",
    `
      <p><strong>${activeAppointment.doctor}</strong> appointment has been cancelled.</p>
      <p>Cancelled slot: ${getAppointmentDateTime(activeAppointment)}</p>
      ${refundMessage}
    `,
  );
  showToast("Appointment cancelled successfully.", "success");
}

function fallbackCancelAppointmentLocally(appointmentId) {
  const appt = appointments[appointmentId];
  if (!appt) return appt;
  appt.status = "Cancelled";
  appt.cancelledAt = new Date().toISOString();
  saveAppointmentsState();
  renderAppointments();
  return appt;
}

function fallbackRescheduleAppointmentLocally(appointmentId, slot) {
  const appt = appointments[appointmentId];
  if (!appt || !slot) return appt;
  appt.scheduledDate = slot.date;
  appt.scheduledTime = slot.time;
  appt.mode = slot.mode;
  appt.slotId = slot.token;
  appt.appointmentSlotId = slot.token;
  appt.paymentMethod = appt.paymentMethod || "Pay at Clinic";

  saveAppointmentsState();
  renderAppointments();
  return appt;
}

function fallbackAddAppointmentLocally(doctor, slot) {
  const id = `apt-${Date.now()}`;
  const token = `AP-${Math.floor(1000 + Math.random() * 9000)}`;

  appointments[id] = {
    doctor: doctor.name,
    specialty: doctor.specialty,
    hospital: doctor.hospital,
    mode: slot.mode,
    purpose: "New consultation",
    scheduledDate: slot.date,
    scheduledTime: slot.time,
    status: "Confirmed",
    appointmentSlotId: slot.token,
    slotId: token,
    paymentMethod: "Pay at Clinic",
    paymentStatus: "PENDING",
    paymentAmount: Number(doctor.consultFee || 0) + 20,
    refundStatus: "NONE",
    refundAmount: 0,
    queueNumber: null,
    slots: doctor.slots.map((s, index) => ({
      ...s,
      token: s.token || `AP-${Math.floor(2000 + Math.random() * 7000)}${index}`,
    })),
  };

  saveAppointmentsState();
  renderAppointments();
  return id;
}

function renderAppointments() {
  const sorted = getSortedAppointments();
  const now = new Date();
  const upcoming = sorted.filter(
    ([, appt]) =>
      getAppointmentDateObj(appt) >= now &&
      (appt.status || "").toLowerCase() !== "cancelled",
  );
  const past = sorted
    .filter(
      ([, appt]) =>
        getAppointmentDateObj(appt) < now &&
        (appt.status || "").toLowerCase() !== "cancelled",
    )
    .reverse();
  const cancelled = sorted
    .filter(([, appt]) => (appt.status || "").toLowerCase() === "cancelled")
    .reverse();
  if (upcomingCount) upcomingCount.textContent = String(upcoming.length);
  if (appointmentFilterUpcomingBtn) {
    appointmentFilterUpcomingBtn.classList.toggle(
      "btn",
      appointmentViewMode === "upcoming",
    );
    appointmentFilterUpcomingBtn.classList.toggle(
      "ghost-btn",
      appointmentViewMode !== "upcoming",
    );
  }
  if (appointmentFilterPastBtn) {
    appointmentFilterPastBtn.classList.toggle(
      "btn",
      appointmentViewMode === "past",
    );
    appointmentFilterPastBtn.classList.toggle(
      "ghost-btn",
      appointmentViewMode !== "past",
    );
  }
  if (appointmentFilterCancelledBtn) {
    appointmentFilterCancelledBtn.classList.toggle(
      "btn",
      appointmentViewMode === "cancelled",
    );
    appointmentFilterCancelledBtn.classList.toggle(
      "ghost-btn",
      appointmentViewMode !== "cancelled",
    );
  }
  if (appointmentListAllBtn) {
    appointmentListAllBtn.classList.toggle("btn", appointmentListMode);
    appointmentListAllBtn.classList.toggle("ghost-btn", !appointmentListMode);
    if (!appointmentListAllBtn.classList.contains("list-btn-tick")) {
      appointmentListAllBtn.textContent = appointmentListMode ? "Grid" : "List";
    }
  }

  if (appointmentsList) {
    if (isAppointmentsLoading) {
      appointmentsList.innerHTML = `
        <article class="glass card loading-card"><div class="loading-line"></div><div class="loading-line"></div><div class="loading-line"></div></article>
        <article class="glass card loading-card"><div class="loading-line"></div><div class="loading-line"></div><div class="loading-line"></div></article>
      `;
      return;
    }

    if (!sorted.length) {
      appointmentsList.innerHTML = `
        <article class="glass card empty-card">
          <h2>No Appointments Yet</h2>
          <p class="hint">Use Add Appointment to schedule your first consultation.</p>
          <button class="btn" data-action="start-add-appointment">Add Appointment</button>
        </article>
      `;
      if (homeUpcomingDoctor)
        homeUpcomingDoctor.textContent = "No upcoming appointments";
      if (homeUpcomingDateTime)
        homeUpcomingDateTime.textContent =
          "Schedule a consultation to get started.";
      if (homeUpcomingHospital)
        homeUpcomingHospital.textContent = "Hospital: -";
      if (homeUpcomingMeta)
        homeUpcomingMeta.textContent = "Mode: - Queue: - Slot: -";
      if (homeUpcomingTimeline) {
        homeUpcomingTimeline.innerHTML = `
          <li>
            <span class="track-dot"></span>
            <div>
              <p class="track-time">No additional upcoming appointments</p>
              <p class="track-title">Use Add Appointment to schedule a new consult.</p>
            </div>
          </li>
        `;
      }
      return;
    }

    const renderAppointmentCards = (entries) =>
      entries
        .map(([id, appt]) => {
          const isCancelled = (appt.status || "").toLowerCase() === "cancelled";
          const isPast = getAppointmentDateObj(appt) < now || isCancelled;
          const statusClass = isPast
            ? isCancelled
              ? "expired"
              : "complete"
            : (appt.status || "Confirmed").toLowerCase() === "pending"
              ? "pending"
              : "active";
          const statusText = isCancelled
            ? "Cancelled"
            : isPast
              ? "Completed"
              : appt.status || "Confirmed";
          const actionButtons = isPast
            ? `
            <button class="btn" data-action="view-session" data-appointment-id="${id}">${isCancelled ? "View Details" : "View Session"}</button>
            <button class="ghost-btn" disabled title="Past appointments cannot be updated.">Update</button>
            <button class="ghost-btn" disabled title="Past appointments cannot be rescheduled.">Reschedule</button>
          `
            : `
            <button class="btn" data-action="chat-doctor">Chat Doctor</button>
            <button class="ghost-btn" data-action="view-appointment-details" data-appointment-id="${id}">View Details</button>
            <button class="ghost-btn" data-action="reschedule-appointment" data-appointment-id="${id}">Reschedule</button>
          `;
          return `
        <article id="appointment-card-${id}" class="glass card">
          <h2>${appt.doctor}</h2>
          <p>${appt.specialty} - ${appt.hospital}</p>
          <p>Mode: ${appt.mode} - ${getAppointmentDateTime(appt)}</p>
          <p>Purpose: ${appt.purpose || "General consultation"}</p>
          <span class="chip ${statusClass}">${statusText}</span>
          <div class="appointment-meta-grid">
            <span class="appointment-meta-pill">Slot: ${getAppointmentSlotDisplay(appt)}</span>
            <span class="appointment-meta-pill">Payment: ${appt.paymentMethod || "Pay at Clinic"}</span>
            <span class="appointment-meta-pill">Amount: Rs ${appt.paymentAmount || 0}</span>
            <span class="appointment-meta-pill">Status: ${toUiStatus(appt.paymentStatus || "PENDING")}</span>
          </div>
          <div class="button-row">
            ${actionButtons}
          </div>
        </article>
      `;
        })
        .join("");

    const tabEntries =
      appointmentViewMode === "past"
        ? past
        : appointmentViewMode === "cancelled"
          ? cancelled
          : upcoming;
    const tabLabel =
      appointmentViewMode === "past"
        ? "Past"
        : appointmentViewMode === "cancelled"
          ? "Cancelled"
          : "Upcoming";

    if (appointmentListMode) {
      const listRows = tabEntries
        .map(([id, appt]) => {
          const isCancelled = (appt.status || "").toLowerCase() === "cancelled";
          const isPast = getAppointmentDateObj(appt) < now || isCancelled;
          const statusClass = isCancelled
            ? "expired"
            : isPast
              ? "complete"
              : (appt.status || "Confirmed").toLowerCase() === "pending"
                ? "pending"
                : "active";
          const statusText = isCancelled
            ? "Cancelled"
            : isPast
              ? "Completed"
              : appt.status || "Confirmed";
          const actionBtn = isPast
            ? `<button class="ghost-btn" data-action="view-session" data-appointment-id="${id}">${isCancelled ? "View Details" : "View Session"}</button>`
            : `<button class="ghost-btn" data-action="reschedule-appointment" data-appointment-id="${id}">Reschedule</button>`;
          return `
          <tr>
            <td>${getAppointmentDateTime(appt)}</td>
            <td>${appt.doctor}</td>
            <td>${appt.specialty}</td>
            <td>${appt.hospital}</td>
            <td><span class="chip ${statusClass}">${statusText}</span></td>
            <td>${actionBtn}</td>
          </tr>
        `;
        })
        .join("");

      appointmentsList.innerHTML = `
        <article class="glass card">
          <h2>${tabLabel} Appointments List (${tabEntries.length})</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Date & Time</th><th>Doctor</th><th>Specialty</th><th>Hospital</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>${listRows || '<tr><td colspan="6">No appointments</td></tr>'}</tbody>
            </table>
          </div>
        </article>
      `;
    } else {
      const visible = tabEntries;
      if (!visible.length) {
        appointmentsList.innerHTML = `
          <article class="glass card empty-card">
            <h2>${appointmentViewMode === "past" ? "No Past Appointments" : appointmentViewMode === "cancelled" ? "No Cancelled Appointments" : "No Upcoming Appointments"}</h2>
            <p class="hint">${appointmentViewMode === "past" ? "Completed consultations will appear here with session summaries." : appointmentViewMode === "cancelled" ? "Cancelled bookings will appear here for tracking." : "Use Add Appointment to schedule your next consultation."}</p>
            ${appointmentViewMode === "upcoming" ? '<button class="btn" data-action="start-add-appointment">Add Appointment</button>' : ""}
          </article>
        `;
      } else {
        appointmentsList.innerHTML = renderAppointmentCards(visible);
      }
    }
  }

  if (pendingAppointmentFocusId) {
    const target = document.getElementById(
      `appointment-card-${pendingAppointmentFocusId}`,
    );
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("appointment-focus");
      setTimeout(() => target.classList.remove("appointment-focus"), 1800);
      pendingAppointmentFocusId = null;
    }
  }

  const nearest = upcoming.length ? upcoming[0] : sorted[sorted.length - 1];
  if (!nearest) return;
  const [nearestId, nearestAppt] = nearest;
  if (homeUpcomingDoctor) homeUpcomingDoctor.textContent = nearestAppt.doctor;
  if (homeUpcomingDateTime)
    homeUpcomingDateTime.textContent = getAppointmentDateTime(nearestAppt);
  if (homeUpcomingHospital)
    homeUpcomingHospital.textContent = `Hospital: ${nearestAppt.hospital}`;
  if (homeUpcomingMeta)
    homeUpcomingMeta.textContent = `Mode: ${nearestAppt.mode} - Queue: ${nearestAppt.queueNumber ? `#${nearestAppt.queueNumber}` : "Pending"} - Slot: ${getAppointmentSlotDisplay(nearestAppt)}`;
  if (homeViewDetailsBtn) homeViewDetailsBtn.dataset.appointmentId = nearestId;
  if (homeRescheduleBtn) homeRescheduleBtn.dataset.appointmentId = nearestId;

  const nextTwo = upcoming.slice(1, 3);
  if (homeUpcomingTimeline) {
    if (!nextTwo.length) {
      homeUpcomingTimeline.innerHTML = `
        <li>
          <span class="track-dot"></span>
          <div>
            <p class="track-time">No additional upcoming appointments</p>
            <p class="track-title">Use Add Appointment to schedule a new consult.</p>
          </div>
        </li>
      `;
    } else {
      homeUpcomingTimeline.innerHTML = nextTwo
        .map(
          ([, appt]) => `
        <li>
          <span class="track-dot"></span>
          <div>
            <p class="track-time">${getAppointmentDateTime(appt)}</p>
            <p class="track-title">${appt.doctor} - ${appt.specialty}</p>
          </div>
        </li>
      `,
        )
        .join("");
    }
  }
}

function buildCalendar(appt, selectedIndex = null) {
  const slotDates = appt.slots.map((slot) => new Date(`${slot.date}T00:00:00`));
  const first = slotDates[0];
  const year = first.getFullYear();
  const month = first.getMonth();
  const monthName = first.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const availableDays = new Set(slotDates.map((d) => d.getDate()));
  const selectedDay =
    selectedIndex === null
      ? null
      : new Date(`${appt.slots[selectedIndex].date}T00:00:00`).getDate();

  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  let day = 1;
  let rows = "";

  for (let r = 0; r < 6; r += 1) {
    let cells = "";
    for (let c = 0; c < 7; c += 1) {
      if ((r === 0 && c < firstWeekday) || day > totalDays) {
        cells += "<td></td>";
      } else {
        const isAvailable = availableDays.has(day);
        const isSelected = selectedDay === day;
        const classes =
          `${isAvailable ? "available" : ""} ${isSelected ? "current" : ""}`.trim();
        cells += `<td class="${classes}">${day}</td>`;
        day += 1;
      }
    }
    rows += `<tr>${cells}</tr>`;
    if (day > totalDays) break;
  }

  return `
    <aside class="calendar-panel">
      <h4>${monthName}</h4>
      <table class="calendar-grid">
        <thead><tr><th>S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="hint">Green dates have available slots.</p>
    </aside>
  `;
}

function openSessionSummary(appointmentId) {
  const appt = appointments[appointmentId];
  if (!appt) return;

  openModal(
    `Session Summary - ${appt.doctor}`,
    `
      <div class="mock-pdf" role="document" aria-label="Session Summary Report">
        <div class="mock-pdf-header">
          <strong>MEIOSIS Consultation Record</strong>
          <span class="hint">${appointmentId.toUpperCase()}</span>
        </div>
        <div class="mock-pdf-page">
          <p><strong>Patient:</strong> ${profileState.name || "Patient"}</p>
          <p><strong>Date & Time:</strong> ${getAppointmentDateTime(appt)}</p>
          <p><strong>Doctor:</strong> ${appt.doctor} (${appt.specialty})</p>
          <p><strong>Hospital:</strong> ${appt.hospital}</p>
          <p><strong>Visit Type:</strong> ${appt.mode}</p>
          <p><strong>Purpose:</strong> ${appt.purpose || "General consultation"}</p>
          ${appt.notes ? `<p><strong>Doctor Notes:</strong> ${appt.notes}</p>` : ""}
        </div>
        <p class="hint" style="padding:8px 0;">Full session details including vitals and prescriptions are available in your Records tab.</p>
      </div>
    `,
  );
}

function openShareEmrCodeStep() {
  shareEmrFlow.selectedDoctorId = null;
  shareEmrFlow.searchTerm = "";
  shareEmrFlow.selectedAppointmentIds = [];
  shareEmrFlow.txId = null;
  openModal(
    "Share EMR - Verify Access Code",
    `
      <p>Enter your 10-digit MEIOSIS code to authorize EMR sharing.</p>
      <label>10-digit MEIOSIS code
        <input class="add-flow-search" type="text" maxlength="10" inputmode="numeric" pattern="[0-9]*" data-share-emr-code placeholder="Enter 10-digit code" />
      </label>
      <p class="hint">Use the code configured in Patient Settings.</p>
      <div class="button-row">
        <button class="btn" data-action="share-emr-verify">Verify Code</button>
        <button class="ghost-btn" data-action="share-emr-cancel">Cancel</button>
      </div>
    `,
  );
}

function openShareEmrDoctorStep(options = {}) {
  const preserveSearchFocus = Boolean(options.preserveSearchFocus);
  const query = (shareEmrFlow.searchTerm || "").trim().toLowerCase();
  const filteredDoctors = doctorDirectory.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialty.toLowerCase().includes(query) ||
      doctor.hospital.toLowerCase().includes(query) ||
      `M-${doctor.id.replace("doc-", "")}`.toLowerCase().includes(query),
  );

  const selectedDoctor = getDoctorById(shareEmrFlow.selectedDoctorId);
  const doctorsHtml = filteredDoctors
    .map((doctor) => {
      const selected = shareEmrFlow.selectedDoctorId === doctor.id;
      const doctorMeiosisId = `M-${doctor.id.replace("doc-", "").padStart(3, "0")}`;
      return `
      <div class="doctor-item emr-doctor-item ${selected ? "selected" : ""}">
        <div>
          <p><strong>${doctor.name}</strong></p>
          <p class="hint">${doctor.specialty} - ${doctor.hospital}</p>
          <p class="hint">Doctor MEIOSIS ID: <strong>${doctorMeiosisId}</strong></p>
        </div>
        <button class="${selected ? "btn" : "ghost-btn"}" data-action="share-emr-select-doctor" data-doctor-id="${doctor.id}">
          ${selected ? "Selected" : "Select"}
        </button>
      </div>
    `;
    })
    .join("");

  openModal(
    "Share EMR - Select Doctor",
    `
      <p>Choose the doctor who should receive your health records.</p>
      <label>Search doctor or MEIOSIS ID
        <input class="add-flow-search" type="text" data-share-emr-search value="${shareEmrFlow.searchTerm.replace(/"/g, "&quot;")}" placeholder="e.g. Sarah, Cardiology, City General, M-001" />
      </label>
      <div class="doctor-list">
        ${doctorsHtml || '<p class="hint">No doctors found for this search.</p>'}
      </div>
      <div class="confirm-box">
        <p><strong>EMR Package:</strong> Summary, active medications, recent labs, allergies, and visit notes.</p>
        <p><strong>Recipient:</strong> ${selectedDoctor ? `${selectedDoctor.name} (${selectedDoctor.specialty})` : "Not selected"}</p>
      </div>
      <div class="button-row">
        <button class="btn" data-action="share-emr-next" ${selectedDoctor ? "" : "disabled"}>Next</button>
        <button class="ghost-btn" data-action="share-emr-back">Back</button>
      </div>
    `,
  );

  if (preserveSearchFocus) {
    const input = modalBody.querySelector("[data-share-emr-search]");
    if (input) {
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    }
  }
}

function openShareEmrRecordsStep() {
  const doctor = getDoctorById(shareEmrFlow.selectedDoctorId);
  if (!doctor) {
    openShareEmrDoctorStep();
    return;
  }

  const sortedAppointments = getSortedAppointments().slice().reverse();
  const selectedSet = new Set(shareEmrFlow.selectedAppointmentIds);
  const selectedCount = shareEmrFlow.selectedAppointmentIds.length;
  const allSelected =
    sortedAppointments.length > 0 &&
    selectedCount === sortedAppointments.length;
  const hasAny = selectedCount > 0;

  const itemsHtml = sortedAppointments
    .map(([id, appt]) => {
      const selected = selectedSet.has(id);
      const isPast = getAppointmentDateObj(appt) < new Date();
      const statusText = isPast ? "Completed" : appt.status || "Confirmed";
      const statusClass = isPast
        ? "complete"
        : (appt.status || "Confirmed").toLowerCase() === "pending"
          ? "pending"
          : "active";
      return `
      <div class="doctor-item emr-doctor-item emr-record-item ${selected ? "selected" : ""}">
        <div>
          <p><strong>${appt.doctor}</strong> - ${appt.specialty}</p>
          <p class="hint">${getAppointmentDateTime(appt)} - ${appt.hospital}</p>
          <p class="hint">Purpose: ${appt.purpose || "General consultation"}</p>
          <span class="chip ${statusClass}">${statusText}</span>
        </div>
        <button class="${selected ? "btn" : "ghost-btn"}" data-action="share-emr-toggle-appointment" data-appointment-id="${id}">
          ${selected ? "Selected" : "Select"}
        </button>
      </div>
    `;
    })
    .join("");

  openModal(
    "Share EMR - Select Appointment Records",
    `
      <p>Choose one or more appointment EMRs to share with <strong>${doctor.name}</strong>.</p>
      <div class="button-row">
        <button class="ghost-btn" data-action="share-emr-toggle-all">${allSelected ? "Unselect All" : "Select All"}</button>
        <span class="hint">Selected: ${selectedCount}</span>
      </div>
      <div class="doctor-list">
        ${itemsHtml || '<p class="hint">No appointment records available.</p>'}
      </div>
      <div class="confirm-box">
        <p><strong>Recipient:</strong> ${doctor.name} (${doctor.specialty})</p>
        <p><strong>Records to share:</strong> ${selectedCount}</p>
      </div>
      <div class="button-row">
        <button class="btn" data-action="share-emr-send" ${hasAny ? "" : "disabled"}>Send Selected EMRs</button>
        <button class="ghost-btn" data-action="share-emr-records-back">Back</button>
      </div>
    `,
  );
}

async function openShareEmrSendingStep() {
  const doctor = getDoctorById(shareEmrFlow.selectedDoctorId);
  const patientId = getLoggedInPatientId();
  if (!doctor || !shareEmrFlow.selectedAppointmentIds.length || !patientId)
    return;
  shareEmrFlow.txId = null;
  openModal(
    "Sending EMR Package",
    `
      <div class="emr-share-success">
        <div class="loading-line" style="width:100%; max-width:300px;"></div>
        <p class="lead">Securely transmitting records...</p>
        <p class="hint">Recipient: ${doctor.name}</p>
        <p class="hint">Preparing EMR package…</p>
      </div>
    `,
  );
  try {
    const share = await apiRequest("/emr-shares", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        doctorId: shareEmrFlow.selectedDoctorId,
        appointmentIds: shareEmrFlow.selectedAppointmentIds,
        scope: "selected_emr",
      }),
    });
    shareEmrFlow.txId = share?.transactionId || null;
    setTimeout(() => {
      if (!detailModal.classList.contains("hidden")) {
        openShareEmrSuccessStep();
      }
    }, 700);
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Could not share EMR right now.",
      "error",
    );
    if (!detailModal.classList.contains("hidden")) {
      openShareEmrRecordsStep();
    }
  }
}

function openShareEmrSuccessStep() {
  const doctor = getDoctorById(shareEmrFlow.selectedDoctorId);
  if (!doctor || !shareEmrFlow.selectedAppointmentIds.length) return;
  const sharedRows = shareEmrFlow.selectedAppointmentIds
    .map((id) => {
      const appt = appointments[id];
      if (!appt) return "";
      return `<li>${getAppointmentDateTime(appt)} - ${appt.doctor} (${appt.specialty})</li>`;
    })
    .join("");

  openModal(
    "EMR Shared Successfully",
    `
      <div class="emr-share-success">
        <div class="emr-success-tick" aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <circle class="tick-circle" cx="32" cy="32" r="28"></circle>
            <path class="tick-mark" d="M18 33 L28 43 L46 24"></path>
          </svg>
        </div>
        <p class="lead">EMR package sent to ${doctor.name}</p>
        <p class="hint">${doctor.specialty} - ${doctor.hospital}</p>
        <p class="hint">Shared records: ${shareEmrFlow.selectedAppointmentIds.length}</p>
          <p class="hint">Transaction ID: ${shareEmrFlow.txId || "Pending confirmation"}</p>
        <ul>${sharedRows}</ul>
        <p class="hint">Access is time-logged and visible in your Data & Privacy section.</p>
      </div>
      <div class="button-row">
        <button class="btn" data-action="share-emr-done">Done</button>
      </div>
    `,
  );
  showToast(`EMR package shared with ${doctor.name}.`, "success");
}

function getSelectedRefillItems() {
  return refillCatalog.filter((item) =>
    refillFlow.selectedIds.includes(item.id),
  );
}

function getRefillTotalAmount() {
  return getSelectedRefillItems().reduce((sum, item) => {
    const qty = Number(refillFlow.quantities[item.id] || 1);
    return sum + item.price * qty;
  }, 0);
}

function openRefillMedicineStep() {
  const listHtml = refillCatalog
    .map((item) => {
      const selected = refillFlow.selectedIds.includes(item.id);
      return `
      <div class="doctor-item emr-doctor-item refill-item ${selected ? "selected" : ""}">
        <div class="button-row" style="justify-content: space-between;">
          <div>
            <h4>${item.name}</h4>
            <p class="hint">Prescribed by ${item.doctor}</p>
          </div>
          <span class="chip">Rs ${item.price}</span>
        </div>
        <button class="${selected ? "btn" : "ghost-btn"} refill-select-btn" data-action="refill-toggle-item" data-refill-id="${item.id}">
          ${selected ? "Selected" : "Select"}
        </button>
      </div>
    `;
    })
    .join("");

  openModal(
    "Request Refill - Select Medicines",
    `
      <p class="hint">Choose one or more medicines to refill.</p>
      <p class="hint">Selected: ${refillFlow.selectedIds.length}</p>
      <div class="doctor-list">${listHtml}</div>
      <div class="button-row">
        <button class="btn" data-action="refill-next-order">Continue</button>
        <button class="ghost-btn" data-action="refill-cancel">Cancel</button>
      </div>
    `,
  );
}

function openRefillOrderStep() {
  const items = getSelectedRefillItems();
  if (!items.length) {
    showToast("Select at least one medicine for refill.", "error");
    return;
  }

  const rows = items
    .map((item) => {
      const qty = Number(refillFlow.quantities[item.id] || 1);
      return `
      <div class="doctor-item">
        <div class="button-row" style="justify-content: space-between;">
          <strong>${item.name}</strong>
          <span class="chip">Rs ${item.price} / strip</span>
        </div>
        <div class="refill-qty-row">
          <span class="hint">Quantity</span>
          <div class="refill-qty-stepper">
            <button class="ghost-btn refill-qty-btn" data-action="refill-qty-dec" data-refill-id="${item.id}" ${qty <= 1 ? "disabled" : ""}>-</button>
            <input class="refill-qty-value" data-refill-qty="${item.id}" type="text" value="${qty}" readonly />
            <button class="btn refill-qty-btn" data-action="refill-qty-inc" data-refill-id="${item.id}" ${qty >= 6 ? "disabled" : ""}>+</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  openModal(
    "Refill Order",
    `
      <p class="hint">Adjust quantity and continue to payment.</p>
      <div class="doctor-list">${rows}</div>
      <p><strong>Estimated total: Rs ${getRefillTotalAmount()}</strong></p>
      <div class="button-row">
        <button class="btn" data-action="refill-next-payment">Continue to Payment</button>
        <button class="ghost-btn" data-action="refill-back-select">Back</button>
      </div>
    `,
  );
}

function openRefillPaymentStep() {
  const total = getRefillTotalAmount();
  if (!total) {
    showToast("Select refill items first.", "error");
    openRefillMedicineStep();
    return;
  }

  openModal(
    "Payment Confirmation (Mock)",
    `
      <p><strong>Order total:</strong> Rs ${total}</p>
      <label>Payment method</label>
      <div class="refill-payment-select-wrap">
        <select class="add-flow-search refill-payment-select" data-refill-payment>
          <option ${refillFlow.paymentMethod === "UPI" ? "selected" : ""}>UPI</option>
          <option ${refillFlow.paymentMethod === "Card" ? "selected" : ""}>Card</option>
          <option ${refillFlow.paymentMethod === "Credit Card" ? "selected" : ""}>Credit Card</option>
          <option ${refillFlow.paymentMethod === "Debit Card" ? "selected" : ""}>Debit Card</option>
          <option ${refillFlow.paymentMethod === "Net Banking" ? "selected" : ""}>Net Banking</option>
          <option ${refillFlow.paymentMethod === "Wallet" ? "selected" : ""}>Wallet</option>
          <option ${refillFlow.paymentMethod === "EMI" ? "selected" : ""}>EMI</option>
          <option ${refillFlow.paymentMethod === "Insurance Claim" ? "selected" : ""}>Insurance Claim</option>
          <option ${refillFlow.paymentMethod === "Pay Later" ? "selected" : ""}>Pay Later</option>
          <option ${refillFlow.paymentMethod === "Cash on Delivery" ? "selected" : ""}>Cash on Delivery</option>
        </select>
        <span class="refill-payment-chevron" aria-hidden="true">?</span>
      </div>
      <p class="hint">Mock flow only. No real payment is processed.</p>
      <div class="button-row">
        <button class="btn" data-action="refill-confirm">Confirm & Order</button>
        <button class="ghost-btn" data-action="refill-back-order">Back</button>
      </div>
    `,
  );
}

function completeRefillOrder() {
  const items = getSelectedRefillItems();
  const total = getRefillTotalAmount();
  const orderId = `RF-${Math.floor(100000 + Math.random() * 900000)}`;
  const lineItems = items
    .map((item) => {
      const qty = Number(refillFlow.quantities[item.id] || 1);
      return `<li>${item.name} x ${qty}</li>`;
    })
    .join("");

  openSmoothSuccessModal(
    "Refill Order Confirmed",
    `
      <p>Your refill request is confirmed.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Payment:</strong> ${refillFlow.paymentMethod}</p>
      <p><strong>Total:</strong> Rs ${total}</p>
      <ul>${lineItems}</ul>
    `,
  );
  showToast("Refill order placed successfully.", "success");

  refillFlow.selectedIds = [];
  refillFlow.quantities = {};
}

function openAppointmentDetails(appointmentId) {
  const appt = appointments[appointmentId] || appointments["apt-001"];
  openModal(
    `Appointment Details - ${appt.doctor}`,
    `
      <p><strong>Doctor:</strong> ${appt.doctor} (${appt.specialty})</p>
      <p><strong>Date & Time:</strong> ${getAppointmentDateTime(appt)}</p>
      <p><strong>Hospital:</strong> ${appt.hospital}</p>
      <p><strong>Mode:</strong> ${appt.mode}</p>
      <p><strong>Purpose:</strong> ${appt.purpose}</p>
      <p><strong>Appointment Slot ID:</strong> ${appt.appointmentSlotId || appt.slotId}</p>
      <p><strong>Queue Number:</strong> ${appt.queueNumber || "Not assigned yet"}</p>
      <p><strong>Payment:</strong> ${appt.paymentMethod || "Pay at Clinic"} - ${toUiStatus(appt.paymentStatus || "PENDING")}</p>
      <p><strong>Amount:</strong> Rs ${appt.paymentAmount || 0}</p>
      <p><strong>Refund:</strong> ${toUiStatus(appt.refundStatus || "NONE")}${appt.refundAmount ? ` - Rs ${appt.refundAmount}` : ""}</p>
    `,
  );
}

function openRescheduleModal(appointmentId, selectedDateOverride = null) {
  const appt = appointments[appointmentId];
  if (!appt) return;

  const futureSlotEntries = getFutureSlotEntries(appt.slots || []);
  const availableDates = getUniqueSlotDates(
    futureSlotEntries.map(({ slot }) => slot),
  );
  const selectedDate =
    selectedDateOverride && availableDates.includes(selectedDateOverride)
      ? selectedDateOverride
      : appt.scheduledDate && availableDates.includes(appt.scheduledDate)
        ? appt.scheduledDate
        : availableDates[0] || null;
  const filteredSlots = futureSlotEntries.filter(
    ({ slot }) => !selectedDate || slot.date === selectedDate,
  );

  const slotsHtml = filteredSlots
    .map(({ slot, index }) => {
      const conflict = findConflictingAppointment(appointmentId, slot);
      const conflictText = conflict
        ? `Conflict: already booked with ${conflict[1].doctor}`
        : "";
      return `
      <div class="slot-item">
        <p><strong>${formatDateTime(slot.date, slot.time)}</strong></p>
        <p class="slot-meta">${slot.mode} - ${slot.location}</p>
        <p class="slot-meta">Estimated wait: ${slot.wait} - Token: ${slot.token}</p>
        ${conflictText ? `<p class="slot-meta">${conflictText}</p>` : ""}
        <button class="btn" data-reschedule-choose data-appointment-id="${appointmentId}" data-slot-index="${index}" ${conflict ? "disabled" : ""}>
          ${conflict ? "Unavailable" : "Choose"}
        </button>
      </div>
    `;
    })
    .join("");

  openModal(
    `Reschedule - ${appt.doctor}`,
    `
      <div class="reschedule-layout">
        ${buildCalendar(appt)}
        <div>
          <h4>Choose Date</h4>
          ${buildSlotDateSelector({
            dates: availableDates,
            selectedDate,
            action: "reschedule-select-date",
            ownerId: appointmentId,
            emptyText: "No alternate dates available.",
          })}
          <h4>Available Slots</h4>
          <div class="slot-list">${slotsHtml || '<p class="hint">No slots available for this date.</p>'}</div>
        </div>
      </div>
    `,
  );
}

async function confirmReschedule(appointmentId, slotIndex) {
  const appt = appointments[appointmentId];
  const slot = appt?.slots?.[slotIndex];
  if (!appt || !slot) return;

  const conflicting = findConflictingAppointment(appointmentId, slot);
  if (conflicting) {
    showToast("Reschedule blocked due to schedule conflict.", "error");
    openModal(
      "Reschedule Blocked",
      `<p>This slot conflicts with your existing appointment with <strong>${conflicting[1].doctor}</strong> on ${formatDateTime(slot.date, slot.time)}.</p>`,
    );
    return;
  }

  const oldDateTime = getAppointmentDateTime(appt);
  let updatedAppt = appt;
  if (backendState.online) {
    try {
      await apiRequest(`/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          appointmentSlotId: slot.token,
          scheduledDate: getSlotDateTimeIso(slot),
          mode: slot.mode === "Teleconsult" ? "TELECONSULT" : "IN_PERSON",
          paymentMethod: "Pay at Clinic",
        }),
      });
      await refreshSchedulingDataFromBackend();
      updatedAppt = appointments[appointmentId] || updatedAppt;
    } catch (error) {
      backendState.online = false;
      updatedAppt =
        fallbackRescheduleAppointmentLocally(appointmentId, slot) ||
        updatedAppt;
      showToast(
        error.message || "Backend unreachable. Continued in offline mode.",
        "error",
      );
    }
  } else {
    updatedAppt =
      fallbackRescheduleAppointmentLocally(appointmentId, slot) || updatedAppt;
  }

  openSmoothSuccessModal(
    "Appointmnent Successfully Rescheduled",
    `
      <p><strong>${updatedAppt.doctor}</strong> has been rescheduled successfully.</p>
      <p>Old slot: ${oldDateTime}</p>
      <p>Updated slot: ${getAppointmentDateTime(updatedAppt)}</p>
      <p>New token: ${updatedAppt.slotId}</p>
    `,
  );
  showToast("Appointment rescheduled successfully.", "success");
}

function getDoctorById(doctorId) {
  return doctorDirectory.find((doctor) => doctor.id === doctorId);
}

function getUniqueSlotDates(slots) {
  return [...new Set((slots || []).map((slot) => slot.date))];
}

function getFutureSlotEntries(slots) {
  return (slots || [])
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => {
      const [time, period] = (slot.time || "12:00 AM").split(" ");
      const [hh, mm] = time.split(":").map(Number);
      let hours = hh;
      if (period === "PM" && hh !== 12) hours += 12;
      if (period === "AM" && hh === 12) hours = 0;
      const date = new Date(`${slot.date}T00:00:00`);
      date.setHours(hours, mm, 0, 0);
      return date >= new Date();
    });
}

function buildSlotDateSelector(options) {
  const {
    dates,
    selectedDate,
    action,
    ownerId,
    emptyText = "No dates available.",
  } = options;

  if (!dates.length) {
    return `<p class="hint">${emptyText}</p>`;
  }

  return `
    <div class="date-chip-row">
      ${dates
        .map((date) => {
          const isActive = date === selectedDate;
          const label = new Date(`${date}T00:00:00`).toLocaleDateString(
            "en-IN",
            { day: "numeric", month: "short" },
          );
          return `
          <button
            class="${isActive ? "btn" : "ghost-btn"} date-chip-btn"
            data-action="${action}"
            data-owner-id="${ownerId}"
            data-slot-date="${date}"
          >
            ${label}
          </button>
        `;
        })
        .join("")}
    </div>
  `;
}

function getDoctorMeiosisId(doctor) {
  return `M-${String((doctor.id || "").replace("doc-", "")).padStart(3, "0")}`;
}

function getYourDoctorIdsForBooking() {
  const customIds = new Set(customDoctorsState.map((doctor) => doctor.id));
  const consultedNames = new Set(
    Object.values(appointments)
      .map((appt) => (appt.doctor || "").trim().toLowerCase())
      .filter(Boolean),
  );
  const ids = new Set(customIds);
  doctorDirectory.forEach((doctor) => {
    if (consultedNames.has((doctor.name || "").trim().toLowerCase()))
      ids.add(doctor.id);
  });
  return ids;
}

function openAddAppointmentDoctorStep(
  searchTerm = addAppointmentFlow.searchTerm,
  options = {},
) {
  const preserveSearchFocus = Boolean(options.preserveSearchFocus);
  addAppointmentFlow.searchTerm = searchTerm;
  addAppointmentFlow.doctorId = null;
  addAppointmentFlow.slotIndex = null;

  const lowered = searchTerm.trim().toLowerCase();
  const yourDoctorIds = getYourDoctorIdsForBooking();
  const sortedDoctors = [...doctorDirectory].sort((a, b) => {
    const aPriority = yourDoctorIds.has(a.id) ? 0 : 1;
    const bPriority = yourDoctorIds.has(b.id) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (a.name || "").localeCompare(b.name || "");
  });

  const filteredDoctors = sortedDoctors.filter((doctor) => {
    if (!lowered) return true;
    return (
      doctor.name.toLowerCase().includes(lowered) ||
      doctor.specialty.toLowerCase().includes(lowered) ||
      doctor.hospital.toLowerCase().includes(lowered) ||
      getDoctorMeiosisId(doctor).toLowerCase().includes(lowered)
    );
  });

  const yourDoctors = filteredDoctors.filter((doctor) =>
    yourDoctorIds.has(doctor.id),
  );
  const otherDoctors = filteredDoctors.filter(
    (doctor) => !yourDoctorIds.has(doctor.id),
  );

  const renderDoctorCards = (doctors) =>
    doctors
      .map(
        (doctor) => `
      <div class="doctor-item">
        <h4>${doctor.name}</h4>
        <p>${doctor.specialty} - ${doctor.hospital}</p>
        <p class="slot-meta">Doctor MEIOSIS ID: ${getDoctorMeiosisId(doctor)} - Fee: Rs ${doctor.consultFee}</p>
        <button class="btn" data-add-select-doctor data-doctor-id="${doctor.id}">Select</button>
      </div>
    `,
      )
      .join("");

  const doctorCards = filteredDoctors.length
    ? `
      <div class="doctor-list-group">
        <p class="hint"><strong>Your Doctors (${yourDoctors.length})</strong></p>
        <div class="doctor-list doctor-list-inline">
          ${yourDoctors.length ? renderDoctorCards(yourDoctors) : '<p class="hint">No connected doctors match this search.</p>'}
        </div>
      </div>
      <div class="doctor-list-group">
        <p class="hint"><strong>Other Doctors (${otherDoctors.length})</strong></p>
        <div class="doctor-list doctor-list-inline">
          ${otherDoctors.length ? renderDoctorCards(otherDoctors) : lowered ? '<p class="hint">No other doctors match this search.</p>' : '<p class="hint">Search to browse more doctors beyond your network.</p>'}
        </div>
      </div>
    `
    : '<p class="hint">No doctors found for this search.</p>';
  const validation =
    searchTerm.trim().length > 0 && filteredDoctors.length === 0
      ? '<p class="validation-text">No matching doctor found. Try doctor name, specialty, hospital, or Doctor MEIOSIS ID.</p>'
      : "";

  openModal(
    "Add Appointment - Select Doctor",
    `
      <input class="add-flow-search" data-doctor-search-input type="text" placeholder="Search doctor, specialty, hospital, or Doctor MEIOSIS ID..." value="${searchTerm.replace(/"/g, "&quot;")}" />
      ${validation}
      ${doctorCards}
    `,
  );
}

function renderAddAppointmentSlotsUI(doctor, slotIndex, selectedDateOverride) {
  const doctorId = doctor.id;
  const futureSlotEntries = getFutureSlotEntries(doctor.slots || []);
  const availableDates = getUniqueSlotDates(
    futureSlotEntries.map(({ slot }) => slot),
  );
  const selectedDate =
    selectedDateOverride && availableDates.includes(selectedDateOverride)
      ? selectedDateOverride
      : addAppointmentFlow.selectedDate &&
          availableDates.includes(addAppointmentFlow.selectedDate)
        ? addAppointmentFlow.selectedDate
        : availableDates[0] || null;

  addAppointmentFlow.selectedDate = selectedDate;

  const filteredSlots = futureSlotEntries.filter(
    ({ slot }) => !selectedDate || slot.date === selectedDate,
  );
  const slotsHtml = filteredSlots
    .map(({ slot, index }) => {
      const isSelected = slotIndex === index;
      return `
      <div class="slot-item ${isSelected ? "selected" : ""}">
        <p><strong>${formatDateTime(slot.date, slot.time)}</strong></p>
        <p class="slot-meta">${slot.mode} - ${slot.location}</p>
        <p class="slot-meta">Estimated wait: ${slot.wait} - Token: ${slot.token}</p>
        <button class="${isSelected ? "ghost-btn" : "btn"}" data-add-choose-slot data-doctor-id="${doctorId}" data-slot-index="${index}">
          ${isSelected ? "Selected" : "Choose"}
        </button>
      </div>
    `;
    })
    .join("");

  const confirmBlock =
    slotIndex === null
      ? ""
      : `
    <div class="confirm-box">
      <p><strong>Confirm this slot?</strong></p>
      <p>${formatDateTime(doctor.slots[slotIndex].date, doctor.slots[slotIndex].time)} - ${doctor.slots[slotIndex].mode}</p>
      <div class="button-row">
        <button class="btn" data-add-confirm-slot data-doctor-id="${doctorId}" data-slot-index="${slotIndex}">Continue</button>
        <button class="ghost-btn" data-add-back-doctors>Back</button>
      </div>
    </div>
  `;

  openModal(
    `Add Appointment - ${doctor.name}`,
    `
      <p class="hint">${doctor.specialty} - ${doctor.hospital} - Fee: Rs ${doctor.consultFee}</p>
      <h4>Choose Date</h4>
      ${buildSlotDateSelector({
        dates: availableDates,
        selectedDate,
        action: "add-select-date",
        ownerId: doctorId,
        emptyText: "No dates available for this doctor.",
      })}
      <h4>Available Slots</h4>
      <div class="slot-list">${slotsHtml || '<p class="hint">No slots available for this date.</p>'}</div>
      ${confirmBlock}
      <div class="button-row">
        <button class="ghost-btn" data-add-back-doctors>Back to Doctors</button>
      </div>
    `,
  );
}

async function openAddAppointmentSlotsStep(
  doctorId,
  slotIndex = null,
  selectedDateOverride = null,
) {
  const doctor = getDoctorById(doctorId);
  if (!doctor) return;

  addAppointmentFlow.doctorId = doctorId;
  addAppointmentFlow.slotIndex = slotIndex;

  // Show a loading state immediately so the modal opens right away.
  openModal(
    `Add Appointment - ${doctor.name}`,
    `
      <p class="hint">${doctor.specialty} - ${doctor.hospital} - Fee: Rs ${doctor.consultFee}</p>
      <h4>Available Slots</h4>
      <div class="slot-list"><p class="hint">Loading available slots…</p></div>
      <div class="button-row">
        <button class="ghost-btn" data-add-back-doctors>Back to Doctors</button>
      </div>
    `,
  );

  // Always fetch fresh slots from the API so the patient sees the doctor's
  // current slot duration (not stale data cached at page-load time).
  try {
    const freshSlots = await loadDoctorSlotsFromApi(doctorId);
    // Update the in-memory store so the rest of the booking flow stays consistent.
    const entry = doctorDirectory.find((d) => d.id === doctorId);
    if (entry) entry.slots = freshSlots;
    doctor.slots = freshSlots;
  } catch {
    // If the fetch fails, fall back to whatever is already in memory.
  }

  renderAddAppointmentSlotsUI(doctor, slotIndex, selectedDateOverride);
}
function openAddAppointmentPaymentStep(doctorId, slotIndex) {
  const doctor = getDoctorById(doctorId);
  const slot = doctor?.slots?.[slotIndex];
  if (!doctor || !slot) return;
  addAppointmentFlow.doctorId = doctorId;
  addAppointmentFlow.slotIndex = slotIndex;

  openModal(
    "Payment (Mockup)",
    `
      <div class="payment-mock">
        <div class="payment-row"><span>Doctor</span><strong>${doctor.name}</strong></div>
        <div class="payment-row"><span>Specialty</span><strong>${doctor.specialty}</strong></div>
        <div class="payment-row"><span>Appointment Slot</span><strong>${formatDateTime(slot.date, slot.time)}</strong></div>
        <div class="payment-row"><span>Mode</span><strong>${slot.mode}</strong></div>
        <div class="payment-row"><span>Consultation Fee</span><strong>Rs ${doctor.consultFee}</strong></div>
        <div class="payment-row"><span>Platform Fee</span><strong>Rs 20</strong></div>
        <div class="payment-row"><span>Total</span><strong>Rs ${doctor.consultFee + 20}</strong></div>
        <div class="payment-card">
          <p><strong>Payment Method</strong></p>
          <p>Pay at Clinic / UPI</p>
          <p class="hint">Payment will be collected at the clinic or via UPI at the time of appointment.</p>
        </div>
        <div class="button-row">
          <button class="btn" data-add-payment-done>Confirm Appointment</button>
          <button class="ghost-btn" data-add-back-slots data-doctor-id="${doctorId}" data-slot-index="${slotIndex}">Back</button>
        </div>
      </div>
    `,
  );
}

async function addNewAppointmentFromFlow(doctorId, slotIndex) {
  const doctor = getDoctorById(doctorId);
  const slot = doctor?.slots?.[slotIndex];
  if (!doctor || !slot) {
    showToast("Please select a valid doctor and slot first.", "error");
    return null;
  }

  if (backendState.online && backendState.patientId) {
    try {
      const created = await apiRequest("/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: backendState.patientId,
          doctorId,
          appointmentSlotId: slot.token,
          title: "Consultation",
          purpose: "New consultation",
          mode: slot.mode === "Teleconsult" ? "TELECONSULT" : "IN_PERSON",
          paymentMethod: "Pay at Clinic",
        }),
      });
      await refreshSchedulingDataFromBackend();
      showToast("New appointment added to your schedule.", "success");
      return created.id;
    } catch (error) {
      backendState.online = false;
      const localId = fallbackAddAppointmentLocally(doctor, slot);
      showToast(
        error.message || "Backend unreachable. Continued in offline mode.",
        "error",
      );
      showToast("New appointment added to your schedule.", "success");
      return localId;
    }
  }

  const id = fallbackAddAppointmentLocally(doctor, slot);
  showToast("New appointment added to your schedule.", "success");
  return id;
}

function initSlopeGraph() {
  if (!healthSlopeGraph || !slopeTooltip) return;
  homeAppointmentRangeSlider?.addEventListener("pointerdown", (event) =>
    event.stopPropagation(),
  );
  homeAppointmentRangeSlider?.addEventListener("click", (event) =>
    event.stopPropagation(),
  );
  homeAppointmentRangeSlider?.addEventListener("keydown", (event) =>
    event.stopPropagation(),
  );
  if (homeAppointmentRangeSlider) {
    homeAppointmentRangeSlider.addEventListener("input", (event) => {
      homeAppointmentRangeIndex = Number(event.target.value || 1);
      if (healthSlopeGraph) {
        healthSlopeGraph.classList.remove("is-animated");
        requestAnimationFrame(() => {
          renderHomeAppointmentActivity();
          requestAnimationFrame(() =>
            healthSlopeGraph.classList.add("is-animated"),
          );
        });
      } else {
        renderHomeAppointmentActivity();
      }
    });
  }

  healthSlopeGraph.addEventListener("mouseover", (event) => {
    const bar = event.target.closest(".home-appointment-bar-wrap");
    if (!bar) return;
    const kindLabel =
      bar.dataset.activityKind === "appointments"
        ? "appointments"
        : bar.dataset.activityKind === "prescriptions"
          ? "prescriptions"
          : "lab reports";
    slopeTooltip.textContent = `${bar.dataset.activityLabel || "Range"} • ${bar.dataset.activityCount || "0"} ${kindLabel}`;
    slopeTooltip.classList.remove("hidden");
    const graphRect = healthSlopeGraph.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    slopeTooltip.style.left = `${barRect.left - graphRect.left + barRect.width / 2}px`;
    slopeTooltip.style.top = `${barRect.top - graphRect.top - 8}px`;
  });

  healthSlopeGraph.addEventListener("mouseout", (event) => {
    if (event.target.closest(".home-appointment-bar-wrap")) {
      slopeTooltip.classList.add("hidden");
    }
  });
}

function updateMedicationTracker() {
  if (!medProgressValue || !medProgressBar || !nextDoseText) return;

  evaluatePrescriptionTimerState();

  const liveDoseCards = Array.from(
    document.querySelectorAll("[data-dose-card]"),
  );
  updateMedicineDoseButtonState(liveDoseCards);
  renderDailyMedicineGroups(liveDoseCards);
  if (!liveDoseCards.length) {
    medProgressValue.textContent = "0/0";
    medProgressBar.style.width = "100%";
    medProgressBar.closest(".progress-track")?.classList.add("complete");
    if (medProgressPercent) medProgressPercent.textContent = "100%";
    nextDoseText.textContent = "All looks good.";
    return;
  }

  const takenCards = liveDoseCards.filter((card) =>
    card.classList.contains("taken"),
  );
  const total = liveDoseCards.length;
  const done = takenCards.length;
  const percent = Math.round((done / total) * 100);

  medProgressValue.textContent = `${done}/${total}`;
  medProgressBar.style.width = `${percent}%`;
  medProgressBar
    .closest(".progress-track")
    ?.classList.toggle("complete", done === total);
  if (medProgressPercent) medProgressPercent.textContent = `${percent}%`;

  const nextPending = liveDoseCards.find(
    (card) => !card.classList.contains("taken"),
  );
  if (nextPending) {
    const time = nextPending.dataset.time || "Upcoming";
    const medicine =
      nextPending.dataset.medicine ||
      nextPending.querySelector(".dose-title")?.textContent ||
      "medicine";
    nextDoseText.textContent = `Next dose: ${time} - ${medicine}`;
    medicationCompletionCelebrated = false;
  } else {
    nextDoseText.textContent =
      "All doses completed for today. Great adherence.";
    if (!medicationCompletionCelebrated) {
      medicationCompletionCelebrated = true;
      openSmoothSuccessModal(
        "All Medicines Taken",
        `
          <p>You have completed all scheduled doses for today.</p>
          <p><strong>${done}/${total}</strong> doses marked as taken.</p>
          <p class="hint">Great adherence. Keep this consistency for better outcomes.</p>
        `,
      );
      showToast("Medication plan completed for today.", "success");
    }
  }
}

function updateMedicineDoseButtonState(
  liveDoseCards = Array.from(document.querySelectorAll("[data-dose-card]")),
) {
  const grouped = new Map();
  liveDoseCards.forEach((card) => {
    const medicine =
      card.dataset.medicine ||
      card.querySelector(".dose-title")?.textContent ||
      "Medicine";
    if (!grouped.has(medicine)) grouped.set(medicine, []);
    grouped.get(medicine).push(card);
  });

  grouped.forEach((cards) => {
    const total = cards.length;
    const done = cards.filter((card) =>
      card.classList.contains("taken"),
    ).length;

    cards.forEach((card) => {
      const button = card.querySelector("[data-dose-btn]");
      if (!button) return;
      const isTaken = card.classList.contains("taken");
      button.classList.toggle("taken", isTaken);

      if (total > 1) {
        button.textContent = isTaken
          ? `Taken ${done}/${total}`
          : `Mark as Taken ${done}/${total}`;
      } else {
        button.textContent = isTaken ? "Taken" : "Mark as Taken";
      }
    });
  });
}

function renderDailyMedicineGroups(
  liveDoseCards = Array.from(document.querySelectorAll("[data-dose-card]")),
) {
  if (!dailyMedicineGroups) return;
  if (!liveDoseCards.length) {
    dailyMedicineGroups.innerHTML =
      '<p class="hint">No medicines scheduled for today.</p>';
    return;
  }

  const groups = new Map();
  liveDoseCards.forEach((card) => {
    const medicine =
      card.dataset.medicine ||
      card.querySelector(".dose-title")?.textContent ||
      "Medicine";
    const time = card.dataset.time || "";
    const period = card.dataset.period || "";
    if (!groups.has(medicine)) groups.set(medicine, []);
    groups.get(medicine).push({
      time,
      period,
      taken: card.classList.contains("taken"),
    });
  });

  dailyMedicineGroups.innerHTML = Array.from(groups.entries())
    .map(([medicine, entries]) => {
      const takenCount = entries.filter((entry) => entry.taken).length;
      const totalCount = entries.length;
      const times = entries
        .map(
          (entry) => `
      <span class="daily-med-time ${entry.taken ? "taken" : ""}">${entry.time}${entry.period ? ` - ${entry.period}` : ""}</span>
    `,
        )
        .join("");
      return `
      <article class="daily-med-card ${takenCount === totalCount ? "complete" : ""}">
        <div class="daily-med-top">
          <div>
            <p class="daily-med-name"><strong>${medicine}</strong></p>
            <p class="hint">${totalCount > 1 ? `${totalCount} doses today` : "Single dose today"}</p>
          </div>
          <span class="chip ${takenCount === totalCount ? "active" : "pending"}">${takenCount}/${totalCount} taken</span>
        </div>
        <div class="daily-med-times">${times}</div>
      </article>
    `;
    })
    .join("");

  setupMedicineSelectorDynamics();
}

function refreshMedicineSelectorDynamics() {
  if (!dailyMedicineGroups) return;
  const cards = Array.from(
    dailyMedicineGroups.querySelectorAll(".daily-med-card"),
  );
  if (!cards.length) return;

  const containerRect = dailyMedicineGroups.getBoundingClientRect();
  const containerCenter = containerRect.top + containerRect.height / 2;
  const maxDistance = Math.max(containerRect.height * 0.45, 1);

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.top + rect.height / 2;
    const distance = cardCenter - containerCenter;
    const ratio = Math.min(Math.abs(distance) / maxDistance, 1);
    const scale = 1 - ratio * 0.08;
    const lift = ratio * 10;
    const opacity = 1 - ratio * 0.22;

    card.classList.toggle("active", ratio < 0.22);
    card.classList.toggle("inactive", ratio >= 0.22);
    card.style.transform = `translateY(${distance < 0 ? lift : -lift}px) scale(${scale})`;
    card.style.opacity = `${opacity}`;
    card.style.zIndex = `${100 - Math.round(ratio * 100)}`;
  });
}

function setupMedicineSelectorDynamics() {
  if (!dailyMedicineGroups) return;

  if (!dailyMedicineGroups.dataset.dynamicBound) {
    let frame = null;
    const onScroll = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        refreshMedicineSelectorDynamics();
      });
    };

    dailyMedicineGroups.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    dailyMedicineGroups.dataset.dynamicBound = "true";
  }

  requestAnimationFrame(() => {
    refreshMedicineSelectorDynamics();
  });
}

// Convert "HH:MM" (24h) → "HH:MM AM/PM" (12h)
function to12Hour(time24) {
  if (!time24 || !time24.includes(":")) return "08:00 AM";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const meridian = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${meridian}`;
}

// Slot index → { period label, reminder key, default 24h time }
const DOSE_SLOTS = [
  { period: "Breakfast", key: "breakfast", def: "08:00" },
  { period: "Lunch", key: "lunch", def: "13:30" },
  { period: "Dinner", key: "dinner", def: "20:30" },
  { period: "Night", key: "sleep", def: "22:30" },
];

function getTimeSlotsForFrequency(frequency) {
  const raw = (frequency || "").trim();

  // ── New format: 4-digit binary pattern like "1010" ──
  if (/^[01]{4}$/.test(raw)) {
    return raw
      .split("")
      .map((bit, i) => {
        if (bit !== "1") return null;
        const slot = DOSE_SLOTS[i];
        const time24 = medicationState.reminders[slot.key] || slot.def;
        return { time: to12Hour(time24), period: slot.period };
      })
      .filter(Boolean);
  }

  // ── Legacy 3-digit pattern like "100", "010", "001" ──
  if (/^[01]{3}$/.test(raw)) {
    const padded = raw + "0"; // treat as B/L/D without Night
    return padded
      .split("")
      .map((bit, i) => {
        if (bit !== "1") return null;
        const slot = DOSE_SLOTS[i];
        const time24 = medicationState.reminders[slot.key] || slot.def;
        return { time: to12Hour(time24), period: slot.period };
      })
      .filter(Boolean);
  }

  // ── Legacy text abbreviations (OD, BD, TDS, etc.) ──
  const f = raw.toUpperCase();
  const r = medicationState.reminders;
  if (/\bBD\b|BID|TWICE|\b2\b/.test(f)) {
    return [
      { time: to12Hour(r.breakfast || "08:00"), period: "Breakfast" },
      { time: to12Hour(r.dinner || "20:30"), period: "Dinner" },
    ];
  }
  if (/\bTDS\b|\bTID\b|THREE|\b3\b/.test(f)) {
    return [
      { time: to12Hour(r.breakfast || "08:00"), period: "Breakfast" },
      { time: to12Hour(r.lunch || "13:30"), period: "Lunch" },
      { time: to12Hour(r.dinner || "20:30"), period: "Dinner" },
    ];
  }
  if (/\bQID\b|FOUR|\b4\b/.test(f)) {
    return [
      { time: to12Hour(r.breakfast || "08:00"), period: "Breakfast" },
      { time: to12Hour(r.lunch || "13:30"), period: "Lunch" },
      { time: to12Hour(r.dinner || "20:30"), period: "Dinner" },
      { time: to12Hour(r.sleep || "22:30"), period: "Night" },
    ];
  }
  // Default: once daily at breakfast
  return [{ time: to12Hour(r.breakfast || "08:00"), period: "Breakfast" }];
}

function doseTimeToMinutes(t) {
  const [hhmm, meridian] = (t || "08:00 AM").split(" ");
  let [h, m] = hhmm.split(":").map(Number);
  if (meridian === "PM" && h !== 12) h += 12;
  if (meridian === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function sortDoseEntries(entries) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return [...entries].sort((a, b) => {
    const aTaken = a.taken || false;
    const bTaken = b.taken || false;
    if (aTaken !== bTaken) return aTaken ? 1 : -1;
    const at = doseTimeToMinutes(a.time);
    const bt = doseTimeToMinutes(b.time);
    // Upcoming times first (small positive diff), then past (wrap to large number)
    const ad = at >= nowMins ? at - nowMins : at - nowMins + 1440;
    const bd = bt >= nowMins ? bt - nowMins : bt - nowMins + 1440;
    return ad - bd;
  });
}

function renderMedicinesSection() {
  const doseGrid = document.querySelector("#medicines .dose-grid");
  if (!doseGrid) return;

  // Deduplicate medicines across prescriptions (prescriptionState sorted newest-first)
  const seenMedicines = new Map(); // key: display name → { item, doctorName }
  prescriptionState
    .filter((rx) => rx.status === "ACTIVE")
    .forEach((rx) => {
      const doctorName = rx.doctor?.name || "Doctor";
      (rx.items || []).forEach((item) => {
        const medicineName =
          item.dose && item.dose !== "—"
            ? `${item.medicine} ${item.dose}`
            : item.medicine;
        if (!seenMedicines.has(medicineName)) {
          seenMedicines.set(medicineName, { item, doctorName });
        }
      });
    });

  const doseEntries = [];
  seenMedicines.forEach(({ item, doctorName }, medicineName) => {
    const slots = getTimeSlotsForFrequency(item.frequency);
    slots.forEach((slot, index) => {
      doseEntries.push({
        medicine: medicineName,
        time: slot.time,
        period: slot.period,
        totalToday: slots.length,
        indexToday: index + 1,
        subtext:
          item.reason && item.reason !== "—"
            ? item.reason
            : `Prescribed by ${doctorName}`,
      });
    });
  });

  const sorted = sortDoseEntries(doseEntries);

  if (!sorted.length) {
    doseGrid.innerHTML =
      '<p class="hint" style="padding:16px 0;">No active medicines. Prescriptions from your doctor will appear here.</p>';
  } else {
    doseGrid.innerHTML = sorted
      .map(
        (entry, i) => `
      <div class="dose-card${i === 0 ? " next-dose" : ""}" data-dose-card
           data-time="${entry.time}" data-medicine="${entry.medicine}" data-period="${entry.period}"
           style="--card-delay:${i * 55}ms">
        <div class="dose-card-top">
          <p class="dose-time">${entry.time} \u2022 ${entry.period}</p>
          <span class="dose-chip">${entry.totalToday > 1 ? `${entry.indexToday} of ${entry.totalToday} today` : "Once today"}</span>
        </div>
        <p class="dose-title">${entry.medicine}</p>
        <p class="dose-subtext">${entry.subtext}</p>
        <button class="btn dose-btn" data-dose-btn>Mark as Taken</button>
      </div>
    `,
      )
      .join("");
  }

  renderMedplanTable();
  updateMedicationTracker();
  renderDoseTimers();
}

function updateNextDoseHighlight(cards) {
  const doseGrid = document.querySelector("#medicines .dose-grid");
  if (!doseGrid) return;
  const allCards =
    cards || Array.from(doseGrid.querySelectorAll("[data-dose-card]"));
  allCards.forEach((c) => c.classList.remove("next-dose"));
  const next = allCards.find((c) => !c.classList.contains("taken"));
  if (next) next.classList.add("next-dose");
}

function reorderDoseCards() {
  const doseGrid = document.querySelector("#medicines .dose-grid");
  if (!doseGrid) return;
  const cards = Array.from(doseGrid.querySelectorAll("[data-dose-card]"));
  if (cards.length < 2) {
    updateNextDoseHighlight(cards);
    return;
  }

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const sorted = [...cards].sort((a, b) => {
    const aTaken = a.classList.contains("taken");
    const bTaken = b.classList.contains("taken");
    if (aTaken !== bTaken) return aTaken ? 1 : -1;
    if (aTaken && bTaken) return 0;
    const at = doseTimeToMinutes(a.dataset.time);
    const bt = doseTimeToMinutes(b.dataset.time);
    const ad = at >= nowMins ? at - nowMins : at - nowMins + 1440;
    const bd = bt >= nowMins ? bt - nowMins : bt - nowMins + 1440;
    return ad - bd;
  });

  const changed = sorted.some((c, i) => c !== cards[i]);

  // Record FIRST positions before DOM reorder
  const firstPos = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));

  // Re-append in new order
  sorted.forEach((c) => doseGrid.appendChild(c));

  if (!changed) {
    updateNextDoseHighlight(sorted);
    return;
  }

  // FLIP — invert and play
  sorted.forEach((card) => {
    const f = firstPos.get(card);
    if (!f) return;
    const l = card.getBoundingClientRect();
    const dx = f.left - l.left;
    const dy = f.top - l.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    card.style.transform = `translate(${dx}px, ${dy}px)`;
    card.style.transition = "none";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.style.transition =
          "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)";
        card.style.transform = "";
        setTimeout(() => {
          card.style.transition = "";
        }, 520);
      });
    });
  });

  updateNextDoseHighlight(sorted);
}

function renderMedplanTable() {
  const tbody = document.getElementById("medplanDoctorsTableBody");
  const notesBody = document.getElementById("medplanNotesBody");

  if (tbody) {
    const rows = [];
    prescriptionState
      .filter((rx) => rx.items?.length)
      .forEach((rx) => {
        const doctorName = rx.doctor?.name || "Doctor";
        rx.items.forEach((item) => {
          rows.push(`<tr>
            <td>${doctorName}</td>
            <td>${item.medicine}</td>
            <td>${item.dose !== "—" ? item.dose : "—"}</td>
            <td>${item.frequency !== "—" ? item.frequency : "—"}</td>
            <td>${item.reason !== "—" ? item.reason : "—"}</td>
          </tr>`);
        });
      });
    tbody.innerHTML = rows.length
      ? rows.join("")
      : '<tr><td colspan="5" style="color:var(--muted);font-style:italic;padding:12px 0;">No medicines prescribed yet.</td></tr>';
  }

  if (notesBody) {
    const notes = prescriptionState
      .filter((rx) => rx.doctorNote)
      .map((rx) => {
        const doctorName = rx.doctor?.name || "Doctor";
        const firstLine = rx.doctorNote.split("\n")[0];
        return `<li><strong>${doctorName}:</strong> ${firstLine}</li>`;
      });
    notesBody.innerHTML = notes.length
      ? `<ul class="timeline-list">${notes.join("")}</ul>`
      : '<p class="hint">No notes from doctors yet.</p>';
  }
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navigateToSection(item.dataset.section);
  });
});

const _QR_DUR_STEPS = [15, 30, 60, 120, 360];
const _QR_DUR_LABELS = ["15 min", "30 min", "1 hr", "2 hr", "6 hr"];

function _applyQrSlider(stepIndex) {
  _qrDurMins = _QR_DUR_STEPS[stepIndex];
  const label = document.getElementById("myQrDurLabel");
  if (label) label.textContent = _QR_DUR_LABELS[stepIndex];
  const slider = document.getElementById("myQrSlider");
  if (slider) {
    const pct = (stepIndex / 4) * 100;
    slider.style.background = `linear-gradient(to right, rgba(82,255,157,0.8) 0%, rgba(82,255,157,0.8) ${pct}%, rgba(255,255,255,0.12) ${pct}%)`;
  }
  const url = buildQrUrl();
  if (myQrAccessUrlEl) myQrAccessUrlEl.textContent = url;
  generateQrCode(url);
}

const _qrSlider = document.getElementById("myQrSlider");
if (_qrSlider) {
  _applyQrSlider(parseInt(_qrSlider.value, 10)); // init fill
  _qrSlider.addEventListener("input", () =>
    _applyQrSlider(parseInt(_qrSlider.value, 10)),
  );
}

async function revokeQrAccess() {
  const btn = document.getElementById("myQrRevokeBtn");
  const code = universalIdState.code;
  if (!btn || !code) return;

  btn.classList.add("revoking");
  btn.querySelector("svg + text, span") &&
    (btn.querySelector("span") || btn).textContent;

  try {
    const res = await fetch(`${API_BASE_URL}/otp/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error("Server error");
    btn.classList.remove("revoking");
    btn.classList.add("revoked");
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M5 10l4 4 6-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Access Revoked`;
    // Reset button after 3s so it can be used again
    setTimeout(() => {
      btn.classList.remove("revoked");
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><line x1="6" y1="6" x2="14" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Revoke Access`;
    }, 3000);
  } catch {
    btn.classList.remove("revoking");
    btn.title = "Failed to revoke — try again";
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const key = button.dataset.action;
  if (!key) return;

  if (key === "start-add-appointment" || key === "book-appointment") {
    addAppointmentFlow.selectedDate = null;
    openAddAppointmentDoctorStep("");
    return;
  }

  if (key === "cancel-appointment-side") {
    openCancelAppointmentSelection();
    return;
  }

  if (key === "cancel-appointment-pick") {
    openCancelAppointmentConfirm(button.dataset.appointmentId);
    return;
  }

  if (key === "cancel-appointment-confirm") {
    completeCancelAppointment(button.dataset.appointmentId);
    return;
  }

  if (key === "cancel-appointment-close") {
    closeDetailModal();
    return;
  }

  if (key === "appointments-upcoming") {
    appointmentViewMode = "upcoming";
    renderAppointments();
    return;
  }

  if (key === "appointments-past") {
    appointmentViewMode = "past";
    renderAppointments();
    return;
  }

  if (key === "appointments-cancelled") {
    appointmentViewMode = "cancelled";
    renderAppointments();
    return;
  }

  if (key === "appointments-list-all" || key === "show-list") {
    appointmentListMode = !appointmentListMode;
    playListButtonTickAnimation();
    renderAppointments();
    return;
  }

  if (key === "show-calendar") {
    appointmentListMode = false;
    renderAppointments();
    return;
  }

  if (key === "go-section") {
    const sectionId = button.dataset.targetSection;
    if (sectionId) navigateToSection(sectionId);
    return;
  }

  if (key === "go-appointments") {
    navigateToSection("appointments");
    return;
  }

  if (key === "messages-open-doctor") {
    openMessagesDoctorChat(button.dataset.doctorId || "");
    return;
  }

  if (key === "doctor-info") {
    openDoctorInfoModal(button.dataset.doctorId || "");
    return;
  }

  if (key === "messages-send") {
    sendMessagesChat();
    return;
  }

  if (key === "open-chat") {
    navigateToSection("messages");
    if (!messageState.selectedDoctorId) {
      openMessagesDoctorChat(doctorDirectory[0]?.id || "");
    }
    return;
  }

  if (key === "ask-doctor-rx") {
    const doctorId =
      button.dataset.doctorId ||
      messageState.selectedDoctorId ||
      doctorDirectory[0]?.id ||
      "";
    navigateToSection("messages");
    if (doctorId) {
      openMessagesDoctorChat(doctorId);
      showToast("Opened doctor chat from prescription.", "success");
    }
    return;
  }

  if (key === "view-all-prescriptions") {
    openAllPrescriptionsModal();
    return;
  }

  if (key === "view-all-labs") {
    openAllLabsModal();
    return;
  }

  if (key === "set-prescription-timeline-filter") {
    const nextFilter = button.dataset.timelineFilter || "all";
    if (prescriptionTimelineState.filter !== nextFilter) {
      prescriptionTimelineState.filter = nextFilter;
      renderPrescriptionsSection();
    }
    return;
  }

  if (key === "set-prescription-timeline-view") {
    const nextView =
      button.dataset.timelineView === "timeline" ? "timeline" : "overview";
    if (prescriptionUiState.timelineView !== nextView) {
      prescriptionUiState.timelineView = nextView;
      renderPrescriptionsSection();
    }
    return;
  }

  if (key === "add-personal-doctor") {
    openAddPersonalDoctorModal();
    return;
  }

  if (key === "network-find-doctors") {
    networkAddFlow.name =
      modalBody.querySelector("[data-network-doctor-name]")?.value?.trim() ||
      "";
    networkAddFlow.specialty =
      modalBody
        .querySelector("[data-network-doctor-specialty]")
        ?.value?.trim() || "";
    networkAddFlow.hospital =
      modalBody
        .querySelector("[data-network-doctor-hospital]")
        ?.value?.trim() || "";
    if (
      !networkAddFlow.name &&
      !networkAddFlow.specialty &&
      !networkAddFlow.hospital
    ) {
      showToast("Enter at least one criteria to find doctors.", "error");
      return;
    }
    openNetworkDoctorResultsModal();
    return;
  }

  if (key === "network-add-candidate") {
    const candidateId = button.dataset.networkCandidateId || "";
    const candidate = doctorDiscoveryCatalog.find(
      (entry) => entry.extId === candidateId,
    );
    if (!candidate) {
      showToast("Doctor entry not found.", "error");
      return;
    }
    const added = addDoctorToNetwork(candidate);
    if (!added) return;
    closeDetailModal();
    showToast("Doctor added to your network.", "success");
    return;
  }

  if (key === "network-add-custom") {
    const matches = findDoctorsByCriteria(networkAddFlow);
    if (!matches.length) {
      showToast(
        "No matching doctors found. Update criteria and try again.",
        "error",
      );
      openAddPersonalDoctorModal();
      return;
    }
    addPersonalDoctorFromCriteria();
    return;
  }

  if (key === "network-back-search") {
    openAddPersonalDoctorModal();
    return;
  }

  if (key === "network-cancel-doctor") {
    closeDetailModal();
    return;
  }

  if (key === "open-full-plan") {
    openMedicationPlanView();
    return;
  }

  if (key === "configure-reminders") {
    openConfigureRemindersModal();
    return;
  }

  if (key === "cancel-reminders") {
    closeDetailModal();
    return;
  }

  if (key === "save-reminders") {
    const getValue = (field, fallback = "") =>
      modalBody
        .querySelector(`[data-reminder-input="${field}"]`)
        ?.value?.trim() || fallback;
    const leadValue = Number(
      getValue("reminderLead", String(defaultReminderProfile.reminderLead)),
    );
    if (!Number.isFinite(leadValue) || leadValue < 0 || leadValue > 120) {
      showToast(
        "Reminder lead time should be between 0 and 120 minutes.",
        "error",
      );
      return;
    }

    medicationState.reminders = {
      breakfast: getValue("breakfast", defaultReminderProfile.breakfast),
      lunch: getValue("lunch", defaultReminderProfile.lunch),
      snacks: getValue("snacks", ""),
      dinner: getValue("dinner", defaultReminderProfile.dinner),
      wakeUp: getValue("wakeUp", defaultReminderProfile.wakeUp),
      sleep: getValue("sleep", defaultReminderProfile.sleep),
      reminderLead: leadValue,
    };
    saveMedicationState();
    closeDetailModal();
    showToast("Reminder schedule updated successfully.", "success");
    renderMedicinesSection();
    return;
  }

  if (key === "request-refill") {
    refillFlow.selectedIds = [];
    refillFlow.quantities = {};
    openRefillMedicineStep();
    return;
  }

  if (key === "refill-cancel") {
    closeDetailModal();
    return;
  }

  if (key === "refill-toggle-item") {
    const refillId = button.dataset.refillId;
    if (!refillId) return;
    if (refillFlow.selectedIds.includes(refillId)) {
      refillFlow.selectedIds = refillFlow.selectedIds.filter(
        (id) => id !== refillId,
      );
    } else {
      refillFlow.selectedIds.push(refillId);
      if (!refillFlow.quantities[refillId]) refillFlow.quantities[refillId] = 1;
    }
    openRefillMedicineStep();
    return;
  }

  if (key === "refill-next-order") {
    if (!refillFlow.selectedIds.length) {
      showToast("Select at least one medicine for refill.", "error");
      return;
    }
    refillFlow.selectedIds.forEach((id) => {
      if (!refillFlow.quantities[id]) refillFlow.quantities[id] = 1;
    });
    openRefillOrderStep();
    return;
  }

  if (key === "refill-back-select") {
    openRefillMedicineStep();
    return;
  }

  if (key === "refill-qty-inc" || key === "refill-qty-dec") {
    const refillId = button.dataset.refillId;
    if (!refillId) return;
    const current = Number(refillFlow.quantities[refillId] || 1);
    const next =
      key === "refill-qty-inc"
        ? Math.min(6, current + 1)
        : Math.max(1, current - 1);
    refillFlow.quantities[refillId] = next;
    openRefillOrderStep();
    return;
  }

  if (key === "refill-next-payment") {
    const qtyInputs = Array.from(
      modalBody.querySelectorAll("[data-refill-qty]"),
    );
    if (!qtyInputs.length) {
      showToast("No medicines selected for refill.", "error");
      openRefillMedicineStep();
      return;
    }
    for (const input of qtyInputs) {
      const value = Number(input.value);
      if (!Number.isFinite(value) || value < 1 || value > 6) {
        showToast("Quantity must be between 1 and 6.", "error");
        return;
      }
      refillFlow.quantities[input.dataset.refillQty] = Math.floor(value);
    }
    openRefillPaymentStep();
    return;
  }

  if (key === "refill-back-order") {
    const paymentInput = modalBody.querySelector("[data-refill-payment]");
    if (paymentInput) refillFlow.paymentMethod = paymentInput.value;
    openRefillOrderStep();
    return;
  }

  if (key === "refill-confirm") {
    const paymentInput = modalBody.querySelector("[data-refill-payment]");
    refillFlow.paymentMethod = paymentInput?.value || "UPI";
    if (!getSelectedRefillItems().length) {
      showToast("Select medicines before confirming order.", "error");
      openRefillMedicineStep();
      return;
    }
    completeRefillOrder();
    return;
  }

  if (key === "share-emr") {
    openShareEmrCodeStep();
    return;
  }

  if (key === "share-emr-verify") {
    const entered =
      modalBody.querySelector("[data-share-emr-code]")?.value?.trim() || "";
    if (!/^\d{10}$/.test(entered)) {
      showToast("Enter a valid 10-digit MEIOSIS code.", "error");
      return;
    }
    if (entered !== universalIdState.code) {
      showToast("Invalid code. Please enter your MEIOSIS code.", "error");
      return;
    }
    openShareEmrDoctorStep();
    return;
  }

  if (key === "share-emr-select-doctor") {
    shareEmrFlow.selectedDoctorId = button.dataset.doctorId || null;
    openShareEmrDoctorStep();
    return;
  }

  if (key === "share-emr-next") {
    if (!shareEmrFlow.selectedDoctorId) {
      showToast("Select a doctor first.", "error");
      return;
    }
    openShareEmrRecordsStep();
    return;
  }

  if (key === "share-emr-toggle-appointment") {
    const appointmentId = button.dataset.appointmentId;
    if (!appointmentId) return;
    const selected = new Set(shareEmrFlow.selectedAppointmentIds);
    if (selected.has(appointmentId)) selected.delete(appointmentId);
    else selected.add(appointmentId);
    shareEmrFlow.selectedAppointmentIds = Array.from(selected);
    openShareEmrRecordsStep();
    return;
  }

  if (key === "share-emr-toggle-all") {
    const sortedAppointments = getSortedAppointments().slice().reverse();
    if (
      shareEmrFlow.selectedAppointmentIds.length === sortedAppointments.length
    ) {
      shareEmrFlow.selectedAppointmentIds = [];
    } else {
      shareEmrFlow.selectedAppointmentIds = sortedAppointments.map(
        ([id]) => id,
      );
    }
    openShareEmrRecordsStep();
    return;
  }

  if (key === "share-emr-send") {
    if (
      !shareEmrFlow.selectedDoctorId ||
      !shareEmrFlow.selectedAppointmentIds.length
    ) {
      showToast("Select doctor and at least one appointment EMR.", "error");
      return;
    }
    openShareEmrSendingStep();
    return;
  }

  if (key === "share-emr-back") {
    openShareEmrCodeStep();
    return;
  }

  if (key === "share-emr-records-back") {
    openShareEmrDoctorStep();
    return;
  }

  if (key === "share-emr-cancel" || key === "share-emr-done") {
    closeDetailModal();
    return;
  }

  if (key === "download-summary") {
    const url = resolveDocumentUrl("summary", "", "", "download");
    if (!url) {
      showToast("Health summary is unavailable right now.", "error");
      return;
    }
    triggerDocumentDownload(url, "meiosis-health-summary.pdf");
    showToast("Health summary download started.", "success");
    return;
  }

  if (key === "download-audit") {
    const url = resolveDocumentUrl("audit", "", "", "download");
    if (!url) {
      showToast("Audit report is unavailable right now.", "error");
      return;
    }
    triggerDocumentDownload(url, "meiosis-audit-report.pdf");
    showToast("Audit report download started.", "success");
    return;
  }

  if (key === "download-rx-pdf") {
    const title = button.dataset.docTitle || "Prescription";
    const code = button.dataset.docCode || "";
    const file = button.dataset.docFile || "";
    const docType = button.dataset.docType || "prescription";
    const url = resolveDocumentUrl(docType, code, file, "download");
    if (!url) {
      showToast("Prescription PDF is unavailable right now.", "error");
      return;
    }
    triggerDocumentDownload(
      url,
      `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "prescription"}.pdf`,
    );
    showToast("Prescription PDF download started.", "success");
    return;
  }

  if (key === "open-mock-pdf") {
    const title = button.dataset.docTitle || "Prescription";
    const code = button.dataset.docCode || "";
    openModal(title, buildRxViewHtml(code));
    return;
  }

  if (key === "edit-universal-id") {
    openUniversalIdEditModal();
    return;
  }

  if (key === "view-lab") {
    const title = button.dataset.docTitle || "Lab Report";
    const code = button.dataset.docCode || "";
    openModal(title, buildLabViewHtml(code));
    return;
  }

  if (key === "edit-profile") {
    openEditProfileModal();
    return;
  }

  if (key === "logout-user") {
    clearAuthSession();
    window.location.href = "./login.html";
    return;
  }

  if (key === "open-nfc-settings") {
    navigateToSection("nfc");
    return;
  }

  if (key === "disable-card") {
    if (isNfcCardActive) openDisableCardSelectionStep();
    else openEnableCardConfirmStep();
    return;
  }

  if (key === "add-nfc-card") {
    openAddNfcCardCodeStep();
    return;
  }

  if (key === "simulate-doctor-scan") {
    openDoctorScanAutoFetchModal();
    return;
  }

  if (key === "select-nfc-card") {
    const cardId = button.dataset.nfcCardId;
    if (!cardId) return;
    const card = getNfcCardById(cardId);
    if (!card) return;
    activeNfcCardId = cardId;
    if (card.status !== "Active") {
      card.status = "Active";
      card.lastUsed = `${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - Card activated from dashboard`;
    }
    renderNfcCardState();
    showToast("Active NFC card switched.", "success");
    return;
  }

  if (key === "view-scan-history") {
    openNfcScanHistoryModal();
    return;
  }

  if (key === "regenerate-token") {
    openRegenerateTokenConfirmModal();
    return;
  }

  if (key === "emergency-override") {
    openEmergencyOverridePanel();
    return;
  }

  if (key === "reschedule-appointment") {
    openRescheduleModal(button.dataset.appointmentId || "apt-001");
    return;
  }

  if (key === "reschedule-select-date") {
    openRescheduleModal(
      button.dataset.ownerId || "apt-001",
      button.dataset.slotDate || null,
    );
    return;
  }

  if (key === "add-select-date") {
    const d = getDoctorById(button.dataset.ownerId || "");
    if (d)
      renderAddAppointmentSlotsUI(d, null, button.dataset.slotDate || null);
    return;
  }

  if (key === "view-appointment-details") {
    openAppointmentDetails(button.dataset.appointmentId || "apt-001");
    return;
  }

  if (key === "view-session") {
    openSessionSummary(button.dataset.appointmentId || "apt-001");
    return;
  }

  const entry = actionDetails[key];
  if (entry) {
    openModal(entry.title, entry.body);
    if (key === "request-refill")
      showToast("Refill request submitted (demo).", "success");
    if (key === "open-chat") showToast("Secure chat opened.", "success");
    if (key === "save-settings")
      showToast("Settings saved successfully.", "success");
    if (key === "manage-devices")
      showToast("Device manager opened.", "success");
    if (key === "change-password")
      showToast("Password reset flow opened (demo).", "success");
    if (key === "export-data")
      showToast("Data export started (demo).", "success");
    if (key === "delete-account")
      showToast("Account deletion request submitted (demo).", "error");
  }

  if (key === "save-share-settings") {
    saveShareSettings();
    return;
  }
});

modalBody.addEventListener("click", (event) => {
  const selectDoctorBtn = event.target.closest("[data-add-select-doctor]");
  if (selectDoctorBtn) {
    openAddAppointmentSlotsStep(selectDoctorBtn.dataset.doctorId);
    return;
  }

  const chooseSlotBtn = event.target.closest("[data-add-choose-slot]");
  if (chooseSlotBtn) {
    const d = getDoctorById(chooseSlotBtn.dataset.doctorId);
    if (d)
      renderAddAppointmentSlotsUI(
        d,
        Number(chooseSlotBtn.dataset.slotIndex),
        null,
      );
    return;
  }

  const confirmSlotBtn = event.target.closest("[data-add-confirm-slot]");
  if (confirmSlotBtn) {
    openAddAppointmentPaymentStep(
      confirmSlotBtn.dataset.doctorId,
      Number(confirmSlotBtn.dataset.slotIndex),
    );
    return;
  }

  const backDoctorsBtn = event.target.closest("[data-add-back-doctors]");
  if (backDoctorsBtn) {
    openAddAppointmentDoctorStep(addAppointmentFlow.searchTerm);
    return;
  }

  const backSlotsBtn = event.target.closest("[data-add-back-slots]");
  if (backSlotsBtn) {
    const d = getDoctorById(backSlotsBtn.dataset.doctorId);
    if (d)
      renderAddAppointmentSlotsUI(
        d,
        Number(backSlotsBtn.dataset.slotIndex),
        null,
      );
    return;
  }

  const paymentDoneBtn = event.target.closest("[data-add-payment-done]");
  if (paymentDoneBtn) {
    addNewAppointmentFromFlow(
      addAppointmentFlow.doctorId,
      addAppointmentFlow.slotIndex,
    ).then((createdId) => {
      if (!createdId) return;
      const created = appointments[createdId];
      if (!created) return;
      pendingAppointmentFocusId = createdId;
      appointmentViewMode = "upcoming";
      navigateToSection("appointments");
      renderAppointments();
      openSmoothSuccessModal(
        "Appointment Successfully Booked",
        `<p>Your appointment is now added to Upcoming Appointments and My Appointments.</p>
         <p><strong>${created.doctor}</strong> - ${getAppointmentDateTime(created)}</p>
         <p>Slot ID: ${created.slotId}</p>
         <p class="hint">Payment method: Pay at Clinic. Confirm at the reception.</p>`,
      );
    });
    return;
  }

  const chooseBtn = event.target.closest("[data-reschedule-choose]");
  if (chooseBtn) {
    confirmReschedule(
      chooseBtn.dataset.appointmentId,
      Number(chooseBtn.dataset.slotIndex),
    );
    return;
  }

  const nfcDisableConfirmBtn = event.target.closest(
    "[data-nfc-disable-confirm]",
  );
  if (nfcDisableConfirmBtn) {
    openDisableCardOtpStep(nfcDisableConfirmBtn.dataset.nfcCardId);
    return;
  }

  const nfcDisablePickBtn = event.target.closest("[data-nfc-disable-pick]");
  if (nfcDisablePickBtn) {
    openDisableCardConfirmStep(nfcDisablePickBtn.dataset.nfcCardId);
    return;
  }

  const nfcDisableCancelBtn = event.target.closest("[data-nfc-disable-cancel]");
  if (nfcDisableCancelBtn) {
    closeDetailModal();
    return;
  }

  const nfcDisableSubmitBtn = event.target.closest("[data-nfc-disable-submit]");
  if (nfcDisableSubmitBtn) {
    const otpInput = modalBody.querySelector("[data-nfc-otp-input]");
    const otp = otpInput?.value?.trim() || "";
    if (!/^\d{6}$/.test(otp)) {
      showToast("Enter a valid 6-digit OTP.", "error");
      return;
    }
    // OTP will be verified by backend in production

    completeDisableCard(nfcDisableSubmitBtn.dataset.nfcCardId);
    return;
  }

  const nfcEnableConfirmBtn = event.target.closest("[data-nfc-enable-confirm]");
  if (nfcEnableConfirmBtn) {
    completeEnableCard();
    return;
  }

  const nfcAddCancelBtn = event.target.closest("[data-nfc-add-cancel]");
  if (nfcAddCancelBtn) {
    addNfcFlow.readerConnected = false;
    closeDetailModal();
    return;
  }

  const nfcAddCodeVerifyBtn = event.target.closest(
    "[data-nfc-add-code-verify]",
  );
  if (nfcAddCodeVerifyBtn) {
    const code =
      modalBody.querySelector("[data-nfc-add-code]")?.value?.trim() || "";
    if (!/^\d{10}$/.test(code)) {
      showToast("Enter a valid 10-digit MEIOSIS code.", "error");
      return;
    }
    if (code !== universalIdState.code) {
      showToast("Code mismatch. Please enter your MEIOSIS code.", "error");
      return;
    }
    openAddNfcCardOtpStep();
    return;
  }

  const nfcAddOtpVerifyBtn = event.target.closest("[data-nfc-add-otp-verify]");
  if (nfcAddOtpVerifyBtn) {
    const otp =
      modalBody.querySelector("[data-nfc-add-otp]")?.value?.trim() || "";
    if (!/^\d{6}$/.test(otp)) {
      showToast("Enter a valid 6-digit OTP.", "error");
      return;
    }
    // OTP will be verified by backend in production
    openAddNfcCardScanStep();
    return;
  }

  const nfcReaderConnectBtn = event.target.closest("[data-nfc-reader-connect]");
  if (nfcReaderConnectBtn) {
    addNfcFlow.readerConnected = true;
    openAddNfcCardScanStep();
    return;
  }

  const nfcAddSubmitBtn = event.target.closest("[data-nfc-add-submit]");
  if (nfcAddSubmitBtn) {
    if (!addNfcFlow.readerConnected) {
      showToast("Connect NFC reader before scanning.", "error");
      return;
    }
    const label =
      modalBody.querySelector("[data-nfc-card-label]")?.value?.trim() || "";
    const hospital =
      modalBody.querySelector("[data-nfc-card-hospital]")?.value?.trim() ||
      "City General";
    if (label.length < 3) {
      showToast("Card label must be at least 3 characters.", "error");
      return;
    }
    openAddNfcScanSuccessStep(label, hospital);
    addNfcFlow.readerConnected = false;
    return;
  }

  const nfcTokenConfirmBtn = event.target.closest("[data-nfc-token-confirm]");
  if (nfcTokenConfirmBtn) {
    regenerateNfcToken();
    return;
  }

  const nfcTokenCancelBtn = event.target.closest("[data-nfc-token-cancel]");
  if (nfcTokenCancelBtn) {
    closeDetailModal();
    return;
  }

  const nfcTokenCopyBtn = event.target.closest("[data-nfc-token-copy]");
  if (nfcTokenCopyBtn) {
    const tokenText = nfcAccessToken;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(tokenText)
        .then(() => {
          showToast("Token copied to clipboard.", "success");
        })
        .catch(() => {
          showToast("Copy failed. Please copy manually.", "error");
        });
    } else {
      showToast("Clipboard not supported in this browser.", "error");
    }
    return;
  }

  const emgStartBtn = event.target.closest("[data-emg-start]");
  if (emgStartBtn) {
    openEmergencyDoctorIdStep(Number(emgStartBtn.dataset.emgDuration));
    return;
  }

  const emgDisableBtn = event.target.closest("[data-emg-disable]");
  if (emgDisableBtn) {
    if (!emergencyOverrideActive) {
      showToast("Emergency override is already off.", "error");
      return;
    }
    disableEmergencyOverride();
    return;
  }

  const emgCancelBtn = event.target.closest("[data-emg-cancel]");
  if (emgCancelBtn) {
    closeDetailModal();
    return;
  }

  const emgDoctorIdSubmitBtn = event.target.closest(
    "[data-emg-doctor-id-submit]",
  );
  if (emgDoctorIdSubmitBtn) {
    const idInput = modalBody.querySelector("[data-emg-doctor-id-input]");
    const doctorId = (idInput?.value?.trim() || "").toUpperCase();
    if (!/^M-\d{3}$/.test(doctorId)) {
      showToast("Enter a valid Doctor MEIOSIS ID (format: M-001).", "error");
      return;
    }
    const isValidDoctorId = doctorDirectory.some(
      (doctor) =>
        `M-${doctor.id.replace("doc-", "").padStart(3, "0")}` === doctorId,
    );
    if (!isValidDoctorId) {
      showToast(
        "Doctor MEIOSIS ID not found. Try M-001, M-002, M-003 or M-004.",
        "error",
      );
      return;
    }
    enableEmergencyOverride(Number(emgDoctorIdSubmitBtn.dataset.emgDuration));
    return;
  }

  const profileSaveBtn = event.target.closest("[data-profile-save]");
  if (profileSaveBtn) {
    const read = (key) =>
      modalBody.querySelector(`[data-profile-input="${key}"]`)?.value?.trim() ||
      "";
    const nextProfile = {
      name: read("name"),
      email: read("email"),
      phone: read("phone"),
      address: read("address"),
      language: read("language"),
    };

    if (!nextProfile.name || !nextProfile.email || !nextProfile.phone) {
      showToast("Name, email and phone are required.", "error");
      return;
    }
    if (!nextProfile.email.includes("@")) {
      showToast("Enter a valid email address.", "error");
      return;
    }

    Object.assign(profileState, nextProfile);
    renderProfileState();
    closeDetailModal();
    showToast("Profile updated successfully.", "success");
    return;
  }

  const profileCancelBtn = event.target.closest("[data-profile-cancel]");
  if (profileCancelBtn) {
    closeDetailModal();
    return;
  }

  const uidCancelBtn = event.target.closest("[data-uid-cancel]");
  if (uidCancelBtn) {
    closeDetailModal();
    return;
  }

  const uidSaveBtn = event.target.closest("[data-uid-save]");
  if (uidSaveBtn) {
    const newCode =
      modalBody.querySelector("[data-uid-new-code]")?.value?.trim() || "";
    const otp = modalBody.querySelector("[data-uid-otp]")?.value?.trim() || "";

    if (!/^\d{10}$/.test(newCode)) {
      showToast("MEIOSIS code must be exactly 10 digits.", "error");
      return;
    }
    if (newCode === universalIdState.code) {
      showToast(
        "New Universal ID must be different from current one.",
        "error",
      );
      return;
    }
    if (takenUniversalCodes.has(newCode)) {
      showToast("This Universal ID is already taken by another user.", "error");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      showToast("Enter a valid 6-digit OTP.", "error");
      return;
    }
    // OTP will be verified by backend in production

    takenUniversalCodes.add(universalIdState.code);
    saveUniversalId(newCode);
    closeDetailModal();
    openModal(
      "Universal ID Updated",
      `<p>Your new Universal ID is <strong>${newCode}</strong>.</p>
       <p>For security, editing is unavailable for the next ${universalIdState.lockDays} days.</p>`,
    );
    showToast("Universal ID updated and saved.", "success");
    return;
  }
});

modalBody.addEventListener("input", (event) => {
  const searchInput = event.target.closest("[data-doctor-search-input]");
  if (searchInput) {
    openAddAppointmentDoctorStep(searchInput.value, {
      preserveSearchFocus: true,
    });
    return;
  }

  const emrSearchInput = event.target.closest("[data-share-emr-search]");
  if (emrSearchInput) {
    shareEmrFlow.searchTerm = emrSearchInput.value || "";
    openShareEmrDoctorStep({ preserveSearchFocus: true });
  }
});

document
  .querySelector("#medicines .dose-grid")
  ?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dose-btn]");
    if (!button) return;
    const card = button.closest("[data-dose-card]");
    if (!card) return;

    const becomingTaken = !card.classList.contains("taken");

    // Tap feedback
    button.classList.add("dose-btn-tap");
    setTimeout(() => button.classList.remove("dose-btn-tap"), 200);

    card.classList.toggle("taken");
    updateMedicationTracker();

    // Delay reorder so the taken visual settles before card flies to bottom
    setTimeout(() => reorderDoseCards(), becomingTaken ? 380 : 0);
  });

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");

    const key = tab.dataset.tab;
    const tabSectionMap = {
      medications: "medicines",
      "labs-tab": "labs",
      visits: "appointments",
      access: "settings",
      files: "medicines",
    };

    const targetSection = tabSectionMap[key];
    if (targetSection) {
      if (key === "medications" || key === "files") openMedicationPlanView();
      else navigateToSection(targetSection);
      showToast(`${tab.textContent.trim()} opened.`, "success");
      return;
    }

    const info = {
      overview: `
        <div class="card-grid two-col">
          <div>
            <p><strong>Demographics:</strong> ${profileState.name}, blood group B+, Bengaluru</p>
            <p><strong>Insurance:</strong> MediSure Gold active till 31 Dec 2027</p>
            <p><strong>Emergency Contact:</strong> Priya Sharma (+91-98XXXXXX10)</p>
          </div>
          <div>
            <p><strong>Primary Flags:</strong> Hypertension, Prediabetes, elevated LDL follow-up</p>
            <p><strong>Current Care Team:</strong> Primary, Cardiology, Endocrinology</p>
            <p><strong>Record Freshness:</strong> Last clinical update logged on 03 Mar 2026</p>
          </div>
        </div>
      `,
      conditions: `
        <div class="card-grid two-col">
          <div>
            <p><strong>Hypertension</strong></p>
            <ul class="timeline-list">
              <li>Status: Controlled on medication</li>
              <li>Current therapy: Amlodipine 5mg daily</li>
              <li>Recent home average: 126/82</li>
            </ul>
          </div>
          <div>
            <p><strong>Prediabetes</strong></p>
            <ul class="timeline-list">
              <li>Status: Stable with medication + diet plan</li>
              <li>Current therapy: Metformin 500mg twice daily</li>
              <li>Recent HbA1c trend: improving</li>
            </ul>
          </div>
        </div>
      `,
      imaging: `
        <div class="card-grid two-col">
          <div>
            <p><strong>ECG</strong> - Jan 2024</p>
            <p class="hint">Normal sinus rhythm. No acute ischemic change.</p>
            <p><strong>Echo</strong> - Jan 2024</p>
            <p class="hint">Preserved LV function. No major valvular abnormality.</p>
          </div>
          <div>
            <p><strong>MRI Brain Screening</strong> - Apr 2025</p>
            <p class="hint">No acute intracranial pathology reported.</p>
            <p><strong>Imaging Status</strong></p>
            <p class="hint">No pending imaging follow-up currently visible in EMR.</p>
          </div>
        </div>
      `,
      access: `
        <div class="card-grid two-col">
          <div>
            <p><strong>Recent Access Events</strong></p>
            <ul class="timeline-list">
              <li>03 Mar 2026 - Dr. Rao - ECG + lipid summary viewed</li>
              <li>02 Mar 2026 - Nova Lab - Lipid panel uploaded</li>
              <li>01 Mar 2026 - Dr. Chen - Prescription note updated</li>
            </ul>
          </div>
          <div>
            <p><strong>Current Access Policy</strong></p>
            <ul class="timeline-list">
              <li>Doctor full-access expiry: 30 days</li>
              <li>Lab-only access: available on request</li>
              <li>Emergency reads: always logged and reviewable</li>
            </ul>
          </div>
        </div>
      `,
    };

    openModal(
      `Records Tab: ${tab.textContent}`,
      info[key] ?? "<p>No details available.</p>",
    );
  });
});

function saveCustomTheme() {
  try {
    localStorage.setItem(
      CUSTOM_THEME_STORAGE_KEY,
      JSON.stringify(customThemeConfig),
    );
  } catch (error) {
    // Ignore storage failures.
  }
}

function updateThemeCustomUi() {
  if (themeCustomControls) {
    themeCustomControls.classList.toggle(
      "hidden",
      themeSelect?.value !== "custom",
    );
  }
  if (themeColorSlider) themeColorSlider.value = String(customThemeConfig.hue);
  if (themeBrightnessSlider)
    themeBrightnessSlider.value = String(customThemeConfig.brightness);
  if (themeColorValue)
    themeColorValue.textContent = String(customThemeConfig.hue);
  if (themeBrightnessValue)
    themeBrightnessValue.textContent = `${customThemeConfig.brightness}%`;
  if (themePreviewSwatch) {
    themePreviewSwatch.style.background = `linear-gradient(135deg, hsl(${customThemeConfig.hue} 92% ${clamp(54 + (customThemeConfig.brightness - 100) * 0.16, 44, 70)}%), hsl(${(customThemeConfig.hue + 38) % 360} 88% ${clamp(48 + (customThemeConfig.brightness - 100) * 0.12, 40, 64)}%))`;
  }
}

function clearCustomThemeOverrides() {
  [
    "--bg",
    "--bg-elev",
    "--text",
    "--muted",
    "--accent",
    "--accent-soft",
    "--card",
    "--border",
    "--shadow",
    "--danger",
  ].forEach((property) => document.body.style.removeProperty(property));
  document.body.style.background = "";
}

function applyCustomTheme() {
  const hue = clamp(customThemeConfig.hue, 0, 360);
  const brightness = clamp(customThemeConfig.brightness, 70, 135);
  const tone = (brightness - 70) / 65;
  const bgLightness = clamp(4 + tone * 90, 4, 94);
  const bgElevLightness = clamp(8 + tone * 86, 8, 94);
  const textLightness = clamp(98 - tone * 84, 14, 98);
  const mutedLightness = clamp(74 - tone * 28, 34, 74);
  const accentLightness = clamp(58 + tone * 8, 50, 72);
  const cardLightness = clamp(12 + tone * 80, 12, 92);
  const borderLightness = clamp(72 + tone * 12, 64, 86);
  const cardAlpha = clamp(0.82 - tone * 0.18, 0.58, 0.82);
  const accentGlow = clamp(0.14 + tone * 0.08, 0.14, 0.22);
  const secondaryHue = (hue + 32) % 360;
  const textHue = tone > 0.55 ? (hue + 18) % 360 : hue;
  const shadowOpacity = clamp(0.38 - tone * 0.24, 0.1, 0.38);
  document.body.style.setProperty("--bg", `hsl(${hue} 34% ${bgLightness}%)`);
  document.body.style.setProperty(
    "--bg-elev",
    `hsl(${hue} 28% ${bgElevLightness}%)`,
  );
  document.body.style.setProperty(
    "--text",
    `hsl(${textHue} 22% ${textLightness}%)`,
  );
  document.body.style.setProperty(
    "--muted",
    `hsl(${textHue} 14% ${mutedLightness}%)`,
  );
  document.body.style.setProperty(
    "--accent",
    `hsl(${hue} 92% ${accentLightness}%)`,
  );
  document.body.style.setProperty(
    "--accent-soft",
    `hsl(${hue} 92% ${accentLightness}% / ${clamp(0.16 + tone * 0.06, 0.16, 0.22)})`,
  );
  document.body.style.setProperty(
    "--card",
    `hsl(${hue} 24% ${cardLightness}% / ${cardAlpha})`,
  );
  document.body.style.setProperty(
    "--border",
    `hsl(${hue} 62% ${borderLightness}% / ${clamp(0.16 + tone * 0.04, 0.16, 0.2)})`,
  );
  document.body.style.setProperty(
    "--shadow",
    `0 22px 44px rgba(0, 0, 0, ${shadowOpacity})`,
  );
  document.body.style.setProperty(
    "--danger",
    `hsl(${(hue + 170) % 360} 92% 66%)`,
  );
  document.body.style.background = `
    radial-gradient(860px 430px at 100% -8%, hsl(${hue} 92% ${accentLightness}% / ${accentGlow}), transparent 52%),
    radial-gradient(700px 420px at 0% 100%, hsl(${secondaryHue} 84% ${clamp(accentLightness - 6 + tone * 6, 44, 76)}% / ${clamp(0.1 + tone * 0.06, 0.1, 0.16)}), transparent 48%),
    linear-gradient(180deg, hsl(${hue} 34% ${clamp(bgLightness - 2, 3, 92)}%) 0%, hsl(${hue} 28% ${clamp(bgElevLightness, 8, 94)}%) 100%)
  `;
  updateThemeCustomUi();
}

function applyTheme(theme) {
  const nextTheme = [
    "dark",
    "light",
    "super-dark",
    "green",
    "orange",
    "violet",
    "yellow",
    "custom",
  ].includes(theme)
    ? theme
    : "dark";
  document.body.setAttribute("data-theme", nextTheme);
  if (themeSelect) themeSelect.value = nextTheme;
  if (nextTheme === "custom") applyCustomTheme();
  else clearCustomThemeOverrides();
  updateThemeCustomUi();
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    // Ignore storage failures.
  }
}

if (themeSelect) {
  themeSelect.addEventListener("change", (event) => {
    applyTheme(event.target.value);
  });
}

if (themeColorSlider) {
  themeColorSlider.addEventListener("input", (event) => {
    customThemeConfig = {
      ...customThemeConfig,
      hue: clamp(Number(event.target.value) || 152, 0, 360),
    };
    saveCustomTheme();
    if (themeSelect && themeSelect.value !== "custom")
      themeSelect.value = "custom";
    applyTheme("custom");
  });
}

if (themeBrightnessSlider) {
  themeBrightnessSlider.addEventListener("input", (event) => {
    customThemeConfig = {
      ...customThemeConfig,
      brightness: clamp(Number(event.target.value) || 100, 70, 135),
    };
    saveCustomTheme();
    if (themeSelect && themeSelect.value !== "custom")
      themeSelect.value = "custom";
    applyTheme("custom");
  });
}

closeModal.addEventListener("click", closeDetailModal);

detailModal.addEventListener("click", (event) => {
  if (event.target === detailModal) closeDetailModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDetailModal();
    closeSidebar();
  }
  if (event.key === "Tab" && !detailModal.classList.contains("hidden")) {
    const focusable = detailModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    if (document.body.classList.contains("sidebar-open")) closeSidebar();
    else openSidebar();
  });
}

if (sidebarClose) {
  sidebarClose.addEventListener("click", closeSidebar);
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", closeSidebar);
}

if (sidebarSearchBtn) {
  sidebarSearchBtn.addEventListener("click", runSidebarSearch);
}

if (sidebarSearchInput) {
  sidebarSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSidebarSearch();
    }
  });
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) closeSidebar();
});

if (weatherLocateBtn) {
  weatherLocateBtn.addEventListener("click", requestWeatherByLocation);
}

if (weatherRefreshBtn) {
  weatherRefreshBtn.addEventListener("click", requestWeatherByLocation);
}

if (messagesInput) {
  messagesInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessagesChat();
    }
  });
}

if (messagesImageBtn && messagesImageInput) {
  messagesImageBtn.addEventListener("click", (event) => {
    event.preventDefault();
  });
}

if (messagesVoiceBtn) {
  messagesVoiceBtn.addEventListener("click", () => {
    if (messagesVoiceBtn.disabled) return;
    toggleMessagesVoiceNote();
  });
}

if (messagesVoiceDoneBtn) {
  messagesVoiceDoneBtn.addEventListener("click", () => {
    if (!messagesMediaRecorder || messagesMediaRecorder.state !== "recording")
      return;
    messagesVoiceFinalizeMode = "send";
    if (messagesVoiceStatus)
      messagesVoiceStatus.textContent = "Finalising voice note...";
    messagesMediaRecorder.stop();
  });
}

if (messagesVoiceCancelBtn) {
  messagesVoiceCancelBtn.addEventListener("click", () => {
    if (!messagesMediaRecorder || messagesMediaRecorder.state !== "recording") {
      closeMessagesVoiceOverlay();
      return;
    }
    messagesVoiceFinalizeMode = "discard";
    if (messagesVoiceStatus)
      messagesVoiceStatus.textContent = "Discarding recording...";
    messagesMediaRecorder.stop();
  });
}

if (messagesBackBtn) {
  messagesBackBtn.addEventListener("click", () => {
    messagesFocusMode = false;
    renderMessagesLayoutMode();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey) return;
  if (document.activeElement !== messagesInput) return;
  event.preventDefault();
  sendMessagesChat();
});

const storedTheme = (() => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
})();

applyTheme(document.body.getAttribute("data-theme") || storedTheme || "dark");

if (medsDate) {
  const now = new Date();
  medsDate.textContent = `Today: ${now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}`;
}

loadAppointmentsState();
loadUniversalIdState();
loadMedicationState();
loadCustomDoctorsState();
saveMedicationState();
renderHomeSummary();
renderHealthRecords();
renderPrescriptionsSection();
renderLabsSection();
renderAppointments();
updateMedicationTracker();
initSlopeGraph();
replayHomeDashboardAnimations();
renderNfcCardState();
renderEmergencyStatus();
renderProfileState();
renderUniversalIdState();
// Analytics section removed from UI — stub prevents ReferenceError
function fetchAndRenderAnalytics() {}
fetchAndRenderAnalytics();
renderDoctorNetwork();
renderMessagesDoctorList();
renderMessagesThread();
renderMessagesLayoutMode();
hydrateFrontendFromBackend();
setInterval(updateMedicationTracker, 60 * 1000);

// Poll for new messages every 3 s so doctor replies appear in real time
(function startMessagePolling() {
  async function pollMessages() {
    const patientId = getLoggedInPatientId();
    if (!patientId || !backendState.online) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/messages/threads?patientId=${encodeURIComponent(patientId)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      mergeMessageThreads(data);
      renderMessagesDoctorList();
      renderMessagesThread();
    } catch {
      /* backend offline — ignore */
    }
  }
  setInterval(pollMessages, 3000);
})();
setTimeout(() => {
  isAppointmentsLoading = false;
  renderAppointments();
}, 500);
