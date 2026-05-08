/**
 * Meiosis API Configuration
 * Connects to your existing Express backend.
 *
 * For local testing: set LOCAL_IP to your machine's LAN IP
 * (e.g. 192.168.1.50) - cannot use 'localhost' from a physical device.
 *
 * For production: set EXPO_PUBLIC_API_URL in a .env file or EAS secrets.
 */

// ─── CHANGE THIS TO YOUR LOCAL IP WHEN TESTING ON A PHONE ──────────────────
// To find it: run `ipconfig getifaddr en0` on Mac terminal
const LOCAL_DEV_IP = '192.168.29.52'; // Updated to match your Mac's current Wi-Fi IP
const LOCAL_DEV_PORT = '5002';
// ────────────────────────────────────────────────────────────────────────────

const PROD_URL = process.env.EXPO_PUBLIC_API_URL || '';

function getBaseUrl(): string {
  if (PROD_URL) {
    return PROD_URL.replace(/\/+$/, '');
  }
  // When running with Expo Go in development, use your machine's LAN IP
  return `http://${LOCAL_DEV_IP}:${LOCAL_DEV_PORT}`;
}

export const API_BASE_URL = `${getBaseUrl()}/api`;

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export function assetUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${normalized}`;
}

export function getAuthHeader(token: string): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
