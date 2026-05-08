import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loadSession, saveSession, clearSession, AuthSession } from '../lib/auth';
import { apiUrl, getAuthHeader } from '../lib/api';
import { PatientProfile } from '../lib/types';

interface AuthContextValue {
  session: AuthSession | null;
  profile: PatientProfile | null;
  isLoading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Load stored session on mount
  useEffect(() => {
    loadSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });
  }, []);

  // Fetch profile whenever session changes
  const fetchProfile = useCallback(async (s: AuthSession) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const res = await fetch(apiUrl(`patient/profile?id=${s.patientId}`), {
        headers: getAuthHeader(s.token),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const data: PatientProfile = await res.json();
      setProfile(data);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchProfile(session);
    else setProfile(null);
  }, [session, fetchProfile]);

  const login = async (email: string, password: string) => {
    const res = await fetch(apiUrl('/auth/patient/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Login failed');
    }
    const body = await res.json();
    // Backend returns token + patient data
    const newSession: AuthSession = {
      token: body.token,
      patientId: body.patient?.id || body.patientId,
      name: body.patient?.name || body.name,
      email: body.patient?.email || email,
      role: 'PATIENT',
    };
    await saveSession(newSession);
    setSession(newSession);
  };

  const logout = async () => {
    await clearSession();
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session) await fetchProfile(session);
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, isLoading, profileLoading, profileError, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
