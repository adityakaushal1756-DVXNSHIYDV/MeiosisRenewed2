/**
 * Offline EMR Queue — IndexedDB persistence for EMR saves that failed because
 * the doctor was offline.  Data survives page refreshes and is drained
 * automatically by useOfflineSync once the network returns.
 */

const DB_NAME    = 'meiosis_offline_v1';
const DB_VERSION = 1;
const STORE      = 'pending_emr';

export interface PendingEMR {
  id?: number;          // auto-increment primary key
  savedAt: number;      // Date.now() when the doctor hit Save
  patientName: string;  // for human-readable toast messages
  payload: Record<string, unknown>; // exact JSON body for POST /api/emr
}

// ─── DB open ────────────────────────────────────────────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Add a new pending EMR record to the local queue. */
export async function enqueueEMR(item: Omit<PendingEMR, 'id'>): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(item);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/** Read all queued records (oldest first). */
export async function getAllPendingEMRs(): Promise<PendingEMR[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as PendingEMR[]);
    req.onerror   = () => reject(req.error);
  });
}

/** Delete a successfully-synced record from the queue. */
export async function removePendingEMR(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/** Count how many records are waiting to sync. */
export async function countPendingEMRs(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
