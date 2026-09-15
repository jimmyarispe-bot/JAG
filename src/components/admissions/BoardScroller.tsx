"use client";

import { useCallback, useRef, useState } from "react";

/**
 * The board is wider than the screen, and nothing said so.
 *
 * WHAT HAPPENED. 15 September 2026. A School Leader was looking for Julian
 * Oubre Towa. He was on the board the whole time — The Academy Virtual, Shadow
 * Days Scheduled, waiting since 25 August. Shadow Days Scheduled is the tenth
 * of nineteen columns. She never saw it.
 *
 * The container has always had `overflow-x-auto`, so as far as the code was
 * concerned it scrolled. But modern browsers draw OVERLAY scrollbars: the bar
 * is invisible until something scrolls, and on a mouse without a horizontal
 * wheel nothing ever does. The result is a surface that is scrollable in theory
 * and a dead end in practice — and it fails silently, which is why it survived
 * this long. Everyone who tested it had a trackpad.
 *
 * So this does three things the bare div could not:
 *
 *   1. Forces the scrollbar to be VISIBLE and thick enough to grab, in every
 *      browser, whether or not anything is moving.
 *   2. Puts arrow buttons at both ends, which is the control a person actually
 *      reaches for, and disables them at the extremes so the ends are legible.
 *   3. Says how far along you are — "columns 1–4 of 19" — because the honest
 *      problem was never the scrolling. It was not knowing there was anything
 *      to the right.
 *
 * The scroll container is focusable, so arrow keys work for anyone who cannot
 * use a mouse — the same reason the buttons exist.
 */

/** One column plus its gap: w-72 (18rem = 288px) + gap-4 (1rem = 16px). */
const COLUMN_STRIDE = 304;

export interface BoardScrollerProps {
  /** How many columns are inside, for the position readout. */
  columnCount: number;
  children: React.ReactNode;
}

export function BoardScroller({ columnCount, children }: BoardScrollerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: 0, max: 0, width: 0 });

  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    setPos({
      left: node.scrollLeft,
      max: Math.max(0, node.scrollWidth - node.clientWidth),
      width: node.clientWidth,
    });
  }, []);

  /**
   * A callback ref rather than an effect.
   *
   * The first measurement has to happen once the node exists and has been laid
   * out. Doing that in an effect is the cascading-render pattern lint keeps
   * catching in this codebase; a ref callback runs at exactly the right moment
   * and reads as what it is.
   */
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      measure(node);
    },
    [measure]
  );

  function scrollBy(direction: -1 | 1) {
    const node = ref.current;
    if (!node) return;
    // A whole column at a time. Scrolling by a fraction leaves a sliver of the
    // next card showing, which reads as a rendering fault rather than a hint.
    node.scrollBy({ left: direction * COLUMN_STRIDE, behavior: "smooth" });
  }

  const canLeft = pos.left > 4;
  const canRight = pos.left < pos.max - 4;
  const scrollable = pos.max > 4;

  // Which columns are on screen. Rounded outward, so a half-visible column
  // counts as visible — it is, and saying otherwise confuses more than it helps.
  const firstVisible = Math.min(columnCount, Math.floor(pos.left / COLUMN_STRIDE) + 1);
  const lastVisible = Math.min(
    columnCount,
    Math.max(firstVisible, Math.ceil((pos.left + pos.width) / COLUMN_STRIDE))
  );

  const arrow =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm enabled:hover:bg-slate-100 disabled:opacity-30";

  return (
    <div>
      {/*
        * Only drawn when there is genuinely something off screen. A disabled
        * pair of arrows over a board that fits is furniture implying a feature.
        */}
      {scrollable && (
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canLeft}
            className={arrow}
            aria-label="Scroll the board left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canRight}
            className={arrow}
            aria-label="Scroll the board right"
          >
            →
          </button>
          <span className="text-xs text-slate-500">
            Stages{" "}
            <strong className="text-slate-700">
              {firstVisible}–{lastVisible}
            </strong>{" "}
            of {columnCount}
            {canRight && " — there are more to the right"}
          </span>
        </div>
      )}

      {/*
        * The scrollbar is forced visible. Overlay scrollbars are the default on
        * macOS and increasingly on Windows, and an invisible scrollbar on a
        * surface twice the width of the screen is how a child goes missing.
        */}
      <style>{`
        .jag-board-scroll {
          scrollbar-width: auto;
          scrollbar-color: #94a3b8 #e2e8f0;
        }
        .jag-board-scroll::-webkit-scrollbar {
          height: 14px;
          -webkit-appearance: none;
        }
        .jag-board-scroll::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .jag-board-scroll::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border: 3px solid #e2e8f0;
          border-radius: 9999px;
        }
        .jag-board-scroll::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      <div
        ref={attach}
        onScroll={() => measure(ref.current)}
        tabIndex={0}
        role="region"
        aria-label="Admissions pipeline stages"
        className="jag-board-scroll flex gap-4 overflow-x-auto pb-4"
      >
        {children}
      </div>
    </div>
  );
}
