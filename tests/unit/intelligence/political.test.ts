/** Political Intelligence unit tests (Sprint 048 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createPoliticalIntelligence,
  POLITICAL_ANALYSIS_KINDS,
  POLITICAL_CAPABILITIES,
  POLITICAL_INTELLIGENCE_VERSION,
  POLITICAL_SCENARIOS,
} from "@/lib/platform/intelligence/political";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "legislativeImpact",
  "regulatoryRisk",
  "governmentFundingOpportunity",
  "taxExposure",
  "politicalStability",
  "tradeImpact",
  "compliancePressure",
  "strategicTiming",
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
  const { service } = createPoliticalIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `pol-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    marketResult: { healthScore: { value: 74 }, marketScore: { value: 72 } },
    economicResult: { healthScore: { value: 68 }, economicScore: { value: 66 } },
    competitiveResult: { healthScore: { value: 71 }, competitiveScore: { value: 69 }, competitivePressure: { value: 55 } },
    legalComplianceRiskResult: { healthScore: { value: 70 }, legalScore: { value: 68 }, complianceScore: { value: 72 }, riskScore: { value: 48 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    decisionResult: { confidence: { value: 0.72 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    fundingResult: { healthScore: { value: 71 }, fundingScore: { value: 69 }, capitalAvailability: { value: 65 } },
  });
}

describe("Political Intelligence (Sprint 048)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(POLITICAL_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.legislativeScore, result.regulatoryScore,
      result.governmentPolicyScore, result.electionsLeadershipScore,
      result.publicFundingScore, result.taxPolicyScore, result.educationPolicyScore,
      result.healthcarePolicyScore, result.laborEmploymentPolicyScore,
      result.internationalRelationsScore, result.tradeTariffsScore,
      result.immigrationPolicyScore, result.judicialDecisionsScore,
      result.governmentContractingScore, result.publicSentimentScore,
      result.lobbyingAdvocacyScore, result.geopoliticalRiskScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.politicalRiskScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.outlookDashboard.headline).toBeTruthy();
    expect(result.regulatoryDashboard.headline).toBeTruthy();
    expect(result.legislativeDashboard.headline).toBeTruthy();
    expect(result.fundingOpportunitiesDashboard.headline).toBeTruthy();
    expect(result.politicalRiskDashboard.headline).toBeTruthy();
    expect(result.tradeInternationalDashboard.headline).toBeTruthy();
    expect(result.electionImpactDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.legislativeTrackingSuite.activeCount).toBeGreaterThan(0);
    expect(result.regulatoryImpactSuite.records.length).toBeGreaterThan(0);
    expect(result.politicalRiskSuite.records.length).toBeGreaterThan(0);
    expect(result.governmentFundingSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all political scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...POLITICAL_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...POLITICAL_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Political Lens", () => {
    const result = buildResult("recommendations");
    expect(POLITICAL_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("pol-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("pol-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "market", "economic", "competitive", "opportunity", "legal-compliance-risk", "executive-decision", "predictive",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createPoliticalIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "pol-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["legislative", "regulatory", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("pol-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().political", () => {
    const service = createIntelligenceService();
    expect(service.political).toBeTruthy();
    expect(service.political.service.build({ requestId: "pol-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs before environmental and stakeholder in the platform pipeline", async () => {
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
