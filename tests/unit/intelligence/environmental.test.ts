/** Environmental Intelligence unit tests (Sprint 049 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createEnvironmentalIntelligence,
  ENVIRONMENTAL_ANALYSIS_KINDS,
  ENVIRONMENTAL_CAPABILITIES,
  ENVIRONMENTAL_INTELLIGENCE_VERSION,
  ENVIRONMENTAL_SCENARIOS,
} from "@/lib/platform/intelligence/environmental";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "climateRisk",
  "facilityExposure",
  "infrastructureResilience",
  "resourceAvailability",
  "sustainabilityImpact",
  "regulatoryExposure",
  "insuranceRisk",
  "longTermEnvironmentalOutlook",
].sort();

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive", "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural", "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective", "wisdom",
];

function buildResult(seed: string) {
  const { service } = createEnvironmentalIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `env-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    politicalResult: { healthScore: { value: 71 }, politicalScore: { value: 69 }, politicalStability: { value: 64 } },
    economicResult: { healthScore: { value: 68 }, economicScore: { value: 66 } },
    legalComplianceRiskResult: { healthScore: { value: 70 }, legalScore: { value: 68 }, complianceScore: { value: 72 }, riskScore: { value: 48 } },
    operationsResult: { healthScore: { value: 73 }, operationsScore: { value: 71 }, costPressure: { value: 52 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    decisionResult: { confidence: { value: 0.72 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    marketResult: { healthScore: { value: 74 }, marketScore: { value: 72 } },
  });
}

describe("Environmental Intelligence (Sprint 049)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(ENVIRONMENTAL_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.climateScore, result.weatherRiskScore,
      result.naturalDisasterScore, result.environmentalRegulationScore,
      result.sustainabilityScore, result.energyScore, result.waterResourcesScore,
      result.airQualityScore, result.wasteManagementScore,
      result.carbonEmissionsScore, result.biodiversityScore,
      result.infrastructureResilienceScore, result.facilityRiskScore,
      result.supplyChainEnvironmentalRiskScore, result.insuranceExposureScore,
      result.environmentalFundingScore, result.esgImpactScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.climateRiskScore, result.disasterImpactScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.outlookDashboard.headline).toBeTruthy();
    expect(result.climateDashboard.headline).toBeTruthy();
    expect(result.disasterRiskDashboard.headline).toBeTruthy();
    expect(result.sustainabilityDashboard.headline).toBeTruthy();
    expect(result.infrastructureDashboard.headline).toBeTruthy();
    expect(result.resourceMonitoringDashboard.headline).toBeTruthy();
    expect(result.esgOverviewDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.climateRiskSuite.records.length).toBeGreaterThan(0);
    expect(result.disasterImpactSuite.records.length).toBeGreaterThan(0);
    expect(result.sustainabilitySuite.records.length).toBeGreaterThan(0);
    expect(result.infrastructureResilienceSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all environmental scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...ENVIRONMENTAL_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...ENVIRONMENTAL_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Environmental Lens", () => {
    const result = buildResult("recommendations");
    expect(ENVIRONMENTAL_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("env-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("env-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "political", "economic", "operations", "opportunity", "legal-compliance-risk", "executive-decision", "predictive",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createEnvironmentalIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "env-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["climate", "sustainability", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("env-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().environmental", () => {
    const service = createIntelligenceService();
    expect(service.environmental).toBeTruthy();
    expect(service.environmental.service.build({ requestId: "env-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the platform module before stakeholder and reputation", async () => {
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
    expect(result.moduleOrder.at(-3)).toBe("institutional-memory");
    expect(result.moduleOrder.at(-2)).toBe("collective");
    expect(result.moduleOrder.at(-1)).toBe("wisdom");
    expect(result.results.every(item => item.ok)).toBe(true);
  });
});
