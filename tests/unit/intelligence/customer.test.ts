/** Customer Intelligence unit tests (Sprint 039). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createCustomerIntelligence,
  JOURNEY_STAGES,
  ENGAGEMENT_DIMENSIONS,
  SATISFACTION_SIGNALS,
  RETENTION_RISK_FACTORS,
  COMMUNITY_BELONGING_PILLARS,
} from "@/lib/platform/intelligence/customer";
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
          id: "cust-risk",
          title: "Engagement drop",
          severity: "high" as const,
          probability: 0.6,
          impact: 0.7,
        },
      ],
      opportunities: [
        {
          id: "belonging",
          title: "Strengthen family belonging",
          estimatedValue: 180_000,
          confidence: 0.7,
        },
      ],
    },
  };
}

const LENS_KEYS = [
  "familyExperience",
  "studentEngagement",
  "journeyContinuity",
  "satisfactionSentiment",
  "retentionRisk",
  "communityBelonging",
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

describe("Customer Intelligence (Sprint 039)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds the complete customer result", () => {
    const { service } = createCustomerIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "cust-test-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
      revenueResult: {
        healthScore: { value: 74 },
        retentionScore: { value: 78 },
        baseline: { retentionRate: 0.86 },
      },
      operationsResult: {
        healthScore: { value: 72 },
        workflowScore: { value: 70 },
        baseline: {
          operationsScore: 75,
          slaRisk: 0.3,
          backlogPressure: 0.35,
          studentAttendance: 0.91,
        },
      },
    });

    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.engagementScore.value).toBeGreaterThan(0);
    expect(result.journeyScore.value).toBeGreaterThan(0);
    expect(result.satisfactionScore.value).toBeGreaterThan(0);
    expect(result.retentionScore.value).toBeGreaterThan(0);
    expect(result.communityScore.value).toBeGreaterThan(0);
    expect(result.riskScore.value).toBeGreaterThanOrEqual(0);
    expect(result.journeyMap.stages.map((s) => s.stage).sort()).toEqual(
      [...JOURNEY_STAGES].sort()
    );
    expect(
      result.engagement.dimensions.map((d) => d.dimension).sort()
    ).toEqual([...ENGAGEMENT_DIMENSIONS].sort());
    expect(result.satisfaction.signals.map((s) => s.signal).sort()).toEqual(
      [...SATISFACTION_SIGNALS].sort()
    );
    expect(
      result.retentionWatchlist.factors.map((f) => f.factor).sort()
    ).toEqual([...RETENTION_RISK_FACTORS].sort());
    expect(result.communityHealth.pillars.map((p) => p.pillar).sort()).toEqual(
      [...COMMUNITY_BELONGING_PILLARS].sort()
    );
    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.projection.headline.length).toBeGreaterThan(0);
    expect(result.historyRecord.status).toBe("generated");
    for (const rec of result.recommendations) {
      expect(Object.keys(rec.lenses).sort()).toEqual(LENS_KEYS);
      expect(rec.title.length).toBeGreaterThan(0);
    }
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createCustomerIntelligence({
      createId: (prefix) => `${prefix}-q`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "cust-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    const query = service.query(result, {
      question: "What is our journey health?",
      focus: "journey",
    });
    expect(query.answer.length).toBeGreaterThan(0);
    expect(query.references.length).toBeGreaterThan(0);
    expect(service.repository().get("cust-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires through createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.customer).toBeTruthy();
    const result = service.customer.service.build({
      requestId: "cust-di-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.healthScore.value).toBeGreaterThan(0);
  });

  it("runs as a platform module before knowledge and document", async () => {
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

