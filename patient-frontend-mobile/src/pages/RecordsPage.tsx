import { useState } from 'react';
import { FileText, FlaskConical, Stethoscope, Search } from 'lucide-react';

interface Props { data: any; }

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{size?: number | string}> }> = {
  PRESCRIPTION:  { label: 'Prescription',  color: 'var(--neon)', icon: FileText },
  LAB_REPORT:    { label: 'Lab Report',    color: 'var(--sky)',  icon: FlaskConical },
  CONSULTATION:  { label: 'Consultation',  color: '#a78bfa',    icon: Stethoscope },
};

const TYPE_CHIP_CLASS: Record<string, string> = {
  PRESCRIPTION: 'm-chip-green',
  LAB_REPORT:   'm-chip-sky',
  CONSULTATION: 'm-chip-mist',
};

export function RecordsPage({ data }: Props) {
  const [filter, setFilter] = useState<'all' | 'PRESCRIPTION' | 'LAB_REPORT' | 'CONSULTATION'>('all');
  const [search, setSearch] = useState('');

  const rawRecords: any[] = [
    ...(data?.prescriptions ?? []).map((r: any) => ({ ...r, type: 'PRESCRIPTION', date: r.startDate, displayTitle: r.title })),
    ...(data?.records ?? []).map((r: any) => ({ ...r, displayTitle: r.title ?? r.type })),
  ].sort((a, b) => new Date(b.date ?? b.createdAt ?? 0).getTime() - new Date(a.date ?? a.createdAt ?? 0).getTime());

  const filtered = rawRecords.filter(r => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.displayTitle ?? '').toLowerCase().includes(q) || (r.doctor?.name ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  // Group by month
  const groups: Record<string, any[]> = {};
  filtered.forEach(r => {
    const d = new Date(r.date ?? r.createdAt ?? Date.now());
    const key = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  return (
    <div className="m-fade-in">
      {/* Search */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--mist-2)' }} />
          <input
            className="m-input"
            style={{ paddingLeft: 40 }}
            placeholder="Search records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6 }}>
        {(['all', 'PRESCRIPTION', 'LAB_REPORT', 'CONSULTATION'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              height: 30, padding: '0 12px', borderRadius: 100,
              fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.04em',
              border: filter === f ? 'none' : '1px solid var(--wire-2)',
              background: filter === f ? 'var(--neon)' : 'transparent',
              color: filter === f ? 'var(--ink)' : 'var(--mist)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {f === 'all' ? 'All' : TYPE_CONFIG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Records grouped by month */}
      {Object.keys(groups).length === 0 ? (
        <div className="m-empty">
          <FileText size={40} />
          <h3>No Records Found</h3>
          <p>Try adjusting your filter or search term.</p>
        </div>
      ) : (
        Object.entries(groups).map(([month, recs]) => (
          <div key={month}>
            <p className="m-section-label" style={{ paddingTop: 4 }}>{month}</p>
            <div className="m-timeline">
              {recs.map((r, i) => {
                const cfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG['CONSULTATION'];
                const chipCls = TYPE_CHIP_CLASS[r.type] ?? 'm-chip-mist';
                const Icon = cfg.icon;
                return (
                  <div key={r.id ?? i} className="m-tl-item">
                    <div className="m-tl-spine">
                      <div className="m-tl-dot" style={{ background: cfg.color }} />
                      {i < recs.length - 1 && <div className="m-tl-line" />}
                    </div>
                    <div className="m-tl-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span className={`m-chip ${chipCls}`} style={{ gap: 4, display: 'flex', alignItems: 'center' }}>
                          <Icon size={10} />{cfg.label}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mist-2)' }}>
                          {new Date(r.date ?? r.createdAt ?? Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="m-tl-title">{r.displayTitle}</div>
                      {r.doctor?.name && <div className="m-tl-sub">{r.doctor.name}{r.doctor.specialty ? ` · ${r.doctor.specialty}` : ''}</div>}
                      {r.primaryMetric && (
                        <div style={{ marginTop: 6, padding: '6px 10px', background: 'var(--wire)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mist)', display: 'block', marginBottom: 2 }}>Primary metric</span>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--white)' }}>{r.primaryMetric}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
