interface ConnectorLineProps {
  height?: number;
  highlighted?: boolean;
}

export function ConnectorLine({ height = 28, highlighted = false }: ConnectorLineProps) {
  if (height <= 0) return null;
  return (
    <svg
      width="2"
      height={height}
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden
    >
      <line
        x1="1"
        y1="0"
        x2="1"
        y2={height}
        stroke={highlighted ? '#E7F36E' : '#D6D6D2'}
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transition: 'stroke 0.22s ease' }}
      />
    </svg>
  );
}
