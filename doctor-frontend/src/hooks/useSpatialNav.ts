import { RefObject, useEffect } from 'react';

type Dir = 'up' | 'down' | 'left' | 'right';

/* ── geometry helpers ──────────────────────────────────────── */
function cx(r: DOMRect) { return r.left + r.width  / 2; }
function cy(r: DOMRect) { return r.top  + r.height / 2; }

/* ── focusable query ───────────────────────────────────────── */
const FOCUSABLE = [
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Returns all visible, pointer-enabled focusable descendants,
 *  excluding anything inside a [data-nav-skip] container. */
function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    el => el.offsetParent !== null
       && getComputedStyle(el).pointerEvents !== 'none'
       && !el.closest('[data-nav-skip]'),
  );
}

/* ── attribute walkers ─────────────────────────────────────── */
/** Nearest ancestor (exclusive) with data-nav-group */
function navGroupEl(el: HTMLElement): HTMLElement | null {
  let cur: HTMLElement | null = el.parentElement;
  while (cur) {
    if (cur.dataset.navGroup !== undefined) return cur;
    cur = cur.parentElement;
  }
  return null;
}

/** Nearest ancestor (exclusive) with data-nav-panel */
function navPanelEl(el: HTMLElement): HTMLElement | null {
  let cur: HTMLElement | null = el.parentElement;
  while (cur) {
    if (cur.dataset.navPanel !== undefined) return cur;
    cur = cur.parentElement;
  }
  return null;
}

/* ── can we steal the key from this element? ───────────────── */
function canLeave(el: HTMLElement, dir: Dir): boolean {
  const tag = el.tagName;

  if (tag === 'TEXTAREA') {
    const ta = el as HTMLTextAreaElement;
    const val = ta.value;
    const start = ta.selectionStart ?? 0;
    const end   = ta.selectionEnd   ?? 0;
    if (dir === 'left')  return start === 0;
    if (dir === 'right') return end   === val.length;
    if (dir === 'up')    return !val.slice(0, start).includes('\n');
    if (dir === 'down')  return !val.slice(end).includes('\n');
  }

  if (tag === 'INPUT') {
    const inp = el as HTMLInputElement;
    const typ = inp.type.toLowerCase();
    if (['date', 'number', 'range', 'time', 'month', 'week'].includes(typ)) {
      if (dir === 'up' || dir === 'down') return false;
    }
    if (['text', 'email', 'search', 'password', 'tel', 'url', ''].includes(typ)) {
      const start = inp.selectionStart ?? 0;
      const end   = inp.selectionEnd   ?? inp.value.length;
      if (dir === 'left')  return start === 0;
      if (dir === 'right') return end   === inp.value.length;
    }
  }

  if (tag === 'SELECT') {
    if (dir === 'up' || dir === 'down') return false;
  }

  return true;
}

/* ── spatial nearest-neighbor ──────────────────────────────── */
function findNearest(
  candidates: HTMLElement[],
  active: HTMLElement,
  dir: Dir,
  crossPenalty = 1.8,
): HTMLElement | null {
  const ar = active.getBoundingClientRect();
  const ax = cx(ar), ay = cy(ar);

  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of candidates) {
    if (el === active) continue;
    const r = el.getBoundingClientRect();
    const ex = cx(r), ey = cy(r);
    const dx = ex - ax, dy = ey - ay;

    const inDir =
      dir === 'up'    ? dy < -4 :
      dir === 'down'  ? dy >  4 :
      dir === 'left'  ? dx < -4 :
                        dx >  4;
    if (!inDir) continue;

    const primary = (dir === 'up' || dir === 'down') ? Math.abs(dy) : Math.abs(dx);
    const cross   = (dir === 'up' || dir === 'down') ? Math.abs(dx) : Math.abs(dy);

    let overlapBonus = 0;
    if (dir === 'up' || dir === 'down') {
      const overlapX = Math.min(ar.right, r.right) - Math.max(ar.left, r.left);
      if (overlapX > 0) overlapBonus = -cross * 0.6;
    } else {
      const overlapY = Math.min(ar.bottom, r.bottom) - Math.max(ar.top, r.top);
      if (overlapY > 0) overlapBonus = -cross * 0.6;
    }

    const score = primary + cross * crossPenalty + overlapBonus;
    if (score < bestScore) { bestScore = score; best = el; }
  }

  return best;
}

/* ── group-boundary DOM-order entry ────────────────────────── */
/**
 * When crossing a group boundary (UP/DOWN), snap to the first-in-DOM-order
 * element at the nearest "row" of the candidate set.
 *
 * Example: pressing UP from any lab-chip snaps to the medicine-name input
 * (first in DOM order) of the last rx-table row, never to frequency/route.
 */
function findGroupBoundaryEntry(
  candidates: HTMLElement[],
  active: HTMLElement,
  dir: 'up' | 'down',
): HTMLElement | null {
  const ay = cy(active.getBoundingClientRect());

  const inDir = candidates.filter(el => {
    const ey = cy(el.getBoundingClientRect());
    return dir === 'up' ? ey < ay - 4 : ey > ay + 4;
  });
  if (inDir.length === 0) return null;

  const distances = inDir.map(el => Math.abs(cy(el.getBoundingClientRect()) - ay));
  const minDist = Math.min(...distances);

  // Collect all elements in the same "row" as the nearest (within 16px)
  const boundaryRow = inDir.filter((_, i) => distances[i] <= minDist + 16);

  // Return the first by DOM order so column-1 (medicine) wins over column-3 (frequency)
  return boundaryRow.reduce<HTMLElement | null>((first, el) => {
    if (!first) return el;
    return first.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING
      ? el
      : first;
  }, null);
}

/* ── the hook ──────────────────────────────────────────────── */
/**
 * Attach to a container ref. Arrow-keys move focus between all focusable
 * descendants with panel/group awareness:
 *
 *  data-nav-panel  — marks a visual column; UP/DOWN is confined to the same
 *                    panel and never crosses to a neighbouring panel.
 *  data-nav-group  — marks a repeating region (e.g. rx-table rows, lab-chips);
 *                    UP/DOWN within a group uses a high cross-axis penalty to
 *                    preserve column alignment; crossing groups snaps to the
 *                    first-in-DOM element at the group boundary.
 *  data-nav-skip   — element (and its descendants) are invisible to the hook.
 *
 *  LEFT/RIGHT always searches spatially across all panels.
 */
export function useSpatialNav(containerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    function onKeyDown(e: KeyboardEvent) {
      const dirMap: Record<string, Dir> = {
        ArrowUp: 'up', ArrowDown: 'down',
        ArrowLeft: 'left', ArrowRight: 'right',
      };
      const dir = dirMap[e.key];
      if (!dir) return;

      const active = document.activeElement as HTMLElement | null;
      if (!active || !root!.contains(active)) return;
      if (!canLeave(active, dir)) return;

      const all = focusables(root!);
      let target: HTMLElement | null = null;

      if (dir === 'up' || dir === 'down') {
        const activeGroup = navGroupEl(active);
        const activePanel = navPanelEl(active);

        // Phase 1: within same group — high cross-axis penalty to preserve column
        if (activeGroup) {
          const groupFocusables = all.filter(el => navGroupEl(el) === activeGroup);
          target = findNearest(groupFocusables, active, dir, 3.5);
        }

        if (!target) {
          // Phase 2: cross groups but stay within same panel
          if (activePanel) {
            const panelFocusables = all.filter(el => {
              if (navPanelEl(el) !== activePanel) return false;
              if (activeGroup !== null && navGroupEl(el) === activeGroup) return false;
              return true;
            });

            if (activeGroup !== null) {
              // Snap to first-in-DOM of the adjacent group boundary
              target = findGroupBoundaryEntry(panelFocusables, active, dir);
            } else {
              // Not in any group: regular spatial within panel
              target = findNearest(panelFocusables, active, dir, 3.0);
            }
          }
        }

        // Phase 3: was in a group but phase 2 still found nothing → full panel search
        if (!target && activePanel && activeGroup) {
          const panelFocusables = all.filter(el => navPanelEl(el) === activePanel);
          target = findNearest(panelFocusables, active, dir, 3.0);
        }

        // Phase 4: don't cross panels on UP/DOWN — stay put at panel edge
      } else {
        // LEFT/RIGHT: full spatial search across all panels
        target = findNearest(all, active, dir, 1.8);
      }

      if (!target) return;

      e.preventDefault();
      target.focus();

      // Place cursor at the logical entry point
      if (target.tagName === 'INPUT') {
        const inp = target as HTMLInputElement;
        const typ = inp.type.toLowerCase();
        if (['text', 'email', 'search', 'password', 'tel', 'url', ''].includes(typ)) {
          const pos = (dir === 'right' || dir === 'down') ? 0 : inp.value.length;
          inp.setSelectionRange(pos, pos);
        }
      }
      if (target.tagName === 'TEXTAREA') {
        const ta = target as HTMLTextAreaElement;
        const pos = (dir === 'right' || dir === 'down') ? 0 : ta.value.length;
        ta.setSelectionRange(pos, pos);
      }
    }

    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [containerRef]);
}
