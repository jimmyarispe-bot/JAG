/** Ecosystem Intelligence unit tests (Sprint 057 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createEcosystemIntelligence,
  ECOSYSTEM_ANALYSIS_KINDS,
  ECOSYSTEM_CAPABILITIES,
  ECOSYSTEM_INTELLIGENCE_VERSION,
  ECOSYSTEM_SCENARIOS,
} from "@/lib/platform/intelligence/ecosystem";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "collaborationPotential",
  "dependencyRisk",
  "ecosystemHealth",
  "longTermEcosystemOutlook",
  "networkEffects",
  "networkStrength",
  "strategicPartnerships",
  "strategicPosition",
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
  const { service } = createEcosystemIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-13T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `esm-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    stakeholderResult: { healthScore: { value: 71 }, engagementScore: { value: 68 } },
    competitiveResult: { healthScore: { value: 70 }, competitiveScore: { value: 68 } },
    marketResult: { healthScore: { value: 72 }, marketScore: { value: 69 } },
    systemsResult: { healthScore: { value: 71 }, adaptability: 68, cascadingRisk: 65 },
    resilienceResult: { healthScore: { value: 70 }, adaptiveCapacity: 68 },
    predictiveResult: { healthScore: { value: 69 }, predictiveScore: { value: 67 } },
    decisionResult: { confidence: { value: 0.72 } },
    opportunityResult: { healthScore: { value: 72 }, opportunityScore: { value: 70 } },
  });
}

describe("Ecosystem Intelligence (Sprint 057)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(ECOSYSTEM_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.ecosystemMappingScore, result.strategicPartnershipsScore,
      result.supplierEcosystemsScore, result.customerEcosystemsScore,
      result.communityNetworksScore, result.industryNetworksScore,
      result.technologyEcosystemsScore, result.academicResearchPartnershipsScore,
      result.governmentEcosystemsScore, result.investorFundingNetworksScore,
      result.nonprofitNgoRelationshipsScore, result.platformEcosystemsScore,
      result.allianceIntelligenceScore, result.networkEffectsScore,
      result.ecosystemDependenciesScore, result.collaborationOpportunitiesScore,
      result.ecosystemRiskScore,
      result.forecastScore, result.scenarioScore, result.analysisScore,
      result.earlyWarningScore, result.networkMappingScore, result.partnershipScore,
      result.dependencyScore, result.collaborationScore, result.networkEffectScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(17);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.ecosystemMapDashboard.headline).toBeTruthy();
    expect(result.strategicPartnershipsDashboard.headline).toBeTruthy();
    expect(result.alliancesDashboard.headline).toBeTruthy();
    expect(result.dependenciesDashboard.headline).toBeTruthy();
    expect(result.collaborationOpportunitiesDashboard.headline).toBeTruthy();
    expect(result.ecosystemHealthDashboard.headline).toBeTruthy();
    expect(result.forecastDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
    expect(result.networkMappingSuite.records.length).toBeGreaterThan(0);
    expect(result.partnershipSuite.records.length).toBeGreaterThan(0);
    expect(result.dependencySuite.records.length).toBeGreaterThan(0);
    expect(result.collaborationSuite.records.length).toBeGreaterThan(0);
    expect(result.networkEffectSuite.records.length).toBeGreaterThan(0);
    expect(result.earlyWarningSuite.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("covers every analysis kind and all ecosystem scenarios", () => {
    const result = buildResult("analysis");
    expect([...result.analysisSuite.kindsCovered].sort()).toEqual([...ECOSYSTEM_ANALYSIS_KINDS].sort());
    expect(result.scenarioSuite.scenarios.map(s => s.kind).sort()).toEqual([...ECOSYSTEM_SCENARIOS].sort());
    expect(result.forecastSuite.forecasts.length).toBe(17);
    expect(result.trendSuite.trends.length).toBe(17);
  });

  it("emits recommendations with the full eight-field Ecosystem Lens", () => {
    const result = buildResult("recommendations");
    expect(ECOSYSTEM_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("esm-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("esm-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "stakeholder", "competitive", "market", "systems", "resilience", "opportunity", "predictive",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createEcosystemIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "esm-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["ecosystem_mapping", "strategic_partnerships", "trends", "forecasts", "scenarios", "analysis", "recommendations", "reasoning", "learning", "early_warning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("esm-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().ecosystem", () => {
    const service = createIntelligenceService();
    expect(service.ecosystem).toBeTruthy();
    expect(service.ecosystem.service.build({ requestId: "esm-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the terminal platform module after resilience", async () => {
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
