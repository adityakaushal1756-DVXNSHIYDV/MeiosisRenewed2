import { differenceInDays, parseISO } from 'date-fns';
import { Calendar, FileText, Pill, Users, ChevronRight, AlertTriangle } from 'lucide-react';

type Section = string;
interface Props {
  data: any;
  patientId: string;
  onNavigate: (s: Section) => void;
}

export function DashboardPage({ data, onNavigate }: Props) {
  const today = new Date();
  const appointments = data?.appointments ?? [];
  const prescriptions = data?.prescriptions ?? [];
  const records = data?.records ?? [];

  const upcomingApts = appointments
    .filter((a: any) => new Date(a.scheduledDate) >= today)
    .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const nextApt = upcomingApts[0];

  const activePrescriptions = prescriptions.filter((p: any) => {
    const end = new Date(p.startDate);
    end.setDate(end.getDate() + (p.durationDays ?? 0));
    return end >= today;
  });

  const latestRx = activePrescriptions[0] ?? prescriptions[0];

  const newReports = records.filter((r: any) =>
    r.type === 'LAB_REPORT' &&
    differenceInDays(today, parseISO(r.date ?? r.createdAt ?? '2020-01-01')) < 30
  ).length;

  return (
    <div className="m-fade-in">
      {/* Greeting strip */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--wire)' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--mist)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
          Good {today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening'}
        </p>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--white)' }}>
          {data?.patient?.name?.split(' ')[0] ?? 'Patient'}
        </h2>
      </div>

      {/* Stats */}
      <div className="m-stat-strip">
        <div className="m-stat" onClick={() => onNavigate('appointments')} style={{ cursor: 'pointer' }}>
          <div className="m-stat-val">{upcomingApts.length}</div>
          <div className="m-stat-label">Upcoming Visits</div>
        </div>
        <div className="m-stat" onClick={() => onNavigate('prescriptions')} style={{ cursor: 'pointer' }}>
          <div className="m-stat-val">{activePrescriptions.length}</div>
          <div className="m-stat-label">Active Tracks</div>
        </div>
        <div className="m-stat" onClick={() => onNavigate('records')} style={{ cursor: 'pointer' }}>
          <div className="m-stat-val">{newReports}</div>
          <div className="m-stat-label">New Reports</div>
        </div>
        <div className="m-stat" onClick={() => onNavigate('medicines')} style={{ cursor: 'pointer' }}>
          <div className="m-stat-val">{prescriptions.reduce((sum: number, p: any) => sum + (p.items?.length ?? 0), 0)}</div>
          <div className="m-stat-label">Total Meds</div>
        </div>
      </div>

      {/* Next appointment */}
      <p className="m-section-label">Next Appointment</p>
      {nextApt ? (
        <div className="m-apt-card" style={{ margin: '0 16px 8px' }} onClick={() => onNavigate('appointments')}>
          <div className="m-apt-card-header">
            <div>
              <div className="m-apt-card-doctor">{nextApt.doctor?.name ?? 'Doctor'}</div>
              <div className="m-apt-card-date">
                {new Date(nextApt.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {nextApt.slotStartTime ? ` · ${new Date(nextApt.slotStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </div>
              <div className="m-apt-card-meta">{nextApt.mode === 'IN_PERSON' ? 'In-person' : 'Teleconsult'} · {nextApt.doctor?.hospital ?? 'Clinic'}</div>
            </div>
            <span className="m-chip m-chip-green">Upcoming</span>
          </div>
          <div className="m-apt-card-actions">
            <button className="m-btn m-btn-ghost m-btn-sm" style={{ flex: 1 }}>Details</button>
            <button className="m-btn m-btn-primary m-btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); onNavigate('appointments'); }}>Book More</button>
          </div>
        </div>
      ) : (
        <div style={{ margin: '0 16px 8px' }}>
          <div className="m-card m-card-p">
            <div className="m-empty" style={{ padding: '16px 0' }}>
              <Calendar size={32} />
              <p>No upcoming appointments. Tap to book one.</p>
              <button className="m-btn m-btn-primary m-btn-sm" onClick={() => onNavigate('appointments')}>Book Appointment</button>
            </div>
          </div>
        </div>
      )}

      {/* Active prescription */}
      {latestRx && (
        <>
          <p className="m-section-label">Active Prescription</p>
          <div style={{ margin: '0 16px 8px' }} onClick={() => onNavigate('prescriptions')}>
            <div className="m-rx-slab">
              <div className="m-rx-header">
                <div>
                  <div className="m-rx-title">{latestRx.title}</div>
                  <div className="m-rx-doctor">{latestRx.doctor?.name ?? 'Doctor'} · {latestRx.doctor?.specialty ?? 'General Medicine'}</div>
                </div>
                <div className="m-rx-days">
                  <strong>
                    {Math.max(0, (latestRx.durationDays ?? 0) - differenceInDays(today, parseISO(latestRx.startDate ?? today.toISOString())))}d
                  </strong>
                  left
                </div>
              </div>
              {latestRx.items?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {latestRx.items.slice(0, 4).map((item: any, i: number) => (
                    <span key={i} className="m-chip m-chip-mist">{item.medicine} {item.dose}</span>
                  ))}
                  {latestRx.items.length > 4 && <span className="m-chip m-chip-mist">+{latestRx.items.length - 4}</span>}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Quick actions */}
      <p className="m-section-label">Quick Access</p>
      <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { label: 'Health Records', icon: FileText, section: 'records', color: 'var(--neon)' },
          { label: 'Medicines', icon: Pill, section: 'medicines', color: 'var(--sky)' },
          { label: 'Doctor Network', icon: Users, section: 'network', color: '#a78bfa' },
          { label: 'Emergency QR', icon: AlertTriangle, section: 'nfc', color: '#f87171', danger: true },
        ].map(({ label, icon: Icon, section, color, danger }) => (
          <button
            key={section}
            className="m-card m-card-p"
            onClick={() => onNavigate(section)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left',
              border: danger ? '1px solid rgba(239,68,68,0.25)' : undefined,
              background: danger ? 'rgba(239,68,68,0.05)' : undefined,
              cursor: 'pointer', width: '100%',
            }}
          >
            <Icon size={22} color={color} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: danger ? '#f87171' : 'var(--white)' }}>{label}</span>
              <ChevronRight size={14} color="var(--mist-2)" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
