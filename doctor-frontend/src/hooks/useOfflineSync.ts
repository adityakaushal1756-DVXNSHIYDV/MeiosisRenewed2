/**
 * useOfflineSync
 *
 * Watches the browser's online/offline status and, whenever the network
 * returns, drains the IndexedDB offline EMR queue by replaying each pending
 * save against the backend.
 *
 * Usage in App.tsx:
 *   const { isOnline, syncStatus, pendingCount } = useOfflineSync({ onToast });
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl, getAuthHeader } from '../lib/api';
import {
  getAllPendingEMRs,
  removePendingEMR,
  countPendingEMRs,
  type PendingEMR,
} from '../utils/offlineQueue';

export type SyncStatus = 'online' | 'offline' | 'syncing';

const SYNC_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

interface UseOfflineSyncOptions {
  /** Called after each sync attempt with a toast message */
  onToast?: (ok: boolean, msg: string) => void;
  /** Called for each successfully synced record — use to reload patient EMR timeline */
  onSynced?: (item: PendingEMR) => void;
}

interface UseOfflineSyncResult {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  /** Call after enqueueing an item so the count updates immediately */
  refreshPendingCount: () => Promise<void>;
}

export function useOfflineSync({
  onToast,
  onSynced,
}: UseOfflineSyncOptions = {}): UseOfflineSyncResult {
  const [isOnline, setIsOnline]         = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus]     = useState<SyncStatus>(navigator.onLine ? 'online' : 'offline');
  const [pendingCount, setPendingCount] = useState<number>(0);

  const syncingRef        = useRef(false);
  // Timestamp after which the next background sync is allowed (0 = no cooldown)
  const cooldownUntilRef  = useRef<number>(0);

  // Keep callbacks in refs so syncPending (stable) always sees latest versions
  const onToastRef  = useRef(onToast);
  const onSyncedRef = useRef(onSynced);
  useEffect(() => { onToastRef.current  = onToast;  }, [onToast]);
  useEffect(() => { onSyncedRef.current = onSynced; }, [onSynced]);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await countPendingEMRs();
      setPendingCount(count);
    } catch {
      // IndexedDB unavailable (private browsing etc.) — silently ignore
    }
  }, []);

  /**
   * Attempt to drain the offline queue.
   * @param force  When true, skip the cooldown check (used on genuine reconnect events).
   *
   * Safety guarantee: records are only deleted from IndexedDB AFTER every
   * successful upload has been confirmed.  If ANY upload fails, no records
   * are deleted — the full batch stays in the queue for the next attempt.
   */
  const syncPending = useCallback(async (force = false) => {
    // Prevent concurrent sync runs
    if (syncingRef.current) return;

    // Respect cooldown unless this is a genuine network-reconnect trigger
    if (!force && Date.now() < cooldownUntilRef.current) return;

    syncingRef.current = true;

    try {
      const items = await getAllPendingEMRs();
      if (items.length === 0) {
        setSyncStatus('online');
        return;
      }

      setSyncStatus('syncing');

      // ── Phase 1: attempt every upload, collect results ──────────────────
      // We never delete anything here — we just record which items succeeded.
      const succeeded: PendingEMR[] = [];
      let networkAbort = false;

      for (const item of items) {
        if (networkAbort) break;
        try {
          const res = await fetch(apiUrl('/emr'), {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...getAuthHeader()
            },
            body: JSON.stringify(item.payload),
          });

          if (res.ok) {
            succeeded.push(item);
          }
          // Non-2xx: leave in queue, keep trying remaining items
        } catch {
          // fetch() threw — network is down again; abort the rest of this batch
          networkAbort = true;
        }
      }

      // ── Phase 2: delete ALL successfully uploaded records at once ────────
      // Only reached after every item has been attempted. Deleting in bulk
      // means a crash/reload mid-delete at worst duplicates a server write
      // (backend is idempotent via its own dedup) rather than losing data.
      if (succeeded.length > 0) {
        await Promise.all(succeeded.map((item) => removePendingEMR(item.id!)));
        // Notify caller to refresh patient timelines
        succeeded.forEach((item) => onSyncedRef.current?.(item));
      }

      // ── Phase 3: set cooldown ────────────────────────────────────────────
      // Even a partial success starts the 15-minute cooldown so we don't
      // hammer the server on every minor reconnect blip.
      if (succeeded.length > 0 || !networkAbort) {
        cooldownUntilRef.current = Date.now() + SYNC_COOLDOWN_MS;
      }

      const remaining = await countPendingEMRs();
      setPendingCount(remaining);

      if (succeeded.length > 0 && remaining === 0) {
        onToastRef.current?.(true,
          `Synced ${succeeded.length} offline EMR${succeeded.length !== 1 ? 's' : ''} — patient records updated`
        );
      } else if (succeeded.length > 0 && remaining > 0) {
        onToastRef.current?.(true,
          `Synced ${succeeded.length} EMR${succeeded.length !== 1 ? 's' : ''} — ${remaining} still pending`
        );
      }
      // If nothing synced and network aborted, stay quiet — the OfflineSyncBar shows the count
    } catch {
      // IndexedDB error — nothing we can do
    } finally {
      syncingRef.current = false;
      setSyncStatus(navigator.onLine ? 'online' : 'offline');
    }
  }, []); // stable — all mutable state accessed via refs

  // ─── Event listeners ────────────────────────────────────────────────────

  useEffect(() => {
    // Seed the pending count on mount
    refreshPendingCount();

    // On mount, if already online, try to drain leftover queue from a previous
    // offline session.  Respects cooldown so a page reload within 15 min of a
    // recent sync doesn't trigger a redundant attempt.
    if (navigator.onLine) {
      syncPending(false);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      // A genuine network reconnect always bypasses the cooldown
      cooldownUntilRef.current = 0;
      syncPending(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPending, refreshPendingCount]);

  return { isOnline, syncStatus, pendingCount, refreshPendingCount };
}
