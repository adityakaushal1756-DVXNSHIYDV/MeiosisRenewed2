/**
 * Determines the API base URL based on environment and deployment context.
 *
 * Priority:
 * 1. VITE_API_BASE_URL environment variable (explicit configuration)
 * 2. Current hostname on port 5002 if running locally (local development)
 * 3. Relative /api path (when frontend & backend are on same domain)
 * 4. Current origin + /api (fallback for same-origin deployments)
 */
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const normalizedApiBaseUrl = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, "")
  : getDefaultApiUrl();

function getDefaultApiUrl(): string {
  // In local development, target the backend port.
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
     window.location.hostname === "127.0.0.1" ||
     window.location.port === "5174" ||
     import.meta.env.DEV)
  ) {
    const protocol = window.location.protocol;
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:5002`;
  }

  // For same-origin deployments
  return "";
}

export const API_BASE_URL = normalizedApiBaseUrl
  ? `${normalizedApiBaseUrl}/api`
  : "/api";

if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("[Meiosis API] Initialized with BASE_URL:", API_BASE_URL);
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith("/api/") && API_BASE_URL === "/api") {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

export function assetUrl(path: string) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedApiBaseUrl
    ? `${normalizedApiBaseUrl}${normalizedPath}`
    : normalizedPath;
}

/**
 * Retrieves the JWT from localStorage and returns a formatted Authorization header object.
 */
export function getAuthHeader(): Record<string, string> {
  try {
    const sessionStr = localStorage.getItem('meiosis_auth_session_v1');
    if (!sessionStr) return {};
    
    const session = JSON.parse(sessionStr);
    if (!session || !session.token) return {};
    
    return { 'Authorization': `Bearer ${session.token}` };
  } catch (err) {
    console.error("[Meiosis API] Failed to parse auth session for token:", err);
    return {};
  }
}
