/**
 * Revenue Intelligence — unit tests (Sprint 033).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { createRevenueIntelligence } from "@/lib/platform/intelligence/revenue";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";
import { createIntelligenceService } from "@/lib/platform/intelligence";
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
      revenue: 54000,
      outstanding: 12000,
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
      healthStatus: "warning",
      priorities: [
        {
          id: "collections",
          title: "Improve collections",
          severity: "high",
          confidence: 0.85,
        },
      ],
      risks: [
        {
          id: "cash-risk",
          title: "Cash pressure",
          severity: "high",
          probability: 0.7,
          impact: 0.8,
        },
      ],
      opportunities: [
        {
          id: "pipeline",
          title: "Expand admissions outreach",
          estimatedValue: 25000,
          confidence: 0.7,
        },
      ],
    },
  };
}

describe("Revenue Intelligence (Sprint 033)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds full revenue intelligence result", () => {
    const { service } = createRevenueIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });

    const result = service.build({
      requestId: "rev-test-1",
      question: "How healthy is our revenue engine?",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
      financialSignal: {
        revenue: 54000,
        expenses: 42000,
        marginPct: 22,
      },
    });

    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.growthScore.value).toBeGreaterThan(0);
    expect(result.riskScore.value).toBeGreaterThanOrEqual(0);
    expect(result.mix.length).toBeGreaterThan(0);
    expect(result.forecast.length).toBeGreaterThan(0);
    expect(result.pricingRecommendations.length).toBeGreaterThan(0);
    expect(result.offerings.length).toBeGreaterThan(0);
    expect(result.customerLtv.length).toBeGreaterThan(0);
    expect(result.pipeline.weightedPipeline).toBeGreaterThanOrEqual(0);
    expect(result.grossMargin.grossMarginPct).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.pricingDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.marginDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.customerValueDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.revenueHealth.status).toBeTruthy();
    expect(result.historyRecord.status).toBe("generated");
    expect(result.confidence.value).toBeGreaterThan(0);
    expect(result.projection.metrics.annualRevenue).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("supports queries and repository persistence", () => {
    const { service } = createRevenueIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });

    const result = service.build({
      requestId: "rev-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    const answer = service.query(result, {
      question: "Where should we improve pricing?",
      focus: "pricing",
    });
    expect(answer.answer.length).toBeGreaterThan(0);
    expect(answer.references.length).toBeGreaterThan(0);

    expect(service.repository().get("rev-query-1")).toBeTruthy();
    expect(service.repository().list().length).toBeGreaterThanOrEqual(1);
    expect(service.repository().listHistory().length).toBeGreaterThanOrEqual(1);
  });

  it("wires revenue onto createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.revenue).toBeTruthy();
    expect(service.revenue.service).toBeTruthy();

    const result = service.revenue.service.build({
      requestId: "wired-rev-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.brief.id.length).toBeGreaterThan(0);
  });

  it("runs as a platform module before funding", async () => {
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
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
