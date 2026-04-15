import { useState } from 'react';
import {
  Activity,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

/* Same icon list as Sidebar.tsx */
const NAV_ICONS: { key: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'queue',     icon: Users           },
  { key: 'search',    icon: Search          },
  { key: 'messages',  icon: MessageSquare   },
  { key: 'schedule',  icon: CalendarClock   },
  { key: 'calendar',  icon: CalendarDays    },
  { key: 'analytics', icon: Activity        },
  { key: 'settings',  icon: Settings        },
];

const TRIGGER_W = 18;
const PANEL_W   = 300;

interface HoverRevealSidebarProps {
  /** Called when the user clicks a nav item; key is a NavKey string. */
  onNavigate: (key: string) => void;
  /** Base z-index. Panel renders at zIndex + 1. */
  zIndex: number;
}

/**
 * Left-edge hover-reveal sidebar.
 * Matches the exact visual style of the persistent doctor dashboard console.
 * Drop inside any fixed full-screen overlay — the trigger strip and panel are
 * position:fixed so they always anchor to the viewport's left edge.
 */
export function HoverRevealSidebar({ onNavigate, zIndex }: HoverRevealSidebarProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  /* Same shape/shadow as Sidebar panelStyle, but:
     - left corners are flush (0) so the panel is edge-to-edge with the viewport
     - background is fully opaque so nothing bleeds through
     - left edge extends 8px off-screen to hide any sub-pixel gap */
  const panelStyle: React.CSSProperties = {
    borderRadius: '0 32px 32px 0',
    border: '1px solid var(--doctor-border)',
    borderLeft: 'none',
    background:
      'linear-gradient(180deg, var(--doctor-bg-start, #031525) 0%, var(--doctor-bg-end, #04111d) 100%)',
    boxShadow: open
      ? '0 28px 90px rgba(0,0,0,0.75), 24px 0 64px rgba(0,0,0,0.50)'
      : '0 28px 90px rgba(0,0,0,0.50)',
  };

  return (
    <>
      {/* ── Invisible left-edge trigger strip ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: TRIGGER_W,
          zIndex,
          cursor: 'default',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setOpen(true)}
      />

      {/* ── Sliding panel ── */}
      {/*
        Animation: perspective + rotateY gives the paper-fold feel.
        transform-origin: left center so the panel folds out from its left edge.
        Spring open (cubic-bezier with slight overshoot), quick snap shut.
      */}
      <aside
        className="flex flex-col"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          /* Extend 8px past the left viewport edge so no sub-pixel gap */
          left: -8,
          width: PANEL_W + 8,
          zIndex: zIndex + 1,

          /* Push content right to compensate for the -8px bleed */
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 28,
          paddingRight: 20,

          /* Paper-fold animation — anchor at left edge */
          transformOrigin: '0% 50%',
          transform: open
            ? 'perspective(1100px) translateX(0px) rotateY(0deg)'
            : 'perspective(1100px) translateX(-110%) rotateY(-14deg)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',

          transition: open
            ? 'transform 390ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease, box-shadow 320ms ease'
            : 'transform 210ms cubic-bezier(0.4,0,1,1), opacity 160ms ease, box-shadow 200ms ease',

          ...panelStyle,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseLeave={() => setOpen(false)}
      >
        {/* ── Logo — identical to Sidebar ── */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-neon text-xl font-black text-slate-950">
            M
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-white">
              MEIOSIS
            </h1>
            <p className="truncate text-sm text-mist">Doctor Console</p>
          </div>
        </div>

        {/* ── Nav items — identical classes to Sidebar ── */}
        <nav className="scroll-skin flex flex-1 flex-col gap-2 overflow-auto pr-1">
          {NAV_ICONS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setOpen(false);
                onNavigate(key);
              }}
              className="group rounded-3xl border border-transparent bg-white/[0.02] px-4 py-3 text-left text-white/84 transition-[background-color,border-color,transform,box-shadow] duration-220 ease-out hover:border-wire/10 hover:bg-white/[0.04]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-wire/8 bg-slate-950/20 text-mist transition-[background-color,border-color,color,transform] duration-220 ease-out group-hover:text-white">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">
                    {t(`nav.${key}`)}
                  </div>
                  <div className="mt-1 truncate text-xs text-mist">
                    {t(`nav.${key}.sub`)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
