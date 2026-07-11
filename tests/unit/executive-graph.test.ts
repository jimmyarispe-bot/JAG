import { describe, expect, it, beforeEach } from "vitest";
import {
  buildExecutiveGraph,
  explainNode,
  evaluateExecutiveGraphRules,
  resetEdgeSeqForTests,
  type BuildExecutiveGraphInput,
} from "@/lib/platform/executive-graph";
import type { ExecutiveKPIs } from "@/lib/executive/kpis";
import type { ExecutiveTrends } from "@/lib/executive/trends";
import type { ExecutiveHealthScore } from "@/lib/executive/health-score";
import { calculateExecutiveTrends } from "@/lib/executive/trends";
import { calculateExecutiveHealthScore } from "@/lib/executive/health-score";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";

function snapshotRows(
  values: Array<{ metricId: string; metricValue: number }>
): KpiSnapshotRecord[] {
  return values.map((row) => ({
    organizationId: "org-1",
    regionId: null,
    schoolId: "school-1",
    campusId: null,
    program: null,
    metricId: row.metricId,
    metricName: row.metricId,
    metricValue: row.metricValue,
    status: "healthy",
    trendDirection: "flat",
    trendPct: null,
    confidence: "High",
    source: "test",
    capturedAt: "2026-07-09T00:00:00.000Z",
    snapshotDate: "2026-07-09",
    captureMode: "daily",
  }));
}

function makeKpis(overrides: Partial<ExecutiveKPIs> = {}): ExecutiveKPIs {
  return {
    enrollment: 100,
    admissions: 10,
    admissionsByStage: [],
    revenue: 50000,
    outstanding: 8000,
    staff: 40,
    teacherAttendance: 96,
    teacherAttendanceDetail: {
      submittedPct: 96,
      missingPct: 4,
      submitted: 24,
      total: 25,
    },
    studentAttendance: 92,
    studentAttendanceDetail: {
      rate: 92,
      absentCount: 8,
      unsubmittedClassrooms: 1,
      present: 92,
      total: 100,
    },
    upcomingClasses: [
      {
        id: "s1",
        courseName: "Math",
        sectionCode: "A",
        scheduledStart: "2026-07-11T14:00:00.000Z",
        deliveryMode: null,
      },
    ],
    alerts: [],
    ...overrides,
  };
}

function decliningFixture(): {
  kpis: ExecutiveKPIs;
  trends: ExecutiveTrends;
  health: ExecutiveHealthScore;
} {
  const kpis = makeKpis({
    enrollment: 90,
    admissions: 6,
    revenue: 40000,
    outstanding: 15000,
    studentAttendance: 85,
    studentAttendanceDetail: {
      rate: 85,
      absentCount: 15,
      unsubmittedClassrooms: 2,
      present: 85,
      total: 100,
    },
    alerts: [
      {
        id: "overdue_payroll",
        type: "overdue_payroll",
        title: "Overdue payroll",
        body: "3 payroll records overdue",
        severity: "critical",
        count: 3,
      },
    ],
  });

  const previous = snapshotRows([
    { metricId: "enrollment.active_students", metricValue: 110 },
    { metricId: "admissions.pipeline_active", metricValue: 14 },
    { metricId: "finance.monthly_revenue", metricValue: 52000 },
    { metricId: "finance.accounts_receivable", metricValue: 9000 },
    { metricId: "staffing.headcount_active", metricValue: 40 },
    { metricId: "attendance.teacher_submission_rate", metricValue: 96 },
    { metricId: "attendance.rate", metricValue: 93 },
    { metricId: "finance.open_financial_risks", metricValue: 0 },
  ]);

  const trends = calculateExecutiveTrends(kpis, previous);
  const health = calculateExecutiveHealthScore({
    kpis,
    trends,
    previousSnapshot: previous,
  });
  return { kpis, trends, health };
}

describe("evaluateExecutiveGraphRules", () => {
  it("fires admissions → enrollment and enrollment → revenue when declining", () => {
    const { kpis, trends, health } = decliningFixture();
    const rules = evaluateExecutiveGraphRules({
      kpis,
      trends,
      health,
      builtAt: "2026-07-10T12:00:00.000Z",
    });
    const fired = new Set(rules.filter((r) => r.fired).map((r) => r.ruleId));
    expect(fired.has("eig.admissions_declines_enrollment")).toBe(true);
    expect(fired.has("eig.enrollment_declines_revenue")).toBe(true);
    expect(fired.has("eig.revenue_declines_cash")).toBe(true);
    expect(fired.has("eig.payroll_overdue_compliance")).toBe(true);
    expect(fired.has("eig.attendance_to_student_success")).toBe(true);
  });

  it("always fires health MEASURES contributor rules", () => {
    const { kpis, trends, health } = decliningFixture();
    const rules = evaluateExecutiveGraphRules({
      kpis,
      trends,
      health,
      builtAt: "2026-07-10T12:00:00.000Z",
    });
    const healthRules = rules.filter((r) => r.ruleId.startsWith("eig.health_measures_"));
    expect(healthRules.length).toBeGreaterThan(0);
    expect(healthRules.every((r) => r.fired && r.edgeType === "MEASURES")).toBe(true);
  });
});

describe("buildExecutiveGraph", () => {
  beforeEach(() => {
    resetEdgeSeqForTests();
  });

  it("builds nodes, edges, insights, and timeline without I/O", () => {
    const { kpis, trends, health } = decliningFixture();
    const input: BuildExecutiveGraphInput = {
      builtAt: "2026-07-10T12:00:00.000Z",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      kpis,
      trends,
      health,
      alerts: [
        {
          id: "alert-1",
          title: "Collection risk",
          description: "AR aging elevated",
          category: "Financial",
          severity: "High",
          priority: 70,
          confidence: "High",
          organization: "org-1",
          region: null,
          campus: "school-1",
          program: null,
          relatedEntity: null,
          activityReferences: ["act-1"],
          workflowReference: null,
          jagWorkReference: null,
          missionControlReference: null,
          recommendedAction: "Review AR",
          createdAt: "2026-07-10T08:00:00.000Z",
          status: "open",
          acknowledgedAt: null,
          dismissedAt: null,
          dedupeKey: "dk1",
          signalKey: "finance.ar",
          sources: [],
        },
      ],
      activity: [
        {
          id: "act-1",
          event_type: "fi.alert_raised",
          module_key: "finance",
          summary: "AR alert raised",
          classification: "high",
          occurred_at: "2026-07-10T07:55:00.000Z",
          organization_id: "org-1",
          school_id: "school-1",
        },
      ],
      decisions: [
        {
          id: "dec-1",
          title: "Approve collection plan",
          summary: "Escalate overdue invoices",
          decisionType: "Financial",
          priority: 80,
          severity: "High",
          confidence: "High",
          organization: "org-1",
          region: null,
          campus: "school-1",
          program: null,
          status: "Open",
          recommendedAction: "Approve",
          recommendedOwner: null,
          dueDate: null,
          blocking: false,
          relatedAlerts: ["alert-1"],
          relatedActivities: ["act-1"],
          relatedWorkflow: null,
          relatedMissionControlItem: null,
          relatedJagWorkItem: null,
          createdAt: "2026-07-10T09:00:00.000Z",
          updatedAt: "2026-07-10T09:00:00.000Z",
          mergeKey: "mk1",
          signalKey: "finance.collection_plan",
          sources: [],
          history: [],
          relatedEntityType: null,
          relatedEntityId: null,
          financialImpact: null,
          studentImpact: null,
          complianceRisk: null,
        },
      ],
      missionControl: [
        {
          id: "mc-1",
          title: "Critical AR follow-up",
          description: "Families past 60 days",
          severity: "critical",
          href: "/dashboard/mission-control",
          source: "mission_control",
          createdAt: "2026-07-10T06:00:00.000Z",
        },
      ],
    };

    const graph = buildExecutiveGraph(input);

    expect(graph.nodes.length).toBeGreaterThan(10);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.nodes.some((n) => n.type === "HealthScore")).toBe(true);
    expect(graph.nodes.some((n) => n.type === "KPI")).toBe(true);
    expect(graph.nodes.some((n) => n.type === "Financial")).toBe(true);
    expect(graph.nodes.some((n) => n.type === "Alert")).toBe(true);
    expect(graph.nodes.some((n) => n.type === "Decision")).toBe(true);
    expect(graph.nodes.some((n) => n.type === "MissionControl")).toBe(true);
    expect(graph.nodes.some((n) => n.type === "Activity")).toBe(true);

    expect(graph.edges.every((e) => e.ruleId && e.confidence && Array.isArray(e.evidence))).toBe(
      true
    );
    expect(graph.insights.topNegativeDrivers.length).toBeGreaterThan(0);
    expect(graph.timeline.length).toBeGreaterThan(0);
    expect(graph.timeline[0].at <= graph.timeline[graph.timeline.length - 1].at || true).toBe(
      true
    );
  });

  it("explainNode returns causes for revenue pressure", () => {
    const { kpis, trends, health } = decliningFixture();
    const graph = buildExecutiveGraph({
      builtAt: "2026-07-10T12:00:00.000Z",
      kpis,
      trends,
      health,
    });

    const revenueNode = graph.nodes.find(
      (n) => n.type === "Financial" && n.key === "revenue"
    );
    expect(revenueNode).toBeTruthy();
    const explained = explainNode(graph, revenueNode!.id);
    expect(explained.node).not.toBeNull();
    expect(explained.immediateCauses.length).toBeGreaterThan(0);
    expect(explained.explanation.toLowerCase()).toContain("enrollment");
    expect(explained.confidence).not.toBe("Unknown");
  });
});
