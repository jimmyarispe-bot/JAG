/**
 * The decision gates.
 *
 * These tests are mostly about consequences: what a school leader is told will
 * happen must match what the server actually does. A button whose label and
 * behaviour disagree is worse than no button, because a family receives the
 * result either way.
 */

import { describe, expect, it } from "vitest";
import {
  GATES,
  GATE_KEYS,
  branchFor,
  gateFor,
  gateOpeningAtStage,
  type GateBranch,
} from "@/lib/admissions/gates/definitions";
import { LEAD_STAGES } from "@/lib/constants/admissions";
import { COMMUNICATION_TRIGGER_EVENTS, MERGE_FIELDS } from "@/lib/admissions/communications/types";

const allBranches: GateBranch[] = GATE_KEYS.flatMap((k) => [...GATES[k].branches]);

describe("gate definitions", () => {
  it("covers the three points the process needs a human", () => {
    expect(GATE_KEYS).toEqual(["invite_to_apply", "invite_to_shadow_days", "accept_or_deny"]);
  });

  it("gives every branch a consequence the leader reads before clicking", () => {
    for (const branch of allBranches) {
      expect(branch.label.length).toBeGreaterThan(0);
      expect(branch.consequence.length).toBeGreaterThan(20);
    }
  });

  it("only ever sends a family email that actually exists as a trigger event", () => {
    for (const branch of allBranches) {
      if (!branch.familyEvent) continue;
      // A template keyed to an event nothing can fire is a silently unsent email.
      expect(COMMUNICATION_TRIGGER_EVENTS).toContain(branch.familyEvent);
    }
  });

  it("only ever moves a lead to a stage the system knows", () => {
    const known = LEAD_STAGES.map((s) => s.value);
    for (const branch of allBranches) {
      if (!branch.stage) continue;
      expect(known).toContain(branch.stage);
    }
    for (const key of GATE_KEYS) {
      for (const stage of GATES[key].opensAtStage) {
        expect(known).toContain(stage);
      }
    }
  });

  it("never advances the pipeline on a yes — an invitation is not progress", () => {
    // We invited a family; we did not observe them doing anything. The stage
    // moves when they start the application or book the days. Treating an
    // invitation as progress is how a pipeline starts lying about itself.
    expect(GATES.invite_to_apply.branches[0].stage).toBeNull();
    expect(GATES.invite_to_shadow_days.branches[0].stage).toBeNull();
  });

  it("marks a lead declined on either no, and keeps it in the pipeline", () => {
    const noApply = branchFor(GATES.invite_to_apply, "no");
    const noShadow = branchFor(GATES.invite_to_shadow_days, "no");
    expect(noApply?.stage).toBe("declined");
    expect(noShadow?.stage).toBe("declined");
    // Per Jimmy: a no before shadow days keeps the record visible; only the
    // final deny archives it.
    expect(noApply?.archive).toBe(false);
    expect(noShadow?.archive).toBe(false);
    expect(branchFor(GATES.accept_or_deny, "deny")?.archive).toBe(true);
  });

  it("hands accept and deny to the decision path that already exists", () => {
    // submitAdmissionsDecision generates the enrollment packet, writes the
    // admissions_decisions row and updates the application. The gate must not
    // reimplement any of that.
    expect(branchFor(GATES.accept_or_deny, "accept")?.delegatesToDecision).toBe("accept");
    expect(branchFor(GATES.accept_or_deny, "deny")?.delegatesToDecision).toBe("deny");
    // And therefore sends no email of its own.
    expect(branchFor(GATES.accept_or_deny, "accept")?.familyEvent).toBeNull();
    expect(branchFor(GATES.accept_or_deny, "deny")?.familyEvent).toBeNull();
  });

  it("delegating branches never also move the stage themselves", () => {
    // Two things moving the same lead is how a stage ends up depending on
    // which code path ran last.
    for (const branch of allBranches) {
      if (branch.delegatesToDecision) expect(branch.stage).toBeNull();
    }
  });

  it("opens each gate only where the family has actually reached", () => {
    expect(GATES.invite_to_apply.opensAtStage).toContain("tour_completed");
    expect(GATES.invite_to_shadow_days.opensAtStage).toContain("application_submitted");
    expect(GATES.accept_or_deny.opensAtStage).toContain("shadow_day_completed");
  });

  it("resolves gates and branches by key, and refuses unknown ones", () => {
    expect(gateFor("invite_to_apply")?.title).toBe("Invite to apply");
    expect(gateFor("not_a_gate")).toBeNull();
    expect(branchFor(GATES.invite_to_apply, "accept")).toBeNull();
    expect(branchFor(GATES.accept_or_deny, "yes")).toBeNull();
  });
});

describe("which gate opens at which stage", () => {
  it("opens the right gate for each trigger stage", () => {
    expect(gateOpeningAtStage("tour_completed")).toBe("invite_to_apply");
    expect(gateOpeningAtStage("interest_meeting_held")).toBe("invite_to_apply");
    expect(gateOpeningAtStage("application_submitted")).toBe("invite_to_shadow_days");
    expect(gateOpeningAtStage("shadow_day_completed")).toBe("accept_or_deny");
  });

  it("opens nothing at the stages a gate would be wrong at", () => {
    // A gate opening on "declined" or "enrolled" would ask a school leader to
    // decide something that has already been decided.
    for (const stage of ["new_inquiry", "declined", "enrolled", "accepted", "waitlisted"]) {
      expect(gateOpeningAtStage(stage)).toBeNull();
    }
  });

  it("never maps one stage to two gates", () => {
    // Two gates opening on one transition means two questions about the same
    // family at the same moment, and no defined order between them.
    const seen = new Set<string>();
    for (const key of GATE_KEYS) {
      for (const stage of GATES[key].opensAtStage) {
        expect(seen.has(stage)).toBe(false);
        seen.add(stage);
      }
    }
  });

  it("never opens a gate at a stage one of its own branches sets", () => {
    // Otherwise answering a gate re-opens it, and a family is asked about
    // forever.
    for (const key of GATE_KEYS) {
      const opensAt = new Set<string>(GATES[key].opensAtStage);
      for (const branch of GATES[key].branches) {
        if (branch.stage) expect(opensAt.has(branch.stage)).toBe(false);
      }
    }
  });
});

describe("merge fields the gate emails depend on", () => {
  it("knows shadow_days_link and decisions_link", () => {
    // renderTemplate leaves an UNKNOWN token in place as literal text, so a
    // template naming a field that does not exist mails a parent the characters
    // "{{shadow_days_link}}".
    expect(MERGE_FIELDS).toContain("shadow_days_link");
    expect(MERGE_FIELDS).toContain("decisions_link");
  });
});

describe("the stages the database has always accepted", () => {
  it("now exist in TypeScript too", () => {
    // Migration 225 widened the CHECK constraint; the constants file was never
    // updated, so any code touching these stages could not compile.
    const known = LEAD_STAGES.map((s) => s.value);
    for (const stage of [
      "interest_meeting_held",
      "tour_requested",
      "shadow_day_scheduled",
      "shadow_day_completed",
      "not_returning",
    ]) {
      expect(known).toContain(stage);
    }
  });

  it("gives every stage a label and a colour", () => {
    for (const stage of LEAD_STAGES) {
      expect(stage.label.length).toBeGreaterThan(0);
      expect(stage.color).toMatch(/^bg-/);
    }
  });
});
