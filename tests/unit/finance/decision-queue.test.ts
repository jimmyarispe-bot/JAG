import { describe, expect, it } from "vitest";

import {
  awardsNobodyIsWaitingOn,
  type DecisionQueue,
  type UndecidedAward,
  type WaitingPlan,
} from "@/lib/finance/decision-queue";

/**
 * The awards nobody is waiting on are the dangerous ones.
 *
 * A plan marked awaiting_scholarship_amounts is visible and blocked - it
 * cannot become a contract. An application with no plan blocked on it is the
 * opposite: nothing stops a contract going out, and the figure on it will be
 * whatever the plan was built with before the family applied.
 */

function plan(over: Partial<WaitingPlan> = {}): WaitingPlan {
  return {
    planId: over.planId ?? "p1",
    studentId: over.studentId ?? "s1",
    student: over.student ?? "Andrew Ribeiro",
    school: over.school ?? "The Academy GA",
    schoolYear: over.schoolYear ?? "2026-2027",
    lifecycle: over.lifecycle ?? "awaiting_scholarship_amounts",
    awaitingReason: over.awaitingReason ?? "Waiting on the award amount for Georgia GOAL.",
    daysWaiting: over.daysWaiting ?? 3,
  };
}

function award(over: Partial<UndecidedAward> = {}): UndecidedAward {
  return {
    awardId: over.awardId ?? "w1",
    studentId: over.studentId ?? "s1",
    student: over.student ?? "Andrew Ribeiro",
    school: over.school ?? "The Academy GA",
    programName: over.programName ?? "Georgia GOAL",
    programCode: over.programCode ?? "ga_goal",
    awardYear: over.awardYear ?? "2026-2027",
    expectedAmount: over.expectedAmount ?? null,
    expectedAmountSource: over.expectedAmountSource ?? null,
    appliedOn: over.appliedOn ?? "2026-09-20",
    daysSinceApplied: over.daysSinceApplied ?? 8,
  };
}

function queue(plans: WaitingPlan[], awards: UndecidedAward[]): DecisionQueue {
  const awardsByStudent = new Map<string, UndecidedAward[]>();
  for (const a of awards) {
    const list = awardsByStudent.get(a.studentId);
    if (list) list.push(a);
    else awardsByStudent.set(a.studentId, [a]);
  }
  return { waitingPlans: plans, undecidedAwards: awards, awardsByStudent };
}

describe("awards nobody is waiting on", () => {
  it("leaves out an award whose student already has a blocked plan", () => {
    const q = queue([plan({ studentId: "s1" })], [award({ studentId: "s1" })]);
    expect(awardsNobodyIsWaitingOn(q)).toEqual([]);
  });

  it("surfaces an award whose student has no blocked plan at all", () => {
    const q = queue([], [award({ studentId: "s9", student: "Samuel Johns" })]);
    const loose = awardsNobodyIsWaitingOn(q);
    expect(loose).toHaveLength(1);
    expect(loose[0].student).toBe("Samuel Johns");
  });

  it("surfaces the one that is loose while hiding the one that is covered", () => {
    const q = queue(
      [plan({ studentId: "s1" })],
      [
        award({ awardId: "w1", studentId: "s1" }),
        award({ awardId: "w2", studentId: "s2", student: "Izabella McCallum" }),
      ]
    );
    const loose = awardsNobodyIsWaitingOn(q);
    expect(loose.map((a) => a.awardId)).toEqual(["w2"]);
  });

  it("covers every award a blocked student holds, not just the first", () => {
    const q = queue(
      [plan({ studentId: "s1" })],
      [
        award({ awardId: "w1", studentId: "s1", programName: "Georgia GOAL" }),
        award({ awardId: "w2", studentId: "s1", programName: "Academy-Based" }),
      ]
    );
    expect(awardsNobodyIsWaitingOn(q)).toEqual([]);
  });

  it("is empty when there is nothing undecided anywhere", () => {
    expect(awardsNobodyIsWaitingOn(queue([], []))).toEqual([]);
  });

  it("does not treat a plain draft's student as covered by accident", () => {
    // A draft is in the queue for a different reason - it was left unfinished,
    // not blocked on a figure. But it IS a plan for that child, and a contract
    // cannot go out from a draft either, so the award is not loose.
    const q = queue(
      [plan({ studentId: "s1", lifecycle: "draft", awaitingReason: null })],
      [award({ studentId: "s1" })]
    );
    expect(awardsNobodyIsWaitingOn(q)).toEqual([]);
  });
});
