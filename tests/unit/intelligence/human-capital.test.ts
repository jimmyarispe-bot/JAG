/**
 * Human Capital Intelligence — unit tests (Sprint 032).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createHumanCapitalIntelligence,
} from "@/lib/platform/intelligence/human-capital";
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

describe("Human Capital Intelligence (Sprint 032)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds full workforce intelligence result", () => {
    const { service } = createHumanCapitalIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });

    const result = service.build({
      requestId: "hc-test-1",
      question: "How healthy is our workforce?",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
      workforceHealth: { score: 70, status: "healthy" },
    });

    expect(result.workforceHealthScore.value).toBeGreaterThan(0);
    expect(result.leadershipHealthScore.value).toBeGreaterThan(0);
    expect(result.employeeEngagementScore.value).toBeGreaterThan(0);
    expect(result.talentRiskScore.value).toBeGreaterThanOrEqual(0);
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.employees.length).toBeGreaterThan(0);
    expect(result.hiringDashboard.openRoles).toBeGreaterThan(0);
    expect(result.succession.slots.length).toBeGreaterThan(0);
    expect(result.burnout.length).toBeGreaterThan(0);
    expect(result.coaching.length).toBeGreaterThan(0);
    expect(result.careerPlans.length).toBeGreaterThan(0);
    expect(result.forecast.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.burnoutDashboard.status).toBeTruthy();
    expect(result.capabilityIndex.overallScore).toBeGreaterThan(0);
    expect(result.historyRecord.status).toBe("generated");
    expect(result.confidence.value).toBeGreaterThan(0);
    expect(result.projection.metrics.headcount).toBeGreaterThan(0);
  });

  it("supports queries and repository persistence", () => {
    const { service } = createHumanCapitalIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });

    const result = service.build({
      requestId: "hc-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    const answer = service.query(result, {
      question: "Where is retention risk highest?",
      focus: "retention",
    });
    expect(answer.answer.length).toBeGreaterThan(0);
    expect(answer.references.length).toBeGreaterThan(0);

    expect(service.repository().get("hc-query-1")).toBeTruthy();
    expect(service.repository().list().length).toBeGreaterThanOrEqual(1);
    expect(service.repository().listHistory().length).toBeGreaterThanOrEqual(1);
  });

  it("wires humanCapital onto createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.humanCapital).toBeTruthy();
    expect(service.humanCapital.service).toBeTruthy();

    const result = service.humanCapital.service.build({
      requestId: "wired-hc-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.workforceHealthScore.value).toBeGreaterThan(0);
    expect(result.brief.id.length).toBeGreaterThan(0);
  });

  it("runs as the terminal platform module after board-governance", async () => {
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
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
