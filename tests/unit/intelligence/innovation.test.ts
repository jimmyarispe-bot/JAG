/** Innovation Intelligence unit tests (Sprint 044 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInnovationIntelligence,
  TECHNOLOGY_RADAR_RINGS,
  INNOVATION_HORIZONS,
  INNOVATION_CAPABILITIES,
  INNOVATION_INTELLIGENCE_VERSION,
} from "@/lib/platform/intelligence/innovation";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

function graphInput() {
  return {
    scope: { organizationId: "org-1", schoolId: "school-1" },
    builtAt: "2026-07-12T12:00:00.000Z",
    executive: {
      enrollment: 120,
      admissions: 18,
      revenue: 5_400_000,
      outstanding: 120_000,
      staff: 42,
      studentAttendance: 91,
      teacherAttendance: 96,
    },
    organizationHealth: {
      overallScore: 78,
      enrollmentScore: 72,
      financialScore: 81,
      workforceScore: 70,
      operationsScore: 75,
      complianceScore: 88,
      academicScore: 80,
    },
    founder: {
      healthScore: 78,
      healthStatus: "warning" as const,
      priorities: [],
      risks: [
        {
          id: "innovation-risk",
          title: "Experiment backlog stalling",
          severity: "high" as const,
          probability: 0.55,
          impact: 0.65,
        },
      ],
      opportunities: [
        {
          id: "innovation",
          title: "Scale validated AI tutoring pilot",
          estimatedValue: 320_000,
          confidence: 0.72,
        },
      ],
    },
  };
}

const LENS_KEYS = [
  "innovationOpportunityExists",
  "evidenceSupports",
  "problemSolved",
  "expectedImpact",
  "investmentRequired",
  "experimentsValidate",
  "risksExist",
  "capabilitiesRequired",
].sort();

const PIPELINE_ORDER = [
  "organization-dna",
  "oios-core",
  "organization-health",
  "financial",
  "founder",
  "executive",
  "executive-graph",
  "executive-decision",
  "predictive",
  "board-governance",
  "human-capital",
  "revenue",
  "funding",
  "opportunity",
  "organizational-improvement",
  "business-model",
  "operations",
  "customer",
  "knowledge",
  "document",
  "legal-compliance-risk",
  "market",
  "innovation",
  "impact",
  "economic",
];

function buildResult(seed: string) {
  const { service } = createInnovationIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T15:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `inn-${seed}`,
    graphInput: graphInput(),
    scope: { organizationId: "org-1", schoolId: "school-1" },
    marketResult: {
      healthScore: { value: 74 },
      competitivePositionScore: { value: 71 },
      expansionOpportunityScore: { value: 68 },
      baseline: {
        whiteSpaceScore: 66,
        opportunityDensity: 70,
        technologyDisruptionPressure: 0.32,
        signalDensity: 0.58,
      },
    },
    opportunityResult: {
      healthScore: { value: 70 },
      baseline: { opportunityDensity: 68, captureReadiness: 66 },
    },
    knowledgeResult: {
      healthScore: { value: 76 },
      coverageScore: { value: 74 },
      contributionScore: { value: 72 },
      baseline: { coverageScore: 74, validatedRatio: 0.68, gapPressure: 0.24 },
    },
    documentResult: {
      healthScore: { value: 75 },
      complianceScore: { value: 80 },
      riskScore: { value: 70 },
      baseline: {
        complianceCoverage: 78,
        riskPressure: 0.3,
        contractDensity: 12,
        documentCount: 48,
      },
    },
    businessModelResult: {
      healthScore: { value: 71 },
      baseline: {
        businessModelFit: 68,
        valuePropositionStrength: 70,
        monetizationClarity: 66,
      },
    },
    improvementResult: {
      healthScore: { value: 73 },
      baseline: {
        improvementMomentum: 70,
        continuousImprovementScore: 72,
        initiativeThroughput: 68,
      },
    },
    decisionResult: {
      healthScore: { value: 74 },
      baseline: {
        decisionTraceability: 72,
        decisionVelocity: 70,
        decisionQuality: 73,
      },
    },
    predictionResult: {
      healthScore: { value: 72 },
      baseline: { growthSignal: 70, scenarioCoverage: 68 },
    },
  });
}

describe("Innovation Intelligence (Sprint 044)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds a complete innovation result", () => {
    const result = buildResult("complete");

    expect(result.version).toBe(INNOVATION_INTELLIGENCE_VERSION);
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.pipelineScore.value).toBeGreaterThan(0);
    expect(result.experimentScore.value).toBeGreaterThan(0);
    expect(result.portfolioScore.value).toBeGreaterThan(0);
    expect(result.radarScore.value).toBeGreaterThan(0);
    expect(result.ideaScore.value).toBeGreaterThan(0);
    expect(result.rdScore.value).toBeGreaterThan(0);
    expect(result.productServiceScore.value).toBeGreaterThan(0);
    expect(result.processScore.value).toBeGreaterThan(0);
    expect(result.aiOpportunityScore.value).toBeGreaterThan(0);
    expect(result.technologyAdoptionScore.value).toBeGreaterThan(0);
    expect(result.emergingTechScore.value).toBeGreaterThan(0);
    expect(result.pocScore.value).toBeGreaterThan(0);
    expect(result.ipScore.value).toBeGreaterThan(0);
    expect(result.continuousImprovementScore.value).toBeGreaterThan(0);
    expect(result.roadmapScore.value).toBeGreaterThan(0);
    expect(result.knowledgeScore.value).toBeGreaterThan(0);

    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.innovationPipeline.headline.length).toBeGreaterThan(0);
    expect(result.ideaBacklog.headline.length).toBeGreaterThan(0);
    expect(result.experimentDashboard.headline.length).toBeGreaterThan(0);
    expect(result.innovationPortfolio.headline.length).toBeGreaterThan(0);
    expect(result.technologyRadar.headline.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.projection.headline.length).toBeGreaterThan(0);
    expect(result.reasoning.answer.length).toBeGreaterThan(0);
  });

  it("covers technology radar rings and innovation horizons", () => {
    const result = buildResult("radar");

    expect(result.technologyRadar.items.length).toBeGreaterThan(0);
    for (const item of result.technologyRadar.items) {
      expect((TECHNOLOGY_RADAR_RINGS as readonly string[]).includes(item.ring)).toBe(
        true
      );
    }
    for (const ring of TECHNOLOGY_RADAR_RINGS) {
      expect(result.technologyRadar.narrative).toContain(ring);
    }
    expect(
      result.technologyRadar.adoptCount +
        result.technologyRadar.trialCount +
        result.technologyRadar.assessCount +
        result.technologyRadar.holdCount
    ).toBe(result.technologyRadar.items.length);

    const horizons = [
      ...new Set(result.innovationPortfolioSuite.items.map((item) => item.horizon)),
    ].sort();
    expect(horizons).toEqual([...INNOVATION_HORIZONS].sort());
    expect(result.innovationPortfolio.h1Share).toBeGreaterThanOrEqual(0);
    expect(result.innovationPortfolio.h2Share).toBeGreaterThanOrEqual(0);
    expect(result.innovationPortfolio.h3Share).toBeGreaterThanOrEqual(0);
  });

  it("emits recommendations with the full 8-field innovation lens", () => {
    const result = buildResult("rec");

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(INNOVATION_CAPABILITIES).toContain("recommendation_generation");
    for (const rec of result.recommendations) {
      expect(Object.keys(rec.lenses).sort()).toEqual(LENS_KEYS);
      expect(rec.title.length).toBeGreaterThan(0);
      expect(Array.isArray(rec.evidenceRefs)).toBe(true);
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(rec.riskScore).toBeGreaterThanOrEqual(0);
      expect(rec.impactEstimate).toBeGreaterThanOrEqual(0);
      expect(rec.investmentEstimate).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(rec.experimentRefs)).toBe(true);
      expect(Array.isArray(rec.capabilitiesRequired)).toBe(true);
      expect(rec.owner.length).toBeGreaterThan(0);
      expect(rec.dueDate.length).toBeGreaterThan(0);
      expect(
        (["critical", "high", "medium", "low", "monitor"] as string[]).includes(
          rec.priority
        )
      ).toBe(true);
    }
  });

  it("contributes knowledge drafts", () => {
    const result = buildResult("knowledge");

    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.contributionScore).toBeGreaterThan(0);
    expect(result.knowledgeContribution.validatedCount).toBeGreaterThanOrEqual(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createInnovationIntelligence({
      createId: (prefix) => `${prefix}-q`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "inn-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    for (const focus of [
      "ideas",
      "rd",
      "product",
      "process",
      "ai",
      "adoption",
      "emerging",
      "portfolio",
      "experiments",
      "poc",
      "ip",
      "improvement",
      "roadmap",
      "recommendations",
      "reasoning",
    ] as const) {
      const answer = service.query(result, {
        question: `What about ${focus}?`,
        focus,
      });
      expect(answer.answer.length).toBeGreaterThan(0);
    }

    expect(service.repository().get("inn-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires through createIntelligenceService().innovation", () => {
    const service = createIntelligenceService();
    expect(service.innovation).toBeTruthy();
    const result = service.innovation.service.build({
      requestId: "inn-di-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
  });

  it("runs after market and before impact and economic", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-12T15:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-4)).toBe("market");
    expect(result.moduleOrder.at(-3)).toBe("innovation");
    expect(result.moduleOrder.at(-2)).toBe("impact");
    expect(result.moduleOrder.at(-1)).toBe("economic");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
