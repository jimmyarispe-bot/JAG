/** Collective Intelligence unit tests (Sprint 059 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createCollectiveIntelligence,
  COLLECTIVE_ANALYSIS_KINDS,
  COLLECTIVE_CAPABILITIES,
  COLLECTIVE_INTELLIGENCE_VERSION,
  COLLECTIVE_SCENARIOS,
} from "@/lib/platform/intelligence/collective";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "collaborationQuality",
  "collectiveConfidence",
  "consensusStrength",
  "crossDomainAgreement",
  "expertiseCoverage",
  "longTermCollectiveValue",
  "organizationalAlignment",
  "perspectiveDiversity",
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
  const { service } = createCollectiveIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-13T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `col-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
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
    behavioralResult: { healthScore: { value: 70 }, behavioralScore: { value: 68 } },
    culturalResult: { healthScore: { value: 70 }, culturalScore: { value: 68 } },
    stakeholderResult: { healthScore: { value: 71 }, engagementScore: { value: 68 } },
    systemsResult: { healthScore: { value: 71 }, adaptability: 68, cascadingRisk: 65 },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    ecosystemResult: { healthScore: { value: 70 }, ecosystemScore: { value: 68 } },
    resilienceResult: { healthScore: { value: 70 }, adaptiveCapacity: 68 },
    ethicalResult: { healthScore: { value: 72 }, ethicalScore: { value: 70 } },
  });
}

describe("Collective Intelligence (Sprint 059)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(COLLECTIVE_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.collectiveReasoningScore, result.consensusAnalysisScore,
      result.distributedExpertiseScore, result.collaborativeIntelligenceScore,
      result.multiDomainSynthesisScore, result.crossFunctionalIntelligenceScore,
      result.organizationalAlignmentScore, result.teamDecisionIntelligenceScore,
      result.expertWeightingScore, result.perspectiveDiversityScore,
      result.conflictResolutionScore, result.collaborativeLearningScore,
      result.organizationalCoordinationScore, result.sharedDecisionQualityScore,
      result.collectiveOpportunityDetectionScore, result.collectiveRiskAssessmentScore,
      result.collectiveIntelligenceEvolutionScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.consensusEngineScore, result.distributedExpertiseEngineScore,
      result.crossDomainSynthesisScore, result.collaborationEngineScore, result.conflictResolutionEngineScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.consensusDashboard.headline).toBeTruthy();
    expect(result.crossDomainIntelligenceDashboard.headline).toBeTruthy();
    expect(result.expertiseNetworkDashboard.headline).toBeTruthy();
    expect(result.organizationalAlignmentDashboard.headline).toBeTruthy();
    expect(result.collaborationHealthDashboard.headline).toBeTruthy();
    expect(result.collectiveLearningDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.consensusSuite.records.length).toBeGreaterThan(0);
    expect(result.distributedExpertiseSuite.records.length).toBeGreaterThan(0);
    expect(result.crossDomainSynthesisSuite.records.length).toBeGreaterThan(0);
    expect(result.collaborationSuite.records.length).toBeGreaterThan(0);
    expect(result.conflictResolutionSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all collective scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...COLLECTIVE_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...COLLECTIVE_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Collective Lens", () => {
    const result = buildResult("recommendations");
    expect(COLLECTIVE_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("col-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("col-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "institutional-memory", "knowledge", "executive-decision", "opportunity", "predictive", "stakeholder", "organizational-improvement",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createCollectiveIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "col-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["collective_reasoning", "consensus_analysis", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("col-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().collective", () => {
    const service = createIntelligenceService();
    expect(service.collective).toBeTruthy();
    expect(service.collective.service.build({ requestId: "col-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the penultimate platform module before wisdom", async () => {
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
