/** Market Intelligence unit tests (Sprint 043 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createMarketIntelligence,
  MARKET_SIGNAL_KINDS,
  MARKET_CAPABILITIES,
  MARKET_INTELLIGENCE_VERSION,
} from "@/lib/platform/intelligence/market";
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
          id: "market-risk",
          title: "Competitive pressure rising",
          severity: "high" as const,
          probability: 0.55,
          impact: 0.65,
        },
      ],
      opportunities: [
        {
          id: "market",
          title: "Capture adjacent market white space",
          estimatedValue: 320_000,
          confidence: 0.72,
        },
      ],
    },
  };
}

const LENS_KEYS = [
  "marketOpportunityExists",
  "evidenceSupports",
  "competitorsInvolved",
  "estimatedMarketSize",
  "risksExist",
  "investmentRequired",
  "expectedReturn",
  "organizationalCapabilitiesRequired",
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
  "competitive",
  "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural", "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective", "wisdom",
];

function buildResult(seed: string) {
  const { service } = createMarketIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T15:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `mkt-${seed}`,
    graphInput: graphInput(),
    scope: { organizationId: "org-1", schoolId: "school-1" },
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
    legalComplianceRiskResult: {
      healthScore: { value: 74 },
      riskScore: { value: 72 },
      complianceHealthScore: { value: 76 },
      baseline: {
        riskPressure: 0.28,
        complianceCoverage: 74,
        regulatoryCoverage: 71,
      },
    },
    revenueResult: {
      healthScore: { value: 73 },
      baseline: {
        revenueDiversification: 68,
        pricingPower: 70,
        pipelineCoverage: 66,
      },
    },
    fundingResult: {
      healthScore: { value: 69 },
      baseline: { grantReadiness: 65, pipelineCoverage: 67, fundingCapacity: 70 },
    },
    customerResult: {
      healthScore: { value: 74 },
      baseline: {
        familyExperienceScore: 72,
        demandMomentum: 71,
        complaintBurden: 0.28,
        communicationCoverage: 73,
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
    operationsResult: {
      healthScore: { value: 72 },
      workflowScore: { value: 70 },
      baseline: { operationsScore: 75, processCoverage: 72, capacityScore: 70 },
    },
    opportunityResult: {
      healthScore: { value: 70 },
      baseline: { opportunityDensity: 68, captureReadiness: 66 },
    },
  });
}

describe("Market Intelligence (Sprint 043)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds a complete market result", () => {
    const result = buildResult("complete");

    expect(result.version).toBe(MARKET_INTELLIGENCE_VERSION);
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.competitivePositionScore.value).toBeGreaterThan(0);
    expect(result.expansionOpportunityScore.value).toBeGreaterThan(0);
    expect(result.marketRiskScore.value).toBeGreaterThan(0);
    expect(result.industryScore.value).toBeGreaterThan(0);
    expect(result.marketSizeScore.value).toBeGreaterThan(0);
    expect(result.pricingScore.value).toBeGreaterThan(0);
    expect(result.demandScore.value).toBeGreaterThan(0);
    expect(result.demographicScore.value).toBeGreaterThan(0);
    expect(result.geographicScore.value).toBeGreaterThan(0);
    expect(result.economicScore.value).toBeGreaterThan(0);
    expect(result.technologyScore.value).toBeGreaterThan(0);
    expect(result.partnershipScore.value).toBeGreaterThan(0);
    expect(result.maScore.value).toBeGreaterThan(0);
    expect(result.whiteSpaceScore.value).toBeGreaterThan(0);
    expect(result.knowledgeScore.value).toBeGreaterThan(0);

    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.competitiveDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.expansionDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.trendDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.projection.headline.length).toBeGreaterThan(0);
    expect(result.reasoning.answer.length).toBeGreaterThan(0);
  });

  it("emits recommendations with the full 8-field market lens", () => {
    const result = buildResult("rec");

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(MARKET_CAPABILITIES).toContain("recommendation_generation");
    for (const rec of result.recommendations) {
      expect(Object.keys(rec.lenses).sort()).toEqual(LENS_KEYS);
      expect(rec.title.length).toBeGreaterThan(0);
      expect(Array.isArray(rec.evidenceRefs)).toBe(true);
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(rec.riskScore).toBeGreaterThanOrEqual(0);
      expect(rec.marketSizeEstimate).toBeGreaterThanOrEqual(0);
      expect(rec.investmentEstimate).toBeGreaterThanOrEqual(0);
      expect(rec.expectedReturnEstimate).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(rec.competitors)).toBe(true);
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

  it("covers all market signal kinds", () => {
    const result = buildResult("signals");

    const kinds = result.signals.signals.map((signal) => signal.kind).sort();
    expect(kinds).toEqual([...MARKET_SIGNAL_KINDS].sort());
    expect(Object.keys(result.signals.byKind).sort()).toEqual(
      [...MARKET_SIGNAL_KINDS].sort()
    );
    expect((MARKET_SIGNAL_KINDS as readonly string[])).toContain(
      result.signals.hottestKind
    );
  });

  it("includes TAM / SAM / SOM market size estimates", () => {
    const result = buildResult("size");

    expect(result.marketSize.estimates.tam).toBeGreaterThan(0);
    expect(result.marketSize.estimates.sam).toBeGreaterThan(0);
    expect(result.marketSize.estimates.som).toBeGreaterThan(0);
    expect(result.marketSize.estimates.sam).toBeLessThanOrEqual(
      result.marketSize.estimates.tam
    );
    expect(result.marketSize.estimates.som).toBeLessThanOrEqual(
      result.marketSize.estimates.sam
    );
  });

  it("contributes knowledge drafts", () => {
    const result = buildResult("knowledge");

    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.contributionScore).toBeGreaterThan(0);
    expect(result.knowledgeContribution.validatedCount).toBeGreaterThanOrEqual(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createMarketIntelligence({
      createId: (prefix) => `${prefix}-q`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "mkt-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    for (const focus of [
      "industry",
      "competitive",
      "market_size",
      "pricing",
      "demand",
      "demographic",
      "geographic",
      "economic",
      "technology",
      "partnership",
      "ma",
      "white_space",
      "signals",
      "recommendations",
      "reasoning",
    ] as const) {
      const answer = service.query(result, {
        question: `What about ${focus}?`,
        focus,
      });
      expect(answer.answer.length).toBeGreaterThan(0);
    }

    expect(service.repository().get("mkt-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires through createIntelligenceService().market", () => {
    const service = createIntelligenceService();
    expect(service.market).toBeTruthy();
    const result = service.market.service.build({
      requestId: "mkt-di-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
  });

  it("runs before innovation in the platform pipeline", async () => {
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
    expect(result.moduleOrder.at(-3)).toBe("institutional-memory");
    expect(result.moduleOrder.at(-2)).toBe("collective");
    expect(result.moduleOrder.at(-1)).toBe("wisdom");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});

