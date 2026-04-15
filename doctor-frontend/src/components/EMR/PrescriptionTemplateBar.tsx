import { BookmarkPlus, FolderDown } from 'lucide-react';
import { PrescriptionTemplate } from '../../types/EMR';

interface PrescriptionTemplateBarProps {
  templates: PrescriptionTemplate[];
  activeTemplateId: string | null;
  onApplyTemplate: (templateId: string) => void;
  onSaveTemplate: () => void;
}

export function PrescriptionTemplateBar({ templates, activeTemplateId, onApplyTemplate, onSaveTemplate }: PrescriptionTemplateBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onApplyTemplate(template.id)}
            className={[
              'rounded-2xl border px-4 py-2 text-sm transition',
              activeTemplateId === template.id ? 'border-neon/30 bg-neonSoft text-neon' : 'border-wire/10 bg-white/[0.03] text-white/80 hover:border-wire/18'
            ].join(' ')}
          >
            <div className="flex items-center gap-2">
              <FolderDown size={14} />
              {template.name}
            </div>
          </button>
        ))}
      </div>

      <button onClick={onSaveTemplate} className="ghost-btn gap-2">
        <BookmarkPlus size={16} />
        Save current prescription as template
      </button>
    </div>
  );
}

