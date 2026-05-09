import React from 'react';
import { ListOrdered, Construction, Hammer, Code2 } from 'lucide-react';
import { Header } from '../components/Header';
import { GlassCard } from '../components/ui';

export function QueuePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Live Queue" subtitle="Patient sequence management" icon={<ListOrdered size={16} />} />
      <div className="flex-1 flex items-center justify-center p-8">
        <GlassCard className="construction-card max-w-md w-full p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <Construction size={32} className="text-blue-400" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Hammer size={14} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Development in Progress</span>
          </div>
          <h2 className="text-2xl font-black text-primary mb-3">Queue Engine</h2>
          <p className="text-sm text-secondary leading-relaxed mb-6">
            The live queue management engine with drag-and-drop re-ordering, 
            real-time status sync, and doctor notifications is under active development.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {['Drag-to-reorder', 'Real-time sync', 'Auto-notifications', 'Priority override'].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-xs text-muted">
                <Code2 size={11} className="text-blue-400 flex-shrink-0" />
                {feat}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
