/** Competitive Intelligence unit tests (Sprint 047 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createCompetitiveIntelligence,
  COMPETITIVE_ANALYSIS_KINDS,
  COMPETITIVE_CAPABILITIES,
  COMPETITIVE_INTELLIGENCE_VERSION,
  COMPETITIVE_SCENARIOS,
} from "@/lib/platform/intelligence/competitive";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "competitiveThreatExists",
  "evidenceSupports",
  "competitorsInvolved",
  "ourDifferentiation",
  "enrollmentOrRevenueImpact",
  "responseOptions",
  "organizationalCapabilitiesRequired",
  "signalsToMonitor",
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
  const { service } = createCompetitiveIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `cmp-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    marketResult: { healthScore: { value: 74 }, marketScore: { value: 72 }, competitivePositionScore: { value: 70 }, competitivePressure: { value: 55 }, competitorCount: { value: 8 } },
    revenueResult: { healthScore: { value: 71 }, revenueScore: { value: 69 }, pricingPressure: { value: 58 } },
    customerResult: { healthScore: { value: 73 }, customerScore: { value: 71 }, satisfactionScore: { value: 75 } },
    humanCapitalResult: { healthScore: { value: 70 }, humanCapitalScore: { value: 68 }, workforceScore: { value: 66 } },
    businessModelResult: { healthScore: { value: 73 }, businessModelScore: { value: 71 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
    innovationResult: { healthScore: { value: 75 }, innovationScore: { value: 73 } },
    economicResult: { healthScore: { value: 68 }, economicScore: { value: 66 } },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
  });
}

describe("Competitive Intelligence (Sprint 047)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(COMPETITIVE_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.directPeerSchoolsScore, result.indirectSubstitutesScore,
      result.tuitionAidPositioningScore, result.programCurriculumDifferentiationScore,
      result.enrollmentAdmissionsDynamicsScore, result.regionalMarketShareScore,
      result.talentFacultyCompetitionScore, result.brandReputationChoiceDriversScore,
      result.partnershipAllianceLandscapeScore, result.technologyDeliveryModelsScore,
      result.expansionLaunchSignalsScore, result.consolidationNetworkStrategyScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(12);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.outlookDashboard.headline).toBeTruthy();
    expect(result.threatDashboard.headline).toBeTruthy();
    expect(result.differentiationDashboard.headline).toBeTruthy();
    expect(result.signalMonitoringDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
  });

  it("covers every analysis kind and all competitive scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...COMPETITIVE_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...COMPETITIVE_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(12);
    expect(result.trendSuite.trends.length).toBe(12);
  });

  it("emits recommendations with the full eight-field Competitive Lens", () => {
    const result = buildResult("recommendations");
    expect(COMPETITIVE_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("cmp-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("cmp-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "market", "revenue", "customer", "human-capital", "opportunity", "executive-decision", "innovation",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createCompetitiveIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "cmp-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["direct_peer_schools", "indirect_substitutes", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("cmp-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().competitive", () => {
    const service = createIntelligenceService();
    expect(service.competitive).toBeTruthy();
    expect(service.competitive.service.build({ requestId: "cmp-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as a platform module before political and environmental", async () => {
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
