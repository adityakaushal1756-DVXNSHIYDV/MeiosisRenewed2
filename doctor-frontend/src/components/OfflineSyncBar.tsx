/**
 * OfflineSyncBar
 *
 * A fixed floating pill at the bottom-center that shows the current
 * online / offline / syncing state.  Visible only when there's something
 * worth reporting — hidden when online with nothing pending.
 */

import { CloudOff, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';
import type { SyncStatus } from '../hooks/useOfflineSync';

interface OfflineSyncBarProps {
  syncStatus: SyncStatus;
  pendingCount: number;
  isOnline: boolean;
}

export function OfflineSyncBar({ syncStatus, pendingCount, isOnline }: OfflineSyncBarProps) {
  // Nothing to show while fully online and queue is empty
  if (syncStatus === 'online' && pendingCount === 0) return null;

  // ── syncing: draining the queue ─────────────────────────────────────────
  if (syncStatus === 'syncing') {
    return (
      <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2">
        <div className="flex items-center gap-2.5 rounded-full border border-neon/30 bg-black/80 px-5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <RefreshCw size={14} className="animate-spin text-neon" />
          <span className="text-sm font-medium text-neon">
            Syncing {pendingCount} offline record{pendingCount !== 1 ? 's' : ''}…
          </span>
        </div>
      </div>
    );
  }

  // ── offline with pending records ─────────────────────────────────────────
  if (!isOnline) {
    return (
      <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2">
        <div className="flex items-center gap-2.5 rounded-full border border-amber-400/35 bg-black/80 px-5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <WifiOff size={14} className="text-amber-300" />
          <span className="text-sm font-medium text-amber-200">
            Offline
            {pendingCount > 0 && (
              <> — <strong>{pendingCount}</strong> record{pendingCount !== 1 ? 's' : ''} saved locally, will sync on reconnect</>
            )}
          </span>
        </div>
      </div>
    );
  }

  // ── online but still has pending items (backend may be down) ────────────
  if (isOnline && pendingCount > 0) {
    return (
      <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2">
        <div className="flex items-center gap-2.5 rounded-full border border-sky-400/30 bg-black/80 px-5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <CloudOff size={14} className="text-sky-300" />
          <span className="text-sm font-medium text-sky-200">
            {pendingCount} record{pendingCount !== 1 ? 's' : ''} waiting to sync (backend unreachable)
          </span>
        </div>
      </div>
    );
  }

  return null;
}
