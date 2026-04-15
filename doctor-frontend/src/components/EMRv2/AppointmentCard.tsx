import { Activity } from 'lucide-react';
import type { AppointmentEntry } from './types';

interface AppointmentCardProps {
  appointment: AppointmentEntry;
  highlighted?: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function AppointmentCard({
  appointment,
  highlighted = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: AppointmentCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        background: '#0B0B0C',
        borderRadius: 24,
        padding: '16px 18px',
        minWidth: 200,
        maxWidth: 216,
        cursor: 'pointer',
        flexShrink: 0,
        outline: 'none',
        boxShadow: highlighted
          ? '0 0 0 2px #E7F36E, 0 16px 40px rgba(0,0,0,0.40)'
          : '0 8px 28px rgba(0,0,0,0.32)',
        transform: highlighted ? 'scale(1.025)' : 'scale(1)',
        transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* specialty badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <div
          style={{
            background: 'rgba(231,243,110,0.14)',
            borderRadius: 9,
            padding: '5px 6px',
            color: '#E7F36E',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Activity size={13} />
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#E7F36E',
          }}
        >
          {appointment.specialty}
        </span>
      </div>

      {/* title */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#FFFFFF',
          lineHeight: 1.35,
          marginBottom: 5,
        }}
      >
        {appointment.type}
      </div>

      {/* meta */}
      <div
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.46)',
          marginBottom: 10,
        }}
      >
        {appointment.date} · {appointment.doctor}
      </div>

      {/* metrics chip */}
      <div
        style={{
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 10,
          padding: '5px 10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#E7F36E',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.82)',
          }}
        >
          {appointment.metrics}
        </span>
      </div>
    </div>
  );
}
