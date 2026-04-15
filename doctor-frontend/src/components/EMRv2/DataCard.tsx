import type { LabEntry, PrescriptionEntry, MedicationEntry } from './types';

type DataCardVariant = 'lab' | 'prescription' | 'medication';

const STATUS_COLORS: Record<string, string> = {
  normal: '#22c55e',
  high: '#f97316',
  low: '#3b82f6',
  critical: '#ef4444',
};

const BADGE: Record<DataCardVariant, { label: string; bg: string; color: string }> = {
  lab:          { label: 'Lab',  bg: '#E7F36E',  color: '#111111' },
  prescription: { label: 'Rx',   bg: '#BFDBFE',  color: '#1e3a5f' },
  medication:   { label: 'Med',  bg: '#FED7AA',  color: '#7c2d12' },
};

interface DataCardProps {
  variant: DataCardVariant;
  data: LabEntry | PrescriptionEntry | MedicationEntry;
  highlighted?: boolean;
}

export function DataCard({ variant, data, highlighted = false }: DataCardProps) {
  const badge = BADGE[variant];

  let title = '';
  let subtitle = '';
  let statusColor = '';

  if (variant === 'lab') {
    const d = data as LabEntry;
    title = d.label;
    subtitle = `${d.value}${d.unit ? '\u00a0' + d.unit : ''}`;
    statusColor = d.status ? (STATUS_COLORS[d.status] ?? '') : '';
  } else if (variant === 'prescription') {
    const d = data as PrescriptionEntry;
    title = d.name;
    subtitle = `${d.dose}${d.frequency ? ' · ' + d.frequency : ''}`;
  } else {
    const d = data as MedicationEntry;
    title = d.name;
    subtitle = `${d.dose}${d.ongoing ? ' · ongoing' : ''}`;
    statusColor = d.ongoing ? '#22c55e' : '';
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        padding: '11px 14px',
        boxShadow: highlighted
          ? '0 8px 32px rgba(0,0,0,0.13), 0 0 0 1.5px #E7F36E'
          : '0 8px 24px rgba(0,0,0,0.08)',
        minWidth: 188,
        maxWidth: 200,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        transform: highlighted ? 'scale(1.01)' : 'scale(1)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            background: badge.bg,
            color: badge.color,
            borderRadius: 6,
            padding: '2px 7px',
          }}
        >
          {badge.label}
        </span>
        {statusColor && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusColor,
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          />
        )}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#111111', lineHeight: 1.3 }}>
        {title}
      </div>
      <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 2, lineHeight: 1.4 }}>
        {subtitle}
      </div>
    </div>
  );
}
