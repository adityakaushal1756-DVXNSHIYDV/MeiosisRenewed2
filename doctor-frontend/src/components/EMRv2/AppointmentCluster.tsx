import { AppointmentCard } from './AppointmentCard';
import { DataCard } from './DataCard';
import { ConnectorLine } from './ConnectorLine';
import type { AppointmentEntry } from './types';

interface AppointmentClusterProps {
  appointment: AppointmentEntry;
  position: 'above' | 'below';
  highlighted: boolean;
  onHighlight: (id: string | null) => void;
  onSelect: (apt: AppointmentEntry) => void;
}

export function AppointmentCluster({
  appointment,
  position,
  highlighted,
  onHighlight,
  onSelect,
}: AppointmentClusterProps) {
  // Build the ordered data card list:
  // Above branch order (top → bottom): labs → prescriptions → medications → appointment
  // Below branch order (top → bottom): appointment → medications → prescriptions → labs
  const dataCardsAbove = [
    ...appointment.labs.map((d) => ({ key: d.id, variant: 'lab' as const, data: d })),
    ...appointment.prescriptions.map((d) => ({ key: d.id, variant: 'prescription' as const, data: d })),
    ...appointment.medications.map((d) => ({ key: d.id, variant: 'medication' as const, data: d })),
  ];
  const dataCardsBelow = [...dataCardsAbove].reverse();

  const hasData = dataCardsAbove.length > 0;

  const dot = (
    <div
      style={{
        width: 13,
        height: 13,
        borderRadius: '50%',
        background: highlighted ? '#E7F36E' : '#0B0B0C',
        border: `2.5px solid ${highlighted ? '#E7F36E' : '#D6D6D2'}`,
        flexShrink: 0,
        boxShadow: highlighted ? '0 0 0 5px rgba(231,243,110,0.18)' : 'none',
        transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        zIndex: 2,
        position: 'relative',
      }}
    />
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 258,
        flexShrink: 0,
        padding: '0 20px',
      }}
    >
      {/* ── TOP HALF ─────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          paddingBottom: 0,
          minHeight: 'calc(50vh - 30px)',
        }}
      >
        {position === 'above' && (
          <>
            {dataCardsAbove.map((card) => (
              <DataCard
                key={card.key}
                variant={card.variant}
                data={card.data}
                highlighted={highlighted}
              />
            ))}
            {hasData && <ConnectorLine height={14} highlighted={highlighted} />}
            <AppointmentCard
              appointment={appointment}
              highlighted={highlighted}
              onClick={() => onSelect(appointment)}
              onMouseEnter={() => onHighlight(appointment.id)}
              onMouseLeave={() => onHighlight(null)}
            />
            <ConnectorLine height={24} highlighted={highlighted} />
          </>
        )}
      </div>

      {/* ── DOT ──────────────────────────────────── */}
      {dot}

      {/* ── BOTTOM HALF ──────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 10,
          paddingTop: 0,
          minHeight: 'calc(50vh - 30px)',
        }}
      >
        {position === 'below' && (
          <>
            <ConnectorLine height={24} highlighted={highlighted} />
            <AppointmentCard
              appointment={appointment}
              highlighted={highlighted}
              onClick={() => onSelect(appointment)}
              onMouseEnter={() => onHighlight(appointment.id)}
              onMouseLeave={() => onHighlight(null)}
            />
            {hasData && <ConnectorLine height={14} highlighted={highlighted} />}
            {dataCardsBelow.map((card) => (
              <DataCard
                key={card.key}
                variant={card.variant}
                data={card.data}
                highlighted={highlighted}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
