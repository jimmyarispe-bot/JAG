/** Ethical Intelligence unit tests (Sprint 054 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createEthicalIntelligence,
  ETHICAL_ANALYSIS_KINDS,
  ETHICAL_CAPABILITIES,
  ETHICAL_INTELLIGENCE_VERSION,
  ETHICAL_SCENARIOS,
} from "@/lib/platform/intelligence/ethical";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "accountability",
  "biasRisk",
  "fairness",
  "governanceIntegrity",
  "humanImpact",
  "longTermEthicalOutlook",
  "transparency",
  "valuesAlignment",
].sort();

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive", "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural", "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective", "wisdom",
];

function buildResult(seed: string) {
  const { service } = createEthicalIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `eth-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    culturalResult: { healthScore: { value: 71 }, valuesAlignmentScore: { value: 68 } },
    behavioralResult: { healthScore: { value: 70 }, decisionBehaviorScore: { value: 67 }, motivationScore: { value: 66 }, collaborationScore: { value: 65 } },
    legalComplianceRiskResult: { healthScore: { value: 72 }, legalRiskScore: { value: 68 }, complianceScore: { value: 70 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    decisionResult: { confidence: { value: 0.72 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    reputationResult: { healthScore: { value: 71 }, reputationScore: { value: 69 }, trustScore: { value: 68 } },
  });
}

describe("Ethical Intelligence (Sprint 054)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(ETHICAL_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.ethicalDecisionAnalysisScore, result.valuesAlignmentScore,
      result.fairnessScore, result.transparencyScore, result.accountabilityScore,
      result.humanImpactScore, result.aiEthicsScore, result.responsibleAutomationScore,
      result.biasDiscriminationScore, result.governanceEthicsScore,
      result.privacyDataEthicsScore, result.sustainabilityEthicsScore,
      result.socialResponsibilityScore, result.ethicalRiskScore,
      result.ethicalOpportunityScore, result.ethicalStewardshipScore,
      result.recommendationValidationScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.valuesAlignmentDashboard.headline).toBeTruthy();
    expect(result.fairnessDashboard.headline).toBeTruthy();
    expect(result.aiEthicsDashboard.headline).toBeTruthy();
    expect(result.humanImpactDashboard.headline).toBeTruthy();
    expect(result.governanceDashboard.headline).toBeTruthy();
    expect(result.ethicalRiskDashboard.headline).toBeTruthy();
    expect(result.outlookDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.valuesAlignmentSuite.records.length).toBeGreaterThan(0);
    expect(result.fairnessSuite.records.length).toBeGreaterThan(0);
    expect(result.humanImpactSuite.records.length).toBeGreaterThan(0);
    expect(result.aiEthicsSuite.records.length).toBeGreaterThan(0);
    expect(result.governanceEthicsSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all ethical scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...ETHICAL_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...ETHICAL_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Ethical Lens", () => {
    const result = buildResult("recommendations");
    expect(ETHICAL_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("eth-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("eth-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "cultural", "behavioral", "legal-compliance-risk", "opportunity", "executive-decision", "predictive", "reputation",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createEthicalIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "eth-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["ethical_decision_analysis", "values_alignment", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("eth-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().ethical", () => {
    const service = createIntelligenceService();
    expect(service.ethical).toBeTruthy();
    expect(service.ethical.service.build({ requestId: "eth-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the platform module before systems", async () => {
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
