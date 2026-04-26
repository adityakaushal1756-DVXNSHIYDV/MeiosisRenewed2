import { Activity } from 'lucide-react';

export interface AdmissionRecord {
  type: 'observation' | 'hospitalisation';
  bed: string;
  ward: string;
  timestamp: string;
  meiosisId: string;
}

export function AdmissionCard({ record, chromeDarkMode }: { record: AdmissionRecord; chromeDarkMode: boolean }) {
  const isObs = record.type === 'observation';
  const accentCol = isObs ? '#f97316' : '#8b5cf6'; // orange for obs, purple for hosp
  const dateStr = (() => {
    try { return new Date(record.timestamp).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }); }
    catch { return 'Today'; }
  })();

  return (
    <div style={{
      margin: '0 auto 20px auto',
      padding: '18px 24px',
      borderRadius: 20,
      background: chromeDarkMode
        ? `color-mix(in srgb, ${accentCol}18 40%, rgba(10,20,36,.92) 60%)`
        : `color-mix(in srgb, ${accentCol}14 40%, #FAF7F2 60%)`,
      border: `1px solid ${accentCol}40`,
      boxShadow: `0 0 32px ${accentCol}22, inset 0 1px 0 rgba(255,255,255,.07)`,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      maxWidth: 720,
      textAlign: 'left'
    }}>
      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: `${accentCol}22`, border: `1px solid ${accentCol}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Activity size={24} color={accentCol} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ 
            fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em',
            padding: '2px 8px', borderRadius: 99, background: `${accentCol}33`, color: accentCol,
            border: `1px solid ${accentCol}44`
          }}>
            {isObs ? 'Observation' : 'Hospitalised'}
          </span>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: chromeDarkMode ? '#f8fafc' : '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
          {isObs ? 'Observation' : 'Hospitalisation'} — {record.ward}
        </h3>
        <p style={{ fontSize: 12, fontWeight: 600, color: chromeDarkMode ? '#8ca1b4' : '#64748b', margin: '4px 0 0 0' }}>
          {dateStr} · Bed: {record.bed} · Meiosis ID: <span style={{ color: accentCol }}>#{record.meiosisId}</span>
        </p>
      </div>

      <div style={{ 
        padding: '8px 14px', borderRadius: 10, background: `${accentCol}22`,
        fontSize: 10, fontWeight: 900, color: accentCol, textTransform: 'uppercase', letterSpacing: '0.08em'
      }}>
        Admitted
      </div>
    </div>
  );
}
