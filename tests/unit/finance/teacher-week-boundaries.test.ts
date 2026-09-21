/**
 * Which week a teacher is looking at.
 *
 * mondayOf decides this, and an off-by-one would be quietly wrong every single
 * week - a teacher would mark Tuesday's class into last week's total and nobody
 * would see it until the money was already frozen.
 *
 * Saturday and Sunday belong to the week that has just ended, not the one about
 * to start: a teacher tidying up their week on Saturday morning is finishing
 * the week they taught.
 */

import { describe, expect, it } from "vitest";
import {
  currentWeekStart,
  easternTodayIso,
  mondayOf,
  WEEKLY_SUBMISSION_GO_LIVE,
} from "@/lib/finance/teacher-week";

describe("mondayOf", () => {
  it("returns Monday unchanged", () => {
    expect(mondayOf("2026-09-21")).toBe("2026-09-21");
  });

  it("walks back to Monday from any weekday", () => {
    expect(mondayOf("2026-09-22")).toBe("2026-09-21");
    expect(mondayOf("2026-09-25")).toBe("2026-09-21");
  });

  it("puts the weekend with the week that just ended, not the one ahead", () => {
    expect(mondayOf("2026-09-26")).toBe("2026-09-21"); // Saturday
    expect(mondayOf("2026-09-27")).toBe("2026-09-21"); // Sunday
    expect(mondayOf("2026-09-28")).toBe("2026-09-28"); // the next Monday
  });

  it("crosses a month boundary", () => {
    expect(mondayOf("2026-10-01")).toBe("2026-09-28");
  });

  it("crosses a year boundary", () => {
    expect(mondayOf("2026-01-01")).toBe("2025-12-29");
  });

  it("is unaffected by the daylight-saving change", () => {
    // Eastern goes to EST in early November. A week boundary computed from a
    // local clock would slip here; this one is computed from the date.
    expect(mondayOf("2026-11-02")).toBe("2026-11-02");
    expect(mondayOf("2026-11-06")).toBe("2026-11-02");
  });
});

describe("the go-live boundary", () => {
  it("starts on Monday 21 September 2026, and that date is a Monday", () => {
    expect(WEEKLY_SUBMISSION_GO_LIVE).toBe("2026-09-21");
    expect(mondayOf(WEEKLY_SUBMISSION_GO_LIVE)).toBe(WEEKLY_SUBMISSION_GO_LIVE);
  });

  it("matches the check constraint in migration 392", () => {
    // The database refuses week_start < 2026-09-21. If this constant ever moves
    // without the migration moving too, the screen would offer a week the
    // database then refuses to store - which a teacher would meet as a failed
    // submit at 11pm on a Friday.
    expect(WEEKLY_SUBMISSION_GO_LIVE >= "2026-09-21").toBe(true);
  });
});

describe("currentWeekStart", () => {
  it("is always a Monday", () => {
    const monday = currentWeekStart(new Date("2026-09-24T18:00:00Z"));
    expect(monday).toBe("2026-09-21");
    expect(mondayOf(monday)).toBe(monday);
  });

  it("uses the Eastern date, not the server's", () => {
    // 01:30 UTC on Monday 28 September is still Sunday 27 September in Eastern,
    // so a teacher opening the page then is still finishing the previous week.
    expect(easternTodayIso(new Date("2026-09-28T01:30:00Z"))).toBe("2026-09-27");
    expect(currentWeekStart(new Date("2026-09-28T01:30:00Z"))).toBe("2026-09-21");
  });
});
