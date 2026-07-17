import { describe, expect, it } from "vitest";
import type { ExecutiveAlertStream } from "@/lib/platform/executive-alerts";
import type { ExecutiveDecisionQueue } from "@/lib/platform/executive-decisions";
import { mapWorkspaceToFounderDashboard } from "@/lib/platform/executive-intelligence/map-founder-dashboard";
import type { ExecutiveIntelligenceWorkspace } from "@/lib/platform/executive-intelligence/workspace";
import type { IdentityContext } from "@/lib/platform/identity/context";
import {
  assembleExecutiveAggregateMetrics,
  resolveExecutiveMetricsScope,
  type ExecutiveMetricsSourceBundle,
} from "@/lib/platform/executive-metrics";

function emptySources(
  overrides: Partial<ExecutiveMetricsSourceBundle> = {}
): ExecutiveMetricsSourceBundle {
  return {
    loadedAt: "2026-07-09T12:00:00.000Z",
    scope: resolveExecutiveMetricsScope({ schoolId: "school-1", organizationId: "org-1" }),
    schoolId: "school-1",
    extendedFiltersPartial: false,
    dashboard: {
      enrollment: 120,
      activeStudents: 110,
      admissionsPipeline: 40,
      scholarshipsAwarded: 5,
      employees: 22,
      revenue: 50000,
    },
    commandCenter: null,
    admissions: null,
    finance: {
      outstanding: 8500,
      totalCollected: 50000,
      totalBilled: 60000,
      collectionRate: 83,
      invoiceCount: 10,
      tuitionYield: 90,
    } as ExecutiveMetricsSourceBundle["finance"],
    workforce: {
      staffingLevels: 22,
      vacancies: 2,
      turnoverRate: 8,
      expiringCertifications: 1,
      payrollCostsYtd: 200000,
    } as ExecutiveMetricsSourceBundle["workforce"],
    missionControl: null,
    compliance: null,
    scheduling: null,
    operationalLoop: null,
    activityRecentCount: null,
    financialIntelligence: {
      operatingMargin: 12,
      revenueTrend: 83,
      financialRisks: 2,
      ebitda: 40000,
      cashPosition: 120000,
      forecastRevenue: 500000,
    } as ExecutiveMetricsSourceBundle["financialIntelligence"],
    founderOps: {
      monthlyRevenue: 12500,
      teacherAttendance: { rate: 80, submitted: 4, total: 5 },
      studentAttendance: { rate: 94, present: 94, total: 100 },
      upcomingClasses: [
        {
          id: "s1",
          courseName: "Math",
          sectionCode: "A",
          scheduledStart: "2026-07-09T15:00:00.000Z",
          deliveryMode: "in_person",
        },
      ],
    },
    ...overrides,
  };
}

function mockIdentity(): IdentityContext {
  return {
    effectiveUserId: "user-1",
    permissions: [
      "students.view",
      "admissions.view",
      "finance.view",
      "hr.view",
      "scheduling.view",
      "executive.view",
      "fi.view",
    ],
    orgAssignments: [{ school_id: "school-1", is_primary: true }],
    accessibleSchoolIds: ["school-1"],
  } as unknown as IdentityContext;
}

function mockWorkspace(
  sources: ExecutiveMetricsSourceBundle
): ExecutiveIntelligenceWorkspace {
  const aggregate = assembleExecutiveAggregateMetrics(sources);
  return {
    filters: sources.scope,
    schoolId: "school-1",
    organizationId: "org-1",
    loadedAt: sources.loadedAt,
    alertSources: {
      loadedAt: sources.loadedAt,
      scope: sources.scope,
      schoolId: "school-1",
      metricsSources: sources,
      aggregate,
      kpiSnapshots: [],
      activity: [],
      financialAlerts: [],
      missionControl: [],
      compliance: null,
      workforce: null,
      admissions: null,
      operationalLoop: null,
      insights: [],
    },
    aggregate,
    alerts: {
      scope: sources.scope,
      generatedAt: sources.loadedAt,
      alerts: [
        {
          id: "a1",
          title: "Test alert",
          description: "Body",
          severity: "High",
          category: "Financial",
          status: "Open",
          priority: 80,
          confidence: "High",
          signalKey: "finance.test",
          sources: [],
          relatedEntities: [],
          recommendedAction: "Review",
          missionControlReference: null,
          activityReferences: [],
          createdAt: sources.loadedAt,
          updatedAt: sources.loadedAt,
        },
      ],
      bySeverity: { Critical: [], High: [], Medium: [], Low: [] },
      byCategory: {},
    } as unknown as ExecutiveAlertStream,
    decisions: {
      scope: sources.scope,
      generatedAt: sources.loadedAt,
      decisions: [],
      byStatus: {},
      bySource: {},
    } as unknown as ExecutiveDecisionQueue,
    kpiPair: { current: [], prior: [], currentDate: null, priorDate: null },
    missionControlFeed: [],
    missionControlCritical: [],
    commandCenterMetrics: {} as ExecutiveIntelligenceWorkspace["commandCenterMetrics"],
    jagWork: {
      workspaceKey: "executive",
      resolvedAt: sources.loadedAt,
      activePerspective: "needs_human_decision",
      perspectiveCatalog: [],
      perspectives: {},
      allItems: [],
      counts: {},
    },
  };
}

describe("mapWorkspaceToFounderDashboard", () => {
  it("maps Key Metrics from aggregate + founderOps without inventing zeros", () => {
    const workspace = mockWorkspace(emptySources());
    const data = mapWorkspaceToFounderDashboard(workspace, mockIdentity(), {
      visibleCards: [
        "activeEnrollment",
        "admissionsPipeline",
        "monthlyRevenue",
        "tuitionOutstanding",
        "staffCount",
        "teacherAttendance",
        "studentAttendance",
        "upcomingClasses",
        "executiveAlerts",
        "financialIntelligence",
      ],
    });

    expect(data.activeEnrollment).toBe(120);
    expect(data.admissionsPipeline).toBe(40);
    expect(data.monthlyRevenue).toBe(12500);
    expect(data.tuitionOutstanding).toBe(8500);
    expect(data.staffCount).toBe(22);
    expect(data.teacherAttendance).toEqual({ rate: 80, submitted: 4, total: 5 });
    expect(data.studentAttendance).toEqual({ rate: 94, present: 94, total: 100 });
    expect(data.upcomingClasses).toHaveLength(1);
    expect(data.executiveAlerts[0]?.title).toBe("Test alert");
    expect(data.financialIntelligence?.operatingMargin).toBe(12);
    expect(data.financialIntelligence?.cashPosition).toBe(120000);
  });

  it("leaves unrequested cards null / empty", () => {
    const workspace = mockWorkspace(emptySources());
    const data = mapWorkspaceToFounderDashboard(workspace, mockIdentity(), {
      visibleCards: ["activeEnrollment"],
    });
    expect(data.activeEnrollment).toBe(120);
    expect(data.monthlyRevenue).toBeNull();
    expect(data.upcomingClasses).toEqual([]);
    expect(data.executiveAlerts).toEqual([]);
  });
});
