/**
 * The four button links, and the one that was never a button.
 *
 * On 5 October the first real inquiry through the live form produced a staff
 * notice whose "Send them the interest meeting link" went to a SIGN-IN PAGE.
 * The token had been minted, written to the lead, and then read by nothing:
 * absent from the merge projection, absent from the engine's mapping, and
 * passed as an override by no caller. {{interest_link_action}} had rendered
 * its fallback every single time.
 *
 * Since migration 489 that link is the only way a family hears anything at
 * all. These tests exist so it cannot quietly stop being a link again.
 */

import { describe, expect, it } from "vitest";

import { buildMergeValues } from "@/lib/admissions/communications/merge-fields";
import { LEAD_MERGE_CONTEXT_COLS } from "@/lib/admissions/communications/projections";

const TOKEN = "b".repeat(64);

describe("the projection asks for every token a letter can render", () => {
  /*
   * THE PROJECTION IS THE PART THAT WAS WRONG, so it is the part asserted.
   * A merge field can only resolve what the select string fetched, and this
   * failure was invisible in every unit test that built a context by hand.
   */
  it.each([
    "interest_link_token",
    "interest_call_token",
    "application_call_token",
    "post_call_token",
    "application_access_token",
  ])("selects %s", (column) => {
    expect(LEAD_MERGE_CONTEXT_COLS).toContain(column);
  });
});

describe("each token renders its own page, not a sign-in", () => {
  it.each([
    ["interest_link_action", "interestLinkToken", "/send-interest-link/"],
    ["call_link", "interestCallToken", "/call/"],
    ["application_call_link", "applicationCallToken", "/application-call/"],
    ["post_call_link", "postCallToken", "/post-call/"],
  ])("%s", (field, ctxKey, path) => {
    const values = buildMergeValues({ [ctxKey]: TOKEN, leadId: "lead-1" });
    expect(values[field as keyof typeof values]).toContain(path + TOKEN);
  });
});

describe("the fallback is the case page, and it means something is wrong", () => {
  /*
   * Kept, not removed. A lead with no token should land somewhere real, and
   * a school leader can sign in where a parent cannot. The fault is that it
   * was reached EVERY time, not that it exists.
   */
  it("falls back to the case page when the token is missing", () => {
    const values = buildMergeValues({ leadId: "lead-1" });
    expect(values.interest_link_action).toContain("/dashboard/admissions/cases/lead-1");
    expect(values.interest_link_action).not.toContain("/send-interest-link/");
  });

  it("falls back for a blank token too, not just an absent one", () => {
    const values = buildMergeValues({ interestLinkToken: "   ", leadId: "lead-1" });
    expect(values.interest_link_action).toContain("/dashboard/admissions/cases/lead-1");
  });
});
