/** Opportunity Intelligence unit tests (Sprint 035). */
import { beforeEach, describe, expect, it } from "vitest";
import { createOpportunityIntelligence, OPPORTUNITY_CATEGORIES } from "@/lib/platform/intelligence/opportunity";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";
import { createIntelligencePlatform, resetPlatformIdSeqForTests } from "@/lib/platform/intelligence/infrastructure";

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
  "organizationalHealth",
  "financialSustainability",
  "missionImpact",
  "longTermValue",
  "timeToValue",
].sort();

describe("Opportunity Intelligence (Sprint 035)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds the complete opportunity intelligence result", () => {
    const { service } = createOpportunityIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "opp-test-1",
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
    expect(result.opportunityScore.value).toBeGreaterThan(0);
    expect(result.riskScore.value).toBeGreaterThanOrEqual(0);
    expect(Object.keys(result.categories).sort()).toEqual([...OPPORTUNITY_CATEGORIES].sort());
    for (const category of OPPORTUNITY_CATEGORIES) {
      expect(result.categories[category].length).toBeGreaterThan(0);
    }
    expect(result.exchange.length).toBeGreaterThan(0);
    expect(result.analysis.scored.length).toBeGreaterThan(0);
    expect(result.analysis.roi.length).toBeGreaterThan(0);
    expect(result.rankings.length).toBe(7);
    expect(result.pipeline.records.length).toBeGreaterThan(0);
    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.topOpportunitiesDashboard.opportunities.length).toBeGreaterThan(0);
    expect(result.quickWinsDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.strategicInvestmentDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.missionOpportunityDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.heatMap.cells.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.projection.metrics.pipelineValue).toBeGreaterThan(0);
    expect(result.historyRecord.status).toBe("generated");
    for (const opportunity of result.topOpportunitiesDashboard.opportunities) {
      expect(Object.keys(opportunity.lenses).sort()).toEqual(LENS_KEYS);
      expect(opportunity.title.length).toBeGreaterThan(0);
      expect(opportunity.originatingDomain.length).toBeGreaterThan(0);
    }
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createOpportunityIntelligence({
      createId: (prefix) => `${prefix}-test`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "opp-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    const answer = service.query(result, {
      question: "Which quick wins should we pursue?",
      focus: "quick_wins",
    });
    expect(answer.answer.length).toBeGreaterThan(0);
    expect(answer.references.length).toBeGreaterThan(0);
    expect(service.repository().get("opp-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires opportunity onto createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.opportunity).toBeTruthy();
    expect(service.opportunity.service).toBeTruthy();
    expect(
      service.opportunity.service.build({
        requestId: "wired-opp-1",
        scope: { organizationId: "org-1", schoolId: "school-1" },
      }).brief.id.length
    ).toBeGreaterThan(0);
  });

  it("runs after funding and before organizational-improvement", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-12T16:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual([
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
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
