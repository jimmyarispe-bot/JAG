/** Systems Intelligence unit tests (Sprint 055 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createSystemsIntelligence,
  SYSTEMS_ANALYSIS_KINDS,
  SYSTEMS_CAPABILITIES,
  SYSTEMS_INTELLIGENCE_VERSION,
  SYSTEMS_SCENARIOS,
} from "@/lib/platform/intelligence/systems";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "adaptability",
  "bottleneckRisk",
  "cascadingRisk",
  "dependencyImpact",
  "feedbackStability",
  "longTermSystemHealth",
  "resourceFlow",
  "systemComplexity",
].sort();

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive", "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural", "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective", "wisdom", "synthesis", "briefing", "executive-memory", "decision-intelligence", "executive-predictive", "executive-autonomous", "executive-copilot", "executive-command-center", "initiative-intelligence", "portfolio-intelligence", "digital-twin",
"ecosystem-intelligence",
];

function buildResult(seed: string) {
  const { service } = createSystemsIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `sys-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    operationsResult: { healthScore: { value: 71 }, throughputScore: { value: 68 } },
    legalComplianceRiskResult: { healthScore: { value: 72 }, legalRiskScore: { value: 68 }, complianceScore: { value: 70 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    decisionResult: { confidence: { value: 0.72 } },
    economicResult: { healthScore: { value: 70 }, economicScore: { value: 68 } },
    behavioralResult: { healthScore: { value: 70 }, decisionBehaviorScore: { value: 67 }, collaborationScore: { value: 65 } },
    ethicalResult: { healthScore: { value: 71 }, fairnessScore: { value: 69 }, accountabilityScore: { value: 68 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
  });
}

describe("Systems Intelligence (Sprint 055)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(SYSTEMS_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.systemMappingScore, result.dependencyAnalysisScore,
      result.feedbackLoopAnalysisScore, result.constraintIdentificationScore,
      result.bottleneckDetectionScore, result.flowOptimizationScore,
      result.emergentBehaviorScore, result.networkDynamicsScore,
      result.organizationalComplexityScore, result.interdependencyModelingScore,
      result.cascadingRiskScore, result.systemStabilityScore,
      result.leveragePointIdentificationScore, result.resourceFlowScore,
      result.adaptiveCapacityScore, result.systemEvolutionScore,
      result.scenarioInteractionScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.dependencyScore, result.feedbackLoopScore,
      result.bottleneckScore, result.constraintScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.dependencyMapDashboard.headline).toBeTruthy();
    expect(result.feedbackLoopsDashboard.headline).toBeTruthy();
    expect(result.bottlenecksDashboard.headline).toBeTruthy();
    expect(result.systemHealthDashboard.headline).toBeTruthy();
    expect(result.complexityAnalysisDashboard.headline).toBeTruthy();
    expect(result.adaptiveCapacityDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.dependencySuite.records.length).toBeGreaterThan(0);
    expect(result.feedbackLoopSuite.records.length).toBeGreaterThan(0);
    expect(result.constraintSuite.records.length).toBeGreaterThan(0);
    expect(result.bottleneckSuite.records.length).toBeGreaterThan(0);
    expect(result.networkDynamicsSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all systems scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...SYSTEMS_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...SYSTEMS_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Systems Lens", () => {
    const result = buildResult("recommendations");
    expect(SYSTEMS_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("sys-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("sys-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "operations", "legal-compliance-risk", "predictive", "executive-decision", "economic", "behavioral", "opportunity",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createSystemsIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "sys-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["system_mapping", "dependency_analysis", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("sys-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().systems", () => {
    const service = createIntelligenceService();
    expect(service.systems).toBeTruthy();
    expect(service.systems.service.build({ requestId: "sys-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs ahead of resilience and ecosystem in the pipeline", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-12T20:00:00.000Z"),
        createId: prefix => `${prefix}-test`,
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
    expect(result.results.every(item => item.ok)).toBe(true);
  });
});
