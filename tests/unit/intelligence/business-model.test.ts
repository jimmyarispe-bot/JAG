/** Business Model Intelligence unit tests (Sprint 037). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createBusinessModelIntelligence,
  BMC_BLOCKS,
  LEAN_CANVAS_BLOCKS,
  BUSINESS_MODEL_SCENARIO_KINDS,
  SIMULATION_FORECAST_DIMENSIONS,
  ORGANIZATION_DESIGN_KINDS,
} from "@/lib/platform/intelligence/business-model";
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
          id: "cash-risk",
          title: "Cash pressure",
          severity: "high" as const,
          probability: 0.7,
          impact: 0.8,
        },
      ],
      opportunities: [
        {
          id: "grant",
          title: "Expand grant pipeline",
          estimatedValue: 750_000,
          confidence: 0.75,
        },
      ],
    },
  };
}

const LENS_KEYS = [
  "valueCreated",
  "valueDelivered",
  "valueCaptured",
  "canImprove",
  "canScale",
  "canSustain",
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

describe("Business Model Intelligence (Sprint 037)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds the complete business model result", () => {
    const { service } = createBusinessModelIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "bm-test-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
      financialSignal: {
        revenue: 5_400_000,
        expenses: 6_000_000,
        marginPct: -11,
        cash: 1_200_000,
      },
    });

    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.clarityScore.value).toBeGreaterThan(0);
    expect(result.scalabilityScore.value).toBeGreaterThan(0);
    expect(result.sustainabilityScore.value).toBeGreaterThan(0);
    expect(result.riskScore.value).toBeGreaterThanOrEqual(0);
    expect(result.canvas.blocks.map((b) => b.block).sort()).toEqual(
      [...BMC_BLOCKS].sort()
    );
    expect(result.leanCanvas.blocks.map((b) => b.block).sort()).toEqual(
      [...LEAN_CANVAS_BLOCKS].sort()
    );
    expect(result.organizationDesign.current.label.length).toBeGreaterThan(0);
    expect(result.organizationDesign.alternatives.length).toBeGreaterThan(0);
    expect(result.organizationDesign.recommended.label.length).toBeGreaterThan(0);
    expect(
      new Set(result.scenarios.scenarios.map((s) => s.kind)).size
    ).toBe(BUSINESS_MODEL_SCENARIO_KINDS.length);
    expect(result.simulations.length).toBeGreaterThan(0);
    for (const sim of result.simulations) {
      expect(sim.forecasts.map((f) => f.dimension).sort()).toEqual(
        [...SIMULATION_FORECAST_DIMENSIONS].sort()
      );
    }
    expect(result.comparison.winnerId.length).toBeGreaterThan(0);
    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.competitivePosition.score).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.evolutionRoadmap.steps.length).toBeGreaterThan(0);
    expect(result.alternatives.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.projection.metrics.annualRevenue).toBeGreaterThan(0);
    expect(result.historyRecord.status).toBe("generated");
    expect(
      ORGANIZATION_DESIGN_KINDS.includes(result.organizationDesign.current.kind)
    ).toBe(true);
    for (const rec of result.recommendations) {
      expect(Object.keys(rec.lenses).sort()).toEqual(LENS_KEYS);
      expect(rec.title.length).toBeGreaterThan(0);
    }
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createBusinessModelIntelligence({
      createId: (prefix) => `${prefix}-q`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "bm-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    const query = service.query(result, {
      question: "What is our business model health?",
      focus: "canvas",
    });
    expect(query.answer.length).toBeGreaterThan(0);
    expect(query.references.length).toBeGreaterThan(0);
    expect(service.repository().get("bm-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires through createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.businessModel).toBeTruthy();
    const result = service.businessModel.service.build({
      requestId: "bm-di-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the terminal platform module after organizational-improvement", async () => {
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
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});

