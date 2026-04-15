/**
 * persistentCache.ts
 *
 * Lightweight localStorage-based caching layer for the Doctor Dashboard.
 * Enables "instant hydration" by loading the last known state on refresh,
 * while fresh data is fetched in the background.
 */

const CACHE_PREFIX = 'meiosis_v1_';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
}

export function saveToCache<T>(key: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[Meiosis Cache] Failed to save ${key}:`, err);
  }
}

export function loadFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const envelope: CacheEnvelope<T> = JSON.parse(raw);
    
    // Check expiration
    if (Date.now() - envelope.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return envelope.data;
  } catch (err) {
    console.warn(`[Meiosis Cache] Failed to load ${key}:`, err);
    return null;
  }
}

export function clearCache(): void {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error('[Meiosis Cache] Failed to clear cache:', err);
  }
}
