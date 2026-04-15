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
  // In local development, keep the current host and target the backend port.
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
     window.location.hostname === "127.0.0.1" ||
     window.location.port === "5173" ||
     import.meta.env.DEV)
  ) {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    return `${protocol}//${host}:5002`;
  }

  // For same-origin deployments (frontend and backend on same domain)
  // or when using relative paths with a reverse proxy, use relative path
  return "";
}

export const API_BASE_URL = normalizedApiBaseUrl
  ? `${normalizedApiBaseUrl}/api`
  : "/api";

// Log configuration for debugging production connectivity
if (typeof window !== "undefined") {
  console.log("[Meiosis API] Initialized with BASE_URL:", API_BASE_URL);
  console.log("[Meiosis API] Deployment Context:", {
    dev: import.meta.env.DEV,
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol
  });
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  // If we're on Vercel and using relative paths, /api/auth becomes /api/auth
  // But if the route already starts with /api (from some legacy code), avoid doubling it.
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
