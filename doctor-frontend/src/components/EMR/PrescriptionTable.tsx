import { LayoutTemplate, Plus } from 'lucide-react';
import { PrescriptionRow as PrescriptionRowType } from '../../types/EMR';
import { PrescriptionRow } from './PrescriptionRow';

interface PrescriptionTableProps {
  rows: PrescriptionRowType[];
  onAdd: () => void;
  onOpenTemplates: () => void;
  onChange: (id: string, field: keyof PrescriptionRowType, value: string) => void;
  onRemove: (id: string) => void;
}

export function PrescriptionTable({ rows, onAdd, onOpenTemplates, onChange, onRemove }: PrescriptionTableProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 text-xs uppercase tracking-[0.22em] text-mist lg:grid-cols-[1.2fr_0.6fr_1.5fr_auto_0.7fr_auto]">
        <div>Medicine</div>
        <div>Dose</div>
        <div>Frequency</div>
        <div></div>
        <div>Duration</div>
        <div className="text-right">Action</div>
      </div>

      {rows.map((row) => (
        <PrescriptionRow key={row.id} row={row} onChange={onChange} onRemove={onRemove} />
      ))}

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={onAdd} className="ghost-btn gap-2">
          <Plus size={15} />
          Add medicine
        </button>
        <button type="button" onClick={onOpenTemplates} className="ghost-btn gap-2">
          <LayoutTemplate size={15} />
          Templates
        </button>
      </div>
    </div>
  );
}
