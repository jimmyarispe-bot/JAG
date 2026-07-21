/** Behavioral Intelligence unit tests (Sprint 052 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createBehavioralIntelligence,
  BEHAVIORAL_ANALYSIS_KINDS,
  BEHAVIORAL_CAPABILITIES,
  BEHAVIORAL_INTELLIGENCE_VERSION,
  BEHAVIORAL_SCENARIOS,
} from "@/lib/platform/intelligence/behavioral";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "adoptionProbability",
  "changeResistance",
  "cognitiveBiasRisk",
  "collaborationImpact",
  "decisionConfidence",
  "leadershipReadiness",
  "longTermBehavioralOutlook",
  "motivationAlignment",
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
  const { service } = createBehavioralIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `beh-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    stakeholderResult: { healthScore: { value: 72 }, stakeholderScore: { value: 70 }, trustLevel: 64, engagementQuality: 66 },
    reputationResult: { healthScore: { value: 71 }, reputationScore: { value: 69 }, trustLevel: 64, brandStrength: 66, crisisRisk: 38 },
    humanCapitalResult: { healthScore: { value: 73 }, humanCapitalScore: { value: 71 }, engagementScore: { value: 68 }, leadershipScore: { value: 70 } },
    customerResult: { healthScore: { value: 74 }, customerScore: { value: 72 }, engagementScore: { value: 70 }, behaviorScore: { value: 68 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    decisionResult: { confidence: { value: 0.72 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    knowledgeResult: { healthScore: { value: 70 }, knowledgeScore: { value: 68 }, coverageScore: { value: 66 } },
  });
}

describe("Behavioral Intelligence (Sprint 052)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(BEHAVIORAL_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.decisionBehaviorScore, result.cognitiveBiasScore,
      result.motivationScore, result.incentiveModelingScore,
      result.organizationalChangeScore, result.changeResistanceScore, result.leadershipBehaviorScore,
      result.teamDynamicsScore, result.collaborationScore,
      result.communicationPatternsScore, result.conflictBehaviorScore,
      result.customerBehaviorScore, result.employeeBehaviorScore,
      result.learningAdaptationScore, result.adoptionForecastingScore,
      result.behavioralRiskScore, result.behavioralOpportunityScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.decisionModelingScore, result.changeAdoptionScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.decisionIntelligenceDashboard.headline).toBeTruthy();
    expect(result.organizationalChangeDashboard.headline).toBeTruthy();
    expect(result.leadershipDashboard.headline).toBeTruthy();
    expect(result.teamDynamicsDashboard.headline).toBeTruthy();
    expect(result.collaborationDashboard.headline).toBeTruthy();
    expect(result.adoptionForecastDashboard.headline).toBeTruthy();
    expect(result.outlookDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.decisionModelingSuite.records.length).toBeGreaterThan(0);
    expect(result.cognitiveBiasSuite.records.length).toBeGreaterThan(0);
    expect(result.motivationSuite.records.length).toBeGreaterThan(0);
    expect(result.collaborationSuite.records.length).toBeGreaterThan(0);
    expect(result.changeAdoptionSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all behavioral scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...BEHAVIORAL_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...BEHAVIORAL_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Behavioral Lens", () => {
    const result = buildResult("recommendations");
    expect(BEHAVIORAL_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("beh-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("beh-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "stakeholder", "reputation", "human-capital", "customer", "opportunity", "executive-decision", "predictive",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createBehavioralIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "beh-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["decision_behavior", "motivation", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("beh-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().behavioral", () => {
    const service = createIntelligenceService();
    expect(service.behavioral).toBeTruthy();
    expect(service.behavioral.service.build({ requestId: "beh-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the platform module before cultural", async () => {
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
