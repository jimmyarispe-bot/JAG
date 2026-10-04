/**
 * The tour step: which campuses run one, and the refusals that keep an empty
 * link out of a parent's inbox.
 *
 * The gate tests at the bottom are the important ones. Arming the fork is the
 * single most dangerous line in this work - get it wrong and every GA and FL
 * family stops dead at the interest meeting, silently, looking exactly like a
 * quiet week on the board.
 */

import { afterEach, describe, expect, it } from "vitest";

import {
  TOUR_CAMPUS_NAMES,
  campusRunsTours,
  requireTourLink,
  tourGateArmed,
} from "@/lib/admissions/tour";
import { gateOpeningAtStage } from "@/lib/admissions/gates/definitions";
import {
  MERGE_FIELDS,
  COMMUNICATION_TRIGGER_EVENTS,
  TRIGGER_EVENT_LABELS,
} from "@/lib/admissions/communications/types";
import { buildMergeValues } from "@/lib/admissions/communications/merge-fields";

const GOOD_URL = "https://calendar.app.google/8jPEwx92MX475duv8";

afterEach(() => {
  delete process.env.ADMISSIONS_TOUR_GATE;
});

describe("which campuses run tours", () => {
  it("is GA and FL, and only those two", () => {
    expect(campusRunsTours("The Academy GA")).toBe(true);
    expect(campusRunsTours("The Academy FL")).toBe(true);
    expect(campusRunsTours("The Academy HS")).toBe(false);
    expect(campusRunsTours("The Academy Virtual")).toBe(false);
    expect(TOUR_CAMPUS_NAMES).toHaveLength(2);
  });

  it("survives a stray space or a different case in the JAG", () => {
    expect(campusRunsTours("  the academy ga  ")).toBe(true);
  });

  it("treats an unknown or missing campus as no tour", () => {
    /* The safe direction: a family who is not asked to tour still reaches the
       application. The opposite default strands them behind a step their
       campus cannot deliver. */
    expect(campusRunsTours(null)).toBe(false);
    expect(campusRunsTours(undefined)).toBe(false);
    expect(campusRunsTours("The Academy Mars")).toBe(false);
  });
});

describe("requireTourLink", () => {
  it("passes a configured tour campus through", () => {
    const result = requireTourLink({ schoolName: "The Academy GA", tourUrl: GOOD_URL });
    expect(result).toEqual({ ok: true, url: GOOD_URL });
  });

  it("refuses a campus that does not run tours at all", () => {
    const result = requireTourLink({ schoolName: "The Academy HS", tourUrl: GOOD_URL });
    expect(result.ok).toBe(false);
  });

  it("refuses an empty link, and names where to set it", () => {
    const result = requireTourLink({ schoolName: "The Academy FL", tourUrl: "   " });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("The Academy FL");
    expect(result.error).toContain("/dashboard/admin/admissions-contacts");
  });

  it("refuses something that is not an https link", () => {
    const result = requireTourLink({
      schoolName: "The Academy GA",
      tourUrl: "calendar.app.google/8jPEwx92MX475duv8",
    });
    expect(result.ok).toBe(false);
  });
});

describe("the tour gate fork", () => {
  it("is OFF unless the environment says on", () => {
    expect(tourGateArmed()).toBe(false);
    process.env.ADMISSIONS_TOUR_GATE = "true";
    expect(tourGateArmed()).toBe(false);
    process.env.ADMISSIONS_TOUR_GATE = "on";
    expect(tourGateArmed()).toBe(true);
  });

  it("changes nothing at all while it is off", () => {
    /* This is the test that protects the deploy. Everything ships built and
       inert, so today's behaviour must be byte-for-byte what it was. */
    expect(gateOpeningAtStage("interest_meeting_held", "The Academy GA")).toBe(
      "invite_to_apply"
    );
    expect(gateOpeningAtStage("interest_meeting_held", "The Academy HS")).toBe(
      "invite_to_apply"
    );
  });

  it("once armed, holds GA and FL back at the interest meeting", () => {
    process.env.ADMISSIONS_TOUR_GATE = "on";
    expect(gateOpeningAtStage("interest_meeting_held", "The Academy GA")).toBeNull();
    expect(gateOpeningAtStage("interest_meeting_held", "The Academy FL")).toBeNull();
  });

  it("once armed, leaves Virtual and HS exactly as they are", () => {
    process.env.ADMISSIONS_TOUR_GATE = "on";
    expect(gateOpeningAtStage("interest_meeting_held", "The Academy Virtual")).toBe(
      "invite_to_apply"
    );
    expect(gateOpeningAtStage("interest_meeting_held", "The Academy HS")).toBe(
      "invite_to_apply"
    );
  });

  it("opens the gate at tour_completed for a tour campus, armed or not", () => {
    expect(gateOpeningAtStage("tour_completed", "The Academy GA")).toBe("invite_to_apply");
    process.env.ADMISSIONS_TOUR_GATE = "on";
    expect(gateOpeningAtStage("tour_completed", "The Academy GA")).toBe("invite_to_apply");
  });

  it("never suppresses when the caller does not know the campus", () => {
    /* A question asked twice is recoverable. A child who stops dead is not. */
    process.env.ADMISSIONS_TOUR_GATE = "on";
    expect(gateOpeningAtStage("interest_meeting_held")).toBe("invite_to_apply");
    expect(gateOpeningAtStage("interest_meeting_held", null)).toBe("invite_to_apply");
  });
});

describe("the new tokens are registered where the audit looks", () => {
  it("names both new trigger events", () => {
    for (const event of ["staff_inquiry_call_held", "tour_invitation_sent"] as const) {
      expect(COMMUNICATION_TRIGGER_EVENTS).toContain(event);
      /* TRIGGER_EVENT_LABELS is the map that must name every event, and the
         one that caught me twice in a day on 4 October. */
      expect(TRIGGER_EVENT_LABELS[event]).toBeTruthy();
    }
  });

  it("registers both new merge fields, so neither mails literal braces", () => {
    expect(MERGE_FIELDS).toContain("tour_link");
    expect(MERGE_FIELDS).toContain("post_call_link");
  });

  it("renders the tour link from the campus calendar", () => {
    const values = buildMergeValues({ tourUrl: GOOD_URL });
    expect(values.tour_link).toBe(GOOD_URL);
  });

  it("points the post-call link at the token page", () => {
    const token = "a".repeat(64);
    const values = buildMergeValues({ postCallToken: token });
    expect(values.post_call_link).toContain(`/post-call/${token}`);
  });
});
