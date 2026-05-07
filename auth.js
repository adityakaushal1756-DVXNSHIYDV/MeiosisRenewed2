const runtimeConfig = window.MEIOSIS_RUNTIME_CONFIG || {};
const BACKEND_ORIGIN = String(
  runtimeConfig.backendOrigin || "http://localhost:5002",
).replace(/\/+$/, "");
const DOCTOR_FRONTEND_URL = String(
  runtimeConfig.doctorFrontendUrl || "http://localhost:5173",
).replace(/\/+$/, "");
const API_BASE_URL = `${BACKEND_ORIGIN}/api`;
const AUTH_SESSION_KEY = "meiosis_auth_session_v1";
const ROOT_LINKS_KEY = "meiosis_root_links_v1";
let backendReachable = false;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deriveRootLinks() {
  const isLocalSession = window.location.protocol === "file:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  // Try to use a relative path for the new vite frontend if we are hosted normally, but default to the local Vite port on localhost
  const patientViteHostname = isLocalSession ? "http://localhost:5174/" : new URL("/patient-frontend/", window.location.href).href;

  return {
    login: new URL("./login.html", window.location.href).href,
    signup: new URL("./signup.html", window.location.href).href,
    patient: new URL("./patient.html", window.location.href).href,
    patientVite: patientViteHostname,
    doctorLaunch: new URL("./doctor-launch.html", window.location.href).href,
  };
}

function saveRootLinks() {
  localStorage.setItem(ROOT_LINKS_KEY, JSON.stringify(deriveRootLinks()));
}

function saveSession(user, token) {
  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      ...user,
      token,
      savedAt: new Date().toISOString(),
    }),
  );
}

async function isDoctorFrontendReady() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500); // Give Vite 2.5s
  try {
    // Try root first
    const res = await fetch(DOCTOR_FRONTEND_URL, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    clearTimeout(timer);
    // Secondary check: try /health which is defined in vite.config.ts
    try {
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 1500);
      const res2 = await fetch(`${DOCTOR_FRONTEND_URL}/health`, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        signal: controller2.signal,
      });
      clearTimeout(timer2);
      return true;
    } catch {
      return false;
    }
  }
}

async function redirectAfterLogin(role, isNewSignup = false) {
  const rootLinks = deriveRootLinks();
  saveRootLinks();

  // Cross-check with saved session to prevent stale role mismatches
  const savedSession = (() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY));
    } catch {
      return null;
    }
  })();
  
  const rawRole = (savedSession?.role || role || "").toUpperCase();
  const staffRoles = ["RECEPTION", "NURSE", "REGISTRAR", "RESIDENT", "INTERN"];
  
  if (staffRoles.includes(rawRole)) {
    const isLocalSession = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    // For local dev, staff frontend might be on a different port, e.g. 5175
    const staffBase = isLocalSession ? "http://localhost:5175/" : new URL("/staff-frontend/", window.location.href).href;
    const url = new URL(staffBase);
    const sessionData = localStorage.getItem(AUTH_SESSION_KEY);
    if (sessionData) {
      url.searchParams.set("session", sessionData);
    }
    window.location.href = url.toString();
    return;
  }

  const effectiveRole = rawRole === "DOCTOR" ? "doctor" : "patient";

  if (effectiveRole === "doctor") {
    const isLocalSession =
      window.location.protocol === "file:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const sessionData = localStorage.getItem(AUTH_SESSION_KEY);
    const doctorUrl = new URL(`${DOCTOR_FRONTEND_URL}/`);
    doctorUrl.searchParams.set("localSession", String(isLocalSession));
    if (sessionData) {
      doctorUrl.searchParams.set("session", sessionData);
    }

    if (isLocalSession) {
      const ready = await isDoctorFrontendReady();
      if (!ready) {
        window.location.href = rootLinks.doctorLaunch;
        return;
      }
    }
    window.location.href = doctorUrl.toString();
    return;
  }
  if (effectiveRole === "patient") {
    if (isNewSignup) {
      window.location.href = new URL("./meiosis-setup.html", window.location.href).href;
      return;
    }

    const isLocalSession =
      window.location.protocol === "file:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Patient pathing... Check radio toggle if it exists
    let targetBase = isLocalSession ? "http://localhost:5174/" : new URL("/patient-frontend/", window.location.href).href;
    
    const modeRadio = document.querySelector('input[name="patientWorkspaceMode"]:checked');
    const useClassicHtml = modeRadio && modeRadio.value === "html";

    if (useClassicHtml) {
      window.location.href = new URL("./patient.html", window.location.href).href;
      return;
    }

    // Default to Vite App
    const url = new URL(targetBase);
    const sessionData = localStorage.getItem(AUTH_SESSION_KEY);
    if (sessionData) {
      url.searchParams.set("session", sessionData);
    }
    
    console.log("[Meiosis] Redirecting patient to:", url.toString());
    window.location.href = url.toString();
    return;
  }
}

async function apiPost(path, body) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await response.text();
    if (
      response.status === 401 &&
      /authentication required/i.test(text) &&
      /vercel/i.test(text)
    ) {
      throw new Error(
        "Vercel Deployment Protection is blocking the backend API. Disable protection for this deployment or open it with a valid Vercel bypass session.",
      );
    }

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(
        response.ok
          ? "Backend returned an unreadable response."
          : `Backend request failed with HTTP ${response.status}.`,
      );
    }

    if (!response.ok) throw new Error(data?.error || "Request failed.");
    backendReachable = true;
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      backendReachable = false;
      throw new Error(
        "Unable to reach the backend right now. Please wait a moment and try again.",
      );
    }
    throw error;
  }
}

async function checkBackendHealth() {
  const badge = document.getElementById("authBackendStatus");
  if (!badge) return;

  badge.className = "auth-backend-pill auth-backend-pill-pending";
  badge.textContent = "Checking backend...";

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(`${BACKEND_ORIGIN}/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      const bodyText = await response.clone().text().catch(() => "");
      if (
        response.status === 401 &&
        /authentication required/i.test(bodyText) &&
        /vercel/i.test(bodyText)
      ) {
        badge.className = "auth-backend-pill auth-backend-pill-offline";
        badge.textContent =
          "Vercel Deployment Protection is blocking the backend API.";
        return;
      }

      if (!response.ok)
        throw new Error(`Health endpoint failed with ${response.status}`);
      const health = bodyText ? JSON.parse(bodyText) : null;
      backendReachable = true;
      badge.className =
        health?.database === "degraded"
          ? "auth-backend-pill auth-backend-pill-pending"
          : "auth-backend-pill auth-backend-pill-online";
      badge.textContent =
        health?.database === "degraded"
          ? `Backend reachable, but database is unavailable at the moment.`
          : `Backend connected at ${BACKEND_ORIGIN}`;
      return;
    } catch (_error) {
      clearTimeout(timer);
      backendReachable = false;
      if (attempt < 4) {
        badge.className = "auth-backend-pill auth-backend-pill-pending";
        badge.textContent = `Checking backend... (${attempt + 1}/4)`;
        await delay(1200);
        continue;
      }
    }
  }

  badge.className = "auth-backend-pill auth-backend-pill-offline";
  badge.textContent =
    "Backend is taking longer to respond. You can still try logging in.";
}

function setMessage(target, text, kind = "error") {
  if (!target) return;
  target.className = kind === "success" ? "auth-success" : "auth-error";
  target.textContent = text;
  target.hidden = !text;
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("loginMessage");
    setMessage(message, "");

    const identifier = document
      .getElementById("loginIdentifier")
      ?.value?.trim();
    const password = document.getElementById("loginPassword")?.value || "";

    try {
      const result = await apiPost("/auth/login", { identifier, password });
      saveSession(result.user, result.token);
      setMessage(message, "Login successful. Redirecting...", "success");
      setTimeout(() => {
        redirectAfterLogin(result.redirect);
      }, 350);
    } catch (error) {
      setMessage(message, error.message || "Unable to login.");
    }
  });
}

saveRootLinks();
checkBackendHealth();
window.addEventListener("focus", () => {
  checkBackendHealth();
});

const signupForm = document.getElementById("signupForm");
if (signupForm) {
  const roleInput = document.getElementById("signupRole");
  const stepInput = document.getElementById("signupStep");
  const roleStepLabel = document.getElementById("signupRoleStepLabel");
  const stepHeading = document.getElementById("signupStepHeading");
  const backBtn = document.getElementById("signupBackBtn");
  const nextBtn = document.getElementById("signupNextBtn");
  const submitBtn = document.getElementById("signupSubmitBtn");
  const stepPanels = Array.from(document.querySelectorAll("[data-step-panel]"));

  const getStep = () => Number(stepInput?.value || "1");
  const getRole = () => roleInput?.value || "";

  const HEADINGS = {
    1: "Who are you?",
    2: "Account details",
    PATIENT_3: "Your health profile",
    DOCTOR_3: "Your medical profile",
  };

  const renderStep = () => {
    const step = getStep();
    const role = getRole();

    // Heading
    if (stepHeading) {
      stepHeading.textContent =
        step === 3
          ? role === "DOCTOR"
            ? HEADINGS.DOCTOR_3
            : HEADINGS.PATIENT_3
          : HEADINGS[step];
    }

    // Profile step label
    if (roleStepLabel)
      roleStepLabel.textContent =
        role === "DOCTOR" ? "Doctor Profile" : "Patient Profile";

    // Role badge (steps 2+)
    const roleBadge = document.getElementById("signupSelectedRole");
    if (roleBadge) {
      roleBadge.hidden = !(step > 1 && role);
      if (step > 1 && role) {
        roleBadge.textContent =
          role === "DOCTOR"
            ? "🩺 Signing up as Doctor"
            : "🧑‍⚕️ Signing up as Patient";
        roleBadge.className = `signup-role-badge signup-role-badge-${role.toLowerCase()}`;
      }
    }

    // Progress dots
    document.querySelectorAll("[data-step-dot]").forEach((dot) => {
      const n = Number(dot.getAttribute("data-step-dot"));
      dot.classList.remove("dot-active", "dot-done");
      const span = dot.querySelector("span");
      if (n < step) {
        dot.classList.add("dot-done");
        if (span) span.textContent = "✓";
      } else {
        if (span) span.textContent = String(n);
        if (n === step) dot.classList.add("dot-active");
      }
    });

    // Connecting lines
    const line1 = document.getElementById("stepLine1");
    const line2 = document.getElementById("stepLine2");
    if (line1) line1.classList.toggle("step-line-done", step >= 2);
    if (line2) line2.classList.toggle("step-line-done", step >= 3);

    // For patients: hide the 3rd step dot + connector (no profile step)
    const profileStepItems = signupForm.querySelectorAll(".signup-step-item");
    const profileStepItem = profileStepItems[profileStepItems.length - 1];
    if (profileStepItem) profileStepItem.hidden = role === "PATIENT";
    if (line2) line2.hidden = role === "PATIENT";

    // Panels — show with slide-in animation
    stepPanels.forEach((panel) => {
      const panelStep = Number(panel.getAttribute("data-step-panel"));
      let shouldShow;
      if (panel.id === "patientSignupFields") {
        shouldShow = false; // patients skip step 3
      } else if (panel.id === "doctorSignupFields") {
        shouldShow = role === "DOCTOR" && step === 3;
      } else {
        shouldShow = panelStep === step;
      }
      if (shouldShow && panel.hidden) {
        panel.hidden = false;
        panel.classList.remove("panel-enter");
        void panel.offsetWidth; // force reflow to restart animation
        panel.classList.add("panel-enter");
      } else if (!shouldShow) {
        panel.hidden = true;
        panel.classList.remove("panel-enter");
      }
    });

    // Buttons
    // Step 1: show Continue when a role is selected
    // Step 2: Doctors get Continue (→ step 3), Patients get Submit directly
    // Step 3: Doctors get Submit
    if (backBtn) backBtn.hidden = step === 1;
    if (nextBtn)
      nextBtn.hidden = !(
        (step === 1 && !!role) ||
        (step === 2 && role === "DOCTOR")
      );
    if (submitBtn)
      submitBtn.hidden = !(step === 3 || (step === 2 && role === "PATIENT"));
  };

  // Role card click → select role and show Continue button (don't auto-advance)
  document.querySelectorAll(".role-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (roleInput) roleInput.value = card.getAttribute("data-role") || "";
      document
        .querySelectorAll(".role-card")
        .forEach((c) => c.classList.remove("role-card-active"));
      card.classList.add("role-card-active");
      renderStep();
    });
  });

  // Password show/hide toggle
  const pwToggle = document.getElementById("signupPwToggle");
  const pwInput = document.getElementById("signupPassword");
  const pwShow = document.getElementById("pwIconShow");
  const pwHide = document.getElementById("pwIconHide");
  pwToggle?.addEventListener("click", () => {
    const isPassword = pwInput.type === "password";
    pwInput.type = isPassword ? "text" : "password";
    if (pwShow) pwShow.style.display = isPassword ? "none" : "";
    if (pwHide) pwHide.style.display = isPassword ? "" : "none";
    pwToggle.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password",
    );
  });

  const validateStep2 = () => {
    for (const id of ["signupName", "signupEmail", "signupPassword"]) {
      const field = document.getElementById(id);
      if (!field?.value?.trim()) {
        field?.focus();
        return false;
      }
    }
    return true;
  };

  nextBtn?.addEventListener("click", () => {
    const message = document.getElementById("signupMessage");
    setMessage(message, "");
    const step = getStep();
    if (step === 1) {
      if (!getRole()) {
        setMessage(message, "Please select a role first.");
        return;
      }
      if (stepInput) stepInput.value = "2";
      renderStep();
      return;
    }
    if (!validateStep2()) {
      setMessage(message, "Please fill in your name, email and password.");
      return;
    }
    if (stepInput) stepInput.value = "3";
    renderStep();
  });

  backBtn?.addEventListener("click", () => {
    if (stepInput) stepInput.value = String(getStep() - 1);
    renderStep();
  });

  renderStep();

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("signupMessage");
    setMessage(message, "");

    const role = getRole();
    if (!role) {
      setMessage(message, "Please select a role first.");
      return;
    }
    if (!validateStep2()) {
      setMessage(message, "Please complete the account details.");
      return;
    }

    const v = (id) => document.getElementById(id)?.value?.trim() || "";
    const payload = {
      role,
      name: v("signupName"),
      email: v("signupEmail"),
      password: document.getElementById("signupPassword")?.value || "",
      phone: v("signupPhone"),
      // Doctor-only fields
      specialty: v("signupSpecialty"),
      qualification: v("signupQualification"),
      registrationNumber: v("signupRegistrationNumber"),
      yearsExperience: v("signupYearsExperience"),
      hospital: v("signupHospital"),
      consultFee: v("signupConsultFee"),
      clinicAddress: v("signupClinicAddress"),
      // Patient-only fields
      bloodGroup: v("signupBloodGroup"),
      dob: v("signupDob"),
      emergencyContact: v("signupEmergencyContact"),
      insurancePlan: v("signupInsurancePlan"),
      healthGoal: v("signupHealthGoal"),
      address: v("signupAddress"),
    };

    console.log("[signup] submitting payload role:", payload.role);
    try {
      const result = await apiPost("/auth/signup", payload);
      console.log(
        "[signup] result:",
        result.redirect,
        result.user?.role,
        result.user?.meiosisId,
      );
      saveSession(result.user, result.token);
      setMessage(
        message,
        `Signup successful. Role: ${result.user.role} | ID: ${result.user.meiosisId} | Redirect: ${result.redirect}`,
        "success",
      );
      setTimeout(() => redirectAfterLogin(result.redirect, true), 500);
    } catch (error) {
      setMessage(message, error.message || "Unable to sign up.");
    }
  });
}
