import { useState, useEffect } from 'react';

export const AUTH_SESSION_KEY = "meiosis_auth_session_v1";

// For local testing on the new port without needing to route through login.html every time.
// Since the user chose Option A (recommendation), we'll do a mock bypass IF no session is found AND we are in DEV.

export interface AuthSession {
  token: string;
  patientId: string;
  name: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
}

export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    // 1. Check for session handover via URL (cross-port login support)
    const url = new URL(window.location.href);
    const sessionParam = url.searchParams.get("session");
    if (sessionParam) {
      localStorage.setItem(AUTH_SESSION_KEY, sessionParam);
      // Clean the URL
      url.searchParams.delete("session");
      window.history.replaceState({}, "", url.toString());
      return JSON.parse(sessionParam);
    }

    // 2. Check traditional local storage
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_SESSION_KEY);
    window.location.href = getLoginUrl();
  }
}

function getLoginUrl() {
  if (typeof window === "undefined") return "/login.html";

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    import.meta.env.DEV;

  if (isLocal) {
    const protocol = window.location.protocol;
    const host = window.location.hostname || "localhost";
    return `${protocol}//${host}:5002/login.html`;
  }

  return "/login.html";
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentSession = loadAuthSession();
    if (currentSession && currentSession.role === "PATIENT") {
      setSession(currentSession);
    } else {
      // Redirect to unified gateway if no session is found
      window.location.href = getLoginUrl();
    }
    setIsLoading(false);
  }, []);

  return { session, isLoading, logout };
}
