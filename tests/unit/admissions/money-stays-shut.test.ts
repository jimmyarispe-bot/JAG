import { describe, expect, it } from "vitest";
import { ADMISSIONS_CASE_PROFILE_SECTIONS } from "@/lib/admissions/profile/sections";
import { userHasAnyPermission } from "@/lib/platform/profile/access";

/**
 * ONLY MONEY PEOPLE SEE MONEY.
 *
 * Jimmy's rule, in his words: "only danni n me see anything related to money."
 *
 * On 16 September the Scholarships & Funding section on every child's card
 * required ["admissions.view", "admissions.manage", "admissions.accept"] and
 * rendered the requested amount, the approved amount and the family's HOUSEHOLD
 * INCOME. Section permissions are ANY-OF. Heather Badger-Brown and Nina Gaddy
 * hold all three admissions keys, so every School Leader could read every
 * family's household income on every child.
 *
 * Migrations 349, 357 and 358 had denied them every fund/scholarship/finance
 * key. Those denies worked - on the funding PAGES. This section asked for none
 * of those keys, so nothing they denied was ever consulted.
 *
 * These are the real permission sets, so the test fails if somebody widens the
 * section OR if a School Leader is ever granted a money key.
 */

const SCHOOL_LEADER = [
  "ACADEMYOS_ACCESS",
  "admissions.view",
  "admissions.manage",
  "admissions.accept",
  "students.view",
  "students.edit",
  "families.manage",
  "REPORTING_ACCESS",
];

/** Danni: CEO. Jimmy: FOUNDER, everything. Both must keep seeing it. */
const CEO = [...SCHOOL_LEADER, "scholarships.view", "scholarships.approve", "finance.view"];

function sectionByKey(key: string) {
  const s = ADMISSIONS_CASE_PROFILE_SECTIONS.find((x) => x.key === key);
  if (!s) throw new Error(`no ${key} section registered`);
  return s;
}

describe("the money section on a child's card", () => {
  const money = sectionByKey("scholarships");

  /** THE ONE THAT MATTERS. */
  it("is hidden from a School Leader", () => {
    expect(
      userHasAnyPermission(SCHOOL_LEADER, [...money.permissions]),
      "a School Leader can see household income and award amounts on a child's card"
    ).toBe(false);
  });

  it("is visible to someone with money access", () => {
    expect(userHasAnyPermission(CEO, [...money.permissions])).toBe(true);
  });

  /**
   * The exact old bug: admissions keys on a money section. ANY-OF means one of
   * these is enough, so none of them may appear.
   */
  it.each(["admissions.view", "admissions.manage", "admissions.accept"])(
    "does not accept %s as a reason to show money",
    (key) => {
      expect(money.permissions).not.toContain(key);
    }
  );

  it("names at least one real money permission", () => {
    expect(money.permissions.length).toBeGreaterThan(0);
    expect(
      money.permissions.some((p) => /fund|financ|scholarship/.test(p))
    ).toBe(true);
  });
});

describe("the rest of the card still opens for the people who run admissions", () => {
  /**
   * The counterweight. A fix that quietly locked Heather out of the child she
   * is admitting would be worse than the bug - she would stop trusting the
   * card and go back to email.
   */
  it.each([
    "overview",
    "prospect",
    "applications",
    "documents",
    "visits",
    "communications",
    "tasks",
    "notes",
  ])("%s is still visible to a School Leader", (key) => {
    const s = sectionByKey(key);
    expect(userHasAnyPermission(SCHOOL_LEADER, [...s.permissions])).toBe(true);
  });
});
