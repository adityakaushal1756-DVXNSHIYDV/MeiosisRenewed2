import { Plus, RefreshCw, Users } from 'lucide-react';

interface QueueToolbarProps {
  waitingCount: number;
  completedCount: number;
  queueWindowCount: number;
  onAddWalkIn: () => void;
  onRefresh: () => void;
}

export function QueueToolbar({ waitingCount, completedCount, queueWindowCount, onAddWalkIn, onRefresh }: QueueToolbarProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="section-title">Today&apos;s Queue</h2>
        <p className="section-copy">Grouped into fast-scanning consultation windows.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="chip border-wire/10 bg-white/[0.03] text-white/80">{queueWindowCount} queue blocks</span>
        <span className="chip chip-blue">
          <Users size={14} />
          {waitingCount} waiting
        </span>
        <span className="chip border-wire/10 bg-white/[0.03] text-white/80">{completedCount} completed</span>
        <button onClick={onRefresh} className="action-btn gap-2" title="Sync queue from backend">
          <RefreshCw size={16} />
          Sync
        </button>
        <button onClick={onAddWalkIn} className="action-btn gap-2">
          <Plus size={16} />
          Add Walk-in Patient
        </button>
      </div>
    </div>
  );
}
