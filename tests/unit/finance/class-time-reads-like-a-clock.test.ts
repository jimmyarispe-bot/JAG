import { describe, it, expect } from "vitest";
import { formatClassTime, NETWORK_TIME_ZONE } from "@/lib/finance/teacher-week";

/**
 * 21 September 2026. Teacher timesheets showed "13:00". A teacher reading her
 * week at seven in the morning should not have to subtract twelve.
 *
 * And the instant is the same everywhere; only the reading changes. A teacher
 * outside Eastern shown 1:00 PM for a class that starts at 10:00 her time will
 * miss it. Leadership - Jimmy, Danni, Heather - always read Eastern, because a
 * payroll cutoff that moves with the reader is not a cutoff.
 */

// Monday 21 September 2026, 13:00 Eastern. September is EDT, UTC-4.
const ONE_PM_ET = "2026-09-21T17:00:00.000Z";

describe("a class time reads like a clock", () => {
  it("is twelve hour with am or pm, never 24 hour", () => {
    const shown = formatClassTime(ONE_PM_ET, NETWORK_TIME_ZONE);
    expect(shown).toContain("1:00");
    expect(shown).toMatch(/AM|PM/);
    expect(shown).not.toContain("13:");
  });

  it("a morning class does not read as afternoon", () => {
    // 09:00 Eastern.
    const shown = formatClassTime("2026-09-21T13:00:00.000Z", NETWORK_TIME_ZONE);
    expect(shown).toContain("9:00");
    expect(shown).toContain("AM");
  });

  it("names no timezone for an Eastern reader", () => {
    // Almost everybody. A bare "1:00 PM" is what they should see.
    const shown = formatClassTime(ONE_PM_ET, NETWORK_TIME_ZONE);
    expect(shown).toBe("1:00 PM");
  });

  it("shows a teacher outside Eastern her own clock, and names the zone", () => {
    const shown = formatClassTime(ONE_PM_ET, "America/Los_Angeles");
    expect(shown).toContain("10:00");
    expect(shown).toContain("AM");
    // The zone is named so the difference is visible rather than assumed.
    expect(shown).toMatch(/P[DS]T/);
  });

  it("the same instant is one moment, read two ways", () => {
    const eastern = formatClassTime(ONE_PM_ET, NETWORK_TIME_ZONE);
    const mountain = formatClassTime(ONE_PM_ET, "America/Phoenix");
    expect(eastern).not.toBe(mountain);
    expect(eastern).toContain("1:00 PM");
    expect(mountain).toContain("10:00");
  });

  it("defaults to the network's clock when nobody set one", () => {
    expect(formatClassTime(ONE_PM_ET)).toBe("1:00 PM");
  });

  it("falls back to Eastern rather than throwing on a bad timezone", () => {
    // Intl rejects an unknown zone. A timesheet must not fail to render
    // because somebody typed their timezone in wrong.
    expect(() => formatClassTime(ONE_PM_ET, "Mars/Olympus_Mons")).not.toThrow();
    expect(formatClassTime(ONE_PM_ET, "Mars/Olympus_Mons")).toBe("1:00 PM");
    expect(formatClassTime(ONE_PM_ET, "")).toBe("1:00 PM");
  });

  it("returns nothing for a missing instant rather than Invalid Date", () => {
    expect(formatClassTime("")).toBe("");
  });
});
