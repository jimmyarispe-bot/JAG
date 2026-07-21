/** Viewport padding for anchored menus / popovers (px). */
export const ANCHORED_MENU_VIEWPORT_MARGIN = 16;

export type RectLike = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type AnchoredMenuPosition = {
  top: number;
  left: number;
  /** Vertical side relative to the trigger */
  side: "top" | "bottom";
  /** Horizontal alignment: end = right edges aligned (opens leftward) */
  align: "start" | "end";
};

/**
 * Positions a fixed menu relative to a trigger with flip + clamp collision.
 * Prefers below the trigger. Horizontal preference defaults to end (right-aligned
 * so the menu stays left of a right-edge trigger). Flips above near the bottom
 * edge and flips/clamps horizontally to keep a 16px viewport margin.
 */
export function computeAnchoredMenuPosition(input: {
  trigger: RectLike;
  menu: { width: number; height: number };
  viewport: { width: number; height: number };
  margin?: number;
  gap?: number;
  /** Preferred horizontal alignment before collision flips. */
  preferredAlign?: "start" | "end";
}): AnchoredMenuPosition {
  const margin = input.margin ?? ANCHORED_MENU_VIEWPORT_MARGIN;
  const gap = input.gap ?? 4;
  const preferredAlign = input.preferredAlign ?? "end";
  const { trigger, menu, viewport } = input;

  const spaceBelow = viewport.height - margin - (trigger.bottom + gap);
  const spaceAbove = trigger.top - gap - margin;
  const side: "top" | "bottom" =
    spaceBelow >= menu.height || spaceBelow >= spaceAbove ? "bottom" : "top";

  let top =
    side === "bottom"
      ? trigger.bottom + gap
      : trigger.top - gap - menu.height;

  const endLeft = trigger.right - menu.width;
  const startLeft = trigger.left;
  const endFits =
    endLeft >= margin && endLeft + menu.width <= viewport.width - margin;
  const startFits =
    startLeft >= margin && startLeft + menu.width <= viewport.width - margin;

  let align: "start" | "end";
  let left: number;

  if (preferredAlign === "end") {
    if (endFits) {
      align = "end";
      left = endLeft;
    } else if (startFits) {
      align = "start";
      left = startLeft;
    } else {
      // Near right edge: keep menu to the left of the trigger.
      align = "end";
      left = endLeft;
    }
  } else if (startFits) {
    align = "start";
    left = startLeft;
  } else if (endFits) {
    align = "end";
    left = endLeft;
  } else {
    align = "start";
    left = startLeft;
  }

  const maxLeft = Math.max(margin, viewport.width - margin - menu.width);
  const maxTop = Math.max(margin, viewport.height - margin - menu.height);
  left = Math.min(Math.max(left, margin), maxLeft);
  top = Math.min(Math.max(top, margin), maxTop);

  return { top, left, side, align };
}
