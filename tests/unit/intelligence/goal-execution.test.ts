/**
 * Sprint 011 — Goal Execution Engine unit tests.
 */

import { describe, expect, it, vi } from "vitest";
import {
  createGoalExecutionEngine,
  GOAL_EXECUTION_ENGINE_VERSION,
  GOAL_EXECUTION_IMPACT_DIMENSIONS,
  GOAL_EXECUTION_WORKFLOW_STATUSES,
  GoalExecutionWorkflow,
  InMemoryGoalExecutionRepository,
} from "@/lib/platform/execution";
import {
  createPersistentIntelligenceMemory,
  createStrategicIntelligenceDomain,
  type StrategicFindingInput,
} from "@/lib/platform/intelligence";

function makeFindings(): StrategicFindingInput[] {
  return [
    {
      findingId: "f-1",
      title: "Cash runway pressure",
      summary: "Critical financial weakness in cash and collections",
      severity: "critical",
      kindHints: ["financial_weakness"],
      confidence: { value: 0.8, level: "high", factors: [] },
      signals: ["cash", "budget"],
    },
  ];
}

describe("Goal Execution Engine — package identity", () => {
  it("exposes Goal Execution Engine version", () => {
    expect(GOAL_EXECUTION_ENGINE_VERSION).toBe("0.1.0");
    expect(createGoalExecutionEngine).toBeTypeOf("function");
  });
});

describe("Goal Execution Engine — goals lifecycle", () => {
  it("creates, updates, and archives goals", async () => {
    const engine = createGoalExecutionEngine({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
      createId: () => "goal-1",
    });

    const created = await engine.goals.create({
      title: "Stabilize cash",
      description: "Improve runway",
      targetDate: "2026-10-11T00:00:00.000Z",
      expectedValue: "75 days cash",
      priority: "critical",
      organizationId: "org-1",
    });
    expect(created.id).toBe("goal-1");
    expect(created.status).toBe("draft");

    const approved = await engine.goals.update("goal-1", { status: "approved" });
    expect(approved.status).toBe("approved");

    const planning = await engine.goals.update("goal-1", { status: "planning" });
    expect(planning.status).toBe("planning");

    const archived = await engine.goals.archive("goal-1");
    expect(archived.archived).toBe(true);
    expect(archived.status).toBe("cancelled");
  });
});

describe("Goal Execution Engine — objectives / initiatives / tasks", () => {
  it("supports measurable objectives, initiatives, milestones, and tasks", async () => {
    const engine = createGoalExecutionEngine({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    });

    const goal = await engine.goals.create({
      id: "g1",
      title: "Grow enrollment",
      description: "Net growth",
      targetDate: "2026-12-01T00:00:00.000Z",
      expectedValue: "+25 students",
      status: "active",
    });

    const objective = await engine.objectives.create({
      id: "o1",
      goalId: goal.id,
      title: "Net enrollment",
      description: "Track net change",
      baseline: 0,
      target: 25,
      currentValue: 10,
      measurementMethod: "SIS delta",
      frequency: "monthly",
      successCriteria: "Net +25",
    });
    expect(engine.objectives.completionPercent(objective)).toBe(40);

    const initiative = await engine.initiatives.create({
      id: "i1",
      goalId: goal.id,
      objectiveIds: [objective.id],
      title: "Recruiting sprint",
      description: "Time-boxed recruiting",
      budgetAmount: 40000,
      startDate: "2026-07-11T00:00:00.000Z",
      endDate: "2026-12-01T00:00:00.000Z",
      status: "planning",
    });

    const milestone = await engine.milestones.create({
      id: "m1",
      initiativeId: initiative.id,
      title: "Kickoff",
      dueDate: "2026-08-01T00:00:00.000Z",
      completionPercent: 50,
    });

    const task = await engine.tasks.create({
      id: "t1",
      initiativeId: initiative.id,
      milestoneId: milestone.id,
      goalId: goal.id,
      title: "Launch campaign",
      owner: "Admissions Lead",
      dueDate: "2026-07-20T00:00:00.000Z",
      priority: "high",
      completionPercent: 25,
      evidence: [{ evidenceId: "ev-1", label: "Campaign brief" }],
      notes: ["Creative approved"],
      dependencyIds: [],
    });

    expect(task.owner).toBe("Admissions Lead");
    expect(task.evidence).toHaveLength(1);
    expect(milestone.completionPercent).toBe(50);
  });
});

describe("Goal Execution Engine — workflow", () => {
  it("enforces workflow transitions", () => {
    const workflow = new GoalExecutionWorkflow();
    expect(GOAL_EXECUTION_WORKFLOW_STATUSES).toContain("on_track");
    expect(workflow.canTransition("draft", "approved")).toBe(true);
    expect(workflow.canTransition("draft", "completed")).toBe(false);
    expect(() => workflow.transition("draft", "completed")).toThrow(/Illegal/);
    expect(workflow.transition("draft", "completed", { force: true })).toBe(
      "completed"
    );
    expect(workflow.suggestStatus({ completionPercent: 100, riskScore: 0.1 })).toBe(
      "completed"
    );
  });
});

describe("Goal Execution Engine — dependencies / progress / adjustments", () => {
  it("tracks dependencies and calculates progress", async () => {
    const engine = createGoalExecutionEngine({
      now: () => new Date("2026-08-11T12:00:00.000Z"),
      createId: (() => {
        let n = 0;
        return () => `id-${++n}`;
      })(),
    });

    const goal = await engine.goals.create({
      title: "Ops improvement",
      description: "Cycle time",
      targetDate: "2026-12-11T00:00:00.000Z",
      expectedValue: "7 day cycle",
      organizationId: "org-1",
      status: "active",
    });

    const objective = await engine.objectives.create({
      goalId: goal.id,
      title: "Cycle time",
      description: "process cycle",
      baseline: 14,
      target: 7,
      currentValue: 10,
      measurementMethod: "ops log",
      frequency: "weekly",
      successCriteria: "≤7 days",
    });

    const initiative = await engine.initiatives.create({
      goalId: goal.id,
      objectiveIds: [objective.id],
      title: "Process redesign",
      description: "Improve throughput",
      budgetAmount: 18000,
      budgetSpent: 4000,
      startDate: "2026-07-11T00:00:00.000Z",
      endDate: "2026-12-11T00:00:00.000Z",
      status: "active",
    });

    await engine.dependencies.link({
      kind: "contributes_to",
      fromKind: "initiative",
      fromId: initiative.id,
      toKind: "goal",
      toId: goal.id,
    });
    await engine.dependencies.link({
      kind: "measures",
      fromKind: "objective",
      fromId: objective.id,
      toKind: "goal",
      toId: goal.id,
    });

    const deps = await engine.dependencies.list({ toId: goal.id });
    expect(deps.length).toBe(2);

    await engine.tasks.create({
      initiativeId: initiative.id,
      goalId: goal.id,
      title: "Map bottleneck",
      owner: "Ops Lead",
      dueDate: "2026-09-01T00:00:00.000Z",
      completionPercent: 50,
      status: "active",
    });

    const progress = await engine.progress.calculateGoal(goal.id);
    expect(progress.completionPercent).toBeGreaterThan(0);
    expect(progress.healthScore).toBeGreaterThanOrEqual(0);
    expect(progress.riskScore).toBeGreaterThanOrEqual(0);
    expect(progress.velocity).toBeGreaterThanOrEqual(0);

    const adjustment = await engine.adjustments.acceptFeedback({
      subjectKind: "goal",
      subjectId: goal.id,
      source: "kpi",
      message: "Timeline slipping behind plan",
      kpiKey: "cycle_time",
      kpiValue: 12,
    });
    expect(adjustment.recommendedActions.length).toBeGreaterThan(0);
    expect(adjustment.urgency).toBeTruthy();
  });
});

describe("Goal Execution Engine — scorecard / impact / notifications / reports", () => {
  it("generates scorecards, impact, notifications, dashboard, and reports", async () => {
    const engine = createGoalExecutionEngine({
      now: () => new Date("2026-08-15T12:00:00.000Z"),
    });

    const goal = await engine.goals.create({
      id: "goal-report",
      title: "Family experience",
      description: "customer satisfaction",
      targetDate: "2026-11-01T00:00:00.000Z",
      expectedValue: "4.2 satisfaction",
      organizationId: "org-1",
      schoolId: "school-1",
      priority: "high",
      status: "active",
    });

    await engine.owners.assign({
      subjectKind: "goal",
      subjectId: goal.id,
      primaryOwner: "Family Success Lead",
      executiveSponsor: "COO",
      supportingTeam: ["Front Office"],
      approver: "Head of School",
    });

    const initiative = await engine.initiatives.create({
      goalId: goal.id,
      title: "Service desk pilot",
      description: "Rapid response desk",
      budgetAmount: 20000,
      budgetSpent: 5000,
      startDate: "2026-07-01T00:00:00.000Z",
      endDate: "2026-11-01T00:00:00.000Z",
      status: "active",
    });

    await engine.milestones.create({
      initiativeId: initiative.id,
      title: "Pilot launch",
      dueDate: "2026-08-18T00:00:00.000Z",
      completionPercent: 40,
    });

    await engine.tasks.create({
      initiativeId: initiative.id,
      goalId: goal.id,
      title: "Overdue setup",
      owner: "Family Success Lead",
      dueDate: "2026-08-01T00:00:00.000Z",
      completionPercent: 20,
      status: "behind",
    });

    await engine.objectives.create({
      goalId: goal.id,
      title: "Family satisfaction score",
      description: "customer survey",
      baseline: 3.4,
      target: 4.2,
      currentValue: 3.7,
      measurementMethod: "survey",
      frequency: "quarterly",
      successCriteria: "≥4.2",
    });

    const scorecard = await engine.scorecards.generate(goal.id);
    expect(scorecard.progressPercent).toBeGreaterThanOrEqual(0);
    expect(scorecard.ownerAccountabilityScore).toBeGreaterThan(0);
    expect(scorecard.confidence.value).toBeGreaterThan(0);

    const impact = await engine.impact.assess(goal.id);
    expect(impact.scores).toHaveLength(GOAL_EXECUTION_IMPACT_DIMENSIONS.length);
    expect(impact.overallActual).toBeGreaterThanOrEqual(0);

    const notes = await engine.notifications.generateForGoal(goal.id);
    expect(notes.some((n) => n.kind === "overdue")).toBe(true);
    expect(notes.some((n) => n.kind === "milestone")).toBe(true);

    const dashboard = await engine.dashboard.build({
      organizationId: "org-1",
      schoolId: "school-1",
    });
    expect(dashboard.goals).toHaveLength(1);
    expect(dashboard.summary.overdueTasks).toBeGreaterThanOrEqual(1);

    const report = await engine.reports.generate({
      organizationId: "org-1",
      schoolId: "school-1",
    });
    expect(report.executiveSummary.length).toBeGreaterThan(0);
    expect(report.narrative).toContain("Executive Summary:");
    expect(report.scorecards.length).toBe(1);
  });
});

describe("Goal Execution Engine — Strategic / Memory / Shared Context integration", () => {
  it("imports Strategic Intelligence and optionally writes Persistent Memory", async () => {
    const strategic = createStrategicIntelligenceDomain().analyze({
      requestId: "strat-exec-1",
      subject: "Cash and staffing recovery plan",
      description: "Critical cash financial weakness and staffing retention risk",
      findings: makeFindings(),
      organizationId: "org-1",
      schoolId: "school-1",
    });

    const memory = createPersistentIntelligenceMemory({
      createId: () => "mem-exec-1",
      now: () => new Date("2026-07-11T15:00:00.000Z"),
    });
    const saveSpy = vi.spyOn(memory, "saveMemory");

    const engine = createGoalExecutionEngine({
      memory,
      now: () => new Date("2026-07-11T15:00:00.000Z"),
    });

    const imported = await engine.importStrategic({
      strategic,
      sharedContext: {
        requestId: "shared-1",
        scope: { organizationId: "org-1", schoolId: "school-1" },
        executive: null,
        finance: null,
        student: null,
        organization: null,
        errors: [],
        builtAt: "2026-07-11T15:00:00.000Z",
      },
    });

    expect(imported.goals.length).toBeGreaterThan(0);
    expect(imported.objectives.length).toBeGreaterThan(0);
    expect(imported.initiatives.length).toBeGreaterThan(0);
    expect(imported.tasks.length).toBeGreaterThan(0);
    expect(imported.owners?.primaryOwner).toBeTruthy();
    expect(imported.memoryId).toBe("mem-exec-1");
    expect(saveSpy).toHaveBeenCalled();

    const progress = await engine.progress.calculateGoal(imported.goals[0]!.id);
    expect(progress.subjectId).toBe(imported.goals[0]!.id);
  });

  it("supports repository dependency injection", async () => {
    const repository = new InMemoryGoalExecutionRepository();
    const saveGoal = vi.spyOn(repository, "saveGoal");
    const engine = createGoalExecutionEngine({ repository });

    await engine.goals.create({
      title: "DI goal",
      description: "Injected repo",
      targetDate: "2026-09-01T00:00:00.000Z",
      expectedValue: "done",
    });
    expect(saveGoal).toHaveBeenCalled();
  });
});
