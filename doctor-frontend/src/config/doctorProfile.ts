/** Single source of truth for the currently logged-in doctor. */

const AUTH_SESSION_KEY = 'meiosis_auth_session_v1';
const ROOT_LINKS_KEY = 'meiosis_root_links_v1';

function loadDoctorSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function redirectToLogin(): never {
  const params = new URLSearchParams(window.location.search);
  const gatewayFallback = params.get('gatewayFallback');
  const tempToken = params.get('tempToken');
  const tempCode = params.get('tempCode');

  if (gatewayFallback === 'true' && tempToken) {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      import.meta.env.DEV;
    const defaultBackendUrl = isLocal
      ? `${window.location.protocol}//${window.location.hostname || 'localhost'}:5002/api`
      : '/api';
    const backendUrl = import.meta.env.VITE_API_URL || defaultBackendUrl;
    const baseUrl = backendUrl.replace(/\/api$/, '');
    window.location.replace(`${baseUrl}/patient-record?token=${encodeURIComponent(tempToken)}&code=${encodeURIComponent(tempCode || '')}`);
    throw new Error('Redirecting to temporary access');
  }

  try {
    const links = JSON.parse(localStorage.getItem(ROOT_LINKS_KEY) || '{}');
    window.location.replace(links.login || '/login.html');
  } catch {
    window.location.replace('/login.html');
  }
  // Throw so TypeScript knows this path never returns
  throw new Error('Redirecting to login');
}

const _session = loadDoctorSession();

if (!_session?.doctorId) {
  redirectToLogin();
}

const _rawName: string = (_session?.name as string) ?? '';
const _shortName = _rawName.replace(/^Dr\.\s*/i, '');

export const CURRENT_DOCTOR = {
  id:        (_session?.doctorId as string) ?? '',
  name:      _shortName ? `Dr. ${_shortName}` : 'Doctor',
  shortName: _shortName || 'Doctor',
  specialty: (_session?.specialty as string) ?? 'General Medicine',
  meiosisId: (_session?.meiosisId as string) ?? '',
  hospital:  (_session?.hospital as string) ?? ''
} as const;

export type DoctorProfile = typeof CURRENT_DOCTOR;
