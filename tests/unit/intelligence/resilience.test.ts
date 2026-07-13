/** Resilience Intelligence unit tests (Sprint 056 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createResilienceIntelligence,
  RESILIENCE_ANALYSIS_KINDS,
  RESILIENCE_CAPABILITIES,
  RESILIENCE_INTELLIGENCE_VERSION,
  RESILIENCE_SCENARIOS,
} from "@/lib/platform/intelligence/resilience";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "adaptiveCapacity",
  "financialStability",
  "infrastructureReadiness",
  "longTermResilienceOutlook",
  "operationalStability",
  "organizationalReadiness",
  "recoveryCapability",
  "workforceStability",
].sort();

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive", "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural", "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective", "wisdom",
];

function buildResult(seed: string) {
  const { service } = createResilienceIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `rsl-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    systemsResult: { healthScore: { value: 71 }, adaptability: 68, cascadingRisk: 65 },
    operationsResult: { healthScore: { value: 71 }, throughputScore: { value: 68 } },
    legalComplianceRiskResult: { healthScore: { value: 72 }, legalRiskScore: { value: 68 }, complianceScore: { value: 70 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    decisionResult: { confidence: { value: 0.72 } },
    economicResult: { healthScore: { value: 70 }, economicScore: { value: 68 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
  });
}

describe("Resilience Intelligence (Sprint 056)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(RESILIENCE_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.organizationalResilienceScore, result.businessContinuityScore,
      result.disasterRecoveryScore, result.operationalRecoveryScore,
      result.financialResilienceScore, result.workforceResilienceScore,
      result.supplyChainResilienceScore, result.cyberResilienceScore,
      result.infrastructureResilienceScore, result.vendorResilienceScore,
      result.crisisReadinessScore, result.adaptiveCapacityScore,
      result.redundancyPlanningScore, result.recoveryTimeAnalysisScore,
      result.stressTestingScore, result.resilienceOptimizationScore,
      result.longTermAdaptabilityScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.stressTestScore, result.recoveryScore,
      result.continuityScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.businessContinuityDashboard.headline).toBeTruthy();
    expect(result.disasterRecoveryDashboard.headline).toBeTruthy();
    expect(result.operationalStabilityDashboard.headline).toBeTruthy();
    expect(result.financialResilienceDashboard.headline).toBeTruthy();
    expect(result.cyberInfrastructureDashboard.headline).toBeTruthy();
    expect(result.stressTestingDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.stressTestSuite.records.length).toBeGreaterThan(0);
    expect(result.recoverySuite.records.length).toBeGreaterThan(0);
    expect(result.continuitySuite.records.length).toBeGreaterThan(0);
    expect(result.adaptiveCapacitySuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all resilience scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...RESILIENCE_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...RESILIENCE_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Resilience Lens", () => {
    const result = buildResult("recommendations");
    expect(RESILIENCE_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("rsl-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("rsl-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "systems", "operations", "legal-compliance-risk", "economic", "executive-decision", "predictive", "opportunity",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createResilienceIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "rsl-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["organizational_resilience", "business_continuity", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("rsl-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().resilience", () => {
    const service = createIntelligenceService();
    expect(service.resilience).toBeTruthy();
    expect(service.resilience.service.build({ requestId: "rsl-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the platform module before ecosystem", async () => {
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
