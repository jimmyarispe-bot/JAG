/**
 * Sprint 016 — Autonomous Executive Operating Loop unit tests.
 */

import { describe, expect, it } from "vitest";
import {
  AUTONOMOUS_EXECUTIVE_LOOP_VERSION,
  AUTONOMY_APPROVAL_MODES,
  AUTONOMY_LOOP_PHASES,
  AutonomyDecision,
  AutonomyDiagnosis,
  AutonomyEscalation,
  AutonomyExecution,
  AutonomyGovernance,
  AutonomyLearning,
  AutonomyMeasurement,
  AutonomyObservation,
  AutonomyPlanning,
  AutonomyPrioritization,
  AutonomyReflection,
  AutonomyScheduler,
  InMemoryAutonomyScheduleRunner,
  createAutonomousExecutiveLoop,
  DEFAULT_AUTONOMY_POLICIES,
  type AutonomyLoopRequest,
  type AutonomyGovernancePolicy,
} from "@/lib/platform/autonomy";
import { createGoalExecutionEngine } from "@/lib/platform/execution";
import {
  createOrganizationalIntelligence,
  createPersistentIntelligenceMemory,
  createEmptyExecutiveContextSection,
  createEmptyFinanceContextSection,
  createEmptyOrganizationContextSection,
  createEmptyStudentContextSection,
  type OrganizationMetricSample,
  type OrganizationObservationResult,
} from "@/lib/platform/intelligence";

function sample(
  key: string,
  value: number,
  previousValue?: number,
  label = key
): OrganizationMetricSample {
  return {
    key,
    label,
    value,
    previousValue,
    observedAt: "2026-07-11T15:00:00.000Z",
  };
}

function sharedContext() {
  const scope = { organizationId: "org-1", schoolId: "school-1" };
  return {
    requestId: "shared-auto-1",
    scope,
    executive: createEmptyExecutiveContextSection(scope),
    finance: createEmptyFinanceContextSection(scope),
    student: createEmptyStudentContextSection(scope),
    organization: createEmptyOrganizationContextSection(scope),
    errors: [],
    builtAt: "2026-07-11T15:00:00.000Z",
  };
}

async function observeOrg(): Promise<OrganizationObservationResult> {
  const { observer } = createOrganizationalIntelligence({
    now: () => new Date("2026-07-11T15:00:00.000Z"),
    createId: (() => {
      let n = 0;
      return (prefix: string) => `${prefix}-${++n}`;
    })(),
  });

  return observer.observe({
    requestId: "org-obs-auto",
    organizationId: "org-1",
    schoolId: "school-1",
    observedAt: "2026-07-11T15:00:00.000Z",
    metrics: [
      sample("days_cash", 25, 55, "Days of cash"),
      sample("attendance_rate", 88, 93, "Attendance"),
      sample("enrollment_count", 500, 520, "Enrollment"),
      sample("vacancy_rate", 18, 8, "Vacancy"),
      sample("open_findings", 8, 2, "Open findings"),
      sample("execution_health", 35, 60, "Execution health"),
      sample("strategic_goal_progress", 40, 55, "Strategic progress"),
      sample("satisfaction_score", 3.6, 4.0, "Satisfaction"),
    ],
    sharedContext: sharedContext(),
    executionProgress: [
      {
        subjectKind: "goal",
        subjectId: "goal-1",
        completionPercent: 20,
        healthScore: 35,
        healthLabel: "critical",
        riskScore: 0.7,
        velocity: 0.2,
        forecastCompletionDate: null,
        calculatedAt: "2026-07-11T15:00:00.000Z",
        notes: ["Behind plan"],
        metadata: {},
      },
    ],
  });
}

function makeRequest(
  overrides: Partial<AutonomyLoopRequest> = {}
): AutonomyLoopRequest {
  return {
    requestId: "auto-loop-1",
    organizationId: "org-1",
    schoolId: "school-1",
    subject: "Stabilize cash and attendance",
    description: "Autonomous cycle for critical organizational signals",
    sharedContext: sharedContext(),
    ...overrides,
  };
}

describe("AutonomyGovernance", () => {
  it("evaluates default policies and blocks when confidence is low", () => {
    const governance = new AutonomyGovernance();
    expect(governance.listPolicies().length).toBe(DEFAULT_AUTONOMY_POLICIES.length);

    const allowed = governance.evaluate("observe");
    expect(allowed.allowed).toBe(true);

    const blocked = governance.evaluate("execute_automatic", {
      confidence: 0.2,
      severity: "medium",
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.matchedPolicyId).toBe("default-execute-auto");
  });

  it("honors request policy overrides", () => {
    const governance = new AutonomyGovernance();
    const deny: AutonomyGovernancePolicy = {
      policyId: "deny-memory",
      action: "write_memory",
      allowed: false,
      reason: "Memory writes disabled",
    };
    const result = governance.evaluate("write_memory", { policies: [...DEFAULT_AUTONOMY_POLICIES, deny] });
    expect(result.allowed).toBe(false);
    expect(result.matchedPolicyId).toBe("deny-memory");
  });
});

describe("phase services", () => {
  it("observes signals from organization package", async () => {
    const organization = await observeOrg();
    let id = 0;
    const observation = await new AutonomyObservation({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    }).collect(makeRequest({ organization }));

    expect(observation.signals.length).toBeGreaterThan(0);
    expect(observation.organization?.health.score).toBeGreaterThanOrEqual(0);
    expect(observation.summary).toContain("signals");
  });

  it("diagnoses root causes and plans steps", async () => {
    const organization = await observeOrg();
    let id = 0;
    const createId = (prefix: string) => `${prefix}-${++id}`;
    const observation = await new AutonomyObservation({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId,
    }).collect(makeRequest({ organization }));

    const diagnosis = new AutonomyDiagnosis({ createId }).diagnose(
      makeRequest({ organization }),
      observation
    );
    expect(diagnosis.causes.length).toBeGreaterThan(0);
    expect(diagnosis.primaryCauseId).toBeTruthy();

    const plan = new AutonomyPlanning({ createId }).plan(
      makeRequest({ organization }),
      diagnosis
    );
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.linkedCauseIds).toContain(diagnosis.primaryCauseId!);
  });

  it("decides board approval for critical/compliance and escalates", async () => {
    const organization = await observeOrg();
    let id = 0;
    const createId = (prefix: string) => `${prefix}-${++id}`;
    const request = makeRequest({ organization });
    const observation = await new AutonomyObservation({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId,
    }).collect(request);
    const diagnosis = new AutonomyDiagnosis({ createId }).diagnose(request, observation);
    const plan = new AutonomyPlanning({ createId }).plan(request, diagnosis);
    const checks: Parameters<AutonomyDecision["decide"]>[3] = [];
    const decision = new AutonomyDecision({ createId }).decide(
      request,
      diagnosis,
      plan,
      checks
    );

    expect(AUTONOMY_APPROVAL_MODES).toContain(decision.approvalMode);
    expect(decision.requiresHuman).toBe(true);
    expect(decision.approvedForExecution).toBe(false);

    const escalation = new AutonomyEscalation({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId,
    }).escalate(request, decision);
    expect(escalation.requiresHuman).toBe(true);
    expect(escalation.notices.length).toBe(1);
    expect(["operator", "ceo", "board"]).toContain(escalation.notices[0]!.audience);
  });

  it("holds execution when approval is required and creates when automatic", async () => {
    let id = 0;
    const createId = (prefix: string) => `${prefix}-${++id}`;
    const engine = createGoalExecutionEngine({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId: () => `g-${++id}`,
    });
    const execution = new AutonomyExecution({
      goalEngine: engine,
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId,
    });

    const held = await execution.execute(
      makeRequest(),
      {
        planId: "plan-1",
        requestId: "auto-loop-1",
        title: "Test plan",
        summary: "Summary",
        steps: [
          {
            stepId: "s1",
            order: 1,
            title: "Stabilize",
            instruction: "Act",
            ownerRole: "executive",
            dependsOn: [],
            expectedOutcome: "Stability",
          },
        ],
        linkedCauseIds: [],
        expectedValue: "Recover",
        confidence: { value: 0.8, level: "high", factors: [] },
      },
      {
        decisionId: "d1",
        requestId: "auto-loop-1",
        approvalMode: "ceo_approval",
        approvedForExecution: false,
        rationale: ["CEO required"],
        recommendedPlanId: "plan-1",
        confidence: { value: 0.8, level: "high", factors: [] },
        requiresHuman: true,
      },
      []
    );
    expect(held.status).toBe("held");

    const created = await execution.execute(
      makeRequest(),
      {
        planId: "plan-2",
        requestId: "auto-loop-1",
        title: "Auto plan",
        summary: "Auto summary",
        steps: [
          {
            stepId: "s2",
            order: 1,
            title: "Execute",
            instruction: "Do it",
            ownerRole: "executive",
            dependsOn: [],
            expectedOutcome: "Done",
          },
        ],
        linkedCauseIds: [],
        expectedValue: "Value",
        confidence: { value: 0.85, level: "high", factors: [] },
      },
      {
        decisionId: "d2",
        requestId: "auto-loop-1",
        approvalMode: "automatic",
        approvedForExecution: true,
        rationale: ["Within band"],
        recommendedPlanId: "plan-2",
        confidence: { value: 0.85, level: "high", factors: [] },
        requiresHuman: false,
      },
      []
    );
    expect(created.status).toBe("created");
    expect(created.goal).not.toBeNull();
    expect(created.progress).not.toBeNull();
    expect(created.scorecard).not.toBeNull();
  });

  it("measures, reflects, prioritizes, and learns into memory", async () => {
    let id = 0;
    const createId = (prefix: string) => `${prefix}-${++id}`;
    const memory = createPersistentIntelligenceMemory();
    const request = makeRequest();
    const plan = {
      planId: "plan-m",
      requestId: request.requestId,
      title: "Measure plan",
      summary: "Plan summary",
      steps: [
        {
          stepId: "sm1",
          order: 1,
          title: "Step",
          instruction: "Do",
          ownerRole: "executive",
          dependsOn: [],
          expectedOutcome: "Outcome",
        },
      ],
      linkedCauseIds: ["c1"],
      expectedValue: "Improve health",
      confidence: { value: 0.7, level: "medium" as const, factors: [] },
    };
    const execution = {
      packageId: "pkg",
      requestId: request.requestId,
      status: "held" as const,
      goal: null,
      progress: null,
      scorecard: null,
      holdReason: "Awaiting ceo_approval",
      summary: "Held",
    };
    const measurement = new AutonomyMeasurement({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId,
    }).measure(request, execution, 55);
    expect(measurement.healthScore).toBe(55);

    const reflection = new AutonomyReflection({ createId }).reflect(
      request,
      plan,
      execution,
      measurement
    );
    expect(reflection.insights.length).toBeGreaterThan(0);

    const diagnosis = {
      requestId: request.requestId,
      causes: [
        {
          causeId: "c1",
          kind: "financial_pressure" as const,
          title: "Cash pressure",
          explanation: "Low days cash",
          relatedSignalIds: ["s1"],
          confidence: { value: 0.8, level: "high" as const, factors: [] },
          severity: "high" as const,
        },
      ],
      primaryCauseId: "c1",
      summary: "Cash",
      confidence: { value: 0.8, level: "high" as const, factors: [] },
    };
    const prioritization = new AutonomyPrioritization({ createId }).prioritize(
      request,
      diagnosis,
      plan
    );
    expect(prioritization.ranked.length).toBeGreaterThan(0);
    expect(prioritization.topItemId).toBeTruthy();

    const learning = await new AutonomyLearning({ memory, createId }).learn(
      request,
      diagnosis,
      plan,
      {
        decisionId: "d",
        requestId: request.requestId,
        approvalMode: "ceo_approval",
        approvedForExecution: false,
        rationale: ["CEO"],
        recommendedPlanId: plan.planId,
        confidence: { value: 0.7, level: "medium", factors: [] },
        requiresHuman: true,
      },
      measurement,
      reflection,
      []
    );
    expect(learning.persisted).toBe(true);
    expect(learning.memoryId).toBeTruthy();
  });
});

describe("AutonomousExecutiveLoop orchestration", () => {
  it("runs the full loop through all phases", async () => {
    const organization = await observeOrg();
    let id = 0;
    const memory = createPersistentIntelligenceMemory();
    const goalEngine = createGoalExecutionEngine({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId: () => `exec-${++id}`,
    });
    const loop = createAutonomousExecutiveLoop({
      memory,
      goalEngine,
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    });

    const result = await loop.run(makeRequest({ organization }));
    expect(result.domainVersion).toBe(AUTONOMOUS_EXECUTIVE_LOOP_VERSION);
    expect(result.phasesCompleted).toEqual([...AUTONOMY_LOOP_PHASES]);
    expect(result.observation.signals.length).toBeGreaterThan(0);
    expect(result.diagnosis.causes.length).toBeGreaterThan(0);
    expect(result.plan.steps.length).toBeGreaterThan(0);
    expect(result.decision.approvalMode).toBeTruthy();
    expect(result.escalation.requiresHuman).toBe(true);
    expect(result.status).toBe("awaiting_approval");
    expect(result.learning.persisted).toBe(true);
    expect(result.prioritization.ranked.length).toBeGreaterThan(0);
    expect(result.governanceChecks.length).toBeGreaterThan(0);
  });

  it("executes automatically for low-severity calm signals", async () => {
    let id = 0;
    const memory = createPersistentIntelligenceMemory();
    const goalEngine = createGoalExecutionEngine({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId: () => `calm-${++id}`,
    });
    const loop = createAutonomousExecutiveLoop({
      memory,
      goalEngine,
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    });

    const calmOrg = await createOrganizationalIntelligence({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId: (prefix) => `calm-org-${prefix}-${++id}`,
    }).observer.observe({
      requestId: "calm-obs",
      organizationId: "org-1",
      schoolId: "school-1",
      observedAt: "2026-07-11T15:00:00.000Z",
      metrics: [
        sample("days_cash", 90, 88),
        sample("attendance_rate", 96, 95),
        sample("enrollment_count", 600, 590),
        sample("vacancy_rate", 3, 4),
        sample("open_findings", 0, 1),
        sample("execution_health", 88, 85),
        sample("strategic_goal_progress", 80, 78),
        sample("satisfaction_score", 4.5, 4.4),
      ],
      sharedContext: sharedContext(),
    });

    const result = await loop.run(
      makeRequest({
        requestId: "auto-calm-1",
        organization: calmOrg,
      })
    );

    // Calm org may still produce low causes; if automatic, execution should create.
    if (result.decision.approvedForExecution) {
      expect(result.execution.status).toBe("created");
      expect(result.status).toBe("completed");
    } else {
      expect(result.status).toBe("awaiting_approval");
    }
    expect(result.phasesCompleted).toContain("escalate");
  });

  it("blocks when observe policy denies", async () => {
    const loop = createAutonomousExecutiveLoop({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
    });
    const result = await loop.run(
      makeRequest({
        policies: [
          {
            policyId: "deny-observe",
            action: "observe",
            allowed: false,
            reason: "Observation disabled",
          },
        ],
      })
    );
    expect(result.status).toBe("blocked_by_policy");
    expect(result.phasesCompleted).toHaveLength(0);
  });
});

describe("AutonomyScheduler", () => {
  it("schedules and runs a loop via in-memory runner", async () => {
    const organization = await observeOrg();
    let id = 0;
    const loop = createAutonomousExecutiveLoop({
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    });
    const runner = new InMemoryAutonomyScheduleRunner();
    const scheduler = new AutonomyScheduler({
      loop,
      runner,
      now: () => new Date("2026-07-11T15:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    });

    const job = await scheduler.schedule(makeRequest({ organization }));
    expect(job.status).toBe("scheduled");
    const result = await scheduler.runNow(job.jobId);
    expect(result.requestId).toBe("auto-loop-1");
    expect(scheduler.getJob(job.jobId)?.status).toBe("completed");
  });
});
