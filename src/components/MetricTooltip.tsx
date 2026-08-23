'use client';

// The "what does this metric mean?" tooltip.
//
// It renders into a portal rather than next to its trigger. The metric tables sit
// inside an `overflow-x-auto` container so they can scroll sideways on narrow
// screens, and CSS computes the other overflow axis to `auto` as soon as one axis
// is not `visible` - so an absolutely positioned tooltip was clipped at the top of
// the scroll box. A fixed-position portal escapes every clipping ancestor.
//
// It also flips below the trigger when there is no room above, and clamps to the
// viewport so it never runs off the side on a phone.

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

/** Matches the previous `sm:w-64`; narrowed on small screens by the clamp below. */
const PREFERRED_WIDTH = 256;
/** Space between the trigger and the bubble, leaving room for the arrow. */
const GAP = 10;
/** Minimum distance from the viewport edge. */
const EDGE = 8;

interface Placement {
  top: number;
  left: number;
  width: number;
  /** Arrow offset from the bubble's left edge, so it keeps pointing at the icon. */
  arrowLeft: number;
  above: boolean;
}

interface MetricTooltipProps {
  /** Metric name, used for the accessible label. */
  label: string;
  text: string;
  /** Whether this tooltip is the one currently pinned open by a click. */
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function MetricTooltip({ label, text, open, onToggle, onClose }: MetricTooltipProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [mounted, setMounted] = useState(false);

  const visible = open || hovered;

  // Portals need a DOM target, which does not exist during server rendering.
  useEffect(() => setMounted(true), []);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;

    const anchor = trigger.getBoundingClientRect();
    const width = Math.min(PREFERRED_WIDTH, window.innerWidth - EDGE * 2);
    const height = bubble.offsetHeight;

    // Prefer above, which is where the pointer is not, but fall below when the
    // trigger is near the top of the window.
    const above = anchor.top >= height + GAP + EDGE;
    const top = above ? anchor.top - height - GAP : anchor.bottom + GAP;

    const centred = anchor.left + anchor.width / 2 - width / 2;
    const left = Math.max(EDGE, Math.min(centred, window.innerWidth - width - EDGE));

    setPlacement({
      top,
      left,
      width,
      // Clamped so the arrow stays on the bubble even when the bubble is shifted.
      arrowLeft: Math.max(12, Math.min(anchor.left + anchor.width / 2 - left, width - 12)),
      above,
    });
  }, []);

  // Measure once the bubble is in the DOM, then keep it anchored while the page
  // moves under it.
  useLayoutEffect(() => {
    if (!visible) {
      setPlacement(null);
      return;
    }

    reposition();

    // `true` captures scrolling inside the table's own scroll container, not just
    // the window.
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [visible, reposition]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const bubble = (
    <div
      ref={bubbleRef}
      role="tooltip"
      // Marked as a tooltip container so the page's outside-click handler does not
      // treat a click on the bubble itself as a click away.
      className="tooltip-container pointer-events-none fixed z-[100] rounded-lg bg-gray-900 px-3 py-2 text-center text-xs text-white shadow-lg dark:bg-gray-700 sm:text-sm"
      style={{
        width: placement?.width ?? PREFERRED_WIDTH,
        top: placement?.top ?? 0,
        left: placement?.left ?? 0,
        // Hidden until measured, so it never flashes in the wrong place.
        visibility: placement ? 'visible' : 'hidden',
      }}
    >
      {text}
      {placement && (
        <div
          className={`absolute h-0 w-0 border-l-4 border-r-4 border-transparent ${
            placement.above
              ? 'top-full border-t-4 border-t-gray-900 dark:border-t-gray-700'
              : 'bottom-full border-b-4 border-b-gray-900 dark:border-b-gray-700'
          }`}
          style={{ left: placement.arrowLeft - 4 }}
        />
      )}
    </div>
  );

  return (
    <span className="tooltip-container inline-flex">
      <button
        ref={triggerRef}
        type="button"
        // A button rather than a bare icon, so it is reachable by keyboard.
        aria-label={`What is ${label}?`}
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded p-1 text-gray-400 transition-colors duration-200 hover:text-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <HelpCircle size={14} />
      </button>
      {mounted && visible && createPortal(bubble, document.body)}
    </span>
  );
}
