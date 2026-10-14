/**
 * THE SHADOW DAY STEP: the last gate, and the first thing in the JAG that can
 * answer it.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * 13 October 2026, Jimmy, having booked shadow days for 1:30am and waited:
 * "i didn't receive any followup email with decision to accept or send denial
 * letter."
 *
 * He was right, and it was worse than a missing email. The booking scan had
 * recognised a shadow day by its title since 11 October and recorded NOTHING -
 * there was nowhere to put it. So nothing ever wrote shadow_day_completed, and
 * accept_or_deny, the gate that opens behind that stage, had never opened once
 * in the life of this platform. Eight children were sitting at Shadow Day
 * Scheduled with nothing behind them.
 *
 * Migration 550 gave the booking a table, 552 gave the appointment a letter,
 * 553 taught the outcome column the two new words, and this is the test that
 * says the pieces agree with each other.
 */

import { describe, it, expect } from "vitest";

import { SHADOW_DAY_NOTES_EVENT } from "@/lib/admissions/chase/run";
import {
  POST_CALL_ACTIONS,
  actionsForPage,
  occasionForStage,
} from "@/lib/admissions/automation/post-call";
import {
  COMMUNICATION_TRIGGER_EVENTS,
  TRIGGER_EVENT_LABELS,
} from "@/lib/admissions/communications/types";
import { GATES } from "@/lib/admissions/gates/definitions";

describe("the shadow day's notes letter can be emitted", () => {
  it("is the event migration 552's letter listens on", () => {
    expect(SHADOW_DAY_NOTES_EVENT).toBe("staff_shadow_day_held");
  });

  it("is in the trigger union, or notifyAdmissionsEvent refuses it", () => {
    /* The union is what makes a typo a compile error instead of a letter that
       silently never sends. */
    expect(COMMUNICATION_TRIGGER_EVENTS).toContain("staff_shadow_day_held");
  });

  it("has a label, so it is readable in the template admin", () => {
    /* TRIGGER_EVENT_LABELS is the map that must name every event, and the one
       that caught me twice in a day on 4 October. */
    expect(TRIGGER_EVENT_LABELS.staff_shadow_day_held).toBe(
      "Shadow Day Completed (staff)"
    );
  });
});

describe("occasionForStage", () => {
  it("is the shadow day at Shadow Day Scheduled and at Shadow Day Completed", () => {
    /* BOTH, AND THE SECOND IS THE RETRY PATH - the identical reason the tour
       counts tour_completed. Pressing Accept marks the days held and moves the
       child to shadow_day_completed BEFORE the decision is attempted, so a
       refused decision leaves her there. If only shadow_day_scheduled counted
       she would be handed the interest-meeting page on reload, offering to
       invite a family to shadow days they had just finished. That is exactly
       what happened to the tour on 13 October. */
    expect(occasionForStage("shadow_day_scheduled")).toBe("shadow_day");
    expect(occasionForStage("shadow_day_completed")).toBe("shadow_day");
  });

  it("leaves the tour and the interest meeting exactly as they were", () => {
    expect(occasionForStage("tour_scheduled")).toBe("tour");
    expect(occasionForStage("tour_completed")).toBe("tour");
    for (const stage of [
      "inquiry",
      "interest_meeting_scheduled",
      "interest_meeting_held",
      "tour_requested",
      "application_submitted",
      "declined",
      null,
      undefined,
    ]) {
      expect(occasionForStage(stage)).toBe("interest_meeting");
    }
  });
});

describe("the shadow day's two buttons", () => {
  it("offers exactly Jimmy's two, in his words, Accept first", () => {
    /* Jimmy, 14 October, answering whether these should be single words or
       sentences: "let's make the buttons this - accept-send email, deny-send
       email". His words, used literally, hyphen and all. */
    for (const fork of ["tour", "shadow_day"] as const) {
      expect(actionsForPage(fork, "shadow_day").map((o) => o.label)).toEqual([
        "Accept - send email",
        "Deny - send email",
      ]);
    }
  });

  it("offers the same two at every campus", () => {
    /* A shadow day page carries no fork. The decision after a shadow day is
       the same wherever the shadow day happened - two days at GA and FL, one
       at HS and Virtual, same question at the end of it. */
    expect(actionsForPage("tour", "shadow_day").map((o) => o.value)).toEqual(
      actionsForPage("shadow_day", "shadow_day").map((o) => o.value)
    );
  });

  it("does NOT offer the two shared buttons", () => {
    /* THE BUG THIS PREVENTS. "Not the right school" and "Not yet, I will
       follow up" both read occasion === null - every occasion - which was true
       while there were only two. On a shadow day page they would be a second
       way to deny by another name, and a button that moves a child BACKWARDS
       to interest_meeting_held, past an application and a shadow day. */
    const values = actionsForPage("shadow_day", "shadow_day").map((o) => o.value);
    expect(values).not.toContain("post_call_not_the_right_school");
    expect(values).not.toContain("post_call_follow_up");
    expect(values).toHaveLength(2);
  });

  it("never offers an accept or a deny on the other two pages", () => {
    /* The other half of the same mistake: accepting a child at the end of an
       interest call, or at the end of a tour, before anybody has met them for
       a day. */
    for (const fork of ["tour", "shadow_day"] as const) {
      for (const occasion of ["interest_meeting", "tour"] as const) {
        const values = actionsForPage(fork, occasion).map((o) => o.value);
        expect(values).not.toContain("shadow_day_accepted");
        expect(values).not.toContain("shadow_day_denied");
      }
    }
  });

  it("keeps the interest meeting and the tour byte for byte as they were", () => {
    /* Both of these pages are approved and in use. Adding a third occasion
       must change neither. */
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
    expect(actionsForPage("tour", "tour").map((o) => o.label)).toEqual([
      "Send the application",
      "Not yet, I will follow up",
      "Not the right school",
    ]);
  });

  it("promises the acceptance letter and the packet, and promises the denial nothing", () => {
    const byValue = Object.fromEntries(
      actionsForPage("shadow_day", "shadow_day").map((o) => [o.value, o.consequence])
    );

    expect(byValue.shadow_day_accepted).toContain("acceptance");
    expect(byValue.shadow_day_accepted).toContain("enrollment packet");
    expect(byValue.shadow_day_accepted).toContain("Accepted");

    /* THE HONEST BUTTON. Its label says "send email" because those are Jimmy's
       words, but there is no approved decline letter for a decision at this
       step: the only one in the JAG, application_declined_email, is keyed to
       shadow_days_not_invited - a refusal to invite, not a refusal after the
       days happened. Firing it from here would put a false sentence in a
       family's inbox and a false event in the record.

       So the consequence line says nothing is sent, the done screen says it
       again, and this assertion is what stops somebody quietly "fixing" the
       wording before the letter exists. */
    /* THE DENIAL NOW SENDS, AND THIS ASSERTION FLIPPED WITH IT.

       For half a day it read toContain("Nothing is emailed"), because there was
       no approved decline letter for a decision at this step and the button
       said so rather than promising one. Jimmy gave the words on 14 October -
       "yes good" to the opening, "read naturally" to the day count - and
       migration 554 is the letter, five campus rows.

       What this guards either way: the consequence line and the behaviour must
       change in the SAME commit. A button that promises a letter the code does
       not send, or stays silent about one it does, is the same fault as the
       acceptance screen promising a packet nobody built. */
    expect(byValue.shadow_day_denied).toContain("emailed the decision");
    expect(byValue.shadow_day_denied).toContain("Declined");
    expect(byValue.shadow_day_denied).not.toContain("Nothing is emailed");
  });
});

describe("every button's value is one the database will accept", () => {
  it("matches lead_call_outcomes_outcome_check exactly", () => {
    /* THE TRIPWIRE. recordPostCallDecision writes the notes FIRST, before any
       stage move or letter, so the CHECK constraint on lead_call_outcomes is
       the very first thing a new button meets. On 13 October the tour's
       eleventh button was not in that list and the first live test died on the
       first statement: "That did not save."

       Migration 553 adds these two. ADDING A VALUE TO THIS LIST MEANS A
       MIGRATION - nothing in TypeScript can see that constraint. */
    expect([...POST_CALL_ACTIONS].map((a) => a.value).sort()).toEqual(
      [
        "application_invited",
        "post_call_follow_up",
        "post_call_not_the_right_school",
        "shadow_day_accepted",
        "shadow_day_denied",
        "shadow_days_invited",
        "tour_requested",
      ].sort()
    );
  });
});

describe("the gate this button answers", () => {
  it("opens at shadow_day_completed, which is what the button writes", () => {
    /* The two halves have to name the same stage. accept_or_deny has waited
       behind this stage since September for something to write it. */
    expect(GATES.accept_or_deny.opensAtStage).toContain("shadow_day_completed");
  });

  it("has exactly two branches, and they are accept and deny", () => {
    expect(GATES.accept_or_deny.branches.map((b) => b.answer)).toEqual([
      "accept",
      "deny",
    ]);
  });

  it("delegates both branches to the decision path, as this page now does", () => {
    /* TWO DOORS ONTO ONE DECISION MUST NOT DO TWO DIFFERENT THINGS. The gate's
       branches send no letters of their own - they hand the answer to
       applyAdmissionsDecision. The button in the letter hands it to the same
       function, with the same arguments, so an acceptance made on a phone at
       the school gate and one made on the decisions board are one event. */
    expect(
      GATES.accept_or_deny.branches.map((b) => b.delegatesToDecision)
    ).toEqual(["accept", "deny"]);
    expect(GATES.accept_or_deny.branches.map((b) => b.familyEvent)).toEqual([
      null,
      null,
    ]);
  });
});
