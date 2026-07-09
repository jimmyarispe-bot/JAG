import { describe, expect, it } from "vitest";
import {
  buildExecutiveSummaryNarrative,
  buildFinancialPulse,
  buildNetworkHealth,
  buildOvernightActivity,
  buildWhatChangedSinceYesterday,
  compareKpiSnapshots,
  decisionsToLegacyJagWork,
} from "@/lib/dashboard/morning-brief/sections";
import type { ExecutiveAggregateMetrics, ExecutiveMetric } from "@/lib/platform/executive-metrics";
import type { ExecutiveAlert } from "@/lib/platform/executive-alerts";
import type { ExecutiveDecision } from "@/lib/platform/executive-decisions";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";
import type { PlatformActivityEvent } from "@/lib/platform/activity/types";

function metric(
  partial: Partial<ExecutiveMetric> & Pick<ExecutiveMetric, "id" | "name" | "domain">
): ExecutiveMetric {
  return {
    value: partial.value ?? null,
    status: partial.status ?? "unknown",
    trend: partial.trend ?? { direction: "unknown", pct: null },
    lastUpdated: partial.lastUpdated ?? "2026-07-09T12:00:00.000Z",
    source: partial.source ?? "test",
    confidence: partial.confidence ?? "Unknown",
    ...partial,
  };
}

function aggregate(metrics: ExecutiveMetric[]): ExecutiveAggregateMetrics {
  const domains = {
    enrollment: metrics.filter((m) => m.domain === "enrollment"),
    admissions: metrics.filter((m) => m.domain === "admissions"),
    finance: metrics.filter((m) => m.domain === "finance"),
    staffing: metrics.filter((m) => m.domain === "staffing"),
    attendance: metrics.filter((m) => m.domain === "attendance"),
    compliance: metrics.filter((m) => m.domain === "compliance"),
    operations: metrics.filter((m) => m.domain === "operations"),
    executive: metrics.filter((m) => m.domain === "executive"),
  };
  return {
    scope: {
      networkId: null,
      regionId: "region-1",
      campusId: "campus-1",
      programId: null,
      program: "Virtual",
      organizationId: "org-1",
      schoolId: "school-1",
    },
    aggregatedAt: "2026-07-09T12:00:00.000Z",
    domains,
    metrics,
    byId: Object.fromEntries(metrics.map((m) => [m.id, m])),
  };
}

describe("buildExecutiveSummaryNarrative", () => {
  it("emits 4–8 deterministic sentences without AI", () => {
    const agg = aggregate([
      metric({
        id: "enrollment.active_enrollments",
        name: "Active Enrollments",
        domain: "enrollment",
        value: 120,
        status: "healthy",
        confidence: "High",
      }),
      metric({
        id: "attendance.rate",
        name: "Attendance",
        domain: "attendance",
        value: 92,
        unit: "percent",
        status: "healthy",
        confidence: "High",
      }),
      metric({
        id: "finance.collection_rate",
        name: "Collection",
        domain: "finance",
        value: 88,
        unit: "percent",
        status: "watch",
        confidence: "High",
      }),
    ]);

    const pulse = buildFinancialPulse(agg);
    const narrative = buildExecutiveSummaryNarrative({
      productName: "The JAG OS",
      workspaceLabel: "Founder Workspace",
      aggregate: agg,
      alerts: [],
      decisions: [],
      missionControlCriticalCount: 0,
      financialPulse: pulse,
    });

    const sentences = narrative.split(/(?<=\.)\s+/).filter(Boolean);
    expect(sentences.length).toBeGreaterThanOrEqual(4);
    expect(sentences.length).toBeLessThanOrEqual(8);
    expect(narrative).toContain("Founder Workspace");
    expect(narrative).toContain("120");
  });
});

describe("buildFinancialPulse", () => {
  it("maps aggregate finance metrics and marks cash as estimated", () => {
    const pulse = buildFinancialPulse(
      aggregate([
        metric({
          id: "finance.cash_position",
          name: "Cash",
          domain: "finance",
          value: 250000,
          unit: "currency",
          confidence: "Low",
        }),
        metric({
          id: "finance.accounts_receivable",
          name: "AR",
          domain: "finance",
          value: 40000,
          unit: "currency",
        }),
        metric({
          id: "finance.open_financial_risks",
          name: "Risks",
          domain: "finance",
          value: 2,
        }),
        metric({
          id: "staffing.payroll_ytd",
          name: "Payroll",
          domain: "staffing",
          value: 900000,
        }),
      ])
    );

    expect(pulse.estimatedCash).toBe(250000);
    expect(pulse.receivablesDue).toBe(40000);
    expect(pulse.financialRisk).toBe(2);
    expect(pulse.payrollDue).toBe(900000);
    expect(pulse.collectionsYesterday).toBeNull();
    expect(pulse.confidence).toBe("estimated");
  });
});

describe("buildNetworkHealth", () => {
  it("emits Organization/Region/Campus/Program tones", () => {
    const health = buildNetworkHealth(
      aggregate([
        metric({
          id: "enrollment.active_enrollments",
          name: "Enrollment",
          domain: "enrollment",
          value: 100,
          status: "healthy",
        }),
        metric({
          id: "operations.mission_control_open",
          name: "MC Open",
          domain: "operations",
          value: 20,
          status: "at_risk",
        }),
        metric({
          id: "executive.mission_health",
          name: "Mission Health",
          domain: "executive",
          value: 70,
          status: "watch",
        }),
      ])
    );

    expect(health.nodes.map((n) => n.level)).toEqual([
      "Organization",
      "Region",
      "Campus",
      "Program",
    ]);
    expect(["Green", "Yellow", "Red", "Unknown"]).toContain(health.overall);
    expect(health.nodes.find((n) => n.level === "Campus")?.tone).toBe("Red");
  });
});

describe("buildOvernightActivity", () => {
  it("filters noise and keeps meaningful overnight events", () => {
    const events: PlatformActivityEvent[] = [
      {
        id: "1",
        organization_id: "org-1",
        school_id: null,
        campus_id: null,
        module_key: "platform",
        event_type: "platform.tag_applied",
        event_version: "1",
        entity_type: "student",
        entity_id: "s1",
        title: "Tag",
        summary: "Tag",
        body: "",
        actor_user_id: null,
        actor_type: "user",
        occurred_at: "2026-07-09T02:00:00.000Z",
        student_id: null,
        family_id: null,
        related_entity_type: null,
        related_entity_id: null,
        classification: "operational",
        visibility: "staff",
        severity: "info",
        payload: {},
        correlation_id: null,
        source_table: null,
        source_id: null,
        searchable_text: "",
        created_at: "2026-07-09T02:00:00.000Z",
      },
      {
        id: "2",
        organization_id: "org-1",
        school_id: null,
        campus_id: null,
        module_key: "admissions",
        event_type: "admissions.decision_recorded",
        event_version: "1",
        entity_type: "admissions_lead",
        entity_id: "l1",
        title: "Decision",
        summary: "Lead accepted",
        body: "",
        actor_user_id: null,
        actor_type: "user",
        occurred_at: "2026-07-09T03:00:00.000Z",
        student_id: null,
        family_id: null,
        related_entity_type: null,
        related_entity_id: null,
        classification: "operational",
        visibility: "staff",
        severity: "info",
        payload: {},
        correlation_id: null,
        source_table: null,
        source_id: null,
        searchable_text: "",
        created_at: "2026-07-09T03:00:00.000Z",
      },
    ];

    const items = buildOvernightActivity(events, "2026-07-08T12:00:00.000Z", 8);
    expect(items).toHaveLength(1);
    expect(items[0].eventType).toBe("admissions.decision_recorded");
  });
});

describe("compareKpiSnapshots / whatChanged", () => {
  const current: KpiSnapshotRecord[] = [
    {
      organizationId: "org-1",
      regionId: null,
      schoolId: "school-1",
      campusId: null,
      program: null,
      metricId: "enrollment.active_enrollments",
      metricName: "Active Enrollments",
      metricValue: 110,
      status: "healthy",
      trendDirection: "up",
      trendPct: 10,
      confidence: "High",
      source: "test",
      capturedAt: "2026-07-09T08:00:00.000Z",
      snapshotDate: "2026-07-09",
      captureMode: "daily",
    },
    {
      organizationId: "org-1",
      regionId: null,
      schoolId: "school-1",
      campusId: null,
      program: null,
      metricId: "finance.collection_rate",
      metricName: "Collection Rate",
      metricValue: 70,
      status: "at_risk",
      trendDirection: "down",
      trendPct: -10,
      confidence: "High",
      source: "test",
      capturedAt: "2026-07-09T08:00:00.000Z",
      snapshotDate: "2026-07-09",
      captureMode: "daily",
      unit: "percent",
      domain: "finance",
    },
  ];

  const prior: KpiSnapshotRecord[] = [
    {
      ...current[0],
      metricValue: 100,
      snapshotDate: "2026-07-08",
      status: "watch",
    },
    {
      ...current[1],
      metricValue: 80,
      snapshotDate: "2026-07-08",
      status: "watch",
    },
  ];

  it("ranks largest increases and decreases", () => {
    const changes = compareKpiSnapshots(current, prior, "2026-07-09", "2026-07-08", 5);
    expect(changes.largestIncreases[0].metricId).toBe("enrollment.active_enrollments");
    expect(changes.largestIncreases[0].delta).toBe(10);
    expect(changes.largestDecreases[0].metricId).toBe("finance.collection_rate");
    expect(changes.largestDecreases[0].delta).toBe(-10);
  });

  it("lists what changed including status transitions", () => {
    const items = buildWhatChangedSinceYesterday(current, prior, 10);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.some((i) => i.statusChanged)).toBe(true);
  });
});

describe("decisionsToLegacyJagWork", () => {
  it("maps decision queue items for existing UI", () => {
    const decision = {
      id: "decision_1",
      title: "Approve hire",
      summary: "Staffing approval",
      decisionType: "Staffing",
      priority: 80,
      severity: "High",
      confidence: "High",
      organization: "org-1",
      region: null,
      campus: "school-1",
      program: null,
      status: "Open",
      recommendedAction: "Approve",
      recommendedOwner: "HR",
      dueDate: null,
      blocking: false,
      relatedAlerts: [],
      relatedActivities: [],
      relatedWorkflow: null,
      relatedMissionControlItem: null,
      relatedJagWorkItem: "jag-1",
      createdAt: "2026-07-09T12:00:00.000Z",
      updatedAt: "2026-07-09T12:00:00.000Z",
      mergeKey: "ed_x",
      signalKey: "jag.hr",
      sources: [],
      history: [],
      relatedEntityType: null,
      relatedEntityId: null,
      financialImpact: false,
      studentImpact: false,
      complianceRisk: false,
    } as ExecutiveDecision;

    const items = decisionsToLegacyJagWork([decision]);
    expect(items[0].id).toBe("jag-1");
    expect(items[0].title).toBe("Approve hire");
    expect(items[0].priority).toBe("high");
  });
});

describe("alert narrative mentions criticals", () => {
  it("includes critical alert count in summary", () => {
    const alert = {
      id: "a1",
      title: "Cash risk",
      description: "x",
      category: "Financial",
      severity: "Critical",
      priority: 90,
      confidence: "High",
      organization: null,
      region: null,
      campus: null,
      program: null,
      relatedEntity: null,
      activityReferences: [],
      workflowReference: null,
      jagWorkReference: null,
      missionControlReference: null,
      recommendedAction: null,
      createdAt: "2026-07-09T12:00:00.000Z",
      status: "open",
      acknowledgedAt: null,
      dismissedAt: null,
      dedupeKey: "ea",
      signalKey: "fi",
      sources: [],
    } as ExecutiveAlert;

    const narrative = buildExecutiveSummaryNarrative({
      productName: "JAG",
      workspaceLabel: "Home",
      aggregate: null,
      alerts: [alert],
      decisions: [],
      missionControlCriticalCount: 2,
      financialPulse: buildFinancialPulse(null),
    });

    expect(narrative).toMatch(/critical executive alert/i);
    expect(narrative).toMatch(/Mission Control/i);
  });
});
