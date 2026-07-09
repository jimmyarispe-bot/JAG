import { describe, expect, it } from "vitest";
import {
  acknowledgeAlert,
  adaptFinancialAlerts,
  adaptKpiSnapshots,
  adaptMissionControlItems,
  buildDedupeKey,
  buildExecutiveAlerts,
  collectAlertDrafts,
  dedupeAlerts,
  dismissAlert,
  linkJagWorkReference,
  linkMissionControlReference,
  linkWorkflowReference,
  normalizeSeverity,
  scoreAlert,
  type ExecutiveAlertDraft,
  type ExecutiveAlertSourceBundle,
  type ExecutiveAlertsScope,
} from "@/lib/platform/executive-alerts";
import type { ExecutiveAggregateMetrics, ExecutiveMetric } from "@/lib/platform/executive-metrics";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";

const scope: ExecutiveAlertsScope = {
  networkId: null,
  regionId: "region-1",
  campusId: "campus-1",
  programId: null,
  program: null,
  organizationId: "org-1",
  schoolId: "school-1",
};

function draft(
  partial: Partial<ExecutiveAlertDraft> &
    Pick<ExecutiveAlertDraft, "signalKey" | "title" | "category" | "severity" | "source">
): ExecutiveAlertDraft {
  return {
    description: partial.description ?? partial.title,
    confidence: partial.confidence ?? "High",
    organization: partial.organization ?? "org-1",
    region: partial.region ?? "region-1",
    campus: partial.campus ?? "school-1",
    program: partial.program ?? null,
    relatedEntity: partial.relatedEntity ?? null,
    createdAt: partial.createdAt ?? "2026-07-09T12:00:00.000Z",
    ...partial,
  };
}

describe("normalizeSeverity / scoreAlert", () => {
  it("normalizes domain severity strings", () => {
    expect(normalizeSeverity("critical")).toBe("Critical");
    expect(normalizeSeverity("high")).toBe("High");
    expect(normalizeSeverity("warning")).toBe("Medium");
    expect(normalizeSeverity("info")).toBe("Low");
  });

  it("scores Critical higher than Low within 1–100", () => {
    const critical = scoreAlert({
      severity: "Critical",
      category: "Financial",
      confidence: "High",
    });
    const low = scoreAlert({
      severity: "Low",
      category: "Executive",
      confidence: "Unknown",
    });
    expect(critical).toBeGreaterThanOrEqual(1);
    expect(critical).toBeLessThanOrEqual(100);
    expect(low).toBeGreaterThanOrEqual(1);
    expect(critical).toBeGreaterThan(low);
  });

  it("boosts priority when multiple sources corroborate", () => {
    const one = scoreAlert({
      severity: "High",
      category: "Compliance",
      confidence: "High",
      sourceCount: 1,
    });
    const many = scoreAlert({
      severity: "High",
      category: "Compliance",
      confidence: "High",
      sourceCount: 4,
    });
    expect(many).toBeGreaterThan(one);
  });
});

describe("buildDedupeKey", () => {
  it("is stable for the same inputs", () => {
    const a = buildDedupeKey({
      schoolId: "school-1",
      category: "Financial",
      entityType: "fi_financial_alerts",
      entityId: "alert-1",
      signalKey: "fi.cash_risk",
    });
    const b = buildDedupeKey({
      schoolId: "school-1",
      category: "Financial",
      entityType: "fi_financial_alerts",
      entityId: "alert-1",
      signalKey: "fi.cash_risk",
    });
    expect(a).toBe(b);
    expect(a.startsWith("ea_")).toBe(true);
  });

  it("differs when signalKey differs", () => {
    const a = buildDedupeKey({
      schoolId: "school-1",
      category: "Financial",
      signalKey: "fi.cash_risk",
    });
    const b = buildDedupeKey({
      schoolId: "school-1",
      category: "Financial",
      signalKey: "fi.margin_risk",
    });
    expect(a).not.toBe(b);
  });
});

describe("dedupeAlerts", () => {
  it("merges identical signal drafts into one alert with multiple sources", () => {
    const { alerts, rawDraftCount, dedupedAway } = dedupeAlerts([
      draft({
        signalKey: "finance.collection_rate",
        title: "Collection rate at risk",
        category: "Financial",
        severity: "High",
        source: { source: "executive_metrics", sourceId: "finance.collection_rate" },
      }),
      draft({
        signalKey: "finance.collection_rate",
        title: "Collection rate at risk (KPI)",
        category: "Financial",
        severity: "Critical",
        source: { source: "kpi_snapshots", sourceId: "2026-07-09:finance.collection_rate" },
      }),
    ]);

    expect(rawDraftCount).toBe(2);
    expect(dedupedAway).toBe(1);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("Critical");
    expect(alerts[0].sources).toHaveLength(2);
    expect(alerts[0].sources.map((s) => s.source).sort()).toEqual([
      "executive_metrics",
      "kpi_snapshots",
    ]);
  });

  it("merges different signal keys that share the same related entity", () => {
    const { alerts } = dedupeAlerts([
      draft({
        signalKey: "fi.cash_risk",
        title: "Cash risk from FI",
        category: "Financial",
        severity: "High",
        relatedEntity: { type: "fi_financial_alerts", id: "fi-1" },
        missionControlReference: null,
        source: { source: "financial_intelligence", sourceId: "fi-1" },
      }),
      draft({
        signalKey: "mc.fi_financial_alerts",
        title: "Cash risk in Mission Control",
        category: "Financial",
        severity: "Critical",
        relatedEntity: { type: "fi_financial_alerts", id: "fi-1" },
        missionControlReference: "mc-9",
        source: { source: "mission_control", sourceId: "mc-9" },
      }),
    ]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].missionControlReference).toBe("mc-9");
    expect(alerts[0].sources).toHaveLength(2);
    expect(alerts[0].severity).toBe("Critical");
  });

  it("unions activity references across merged drafts", () => {
    const { alerts } = dedupeAlerts([
      draft({
        signalKey: "operations.loop_failed_transitions_24h",
        title: "Loop failures",
        category: "Operations",
        severity: "High",
        activityReferences: ["act-1"],
        source: { source: "operational_loop", sourceId: "loop" },
      }),
      draft({
        signalKey: "operations.loop_failed_transitions_24h",
        title: "Loop failures",
        category: "Operations",
        severity: "High",
        activityReferences: ["act-2", "act-1"],
        source: { source: "activity", sourceId: "act-2" },
      }),
    ]);

    expect(alerts[0].activityReferences.sort()).toEqual(["act-1", "act-2"]);
  });
});

describe("buildExecutiveAlerts", () => {
  it("returns a sorted stream and excludes dismissed by default", () => {
    const stream = buildExecutiveAlerts({
      scope,
      drafts: [
        draft({
          signalKey: "a",
          title: "Open critical",
          category: "Security",
          severity: "Critical",
          source: { source: "activity", sourceId: "1" },
        }),
        draft({
          signalKey: "b",
          title: "Dismissed",
          category: "Executive",
          severity: "Low",
          status: "dismissed",
          source: { source: "executive_insights", sourceId: "2" },
        }),
      ],
      builtAt: "2026-07-09T12:00:00.000Z",
    });

    expect(stream.alerts).toHaveLength(1);
    expect(stream.alerts[0].title).toBe("Open critical");
    expect(stream.scope.organizationId).toBe("org-1");
  });
});

describe("lifecycle helpers", () => {
  it("supports acknowledge, dismiss, and linkage without inventing stores", () => {
    const { alerts } = dedupeAlerts([
      draft({
        signalKey: "compliance.overdue_obligations",
        title: "Overdue",
        category: "Compliance",
        severity: "High",
        source: { source: "compliance", sourceId: "c1" },
      }),
    ]);

    let alert = alerts[0];
    alert = acknowledgeAlert(alert, "2026-07-09T13:00:00.000Z");
    expect(alert.status).toBe("acknowledged");
    expect(alert.acknowledgedAt).toBe("2026-07-09T13:00:00.000Z");

    alert = linkWorkflowReference(alert, "wf-1");
    alert = linkJagWorkReference(alert, "jag-1");
    alert = linkMissionControlReference(alert, "mc-1");
    expect(alert.workflowReference).toBe("wf-1");
    expect(alert.jagWorkReference).toBe("jag-1");
    expect(alert.missionControlReference).toBe("mc-1");

    alert = dismissAlert(alert, "2026-07-09T14:00:00.000Z");
    expect(alert.status).toBe("dismissed");
  });
});

describe("source adapters", () => {
  it("adapts KPI snapshot breaches only", () => {
    const snapshots: KpiSnapshotRecord[] = [
      {
        organizationId: "org-1",
        regionId: null,
        schoolId: "school-1",
        campusId: null,
        program: null,
        metricId: "finance.collection_rate",
        metricName: "Collection Rate",
        metricValue: 72,
        status: "at_risk",
        trendDirection: "down",
        trendPct: -5,
        confidence: "High",
        source: "test",
        capturedAt: "2026-07-09T08:00:00.000Z",
        snapshotDate: "2026-07-09",
        captureMode: "daily",
        domain: "finance",
      },
      {
        organizationId: "org-1",
        regionId: null,
        schoolId: "school-1",
        campusId: null,
        program: null,
        metricId: "enrollment.active_enrollments",
        metricName: "Active Enrollments",
        metricValue: 100,
        status: "healthy",
        trendDirection: "flat",
        trendPct: 0,
        confidence: "High",
        source: "test",
        capturedAt: "2026-07-09T08:00:00.000Z",
        snapshotDate: "2026-07-09",
        captureMode: "daily",
        domain: "enrollment",
      },
    ];

    const drafts = adaptKpiSnapshots(snapshots, scope);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].category).toBe("Financial");
    expect(drafts[0].severity).toBe("High");
  });

  it("adapts FI + Mission Control and dedupes on shared entity", () => {
    const fi = adaptFinancialAlerts(
      [
        {
          id: "fi-1",
          title: "Program below break-even",
          body: "Margin negative",
          alert_type: "below_breakeven",
          severity: "high",
          entity_type: "fi_financial_alerts",
          entity_id: "fi-1",
          mission_control_item_id: "mc-1",
          created_at: "2026-07-09T10:00:00.000Z",
        },
      ],
      scope
    );
    const mc = adaptMissionControlItems(
      [
        {
          id: "mc-1",
          title: "Program below break-even",
          body: "Margin negative",
          severity: "critical",
          module: "finance",
          item_type: "executive_alert",
          entity_type: "fi_financial_alerts",
          entity_id: "fi-1",
          created_at: "2026-07-09T10:05:00.000Z",
          metadata: { jag_work_id: "jag-22", activity_id: "act-9" },
        },
      ],
      scope
    );

    const { alerts } = dedupeAlerts([...fi, ...mc]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].missionControlReference).toBe("mc-1");
    expect(alerts[0].jagWorkReference).toBe("jag-22");
    expect(alerts[0].activityReferences).toContain("act-9");
    expect(alerts[0].sources).toHaveLength(2);
  });
});

describe("collectAlertDrafts", () => {
  it("fans out across source adapters", () => {
    const metric = (partial: Partial<ExecutiveMetric> & Pick<ExecutiveMetric, "id" | "name">): ExecutiveMetric => ({
      value: 1,
      status: "critical",
      trend: { direction: "down", pct: -10 },
      lastUpdated: "2026-07-09T12:00:00.000Z",
      source: "test",
      confidence: "High",
      domain: "compliance",
      ...partial,
    });

    const aggregate: ExecutiveAggregateMetrics = {
      scope,
      aggregatedAt: "2026-07-09T12:00:00.000Z",
      domains: {
        enrollment: [],
        admissions: [],
        finance: [],
        staffing: [],
        attendance: [],
        compliance: [metric({ id: "compliance.critical_count", name: "Critical" })],
        operations: [],
        executive: [],
      },
      metrics: [metric({ id: "compliance.critical_count", name: "Critical" })],
      byId: {
        "compliance.critical_count": metric({
          id: "compliance.critical_count",
          name: "Critical",
        }),
      },
    };

    const sources: ExecutiveAlertSourceBundle = {
      loadedAt: "2026-07-09T12:00:00.000Z",
      scope,
      schoolId: "school-1",
      metricsSources: null,
      aggregate,
      kpiSnapshots: [],
      activity: [],
      financialAlerts: [],
      missionControl: [],
      compliance: { overdue: 2, criticalCount: 1 },
      workforce: { vacancies: 6, turnoverRate: 5, expiringCertifications: 0 },
      admissions: { enrollmentConversionRate: 10, acceptanceRate: 40, awaitingDecision: 0 },
      operationalLoop: { failedTransitions24h: 2, openGaps: 0 },
      insights: [],
    };

    const drafts = collectAlertDrafts(sources);
    const keys = drafts.map((d) => d.signalKey);
    expect(keys).toContain("compliance.critical_count");
    expect(keys).toContain("staffing.vacancies");
    expect(keys).toContain("admissions.enrollment_conversion_rate");
    expect(keys).toContain("operations.loop_failed_transitions_24h");

    const stream = buildExecutiveAlerts({ scope, drafts });
    // compliance.critical_count appears from metrics + compliance adapter → deduped
    const compliance = stream.alerts.filter((a) => a.signalKey === "compliance.critical_count");
    expect(compliance).toHaveLength(1);
    expect(compliance[0].sources.length).toBeGreaterThanOrEqual(2);
  });
});
