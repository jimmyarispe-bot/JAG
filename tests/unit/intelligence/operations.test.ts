/** Operations Intelligence unit tests (Sprint 038). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createOperationsIntelligence,
  WORKFLOW_HEALTH_DIMENSIONS,
  PROCESS_MONITORING_AREAS,
  AUTOMATION_OPPORTUNITY_KINDS,
  CAPACITY_PLANNING_HORIZONS,
} from "@/lib/platform/intelligence/operations";
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
          id: "ops-risk",
          title: "Process backlog",
          severity: "high" as const,
          probability: 0.6,
          impact: 0.7,
        },
      ],
      opportunities: [
        {
          id: "automation",
          title: "Automate intake triage",
          estimatedValue: 180_000,
          confidence: 0.7,
        },
      ],
    },
  };
}

const LENS_KEYS = [
  "workflowHealth",
  "processBottlenecks",
  "staffingAdequacy",
  "automationPotential",
  "capacityOutlook",
  "resourceUtilization",
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

describe("Operations Intelligence (Sprint 038)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds the complete operations result", () => {
    const { service } = createOperationsIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "ops-test-1",
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
    expect(result.workflowScore.value).toBeGreaterThan(0);
    expect(result.staffingScore.value).toBeGreaterThan(0);
    expect(result.capacityScore.value).toBeGreaterThan(0);
    expect(result.automationScore.value).toBeGreaterThan(0);
    expect(result.riskScore.value).toBeGreaterThanOrEqual(0);
    expect(
      result.workflowHealth.dimensions.map((d) => d.dimension).sort()
    ).toEqual([...WORKFLOW_HEALTH_DIMENSIONS].sort());
    expect(
      result.processMonitoring.areas.map((a) => a.area).sort()
    ).toEqual([...PROCESS_MONITORING_AREAS].sort());
    expect(
      new Set(result.automationOpportunities.opportunities.map((o) => o.kind))
        .size
    ).toBe(AUTOMATION_OPPORTUNITY_KINDS.length);
    expect(
      result.capacityPlan.horizons.map((h) => h.horizon).sort()
    ).toEqual([...CAPACITY_PLANNING_HORIZONS].sort());
    expect(result.staffingAnalytics.staffCount).toBeGreaterThan(0);
    expect(result.resourceUtilization.overallUtilization).toBeGreaterThan(0);
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
    const { service } = createOperationsIntelligence({
      createId: (prefix) => `${prefix}-q`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "ops-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    const query = service.query(result, {
      question: "What is our workflow health?",
      focus: "workflow",
    });
    expect(query.answer.length).toBeGreaterThan(0);
    expect(query.references.length).toBeGreaterThan(0);
    expect(service.repository().get("ops-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires through createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.operations).toBeTruthy();
    const result = service.operations.service.build({
      requestId: "ops-di-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.healthScore.value).toBeGreaterThan(0);
  });

  it("runs as the terminal platform module after business-model", async () => {
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

