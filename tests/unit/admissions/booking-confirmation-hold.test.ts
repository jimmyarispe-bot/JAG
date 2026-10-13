import { describe, it, expect } from "vitest";

import { HOLD_BOOKING_CONFIRMATIONS, holdBookingConfirmations } from "@/lib/admissions/chase/run";
import { TEST_CAMPUS_SCHOOL_ID, isTestCampus } from "@/lib/admissions/test-campus";

/* WHY THIS FILE EXISTS.
   13 October 2026. Jimmy: "the whole purpose of creating test.leader@ was to
   test this whole process. why are we stopping it?" and then "pls do not hold
   up and let anything through that comes from/to xxxxxx test campus and/or
   test.leader@"

   The hold was a global boolean. The test campus was built on 12 October so he
   could walk the whole admissions path himself, and the boolean silently cut
   the family confirmation and the staff booked notice out of that path - four
   interest calls on the 12th and a tour on the 13th, two steps unproven, and
   nobody told why.

   These assertions are what makes the exemption a decision rather than a line
   somebody can quietly flip back. */

const REAL_CAMPUSES = [
  "a1000000-0000-4000-8000-000000000001",
  "a1000000-0000-4000-8000-000000000002",
  "a1000000-0000-4000-8000-000000000003",
  "a1000000-0000-4000-8000-000000000004",
];

describe("isTestCampus", () => {
  it("is the test campus and nothing else", () => {
    expect(isTestCampus(TEST_CAMPUS_SCHOOL_ID)).toBe(true);
    for (const schoolId of REAL_CAMPUSES) {
      expect(isTestCampus(schoolId)).toBe(false);
    }
  });

  it("treats an unreadable campus as a real one", () => {
    /* An unknown campus might be a real one. The failure that costs nothing is
       the one where a real family's letter waits, not the one where it goes
       out unapproved. */
    expect(isTestCampus(null)).toBe(false);
    expect(isTestCampus(undefined)).toBe(false);
  });

  it("names the campus 538 created and not a real one", () => {
    expect(TEST_CAMPUS_SCHOOL_ID).toBe("a1000000-0000-4000-8000-000000000005");
  });
});

describe("holdBookingConfirmations", () => {
  it("never holds at the test campus, whatever the global switch says", () => {
    /* THIS IS THE POINT OF THE WHOLE CHANGE. If this ever goes true again, the
       test rig has gone silent again and nobody will know why. */
    expect(holdBookingConfirmations(TEST_CAMPUS_SCHOOL_ID)).toBe(false);
  });

  it("holds at the four real campuses while the switch is on", () => {
    for (const schoolId of REAL_CAMPUSES) {
      expect(holdBookingConfirmations(schoolId)).toBe(HOLD_BOOKING_CONFIRMATIONS);
    }
  });

  it("holds when the campus cannot be read", () => {
    expect(holdBookingConfirmations(null)).toBe(HOLD_BOOKING_CONFIRMATIONS);
  });

  it("still holds at the real campuses, because nobody has said go", () => {
    /* Jimmy, 10 October: "hold those till i say go". He has not said go. When
       he does, this assertion is the one that has to be changed on purpose, in
       the same commit that flips the switch. */
    expect(HOLD_BOOKING_CONFIRMATIONS).toBe(true);
  });
});
