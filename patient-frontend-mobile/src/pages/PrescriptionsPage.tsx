import { useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { FileText } from 'lucide-react';

interface Props { data: any; }

export function PrescriptionsPage({ data }: Props) {
  const [tab, setTab] = useState<'overview' | 'timeline'>('overview');
  const today = new Date();
  const prescriptions: any[] = data?.prescriptions ?? [];

  const active = prescriptions.filter(p => {
    const end = new Date(p.startDate);
    end.setDate(end.getDate() + (p.durationDays ?? 0));
    return end >= today;
  });
  const past = prescriptions.filter(p => {
    const end = new Date(p.startDate);
    end.setDate(end.getDate() + (p.durationDays ?? 0));
    return end < today;
  });

  return (
    <div className="m-fade-in">
      {/* Stats */}
      <div className="m-stat-strip">
        <div className="m-stat">
          <div className="m-stat-val">{prescriptions.length}</div>
          <div className="m-stat-label">Total Scripts</div>
        </div>
        <div className="m-stat">
          <div className="m-stat-val">{active.length}</div>
          <div className="m-stat-label">Active Tracks</div>
        </div>
      </div>

      {/* Tab selector */}
      <div style={{ padding: '0 16px 12px' }}>
        <div className="m-tabs">
          <button className={`m-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`m-tab ${tab === 'timeline' ? 'active' : ''}`} onClick={() => setTab('timeline')}>Timeline</button>
        </div>
      </div>

      {tab === 'overview' && (
        <>
          {active.length > 0 && (
            <>
              <p className="m-section-label" style={{ paddingTop: 4 }}>Care Pipeline</p>
              <div style={{ padding: '0 16px' }}>
                {active.map((rx: any) => {
                  const daysLeft = Math.max(0, (rx.durationDays ?? 0) - differenceInDays(today, parseISO(rx.startDate ?? today.toISOString())));
                  return (
                    <div key={rx.id} className="m-rx-slab">
                      <div className="m-rx-header">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="m-rx-title">{rx.title}</div>
                          <div className="m-rx-doctor">{rx.doctor?.name ?? 'Doctor'} · {rx.doctor?.specialty ?? 'General'}</div>
                        </div>
                        <div className="m-rx-days">
                          <strong>{daysLeft}d</strong>
                          left
                        </div>
                      </div>
                      {rx.items?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                          {rx.items.slice(0, 4).map((item: any, i: number) => (
                            <span key={i} className="m-chip m-chip-mist">{item.medicine} {item.dose}</span>
                          ))}
                          {rx.items.length > 4 && <span className="m-chip m-chip-mist">+{rx.items.length - 4}</span>}
                        </div>
                      )}
                      {rx.doctorNote && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--mist)', marginTop: 8, lineHeight: 1.4 }}>
                          📋 {rx.doctorNote}
                        </p>
                      )}
                      {/* VIEW DIGITAL RX — intentionally non-functional as per requirements */}
                      <div style={{
                        marginTop: 12, padding: '10px 14px',
                        background: 'var(--wire)', borderRadius: 'var(--r-sm)',
                        textAlign: 'center', fontSize: 'var(--text-xs)',
                        color: 'var(--mist)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        VIEW DIGITAL RX
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <p className="m-section-label">Archive</p>
              <div className="m-card" style={{ margin: '0 16px 16px', overflow: 'hidden' }}>
                {past.map((rx: any, i: number) => (
                  <div key={rx.id} className="m-row" style={{ borderBottom: i < past.length - 1 ? '1px solid var(--wire)' : 'none' }}>
                    <div className="m-row-icon"><FileText size={16} /></div>
                    <div className="m-row-body">
                      <div className="m-row-title">{rx.title}</div>
                      <div className="m-row-sub">{rx.doctor?.name ?? 'Doctor'} · {new Date(rx.startDate).toLocaleDateString()}</div>
                    </div>
                    <span className="m-chip m-chip-mist">Completed</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {prescriptions.length === 0 && (
            <div className="m-empty">
              <FileText size={40} />
              <h3>No Prescriptions</h3>
              <p>Your treatment records will appear here once a doctor issues a prescription.</p>
            </div>
          )}
        </>
      )}

      {tab === 'timeline' && (
        <div className="m-timeline">
          {prescriptions.length === 0 ? (
            <div className="m-empty"><FileText size={40} /><h3>No Records</h3></div>
          ) : (
            prescriptions.map((rx: any) => (
              <div key={rx.id} className="m-tl-item">
                <div className="m-tl-spine">
                  <div className="m-tl-dot" />
                  <div className="m-tl-line" />
                </div>
                <div className="m-tl-card" style={{ marginBottom: 8 }}>
                  <div className="m-tl-tag">{rx.doctor?.specialty ?? 'Clinical Excellence'}</div>
                  <div className="m-tl-title">{rx.title}</div>
                  <div className="m-tl-sub">{rx.doctor?.name ?? 'Doctor'}</div>
                  <div className="m-tl-meta">
                    <span>{new Date(rx.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>·</span>
                    <span style={{ color: 'var(--neon)' }}>{rx.durationDays ?? 0} days</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
