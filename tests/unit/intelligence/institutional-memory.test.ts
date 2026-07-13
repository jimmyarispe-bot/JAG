/** Institutional Memory Intelligence unit tests (Sprint 058 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInstitutionalMemoryIntelligence,
  INSTITUTIONAL_MEMORY_ANALYSIS_KINDS,
  INSTITUTIONAL_MEMORY_CAPABILITIES,
  INSTITUTIONAL_MEMORY_INTELLIGENCE_VERSION,
  INSTITUTIONAL_MEMORY_SCENARIOS,
} from "@/lib/platform/intelligence/institutional-memory";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "evidenceStrength",
  "expertiseAvailability",
  "institutionalMemoryCoverage",
  "knowledgeConfidence",
  "knowledgeFreshness",
  "knowledgeGaps",
  "knowledgeQuality",
  "longTermLearningValue",
].sort();

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive", "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural", "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective", "wisdom",
];

function buildResult(seed: string) {
  const { service } = createInstitutionalMemoryIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-13T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `imm-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    knowledgeResult: {
      healthScore: { value: 71 },
      knowledgeScore: { value: 69 },
      baseline: { knowledgeConfidence: 70, knowledgeFreshness: 68, knowledgeQuality: 69 },
    },
    ecosystemResult: { healthScore: { value: 70 }, ecosystemScore: { value: 68 } },
    resilienceResult: { healthScore: { value: 70 }, adaptiveCapacity: 68 },
    systemsResult: { healthScore: { value: 71 }, adaptability: 68, cascadingRisk: 65 },
    stakeholderResult: { healthScore: { value: 71 }, engagementScore: { value: 68 } },
    culturalResult: { healthScore: { value: 70 }, culturalScore: { value: 68 } },
    ethicalResult: { healthScore: { value: 72 }, ethicalScore: { value: 70 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    decisionResult: { confidence: { value: 0.72 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
  });
}

describe("Institutional Memory Intelligence (Sprint 058)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(INSTITUTIONAL_MEMORY_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.organizationalMemoryScore, result.knowledgeGraphScore,
      result.knowledgeMappingScore, result.expertiseIntelligenceScore,
      result.institutionalMemoryScore, result.lessonsLearnedScore,
      result.decisionHistoryScore, result.policyKnowledgeScore,
      result.processKnowledgeScore, result.relationshipKnowledgeScore,
      result.semanticSearchScore, result.knowledgeValidationScore,
      result.knowledgeEvolutionScore, result.knowledgeGapDetectionScore,
      result.knowledgeTransferScore, result.knowledgeQualityScore,
      result.knowledgeSynthesisScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.knowledgeGraphEngineScore, result.semanticSearchEngineScore,
      result.expertiseScore, result.knowledgeValidationEngineScore, result.knowledgeEvolutionEngineScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.knowledgeGraphDashboard.headline).toBeTruthy();
    expect(result.organizationalMemoryDashboard.headline).toBeTruthy();
    expect(result.expertiseMapDashboard.headline).toBeTruthy();
    expect(result.lessonsLearnedDashboard.headline).toBeTruthy();
    expect(result.knowledgeQualityDashboard.headline).toBeTruthy();
    expect(result.knowledgeGapsDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.knowledgeGraphSuite.records.length).toBeGreaterThan(0);
    expect(result.semanticSearchSuite.records.length).toBeGreaterThan(0);
    expect(result.expertiseSuite.records.length).toBeGreaterThan(0);
    expect(result.knowledgeValidationSuite.records.length).toBeGreaterThan(0);
    expect(result.knowledgeEvolutionSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all institutional memory scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...INSTITUTIONAL_MEMORY_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...INSTITUTIONAL_MEMORY_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Institutional Memory Lens", () => {
    const result = buildResult("recommendations");
    expect(INSTITUTIONAL_MEMORY_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("imm-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("imm-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "knowledge", "ecosystem", "opportunity", "executive-decision", "predictive", "organizational-improvement", "stakeholder",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createInstitutionalMemoryIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "imm-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["organizational_memory", "knowledge_graph", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("imm-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().institutionalMemory", () => {
    const service = createIntelligenceService();
    expect(service.institutionalMemory).toBeTruthy();
    expect(service.institutionalMemory.service.build({ requestId: "imm-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the platform module before collective", async () => {
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
    expect(result.moduleOrder.at(-3)).toBe("institutional-memory");
    expect(result.moduleOrder.at(-2)).toBe("collective");
    expect(result.moduleOrder.at(-1)).toBe("wisdom");
    expect(result.results.every(item => item.ok)).toBe(true);
  });
});
