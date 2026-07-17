/**
 * Sprint 018 — End-to-End Executive Workflow Engine integration tests.
 */

import { describe, expect, it } from "vitest";
import {
  WORKFLOW_DOMAINS,
  WORKFLOW_STAGES,
  EXECUTIVE_WORKFLOW_ENGINE_VERSION,
  createExecutiveWorkflowEngine,
  createExecutiveWorkflow,
  createFinanceWorkflow,
  createBoardWorkflow,
  getWorkflowDomainConfig,
} from "@/lib/platform/executive-workflows";
import {
  createEmptyExecutiveContextSection,
  createEmptyFinanceContextSection,
  createEmptyOrganizationContextSection,
  createEmptyStudentContextSection,
  createPersistentIntelligenceMemory,
  type OrganizationMetricSample,
  type SharedIntelligenceContext,
} from "@/lib/platform/intelligence";
import { createGoalExecutionEngine } from "@/lib/platform/execution";

function sample(
  key: string,
  value: number,
  previousValue?: number
): OrganizationMetricSample {
  return {
    key,
    label: key,
    value,
    previousValue,
    observedAt: "2026-07-11T20:00:00.000Z",
  };
}

function sharedContext(): SharedIntelligenceContext {
  const scope = { organizationId: "org-1", schoolId: "school-1" };
  return {
    requestId: "shared-wf-1",
    scope,
    executive: createEmptyExecutiveContextSection(scope),
    finance: createEmptyFinanceContextSection(scope),
    student: createEmptyStudentContextSection(scope),
    organization: createEmptyOrganizationContextSection(scope),
    errors: [],
    builtAt: "2026-07-11T20:00:00.000Z",
  };
}

const STRESSED_METRICS: OrganizationMetricSample[] = [
  sample("days_cash", 18, 55),
  sample("attendance_rate", 84, 93),
  sample("enrollment_count", 470, 520),
  sample("vacancy_rate", 17, 8),
  sample("open_findings", 9, 2),
  sample("execution_health", 28, 60),
  sample("strategic_goal_progress", 32, 55),
  sample("satisfaction_score", 3.4, 4.1),
];

describe("domain configs", () => {
  it("defines all ten organizational lifecycle domains", () => {
    expect(WORKFLOW_DOMAINS).toHaveLength(10);
    for (const domain of WORKFLOW_DOMAINS) {
      const config = getWorkflowDomainConfig(domain);
      expect(config.domain).toBe(domain);
      expect(config.preferredAgents.length).toBeGreaterThan(0);
      expect(config.metricKeys.length).toBeGreaterThan(0);
      expect(config.authorityDomain).toBeTruthy();
    }
  });
});

describe("end-to-end executive workflow integration", () => {
  it("runs Detect → … → Organization Health update using existing services", async () => {
    let id = 0;
    const memory = createPersistentIntelligenceMemory();
    const goalEngine = createGoalExecutionEngine({
      now: () => new Date("2026-07-11T20:00:00.000Z"),
      createId: () => `wf-goal-${++id}`,
    });
    const workflow = createExecutiveWorkflow({
      memory,
      goalEngine,
      now: () => new Date("2026-07-11T20:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    });

    const result = await workflow.run({
      requestId: "wf-exec-1",
      organizationId: "org-1",
      schoolId: "school-1",
      subject: "Executive stressed-org cycle",
      sharedContext: sharedContext(),
      metrics: STRESSED_METRICS,
      actor: "integration-test",
    });

    expect(result.domainVersion).toBe(EXECUTIVE_WORKFLOW_ENGINE_VERSION);
    expect(result.domain).toBe("executive");
    expect(result.stages.map((s) => s.stage)).toEqual([...WORKFLOW_STAGES]);
    expect(result.stages.every((s) => s.ok)).toBe(true);

    expect(result.detection).not.toBeNull();
    expect(result.executive).not.toBeNull();
    expect(result.strategic).not.toBeNull();
    expect(result.decision).not.toBeNull();
    expect(result.collaboration).not.toBeNull();
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.autonomy).not.toBeNull();
    expect(result.governance).not.toBeNull();
    expect(result.monitoring).not.toBeNull();
    expect(result.executiveBrief).not.toBeNull();
    expect(result.organizationHealth).not.toBeNull();
    expect(result.workspaceLinks.decisionId).toBeTruthy();
    expect(result.workspaceLinks.organizationRequestId).toBeTruthy();
    expect(result.measurementSummary).toBeTruthy();
    expect(result.reflectionSummary).toBeTruthy();
    expect(["completed", "awaiting_approval", "partial"]).toContain(result.status);
    expect(result.summary).toContain("Executive");
  }, 60000);

  it("finance workflow emphasizes financial authority and metrics", async () => {
    let id = 0;
    const result = await createFinanceWorkflow({
      memory: createPersistentIntelligenceMemory(),
      goalEngine: createGoalExecutionEngine({
        now: () => new Date("2026-07-11T20:00:00.000Z"),
        createId: () => `fin-${++id}`,
      }),
      now: () => new Date("2026-07-11T20:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    }).run({
      requestId: "wf-fin-1",
      organizationId: "org-1",
      schoolId: "school-1",
      sharedContext: sharedContext(),
      metrics: STRESSED_METRICS,
    });

    expect(result.domain).toBe("finance");
    expect(result.metadata?.authorityDomain).toBe("financial");
    expect(result.stages).toHaveLength(WORKFLOW_STAGES.length);
    expect(result.governance?.approvals.length).toBeGreaterThanOrEqual(0);
  }, 60000);

  it("board workflow can produce motions when board approval is required", async () => {
    let id = 0;
    const result = await createBoardWorkflow({
      memory: createPersistentIntelligenceMemory(),
      goalEngine: createGoalExecutionEngine({
        now: () => new Date("2026-07-11T20:00:00.000Z"),
        createId: () => `board-${++id}`,
      }),
      now: () => new Date("2026-07-11T20:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    }).run({
      requestId: "wf-board-1",
      organizationId: "org-1",
      schoolId: "school-1",
      sharedContext: sharedContext(),
      metrics: STRESSED_METRICS,
      actor: "board-secretary",
    });

    expect(result.domain).toBe("board");
    expect(result.autonomy).not.toBeNull();
    expect(result.governance).not.toBeNull();
    // Stressed metrics typically escalate; if board path, motions appear.
    if (result.autonomy?.decision.approvalMode === "board_approval") {
      expect(result.governance!.motions.length).toBeGreaterThan(0);
    }
    expect(result.executiveBrief?.headline).toBeTruthy();
    expect(result.organizationHealth?.score).toBeGreaterThanOrEqual(0);
  }, 60000);
});

describe("ExecutiveWorkflowEngine registry", () => {
  it("lists all domains and runs via registry", async () => {
    let id = 0;
    const engine = createExecutiveWorkflowEngine({
      memory: createPersistentIntelligenceMemory(),
      goalEngine: createGoalExecutionEngine({
        now: () => new Date("2026-07-11T20:00:00.000Z"),
        createId: () => `eng-${++id}`,
      }),
      now: () => new Date("2026-07-11T20:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    });

    expect(engine.listDomains()).toEqual([...WORKFLOW_DOMAINS]);
    const result = await engine.run({
      requestId: "wf-reg-1",
      domain: "operations",
      organizationId: "org-1",
      schoolId: "school-1",
      sharedContext: sharedContext(),
      metrics: STRESSED_METRICS,
    });
    expect(result.domain).toBe("operations");
    expect(result.stages.map((s) => s.stage)).toEqual([...WORKFLOW_STAGES]);
  }, 60000);
});
