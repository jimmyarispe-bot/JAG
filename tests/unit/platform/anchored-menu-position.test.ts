import { describe, expect, it } from "vitest";
import {
  ANCHORED_MENU_VIEWPORT_MARGIN,
  computeAnchoredMenuPosition,
} from "@/components/platform/crud/anchored-menu-position";

const MARGIN = ANCHORED_MENU_VIEWPORT_MARGIN;
const MENU = { width: 192, height: 120 };

function assertInsideViewport(
  pos: { top: number; left: number },
  viewport: { width: number; height: number },
  menu = MENU
) {
  expect(pos.left).toBeGreaterThanOrEqual(MARGIN);
  expect(pos.top).toBeGreaterThanOrEqual(MARGIN);
  expect(pos.left + menu.width).toBeLessThanOrEqual(viewport.width - MARGIN);
  expect(pos.top + menu.height).toBeLessThanOrEqual(viewport.height - MARGIN);
}

describe("computeAnchoredMenuPosition", () => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
    { width: 375, height: 667 },
  ];

  for (const viewport of viewports) {
    describe(`${viewport.width}×${viewport.height}`, () => {
      it("keeps a right-edge trigger menu fully on-screen (opens leftward)", () => {
        const trigger = {
          top: 80,
          left: viewport.width - 48,
          right: viewport.width - 16,
          bottom: 112,
          width: 32,
          height: 32,
        };
        const pos = computeAnchoredMenuPosition({
          trigger,
          menu: MENU,
          viewport,
          preferredAlign: "end",
        });
        expect(pos.align).toBe("end");
        assertInsideViewport(pos, viewport);
        // Menu should sit to the left of the trigger's right edge.
        expect(pos.left + MENU.width).toBeLessThanOrEqual(trigger.right + 0.5);
      });

      it("flips above when the trigger is near the bottom edge", () => {
        const trigger = {
          top: viewport.height - 48,
          left: viewport.width - 80,
          right: viewport.width - 48,
          bottom: viewport.height - 16,
          width: 32,
          height: 32,
        };
        const pos = computeAnchoredMenuPosition({
          trigger,
          menu: MENU,
          viewport,
          preferredAlign: "end",
        });
        expect(pos.side).toBe("top");
        assertInsideViewport(pos, viewport);
      });

      it("opens below when there is room under a mid-viewport trigger", () => {
        const trigger = {
          top: 200,
          left: Math.max(MARGIN, viewport.width - 200),
          right: Math.max(MARGIN + 32, viewport.width - 168),
          bottom: 232,
          width: 32,
          height: 32,
        };
        const pos = computeAnchoredMenuPosition({
          trigger,
          menu: MENU,
          viewport,
          preferredAlign: "end",
        });
        expect(pos.side).toBe("bottom");
        assertInsideViewport(pos, viewport);
      });
    });
  }

  it("pins oversized menus to the 16px origin when they cannot fully fit", () => {
    const viewport = { width: 320, height: 480 };
    const menu = { width: 300, height: 400 };
    const trigger = {
      top: 400,
      left: 280,
      right: 312,
      bottom: 432,
      width: 32,
      height: 32,
    };
    const pos = computeAnchoredMenuPosition({
      trigger,
      menu,
      viewport,
      preferredAlign: "end",
    });
    // Best-effort: stay at least margin from the top/left origin.
    expect(pos.left).toBe(MARGIN);
    expect(pos.top).toBe(MARGIN);
  });
});

