/**
 * Strategic Intelligence domain — unit tests.
 */

import { describe, expect, it } from "vitest";
import {
  createEmptyIntelligenceResult,
  createIntelligenceDomainRegistry,
  createIntelligenceService,
  createStrategicIntelligenceDomain,
  StrategicAnalysis,
  StrategicBriefBuilder,
  StrategicExecution,
  StrategicGoals,
  StrategicImpact,
  StrategicInitiatives,
  StrategicObjectives,
  StrategicOwnersService,
  StrategicRecommendations,
  StrategicResolver,
  STRATEGIC_IMPACT_DIMENSIONS,
  STRATEGIC_INTELLIGENCE_VERSION,
  validateIntelligenceDomain,
  type StrategicFindingInput,
  type StrategicRequest,
} from "@/lib/platform/intelligence";

function makeFindings(): StrategicFindingInput[] {
  return [
    {
      findingId: "f-cash",
      title: "Cash decline threatens runway",
      summary: "Critical cash and collections financial weakness in tuition receivables",
      severity: "critical",
      kindHints: ["financial_weakness"],
      evidenceRefs: [{ evidenceId: "ev-cash", label: "Cash report" }],
      confidence: { value: 0.82, level: "high", factors: [] },
      signals: ["cash", "collections"],
    },
    {
      findingId: "f-staff",
      title: "Teacher retention risk",
      summary: "Staffing vacancies and turnover rising across campuses",
      severity: "high",
      kindHints: ["staffing_issue"],
      confidence: { value: 0.7, level: "medium", factors: [] },
      signals: ["staffing", "retention"],
    },
  ];
}

function makeRequest(overrides: Partial<StrategicRequest> = {}): StrategicRequest {
  return {
    requestId: "strat-req-1",
    subject: "Strategic response to cash and staffing risks",
    description: "Board needs a strategic plan for financial and staffing recovery",
    findings: makeFindings(),
    organizationId: "org-1",
    schoolId: "school-1",
    ...overrides,
  };
}

describe("Strategic Intelligence — analysis", () => {
  it("converts findings into strategic opportunities", () => {
    const analysis = new StrategicAnalysis().analyze(makeRequest());
    expect(analysis.opportunities.length).toBe(2);
    expect(analysis.primaryOpportunity?.kind).toBe("financial_weakness");
    expect(analysis.opportunities.map((o) => o.kind)).toEqual(
      expect.arrayContaining(["financial_weakness", "staffing_issue"])
    );
  });
});

describe("Strategic Intelligence — goals", () => {
  it("creates goals linked to opportunities", () => {
    const analysis = new StrategicAnalysis().analyze(makeRequest());
    const goals = new StrategicGoals({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    }).createFromAnalysis(analysis);

    expect(goals.length).toBe(2);
    expect(goals[0]!.title).toContain("Cash decline");
    expect(goals[0]!.priority).toBe("critical");
    expect(goals[0]!.status).toBe("proposed");
    expect(goals[0]!.linkedOpportunities).toHaveLength(1);
    expect(goals[0]!.expectedValue.length).toBeGreaterThan(0);
    expect(goals[0]!.createdDate).toBe("2026-07-11T12:00:00.000Z");
    expect(goals[0]!.targetDate > goals[0]!.createdDate).toBe(true);
  });
});

describe("Strategic Intelligence — objectives", () => {
  it("creates measurable objectives with baseline/target/currentValue", () => {
    const analysis = new StrategicAnalysis().analyze(makeRequest());
    const goals = new StrategicGoals().createFromAnalysis(analysis);
    const objectives = new StrategicObjectives().createForGoals(
      goals,
      analysis.opportunities
    );

    expect(objectives.length).toBeGreaterThanOrEqual(2);
    const first = objectives[0]!;
    expect(first.goalId).toBe(goals[0]!.id);
    expect(typeof first.baseline).toBe("number");
    expect(typeof first.target).toBe("number");
    expect(typeof first.currentValue).toBe("number");
    expect(first.measurementMethod.length).toBeGreaterThan(0);
    expect(first.frequency).toBeTruthy();
    expect(first.successCriteria.length).toBeGreaterThan(0);
  });
});

describe("Strategic Intelligence — initiatives", () => {
  it("creates initiatives with dependencies, milestones, budget, resources, timeline", () => {
    const analysis = new StrategicAnalysis().analyze(makeRequest());
    const goals = new StrategicGoals({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    }).createFromAnalysis(analysis);
    const objectives = new StrategicObjectives().createForGoals(
      goals,
      analysis.opportunities
    );
    const initiatives = new StrategicInitiatives({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    }).createForGoals(goals, objectives, analysis.opportunities);

    expect(initiatives).toHaveLength(2);
    expect(initiatives[0]!.milestones.length).toBe(3);
    expect(initiatives[0]!.budget.amount).toBeGreaterThan(0);
    expect(initiatives[0]!.resources.length).toBeGreaterThan(0);
    expect(initiatives[0]!.timeline.startDate).toBeTruthy();
    expect(initiatives[0]!.timeline.endDate).toBeTruthy();
    expect(initiatives[0]!.dependencies).toEqual([]);
    expect(initiatives[1]!.dependencies).toEqual([initiatives[0]!.id]);
  });
});

describe("Strategic Intelligence — execution tracking", () => {
  it("tracks status and calculates execution health", () => {
    const analysis = new StrategicAnalysis().analyze(makeRequest());
    const goals = new StrategicGoals().createFromAnalysis(analysis);
    const objectives = new StrategicObjectives().createForGoals(
      goals,
      analysis.opportunities
    );
    const initiatives = new StrategicInitiatives().createForGoals(
      goals,
      objectives,
      analysis.opportunities
    );
    const execution = new StrategicExecution({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    });

    const snapshots = execution.track(initiatives, objectives);
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0]!.status).toBe("planning");
    expect(snapshots[0]!.healthScore).toBeGreaterThanOrEqual(0);
    expect(snapshots[0]!.healthScore).toBeLessThanOrEqual(100);
    expect(["healthy", "watch", "at_risk", "critical"]).toContain(
      snapshots[0]!.healthLabel
    );

    const { snapshot: activeSnapshot } = execution.updateStatus(
      { ...initiatives[0]!, status: "active" },
      "active",
      objectives
    );
    expect(["active", "on_track", "behind"]).toContain(activeSnapshot.status);
    expect(activeSnapshot.healthScore).toBeGreaterThan(0);

    const health = execution.calculateHealth("blocked", 10, 0.8);
    expect(health.healthLabel).toBe("critical");
  });
});

describe("Strategic Intelligence — recommendations", () => {
  it("generates priority, urgency, impact, actions, and confidence", () => {
    const analysis = new StrategicAnalysis().analyze(makeRequest());
    const goals = new StrategicGoals().createFromAnalysis(analysis);
    const recommendations = new StrategicRecommendations().generate(analysis, goals);

    expect(recommendations.length).toBeGreaterThan(0);
    const top = recommendations[0]!;
    expect(top.priority).toBe("critical");
    expect(top.urgency).toBe("immediate");
    expect(top.expectedImpact.length).toBeGreaterThan(0);
    expect(top.recommendedActions.length).toBeGreaterThan(0);
    expect(top.confidence.value).toBeGreaterThan(0);
  });
});

describe("Strategic Intelligence — impact", () => {
  it("scores all impact dimensions", () => {
    const analysis = new StrategicAnalysis().analyze(makeRequest());
    const goals = new StrategicGoals().createFromAnalysis(analysis);
    const recommendations = new StrategicRecommendations().generate(analysis, goals);
    const impact = new StrategicImpact().assess(
      analysis.opportunities,
      goals,
      recommendations
    );

    expect(impact.scores).toHaveLength(STRATEGIC_IMPACT_DIMENSIONS.length);
    expect(impact.scores.map((s) => s.dimension).sort()).toEqual(
      [...STRATEGIC_IMPACT_DIMENSIONS].sort()
    );
    expect(impact.overallScore).toBeGreaterThan(0);
    expect(impact.primaryDimensions.length).toBeGreaterThan(0);
    expect(impact.summary.length).toBeGreaterThan(0);
  });
});

describe("Strategic Intelligence — executive brief", () => {
  it("generates a complete executive narrative", () => {
    const request = makeRequest();
    const analysis = new StrategicAnalysis().analyze(request);
    const goals = new StrategicGoals().createFromAnalysis(analysis);
    const objectives = new StrategicObjectives().createForGoals(
      goals,
      analysis.opportunities
    );
    const initiatives = new StrategicInitiatives().createForGoals(
      goals,
      objectives,
      analysis.opportunities
    );
    const owners = new StrategicOwnersService().assign(
      goals[0] ?? null,
      analysis.primaryOpportunity
    );
    const execution = new StrategicExecution().track(initiatives, objectives);
    const recommendations = new StrategicRecommendations().generate(analysis, goals);
    const impact = new StrategicImpact().assess(
      analysis.opportunities,
      goals,
      recommendations
    );
    const brief = new StrategicBriefBuilder().generate({
      request,
      analysis,
      goals,
      objectives,
      initiatives,
      owners,
      execution,
      recommendations,
      impact,
    });

    expect(brief.executiveSummary.length).toBeGreaterThan(0);
    expect(brief.situation.length).toBeGreaterThan(0);
    expect(brief.evidence.length).toBeGreaterThan(0);
    expect(brief.strategicGoal.length).toBeGreaterThan(0);
    expect(brief.objectives.length).toBeGreaterThan(0);
    expect(brief.owner).toBe(owners.primaryOwner);
    expect(brief.timeline.length).toBeGreaterThan(0);
    expect(brief.expectedImpact.length).toBeGreaterThan(0);
    expect(brief.recommendedActions.length).toBeGreaterThan(0);
    expect(brief.narrative).toContain("Executive Summary:");
    expect(brief.narrative).toContain("Recommended Actions:");
    expect(brief.confidence.level).toBeTruthy();
  });
});

describe("Strategic Intelligence — resolver orchestration", () => {
  it("coordinates the full workflow into a StrategicIntelligenceResult", () => {
    const resolver = createStrategicIntelligenceDomain();
    const result = resolver.analyze(makeRequest());

    expect(result.domainVersion).toBe(STRATEGIC_INTELLIGENCE_VERSION);
    expect(result.analysis.opportunities.length).toBe(2);
    expect(result.goals.length).toBe(2);
    expect(result.objectives.length).toBeGreaterThan(0);
    expect(result.initiatives.length).toBe(2);
    expect(result.owners.primaryOwner).toBeTruthy();
    expect(result.owners.executiveSponsor).toBeTruthy();
    expect(result.owners.supportingTeam.length).toBeGreaterThan(0);
    expect(result.owners.approver).toBeTruthy();
    expect(result.execution.length).toBe(2);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.impact.scores.length).toBe(STRATEGIC_IMPACT_DIMENSIONS.length);
    expect(result.brief.narrative.length).toBeGreaterThan(0);
  });

  it("supports dependency injection of collaborators", () => {
    const analysis = new StrategicAnalysis();
    const goals = new StrategicGoals({
      now: () => new Date("2026-01-01T00:00:00.000Z"),
    });
    const resolver = new StrategicResolver({
      analysis,
      goals,
      objectives: new StrategicObjectives(),
      initiatives: new StrategicInitiatives({
        now: () => new Date("2026-01-01T00:00:00.000Z"),
      }),
      owners: new StrategicOwnersService({
        defaults: { primaryOwner: "Injected Owner" },
      }),
      execution: new StrategicExecution({
        now: () => new Date("2026-01-01T00:00:00.000Z"),
      }),
      recommendations: new StrategicRecommendations(),
      impact: new StrategicImpact(),
      brief: new StrategicBriefBuilder({
        now: () => new Date("2026-01-01T00:00:00.000Z"),
      }),
    });

    const result = resolver.analyze(makeRequest());
    expect(result.owners.primaryOwner).toBe("Injected Owner");
    expect(result.goals[0]!.createdDate).toBe("2026-01-01T00:00:00.000Z");
  });

  it("satisfies IntelligenceDomainModule with domainKey strategic", () => {
    const resolver = createStrategicIntelligenceDomain();
    const module = {
      domainKey: "strategic" as const,
      name: "Strategic Intelligence",
      version: STRATEGIC_INTELLIGENCE_VERSION,
      async handle(request: {
        runId?: string;
        domain: "strategic";
        intent: string;
        actor: { userId: string | null };
        scope: { organizationId: string | null; schoolId: string | null };
      }) {
        const analysis = resolver.analyze({
          requestId: request.runId ?? "strat-handle",
          subject: request.intent,
          findings: makeFindings(),
        });
        return createEmptyIntelligenceResult({
          runId: request.runId ?? "strat-handle",
          context: {
            scope: request.scope,
            actor: request.actor,
            domain: "strategic",
            session: null,
            permissions: [],
          },
          metadata: { strategic: analysis },
        });
      },
    };

    expect(validateIntelligenceDomain(module).ok).toBe(true);

    const registry = createIntelligenceDomainRegistry();
    registry.register(module);
    expect(registry.get("strategic")?.domainKey).toBe("strategic");
  });

  it("is registered by createIntelligenceService", () => {
    const service = createIntelligenceService();
    const strategic = service.registry.get("strategic");
    expect(strategic).toBeDefined();
    expect(strategic?.domainKey).toBe("strategic");
    expect(strategic?.version).toBe(STRATEGIC_INTELLIGENCE_VERSION);
  });
});
