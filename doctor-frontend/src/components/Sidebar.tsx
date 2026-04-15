import { Activity, CalendarClock, CalendarDays, ChevronLeft, ChevronRight, LayoutDashboard, Menu, MessageSquare, Search, Settings, Users, X } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export type NavKey = 'dashboard' | 'queue' | 'search' | 'messages' | 'schedule' | 'calendar' | 'analytics' | 'settings';

const NAV_ICONS: { key: NavKey; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'queue',     icon: Users           },
  { key: 'search',    icon: Search          },
  { key: 'messages',  icon: MessageSquare   },
  { key: 'schedule',  icon: CalendarClock   },
  { key: 'calendar',  icon: CalendarDays    },
  { key: 'analytics', icon: Activity        },
  { key: 'settings',  icon: Settings        },
];

const RAIL_WIDTH = 80; // px — icon-only collapsed width

interface SidebarProps {
  active: NavKey;
  mobileOpen: boolean;
  collapsibleEnabled?: boolean;
  collapsed?: boolean;
  consoleWidth?: number;
  onChange: (key: NavKey) => void;
  onToggleMobile: () => void;
  onToggleCollapsed?: () => void;
}

export function Sidebar({
  active,
  mobileOpen,
  collapsibleEnabled = false,
  collapsed = false,
  consoleWidth = 300,
  onChange,
  onToggleMobile,
  onToggleCollapsed,
}: SidebarProps) {
  const { t } = useTranslation();

  // Rail mode: collapsible feature is on AND user has collapsed it
  const rail = collapsibleEnabled && collapsed;

  // How much space the sidebar occupies in the flex layout on desktop
  const desktopWidth = rail ? RAIL_WIDTH : consoleWidth;

  // ── Shared nav list ───────────────────────────────────────
  function NavItems({ railMode }: { railMode: boolean }) {
    return (
      <nav className="scroll-skin flex flex-1 flex-col gap-2 overflow-auto pr-1">
        {NAV_ICONS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              onChange(key);
              if (window.innerWidth < 1280) onToggleMobile();
            }}
            title={railMode ? t(`nav.${key}`) : undefined}
            className={[
              'group rounded-3xl border transition-[background-color,border-color,transform,box-shadow] duration-220 ease-out',
              railMode
                ? 'flex items-center justify-center px-2 py-3'
                : 'px-4 py-3 text-left',
              active === key
                ? 'border-neon/30 bg-neonSoft text-white'
                : 'border-transparent bg-white/[0.02] text-white/84 hover:border-wire/10 hover:bg-white/[0.04]'
            ].join(' ')}
          >
            {railMode ? (
              <div className={[
                'flex h-10 w-10 items-center justify-center rounded-2xl transition-[background-color,color] duration-220 ease-out',
                active === key
                  ? 'border-neon/20 bg-slate-950/40 text-neon'
                  : 'border-wire/8 bg-slate-950/20 text-mist group-hover:text-white'
              ].join(' ')}>
                <Icon size={18} />
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className={[
                  'mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl transition-[background-color,border-color,color,transform] duration-220 ease-out flex-shrink-0',
                  active === key
                    ? 'border-neon/20 bg-slate-950/40 text-neon'
                    : 'border-wire/8 bg-slate-950/20 text-mist group-hover:text-white'
                ].join(' ')}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{t(`nav.${key}`)}</div>
                  <div className="mt-1 truncate text-xs text-mist">{t(`nav.${key}.sub`)}</div>
                </div>
              </div>
            )}
          </button>
        ))}
      </nav>
    );
  }

  const panelStyle: React.CSSProperties = {
    borderRadius: 32,
    border: '1px solid var(--doctor-border)',
    background:
      'linear-gradient(180deg, color-mix(in srgb, var(--doctor-card-tint) 96%, transparent), color-mix(in srgb, var(--doctor-card-tint) 88%, transparent))',
    boxShadow: '0 28px 90px rgba(0,0,0,0.50)',
  };

  return (
    <>
      {/* ── Mobile hamburger ─────────────────────────────── */}
      <button
        onClick={onToggleMobile}
        className="fixed left-4 top-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-wire/10 text-white shadow-glass backdrop-blur xl:hidden"
        style={{
          background: 'color-mix(in srgb, var(--doctor-card-tint) 92%, transparent)',
          borderColor: 'var(--doctor-border)',
        }}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* ── Desktop persistent sidebar (all pages except emr_v2) ── */}
      <div
        className="hidden xl:block flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: desktopWidth }}
      >
        <aside className="flex h-full flex-col p-5" style={{ ...panelStyle, width: rail ? RAIL_WIDTH : consoleWidth }}>
          {/* Logo */}
          <div className={`mb-8 flex items-center ${rail ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neon text-xl font-black text-slate-950 flex-shrink-0">
              M
            </div>
            {!rail && (
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight text-white">MEIOSIS</h1>
                <p className="truncate text-sm text-mist">Doctor Console</p>
              </div>
            )}
          </div>

          <NavItems railMode={rail} />

          {/* Collapse / expand toggle — only when collapsible feature is on */}
          {collapsibleEnabled && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              title={collapsed ? 'Expand console' : 'Collapse console'}
              className={`mt-4 flex items-center rounded-2xl border border-wire/10 bg-white/[0.03] transition hover:bg-white/[0.06] ${rail ? 'justify-center px-2 py-3' : 'gap-2 px-4 py-3 text-sm text-mist'}`}
            >
              {collapsed
                ? <ChevronRight size={16} />
                : <><ChevronLeft size={16} /><span>Collapse</span></>
              }
            </button>
          )}
        </aside>
      </div>

      {/* ── Mobile overlay sidebar ────────────────────────── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 xl:hidden',
          'transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: consoleWidth, padding: '24px 0 24px 16px' }}
      >
        <div className="flex h-full flex-col p-5" style={panelStyle}>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neon text-xl font-black text-slate-950 flex-shrink-0">
              M
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-white">MEIOSIS</h1>
              <p className="truncate text-sm text-mist">Doctor Console</p>
            </div>
          </div>
          <NavItems railMode={false} />
        </div>
      </aside>

      {/* ── Mobile backdrop ───────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 xl:hidden"
          style={{ background: 'color-mix(in srgb, var(--doctor-bg-end) 72%, transparent)' }}
          onClick={onToggleMobile}
        />
      )}
    </>
  );
}
