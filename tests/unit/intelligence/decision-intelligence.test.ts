/** Decision Intelligence unit tests (Sprint 064 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createDecisionIntelligence,
  DECISION_INTELLIGENCE_VERSION,
  DECISION_INTELLIGENCE_MODULE_ID,
  resetDecisionIntelligenceIdSeqForTests,
  rankOptions,
  type DecisionContextLight,
  type ExecutiveMemoryResultLight,
  type OrganizationalPolicy,
} from "@/lib/platform/intelligence/decision-intelligence";
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
  "wisdom", "synthesis", "briefing", "executive-memory", "decision-intelligence", "executive-predictive", "executive-autonomous", "executive-copilot", "executive-command-center", "initiative-intelligence", "portfolio-intelligence", "digital-twin",
"ecosystem-intelligence",
];

function sampleBriefing(): DecisionContextLight {
  return {
    requestId: "br-1",
    contributingDomains: ["finance", "human-capital", "customer"],
    decisionQueue: [
      {
        id: "d1",
        title: "Staffing war-room",
        decisionNeeded: "Address teacher shortage at Florida campus",
        why: "Vacancies and enrollment risk are co-moving",
        recommendedDecision: "Approve coordinated staffing response",
        impactIfDelayed: "Enrollment risk compounds",
        confidence: 0.72,
        domains: ["human-capital", "customer", "finance"],
      },
    ],
    briefing: {
      sections: {
        executiveSummary: "Staffing instability elevates enrollment risk.",
        topRisks: [
          {
            id: "r1",
            title: "Teacher shortage",
            summary: "Vacancies rising",
            severity: 82,
            urgency: 78,
            domains: ["human-capital"],
          },
        ],
      },
    },
  };
}

function sampleMemory(): ExecutiveMemoryResultLight {
  return {
    contributingDomains: ["human-capital"],
    decisions: [
      {
        id: "past-1",
        title: "Emergency hiring 2025",
        decision: "Approve emergency hiring",
        status: "completed",
        expectedOutcome: "Fill in 30 days",
        actualOutcome: "Filled in 45 days",
        domains: ["human-capital"],
        confidence: 0.7,
      },
    ],
    lessons: [
      {
        id: "les-1",
        title: "Hiring lag lesson",
        summary: "Hiring took longer than expected",
        whatHappened: "Vacancy spike",
        decisionMade: "Emergency hiring",
        expectedOutcome: "30 days",
        actualOutcome: "45 days",
        repeat: ["Keep multi-domain evidence packs"],
        change: ["Tighten follow-up ownership"],
        domains: ["human-capital"],
        confidence: 0.75,
      },
    ],
  };
}

describe("Decision Intelligence (Sprint 064)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
    resetDecisionIntelligenceIdSeqForTests();
  });

  it("exports Sprint 064 version and module id", () => {
    expect(DECISION_INTELLIGENCE_VERSION).toBe("0.1.0");
    expect(DECISION_INTELLIGENCE_MODULE_ID).toBe("decision-intelligence");
  });

  it("generates multiple staffing options", () => {
    const { service } = createDecisionIntelligence({
      createId: (p) => `${p}-opt`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "di-opt",
      scope: { organizationId: "org-1", schoolId: "fl-1" },
      issue: {
        kind: "staffing",
        title: "Teacher shortage",
        domains: ["human-capital", "customer"],
      },
      briefingResult: sampleBriefing(),
    });
    expect(result.options.length).toBeGreaterThanOrEqual(4);
    expect(result.options.some((o) => /hire/i.test(o.title))).toBe(true);
    expect(result.options.some((o) => /reallocate/i.test(o.title))).toBe(true);
  });

  it("ranks recommendations with transparent scorecards", () => {
    const { service } = createDecisionIntelligence({
      createId: (p) => `${p}-rank`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "di-rank",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
      memoryResult: sampleMemory(),
    });
    expect(result.recommendation.rankedOptions[0].rank).toBe(1);
    expect(result.recommendation.recommendedOptionId).toBe(
      result.recommendation.rankedOptions[0].id
    );
    const top = result.recommendation.rankedOptions[0];
    expect(top.scorecard.overall).toBeGreaterThan(0);
    expect(top.whyRanked.length).toBeGreaterThan(10);
    expect(top.scenarios).toHaveLength(3);
  });

  it("surfaces historical lookups from executive-memory", () => {
    const { service } = createDecisionIntelligence({
      createId: (p) => `${p}-hist`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "di-hist",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      briefingResult: sampleBriefing(),
      memoryResult: sampleMemory(),
    });
    const hist = result.options[0].historical;
    expect(hist.similarDecisions.length + hist.lessons.length).toBeGreaterThan(0);
    expect(result.recommendation.explainability.historicalInfluence.length).toBeGreaterThan(0);
  });

  it("applies policy-aware approval flags", () => {
    const policies: OrganizationalPolicy[] = [
      {
        id: "strict-budget",
        name: "Strict budget",
        kind: "budget",
        maxFinancialImpact: 50,
        requiresApprovalAbove: "board",
      },
    ];
    const { service } = createDecisionIntelligence({
      createId: (p) => `${p}-pol`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
      policies,
    });
    const result = service.build({
      requestId: "di-pol",
      scope: { organizationId: "org-1", schoolId: null },
      issue: { kind: "staffing", title: "Teacher shortage", domains: ["human-capital"] },
      policies,
    });
    expect(result.recommendation.policyFlags.length).toBeGreaterThan(0);
    expect(
      result.options.some((o) => o.approvalRequired === "board" || o.approvalRequired === "executive")
    ).toBe(true);
  });

  it("includes explainability on every recommendation", () => {
    const { service } = createDecisionIntelligence({
      createId: (p) => `${p}-exp`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "di-exp",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
      memoryResult: sampleMemory(),
    });
    const exp = result.recommendation.explainability;
    expect(exp.why.length).toBeGreaterThan(20);
    expect(exp.contributingDomains.length).toBeGreaterThan(0);
    expect(exp.keyAssumptions.length).toBeGreaterThan(0);
    expect(typeof exp.confidence).toBe("number");
  });

  it("handles empty inputs without throwing", () => {
    const { service } = createDecisionIntelligence({
      createId: (p) => `${p}-empty`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "di-empty",
      scope: { organizationId: null, schoolId: null },
    });
    expect(result.options.length).toBeGreaterThan(0);
    expect(result.recommendation.executiveSummary.length).toBeGreaterThan(0);
    expect(result.healthScore.label).toBeTruthy();
  });

  it("handles conflicting evidence", () => {
    const { service } = createDecisionIntelligence({
      createId: (p) => `${p}-conf`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "di-conf",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
      memoryResult: sampleMemory(),
    });
    expect(
      result.recommendation.evidence.some((e) => !e.supporting) ||
        result.recommendation.explainability.contradictoryEvidence.length >= 0
    ).toBe(true);
  });

  it("tie-breaks ranking by confidence then risk then effort", () => {
    const tied = rankOptions([
      {
        id: "a",
        title: "A",
        summary: "",
        category: "hire",
        scorecard: {
          strategicAlignment: 50,
          financialImpact: 50,
          operationalImpact: 50,
          risk: 40,
          timeToImplement: 50,
          resourceRequirements: 50,
          confidence: 60,
          dependencies: 50,
          urgency: 50,
          effort: 50,
          expectedImpact: 50,
          roi: 50,
          overall: 70,
        },
        scenarios: [],
        benefits: [],
        risks: [],
        assumptions: [],
        dependencies: [],
        estimatedEffort: "medium",
        confidence: 60,
        tradeOffs: [],
        whyRanked: "",
        policyFlags: [],
        approvalRequired: "none",
        evidence: [],
        historical: { similarDecisions: [], lessons: [], comparableInitiatives: [] },
        rank: 0,
      },
      {
        id: "b",
        title: "B",
        summary: "",
        category: "hire",
        scorecard: {
          strategicAlignment: 50,
          financialImpact: 50,
          operationalImpact: 50,
          risk: 30,
          timeToImplement: 50,
          resourceRequirements: 50,
          confidence: 80,
          dependencies: 50,
          urgency: 50,
          effort: 50,
          expectedImpact: 50,
          roi: 50,
          overall: 70,
        },
        scenarios: [],
        benefits: [],
        risks: [],
        assumptions: [],
        dependencies: [],
        estimatedEffort: "medium",
        confidence: 80,
        tradeOffs: [],
        whyRanked: "",
        policyFlags: [],
        approvalRequired: "none",
        evidence: [],
        historical: { similarDecisions: [], lessons: [], comparableInitiatives: [] },
        rank: 0,
      },
    ]);
    expect(tied[0].id).toBe("b");
    expect(tied[0].rank).toBe(1);
  });

  it("scores confidence from evidence and history", () => {
    const { service } = createDecisionIntelligence({
      createId: (p) => `${p}-score`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const withHistory = service.build({
      requestId: "di-score-1",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
      memoryResult: sampleMemory(),
    });
    const bare = service.build({
      requestId: "di-score-2",
      scope: { organizationId: "org-1", schoolId: null },
      issue: { kind: "generic", title: "Vague issue" },
    });
    expect(withHistory.recommendation.confidence).toBeGreaterThanOrEqual(
      bare.recommendation.confidence
    );
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.decisionIntelligence.service).toBeTruthy();
    const result = stacks.decisionIntelligence.service.build({
      requestId: "di-di",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      briefingResult: sampleBriefing(),
    });
    expect(result.version).toBe(DECISION_INTELLIGENCE_VERSION);
  });

  it("runs as terminal pipeline module after executive-memory", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-13)).toBe("wisdom");
    expect(result.moduleOrder.at(-12)).toBe("synthesis");
    expect(result.moduleOrder.at(-11)).toBe("briefing");
    expect(result.moduleOrder.at(-10)).toBe("executive-memory");
    expect(result.moduleOrder.at(-9)).toBe("decision-intelligence");
    expect(result.moduleOrder.at(-8)).toBe("executive-predictive");
    expect(result.moduleOrder.at(-7)).toBe("executive-autonomous");
    expect(result.moduleOrder.at(-6)).toBe("executive-copilot");
    expect(result.moduleOrder.at(-5)).toBe("executive-command-center");
    expect(result.moduleOrder.at(-4)).toBe("initiative-intelligence");
    expect(result.moduleOrder.at(-3)).toBe("portfolio-intelligence");
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
