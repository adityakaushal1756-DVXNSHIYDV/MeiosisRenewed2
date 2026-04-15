import { useCallback, useState } from 'react';
import { API_BASE_URL } from '../lib/api';

const API = API_BASE_URL;
const STORAGE_KEY = 'meiosis_medicine_db_v1';

function loadStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface UseMedicineDbReturn {
  medicines: string[];
  uploading: boolean;
  error: string | null;
  uploadPDF: (file: File) => Promise<void>;
  clear: () => void;
}

export function useMedicineDb(): UseMedicineDbReturn {
  const [medicines, setMedicines] = useState<string[]>(loadStored);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const uploadPDF = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      if (file.size > 4 * 1024 * 1024) {
        throw new Error('File is too large. Please upload a PDF under 4MB to ensure reliable processing.');
      }

      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch(`${API}/medicines/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      const list: string[] = data.medicines ?? [];
      setMedicines(list);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMedicines([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { medicines, uploading, error, uploadPDF, clear };
}
