import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { visibleModules } from "@/lib/dashboard/module-visibility";
import { DASHBOARD_MODULES } from "@/lib/dashboard/navigation";

/**
 * The permission list has to actually reach the sidebar.
 *
 * module-visibility hides every module that names a required permission unless
 * the viewer holds one of them, and it fails CLOSED by design: "a page that
 * could not work out who you are should not conclude you may see the money."
 *
 * That is right, and it is why this went unnoticed. `permissions` was never
 * passed by the dashboard layout, so it defaulted to [] through DashboardShell,
 * DashboardChrome and Sidebar, and the answer for every viewer was nobody. The
 * sidebar showed exactly the modules naming no permission — Families,
 * Communications, Workflows, Calendar, Documents — and silently dropped
 * Admissions, Student Success, Scholarships, Finance, Workforce, Scheduling and
 * Teacher Studio. For the Founder, and for every School Leader.
 *
 * The map below had its own test and passed it the whole time. Nothing asserted
 * that the list ever arrived. The seam is where it broke, so the seam is what
 * these tests hold.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
/** Assert on code, not on the comments that describe it. */
const code = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const layout = code(read("src/app/dashboard/layout.tsx"));
const shell = code(read("src/components/dashboard/DashboardShell.tsx"));
const chrome = code(read("src/components/dashboard/DashboardChrome.tsx"));

describe("the prop is passed at every hop", () => {
  /** THE ONE THAT MATTERS. This is the hop that was missing. */
  it("the layout hands the identity's permissions to the shell", () => {
    expect(layout).toContain("permissions={ctx.permissions}");
  });

  it("the shell forwards them to the chrome", () => {
    expect(shell).toContain("permissions={permissions}");
  });

  it("the chrome forwards them to the sidebar", () => {
    expect(chrome).toContain("permissions={permissions}");
  });
});

describe("what an empty list costs, so nobody loosens the default instead", () => {
  const ids = (mods: readonly { id: string }[]) => mods.map((m) => m.id);

  it("hides every permission-bearing module when nothing arrives", () => {
    const shown = ids(visibleModules(DASHBOARD_MODULES, []));
    for (const hidden of [
      "admissions",
      "students",
      "scholarships",
      "finance",
      "hr",
      "scheduling",
      "teacher",
    ]) {
      expect(shown).not.toContain(hidden);
    }
  });

  /**
   * Failing closed is correct and must stay. The bug was never that [] hides
   * things — it is that [] was what the layout sent.
   *
   * IT USED TO NAME calendar AND documents, AND THEY MOVED ON 16 OCTOBER 2026.
   *
   * Jimmy, asked which of the six unmapped modules Mahogany Murphy may keep:
   * "just admissions n families". Five gained an entry, and three of those
   * five - Communications, Calendar and Documents - had no permission key in
   * platform_permissions at all, which is exactly why they were shown to
   * everybody. Migration 560 created the three and granted them to every role
   * but hers.
   *
   * So this assertion was correct until that commit and is now false, and the
   * right response is to move the EXAMPLE rather than the POINT. Families is
   * the module that still names no permission - deliberately, it is one of the
   * two she keeps - so it is what an empty list still shows.
   *
   * If Families is ever mapped too, this test fails and whoever does it has to
   * decide what an empty list means when nothing at all survives it. That is a
   * better outcome than the assertion quietly becoming vacuous.
   */
  it("still shows the modules that name no permission", () => {
    const shown = ids(visibleModules(DASHBOARD_MODULES, []));
    expect(shown).toContain("families");

    /* And the three that gained a key in 560 now fail closed with the rest. */
    expect(shown).not.toContain("communications");
    expect(shown).not.toContain("calendar");
    expect(shown).not.toContain("documents");
  });

  it("shows admissions to someone holding an admissions permission", () => {
    const shown = ids(visibleModules(DASHBOARD_MODULES, ["admissions.view"]));
    expect(shown).toContain("admissions");
    // and still not the money
    expect(shown).not.toContain("finance");
  });
});
