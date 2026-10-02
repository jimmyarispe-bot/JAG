import { describe, expect, it } from "vitest";

import {
  isTeacherOnly,
  isTeacherOnlyHome,
  TEACHER_ONLY_HOME,
} from "@/lib/platform/identity/teacher-only";

/**
 * A teacher sees one page.
 *
 * This module shipped on 2 October with no test at all, which is the wrong
 * way round for the thing that decides whether thirteen people can reach
 * their own work. The cases below are the real ones, taken from production on
 * the day it shipped rather than invented.
 *
 * THE TWO WAYS THIS CAN BE WRONG, and they are not symmetrical:
 *
 *   Too narrow - a teacher keeps the sidebar. Jimmy's instruction is not
 *   followed, somebody emails like Peter did, and it gets fixed.
 *
 *   Too wide - somebody who is not only a teacher is locked to one page and
 *   loses the rest of their job with no error on screen. Nobody emails,
 *   because the page looks like it is working.
 *
 * So most of what follows is the second kind.
 */

/** What TEAM_MEMBER grants. Every provisioned user has it. */
const DEFAULT = "ACADEMYOS_ACCESS";

describe("who is locked to one page", () => {
  it("locks a teacher who holds only the teacher gate", () => {
    // Twelve of the thirteen on 2 October: Peter, Holly, Craig and the rest.
    expect(isTeacherOnly(["TEACHER_ACCESS"])).toBe(true);
  });

  it("locks a teacher who also carries the default TEAM_MEMBER gate", () => {
    /*
     * Renee Tracewell, the thirteenth. ACADEMYOS_ACCESS is deliberately not
     * disqualifying - see the comment on OTHER_GATES. If this test ever goes
     * red because somebody added that gate to the list, the fix is to remove
     * it again, not to change this expectation: every provisioned user holds
     * it, so counting it makes the whole module a no-op.
     */
    expect(isTeacherOnly(["TEACHER_ACCESS", DEFAULT])).toBe(true);
  });
});

describe("who keeps the full dashboard", () => {
  it("leaves somebody with no teacher gate alone", () => {
    // Heather and Nina - SCHOOL_LEADER.
    expect(
      isTeacherOnly([DEFAULT, "ADMISSIONS_ACCESS", "SIS_ACCESS", "REPORTING_ACCESS"])
    ).toBe(false);
  });

  it("leaves the Founder alone, who holds the teacher gate and every other", () => {
    expect(
      isTeacherOnly([
        "TEACHER_ACCESS",
        DEFAULT,
        "ADMISSIONS_ACCESS",
        "SIS_ACCESS",
        "FINANCE_ACCESS",
        "SYSTEM_ADMIN_ACCESS",
      ])
    ).toBe(false);
  });

  /*
   * THE GAP THAT WAS FOUND BY COUNTING. Until 2 October the rule examined
   * nine of the catalogue's eighteen gates, so each of these people would
   * have been locked to one page and silently lost their other work. Nobody
   * held these combinations on the day, which is why it was a gap and not an
   * incident.
   */
  it.each([
    ["HR", ["HR_ACCESS", "PAYROLL_ACCESS"]],
    ["payroll", ["PAYROLL_ACCESS"]],
    ["banking", ["BANKING_ACCESS"]],
    ["audit", ["AUDIT_ACCESS"]],
    ["the form builder", ["FORM_BUILDER_ACCESS"]],
    ["JAG", ["JAG_ACCESS"]],
    ["an org-scoped JAG seat", ["JAG_ORG_ACCESS"]],
    ["accounting", ["ACCOUNTING_ACCESS"]],
  ])("does not lock a teacher who also does %s", (_what, gates) => {
    expect(isTeacherOnly(["TEACHER_ACCESS", DEFAULT, ...gates])).toBe(false);
  });

  it("leaves a parent or student account alone", () => {
    expect(isTeacherOnly(["PARENT_ACCESS"])).toBe(false);
    expect(isTeacherOnly(["STUDENT_ACCESS"])).toBe(false);
  });
});

describe("when the permission list cannot be trusted", () => {
  /*
   * Erring towards the full dashboard. A read that fails must not lock
   * somebody out of their own work - a locked-out School Leader cannot reach
   * the screen that would tell her why.
   */
  it("returns false for an empty, null or undefined list", () => {
    expect(isTeacherOnly([])).toBe(false);
    expect(isTeacherOnly(null)).toBe(false);
    expect(isTeacherOnly(undefined)).toBe(false);
  });

  it("ignores a permission that is not a gate at all", () => {
    expect(isTeacherOnly(["TEACHER_ACCESS", "instruction.executive"])).toBe(true);
  });
});

describe("which paths count as the teacher's own page", () => {
  it("accepts the page itself and anything nested under it", () => {
    expect(isTeacherOnlyHome(TEACHER_ONLY_HOME)).toBe(true);
    expect(isTeacherOnlyHome(`${TEACHER_ONLY_HOME}/anything`)).toBe(true);
  });

  it("refuses every other dashboard page", () => {
    expect(isTeacherOnlyHome("/dashboard")).toBe(false);
    expect(isTeacherOnlyHome("/dashboard/teacher")).toBe(false);
    expect(isTeacherOnlyHome("/dashboard/teacher/executive")).toBe(false);
    expect(isTeacherOnlyHome("/dashboard/admissions")).toBe(false);
  });

  /*
   * A near-miss that should NOT pass: a sibling route whose name merely
   * starts with the same characters. startsWith is on `${HOME}/`, not on
   * HOME, precisely so this stays false.
   */
  it("refuses a sibling route with a similar name", () => {
    expect(isTeacherOnlyHome("/dashboard/teacher/weekly-report")).toBe(false);
  });
});
