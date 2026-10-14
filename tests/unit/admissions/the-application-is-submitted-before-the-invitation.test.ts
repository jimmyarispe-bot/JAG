import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { GATES } from "@/lib/admissions/gates/definitions";
import { applicationFeeGate } from "@/lib/admissions/fee/gate";

/**
 * APPLICATION COMPLETED -> THE GATE ASKS HER -> SHE ANSWERS YES -> THE FAMILY
 * GETS THE BOOKING LINK.
 *
 * Jimmy, 14 October 2026, in his own words:
 *
 *   "it needs to be this way then - So the intended order is: application
 *    completed -> the gate puts the question in front of her -> she reads it ->
 *    she answers yes -> the family gets the booking link."
 *
 * ── WHAT IT WAS BEFORE, AND IT WAS DELIBERATE ───────────────────────────────
 *
 * submitInvitedApplicationAction - the /apply/start/<token> door, the one every
 * invited family actually uses - saved the answers, wrote
 * lead_stage = application_submitted with a RAW UPDATE, and mailed the family
 * the shadow-days invitation itself. It never touched admissions_applications,
 * never checked the fee, never set submitted_at, and never opened a gate.
 *
 * That was Jimmy's instruction from 23 September - "once the parent completes
 * the application they are sent a followup email with schedule your shadow
 * days", automatic, no second question - and the file said so, including the
 * consequence in plain words: "nobody reviews a family between application and
 * shadow days."
 *
 * ── WHAT IT ALLOWED ─────────────────────────────────────────────────────────
 *
 * The test child of 13 October read lead_stage = application_submitted while
 * the application row read application_status = in_progress with no
 * submitted_at - and the shadow-days invitation had already gone. A family
 * could be invited to shadow days on an application nobody had completed and
 * nobody had paid for. Live at all five campuses.
 *
 * ── WHY THESE ASSERTIONS READ SOURCE TEXT ───────────────────────────────────
 *
 * The thing being asserted is an ORDER OF OPERATIONS inside one server action
 * that talks to the database, Square and the mailer. Running it needs all
 * three. What can be checked without them is that the action reaches for the
 * right machinery and no longer reaches for the wrong one - and the wrong one,
 * a direct shadow_days_invited send, is a single identifiable string.
 *
 * A source-text test is a weak test, and it is here because a strong one is not
 * available. It is paired with a real end-to-end run against the test campus.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

const INVITED = read("src/lib/admissions/apply-link/actions.ts");
const PORTAL = read("src/lib/admissions/portal/actions.ts");

/** Comments stripped: a rule about code must not pass on a comment. */
const code = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const INVITED_CODE = code(INVITED);

describe("the invited application is actually submitted", () => {
  it("marks the application row submitted, with a date", () => {
    /* The two things a stage of "application_submitted" is shorthand for. */
    expect(INVITED_CODE).toContain("admissions_applications");
    expect(INVITED_CODE).toMatch(/application_status:\s*"submitted"/);
    expect(INVITED_CODE).toContain("submitted_at");
  });

  it("runs the fee gate, the same one the portal runs", () => {
    /* Jimmy, 28 September: the $100 goes in at the end of the application and
       before it can be submitted. The portal has enforced that since; this door
       never had. One gate, both doors. */
    expect(INVITED_CODE).toContain("applicationFeeGate");
    expect(PORTAL).toContain("applicationFeeGate");
  });

  it("refuses rather than submitting when there is no application row", () => {
    /* The whole point of the change is that the stage must not claim something
       that did not happen. No row means nothing to submit. */
    expect(INVITED_CODE).toContain("!applicationId");
  });
});

describe("the gate asks her, and nothing else invites the family", () => {
  it("moves the stage through transitionCaseStage, not a raw update", () => {
    /* transitionCaseStage is what writes the history row, syncs the workflow,
       records the activity AND opens the gate. A raw update does none of it. */
    expect(INVITED_CODE).toContain("transitionCaseStage");
    expect(INVITED_CODE).toMatch(/"application_submitted"/);
  });

  it("no longer writes lead_stage by hand", () => {
    /* THE EXACT LINE THAT WAS THERE. If it comes back, the gate stops opening
       and nothing else in this file would notice. */
    expect(INVITED_CODE).not.toMatch(/lead_stage:\s*"application_submitted"/);
  });

  it("does not mail the shadow-days invitation itself", () => {
    /* THE FAULT, NAMED. Sending it here puts the booking link in front of a
       family before anybody has read their application - and then sends it
       again when she answers yes. One letter, one sender. */
    expect(INVITED_CODE).not.toContain("shadow_days_invited");
  });

  it("sends the two letters that DO belong to submitting", () => {
    /* The family's receipt and the leader's "an application came in".
       onApplicationSubmitted dispatches application_submitted, which
       LEGACY_EVENT_MAP fans to both. */
    expect(INVITED_CODE).toContain("onApplicationSubmitted");
  });
});

describe("the gate on the other end of that stage", () => {
  it("opens at application_submitted", () => {
    /* The two halves have to name the same stage, or the question never
       appears and the family waits on a yes nobody was asked for. */
    expect(GATES.invite_to_shadow_days.opensAtStage).toContain(
      "application_submitted"
    );
  });

  it("is the thing that sends the booking link, on yes", () => {
    const yes = GATES.invite_to_shadow_days.branches.find((b) => b.answer === "yes");
    expect(yes?.familyEvent).toBe("shadow_days_invited");
  });

  it("sends Jimmy's decline letter on no, and declines the lead", () => {
    const no = GATES.invite_to_shadow_days.branches.find((b) => b.answer === "no");
    expect(no?.familyEvent).toBe("shadow_days_not_invited");
    expect(no?.stage).toBe("declined");
  });
});

describe("the fee gate's own rules, at the boundary this door now sits on", () => {
  it("lets a campus that charges nothing through", () => {
    /* How the test campus passes: a zero written on the row, not an exception
       in the code. Explicit zero, not an absent value. */
    expect(applicationFeeGate({ status: "unpaid", amountCents: 0 })).toEqual({
      ok: true,
      because: "no_fee_charged",
    });
  });

  it("stops an unpaid fee, and says the amount", () => {
    const gate = applicationFeeGate({ status: "unpaid", amountCents: 10000 });
    expect(gate.ok).toBe(false);
    if (gate.ok) return;
    expect(gate.reason).toContain("$100.00");
    /* A parent must be told their answers are safe, or they fill it in twice. */
    expect(gate.reason).toContain("Nothing you have entered is lost");
  });

  it("does NOT let 'unknown' through", () => {
    /* An application that predates fee tracking is not an application that was
       paid for. This is the assertion that keeps a convenience from becoming a
       hole once real money is on these rows. */
    expect(applicationFeeGate({ status: "unknown", amountCents: 10000 }).ok).toBe(
      false
    );
  });

  it("takes paid and waived", () => {
    expect(applicationFeeGate({ status: "paid", amountCents: 10000 }).ok).toBe(true);
    expect(applicationFeeGate({ status: "waived", amountCents: 10000 }).ok).toBe(true);
  });
});

describe("the 23 September decision is recorded as reversed, not lost", () => {
  it("quotes him on the new order where the old comment used to be", () => {
    /* A diff that silently removes "nobody reviews a family between application
       and shadow days" reads like an accident. It was a decision, and so is
       this. Both are in the file. */
    expect(INVITED).toContain("the gate puts the question in front of her");
    expect(INVITED).toContain("23 September");
  });
});
