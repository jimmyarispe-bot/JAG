import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * THE FEATURE HAS TO BE CONNECTED TO SOMETHING.
 *
 * 15 September 2026: the walkthroughs shipped in ea503a21 — GuideProvider,
 * GuideChooser, GuidePanel, a fifty-walkthrough catalog, 84 passing tests. The
 * one line that MOUNTS them in the dashboard layout was left out of the git
 * add. Everything built. Everything went green. The feature sat in production
 * for two days rendering nothing, and it was found by a person opening the
 * dashboard and looking for it.
 *
 * Every piece had tests and every test passed, because each tested a piece in
 * isolation. Nothing asserted the pieces were wired together. The seam is
 * always where it breaks — the same lesson as the `permissions` prop in this
 * very layout, which had a passing permission-map test and was never passed in.
 *
 * So this test does not check a component. It checks the WIRE.
 */

const root = path.join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("the walkthroughs are mounted, not just written", () => {
  const layout = read("src/app/dashboard/layout.tsx");

  it.each(["GuideProvider", "GuideChooser", "GuidePanel"])(
    "the dashboard layout imports %s",
    (name) => {
      expect(
        layout,
        `${name} is not imported in src/app/dashboard/layout.tsx — the component exists but nothing renders it`
      ).toContain(`import { ${name} }`);
    }
  );

  it.each(["<GuideProvider", "<GuideChooser", "<GuidePanel"])(
    "the dashboard layout renders %s",
    (tag) => {
      expect(
        layout,
        `${tag} is imported but never rendered — an import alone mounts nothing`
      ).toContain(tag);
    }
  );

  /**
   * Progress and the "stop opening this" choice are stored per person. Without
   * a userId they would be shared by everyone using the same browser.
   */
  it("passes the signed-in user to the provider", () => {
    expect(layout).toMatch(/<GuideProvider\s+userId=\{[^}]+\}/);
  });

  /** Children must stay inside the provider, or useGuide returns null. */
  it("keeps the page inside the provider", () => {
    const open = layout.indexOf("<GuideProvider");
    const kids = layout.indexOf("{children}", open);
    const close = layout.indexOf("</GuideProvider>", open);
    expect(open, "GuideProvider not found").toBeGreaterThan(-1);
    expect(kids, "{children} is not inside GuideProvider").toBeGreaterThan(open);
    expect(close, "{children} is not inside GuideProvider").toBeGreaterThan(kids);
  });

  /** Proves the assertions above can fail rather than matching anything. */
  it("does not find a component that was never written", () => {
    expect(layout).not.toContain("<GuideNonsense");
  });
});
