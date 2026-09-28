import { describe, expect, it } from "vitest";

import {
  lifecycleForNewPlan,
  type AwardChoice,
} from "@/lib/finance/plan-editor-shared";

/**
 * WHERE A PLAN STARTS, AND WHY IT MATTERS.
 *
 * Scenario #2 begins with a family saying they will receive a scholarship. The
 * amount does not exist yet: GA GOAL decides later, an Academy-Based award is
 * decided by Jimmy later. Migration 446 lets that be recorded honestly -
 * status 'applied', no awarded amount at all.
 *
 * A plan built for such a child must not sit in 'draft' looking like something
 * somebody forgot to finish. It is blocked, on a named figure, and the reason
 * is what plans_waiting_on_a_figure shows and what stops a contract going out
 * against a number nobody has decided.
 */

function award(over: Partial<AwardChoice> = {}): AwardChoice {
  return {
    id: over.id ?? "a1",
    programName: over.programName ?? "Georgia GOAL",
    awardedAmount: over.awardedAmount ?? 0,
    amountIsDecided: over.amountIsDecided ?? true,
    awardYear: over.awardYear ?? "2026-2027",
    status: over.status ?? "awarded",
  };
}

describe("a plan with nothing outstanding", () => {
  it("starts as a draft when the child holds no awards at all", () => {
    expect(lifecycleForNewPlan([])).toEqual({ lifecycle: "draft", awaitingReason: null });
  });

  it("starts as a draft when every award has a decided amount", () => {
    const result = lifecycleForNewPlan([
      award({ id: "a1", programName: "Georgia GOAL", awardedAmount: 6200 }),
      award({ id: "a2", programName: "GA Special Needs", awardedAmount: 8000 }),
    ]);
    expect(result.lifecycle).toBe("draft");
    expect(result.awaitingReason).toBeNull();
  });

  it("is not blocked by a denied award, which is a decision", () => {
    const result = lifecycleForNewPlan([
      award({ id: "a1", programName: "Georgia GOAL", status: "denied", awardedAmount: 0 }),
    ]);
    expect(result.lifecycle).toBe("draft");
  });
});

describe("a plan waiting on a figure", () => {
  it("names the one programme it is waiting on", () => {
    const result = lifecycleForNewPlan([
      award({ id: "a1", programName: "Georgia GOAL", status: "applied", amountIsDecided: false }),
    ]);
    expect(result.lifecycle).toBe("awaiting_scholarship_amounts");
    expect(result.awaitingReason).toBe("Waiting on the award amount for Georgia GOAL.");
  });

  it("names every programme when more than one is undecided", () => {
    const result = lifecycleForNewPlan([
      award({ id: "a1", programName: "Georgia GOAL", status: "applied", amountIsDecided: false }),
      award({ id: "a2", programName: "Academy-Based", status: "applied", amountIsDecided: false }),
    ]);
    expect(result.awaitingReason).toBe(
      "Waiting on award amounts for Academy-Based, Georgia GOAL."
    );
  });

  it("blocks on an undecided award even when another one is settled", () => {
    const result = lifecycleForNewPlan([
      award({ id: "a1", programName: "GA Special Needs", awardedAmount: 8000 }),
      award({ id: "a2", programName: "Georgia GOAL", status: "applied", amountIsDecided: false }),
    ]);
    expect(result.lifecycle).toBe("awaiting_scholarship_amounts");
    expect(result.awaitingReason).toBe("Waiting on the award amount for Georgia GOAL.");
  });

  it("blocks on a missing amount even when the status says awarded", () => {
    // A row that claims to be awarded with no figure should not have got past
    // migration 446's constraint. If one ever does, the plan still refuses to
    // treat the absent number as zero.
    const result = lifecycleForNewPlan([
      award({ id: "a1", programName: "Step Up For Students", amountIsDecided: false }),
    ]);
    expect(result.lifecycle).toBe("awaiting_scholarship_amounts");
  });

  it("does not name the same programme twice", () => {
    const result = lifecycleForNewPlan([
      award({ id: "a1", programName: "Georgia GOAL", status: "applied", amountIsDecided: false }),
      award({ id: "a2", programName: "Georgia GOAL", status: "applied", amountIsDecided: false }),
    ]);
    expect(result.awaitingReason).toBe("Waiting on the award amount for Georgia GOAL.");
  });

  it("always gives a reason when it says it is waiting", () => {
    // Migration 445 refuses awaiting_scholarship_amounts with a null reason.
    // This is the application side of that constraint.
    const result = lifecycleForNewPlan([
      award({ status: "applied", amountIsDecided: false }),
    ]);
    expect(result.awaitingReason).not.toBeNull();
    expect(result.awaitingReason?.length ?? 0).toBeGreaterThan(0);
  });
});
