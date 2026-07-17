/**
 * Decision Intelligence domain — unit tests (Sprint 012).
 */

import { describe, expect, it } from "vitest";
import {
  createDecisionIntelligenceDomain,
  createEmptyIntelligenceResult,
  createIntelligenceDomainRegistry,
  createIntelligenceService,
  createPersistentIntelligenceMemory,
  createStrategicIntelligenceDomain,
  DECISION_IMPACT_DIMENSIONS,
  DECISION_INTELLIGENCE_VERSION,
  DECISION_SCENARIO_KINDS,
  DecisionApprovals,
  DecisionResolver,
  DecisionAnalysis,
  DecisionAlternatives,
  DecisionEvidence,
  DecisionImpact,
  DecisionRecommendations,
  DecisionRisks,
  DecisionScenarios,
  DecisionTimelineEstimator,
  DecisionBriefBuilder,
  validateIntelligenceDomain,
  type DecisionRequest,
  type StrategicFindingInput,
} from "@/lib/platform/intelligence";

function makeFindings(): StrategicFindingInput[] {
  return [
    {
      findingId: "f-cash",
      title: "Cash runway pressure",
      summary: "Critical cash and collections financial weakness",
      severity: "critical",
      kindHints: ["financial_weakness"],
      confidence: { value: 0.82, level: "high", factors: [] },
      signals: ["cash", "budget"],
    },
  ];
}

function makeRequest(overrides: Partial<DecisionRequest> = {}): DecisionRequest {
  const strategic = createStrategicIntelligenceDomain().analyze({
    requestId: "strat-for-decision",
    subject: "Cash recovery strategy",
    description: "Critical cash financial weakness requiring board decision",
    findings: makeFindings(),
    organizationId: "org-1",
    schoolId: "school-1",
  });

  const memory = createPersistentIntelligenceMemory({
    createId: () => "mem-decision-1",
    now: () => new Date("2026-07-11T12:00:00.000Z"),
  }).createMemory({
    domain: "decision",
    executionId: "exec-decision-1",
    organizationId: "org-1",
    observations: ["Prior cash recovery decision improved collections"],
    recommendations: ["Maintain weekly cash war room"],
    confidence: { value: 0.7, level: "medium", factors: [] },
  });

  return {
    requestId: "decision-req-1",
    subject: "Approve cash recovery investment",
    description: "Decide whether to fund an aggressive cash and collections recovery plan",
    decisionQuestion: "Should we fund the aggressive cash recovery plan?",
    organizationId: "org-1",
    schoolId: "school-1",
    kpis: [
      { key: "days_cash", label: "Days of cash", value: 42, unit: "days", target: 75, trend: "down" },
      { key: "collection_rate", label: "Collection rate", value: 88, unit: "%", target: 95 },
    ],
    findings: ["Cash decline is accelerating", "Collections SLA breaches rising"],
    risks: ["Financial runway risk", "Reputation risk with vendors"],
    opportunities: ["Improve collections technology"],
    strategic,
    strategicGoals: strategic.goals,
    strategicOpportunities: strategic.analysis.opportunities,
    executionProgress: [
      {
        subjectKind: "goal",
        subjectId: "exec-goal-1",
        completionPercent: 35,
        healthScore: 55,
        healthLabel: "watch",
        riskScore: 0.48,
        velocity: 0.5,
        forecastCompletionDate: "2026-10-01T00:00:00.000Z",
        calculatedAt: "2026-07-11T12:00:00.000Z",
        notes: ["Behind on collections milestones"],
        metadata: {},
      },
    ],
    memories: [memory],
    sharedContext: {
      requestId: "shared-decision-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      executive: null,
      finance: null,
      student: null,
      organization: null,
      errors: [],
      builtAt: "2026-07-11T12:00:00.000Z",
    },
    evidenceRefs: [{ evidenceId: "rpt-1", label: "Cash report" }],
    ...overrides,
  };
}

describe("Decision Intelligence — analysis", () => {
  it("evaluates decisions using context, memory, goals, execution, and KPIs", () => {
    const request = makeRequest();
    const evidence = new DecisionEvidence().collect(request);
    const analysis = new DecisionAnalysis().analyze(request, evidence);

    expect(analysis.decisionQuestion).toContain("cash recovery");
    expect(analysis.strategicGoalIds.length).toBeGreaterThan(0);
    expect(analysis.kpiHighlights.length).toBeGreaterThan(0);
    expect(analysis.memoryHighlights.length).toBeGreaterThan(0);
    expect(analysis.executionSignals.length).toBeGreaterThan(0);
    expect(analysis.priority).toBe("critical");
    expect(analysis.confidence.value).toBeGreaterThan(0);
  });
});

describe("Decision Intelligence — alternatives", () => {
  it("generates multiple options with benefits, cost, timeline, and impact", () => {
    const request = makeRequest();
    const evidence = new DecisionEvidence().collect(request);
    const analysis = new DecisionAnalysis().analyze(request, evidence);
    const alternatives = new DecisionAlternatives().generate(request, analysis, evidence);

    expect(alternatives.alternatives.length).toBeGreaterThanOrEqual(2);
    const top = alternatives.alternatives[0]!;
    expect(top.benefits.length).toBeGreaterThan(0);
    expect(top.drawbacks.length).toBeGreaterThan(0);
    expect(top.cost.amount).toBeGreaterThan(0);
    expect(top.timelineDays).toBeGreaterThan(0);
    expect(top.confidence.value).toBeGreaterThan(0);
    expect(top.expectedImpact.length).toBeGreaterThan(0);
  });
});

describe("Decision Intelligence — risks & scenarios", () => {
  it("identifies risks and generates scenario set", () => {
    const request = makeRequest();
    const evidence = new DecisionEvidence().collect(request);
    const analysis = new DecisionAnalysis().analyze(request, evidence);
    const risks = new DecisionRisks().analyze(request, analysis);
    const alternatives = new DecisionAlternatives().generate(request, analysis, evidence);
    const scenarios = new DecisionScenarios().generate(request, alternatives);

    expect(risks.risks.some((r) => r.category === "financial")).toBe(true);
    expect(risks.primaryRisk).not.toBeNull();
    expect(scenarios.scenarios).toHaveLength(DECISION_SCENARIO_KINDS.length);
    expect(scenarios.scenarios.map((s) => s.kind).sort()).toEqual(
      [...DECISION_SCENARIO_KINDS].sort()
    );
  });
});

describe("Decision Intelligence — approvals", () => {
  it("supports governance workflow transitions", () => {
    const approvals = new DecisionApprovals({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    });
    const request = makeRequest();
    const evidence = new DecisionEvidence().collect(request);
    const analysis = new DecisionAnalysis().analyze(request, evidence);
    const created = approvals.create(request, analysis);
    expect(created.status).toBe("draft");

    const review = approvals.transition(created, "under_review", "Sent to ELT");
    expect(review.status).toBe("under_review");
    const approved = approvals.transition(review, "approved");
    expect(approved.status).toBe("approved");
    const implemented = approvals.transition(approved, "implemented");
    expect(implemented.status).toBe("implemented");
    expect(implemented.history.length).toBe(4);

    expect(() => approvals.transition(implemented, "draft")).toThrow(/Illegal/);
  });
});

describe("Decision Intelligence — impact & brief", () => {
  it("estimates impact and builds executive brief", () => {
    const request = makeRequest();
    const evidence = new DecisionEvidence().collect(request);
    const analysis = new DecisionAnalysis().analyze(request, evidence);
    const alternatives = new DecisionAlternatives().generate(request, analysis, evidence);
    const risks = new DecisionRisks().analyze(request, analysis);
    const scenarios = new DecisionScenarios().generate(request, alternatives);
    const recommendation = new DecisionRecommendations().recommend(
      request,
      analysis,
      alternatives,
      risks
    );
    const impact = new DecisionImpact().assess(
      request,
      recommendation,
      risks,
      alternatives.alternatives[0] ?? null
    );
    const approval = new DecisionApprovals().create(request, analysis);
    const timeline = new DecisionTimelineEstimator({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    }).estimate(request, analysis, alternatives);
    const brief = new DecisionBriefBuilder({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    }).generate({
      request,
      analysis,
      evidence,
      alternatives,
      recommendation,
      risks,
      scenarios,
      impact,
      approval,
      timeline,
    });

    expect(impact.scores).toHaveLength(DECISION_IMPACT_DIMENSIONS.length);
    expect(impact.overallScore).toBeGreaterThan(0);
    expect(brief.narrative).toContain("Decision Summary:");
    expect(brief.narrative).toContain("Recommendation:");
    expect(brief.approvalStatus).toBe("draft");
    expect(brief.confidence.value).toBeGreaterThan(0);
  });
});

describe("Decision Intelligence — resolver orchestration", () => {
  it("coordinates the full workflow", () => {
    const resolver = createDecisionIntelligenceDomain();
    const result = resolver.analyze(makeRequest());

    expect(result.domainVersion).toBe(DECISION_INTELLIGENCE_VERSION);
    expect(result.analysis.summary.length).toBeGreaterThan(0);
    expect(result.evidence.items.length).toBeGreaterThan(0);
    expect(result.alternatives.alternatives.length).toBeGreaterThan(0);
    expect(result.risks.risks.length).toBeGreaterThan(0);
    expect(result.scenarios.scenarios).toHaveLength(4);
    expect(result.approval.status).toBe("draft");
    expect(result.timeline.approvalDays).toBeGreaterThan(0);
    expect(result.recommendation.recommendedOption.length).toBeGreaterThan(0);
    expect(result.impact.scores.length).toBe(DECISION_IMPACT_DIMENSIONS.length);
    expect(result.brief.narrative.length).toBeGreaterThan(0);
  });

  it("supports dependency injection", () => {
    const approvals = new DecisionApprovals({ initialStatus: "under_review" });
    const resolver = new DecisionResolver({
      evidence: new DecisionEvidence(),
      analysis: new DecisionAnalysis(),
      alternatives: new DecisionAlternatives(),
      risks: new DecisionRisks(),
      scenarios: new DecisionScenarios(),
      approvals,
      timeline: new DecisionTimelineEstimator(),
      recommendations: new DecisionRecommendations(),
      impact: new DecisionImpact(),
      brief: new DecisionBriefBuilder(),
    });

    const result = resolver.analyze(makeRequest());
    expect(result.approval.status).toBe("under_review");
  });

  it("satisfies IntelligenceDomainModule with domainKey decision", () => {
    const resolver = createDecisionIntelligenceDomain();
    const domainModule = {
      domainKey: "decision" as const,
      name: "Decision Intelligence",
      version: DECISION_INTELLIGENCE_VERSION,
      async handle(request: {
        runId?: string;
        domain: "decision";
        intent: string;
        actor: { userId: string | null };
        scope: { organizationId: string | null; schoolId: string | null };
      }) {
        const analysis = resolver.analyze({
          requestId: request.runId ?? "decision-handle",
          subject: request.intent,
        });
        return createEmptyIntelligenceResult({
          runId: request.runId ?? "decision-handle",
          context: {
            scope: request.scope,
            actor: request.actor,
            domain: "decision",
            session: null,
            permissions: [],
          },
          metadata: { decision: analysis },
        });
      },
    };

    expect(validateIntelligenceDomain(domainModule).ok).toBe(true);
    const registry = createIntelligenceDomainRegistry();
    registry.register(domainModule);
    expect(registry.get("decision")?.domainKey).toBe("decision");
  });

  it("is registered by createIntelligenceService", () => {
    const service = createIntelligenceService();
    const decision = service.registry.get("decision");
    expect(decision).toBeDefined();
    expect(decision?.domainKey).toBe("decision");
    expect(decision?.version).toBe(DECISION_INTELLIGENCE_VERSION);
  });
});
