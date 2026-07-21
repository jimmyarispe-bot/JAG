/** Cultural Intelligence unit tests (Sprint 053 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createCulturalIntelligence,
  CULTURAL_ANALYSIS_KINDS,
  CULTURAL_CAPABILITIES,
  CULTURAL_INTELLIGENCE_VERSION,
  CULTURAL_SCENARIOS,
} from "@/lib/platform/intelligence/cultural";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "collaborationQuality",
  "culturalHealth",
  "engagement",
  "innovationReadiness",
  "longTermCulturalOutlook",
  "missionAlignment",
  "psychologicalSafety",
  "valuesAlignment",
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
  const { service } = createCulturalIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `cul-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    behavioralResult: { healthScore: { value: 71 }, decisionBehaviorScore: { value: 68 }, motivationScore: { value: 66 }, collaborationScore: { value: 67 } },
    stakeholderResult: { healthScore: { value: 72 }, stakeholderScore: { value: 70 }, trustLevel: 64, engagementQuality: 66 },
    humanCapitalResult: { healthScore: { value: 73 }, humanCapitalScore: { value: 71 }, engagementScore: { value: 68 }, leadershipScore: { value: 70 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    decisionResult: { confidence: { value: 0.72 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    knowledgeResult: { healthScore: { value: 70 }, knowledgeScore: { value: 68 }, coverageScore: { value: 66 } },
  });
}

describe("Cultural Intelligence (Sprint 053)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(CULTURAL_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.organizationalCultureScore, result.teamCultureScore,
      result.leadershipCultureScore, result.missionAlignmentScore,
      result.valuesAlignmentScore, result.employeeEngagementScore, result.collaborationCultureScore,
      result.communicationCultureScore, result.innovationCultureScore,
      result.learningCultureScore, result.psychologicalSafetyScore,
      result.inclusionBelongingScore, result.crossCulturalScore,
      result.communityCultureScore, result.culturalRiskScore,
      result.culturalOpportunityScore, result.culturalTransformationScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.cultureMappingScore, result.engagementScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.organizationalCultureDashboard.headline).toBeTruthy();
    expect(result.missionValuesDashboard.headline).toBeTruthy();
    expect(result.employeeEngagementDashboard.headline).toBeTruthy();
    expect(result.collaborationDashboard.headline).toBeTruthy();
    expect(result.innovationCultureDashboard.headline).toBeTruthy();
    expect(result.culturalTransformationDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.cultureMappingSuite.records.length).toBeGreaterThan(0);
    expect(result.engagementSuite.records.length).toBeGreaterThan(0);
    expect(result.missionAlignmentSuite.records.length).toBeGreaterThan(0);
    expect(result.valuesAlignmentSuite.records.length).toBeGreaterThan(0);
    expect(result.collaborationSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all cultural scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...CULTURAL_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...CULTURAL_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Cultural Lens", () => {
    const result = buildResult("recommendations");
    expect(CULTURAL_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("cul-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("cul-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "behavioral", "stakeholder", "human-capital", "opportunity", "knowledge", "executive-decision", "predictive",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createCulturalIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "cul-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["organizational_culture", "mission_alignment", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("cul-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().cultural", () => {
    const service = createIntelligenceService();
    expect(service.cultural).toBeTruthy();
    expect(service.cultural.service.build({ requestId: "cul-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the terminal platform module before ethical", async () => {
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
