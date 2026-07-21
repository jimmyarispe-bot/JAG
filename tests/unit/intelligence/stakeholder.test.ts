/** Stakeholder Intelligence unit tests (Sprint 050 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createStakeholderIntelligence,
  STAKEHOLDER_ANALYSIS_KINDS,
  STAKEHOLDER_CAPABILITIES,
  STAKEHOLDER_INTELLIGENCE_VERSION,
  STAKEHOLDER_SCENARIOS,
} from "@/lib/platform/intelligence/stakeholder";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "collaborationOpportunity",
  "engagement",
  "influence",
  "interest",
  "relationshipStrength",
  "satisfaction",
  "strategicImportance",
  "trust",
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
  const { service } = createStakeholderIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `stk-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    customerResult: { healthScore: { value: 74 }, customerScore: { value: 72 } },
    humanCapitalResult: { healthScore: { value: 71 }, humanCapitalScore: { value: 69 } },
    politicalResult: { healthScore: { value: 71 }, politicalScore: { value: 69 }, politicalStability: { value: 64 } },
    competitiveResult: { healthScore: { value: 68 }, competitiveScore: { value: 66 } },
    environmentalResult: { healthScore: { value: 70 }, environmentalScore: { value: 68 }, sustainabilityScore: { value: 72 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    decisionResult: { confidence: { value: 0.72 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
  });
}

describe("Stakeholder Intelligence (Sprint 050)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(STAKEHOLDER_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.stakeholderIdentificationScore, result.stakeholderMappingScore,
      result.influenceAnalysisScore, result.interestAnalysisScore,
      result.engagementScore, result.communicationScore, result.trustRelationshipScore,
      result.boardStakeholdersScore, result.investorDonorScore,
      result.customerStakeholdersScore, result.employeeStakeholdersScore,
      result.partnerStakeholdersScore, result.communityStakeholdersScore,
      result.governmentStakeholdersScore, result.satisfactionSentimentScore,
      result.conflictDetectionScore, result.collaborationOpportunitiesScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.influenceScore, result.relationshipScore,
      result.sentimentScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.influenceMapDashboard.headline).toBeTruthy();
    expect(result.relationshipsDashboard.headline).toBeTruthy();
    expect(result.engagementDashboard.headline).toBeTruthy();
    expect(result.sentimentDashboard.headline).toBeTruthy();
    expect(result.trustDashboard.headline).toBeTruthy();
    expect(result.collaborationOpportunitiesDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.stakeholderMappingSuite.records.length).toBeGreaterThan(0);
    expect(result.influenceSuite.records.length).toBeGreaterThan(0);
    expect(result.relationshipSuite.records.length).toBeGreaterThan(0);
    expect(result.sentimentSuite.records.length).toBeGreaterThan(0);
    expect(result.engagementSuite.records.length).toBeGreaterThan(0);
    expect(result.conflictDetectionSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all stakeholder scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...STAKEHOLDER_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...STAKEHOLDER_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Stakeholder Lens", () => {
    const result = buildResult("recommendations");
    expect(STAKEHOLDER_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("stk-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("stk-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "customer", "human-capital", "political", "competitive", "opportunity", "executive-decision", "predictive",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createStakeholderIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "stk-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["engagement", "trust_relationship", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("stk-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().stakeholder", () => {
    const service = createIntelligenceService();
    expect(service.stakeholder).toBeTruthy();
    expect(service.stakeholder.service.build({ requestId: "stk-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the platform module before reputation", async () => {
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
