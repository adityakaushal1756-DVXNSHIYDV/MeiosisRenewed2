import axios from 'axios';

const rawBackendOrigin = import.meta.env.VITE_BACKEND_ORIGIN?.trim();

function getDefaultBackendOrigin() {
  if (typeof window === 'undefined') return '';

  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    import.meta.env.DEV;

  if (isLocal) {
    const protocol = window.location.protocol;
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:5002`;
  }

  return '';
}

const BACKEND_ORIGIN = rawBackendOrigin
  ? rawBackendOrigin.replace(/\/+$/, '')
  : getDefaultBackendOrigin();

const API_BASE_URL = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const sessionStr = localStorage.getItem('meiosis_staff_session');
  if (sessionStr) {
    try {
      const { token } = JSON.parse(sessionStr);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {}
  }
  return config;
});
