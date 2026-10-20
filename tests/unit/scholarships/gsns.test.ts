import { describe, expect, it } from "vitest";

import { decidedOn, gsnsShareOn, isGsnsLetter, parseGsnsLetter, shareOf } from "@/lib/scholarships/gsns";

// The text unpdf returns for a GaDOE letter (names and numbers invented).
const LETTER = `GEORGIA DEPARTMENT OF EDUCATION
Special Needs Scholarship Program
09/29/2026Date: 2026 - 2027School Year:
STUDENT INFORMATION
Student Name Test Child
Date of Birth June 1, 2012
GTID 1234567890
SCHOLARSHIP AWARD INFORMATION
Base Scholarship Amount $11,659.00
FY27 Legislative Formula Adjustment $0.00
Total Scholarship Amount Awarded $11,659.00`;

describe("GSNS letter", () => {
  it("reads the GTID, the total and the year", () => {
    expect(isGsnsLetter(LETTER)).toBe(true);
    expect(parseGsnsLetter(LETTER)).toEqual({
      studentName: "Test Child",
      gtid: "1234567890",
      schoolYear: "2026-2027",
      totalAward: 11659,
    });
  });
});

describe("GSNS share by date", () => {
  const y = "2026-2027";
  it.each([
    ["2026-08-01", 100, "2026-09-05"],
    ["2026-09-04", 100, "2026-09-05"],
    ["2026-09-05", 75, "2026-11-06"],
    ["2026-11-05", 75, "2026-11-06"],
    ["2026-11-06", 50, "2027-01-08"],
    ["2027-04-08", 25, "2027-04-09"],
    ["2027-04-09", 0, null],
  ])("%s -> %i%%", (day, percent, deadline) => {
    expect(gsnsShareOn(day, y)).toEqual({ percent, deadline });
  });

  it("75% of $11,659.00 is $8,744.25", () => {
    expect(shareOf(11659, 75)).toBe(8744.25);
  });

  it("is decided by the later of signed and first paid", () => {
    expect(decidedOn(null, "2026-10-01T15:00:00Z")).toBeNull();
    expect(decidedOn("2026-10-01T15:00:00Z", "2026-11-07T15:00:00Z")).toBe("2026-11-07");
  });
});
