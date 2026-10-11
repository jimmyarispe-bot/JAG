import { describe, expect, it } from "vitest";

import { bookingKindFromTitle } from "@/lib/admissions/chase/booking-kind";

/**
 * THE TITLES ARE REAL. Every one in the first block was read out of the
 * database on 11 October - the complete set of booking titles the calendar
 * scan had matched to a family since it was built, with how many times each
 * appeared. Five tours and one shadow day in that list had been filed as
 * interest meetings, and one of those reached Danni's inbox as a letter
 * asking her to write up an interest conversation about a school tour.
 *
 * Anything added here later should come from a real run, not imagination.
 */
describe("bookingKindFromTitle", () => {
  it.each([
    ["Meetings with Heather Badger-Brown", "interest"],
    ["Parent Interest Call (Jimmy Arispe)", "interest"],
    ["30 min with Nina (Lisa Roy)", "interest"],
    ["School Visit(Tour)", "tour"],
    ["Academy FL School Tours (Jimmy Arispe)", "tour"],
    ["School Tour for the Broyld Family.", "tour"],
    ["Shadow days (this is a test - Jimmy Arispe)", "shadow_day"],
  ])("reads %s as %s", (title, expected) => {
    expect(bookingKindFromTitle(title)).toBe(expected);
  });

  /**
   * A MEETING A LEADER TYPED HERSELF SAYS NOTHING, and must say nothing
   * rather than something plausible. These four are also real. The caller
   * falls back to the child's stage for them, exactly as it always did, and
   * reports the title so a booking page nobody mentioned is found by reading
   * a run instead of by a wrong letter.
   */
  it.each([
    ["Rita & Mike Fink (Emma) Phone Call."],
    ["Renee (Kendahl) & Heather Meet."],
    ["Jennifer & Heather."],
    ["Kimberly Lopez."],
    ["Office"],
    ["Lunch Break"],
    ["Class with Mrs. BB"],
    [""],
  ])("refuses to guess at %s", (title) => {
    expect(bookingKindFromTitle(title)).toBeNull();
  });

  it("refuses a missing title", () => {
    expect(bookingKindFromTitle(null)).toBeNull();
  });

  /**
   * THE WORD, NOT THE SUBSTRING. Jimmy asked whether school leaders would
   * have to name their appointments a particular way; the answer is no only
   * because this matches whole words. A rule loose enough to see "tour"
   * inside "detour" would start inventing tours out of ordinary diary
   * entries, which is the same failure wearing a different coat.
   */
  it.each([["Detour planning"], ["Contours of the budget"], ["Tourism club"]])(
    "does not find a tour in %s",
    (title) => {
      expect(bookingKindFromTitle(title)).not.toBe("tour");
    }
  );

  /**
   * THE FOUR WORDS, in Jimmy's own wording on 11 October, which is what the
   * school leaders are being told:
   *
   *   Interest - anything involving interest meetings/calls
   *   Tour - anything involving tours at the school
   *   Shadow - when a student is shadowing at the school or in virtual
   *            classes
   *   Assessment - when you are scheduling a child for their assessments Each one anywhere in the title, any
   * capitalisation, and the campus wordings differ on purpose: HS and
   * Virtual say "Virtual Interest Meeting", GA and FL say "Interest
   * Conversation", and they share only the word that matters.
   */
  it.each([
    ["Virtual Interest Meeting - Smith", "interest"],
    ["Interest Conversation with the Ortiz family", "interest"],
    ["interest meeting", "interest"],
    ["TOUR - Martin family", "tour"],
    ["Shadow day for Callum", "shadow_day"],
    ["Assessment for Callum", "assessment"],
    ["Reading assessment - Virtual", "assessment"],
    ["Shadowing in virtual classes - Emma", "shadow_day"],
  ])("reads the agreed wording %s as %s", (title, expected) => {
    expect(bookingKindFromTitle(title)).toBe(expected);
  });

  /**
   * ORDER. A title carrying two of the words resolves to the more specific
   * one, deterministically, rather than to whichever was tested first by
   * accident.
   */
  it("prefers shadow day over tour when a title carries both", () => {
    expect(bookingKindFromTitle("Shadow Day Tour")).toBe("shadow_day");
  });

  it("prefers assessment over interest when a title carries both", () => {
    expect(bookingKindFromTitle("Assessment and interest follow-up")).toBe("assessment");
  });

  /**
   * APPLICATION IS NOT ONE OF THE FOUR. It was proposed and Jimmy replaced
   * it with Assessment, so it must fall through to the stage rather than
   * quietly keep working and drift out of step with what the school leaders
   * were actually told.
   */
  it("does not treat Application as a kind", () => {
    expect(bookingKindFromTitle("Application conversation - Tondreau")).toBeNull();
  });

  /**
   * "CALL" ALONE DECIDES NOTHING, and must not. Jimmy proposed it as one of
   * the keywords; it matches both the interest call and the application
   * call, so on its own it has to fall through to the stage rather than pick
   * one of the two.
   */
  it("does not treat a bare Call as a kind", () => {
    expect(bookingKindFromTitle("Call with the Lopez family")).toBeNull();
  });

  /** A new leader's booking page works the day it is made, by shape. */
  it.each([
    ["45 minute discovery call", "interest"],
    ["Meetings with a leader who does not work here yet", "interest"],
    ["Inquiry call with the Smiths", "interest"],
    ["Tours", "tour"],
  ])("reads %s as %s without anyone registering it", (title, expected) => {
    expect(bookingKindFromTitle(title)).toBe(expected);
  });
});
