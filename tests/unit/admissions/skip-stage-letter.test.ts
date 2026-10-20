/**
 * WHAT A SKIP TELLS THE SCHOOL LEADER - 19 October 2026.
 *
 * Danni, on John Nygren (FL): "it sent me an email that said: 'Meeting with
 * Parent is happening now, take notes email' It should have said: Send the
 * schedule tour link. (the parent still has not received an email from me)."
 */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createServiceRoleClient: () => ({}) }));
vi.mock("@/lib/admissions/communications/engine", () => ({
  processCommunicationQueue: async () => undefined,
}));

import { skipLetterFor, skipTargetForStage } from "@/lib/admissions/automation/skip-stage";

const FL = "The Academy FL";
const VIRTUAL = "The Academy Virtual";

afterEach(() => {
  delete process.env.ADMISSIONS_TOUR_GATE;
});

describe("the letter after a skip", () => {
  it("skipping the interest meeting at FL says Send the schedule tour link", () => {
    process.env.ADMISSIONS_TOUR_GATE = "on";
    const target = skipTargetForStage("new_inquiry", FL)!;
    const letter = skipLetterFor(target, FL)!;
    expect(letter.subject).toBe("Send the schedule tour link: {{student_full_name}}");
    expect(letter.body).toContain("{{post_call_link}}");
    expect(letter.body).toContain("has not received an email from you yet");
    expect(letter.subject).not.toMatch(/happening now/i);
    expect(letter.body).not.toMatch(/happening now/i);
  });

  it("where there is no tour it offers the shadow day invite instead", () => {
    process.env.ADMISSIONS_TOUR_GATE = "on";
    const target = skipTargetForStage("new_inquiry", VIRTUAL)!;
    expect(skipLetterFor(target, VIRTUAL)!.subject).toBe(
      "Send the shadow day invite: {{student_full_name}}"
    );
  });

  it("skipping the tour asks for the application", () => {
    const target = skipTargetForStage("interest_meeting_held", FL)!;
    expect(skipLetterFor(target, FL)!.subject).toBe("Send the application: {{student_full_name}}");
  });

  it("skipping the shadow days asks accept or deny, with no skip button", () => {
    const target = skipTargetForStage("application_submitted", FL)!;
    const letter = skipLetterFor(target, FL)!;
    expect(letter.subject).toBe("Accept or deny: {{student_full_name}}");
    expect(letter.body).not.toContain("{{skip_stage_link}}");
  });

  it("skipping the application keeps the Decision needed letter", () => {
    const target = skipTargetForStage("tour_completed", FL)!;
    expect(skipLetterFor(target, FL)).toBeNull();
  });
});
