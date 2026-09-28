import { describe, expect, it } from "vitest";

import {
  gaSpecialNeedsAwardCents,
  gaSpecialNeedsBand,
} from "@/lib/finance/ga-special-needs-bands";

/** The Academy GA's 2026-27 year, as migration 444 set it. */
const GA_YEAR_START = "2026-06-01";

describe("the four bands and their edges", () => {
  const cases: ReadonlyArray<readonly [string, number]> = [
    ["2026-06-01", 100], // the day the year opens
    ["2026-09-05", 100], // last day of the 100% band
    ["2026-09-06", 75], // first day it drops
    ["2026-10-01", 75],
    ["2026-11-06", 75], // last day of 75%
    ["2026-11-07", 50], // first day of 50%
    ["2027-01-08", 50], // last day of 50%
    ["2027-01-09", 25], // first day of 25%
    ["2027-04-09", 25], // last day any award applies
  ];

  for (const [date, percent] of cases) {
    it(`${date} earns ${percent}%`, () => {
      expect(gaSpecialNeedsBand(GA_YEAR_START, date).percent).toBe(percent);
    });
  }
});

describe("after the last band closes", () => {
  it("returns zero rather than throwing, so a late enrolment is not blocked", () => {
    expect(gaSpecialNeedsBand(GA_YEAR_START, "2027-04-10").percent).toBe(0);
  });

  /**
   * Whether Georgia awards nothing after 9 April, or awards a final 25%, is
   * not confirmed. Zero may be wrong, and wrong here costs a family the whole
   * scholarship — so the result says so rather than looking settled.
   */
  it("flags that zero has not been confirmed", () => {
    expect(gaSpecialNeedsBand(GA_YEAR_START, "2027-04-10").needsConfirmation).toBe(true);
    expect(gaSpecialNeedsBand(GA_YEAR_START, "2026-10-01").needsConfirmation).toBe(false);
  });
});

describe("band dates follow the school year, not a fixed year", () => {
  it("puts September and November in the year the school year opened", () => {
    expect(gaSpecialNeedsBand(GA_YEAR_START, "2026-09-05").bandCloses).toBe("2026-09-05");
    expect(gaSpecialNeedsBand(GA_YEAR_START, "2026-10-01").bandCloses).toBe("2026-11-06");
  });

  it("puts January and April in the following year", () => {
    expect(gaSpecialNeedsBand(GA_YEAR_START, "2026-12-01").bandCloses).toBe("2027-01-08");
    expect(gaSpecialNeedsBand(GA_YEAR_START, "2027-02-01").bandCloses).toBe("2027-04-09");
  });

  it("still works for the next school year without being edited", () => {
    expect(gaSpecialNeedsBand("2027-06-01", "2027-09-05").percent).toBe(100);
    expect(gaSpecialNeedsBand("2027-06-01", "2027-09-06").percent).toBe(75);
    expect(gaSpecialNeedsBand("2027-06-01", "2028-01-08").percent).toBe(50);
  });
});

describe("the award in cents", () => {
  const FULL_YEAR = 1_000_000; // $10,000

  it("is 75% of the full year for a 1 October start", () => {
    expect(gaSpecialNeedsAwardCents(FULL_YEAR, GA_YEAR_START, "2026-10-01").awardCents).toBe(
      750_000
    );
  });

  it("is half for a 7 November start", () => {
    expect(gaSpecialNeedsAwardCents(FULL_YEAR, GA_YEAR_START, "2026-11-07").awardCents).toBe(
      500_000
    );
  });

  it("refuses a full-year award that is not whole cents", () => {
    expect(() => gaSpecialNeedsAwardCents(1000.5, GA_YEAR_START, "2026-10-01")).toThrow(
      /whole number of cents/
    );
    expect(() => gaSpecialNeedsAwardCents(-1, GA_YEAR_START, "2026-10-01")).toThrow(
      /whole number of cents/
    );
  });

  it("refuses a date that is not a date", () => {
    expect(() => gaSpecialNeedsBand(GA_YEAR_START, "5 September")).toThrow(/YYYY-MM-DD/);
  });
});

/**
 * The cliff, stated in dollars.
 *
 * Tuition prorates smoothly by month; the award prorates in four steps. Run
 * against one student they disagree, and starting LATER can cost a family
 * MORE. This is Georgia's rule and almost certainly correct — it is asserted
 * here so that it stays deliberate, and so anyone changing either calculation
 * has to change this number on purpose.
 */
describe("starting later can cost the family more", () => {
  const GA_ANNUAL_CENTS = 1_995_000; // $19,950
  const FULL_YEAR_AWARD = 1_000_000; // $10,000

  const familyPays = (monthsAttending: number, enrolmentDate: string) => {
    const tuition = Math.round((GA_ANNUAL_CENTS * monthsAttending) / 12);
    const award = gaSpecialNeedsAwardCents(
      FULL_YEAR_AWARD,
      GA_YEAR_START,
      enrolmentDate
    ).awardCents;
    return tuition - award;
  };

  it("1 October: eight months at 75% leaves the family $5,800", () => {
    expect(familyPays(8, "2026-10-01")).toBe(580_000);
  });

  it("7 November: seven months at 50% leaves the family $6,637.50", () => {
    expect(familyPays(7, "2026-11-07")).toBe(663_750);
  });

  it("five weeks later costs the family $837.50 more", () => {
    expect(familyPays(7, "2026-11-07") - familyPays(8, "2026-10-01")).toBe(83_750);
  });
});
