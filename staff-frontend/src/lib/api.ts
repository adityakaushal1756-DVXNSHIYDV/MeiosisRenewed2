import axios from 'axios';

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:5002';
const API_BASE_URL = `${BACKEND_ORIGIN}/api`;

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
