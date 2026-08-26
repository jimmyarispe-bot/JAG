import { describe, expect, it } from "vitest";
import { groupForLead, groupForStudent } from "@/lib/people/directory";

/**
 * The directory merges two tables whose status vocabularies do not overlap.
 * These assertions pin the seam: the same real-world situation must land in the
 * same bucket regardless of which table the row came from.
 */

describe("groupForStudent", () => {
  it("places the roster in Enrolled", () => {
    expect(groupForStudent("enrolled")).toBe("enrolled");
  });

  it("parks withdrawn and graduated in Other pending review", () => {
    // These statuses came from a legacy-CRM migration and have not been
    // verified. "alumni" stays reserved for a deliberate human decision.
    expect(groupForStudent("graduated")).toBe("other");
    expect(groupForStudent("withdrawn")).toBe("other");
  });

  it("counts pending and waitlisted as still in the pipeline", () => {
    expect(groupForStudent("pending")).toBe("pipeline");
    expect(groupForStudent("waitlisted")).toBe("pipeline");
  });

  it("does not silently classify an unknown status", () => {
    expect(groupForStudent("something_new")).toBe("other");
  });
});

describe("groupForLead", () => {
  it("puts open stages in the pipeline", () => {
    for (const stage of [
      "new_inquiry", "information_sent", "interview_scheduled",
      "interest_meeting_held", "tour_requested", "tour_scheduled",
      "tour_completed", "shadow_day_scheduled", "application_started",
      "application_submitted", "records_requested", "admissions_review",
    ]) {
      expect(groupForLead(stage), stage).toBe("pipeline");
    }
  });

  it("separates accepted from enrolled", () => {
    // An offer made is not a child on the roster. Conflating them overstates
    // enrolment, which is how three prospects reached the roster on 25 Aug.
    expect(groupForLead("accepted")).toBe("accepted");
    expect(groupForLead("enrolled")).toBe("enrolled");
  });

  it("keeps declining an offer distinct from not returning", () => {
    expect(groupForLead("declined")).toBe("not_enrolled");
    expect(groupForLead("not_returning")).toBe("other");
  });

  it("files former students the same way whichever table holds them", () => {
    // Former students were imported as not_returning leads rather than
    // withdrawn students. Until they are reviewed both sit in the same bucket,
    // so the split between the two tables does not show up as a split on screen.
    expect(groupForLead("not_returning")).toBe(groupForStudent("withdrawn"));
  });

  it("never derives alumni — that category is only ever set by a person", () => {
    const derived = [
      ...["enrolled", "graduated", "withdrawn", "pending", "waitlisted", "x"].map(groupForStudent),
      ...["enrolled", "accepted", "declined", "not_returning", "new_inquiry", "x"].map(groupForLead),
    ];
    expect(derived).not.toContain("alumni");
  });
});
