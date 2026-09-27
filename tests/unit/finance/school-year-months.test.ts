import { describe, expect, it } from "vitest";

import {
  monthsInSchoolYear,
  monthsRemainingInSchoolYear,
  prorationForStudent,
} from "@/lib/finance/school-year-months";

/**
 * The four campuses as migration 444 corrected them on 27 September 2026.
 * These are the real dates, not fixtures — if production ever disagrees with
 * this table, one of the two is wrong and it matters.
 */
const FL = { startDate: "2026-06-01", endDate: "2027-05-31" };
const GA = { startDate: "2026-06-01", endDate: "2027-05-31" };
const VIRTUAL = { startDate: "2026-08-01", endDate: "2027-05-31" };
const HS = { startDate: "2026-08-01", endDate: "2027-05-31" };

describe("months in a school year", () => {
  it("counts June to May as twelve for FL and GA", () => {
    expect(monthsInSchoolYear(FL)).toBe(12);
    expect(monthsInSchoolYear(GA)).toBe(12);
  });

  it("counts August to May as ten for Virtual and HS", () => {
    expect(monthsInSchoolYear(VIRTUAL)).toBe(10);
    expect(monthsInSchoolYear(HS)).toBe(10);
  });

  it("counts a single month as one, not zero", () => {
    expect(monthsInSchoolYear({ startDate: "2026-08-01", endDate: "2026-08-31" })).toBe(1);
  });

  it("refuses a year that ends before it starts", () => {
    expect(() =>
      monthsInSchoolYear({ startDate: "2027-05-31", endDate: "2026-06-01" })
    ).toThrow(/ends before it starts/);
  });

  it("refuses a date that is not a date", () => {
    expect(() =>
      monthsInSchoolYear({ startDate: "June 2026", endDate: "2027-05-31" })
    ).toThrow(/YYYY-MM-DD/);
  });
});

describe("months remaining, twelve-month campus", () => {
  const cases: ReadonlyArray<readonly [string, number]> = [
    ["2026-06-01", 12],
    ["2026-07-15", 11],
    ["2026-10-01", 8],
    ["2027-01-08", 5],
    ["2027-05-31", 1],
  ];

  for (const [start, expected] of cases) {
    it(`${start} leaves ${expected}`, () => {
      expect(monthsRemainingInSchoolYear(GA, start)).toBe(expected);
    });
  }
});

describe("months remaining, ten-month campus", () => {
  const cases: ReadonlyArray<readonly [string, number]> = [
    ["2026-08-01", 10],
    ["2026-10-01", 8],
    ["2026-11-06", 7],
    ["2027-05-01", 1],
  ];

  for (const [start, expected] of cases) {
    it(`${start} leaves ${expected}`, () => {
      expect(monthsRemainingInSchoolYear(VIRTUAL, start)).toBe(expected);
    });
  }

  /**
   * June and July are billable months at Virtual and HS, but they sit OUTSIDE
   * the contracted year and are charged separately. A family naming a July
   * start still gets the ten-month year, never eleven.
   */
  it("does not invent an eleventh month for a July start", () => {
    expect(monthsRemainingInSchoolYear(VIRTUAL, "2026-07-01")).toBe(10);
    expect(monthsRemainingInSchoolYear(VIRTUAL, "2026-06-15")).toBe(10);
  });
});

describe("months remaining refuses rather than guessing", () => {
  it("throws when the student starts after the year has ended", () => {
    expect(() => monthsRemainingInSchoolYear(GA, "2027-06-01")).toThrow(
      /after the school year ends/
    );
  });

  it("names the student start date when it is malformed", () => {
    expect(() => monthsRemainingInSchoolYear(GA, "01/10/2026")).toThrow(
      /Student start date/
    );
  });
});

describe("the pair buildPlan is given", () => {
  it("is 8 of 12 for a Georgia student starting 1 October", () => {
    expect(prorationForStudent(GA, "2026-10-01")).toEqual({
      monthsAttending: 8,
      monthsInYear: 12,
      isFullYear: false,
    });
  });

  it("is 8 of 10 for a Virtual student starting the same day", () => {
    expect(prorationForStudent(VIRTUAL, "2026-10-01")).toEqual({
      monthsAttending: 8,
      monthsInYear: 10,
      isFullYear: false,
    });
  });

  it("marks a student who is there all year as full year", () => {
    expect(prorationForStudent(GA, "2026-06-01").isFullYear).toBe(true);
    expect(prorationForStudent(VIRTUAL, "2026-08-01").isFullYear).toBe(true);
  });
});

/**
 * The money, stated once so a change to the arithmetic has to argue with a
 * dollar figure rather than with a ratio.
 *
 * Both call sites currently pass `monthsInYear: 12` for every campus. The
 * Virtual line below is what that costs: $10,000 charged where $12,000 is
 * owed, on one student, for one year.
 */
describe("what the hard-coded twelve costs", () => {
  const cents = (dollars: number) => Math.round(dollars * 100);
  const prorate = (annual: number, p: { monthsAttending: number; monthsInYear: number }) =>
    Math.round((cents(annual) * p.monthsAttending) / p.monthsInYear) / 100;

  it("Georgia at $19,950 from 1 October is $13,300 either way", () => {
    // GA's year really is twelve months, so the literal 12 happens to be right.
    expect(prorate(19950, prorationForStudent(GA, "2026-10-01"))).toBe(13300);
    expect(prorate(19950, { monthsAttending: 8, monthsInYear: 12 })).toBe(13300);
  });

  it("Virtual at $15,000 from 1 October is $12,000, not $10,000", () => {
    expect(prorate(15000, prorationForStudent(VIRTUAL, "2026-10-01"))).toBe(12000);
    expect(prorate(15000, { monthsAttending: 8, monthsInYear: 12 })).toBe(10000);
  });
});
