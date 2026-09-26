import { describe, expect, it } from "vitest";
import {
  WEEKLY_WORK_KINDS,
  checkWeeklyWorkClaim,
  weeklyWorkGross,
  weeklyWorkKind,
  weeklyWorkOptions,
} from "@/lib/finance/weekly-work";

const admin = weeklyWorkKind("admin_hourly")!;
const tutoring = weeklyWorkKind("private_tutoring")!;

describe("the kinds on record", () => {
  it("knows admin hours and private tutoring", () => {
    expect(admin).toBeTruthy();
    expect(tutoring).toBeTruthy();
    expect(WEEKLY_WORK_KINDS).toHaveLength(2);
  });

  it("does NOT call Jessica's tutoring 'tutoring', because a Tutoring course already exists", () => {
    // Two prices on one name is how somebody reconciles the wrong one.
    expect(tutoring.code).toBe("private_tutoring");
    expect(WEEKLY_WORK_KINDS.map((k) => k.code)).not.toContain("tutoring");
  });

  it("still says 'tutoring sessions' to the teacher, because that is what she does", () => {
    expect(tutoring.question.toLowerCase()).toContain("tutoring sessions");
  });
});

describe("who may claim", () => {
  it("accepts a quantity within the cap from somebody with the rate", () => {
    expect(checkWeeklyWorkClaim({ kind: tutoring, quantity: 3, hasRate: true }).ok).toBe(true);
    expect(checkWeeklyWorkClaim({ kind: admin, quantity: 6, hasRate: true }).ok).toBe(true);
  });

  it("accepts zero from anybody", () => {
    expect(checkWeeklyWorkClaim({ kind: admin, quantity: 0, hasRate: false }).ok).toBe(true);
  });

  it("REFUSES anything from somebody without the rate - the rate is the permission", () => {
    const verdict = checkWeeklyWorkClaim({ kind: admin, quantity: 3, hasRate: false });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.reason).toContain("rate on record");
  });

  it("refuses over the cap and names both numbers", () => {
    const verdict = checkWeeklyWorkClaim({ kind: admin, quantity: 12, hasRate: true });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.reason).toContain("12");
    expect(verdict.reason).toContain("10");
  });

  it("tells somebody over the cap to speak to Jimmy rather than split the week", () => {
    const verdict = checkWeeklyWorkClaim({ kind: tutoring, quantity: 99, hasRate: true });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.reason).toContain("Jimmy");
  });

  it("refuses a negative", () => {
    expect(checkWeeklyWorkClaim({ kind: admin, quantity: -1, hasRate: true }).ok).toBe(false);
  });
});

describe("what it pays", () => {
  it("prices Katie's six admin hours at twenty-five", () => {
    expect(weeklyWorkGross(6, 25)).toBe(150);
  });

  it("prices Jessica's three sessions at thirty-five", () => {
    expect(weeklyWorkGross(3, 35)).toBe(105);
  });

  it("pays nothing with no rate rather than guessing one", () => {
    expect(weeklyWorkGross(3, 0)).toBe(0);
  });

  it("rounds to the cent", () => {
    expect(weeklyWorkGross(3, 25.555)).toBe(76.67);
  });
});

describe("the dropdowns", () => {
  it("offers zero to ten for admin hours", () => {
    expect(weeklyWorkOptions(admin)).toHaveLength(11);
  });

  it("offers headroom above Jessica's usual two or three sessions", () => {
    const options = weeklyWorkOptions(tutoring);
    expect(options[0]).toBe(0);
    expect(options[options.length - 1]).toBe(20);
  });
});
