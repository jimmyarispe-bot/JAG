/** Reputation Intelligence unit tests (Sprint 051 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createReputationIntelligence,
  REPUTATION_ANALYSIS_KINDS,
  REPUTATION_CAPABILITIES,
  REPUTATION_INTELLIGENCE_VERSION,
  REPUTATION_SCENARIOS,
} from "@/lib/platform/intelligence/reputation";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "brandStrength",
  "credibility",
  "crisisRisk",
  "longTermReputationOutlook",
  "mediaExposure",
  "narrativeMomentum",
  "publicPerception",
  "trustLevel",
].sort();

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive", "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural", "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective", "wisdom",
];

function buildResult(seed: string) {
  const { service } = createReputationIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `rep-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    stakeholderResult: { healthScore: { value: 72 }, stakeholderScore: { value: 70 }, trustLevel: 64, engagementQuality: 66 },
    customerResult: { healthScore: { value: 74 }, customerScore: { value: 72 }, brandScore: { value: 68 }, engagementScore: { value: 70 } },
    politicalResult: { healthScore: { value: 71 }, politicalScore: { value: 69 }, politicalStability: { value: 64 } },
    competitiveResult: { healthScore: { value: 68 }, competitiveScore: { value: 66 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    decisionResult: { confidence: { value: 0.72 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
  });
}

describe("Reputation Intelligence (Sprint 051)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(REPUTATION_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.brandReputationScore, result.organizationalTrustScore,
      result.publicPerceptionScore, result.customerReputationScore,
      result.employeeReputationScore, result.executiveReputationScore, result.mediaIntelligenceScore,
      result.pressCoverageScore, result.socialNarrativeScore,
      result.communityReputationScore, result.partnerReputationScore,
      result.investorDonorConfidenceScore, result.regulatoryReputationScore,
      result.crisisReputationScore, result.misinformationDetectionScore,
      result.reputationRecoveryScore, result.credibilityScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.trustScore, result.sentimentScore,
      result.mediaScore, result.crisisScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.trustDashboard.headline).toBeTruthy();
    expect(result.brandReputationDashboard.headline).toBeTruthy();
    expect(result.mediaIntelligenceDashboard.headline).toBeTruthy();
    expect(result.narrativeAnalysisDashboard.headline).toBeTruthy();
    expect(result.crisisMonitoringDashboard.headline).toBeTruthy();
    expect(result.reputationRecoveryDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.trustSuite.records.length).toBeGreaterThan(0);
    expect(result.sentimentSuite.records.length).toBeGreaterThan(0);
    expect(result.narrativeAnalysisSuite.records.length).toBeGreaterThan(0);
    expect(result.mediaIntelligenceSuite.records.length).toBeGreaterThan(0);
    expect(result.crisisDetectionSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all reputation scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...REPUTATION_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...REPUTATION_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Reputation Lens", () => {
    const result = buildResult("recommendations");
    expect(REPUTATION_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("rep-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("rep-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "stakeholder", "customer", "competitive", "political", "opportunity", "executive-decision", "predictive",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createReputationIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "rep-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["brand_reputation", "organizational_trust", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("rep-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().reputation", () => {
    const service = createIntelligenceService();
    expect(service.reputation).toBeTruthy();
    expect(service.reputation.service.build({ requestId: "rep-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the terminal platform module before behavioral", async () => {
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
