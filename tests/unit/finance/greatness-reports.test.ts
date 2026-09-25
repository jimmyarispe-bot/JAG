import { describe, expect, it } from "vitest";
import {
  GREATNESS_DROPDOWN_MAX,
  checkGreatnessClaim,
  greatnessAppliesTo,
  greatnessGross,
  greatnessMaxFor,
  greatnessMonthOf,
} from "@/lib/finance/greatness-reports";

/**
 * The rule these tests exist for, in one sentence: a weekly cap cannot hold a
 * monthly limit. Everything below is that sentence, checked.
 */

const SEPT = "2026-09-21"; // a Monday
const DEC = "2026-12-07";
const MAY = "2026-05-04";

describe("which weeks GREATNESS Reports apply to", () => {
  it("applies in an ordinary month", () => {
    expect(greatnessAppliesTo(SEPT)).toBe(true);
  });

  it("does not apply in December or May, when parent conferences happen", () => {
    expect(greatnessAppliesTo(DEC)).toBe(false);
    expect(greatnessAppliesTo(MAY)).toBe(false);
  });

  it("belongs to the month of its Monday, so a straddling week is not counted twice", () => {
    // Mon 30 Nov 2026 runs into December; the allowance it spends is November's.
    expect(greatnessMonthOf("2026-11-30")).toBe("2026-11");
  });
});

describe("the ceiling", () => {
  it("is the children she taught, when nothing has been claimed yet", () => {
    expect(
      greatnessMaxFor({
        weekStart: SEPT,
        distinctChildrenThisWeek: 8,
        claimedElsewhereThisMonth: 0,
      })
    ).toBe(8);
  });

  it("SHRINKS BY WHAT THE MONTH HAS ALREADY SPENT - the whole point", () => {
    expect(
      greatnessMaxFor({
        weekStart: SEPT,
        distinctChildrenThisWeek: 10,
        claimedElsewhereThisMonth: 10,
      })
    ).toBe(0);
  });

  it("never goes negative, even if the month is somehow over its allowance", () => {
    expect(
      greatnessMaxFor({
        weekStart: SEPT,
        distinctChildrenThisWeek: 4,
        claimedElsewhereThisMonth: 9,
      })
    ).toBe(0);
  });

  it("is zero in a month where reports are not claimed", () => {
    expect(
      greatnessMaxFor({
        weekStart: DEC,
        distinctChildrenThisWeek: 20,
        claimedElsewhereThisMonth: 0,
      })
    ).toBe(0);
  });

  it("never exceeds the top of the dropdown", () => {
    expect(
      greatnessMaxFor({
        weekStart: SEPT,
        distinctChildrenThisWeek: 200,
        claimedElsewhereThisMonth: 0,
      })
    ).toBe(GREATNESS_DROPDOWN_MAX);
  });
});

describe("what may be claimed", () => {
  const base = { weekStart: SEPT, distinctChildrenThisWeek: 8, claimedElsewhereThisMonth: 0 };

  it("accepts a number within the ceiling", () => {
    expect(checkGreatnessClaim({ ...base, claimed: 8 }).ok).toBe(true);
  });

  it("always accepts zero", () => {
    expect(checkGreatnessClaim({ ...base, claimed: 0 }).ok).toBe(true);
    expect(checkGreatnessClaim({ ...base, weekStart: DEC, claimed: 0 }).ok).toBe(true);
  });

  it("refuses more than the children she taught, and says both numbers", () => {
    const verdict = checkGreatnessClaim({ ...base, claimed: 9 });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.reason).toContain("9");
    expect(verdict.reason).toContain("8");
  });

  it("refuses the SECOND week of claiming the same children", () => {
    // Ten children, ten claimed last week. This week must be refused even
    // though ten is within "children taught this week".
    const verdict = checkGreatnessClaim({
      weekStart: SEPT,
      distinctChildrenThisWeek: 10,
      claimedElsewhereThisMonth: 10,
      claimed: 10,
    });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.reason).toContain("already claimed 10 this month");
  });

  it("refuses anything at all in December, and names the month", () => {
    const verdict = checkGreatnessClaim({ ...base, weekStart: DEC, claimed: 1 });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.reason).toContain("December");
  });

  it("refuses a fraction or a negative", () => {
    expect(checkGreatnessClaim({ ...base, claimed: 1.5 }).ok).toBe(false);
    expect(checkGreatnessClaim({ ...base, claimed: -1 }).ok).toBe(false);
  });

  it("never says only that something is invalid - every refusal carries numbers", () => {
    const refusals = [
      checkGreatnessClaim({ ...base, claimed: 9 }),
      checkGreatnessClaim({ ...base, weekStart: DEC, claimed: 1 }),
      checkGreatnessClaim({
        weekStart: SEPT,
        distinctChildrenThisWeek: 10,
        claimedElsewhereThisMonth: 10,
        claimed: 3,
      }),
    ];
    for (const verdict of refusals) {
      expect(verdict.ok).toBe(false);
      if (verdict.ok) continue;
      expect(verdict.reason.length).toBeGreaterThan(40);
      expect(/\d/.test(verdict.reason)).toBe(true);
    }
  });
});

describe("what it pays", () => {
  it("is five dollars each, linear", () => {
    expect(greatnessGross(7, 5)).toBe(35);
  });

  it("is nothing for nothing", () => {
    expect(greatnessGross(0, 5)).toBe(0);
  });

  it("rounds to the cent rather than carrying float noise", () => {
    expect(greatnessGross(3, 5.55)).toBe(16.65);
  });
});
