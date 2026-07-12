/** Impact Intelligence unit tests (Sprint 045 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createImpactIntelligence,
  IMPACT_CAPABILITIES,
  IMPACT_INTELLIGENCE_VERSION,
  INDICATOR_TYPES,
  MEASUREMENT_KINDS,
} from "@/lib/platform/intelligence/impact";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const LENS_KEYS = [
  "outcomeAchieved",
  "evidenceSupports",
  "baselineUsed",
  "whatChanged",
  "confidenceLevel",
  "causeAttribution",
  "goalsImproved",
  "nextImprovement",
].sort();

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic",
];

function buildResult(seed: string) {
  const { service } = createImpactIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T20:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `imp-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    innovationResult: { healthScore: { value: 74 }, innovationScore: { value: 72 } },
    knowledgeResult: {
      healthScore: { value: 76 },
      coverageScore: { value: 73 },
      contributionScore: { value: 71 },
    },
    documentResult: { healthScore: { value: 75 }, complianceScore: { value: 79 } },
    humanCapitalResult: { healthScore: { value: 70 }, workforceScore: { value: 68 } },
    customerResult: { healthScore: { value: 73 }, satisfactionScore: { value: 75 } },
    revenueResult: { healthScore: { value: 72 }, revenueScore: { value: 71 } },
    fundingResult: { healthScore: { value: 69 }, fundingScore: { value: 67 } },
    operationsResult: { healthScore: { value: 74 }, operationsScore: { value: 73 } },
  });
}

describe("Impact Intelligence (Sprint 045)", () => {
  beforeEach(() => resetPlatformIdSeqForTests());

  it("builds a complete result with all scores and outputs", () => {
    const result = buildResult("complete");
    expect(result.version).toBe(IMPACT_INTELLIGENCE_VERSION);
    for (const score of [
      result.healthScore, result.missionScore, result.customerScore, result.employeeScore,
      result.studentScore, result.communityScore, result.financialScore, result.grantScore,
      result.programEffectivenessScore, result.strategicGoalAchievementScore,
      result.operationalScore, result.innovationScore, result.longTermOrganizationalScore,
      result.measurementScore, result.outcomeScore, result.roiScore, result.knowledgeScore,
    ]) expect(score.value).toBeGreaterThan(0);
    expect(Object.keys(result.areaSuites)).toHaveLength(12);
    expect(result.dashboard.headline).toBeTruthy();
    expect(result.missionDashboard.headline).toBeTruthy();
    expect(result.outcomeDashboard.headline).toBeTruthy();
    expect(result.programEffectivenessDashboard.headline).toBeTruthy();
    expect(result.roiDashboard.headline).toBeTruthy();
    expect(result.sroiDashboard.headline).toBeTruthy();
    expect(result.brief.headline).toBeTruthy();
    expect(result.boardReport.headline).toBeTruthy();
    expect(result.projection.headline).toBeTruthy();
    expect(result.reasoning.answer).toBeTruthy();
  });

  it("covers every measurement kind and both indicator types", () => {
    const result = buildResult("measurement");
    expect([...result.measurementSuite.kindsCovered].sort()).toEqual([...MEASUREMENT_KINDS].sort());
    const indicators = [...new Set(result.measurementSuite.measurements.map(item => item.indicatorType))];
    expect(indicators.sort()).toEqual([...INDICATOR_TYPES].sort());
  });

  it("emits recommendations with the full eight-field Impact Lens", () => {
    const result = buildResult("recommendations");
    expect(IMPACT_CAPABILITIES).toContain("recommendation_generation");
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const recommendation of result.recommendations) {
      expect(Object.keys(recommendation.lenses).sort()).toEqual(LENS_KEYS);
      expect(recommendation.id.startsWith("imp-rec")).toBe(true);
      expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    }
  });

  it("contributes knowledge drafts and a closed learning loop", () => {
    const result = buildResult("learning");
    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.artifacts.every(item => item.id.startsWith("imp-knowledge"))).toBe(true);
    expect(result.closedLearningLoop.destinations).toEqual([
      "knowledge", "organizational-improvement", "executive-decision", "innovation",
    ]);
    expect(result.closedLearningLoop.lessons.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createImpactIntelligence({
      createId: prefix => `${prefix}-query`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({ requestId: "imp-query", scope: { organizationId: "org-1", schoolId: null } });
    for (const focus of ["mission", "student", "measurement", "outcomes", "roi", "recommendations", "reasoning", "learning"] as const) {
      expect(service.query(result, { question: `What about ${focus}?`, focus }).answer).toBeTruthy();
    }
    expect(service.repository().get("imp-query")).toBeTruthy();
    expect(service.repository().listHistory()).toHaveLength(1);
  });

  it("wires through createIntelligenceService().impact", () => {
    const service = createIntelligenceService();
    expect(service.impact).toBeTruthy();
    expect(service.impact.service.build({ requestId: "imp-di" }).healthScore.value).toBeGreaterThan(0);
  });

  it("runs after innovation and before terminal economic", async () => {
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
    expect(result.moduleOrder.at(-3)).toBe("innovation");
    expect(result.moduleOrder.at(-2)).toBe("impact");
    expect(result.moduleOrder.at(-1)).toBe("economic");
    expect(result.results.every(item => item.ok)).toBe(true);
  });
});
