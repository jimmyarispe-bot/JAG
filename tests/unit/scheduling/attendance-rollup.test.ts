/**
 * The day is derived from the classes, and the date is Eastern.
 *
 * Both of these replaced silent wrongness rather than adding a feature:
 * the daily attendance row used to be whatever the last class of the day
 * wrote, and the date used to be the UTC date.
 */

import { describe, expect, it } from "vitest";
import { easternDate, rollUpDayStatus } from "@/lib/scheduling/attendance-bridge";

describe("rollUpDayStatus", () => {
  it("returns null when the child has no classes that day", () => {
    expect(rollUpDayStatus([])).toBeNull();
  });

  it("counts the day as present when ANY class was attended", () => {
    // The bug this replaces: a child present all morning finished the day
    // recorded absent, because their last class of the day was the one that
    // happened to write the daily row.
    expect(rollUpDayStatus(["present", "absent_unexcused", "absent_unexcused"])).toBe("present");
    expect(rollUpDayStatus(["absent_excused", "absent_excused", "present"])).toBe("present");
  });

  it("treats virtual_present as presence at day level", () => {
    expect(rollUpDayStatus(["virtual_present"])).toBe("present");
    expect(rollUpDayStatus(["absent_unexcused", "virtual_present"])).toBe("present");
  });

  it("prefers early_dismissal and tardy over any absence — the child was here", () => {
    expect(rollUpDayStatus(["absent_unexcused", "early_dismissal"])).toBe("early_dismissal");
    expect(rollUpDayStatus(["absent_excused", "tardy"])).toBe("tardy");
  });

  it("ranks early_dismissal above tardy when both appear", () => {
    expect(rollUpDayStatus(["tardy", "early_dismissal"])).toBe("early_dismissal");
  });

  it("lets unexcused beat excused when every class was missed", () => {
    // A day containing an unexplained absence is not a fully excused day.
    expect(rollUpDayStatus(["absent_excused", "absent_unexcused"])).toBe("absent_unexcused");
    expect(rollUpDayStatus(["absent_excused", "absent_excused"])).toBe("absent_excused");
  });

  it("does not silently drop a status it does not recognise", () => {
    // Better the reader sees the real value than a confident wrong one.
    expect(rollUpDayStatus(["some_new_status"])).toBe("some_new_status");
  });
});

describe("easternDate", () => {
  it("uses the Eastern date, not the UTC date", () => {
    // 7pm Eastern on 10 November 2026 is 00:00 UTC on the 11th. The old code
    // recorded that class as the next day's attendance - for the child, and
    // for the teacher's pay.
    expect(easternDate("2026-11-11T00:00:00Z")).toBe("2026-11-10");
  });

  it("is correct through the daylight-saving change", () => {
    // EDT (UTC-4) in September, EST (UTC-5) in November. A fixed offset would
    // get one of these two wrong.
    expect(easternDate("2026-09-22T21:30:00Z")).toBe("2026-09-22"); // 5:30pm EDT
    expect(easternDate("2026-11-20T22:30:00Z")).toBe("2026-11-20"); // 5:30pm EST
  });

  it("returns a plain YYYY-MM-DD, which is what a date column wants", () => {
    expect(easternDate("2026-09-21T14:00:00Z")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("puts a midday class on its own day in either season", () => {
    expect(easternDate("2026-09-21T16:00:00Z")).toBe("2026-09-21");
    expect(easternDate("2026-01-15T17:00:00Z")).toBe("2026-01-15");
  });
});
