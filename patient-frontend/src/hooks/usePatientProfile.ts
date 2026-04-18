import { useState, useEffect } from 'react';
import { apiUrl, getAuthHeader } from '../lib/api';
import { PatientProfile } from '../types';

export function usePatientProfile(patientId: string | undefined) {
  const [data, setData] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = apiUrl(`patient/profile?id=${patientId}`);
        const response = await fetch(url, {
          headers: { ...getAuthHeader() }
        });
        
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || `Server responded with ${response.status}`);
        }
        
        const profileData = await response.json();
        if (!profileData) {
          throw new Error('Patient record not found in database.');
        }
        setData(profileData);
      } catch (err: any) {
        console.error("[Meiosis Data Sync Error]", err);
        setError(err.message || 'Connectivity error. Check if backend is running on port 5002.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [patientId]);

  return { data, isLoading, error };
}
