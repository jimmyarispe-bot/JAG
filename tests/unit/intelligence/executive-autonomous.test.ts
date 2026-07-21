/** Autonomous Intelligence unit tests (Sprint 066 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createExecutiveAutonomousIntelligence,
  EXECUTIVE_AUTONOMOUS_VERSION,
  EXECUTIVE_AUTONOMOUS_MODULE_ID,
  resolveWorkflowKind,
  listWorkflowTemplates,
  routeApprovals,
  assessReadiness,
  DEFAULT_AUTONOMOUS_POLICIES,
  type DecisionIntelligenceResultLight,
  type ExecutivePredictiveResultLight,
  type OrganizationalPolicy,
} from "@/lib/platform/intelligence/executive-autonomous";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive",
  "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural",
  "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective",
  "wisdom", "synthesis", "briefing", "executive-memory", "decision-intelligence",
  "executive-predictive", "executive-autonomous", "executive-copilot", "executive-command-center", "initiative-intelligence", "portfolio-intelligence", "digital-twin",
"ecosystem-intelligence",
];

function sampleDecision(): DecisionIntelligenceResultLight {
  return {
    requestId: "di-1",
    contributingDomains: ["human-capital", "finance"],
    recommendation: {
      id: "rec-1",
      executiveSummary: "Prioritize staffing response before enrollment slips.",
      recommendedOptionId: "opt-a",
      confidence: 0.72,
      issue: { title: "Teacher shortage", kind: "staffing", domains: ["human-capital"] },
      rankedOptions: [
        {
          id: "opt-a",
          title: "Hire temporary teachers",
          summary: "Bridge capacity for 90 days",
          category: "staffing",
          confidence: 0.74,
          estimatedEffort: "medium",
          scorecard: {
            overall: 78,
            expectedImpact: 80,
            financialImpact: 70,
            operationalImpact: 70,
            risk: 40,
            effort: 50,
          },
        },
        {
          id: "opt-b",
          title: "Apply for capacity grant",
          summary: "Pursue grant support for staffing",
          category: "grants",
          confidence: 0.6,
          estimatedEffort: "high",
          scorecard: {
            overall: 65,
            expectedImpact: 70,
            financialImpact: 80,
            operationalImpact: 50,
            risk: 55,
            effort: 70,
          },
        },
      ],
    },
  };
}

function samplePredictive(): ExecutivePredictiveResultLight {
  return {
    requestId: "pred-1",
    contributingDomains: ["executive-predictive"],
    healthScore: { value: 58, label: "watch" },
    emergingSignals: [
      {
        title: "Rising support workload",
        subject: "operations",
        narrative: "Workload creeping upward",
        strength: 0.5,
      },
    ],
    decisionImpacts: [
      {
        optionId: "opt-a",
        optionTitle: "Hire temporary teachers",
        organizationalImpact: 0.8,
        financialImpact: 0.55,
        operationalImpact: 0.7,
        implementationHorizon: "90d",
        confidence: 0.7,
        narrative: "Hiring improves capacity outlook over 90 days",
      },
    ],
    scenarios: [
      {
        kind: "expected",
        label: "Expected",
        narrative: "Trend continuation if no extraordinary action",
        overallOutlook: 0.5,
      },
    ],
  };
}

describe("Autonomous Intelligence (Sprint 066)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
  });

  it("exports Sprint 066 version and module id", () => {
    expect(EXECUTIVE_AUTONOMOUS_VERSION).toBe("0.1.0");
    expect(EXECUTIVE_AUTONOMOUS_MODULE_ID).toBe("executive-autonomous");
  });

  it("generates execution plans from recommendations", () => {
    const { service } = createExecutiveAutonomousIntelligence({
      createId: (p) => `${p}-plan`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "auto-plan",
      scope: { organizationId: "org-1", schoolId: "fl-1" },
      decisionResult: sampleDecision(),
      predictiveResult: samplePredictive(),
    });
    expect(result.autoExecute).toBe(false);
    expect(result.humanInTheLoop).toBe(true);
    expect(result.plans.length).toBe(2);
    const staffing = result.plans.find((p) => p.workflowKind === "staffing");
    expect(staffing).toBeTruthy();
    expect(staffing!.tasks.length).toBeGreaterThan(0);
    expect(staffing!.successCriteria.length).toBeGreaterThan(0);
    expect(staffing!.estimatedDurationDays).toBeGreaterThan(0);
    expect(staffing!.humanAuthorizationRequired).toBe(true);
    expect(staffing!.autoExecute).toBe(false);
  });

  it("resolves dependencies and missing prerequisites", () => {
    const { service } = createExecutiveAutonomousIntelligence({
      createId: (p) => `${p}-dep`,
    });
    const result = service.build({
      requestId: "auto-dep",
      scope: { organizationId: "org-1", schoolId: null },
      decisionResult: sampleDecision(),
    });
    const plan = result.plans[0];
    expect(plan.dependencies.some((d) => d.kind === "approval")).toBe(true);
    expect(plan.dependencies.some((d) => d.kind === "information" && !d.satisfied)).toBe(true);
    expect(["waiting_approval", "waiting_information", "blocked", "waiting_resources"]).toContain(
      plan.readiness
    );
  });

  it("exposes reusable workflow templates", () => {
    const templates = listWorkflowTemplates();
    expect(templates.map((t) => t.kind).sort()).toEqual(
      ["compliance", "enrollment", "finance", "grants", "operations", "staffing"].sort()
    );
    expect(resolveWorkflowKind({ category: "staffing", title: "Hire teachers" })).toBe("staffing");
    expect(resolveWorkflowKind({ category: "grants", title: "Apply for grant" })).toBe("grants");
  });

  it("routes approvals by policy roles (no hard-coded names)", () => {
    const { steps } = routeApprovals({
      workflowKind: "staffing",
      createId: (p) => `${p}-appr`,
      financialImpact: 0.7,
      policies: DEFAULT_AUTONOMOUS_POLICIES,
    });
    expect(steps.some((s) => s.role === "executive_director")).toBe(true);
    expect(steps.some((s) => s.role === "school_leader")).toBe(true);
    expect(steps.every((s) => typeof s.role === "string")).toBe(true);
    expect(JSON.stringify(steps)).not.toMatch(/Jimmy|Jane Doe|Smith/i);
  });

  it("includes rollback planning on every plan", () => {
    const { service } = createExecutiveAutonomousIntelligence({
      createId: (p) => `${p}-rb`,
    });
    const result = service.build({
      requestId: "auto-rb",
      scope: { organizationId: "org-1", schoolId: null },
      decisionResult: sampleDecision(),
    });
    for (const plan of result.plans) {
      expect(plan.rollback.conditions.length).toBeGreaterThan(0);
      expect(plan.rollback.recoverySteps.length).toBeGreaterThan(0);
      expect(plan.rollback.notifications.length).toBeGreaterThan(0);
      expect(plan.rollback.impactAssessment.length).toBeGreaterThan(10);
    }
  });

  it("scores readiness including ready when prerequisites met", () => {
    const { service } = createExecutiveAutonomousIntelligence({
      createId: (p) => `${p}-ready`,
    });
    const result = service.build({
      requestId: "auto-ready",
      scope: { organizationId: "org-1", schoolId: "fl-1" },
      decisionResult: sampleDecision(),
      predictiveResult: samplePredictive(),
      approvedRoles: [
        "executive_director",
        "school_leader",
        "ceo",
        "finance_lead",
        "founder",
      ],
      satisfiedPrerequisiteIds: [
        "prereq-info",
        "prereq-budget",
        "prereq-resource",
        "prereq-compliance",
      ],
    });
    // Approvals satisfied via roles; info/budget via id substrings in planner/deps
    const plan = result.plans[0];
    // Force readiness helper coverage
    const scored = assessReadiness({
      prerequisites: plan.dependencies.map((d) => ({ ...d, satisfied: true })),
      approvals: plan.requiredApprovals.map((a) => ({ ...a, status: "approved" as const })),
    });
    expect(scored.state).toBe("ready");
  });

  it("flags policy violations when routing cannot resolve required approvals", () => {
    const emptyPolicies: OrganizationalPolicy[] = [
      {
        id: "broken",
        key: "broken.policy",
        description: "Blocking policy with no roles",
        requiredRoles: [],
        appliesTo: ["operations"],
        blocking: true,
      },
    ];
    const { violations } = routeApprovals({
      workflowKind: "operations",
      policies: emptyPolicies,
      createId: (p) => `${p}-viol`,
    });
    expect(violations.length).toBeGreaterThan(0);
  });

  it("provides explainability for generated plans", () => {
    const { service } = createExecutiveAutonomousIntelligence({
      createId: (p) => `${p}-ex`,
    });
    const result = service.build({
      requestId: "auto-ex",
      scope: { organizationId: "org-1", schoolId: null },
      decisionResult: sampleDecision(),
      predictiveResult: samplePredictive(),
    });
    const plan = result.plans[0];
    expect(plan.explainability.whyWorkflowSelected.length).toBeGreaterThan(10);
    expect(plan.explainability.recommendationId).toBeTruthy();
    expect(plan.explainability.predictionInfluence.length).toBeGreaterThan(0);
    expect(plan.explainability.applicablePolicies.length).toBeGreaterThan(0);
    expect(plan.explainability.assumptions.length).toBeGreaterThan(0);
  });

  it("prepares grant packages without submitting", () => {
    const { service } = createExecutiveAutonomousIntelligence({
      createId: (p) => `${p}-grant`,
    });
    const result = service.build({
      requestId: "auto-grant",
      scope: { organizationId: "org-1", schoolId: null },
      decisionResult: {
        recommendation: {
          id: "rec-g",
          rankedOptions: [
            {
              id: "g1",
              title: "Apply for capacity grant",
              summary: "Prepare grant application",
              category: "grants",
              scorecard: { financialImpact: 80, risk: 50, effort: 70, overall: 70 },
            },
          ],
        },
      },
    });
    const plan = result.plans[0];
    expect(plan.workflowKind).toBe("grants");
    const prep = result.preparations[0];
    expect(prep.requiredDocuments.length).toBeGreaterThan(2);
    expect(prep.authorizationNote).toMatch(/without recorded human authorization/i);
    expect(result.autoExecute).toBe(false);
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.executiveAutonomous.service).toBeTruthy();
    const result = stacks.executiveAutonomous.service.build({
      requestId: "auto-di",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      decisionResult: sampleDecision(),
    });
    expect(result.version).toBe(EXECUTIVE_AUTONOMOUS_VERSION);
  });

  it("runs as terminal pipeline module after executive-predictive", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const health = await platform.checkHealth();
    expect(health.modules.length).toBe(51);
    expect(platform.registry.get("executive-autonomous")?.id).toBe("executive-autonomous");

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: { periodLabel: "Sprint 066 validation" },
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-8)).toBe("executive-predictive");
    expect(result.moduleOrder.at(-7)).toBe("executive-autonomous");
    expect(result.moduleOrder.at(-5)).toBe("executive-command-center");
    expect(result.moduleOrder.at(-4)).toBe("initiative-intelligence");
    expect(result.moduleOrder.at(-3)).toBe("portfolio-intelligence");
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
