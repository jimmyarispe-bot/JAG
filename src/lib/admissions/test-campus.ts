/**
 * THE TEST CAMPUS IS NEVER HELD, DELAYED OR SUPPRESSED.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * Jimmy, 13 October 2026:
 *
 *   "pls do not hold up and let anything through that comes from/to xxxxxx
 *    test campus and/or test.leader@"
 *
 * and, the message before it:
 *
 *   "the whole purpose of creating test.leader@ was to test this whole
 *    process. why are we stopping it?"
 *
 * XXXXXXXX Test Campus was created on 12 October for one reason: so he can
 * walk a child through the entire admissions path himself, without a real
 * school leader's inbox and a real family's pipeline being used as the test
 * rig. Every guard in this platform that quietly stops a letter therefore
 * defeats the only thing that campus is for.
 *
 * It had already happened once before this file was written.
 * HOLD_BOOKING_CONFIRMATIONS was a single global boolean, added on 10 October
 * to protect REAL families from confirmation letters nobody had approved yet.
 * The test campus did not exist then. From the 12th it was silently cutting
 * the family's confirmation and the staff booked notice out of exactly the
 * path being tested - four interest calls on the 12th, a tour on the 13th -
 * and the silence was reported back to him as "held at your word".
 *
 * A guard that also blocks the test rig is not a guard. It is a blind spot.
 *
 * ── THE RULE ────────────────────────────────────────────────────────────────
 *
 * At this campus: no hold, no business-hours delay, no past-appointment skip.
 * Letters go out immediately and in full, to the only two mailboxes that
 * exist there - test.leader@theacademyway.org and Jimmy's own plus-addressed
 * gmail. There is no family at this campus to protect.
 *
 * ── THE ONE THING THIS RULE DOES NOT OVERRIDE ──────────────────────────────
 *
 * NOT_COPIED_TO_THE_SCHOOL_LEADER in communications/engine.ts, which keeps
 * the four scholarship/voucher letters off the school leader's copy. That is
 * the money rule - "remember only danni n me see anything related to money" -
 * and it is about which humans may read a figure, not about whether a letter
 * is sent. It stays in force everywhere, including here. (It is also about to
 * be moot: migration 545 deletes all four of those letters.)
 *
 * ── IF A SECOND TEST CAMPUS IS EVER ADDED ──────────────────────────────────
 *
 * Make this a Set and nothing else changes. It is a single id today because
 * there is a single test campus, and pretending otherwise would be inventing
 * a requirement.
 */
export const TEST_CAMPUS_SCHOOL_ID = "a1000000-0000-4000-8000-000000000005";

/**
 * Whether this child's campus is the test campus.
 *
 * A null school_id is NOT the test campus. An unknown campus might be a real
 * one, and the failure that costs nothing is the one where a real family's
 * letter waits rather than the one where it goes out unapproved.
 */
export function isTestCampus(schoolId: string | null | undefined): boolean {
  return schoolId === TEST_CAMPUS_SCHOOL_ID;
}
