/* ═══════════════════════════════════════════════════════════════════════════
   MEIOSIS — Progressive Signup Engine
   Standalone script for signup.html.  Does NOT depend on auth.js.
═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── Constants ──────────────────────────────────────────────────────────── */
const runtimeConfig = window.MEIOSIS_RUNTIME_CONFIG || {};
const API          = String(runtimeConfig.backendOrigin || 'http://localhost:5000').replace(/\/+$/, '') + '/api';
const SESSION_KEY  = 'meiosis_auth_session_v1';
const LINKS_KEY    = 'meiosis_root_links_v1';
const DRAFT_KEY    = 'meiosis_signup_draft_v3';

/* ── Specialties list ───────────────────────────────────────────────────── */
const SPECIALTIES = [
  'General Medicine', 'General Surgery', 'Cardiology', 'Dermatology',
  'Endocrinology', 'Gastroenterology', 'Gynecology & Obstetrics',
  'Hematology', 'Nephrology', 'Neurology', 'Oncology', 'Ophthalmology',
  'Orthopedics', 'Otolaryngology (ENT)', 'Pediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Rheumatology', 'Sports Medicine',
  'Urology', 'Anesthesiology', 'Emergency Medicine', 'Pathology'
];

/* ── Common health conditions for multi-select ──────────────────────────── */
const CONDITIONS = [
  'Hypertension', 'Type 2 Diabetes', 'Type 1 Diabetes', 'Asthma',
  'Heart Disease', 'Chronic Kidney Disease', 'Thyroid Disorder',
  'Arthritis', 'COPD', 'Depression / Anxiety', 'Migraine', 'Obesity',
  'Anemia', 'Epilepsy', 'High Cholesterol', 'Osteoporosis', 'Sleep Apnea'
];

/* ── Mutable state ──────────────────────────────────────────────────────── */
const state = {
  role:            null,      // 'PATIENT' | 'DOCTOR'
  stepIndex:       0,
  data:            {},        // accumulated field values
  emailStatus:     null,      // 'checking' | 'available' | 'taken'
  backendOnline:   false,
  submitting:      false,
  error:           null,
};

/* ─────────────────────────────────────────────────────────────────────────
   STEP DEFINITIONS
   Each step has: id, type, and display metadata.
   Common steps are shared; role-specific steps branch after step 4.
───────────────────────────────────────────────────────────────────────── */
const COMMON_STEPS = [
  {
    id: 'role',
    type: 'role-select',
  },
  {
    id: 'name',
    type: 'text',
    label: 'What\'s your full name?',
    placeholder: 'e.g. Rahul Sharma or Dr. Priya Nair',
    hint: 'This appears on your prescriptions and patient records.',
    autocomplete: 'name',
    required: true,
  },
  {
    id: 'email',
    type: 'email',
    label: 'What\'s your email address?',
    placeholder: 'you@example.com',
    hint: 'This is your login. We\'ll never spam you.',
    autocomplete: 'email',
    required: true,
  },
  {
    id: 'password',
    type: 'password',
    label: 'Create a strong password',
    hint: 'At least 8 characters. Mix letters, numbers, and symbols for best security.',
    required: true,
  },
  {
    id: 'confirmPassword',
    type: 'confirm-password',
    label: 'Confirm your password',
    hint: 'Re-enter the password to make sure it matches.',
    required: true,
  },
];

const PATIENT_STEPS = [
  {
    id: 'dob',
    type: 'date',
    label: 'When were you born?',
    hint: 'Helps doctors understand age-related health context.',
    optional: true,
  },
  {
    id: 'gender',
    type: 'chips',
    label: 'How do you identify?',
    hint: 'Used for personalised health recommendations. Completely optional.',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
    optional: true,
  },
  {
    id: 'bloodGroup',
    type: 'chips',
    label: 'What\'s your blood group?',
    hint: 'Critical information for emergencies. Skip if you\'re unsure.',
    options: ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Unknown'],
    optional: true,
  },
  {
    id: 'conditions',
    type: 'multi-chips',
    label: 'Any existing health conditions?',
    hint: 'Helps your doctor prepare before your first visit. Select all that apply.',
    options: CONDITIONS,
    optional: true,
  },
  {
    id: 'emergencyContact',
    type: 'text',
    label: 'Who should we call in an emergency?',
    placeholder: 'Name and phone number',
    hint: 'Completely optional — you can add this later from your dashboard.',
    optional: true,
  },
  {
    id: 'consent',
    type: 'final-patient',
  },
];

const DOCTOR_STEPS = [
  {
    id: 'specialty',
    type: 'search-select',
    label: 'What is your medical specialization?',
    placeholder: 'Search specialties...',
    hint: 'Start typing to filter the list. Select your primary specialty.',
    options: SPECIALTIES,
    required: true,
  },
  {
    id: 'qualification',
    type: 'text',
    label: 'Your highest medical qualification?',
    placeholder: 'MBBS, MD, DM, MS, DNB…',
    hint: 'Shown on prescriptions and your public doctor profile.',
    required: true,
  },
  {
    id: 'registrationNumber',
    type: 'text',
    label: 'Medical council registration number',
    placeholder: 'State or national medical council reg. no.',
    hint: 'Optional now — needed for full verification later.',
    optional: true,
  },
  {
    id: 'yearsExperience',
    type: 'number',
    label: 'Years of clinical experience?',
    placeholder: 'e.g. 8',
    hint: 'Total years of post-qualification clinical practice.',
    required: true,
  },
  {
    id: 'hospital',
    type: 'text',
    label: 'Hospital or clinic you practice at?',
    placeholder: 'Apollo Hospital, Private Clinic, AIIMS…',
    hint: 'Your primary place of work shown to patients.',
    required: true,
  },
  {
    id: 'consultFee',
    type: 'number',
    label: 'Consultation fee (₹)?',
    placeholder: 'e.g. 800',
    hint: 'The fee patients pay per consultation. You can update this anytime.',
    required: true,
  },
  {
    id: 'consultMode',
    type: 'chips',
    label: 'How do you see patients?',
    hint: 'Choose your preferred consultation mode.',
    options: ['In-person', 'Online', 'Both'],
    required: true,
  },
  {
    id: 'agreement',
    type: 'final-doctor',
  },
];

/* ── Computed step list based on current role ───────────────────────────── */
function getSteps() {
  if (!state.role) return COMMON_STEPS;
  const extra = state.role === 'DOCTOR' ? DOCTOR_STEPS : PATIENT_STEPS;
  return [...COMMON_STEPS, ...extra];
}

function currentStep() {
  return getSteps()[state.stepIndex];
}

function totalSteps() {
  return getSteps().length;
}

function isFinalStep(step) {
  return step.type === 'final-patient' || step.type === 'final-doctor';
}

/* ─────────────────────────────────────────────────────────────────────────
   SESSION STORAGE DRAFT — survives refresh mid-flow
───────────────────────────────────────────────────────────────────────── */
function saveDraft() {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      role:      state.role,
      stepIndex: state.stepIndex,
      data:      state.data,
    }));
  } catch { /* storage unavailable — non-fatal */ }
}

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (draft.role)                         state.role      = draft.role;
    if (typeof draft.stepIndex === 'number') state.stepIndex = draft.stepIndex;
    if (draft.data && typeof draft.data === 'object') state.data = draft.data;
    /* Clamp stepIndex — prevents crash if saved draft is from an older code version */
    const steps = getSteps();
    if (state.stepIndex >= steps.length) state.stepIndex = 0;
  } catch { /* corrupt draft — ignore */ }
}

function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
}

/* ─────────────────────────────────────────────────────────────────────────
   BACKEND HELPERS
───────────────────────────────────────────────────────────────────────── */
async function checkBackend() {
  try {
    const res = await fetch(`${API.replace('/api', '')}/health`, { cache: 'no-store' });
    state.backendOnline = res.ok;
  } catch {
    state.backendOnline = false;
  }
}

let _emailDebounce = null;

async function checkEmailAvailability(email) {
  state.emailStatus = 'checking';
  renderEmailBadge();
  try {
    const res = await fetch(`${API}/auth/check-email?email=${encodeURIComponent(email)}`);
    if (!res.ok) { state.emailStatus = null; renderEmailBadge(); return; }
    const data = await res.json();
    state.emailStatus = data.available ? 'available' : 'taken';
  } catch {
    state.emailStatus = null;
  }
  renderEmailBadge();
}

function renderEmailBadge() {
  const el = document.getElementById('ob-email-badge');
  if (!el) return;
  el.className = 'ob-email-badge';
  if (!state.emailStatus) { el.style.display = 'none'; return; }
  el.classList.add(state.emailStatus);
  const labels = {
    checking:  '• Checking availability…',
    available: '✓ Email is available',
    taken:     '✕ Already registered — try logging in instead',
  };
  el.innerHTML = `<span class="ob-dot"></span>${escHtml(labels[state.emailStatus] || '')}`;
}

/* ─────────────────────────────────────────────────────────────────────────
   RENDER ENGINE
───────────────────────────────────────────────────────────────────────── */
function render(animClass = 'ob-anim-fwd') {
  const step      = currentStep();
  /* Safety: if step is undefined (e.g. stale draft), reset to step 0 */
  if (!step) { state.stepIndex = 0; render(animClass); return; }
  const total     = totalSteps();
  const pct       = Math.round(((state.stepIndex + 1) / total) * 100);
  const isPatient = state.role === 'PATIENT';
  const isDoctor  = state.role === 'DOCTOR';
  const final     = isFinalStep(step);

  /* Progress bar */
  const progressEl = document.getElementById('ob-progress');
  if (progressEl) progressEl.style.width = `${pct}%`;

  /* Step label */
  const labelEl = document.getElementById('ob-step-label');
  if (labelEl) labelEl.textContent = state.stepIndex > 0
    ? `Step ${state.stepIndex} of ${total - 1}`
    : '';

  /* Back button */
  const backBtn = document.getElementById('ob-back');
  if (backBtn) backBtn.style.visibility = state.stepIndex > 0 ? 'visible' : 'hidden';

  /* Skip button */
  const skipBtn = document.getElementById('ob-skip');
  if (skipBtn) skipBtn.style.display = (step.optional && !final) ? 'inline' : 'none';

  /* Next button */
  const nextBtn = document.getElementById('ob-next');
  if (nextBtn) {
    nextBtn.classList.toggle('mode-doctor', isDoctor);
    nextBtn.disabled = state.submitting || (step.type === 'role-select' && !state.role);

    if (state.submitting) {
      nextBtn.innerHTML = '<span class="ob-spinner"></span>';
    } else if (final) {
      nextBtn.textContent = 'Create Account →';
    } else if (step.type === 'role-select') {
      nextBtn.textContent = state.role ? 'Continue →' : 'Choose a role first';
    } else {
      nextBtn.textContent = 'Continue →';
    }
  }

  /* Render step HTML into container */
  const container = document.getElementById('ob-step-container');
  if (!container) return;
  const wrapper   = document.createElement('div');
  if (animClass) wrapper.className = animClass;
  wrapper.innerHTML = buildStepHTML(step, isPatient, isDoctor);
  container.innerHTML = '';
  container.appendChild(wrapper);

  /* Post-render: attach behaviour */
  attachStepBehaviour(step);
}

/* ─────────────────────────────────────────────────────────────────────────
   HTML BUILDERS
───────────────────────────────────────────────────────────────────────── */
function buildStepHTML(step, isPatient, isDoctor) {
  if (step.type === 'role-select')   return buildRoleSelect();
  if (step.type === 'final-patient') return buildFinalPatient();
  if (step.type === 'final-doctor')  return buildFinalDoctor();

  const kicker = isDoctor ? 'Doctor Setup' : (isPatient ? 'Patient Setup' : 'Account Setup');
  const optTag = step.optional ? '<span class="ob-optional-tag">optional</span>' : '';
  const val    = state.data[step.id] ?? '';

  let inputHTML = '';

  if (step.type === 'text' || step.type === 'email') {
    inputHTML = `
      <div class="ob-input-wrap">
        <input
          id="ob-input" class="ob-input"
          type="${step.type}"
          placeholder="${escAttr(step.placeholder || '')}"
          value="${escAttr(String(val))}"
          autocomplete="${escAttr(step.autocomplete || 'off')}"
        />
      </div>
      ${step.type === 'email' ? '<div id="ob-email-badge" class="ob-email-badge" style="display:none"></div>' : ''}
    `;
  } else if (step.type === 'number') {
    inputHTML = `
      <div class="ob-input-wrap">
        <input
          id="ob-input" class="ob-input"
          type="number" min="0"
          placeholder="${escAttr(step.placeholder || '')}"
          value="${escAttr(String(val))}"
          autocomplete="off"
        />
      </div>
    `;
  } else if (step.type === 'password') {
    inputHTML = `
      <div class="ob-input-wrap">
        <input id="ob-input" class="ob-input with-toggle"
          type="password" autocomplete="new-password"
          placeholder="••••••••"
        />
        <button type="button" class="ob-pw-toggle" id="ob-pw-toggle" aria-label="Show password">
          ${iconEye()}
        </button>
      </div>
      <div class="ob-pw-strength">
        <div class="ob-pw-bar" id="ob-bar-1"></div>
        <div class="ob-pw-bar" id="ob-bar-2"></div>
        <div class="ob-pw-bar" id="ob-bar-3"></div>
        <div class="ob-pw-bar" id="ob-bar-4"></div>
      </div>
      <p class="ob-pw-hint" id="ob-pw-hint">Choose a password to get started</p>
    `;
  } else if (step.type === 'confirm-password') {
    inputHTML = `
      <div class="ob-input-wrap">
        <input id="ob-input" class="ob-input with-toggle"
          type="password" autocomplete="new-password"
          placeholder="••••••••"
        />
        <button type="button" class="ob-pw-toggle" id="ob-pw-toggle" aria-label="Show password">
          ${iconEye()}
        </button>
      </div>
    `;
  } else if (step.type === 'date') {
    const today = new Date().toISOString().slice(0, 10);
    inputHTML = `
      <div class="ob-input-wrap">
        <input id="ob-input" class="ob-input"
          type="date"
          value="${escAttr(String(val))}"
          max="${today}"
        />
      </div>
    `;
  } else if (step.type === 'chips') {
    const sel  = state.data[step.id] || '';
    const cls  = isDoctor ? 'sel-doctor' : 'sel-patient';
    inputHTML = `
      <div class="ob-chips" id="ob-chips">
        ${step.options.map(opt => `
          <button type="button" class="ob-chip${sel === opt ? ' ' + cls : ''}"
            data-val="${escAttr(opt)}">${escHtml(opt)}</button>
        `).join('')}
      </div>
    `;
  } else if (step.type === 'multi-chips') {
    const sel  = Array.isArray(state.data[step.id]) ? state.data[step.id] : [];
    const cls  = isDoctor ? 'sel-doctor' : 'sel-patient';
    inputHTML = `
      <div class="ob-chips" id="ob-chips" style="max-height:260px;overflow-y:auto;">
        ${step.options.map(opt => `
          <button type="button" class="ob-chip${sel.includes(opt) ? ' ' + cls : ''}"
            data-val="${escAttr(opt)}">${escHtml(opt)}</button>
        `).join('')}
      </div>
    `;
  } else if (step.type === 'search-select') {
    inputHTML = `
      <div class="ob-dropdown-wrap">
        <input id="ob-input" class="ob-input"
          type="text" autocomplete="off"
          placeholder="${escAttr(step.placeholder || 'Search…')}"
          value="${escAttr(String(val))}"
        />
        <div id="ob-dropdown" class="ob-dropdown" style="display:none"></div>
      </div>
    `;
  }

  const errorHTML = state.error
    ? `<div class="ob-error-msg">⚠ ${escHtml(state.error)}</div>`
    : '';

  return `
    <div class="ob-question">
      <p class="ob-q-kicker">${escHtml(kicker)}</p>
      <h2 class="ob-q-title">${escHtml(step.label || '')}${optTag}</h2>
      ${step.hint ? `<p class="ob-q-sub">${escHtml(step.hint)}</p>` : ''}
    </div>
    ${inputHTML}
    ${errorHTML}
  `;
}

function buildRoleSelect() {
  const patSel = state.role === 'PATIENT';
  const docSel = state.role === 'DOCTOR';
  return `
    <div class="ob-question">
      <p class="ob-q-kicker">Getting Started</p>
      <h2 class="ob-q-title">How will you use MEIOSIS?</h2>
      <p class="ob-q-sub">
        Choose your role — this shapes your entire experience.
        You can't switch roles without creating a new account.
      </p>
    </div>
    <div class="ob-role-grid">
      <button type="button" class="ob-role-card${patSel ? ' sel-patient' : ''}" data-role="PATIENT">
        <div class="ob-role-icon">🧑‍⚕️</div>
        <div class="ob-role-title">I'm a Patient</div>
        <div class="ob-role-desc">
          Book appointments, track prescriptions, view lab reports,
          and manage your complete health record.
        </div>
      </button>
      <button type="button" class="ob-role-card${docSel ? ' sel-doctor' : ''}" data-role="DOCTOR">
        <div class="ob-role-icon">🩺</div>
        <div class="ob-role-title">I'm a Doctor</div>
        <div class="ob-role-desc">
          Manage patient queues, build EMRs, view clinical timelines,
          and run your clinic schedule.
        </div>
      </button>
    </div>
    <p style="text-align:center;font-size:0.83rem;color:rgba(255,255,255,0.3);margin-top:16px;">
      Select a role to continue
    </p>
    ${state.error ? `<div class="ob-error-msg" style="margin-top:12px;">⚠ ${escHtml(state.error)}</div>` : ''}
  `;
}

function buildFinalPatient() {
  const d = state.data;
  const rows = [
    { k: 'Role',              v: 'Patient' },
    { k: 'Name',              v: d.name },
    { k: 'Email',             v: d.email },
    d.dob              ? { k: 'Date of Birth',    v: d.dob }               : null,
    d.gender           ? { k: 'Gender',            v: d.gender }            : null,
    d.bloodGroup       ? { k: 'Blood Group',       v: d.bloodGroup }        : null,
    Array.isArray(d.conditions) && d.conditions.length
                       ? { k: 'Conditions',        v: d.conditions.join(', ') } : null,
    d.emergencyContact ? { k: 'Emergency Contact', v: d.emergencyContact }  : null,
  ].filter(Boolean);

  return `
    <div class="ob-question">
      <p class="ob-q-kicker">Almost There</p>
      <h2 class="ob-q-title">Review your details</h2>
      <p class="ob-q-sub">Check everything looks right. You can always update your profile from your dashboard later.</p>
    </div>
    <div class="ob-summary">
      ${rows.map(r => `
        <div class="ob-summary-row">
          <span class="ob-summary-key">${escHtml(r.k)}</span>
          <span class="ob-summary-val">${escHtml(r.v || '—')}</span>
        </div>
      `).join('')}
    </div>
    <label class="ob-consent-label">
      <input type="checkbox" id="ob-consent" ${state.data.consent ? 'checked' : ''} />
      <span class="ob-consent-text">
        I agree to MEIOSIS <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        I understand my health data will be stored securely and used only to provide medical services.
      </span>
    </label>
    ${state.error ? `<div class="ob-error-msg">⚠ ${escHtml(state.error)}</div>` : ''}
  `;
}

function buildFinalDoctor() {
  const d = state.data;
  const rows = [
    { k: 'Role',         v: 'Doctor' },
    { k: 'Name',         v: d.name },
    { k: 'Email',        v: d.email },
    { k: 'Specialty',    v: d.specialty },
    { k: 'Qualification',v: d.qualification },
    d.registrationNumber ? { k: 'Reg. Number', v: d.registrationNumber }          : null,
    { k: 'Experience',   v: d.yearsExperience ? `${d.yearsExperience} years` : '—' },
    { k: 'Hospital',     v: d.hospital },
    { k: 'Consult Fee',  v: d.consultFee ? `₹${d.consultFee}` : '—' },
    { k: 'Mode',         v: d.consultMode },
  ].filter(Boolean);

  return `
    <div class="ob-question">
      <p class="ob-q-kicker">Almost There</p>
      <h2 class="ob-q-title">Review your details</h2>
      <p class="ob-q-sub">You can update your professional profile anytime from the doctor dashboard.</p>
    </div>
    <div class="ob-summary">
      ${rows.map(r => `
        <div class="ob-summary-row">
          <span class="ob-summary-key">${escHtml(r.k)}</span>
          <span class="ob-summary-val">${escHtml(r.v || '—')}</span>
        </div>
      `).join('')}
    </div>
    <label class="ob-consent-label">
      <input type="checkbox" id="ob-consent" ${state.data.agreement ? 'checked' : ''} />
      <span class="ob-consent-text">
        I agree to MEIOSIS <a href="#">Terms of Service</a>, <a href="#">Privacy Policy</a>,
        and <a href="#">Doctor Code of Conduct</a>.
        I confirm all information I've provided is accurate and I am a licensed medical professional.
      </span>
    </label>
    ${state.error ? `<div class="ob-error-msg">⚠ ${escHtml(state.error)}</div>` : ''}
  `;
}

function renderSuccess(user) {
  clearDraft();

  /* Hide nav */
  const nav = document.getElementById('ob-nav');
  if (nav) nav.style.display = 'none';

  const progressEl = document.getElementById('ob-progress');
  if (progressEl) progressEl.style.width = '100%';

  const labelEl = document.getElementById('ob-step-label');
  if (labelEl) labelEl.textContent = '';

  const role = user.role || state.role;
  const dest = role === 'DOCTOR' ? 'Doctor Console' : 'Patient Dashboard';

  const container = document.getElementById('ob-step-container');
  container.innerHTML = `
    <div class="ob-success ob-anim-pop">
      <div class="ob-success-ring">✓</div>
      <h2 class="ob-success-title">Welcome to MEIOSIS!</h2>
      <p class="ob-success-sub">
        Your account has been created. Save your MEIOSIS ID below —
        you can use it alongside your email to log in from any device.
      </p>
      <div class="ob-id-badge">🆔 ${escHtml(user.meiosisId || '')}</div>
      <p class="ob-success-redirect" id="ob-redirect-msg">
        Redirecting to your ${escHtml(dest)} in 3 seconds…
      </p>
      <button class="ob-success-btn" onclick="doRedirect(${JSON.stringify(role)})">
        Go to ${escHtml(dest)} →
      </button>
    </div>
  `;

  /* Countdown */
  let secs = 3;
  const msgEl = document.getElementById('ob-redirect-msg');
  const timer = setInterval(() => {
    secs--;
    if (msgEl) msgEl.textContent = `Redirecting to your ${dest} in ${secs} second${secs !== 1 ? 's' : ''}…`;
    if (secs <= 0) { clearInterval(timer); doRedirect(role); }
  }, 1000);
}

/* ─────────────────────────────────────────────────────────────────────────
   STEP BEHAVIOUR — event listeners attached after each render
───────────────────────────────────────────────────────────────────────── */
function attachStepBehaviour(step) {
  state.error = null;

  /* Role cards */
  if (step.type === 'role-select') {
    document.querySelectorAll('.ob-role-card').forEach(card => {
      card.addEventListener('click', () => {
        const role = card.getAttribute('data-role');
        const prevRole = state.role;
        state.role = role;

        /* Reset collected data if role changes */
        if (prevRole && prevRole !== role) {
          const keysToKeep = ['name', 'email', 'password', 'confirmPassword'];
          const fresh = {};
          keysToKeep.forEach(k => { if (state.data[k]) fresh[k] = state.data[k]; });
          state.data = fresh;
        }

        /* Update UI without full re-render to keep animation smooth */
        document.querySelectorAll('.ob-role-card').forEach(c => {
          c.classList.remove('sel-patient', 'sel-doctor');
        });
        card.classList.add(role === 'PATIENT' ? 'sel-patient' : 'sel-doctor');

        const nextBtn = document.getElementById('ob-next');
        if (nextBtn) {
          nextBtn.disabled = false;
          nextBtn.textContent = 'Continue →';
          nextBtn.classList.toggle('mode-doctor', role === 'DOCTOR');
        }
        saveDraft();
      });
    });
    return;
  }

  /* ── Auto-focus primary input ── */
  const input = document.getElementById('ob-input');
  if (input) {
    setTimeout(() => input.focus(), 60);

    /* Enter = next (except for date, which uses native browser UX) */
    if (step.type !== 'date') {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); handleNext(); }
      });
    }

    /* Persist value */
    input.addEventListener('input', () => {
      const raw = input.value;
      state.data[step.id] = step.type === 'number' && raw !== '' ? Number(raw) : raw;
      saveDraft();

      if (step.type === 'email') scheduleEmailCheck(raw);
      if (step.type === 'password') updatePasswordStrength(raw);
    });

    /* Date change */
    if (step.type === 'date') {
      input.addEventListener('change', () => {
        state.data[step.id] = input.value;
        saveDraft();
      });
    }
  }

  /* ── Password show/hide toggle ── */
  document.getElementById('ob-pw-toggle')?.addEventListener('click', () => {
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  /* ── Single-select chips ── */
  if (step.type === 'chips') {
    const selClass = state.role === 'DOCTOR' ? 'sel-doctor' : 'sel-patient';
    document.querySelectorAll('#ob-chips .ob-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#ob-chips .ob-chip').forEach(c => {
          c.classList.remove('sel-patient', 'sel-doctor');
        });
        chip.classList.add(selClass);
        state.data[step.id] = chip.getAttribute('data-val');
        saveDraft();
      });
    });
  }

  /* ── Multi-select chips ── */
  if (step.type === 'multi-chips') {
    if (!Array.isArray(state.data[step.id])) state.data[step.id] = [];
    const selClass = state.role === 'DOCTOR' ? 'sel-doctor' : 'sel-patient';
    document.querySelectorAll('#ob-chips .ob-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-val');
        const arr = state.data[step.id];
        if (arr.includes(val)) {
          state.data[step.id] = arr.filter(v => v !== val);
          chip.classList.remove('sel-patient', 'sel-doctor');
        } else {
          state.data[step.id] = [...arr, val];
          chip.classList.add(selClass);
        }
        saveDraft();
      });
    });
  }

  /* ── Search-select (specialty) ── */
  if (step.type === 'search-select' && input) {
    const dropdown = document.getElementById('ob-dropdown');
    let kbdIndex = -1;

    function showDropdown(query) {
      if (!dropdown) return;
      const q = query.trim().toLowerCase();
      const matches = q
        ? step.options.filter(o => o.toLowerCase().includes(q)).slice(0, 12)
        : step.options.slice(0, 10);

      if (!matches.length) { dropdown.style.display = 'none'; return; }

      dropdown.style.display = 'block';
      dropdown.innerHTML = matches.map((m, i) =>
        `<div class="ob-dropdown-item" data-val="${escAttr(m)}" data-idx="${i}">${escHtml(m)}</div>`
      ).join('');
      kbdIndex = -1;

      dropdown.querySelectorAll('.ob-dropdown-item').forEach(item => {
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          selectSpecialty(item.getAttribute('data-val'));
        });
      });
    }

    function selectSpecialty(val) {
      input.value = val;
      state.data[step.id] = val;
      dropdown.style.display = 'none';
      kbdIndex = -1;
      saveDraft();
    }

    input.addEventListener('focus', () => showDropdown(input.value));
    input.addEventListener('input', () => {
      state.data[step.id] = input.value;
      showDropdown(input.value);
      saveDraft();
    });
    input.addEventListener('blur', () => {
      setTimeout(() => { if (dropdown) dropdown.style.display = 'none'; }, 200);
    });
    input.addEventListener('keydown', e => {
      const items = dropdown?.querySelectorAll('.ob-dropdown-item');
      if (!items?.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        kbdIndex = Math.min(kbdIndex + 1, items.length - 1);
        updateKbdFocus(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        kbdIndex = Math.max(kbdIndex - 1, 0);
        updateKbdFocus(items);
      } else if (e.key === 'Enter' && kbdIndex >= 0) {
        e.preventDefault();
        selectSpecialty(items[kbdIndex].getAttribute('data-val'));
      }
    });

    function updateKbdFocus(items) {
      items.forEach((el, i) => el.classList.toggle('kbd-focus', i === kbdIndex));
      if (items[kbdIndex]) items[kbdIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  /* ── Consent checkboxes on final steps ── */
  if (isFinalStep(step)) {
    document.getElementById('ob-consent')?.addEventListener('change', e => {
      const key = step.type === 'final-patient' ? 'consent' : 'agreement';
      state.data[key] = e.target.checked;
    });
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   PASSWORD STRENGTH METER
───────────────────────────────────────────────────────────────────────── */
function updatePasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^a-zA-Z0-9]/.test(pw)) score++;

  const levelClass = ['', 'weak', 'weak', 'fair', 'good', 'strong'][Math.min(score + 1, 5)];
  const labels = [
    'Choose a password to get started',
    'Too short — add more characters',
    'Weak — try mixing letters and numbers',
    'Fair — add uppercase letters',
    'Good — getting stronger!',
    'Strong password ✓',
  ];

  for (let i = 1; i <= 4; i++) {
    const bar = document.getElementById(`ob-bar-${i}`);
    if (bar) {
      bar.className = 'ob-pw-bar';
      if (i <= score) bar.classList.add(levelClass);
    }
  }

  const hint = document.getElementById('ob-pw-hint');
  if (hint) hint.textContent = labels[score] || '';
}

/* ─────────────────────────────────────────────────────────────────────────
   EMAIL AVAILABILITY DEBOUNCE
───────────────────────────────────────────────────────────────────────── */
function scheduleEmailCheck(email) {
  clearTimeout(_emailDebounce);
  const trimmed = email.trim();
  if (!trimmed.includes('@') || !trimmed.includes('.')) {
    state.emailStatus = null;
    renderEmailBadge();
    return;
  }
  _emailDebounce = setTimeout(() => checkEmailAvailability(trimmed), 650);
}

/* ─────────────────────────────────────────────────────────────────────────
   VALIDATION
───────────────────────────────────────────────────────────────────────── */
function validateStep() {
  const step = currentStep();
  state.error = null;

  /* Role selection */
  if (step.type === 'role-select') {
    if (!state.role) {
      state.error = 'Please choose a role to continue.';
      return false;
    }
    return true;
  }

  /* Optional steps — always pass */
  if (step.optional) return true;

  /* Final steps — only need consent */
  if (step.type === 'final-patient') {
    if (!state.data.consent) {
      state.error = 'Please agree to the Terms of Service to create your account.';
      return false;
    }
    return true;
  }

  if (step.type === 'final-doctor') {
    if (!state.data.agreement) {
      state.error = 'Please agree to the Terms of Service to create your account.';
      return false;
    }
    return true;
  }

  const val = state.data[step.id];
  const str = String(val ?? '').trim();

  /* Required field is empty */
  if (step.required && !str) {
    const fieldLabel = step.label
      ? step.label.replace(/[?!.]/g, '').trim()
      : step.id;
    state.error = `${fieldLabel} is required.`;
    markInputError();
    return false;
  }

  /* Email format */
  if (step.type === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
      state.error = 'Please enter a valid email address.';
      markInputError();
      return false;
    }
    if (state.emailStatus === 'taken') {
      state.error = 'This email is already registered. Please log in instead.';
      markInputError();
      return false;
    }
    if (state.emailStatus === 'checking') {
      state.error = 'Checking email availability — please wait a moment.';
      return false;
    }
  }

  /* Password length */
  if (step.type === 'password') {
    if (str.length < 8) {
      state.error = 'Password must be at least 8 characters long.';
      markInputError();
      return false;
    }
  }

  /* Confirm password match */
  if (step.type === 'confirm-password') {
    if (str !== String(state.data.password || '')) {
      state.error = 'Passwords don\'t match. Please check and try again.';
      markInputError();
      return false;
    }
  }

  /* Search-select — must be a valid option */
  if (step.type === 'search-select' && step.required) {
    if (!step.options.includes(str)) {
      state.error = 'Please select a valid option from the list.';
      markInputError();
      return false;
    }
  }

  /* Chips — at least one must be selected */
  if (step.type === 'chips' && step.required) {
    if (!state.data[step.id]) {
      state.error = 'Please select one of the options above.';
      return false;
    }
  }

  /* Number — must be positive */
  if (step.type === 'number' && step.required) {
    const num = Number(val);
    if (isNaN(num) || num < 0) {
      state.error = 'Please enter a valid number.';
      markInputError();
      return false;
    }
  }

  return true;
}

function markInputError() {
  const input = document.getElementById('ob-input');
  if (input) {
    input.classList.add('ob-err');
    input.focus();
    input.addEventListener('input', () => input.classList.remove('ob-err'), { once: true });
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────────────────────────────────── */
function collectCurrentInput() {
  const step  = currentStep();
  const input = document.getElementById('ob-input');
  if (!input) return;
  const raw = input.value;
  state.data[step.id] = step.type === 'number' && raw !== '' ? Number(raw) : raw;
}

function handleNext() {
  if (state.submitting) return;

  collectCurrentInput();

  if (!validateStep()) {
    render('ob-anim-fwd'); /* re-render to show error */
    return;
  }

  const step = currentStep();
  if (isFinalStep(step)) {
    submitSignup();
    return;
  }

  state.stepIndex++;
  saveDraft();
  render('ob-anim-fwd');
}

function handleBack() {
  if (state.stepIndex === 0) return;
  state.error    = null;
  state.stepIndex--;
  render('ob-anim-back');
}

function handleSkip() {
  const step = currentStep();
  /* Multi-chips default to empty array; everything else empty string */
  state.data[step.id] = step.type === 'multi-chips' ? [] : '';
  state.error    = null;
  state.stepIndex++;
  saveDraft();
  render('ob-anim-fwd');
}

/* ─────────────────────────────────────────────────────────────────────────
   SUBMISSION
───────────────────────────────────────────────────────────────────────── */
async function submitSignup() {
  if (state.submitting) return;

  if (!state.backendOnline) {
    state.error = 'Cannot reach the backend server. Make sure it is running (cd backend && npm run dev), then try again.';
    render('ob-anim-fwd');
    return;
  }

  state.submitting = true;
  state.error      = null;
  render('ob-anim-fwd'); /* Show spinner */

  const d = state.data;

  /* Build payload matching the existing backend /api/auth/signup schema */
  const payload = {
    role:     state.role,
    name:     String(d.name  || '').trim(),
    email:    String(d.email || '').trim().toLowerCase(),
    password: String(d.password || ''),

    /* Patient-specific */
    bloodGroup:       d.bloodGroup       || '',
    emergencyContact: d.emergencyContact || '',
    /* Pack DOB, gender, and conditions into backend fields */
    insurancePlan: Array.isArray(d.conditions) && d.conditions.length
      ? d.conditions.join(', ')
      : '',
    healthGoal: [
      d.dob    ? `DOB: ${d.dob}`       : '',
      d.gender ? `Gender: ${d.gender}` : '',
    ].filter(Boolean).join(' | ') || '',
    address: '',

    /* Doctor-specific */
    specialty:          d.specialty          || '',
    qualification:      d.qualification      || '',
    registrationNumber: d.registrationNumber || '',
    yearsExperience:    d.yearsExperience    || 0,
    hospital:           d.hospital           || '',
    consultFee:         d.consultFee         || 0,
    clinicAddress:      d.consultMode ? `Consultation mode: ${d.consultMode}` : '',
  };

  try {
    const res  = await fetch(`${API}/auth/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new Error(data?.error || `Server error ${res.status}.`);
    }

    /* Persist session */
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      ...data.user,
      savedAt: new Date().toISOString(),
    }));

    /* Persist root navigation links */
    localStorage.setItem(LINKS_KEY, JSON.stringify({
      login:       new URL('./login.html',         window.location.href).href,
      signup:      new URL('./signup.html',         window.location.href).href,
      patient:     new URL('./patient.html',          window.location.href).href,
      doctorLaunch: new URL('./doctor-launch.html', window.location.href).href,
    }));

    state.submitting = false;
    renderSuccess(data.user);

  } catch (err) {
    state.submitting = false;
    state.error      = err.message || 'Something went wrong. Please try again.';
    render('ob-anim-fwd');
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   REDIRECT AFTER SUCCESS
   Exposed globally so the inline onclick in renderSuccess can call it.
───────────────────────────────────────────────────────────────────────── */
async function doRedirect(role) {
  if (role === 'DOCTOR') {
    const isLocal = window.location.hostname === 'localhost' ||
                    window.location.protocol === 'file:';
    if (isLocal) {
      try {
        await fetch(DOCTOR_FRONTEND_URL, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
        window.location.href = `${DOCTOR_FRONTEND_URL}/`;
        return;
      } catch { /* Doctor dev server not running */ }
    }
    window.location.href = new URL('./doctor-launch.html', window.location.href).href;
    return;
  }
  /* Patient → onboarding setup page */
  window.location.href = new URL('./meiosis-setup.html', window.location.href).href;
}

/* Expose for inline onclick */
window.doRedirect = doRedirect;

/* ─────────────────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function iconEye() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`;
}

/* ─────────────────────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────────────────────── */
function boot() {
  loadDraft();

  /* Wire nav buttons */
  document.getElementById('ob-next')?.addEventListener('click', handleNext);
  document.getElementById('ob-back')?.addEventListener('click', handleBack);
  document.getElementById('ob-skip')?.addEventListener('click', handleSkip);

  /* Check backend in background — non-blocking */
  checkBackend();

  /* Initial render */
  render('ob-anim-fwd');
}

/* Script is at the bottom of <body> — DOM is already ready, call boot directly */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
const DOCTOR_FRONTEND_URL = String(runtimeConfig.doctorFrontendUrl || 'http://localhost:5173').replace(/\/+$/, '');
