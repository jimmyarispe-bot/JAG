import { describe, it, expect } from "vitest";

import { TOUR_NOTES_EVENT } from "@/lib/admissions/chase/run";
import {
  actionsForPage,
  occasionForStage,
} from "@/lib/admissions/automation/post-call";
import {
  COMMUNICATION_TRIGGER_EVENTS,
  TRIGGER_EVENT_LABELS,
} from "@/lib/admissions/communications/types";

/* WHY THIS FILE EXISTS.
   13 October 2026. Jimmy, having tested it himself: "Just had a test tour and
   did not receive any followup email to send application".

   The interest meeting has had a letter at its start time since 5 October. The
   tour never did. invite_to_apply opens at tour_completed, twelve places in
   this codebase READ that stage, and until this shipped nothing ever WROTE it -
   the only writer was a bulk import's CSV mapping. So after a tour there was no
   prompt, no decision and no application, and seven children sat at Tour
   Scheduled with nothing behind them. */

describe("the tour's notes letter can be emitted", () => {
  it("is the event migration 539's letter listens on", () => {
    expect(TOUR_NOTES_EVENT).toBe("staff_tour_held");
  });

  it("is in the trigger union, or notifyAdmissionsEvent refuses it", () => {
    expect(COMMUNICATION_TRIGGER_EVENTS).toContain("staff_tour_held");
  });

  it("has a label, so it is readable wherever events are listed", () => {
    expect(TRIGGER_EVENT_LABELS.staff_tour_held).toBe("Tour Happening Now (staff)");
  });
});

describe("occasionForStage", () => {
  it("is the tour only at Tour Scheduled", () => {
    expect(occasionForStage("tour_scheduled")).toBe("tour");
  });

  it("is the interest meeting everywhere else", () => {
    /* INCLUDING tour_requested AND tour_completed. Requested means the family
       has the link and has not booked - there is no tour to write up. Completed
       means this page has already done its work; a second visit must not offer
       to send the application again as though the first had not happened. */
    for (const stage of [
      "inquiry",
      "interest_meeting_scheduled",
      "interest_meeting_held",
      "tour_requested",
      "tour_completed",
      "declined",
      null,
      undefined,
    ]) {
      expect(occasionForStage(stage)).toBe("interest_meeting");
    }
  });
});

describe("actionsForPage", () => {
  it("offers his three buttons after a tour, in his order", () => {
    /* FROM THE PAGE HE APPROVED on 13 October. The order is his: the primary,
       then "Not yet", then the decline - which is NOT the order of
       POST_CALL_ACTIONS, because the interest-meeting page has used that order
       since 5 October and reordering the list would change a screen nobody
       asked me to change. */
    const options = actionsForPage("tour", "tour");
    expect(options.map((o) => o.label)).toEqual([
      "Send the application",
      "Not yet, I will follow up",
      "Not the right school",
    ]);
  });

  it("is the same three after a tour at FL as at GA", () => {
    /* A tour page carries no fork. The decision after a tour is the same
       wherever the tour happened. */
    expect(actionsForPage("tour", "tour").map((o) => o.value)).toEqual(
      actionsForPage("shadow_day", "tour").map((o) => o.value)
    );
  });

  it("never offers the tour request on a tour page", () => {
    /* THE BUG THIS PREVENTS. The old actionsForFork read only the campus, and
       GA's fork is "tour" at every appointment - so a leader walking out of a
       tour would have been offered "Send the tour request" for a tour she had
       just given. */
    expect(actionsForPage("tour", "tour").map((o) => o.value)).not.toContain(
      "tour_requested"
    );
  });

  it("never offers the application on an interest-meeting page", () => {
    /* The other half of the same mistake: inviting a family to apply before
       they have seen the building. */
    for (const fork of ["tour", "shadow_day"] as const) {
      expect(
        actionsForPage(fork, "interest_meeting").map((o) => o.value)
      ).not.toContain("application_invited");
    }
  });

  it("keeps the interest meeting exactly as it was", () => {
    expect(actionsForPage("tour", "interest_meeting").map((o) => o.value)).toEqual([
      "tour_requested",
      "post_call_not_the_right_school",
      "post_call_follow_up",
    ]);
    expect(
      actionsForPage("shadow_day", "interest_meeting").map((o) => o.value)
    ).toEqual([
      "shadow_days_invited",
      "post_call_not_the_right_school",
      "post_call_follow_up",
    ]);
  });

  it("says what the tour's buttons will do, in the tour's terms", () => {
    const byValue = Object.fromEntries(
      actionsForPage("tour", "tour").map((o) => [o.value, o.consequence])
    );
    /* Not "Interest Meeting Held", which is what the shared buttons say on the
       other page and would be a lie here. */
    expect(byValue.post_call_follow_up).toContain("Tour Completed");
    expect(byValue.post_call_follow_up).not.toContain("Interest Meeting Held");
    expect(byValue.application_invited).toContain("Application for Admissions");
    expect(byValue.application_invited).toContain("Tour Completed");
  });
});
