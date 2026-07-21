/** Executive Copilot unit tests (Sprint 067 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createExecutiveCopilotIntelligence,
  EXECUTIVE_COPILOT_VERSION,
  EXECUTIVE_COPILOT_MODULE_ID,
  detectIntent,
  assembleContext,
  type BriefingResultLight,
  type DecisionIntelligenceResultLight,
  type ExecutiveMemoryResultLight,
  type ExecutivePredictiveResultLight,
  type AutonomousResultLight,
  type SynthesisResultLight,
} from "@/lib/platform/intelligence/executive-copilot";
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

function sampleBriefing(): BriefingResultLight {
  return {
    healthScore: { value: 58, label: "watch" },
    contributingDomains: ["briefing"],
    overnight: { summary: "Overnight movement", newRisks: ["Support volume rising"] },
    briefing: {
      sections: {
        executiveSummary: "Florida enrollment conversion is softening amid staffing pressure.",
        topRisks: [
          {
            title: "Enrollment decline (FL)",
            summary: "Inquiry-to-enrollment conversion falling in Florida",
            severity: 78,
            urgency: 70,
            domains: ["enrollment", "customer"],
          },
        ],
        topOpportunities: [
          {
            title: "Targeted campaign",
            summary: "Reactivate high-intent inquiries",
            estimatedImpact: 65,
            domains: ["enrollment"],
          },
        ],
      },
    },
    decisionQueue: [
      {
        id: "dq1",
        title: "Staffing war-room",
        decisionNeeded: "Address teacher shortage",
      },
    ],
  };
}

function sampleMemory(): ExecutiveMemoryResultLight {
  return {
    contributingDomains: ["executive-memory"],
    decisions: [
      {
        id: "d1",
        title: "Emergency hiring 2025",
        decision: "Approve emergency hiring",
        expectedOutcome: "Fill in 30 days",
        actualOutcome: "Filled in 45 days",
        domains: ["human-capital"],
        confidence: 0.7,
      },
    ],
    timeline: [
      {
        at: "2025-09-01T00:00:00.000Z",
        kind: "decision",
        title: "Hiring initiative started",
        summary: "Initiative started after vacancy spike",
        domains: ["human-capital"],
      },
    ],
    lessons: [
      {
        id: "l1",
        title: "Hiring lag",
        summary: "Hiring took longer than expected",
        change: ["Tighten follow-up"],
        domains: ["human-capital"],
      },
    ],
  };
}

function sampleDecision(): DecisionIntelligenceResultLight {
  return {
    contributingDomains: ["decision-intelligence"],
    recommendation: {
      id: "rec-1",
      executiveSummary: "Prioritize staffing before enrollment slips further.",
      recommendedOptionId: "opt-a",
      confidence: 0.74,
      issue: { title: "Teacher shortage", kind: "staffing", domains: ["human-capital"] },
      rankedOptions: [
        {
          id: "opt-a",
          title: "Hire temporary teachers",
          summary: "Bridge capacity for 90 days",
          category: "staffing",
          confidence: 0.8,
          scorecard: {
            overall: 82,
            expectedImpact: 80,
            financialImpact: 55,
            roi: 88,
            risk: 40,
            effort: 50,
          },
        },
        {
          id: "opt-b",
          title: "Reallocate staff",
          summary: "Shift FTE without new hires",
          category: "staffing",
          confidence: 0.7,
          scorecard: { overall: 70, expectedImpact: 60, financialImpact: 80, roi: 72, risk: 45, effort: 30 },
        },
      ],
    },
  };
}

function samplePredictive(): ExecutivePredictiveResultLight {
  return {
    contributingDomains: ["executive-predictive"],
    forecasts: [
      { subject: "enrollment", horizon: "90d", direction: "degrading", confidence: 0.62, delta: -8 },
      { subject: "staffing", horizon: "90d", direction: "improving", confidence: 0.55, delta: 2 },
    ],
    emergingSignals: [
      {
        title: "Conversion softening",
        subject: "enrollment",
        narrative: "Inquiry-to-enrollment conversion declining",
        strength: 0.6,
      },
    ],
    scenarios: [
      { kind: "expected", label: "Expected", narrative: "Trend continues if no action", overallOutlook: 0.48 },
      { kind: "worst", label: "Worst", narrative: "Delay compounds enrollment and capacity risk", overallOutlook: 0.3 },
    ],
  };
}

function sampleAutonomous(): AutonomousResultLight {
  return {
    contributingDomains: ["executive-autonomous"],
    autoExecute: false,
    humanInTheLoop: true,
    plans: [
      {
        id: "plan-1",
        workflowKind: "staffing",
        objective: "Hire temporary teachers",
        optionTitle: "Hire temporary teachers",
        readiness: "waiting_approval",
        humanAuthorizationRequired: true,
        autoExecute: false,
      },
    ],
    approvalQueue: [
      {
        role: "executive_director",
        status: "pending",
        rationale: "Staffing actions require Executive Director approval",
      },
    ],
  };
}

function sampleSynthesis(): SynthesisResultLight {
  return {
    contributingDomains: ["synthesis"],
    brief: {
      executiveSummary: "Staffing and enrollment risks are co-moving in Florida.",
      headline: "Capacity-enrollment coupling",
    },
    correlations: [
      {
        title: "Staffing ↔ enrollment",
        summary: "Vacancies correlate with conversion decline",
        domains: ["human-capital", "enrollment"],
      },
    ],
  };
}

describe("Executive Copilot (Sprint 067)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
  });

  it("exports Sprint 067 version and module id", () => {
    expect(EXECUTIVE_COPILOT_VERSION).toBe("0.1.0");
    expect(EXECUTIVE_COPILOT_MODULE_ID).toBe("executive-copilot");
  });

  it("detects intents for orchestration", () => {
    expect(detectIntent("Why did enrollment decline in Florida?")).toBe("investigate");
    expect(detectIntent("What changed since last week's briefing?")).toBe("summarize");
    expect(detectIntent("What are the three biggest risks over the next 90 days?")).toBe(
      "forecast"
    );
    expect(detectIntent("Which recommendation has the highest expected ROI?")).toBe("recommend");
    expect(detectIntent("What happens if we delay hiring by 60 days?")).toBe("forecast");
    expect(detectIntent("Help me prepare for tomorrow's board meeting")).toBe("plan");
    expect(detectIntent("What did we decide last year?")).toBe("recall");
  });

  it("assembles multi-domain context without duplicating engines", () => {
    const ctx = assembleContext({
      requestId: "r1",
      question: "Why?",
      scope: { organizationId: "org-1", schoolId: null },
      synthesisResult: sampleSynthesis(),
      briefingResult: sampleBriefing(),
      memoryResult: sampleMemory(),
      decisionResult: sampleDecision(),
      predictiveResult: samplePredictive(),
      autonomousResult: sampleAutonomous(),
    });
    expect(ctx.availableDomainCount).toBe(6);
    expect(ctx.conflictingEvidence).toBe(true);
  });

  it("explains with evidence, domains, confidence, and uncertainties", () => {
    const { service } = createExecutiveCopilotIntelligence({
      createId: (p) => `${p}-ex`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.ask({
      requestId: "copilot-ex",
      question: "Why is retention pressure rising?",
      scope: { organizationId: "org-1", schoolId: "fl-1" },
      synthesisResult: sampleSynthesis(),
      briefingResult: sampleBriefing(),
      memoryResult: sampleMemory(),
      decisionResult: sampleDecision(),
      predictiveResult: samplePredictive(),
    });
    expect(result.answer.length).toBeGreaterThan(20);
    expect(result.explainability.supportingEvidence.length).toBeGreaterThan(0);
    expect(result.explainability.contributingDomains.length).toBeGreaterThan(0);
    expect(result.explainability.confidence).toBeGreaterThan(0);
    expect(result.explainability.domainTrace.length).toBeGreaterThan(0);
    expect(result.governance.mayAutoExecute).toBe(false);
  });

  it("compares recommendations and ranks ROI", () => {
    const { service } = createExecutiveCopilotIntelligence({ createId: (p) => `${p}-cmp` });
    const result = service.ask({
      requestId: "copilot-cmp",
      question: "Which recommendation has the highest expected ROI?",
      scope: { organizationId: "org-1", schoolId: null },
      decisionResult: sampleDecision(),
      predictiveResult: samplePredictive(),
    });
    expect(result.intent).toBe("recommend");
    expect(result.answer).toMatch(/Hire temporary teachers/i);
    expect(result.comparison?.length).toBeGreaterThan(0);
  });

  it("runs strategic investigations", () => {
    const { service } = createExecutiveCopilotIntelligence({ createId: (p) => `${p}-inv` });
    const result = service.ask({
      requestId: "copilot-inv",
      question: "Investigate declining enrollment in Florida",
      scope: { organizationId: "org-1", schoolId: "fl-1" },
      synthesisResult: sampleSynthesis(),
      briefingResult: sampleBriefing(),
      memoryResult: sampleMemory(),
      decisionResult: sampleDecision(),
      predictiveResult: samplePredictive(),
    });
    expect(result.intent).toBe("investigate");
    expect(result.investigation).toBeTruthy();
    expect(result.investigation!.signals.length).toBeGreaterThan(0);
    expect(result.investigation!.risks.length).toBeGreaterThan(0);
    expect(result.investigation!.recommendedNextSteps.length).toBeGreaterThan(0);
  });

  it("recalls executive memory", () => {
    const { service } = createExecutiveCopilotIntelligence({ createId: (p) => `${p}-mem` });
    const result = service.ask({
      requestId: "copilot-mem",
      question: "What did we decide last year about hiring?",
      scope: { organizationId: "org-1", schoolId: null },
      memoryResult: sampleMemory(),
    });
    expect(result.intent).toBe("recall");
    expect(result.answer).toMatch(/Emergency hiring|Hiring initiative/i);
  });

  it("prepares multi-step board packages", () => {
    const { service } = createExecutiveCopilotIntelligence({ createId: (p) => `${p}-plan` });
    const result = service.ask({
      requestId: "copilot-plan",
      question: "Help me prepare for tomorrow's board meeting",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
      decisionResult: sampleDecision(),
      predictiveResult: samplePredictive(),
      autonomousResult: sampleAutonomous(),
      memoryResult: sampleMemory(),
    });
    expect(result.intent).toBe("plan");
    expect(result.boardPrep).toBeTruthy();
    expect(result.boardPrep!.highPriorityRisks.length).toBeGreaterThan(0);
    expect(result.boardPrep!.pendingApprovals.length).toBeGreaterThan(0);
  });

  it("enforces governance — no auto-execute; routes through Autonomous", () => {
    const { service } = createExecutiveCopilotIntelligence({ createId: (p) => `${p}-gov` });
    const result = service.ask({
      requestId: "copilot-gov",
      question: "Recommend the best option and prepare execution",
      scope: { organizationId: "org-1", schoolId: null },
      decisionResult: sampleDecision(),
      autonomousResult: sampleAutonomous(),
      requestExecutionPrep: true,
    });
    expect(result.governance.mayAutoExecute).toBe(false);
    expect(result.governance.routesExecutionThroughAutonomous).toBe(true);
    expect(result.executionPlanRefs?.length).toBeGreaterThan(0);
    expect(result.executionPlanRefs![0].humanAuthorizationRequired).toBe(true);
    expect(result.executionPlanRefs![0].autoExecute).toBe(false);
    expect(result.answer).toMatch(/human authorization/i);
  });

  it("handles empty context gracefully", () => {
    const { service } = createExecutiveCopilotIntelligence({ createId: (p) => `${p}-empty` });
    const result = service.ask({
      requestId: "copilot-empty",
      question: "Why did enrollment decline in Florida?",
      scope: { organizationId: null, schoolId: null },
    });
    expect(result.answer.length).toBeGreaterThan(10);
    expect(result.explainability.knownUncertainties.length).toBeGreaterThan(0);
    expect(result.followUps.length).toBeGreaterThan(0);
  });

  it("surfaces conflicting evidence in uncertainties", () => {
    const { service } = createExecutiveCopilotIntelligence({ createId: (p) => `${p}-conf` });
    const result = service.ask({
      requestId: "copilot-conf",
      question: "Explain the current outlook",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
      predictiveResult: samplePredictive(),
    });
    expect(
      result.explainability.knownUncertainties.some((u) => /conflict/i.test(u))
    ).toBe(true);
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.executiveCopilot.service).toBeTruthy();
    const result = stacks.executiveCopilot.service.ask({
      requestId: "copilot-di",
      question: "Summarize the situation",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
    });
    expect(result.version).toBe(EXECUTIVE_COPILOT_VERSION);
  });

  it("runs in pipeline before executive-command-center", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const health = await platform.checkHealth();
    expect(health.modules.length).toBe(51);
    expect(platform.registry.get("executive-copilot")?.id).toBe("executive-copilot");

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: {
        periodLabel: "Sprint 067 validation",
        question: "What changed since last week's briefing?",
      },
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-6)).toBe("executive-copilot");
    expect(result.moduleOrder.at(-5)).toBe("executive-command-center");
    expect(result.moduleOrder.at(-4)).toBe("initiative-intelligence");
    expect(result.moduleOrder.at(-3)).toBe("portfolio-intelligence");
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
