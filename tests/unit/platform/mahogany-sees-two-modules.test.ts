/**
 * WHAT MAHOGANY MURPHY SEES, AND WHAT SHE DOES NOT.
 *
 * Jimmy, 15 October 2026: "mahogany.murphy@theacademyway.org needs to only
 * have access to student applications - contact information etc. she does not
 * and should not see any other pages/button or anything else that is not
 * currently enrolled students"
 *
 * and on 16 October, asked which of the six modules shown to everybody she may
 * keep: "just admissions n families".
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * module-visibility.ts said, in its own comment, that a module absent from the
 * map is shown to everyone - written on 21 September when the only question
 * was money. Six were absent. Giving her a three-permission role closed none
 * of them, and the role alone would have left her looking at Founder Morning
 * Brief, Communications, Workflows, Calendar and Documents.
 *
 * The permissions are real rows (559, 560). This is the half that decides what
 * is on her screen, and it is checked here against the exact set she holds.
 */

import { describe, it, expect } from "vitest";

import { MODULE_REQUIRED_PERMISSIONS, visibleModules } from "@/lib/dashboard/module-visibility";
import { DASHBOARD_MODULES } from "@/lib/dashboard/navigation";
import { landsOnAdmissionsBoard } from "@/lib/dashboard/landing";

/* Exactly what VIRTUAL_COORDINATOR grants, read back from
   platform_role_permissions on 16 October. Three rows, no more. */
const MAHOGANY = ["students.view", "students.edit", "admissions.view"] as const;

/* SCHOOL_LEADER's keys for the five modules in question, so the test can show
   that hiding them from her does not hide them from Nina. */
const NINA = [
  "students.view", "students.edit", "admissions.view", "admissions.manage",
  "school.configure", "executive.dashboard", "workflows.view",
  "communications.view", "calendar.view", "documents.view",
] as const;

function sidebar(permissions: readonly string[]): string[] {
  return visibleModules(DASHBOARD_MODULES, permissions).map((m) => m.id);
}

describe("Mahogany Murphy's sidebar", () => {
  it("shows Admissions, Families and Students and nothing else", () => {
    /* Families is deliberately unmapped and therefore shown - it is one of the
       two Jimmy named. Students is here because he asked for view and edit on
       every child, and enrolled children live in that module. */
    expect(sidebar(MAHOGANY).sort()).toEqual(["admissions", "families", "students"]);
  });

  it.each(["executive", "communications", "workflows", "calendar", "documents"])(
    "does not show %s",
    (id) => {
      expect(sidebar(MAHOGANY)).not.toContain(id);
    }
  );

  it.each(["finance", "scholarships", "hr", "teacher", "scheduling", "school-leader"])(
    "still does not show %s",
    (id) => {
      /* These were already hidden by permission before today. The test says so
         rather than assuming 559 did not disturb them. */
      expect(sidebar(MAHOGANY)).not.toContain(id);
    }
  );

  it("lands her on the admissions board, because /dashboard is now hidden from her", () => {
    /* Half a change otherwise: hiding the executive module hides the page she
       would otherwise arrive on, with no way back to it from her own sidebar. */
    expect(landsOnAdmissionsBoard({ roles: ["VIRTUAL_COORDINATOR"] } as never)).toBe(true);
  });
});

describe("hiding them from her does not hide them from anyone else", () => {
  it("Nina still sees all five", () => {
    const hers = sidebar(NINA);
    for (const id of ["executive", "communications", "workflows", "calendar", "documents"]) {
      expect(hers).toContain(id);
    }
  });

  it("every module the five name is a real key somebody holds", () => {
    /* THE FAILURE THIS GUARDS AGAINST: a map entry naming a key that exists in
       no role hides that module from everybody, permanently and in silence.
       NINA above is read from the database, so if a key here is not in that
       list it is either misspelled or ungranted. */
    for (const id of ["executive", "communications", "workflows", "calendar", "documents"] as const) {
      const required = MODULE_REQUIRED_PERMISSIONS[id];
      expect(required, `${id} must be mapped`).toBeTruthy();
      expect(
        required!.some((key) => (NINA as readonly string[]).includes(key)),
        `${id} names ${required!.join(" / ")}, none of which Nina holds`
      ).toBe(true);
    }
  });
});
