import { describe, expect, it } from "vitest";

import {
  ADMIN_WORK,
  CRAIG_MANN_IVY_ASH_TUTORING,
  KATIE_VETERE_ADMIN,
  hourlyPay,
  rateForWeek,
} from "@/lib/finance/teacher-pay/rates";

/**
 * FIFTY DOLLARS, AND THE WEEK IT BELONGS TO.
 *
 * Pay is computed from a constant when a sheet is rendered, not stored when
 * the hours are logged. On 11 October 2026 Jimmy raised Katie Vetere's admin
 * rate from $20 to $25 an hour. teacher_hourly_claims held exactly one row -
 * Katie, 10.00 hours, entered 9 October, showing $200.00 - and moving the
 * constant would have turned that week into $250.00 with nothing recording
 * that the rate had changed.
 *
 * Asked which he wanted: "from now on".
 *
 * These tests are the only thing that keeps that true.
 */
describe("Katie Vetere's admin rate moved, and her logged week did not", () => {
  /* The week she entered the hours in: Monday 5 October to Sunday 11 October 2026. */
  const HER_LOGGED_WEEK = "2026-10-05";
  const WEEK_THE_RATE_CHANGES = "2026-10-12";

  it("still pays $20 an hour for the week she already logged", () => {
    const rate = rateForWeek(KATIE_VETERE_ADMIN, HER_LOGGED_WEEK);
    expect(rate.cents).toBe(2_000);
  });

  it("prices her ten logged hours at $200.00 and not a cent more", () => {
    const priced = hourlyPay(rateForWeek(KATIE_VETERE_ADMIN, HER_LOGGED_WEEK), 10);
    expect(priced).toEqual({ ok: true, cents: 20_000, hoursPaid: 10 });
  });

  it("pays $25 an hour from the Monday it changes", () => {
    expect(rateForWeek(KATIE_VETERE_ADMIN, WEEK_THE_RATE_CHANGES).cents).toBe(2_500);
  });

  it("pays $25 an hour in every week after that", () => {
    expect(rateForWeek(KATIE_VETERE_ADMIN, "2026-10-20").cents).toBe(2_500);
    expect(rateForWeek(KATIE_VETERE_ADMIN, "2027-03-01").cents).toBe(2_500);
  });

  /**
   * THE BOUNDARY IS THE NEXT MONDAY, NOT TODAY. He said it on Saturday 11
   * October; the open week began Monday 6 October and already held her claim.
   * Starting the new rate in the current week would restate exactly the pay
   * he had just said not to touch.
   */
  it("does not start in the week that was already open when he said it", () => {
    expect(rateForWeek(KATIE_VETERE_ADMIN, "2026-10-05").cents).toBe(2_000);
    expect(rateForWeek(KATIE_VETERE_ADMIN, "2026-09-28").cents).toBe(2_000);
  });

  /**
   * THE BOUNDARY IS A MONDAY. The first draft of this change said 13 October,
   * which is a Tuesday and a week late - it would have underpaid her for
   * seven days and split a sheet somebody had already started. A band that
   * does not land on a Monday is a bug, so the date is asserted as one.
   */
  it("changes on a Monday", () => {
    expect(new Date(`${WEEK_THE_RATE_CHANGES}T12:00:00Z`).getUTCDay()).toBe(1);
  });

  it("keeps her 20-hour cap on both sides of the change", () => {
    for (const week of [HER_LOGGED_WEEK, WEEK_THE_RATE_CHANGES]) {
      const rate = rateForWeek(KATIE_VETERE_ADMIN, week);
      expect(rate.weeklyHourCap).toBe(20);
      expect(hourlyPay(rate, 21).ok).toBe(false);
      /* Zero is a real answer - a week with no admin work is not an error. */
      expect(hourlyPay(rate, 0)).toEqual({ ok: true, cents: 0, hoursPaid: 0 });
    }
  });
});

describe("Approved Admin Work for anybody else", () => {
  /** Jimmy, 11 October: "anyone else who we assign admin hrs at $20 per hour". */
  it("pays $20 an hour", () => {
    expect(ADMIN_WORK.cents).toBe(2_000);
    expect(hourlyPay(ADMIN_WORK, 10)).toEqual({ ok: true, cents: 20_000, hoursPaid: 10 });
  });

  it("is not Katie's rate", () => {
    expect(ADMIN_WORK.cents).not.toBe(KATIE_VETERE_ADMIN.cents);
  });

  /** It has never paid anything else, so there is no history to protect. */
  it("pays the same in every week, having never moved", () => {
    expect(rateForWeek(ADMIN_WORK, "2025-01-06").cents).toBe(2_000);
    expect(rateForWeek(ADMIN_WORK, "2027-01-04").cents).toBe(2_000);
  });
});

describe("rateForWeek", () => {
  /** A rate with no bands is returned untouched, not copied or defaulted. */
  it("leaves a rate that has never moved exactly as it is", () => {
    expect(rateForWeek(CRAIG_MANN_IVY_ASH_TUTORING, "2026-10-13")).toBe(
      CRAIG_MANN_IVY_ASH_TUTORING
    );
    expect(CRAIG_MANN_IVY_ASH_TUTORING.cents).toBe(3_000);
  });

  /** Bands may be written in any order; the latest one that applies wins. */
  it("takes the latest band on or before the week, whatever order they are in", () => {
    const scrambled = {
      ...KATIE_VETERE_ADMIN,
      bands: [
        { fromWeekStart: "2026-10-12", cents: 2_500 },
        { fromWeekStart: null, cents: 2_000 },
      ],
    };
    expect(rateForWeek(scrambled, "2026-10-05").cents).toBe(2_000);
    expect(rateForWeek(scrambled, "2026-10-12").cents).toBe(2_500);
  });
});
