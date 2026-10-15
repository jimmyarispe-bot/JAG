/**
 * SKIP NEXT STAGE: the ladder, and the two ways it has already been wrong.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * Jimmy, 15 October 2026: "a parent has complete the inquiry form, and then
 * goes through the other stages but the school leader doesn't do the shadow
 * days and just move to acceptance. this is just an example but can happen at
 * any stage except the inquiry".
 *
 * The ladder was written twice before it was right, and both faults are
 * silent ones - the press works, the child moves, and the wrong question
 * arrives:
 *
 *   1. DRIVEN BY occasionForStage. That function names only the tour and
 *      shadow-day stages; everything else falls through to
 *      "interest_meeting". So a child at Application Submitted - who has
 *      toured AND applied - was sent back to the tour. Jimmy's own example
 *      arriving at the wrong end of the flow.
 *
 *   2. LANDING ON THE START OF THE STAGE AFTER THE SKIPPED ONE, which skips
 *      two stages per press. From New Inquiry it reached Tour Completed,
 *      passing over the interest meeting AND the tour, and offered "Send the
 *      application" for a child who had seen nothing.
 *
 * Both are tested below by name, because neither would show up as a failure -
 * only as a school leader being asked the wrong thing.
 */

import { describe, it, expect } from "vitest";

import { skipTargetForStage } from "@/lib/admissions/automation/skip-stage";
import { occasionForStage } from "@/lib/admissions/automation/post-call";
import { LEAD_STAGES } from "@/lib/constants/admissions";

const GA = "The Academy GA";
const VIRTUAL = "The Academy Virtual";

function stepOf(stage: string): number {
  const found = LEAD_STAGES.find((s) => s.value === stage);
  if (!found || found.step == null) throw new Error(`${stage} has no step`);
  return found.step;
}

describe("the ladder lands one stage on, not two", () => {
  it("skips the interest meeting from the inquiry and stops there", () => {
    const target = skipTargetForStage("new_inquiry", GA);
    expect(target?.skippedLabel).toBe("Interest Meeting");
    expect(target?.landingStage).toBe("interest_meeting_held");
    /* NOT tour_completed. That was fault 2, and it skipped the tour as well. */
    expect(target?.landingStage).not.toBe("tour_completed");
  });

  it("skips the tour from the interest meeting at a campus that runs tours", () => {
    const target = skipTargetForStage("interview_scheduled", GA);
    expect(target?.skippedLabel).toBe("Tour");
    expect(target?.landingStage).toBe("tour_completed");
    expect(target?.notesEvent).toBe("staff_tour_held");
  });

  it("skips the shadow days from the interest meeting where there is no tour", () => {
    /* Tours are a GA and FL step. requireTourLink refuses them by name
       anywhere else, so at Virtual the shadow days come straight after the
       interest meeting and that is what a press there skips. */
    const target = skipTargetForStage("interview_scheduled", VIRTUAL);
    expect(target?.skippedLabel).toBe("Shadow Days");
    expect(target?.landingStage).toBe("shadow_day_completed");
    expect(target?.notesEvent).toBe("staff_shadow_day_held");
  });

  it("skips the application after a tour", () => {
    const target = skipTargetForStage("tour_completed", GA);
    expect(target?.skippedLabel).toBe("Application");
    expect(target?.landingStage).toBe("application_submitted");
    /* The decision gate's letter, not a notes letter - see the next block. */
    expect(target?.notesEvent).toBe("decision_gate_opened");
  });
});

describe("Jimmy's own example", () => {
  it("skips the shadow days from the decision gate and asks for the decision", () => {
    const target = skipTargetForStage("application_submitted", GA);
    expect(target?.skippedLabel).toBe("Shadow Days");
    expect(target?.landingStage).toBe("shadow_day_completed");
    expect(target?.notesEvent).toBe("staff_shadow_day_held");
  });

  it("lands on a stage whose page offers Accept and Deny", () => {
    const target = skipTargetForStage("application_submitted", GA);
    /* This is the whole point of landing there: occasionForStage turns the
       landing stage into the shadow day's page, which is the one carrying
       "Accept - send email" and "Deny - send email". */
    expect(occasionForStage(target!.landingStage)).toBe("shadow_day");
  });
});

describe("the fault occasionForStage would have caused", () => {
  it("does not send a child who has applied back to the tour", () => {
    /* occasionForStage says interest_meeting for this stage. The ladder must
       not agree with it. */
    expect(occasionForStage("application_submitted")).toBe("interest_meeting");
    const target = skipTargetForStage("application_submitted", GA);
    expect(target?.skippedLabel).not.toBe("Tour");
    expect(stepOf(target!.landingStage)).toBeGreaterThan(stepOf("application_submitted"));
  });
});

describe("there is nothing to skip past the shadow days", () => {
  /* Jimmy, on the Accept/Deny letter: "no skip button here". */
  it.each(["shadow_day_scheduled", "shadow_day_completed", "accepted", "enrolled"])(
    "%s offers no skip",
    (stage) => {
      expect(skipTargetForStage(stage, GA)).toBeNull();
    }
  );

  it.each(["declined", "waitlisted", "not_returning", "admissions_review", null, "nonsense"])(
    "%s is not in the flow and offers no skip",
    (stage) => {
      expect(skipTargetForStage(stage, GA)).toBeNull();
    }
  );
});

describe("every press moves the child forward and records what it passed", () => {
  const pressable = LEAD_STAGES.filter(
    (s) => s.step != null && skipTargetForStage(s.value, GA) !== null
  );

  it("has a rung for every pipeline stage up to the shadow days", () => {
    /* Steps 1 to 9. If a stage is ever added in the middle of the flow this
       count changes and somebody has to decide what skipping it means, rather
       than discovering that it silently cannot be skipped. */
    expect(pressable.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it.each(pressable.map((s) => s.value))("%s lands strictly forward", (stage) => {
    const target = skipTargetForStage(stage, GA)!;
    expect(stepOf(target.landingStage)).toBeGreaterThan(stepOf(stage));
  });

  it.each(pressable.map((s) => s.value))("%s records the landing stage as skipped", (stage) => {
    const target = skipTargetForStage(stage, GA)!;
    /* The card has to be able to say the stage was skipped, which it reads by
       asking whether the child's CURRENT stage is in this array. */
    expect(target.skipped).toContain(target.landingStage);
  });

  it.each(pressable.map((s) => s.value))("%s never records a stage it did not pass", (stage) => {
    const target = skipTargetForStage(stage, GA)!;
    for (const skipped of target.skipped) {
      expect(stepOf(skipped)).toBeGreaterThan(stepOf(stage));
      expect(stepOf(skipped)).toBeLessThanOrEqual(stepOf(target.landingStage));
    }
  });
});
