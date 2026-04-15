interface QueueSummaryProps {
  waiting: number;
  inSession: number;
  completed: number;
  late: number;
}

const cards = [
  { key: 'waiting', label: 'Waiting', accent: 'text-sky' },
  { key: 'inSession', label: 'In Session', accent: 'text-neon' },
  { key: 'completed', label: 'Completed', accent: 'text-white' },
  { key: 'late', label: 'Late', accent: 'text-amber-200' }
] as const;

export function QueueSummary({ waiting, inSession, completed, late }: QueueSummaryProps) {
  const values = { waiting, inSession, completed, late };

  function cellClass(key: typeof cards[number]['key']) {
    if (key === 'inSession' && inSession > 0)
      return 'rounded-3xl border border-neon/30 bg-neon/[0.06] p-4 stat-live-glow';
    if (key === 'late' && late > 0)
      return 'rounded-3xl border border-amber-400/30 bg-amber-400/[0.05] p-4 card-late-glow';
    return 'rounded-3xl border border-wire/8 bg-slate-950/24 p-4';
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.key} className={cellClass(card.key)}>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-mist">
            {card.key === 'inSession' && inSession > 0 && <span className="live-dot" />}
            {card.label}
          </div>
          <div className={`mt-3 text-3xl font-semibold ${card.accent}`}>{values[card.key]}</div>
        </div>
      ))}
    </div>
  );
}
