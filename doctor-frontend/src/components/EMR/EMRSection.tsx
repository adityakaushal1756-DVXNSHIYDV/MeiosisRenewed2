import { ReactNode } from 'react';

interface EMRSectionProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function EMRSection({ title, description, actions, children }: EMRSectionProps) {
  return (
    <section className="rounded-3xl border border-wire/8 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-mist">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

