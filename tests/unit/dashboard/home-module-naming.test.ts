import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DASHBOARD_MODULES, moduleForViewer } from "@/lib/dashboard/navigation";

/**
 * A School Leader's dashboard should not be called the Founder Morning Brief.
 *
 * The module at /dashboard is id `executive`, named "Founder Morning Brief".
 * Nina Gaddy and Heather Badger-Brown opened their dashboard on 14 September and
 * the page was titled that. They never saw the founder's brief — the page
 * branches on JAG_ACCESS and renders a plain greeting and Quick Launch for them.
 * Only the NAME was the founder's, which is arguably worse: it tells a School
 * Leader she is looking at something that belongs to somebody else.
 *
 * The Sidebar already renamed it inline. TopNav rendered the raw module. So the
 * sidebar said "Home" and the header directly above it said "Founder Morning
 * Brief", on the same screen, for the same person.
 *
 * The rename now lives in one function and both callers use it.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
/** Assert on code, not on the comments that describe it. */
const code = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const home = DASHBOARD_MODULES.find((m) => m.id === "executive")!;

describe("the home module is named for whoever is reading it", () => {
  it("keeps the founder's own name for the founder", () => {
    const m = moduleForViewer(home, { isFounder: true, isExecutiveDirector: false });
    expect(m.pageTitle).toBe("Founder Morning Brief");
    expect(m.sidebarLabel).toBe("Founder Morning Brief");
  });

  /** THE ONE THAT MATTERS. This is what Nina and Heather were shown. */
  it("never shows a School Leader the founder's name", () => {
    const m = moduleForViewer(home, { isFounder: false, isExecutiveDirector: false });
    expect(m.pageTitle).toBe("Home");
    expect(m.sidebarLabel).toBe("Home");
    expect(m.pageTitle).not.toContain("Founder");
    expect(m.pageSubtitle).not.toContain("Founder");
  });

  it("names the Executive Director's home for her", () => {
    const m = moduleForViewer(home, { isFounder: false, isExecutiveDirector: true });
    expect(m.pageTitle).toBe("Executive Director");
  });

  it("leaves every other module alone", () => {
    for (const mod of DASHBOARD_MODULES.filter((m) => m.id !== "executive")) {
      expect(moduleForViewer(mod, { isFounder: false, isExecutiveDirector: false })).toBe(mod);
    }
  });
});

describe("both surfaces rename, because only one of them used to", () => {
  const sidebar = code(read("src/components/dashboard/Sidebar.tsx"));
  const topnav = code(read("src/components/dashboard/TopNav.tsx"));
  const chrome = code(read("src/components/dashboard/DashboardChrome.tsx"));

  it("the sidebar uses the shared helper rather than its own copy", () => {
    expect(sidebar).toContain("moduleForViewer(module, { isFounder, isExecutiveDirector })");
    // The inline duplicate is gone; a second copy is how the two drifted apart.
    expect(sidebar).not.toContain('sidebarLabel: isExecutiveDirector ? "Executive Director"');
  });

  it("the header renames too — this is the half that was missing", () => {
    expect(topnav).toContain("moduleForViewer(getModuleByPath(pathname, branding)");
  });

  it("the chrome actually passes the viewer down to the header", () => {
    expect(chrome).toMatch(/<TopNav[\s\S]{0,260}isFounder=\{isFounder\}/);
    expect(chrome).toMatch(/<TopNav[\s\S]{0,320}isExecutiveDirector=\{isExecutiveDirector\}/);
  });
});
