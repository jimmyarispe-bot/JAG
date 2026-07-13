/** Wisdom Intelligence unit tests (Sprint 060 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createWisdomIntelligence,
  WISDOM_ANALYSIS_KINDS,
  WISDOM_CAPABILITIES,
  WISDOM_INTELLIGENCE_VERSION,
  WISDOM_SCENARIOS,
} from "@/lib/platform/intelligence/wisdom";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "confidenceLevel",
  "ethicalIntegrity",
  "evidenceQuality",
  "longTermImpact",
  "organizationalAlignment",
  "strategicValue",
  "tradeOffBalance",
  "wisdomScore",
].sort();

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive", "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural", "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective", "wisdom",
];

function buildResult(seed: string) {
  const { service } = createWisdomIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-13T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `wis-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    collectiveResult: {
      healthScore: { value: 71 },
      collectiveConfidence: 69,
      baseline: { collectiveConfidence: 70, collaborationQuality: 68, consensusStrength: 69 },
    },
    institutionalMemoryResult: {
      healthScore: { value: 71 },
      institutionalMemoryScore: { value: 69 },
      baseline: { knowledgeConfidence: 70, institutionalMemoryCoverage: 68, knowledgeQuality: 69 },
    },
    knowledgeResult: {
      healthScore: { value: 70 },
      knowledgeScore: { value: 68 },
      baseline: { knowledgeConfidence: 70, knowledgeFreshness: 68, knowledgeQuality: 69 },
    },
    decisionResult: { confidence: { value: 0.72 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    ethicalResult: { healthScore: { value: 72 }, ethicalScore: { value: 70 } },
    systemsResult: { healthScore: { value: 71 }, adaptability: 68, cascadingRisk: 65 },
    resilienceResult: { healthScore: { value: 70 }, adaptiveCapacity: 68 },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    behavioralResult: { healthScore: { value: 70 }, behavioralScore: { value: 68 } },
    culturalResult: { healthScore: { value: 70 }, culturalScore: { value: 68 } },
    stakeholderResult: { healthScore: { value: 71 }, engagementScore: { value: 68 } },
    ecosystemResult: { healthScore: { value: 70 }, ecosystemScore: { value: 68 } },
  });
}

describe("Wisdom Intelligence (Sprint 060)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(WISDOM_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.executiveJudgmentScore, result.strategicReasoningScore,
      result.tradeOffAnalysisScore, result.longTermThinkingScore,
      result.crossDomainSynthesisScore, result.decisionQualityAssessmentScore,
      result.uncertaintyAnalysisScore, result.confidenceCalibrationScore,
      result.organizationalPrioritizationScore, result.missionAlignmentScore,
      result.valuesAlignmentScore, result.ethicalJudgmentScore,
      result.strategicTimingScore, result.opportunityCostAnalysisScore,
      result.executiveRecommendationValidationScore, result.organizationalJudgmentEvolutionScore,
      result.institutionalWisdomScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.strategicReasoningEngineScore,
      result.crossDomainSynthesisEngineScore, result.tradeOffEngineScore,
      result.uncertaintyEngineScore, result.executiveJudgmentEngineScore, result.confidenceEngineScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.strategicJudgmentDashboard.headline).toBeTruthy();
    expect(result.crossDomainSynthesisDashboard.headline).toBeTruthy();
    expect(result.tradeOffAnalysisDashboard.headline).toBeTruthy();
    expect(result.organizationalPrioritiesDashboard.headline).toBeTruthy();
    expect(result.confidenceDashboard.headline).toBeTruthy();
    expect(result.longTermOutlookDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.brief.judgment.whatLeadershipShouldDo).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.strategicReasoningSuite.records.length).toBeGreaterThan(0);
    expect(result.crossDomainSynthesisSuite.records.length).toBeGreaterThan(0);
    expect(result.tradeOffSuite.records.length).toBeGreaterThan(0);
    expect(result.uncertaintySuite.records.length).toBeGreaterThan(0);
    expect(result.executiveJudgmentSuite.records.length).toBeGreaterThan(0);
    expect(result.confidenceSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all wisdom scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...WISDOM_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...WISDOM_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Wisdom Lens", () => {
    const result = buildResult("recommendations");
    expect(WISDOM_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("wis-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("wis-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "collective", "institutional-memory", "knowledge", "executive-decision", "opportunity", "predictive", "ethical",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createWisdomIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "wis-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["executive_judgment", "strategic_reasoning", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("wis-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().wisdom", () => {
    const service = createIntelligenceService();
    expect(service.wisdom).toBeTruthy();
    expect(service.wisdom.service.build({ requestId: "wis-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the terminal platform module after collective", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-13T20:00:00.000Z"),
        createId: prefix => `${prefix}-test`,
      },
    });
    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-2)).toBe("collective");
    expect(result.moduleOrder.at(-1)).toBe("wisdom");
    expect(result.results.every(item => item.ok)).toBe(true);
  });
});
