import * as SecureStore from 'expo-secure-store';

export const AUTH_KEY = 'meiosis_auth_session_v1';

export interface AuthSession {
  token: string;
  patientId: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export async function saveSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<AuthSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || parsed.role !== 'PATIENT') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_KEY);
}
