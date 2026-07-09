import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ExecutiveAggregateMetrics, ExecutiveMetric } from "@/lib/platform/executive-metrics";
import {
  assertSnapshotDate,
  buildSnapshotPeriodKey,
  enumerateSnapshotDates,
  filterDuplicateSnapshotRecords,
  mapAggregateToSnapshotRecords,
  snapshotRecordToInsertRow,
  todaySnapshotDate,
} from "@/lib/platform/kpi-snapshots";

function metric(partial: Partial<ExecutiveMetric> & Pick<ExecutiveMetric, "id" | "name">): ExecutiveMetric {
  return {
    value: partial.value ?? null,
    status: partial.status ?? "unknown",
    trend: partial.trend ?? { direction: "unknown", pct: null },
    lastUpdated: partial.lastUpdated ?? "2026-07-09T12:00:00.000Z",
    source: partial.source ?? "test",
    confidence: partial.confidence ?? "Unknown",
    domain: partial.domain ?? "enrollment",
    ...partial,
  };
}

function aggregate(metrics: ExecutiveMetric[]): ExecutiveAggregateMetrics {
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
    domains: {
      enrollment: metrics.filter((m) => m.domain === "enrollment"),
      admissions: [],
      finance: [],
      staffing: [],
      attendance: metrics.filter((m) => m.domain === "attendance"),
      compliance: [],
      operations: [],
      executive: [],
    },
    metrics,
    byId: Object.fromEntries(metrics.map((m) => [m.id, m])),
  };
}

describe("period helpers", () => {
  it("formats today as YYYY-MM-DD", () => {
    expect(todaySnapshotDate(new Date("2026-07-09T15:30:00.000Z"))).toBe("2026-07-09");
  });

  it("rejects invalid dates", () => {
    expect(() => assertSnapshotDate("2026-13-01")).toThrow(/Invalid snapshot date/);
    expect(() => assertSnapshotDate("not-a-date")).toThrow();
  });

  it("enumerates inclusive date ranges", () => {
    expect(enumerateSnapshotDates("2026-07-01", "2026-07-03")).toEqual([
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
    ]);
  });

  it("builds stable period keys for duplicate detection", () => {
    const a = buildSnapshotPeriodKey({
      organizationId: "org-1",
      regionId: null,
      schoolId: "school-1",
      campusId: null,
      program: null,
      metricId: "enrollment.active_enrollments",
      snapshotDate: "2026-07-09",
    });
    const b = buildSnapshotPeriodKey({
      organizationId: "org-1",
      regionId: null,
      schoolId: "school-1",
      campusId: null,
      program: null,
      metricId: "enrollment.active_enrollments",
      snapshotDate: "2026-07-09",
    });
    const c = buildSnapshotPeriodKey({
      organizationId: "org-1",
      regionId: null,
      schoolId: "school-1",
      campusId: null,
      program: null,
      metricId: "enrollment.active_enrollments",
      snapshotDate: "2026-07-10",
    });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("mapAggregateToSnapshotRecords", () => {
  it("stores required snapshot fields from aggregate metrics", () => {
    const records = mapAggregateToSnapshotRecords(
      aggregate([
        metric({
          id: "enrollment.active_enrollments",
          name: "Active Enrollments",
          value: 120,
          status: "healthy",
          confidence: "High",
          source: "dashboard.metrics",
          trend: { direction: "up", pct: 4 },
          domain: "enrollment",
          unit: "count",
        }),
        metric({
          id: "admissions.acceptance_rate",
          name: "Acceptance Rate",
          value: null,
          confidence: "Unknown",
          domain: "admissions",
        }),
      ]),
      "2026-07-09",
      "daily",
      "2026-07-09T12:00:00.000Z"
    );

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      organizationId: "org-1",
      regionId: "region-1",
      campusId: "campus-1",
      program: "Virtual",
      metricId: "enrollment.active_enrollments",
      metricName: "Active Enrollments",
      metricValue: 120,
      status: "healthy",
      trendDirection: "up",
      trendPct: 4,
      confidence: "High",
      source: "dashboard.metrics",
      capturedAt: "2026-07-09T12:00:00.000Z",
      snapshotDate: "2026-07-09",
      captureMode: "daily",
    });
    expect(records[1].metricValue).toBeNull();
    expect(records[1].confidence).toBe("Unknown");
  });

  it("maps to insert rows with nullable actual_value", () => {
    const [record] = mapAggregateToSnapshotRecords(
      aggregate([
        metric({
          id: "finance.ebitda",
          name: "EBITDA",
          value: null,
          confidence: "Unknown",
          domain: "finance",
        }),
      ]),
      "2026-07-09",
      "manual"
    );
    const row = snapshotRecordToInsertRow(record);
    expect(row.kpi_key).toBe("finance.ebitda");
    expect(row.metric_name).toBe("EBITDA");
    expect(row.actual_value).toBeNull();
    expect(row.organization_id).toBe("org-1");
    expect(row.region_id).toBe("region-1");
    expect(row.campus_id).toBe("campus-1");
    expect(row.program).toBe("Virtual");
    expect(row.confidence).toBe("Unknown");
    expect(row.capture_mode).toBe("manual");
    expect(row.metadata).toMatchObject({ engine: "platform.kpi-snapshots" });
  });
});

describe("filterDuplicateSnapshotRecords", () => {
  it("skips records already captured in the same period", () => {
    const records = mapAggregateToSnapshotRecords(
      aggregate([
        metric({ id: "enrollment.active_enrollments", name: "Active Enrollments", value: 10 }),
        metric({ id: "attendance.rate", name: "Attendance Rate", value: 94, domain: "attendance" }),
      ]),
      "2026-07-09",
      "daily"
    );

    const existing = new Set([
      buildSnapshotPeriodKey({
        organizationId: "org-1",
        regionId: "region-1",
        schoolId: "school-1",
        campusId: "campus-1",
        program: "Virtual",
        metricId: "enrollment.active_enrollments",
        snapshotDate: "2026-07-09",
      }),
    ]);

    const { toInsert, skippedDuplicates } = filterDuplicateSnapshotRecords(records, existing);
    expect(skippedDuplicates).toHaveLength(1);
    expect(skippedDuplicates[0].metricId).toBe("enrollment.active_enrollments");
    expect(toInsert).toHaveLength(1);
    expect(toInsert[0].metricId).toBe("attendance.rate");
  });
});

describe("captureSnapshot lifecycle (mocked aggregation + persistence)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("uses getExecutiveAggregateMetrics only and skips duplicates", async () => {
    const getMetrics = vi.fn().mockResolvedValue(
      aggregate([
        metric({
          id: "enrollment.active_enrollments",
          name: "Active Enrollments",
          value: 120,
          confidence: "High",
          status: "healthy",
        }),
        metric({
          id: "attendance.rate",
          name: "Attendance Rate",
          value: 94,
          domain: "attendance",
          confidence: "Medium",
          status: "watch",
        }),
      ])
    );

    const existingKey = buildSnapshotPeriodKey({
      organizationId: "org-1",
      regionId: "region-1",
      schoolId: "school-1",
      campusId: "campus-1",
      program: "Virtual",
      metricId: "enrollment.active_enrollments",
      snapshotDate: "2026-07-09",
    });

    const insertRows = vi.fn().mockResolvedValue({ inserted: 1 });

    vi.doMock("@/lib/platform/executive-metrics", () => ({
      getExecutiveAggregateMetrics: getMetrics,
    }));
    vi.doMock("@/lib/platform/kpi-snapshots/persistence", () => ({
      loadExistingSnapshotPeriodKeys: vi.fn().mockResolvedValue(new Set([existingKey])),
      insertKpiSnapshotRows: insertRows,
    }));
    vi.doMock("@/lib/platform/activity", () => ({
      recordActivity: vi.fn().mockResolvedValue({ id: "act-1" }),
    }));

    const { captureSnapshot } = await import("@/lib/platform/kpi-snapshots/capture");
    const result = await captureSnapshot({} as never, {
      snapshotDate: "2026-07-09",
      mode: "daily",
      filters: { organizationId: "org-1", schoolId: "school-1" },
      recordActivityEvent: false,
    });

    expect(getMetrics).toHaveBeenCalledTimes(1);
    expect(getMetrics.mock.calls[0][1]).toEqual({
      organizationId: "org-1",
      schoolId: "school-1",
    });
    expect(result.attempted).toBe(2);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.inserted).toBe(1);
    expect(insertRows).toHaveBeenCalledTimes(1);
    const rows = insertRows.mock.calls[0][1] as Array<{ kpi_key: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].kpi_key).toBe("attendance.rate");
  });

  it("captureDailyExecutiveSnapshot defaults to daily mode", async () => {
    vi.doMock("@/lib/platform/executive-metrics", () => ({
      getExecutiveAggregateMetrics: vi.fn().mockResolvedValue(aggregate([])),
    }));
    vi.doMock("@/lib/platform/kpi-snapshots/persistence", () => ({
      loadExistingSnapshotPeriodKeys: vi.fn().mockResolvedValue(new Set()),
      insertKpiSnapshotRows: vi.fn().mockResolvedValue({ inserted: 0 }),
    }));
    vi.doMock("@/lib/platform/activity", () => ({
      recordActivity: vi.fn().mockResolvedValue({ id: null }),
    }));

    const { captureDailyExecutiveSnapshot } = await import("@/lib/platform/kpi-snapshots/capture");
    const result = await captureDailyExecutiveSnapshot({} as never, {
      snapshotDate: "2026-07-09",
      recordActivityEvent: false,
    });
    expect(result.mode).toBe("daily");
    expect(result.snapshotDate).toBe("2026-07-09");
    expect(result.attempted).toBe(0);
    expect(result.inserted).toBe(0);
  });

  it("backfillSnapshots walks each day and marks mode=backfill", async () => {
    const getMetrics = vi.fn().mockResolvedValue(
      aggregate([
        metric({
          id: "enrollment.active_enrollments",
          name: "Active Enrollments",
          value: 1,
          confidence: "High",
        }),
      ])
    );
    const insertRows = vi.fn().mockImplementation((_sb, rows: Array<{ snapshot_date: string; capture_mode: string }>) => {
      expect(rows[0]?.capture_mode).toBe("backfill");
      return Promise.resolve({ inserted: rows.length });
    });

    vi.doMock("@/lib/platform/executive-metrics", () => ({
      getExecutiveAggregateMetrics: getMetrics,
    }));
    vi.doMock("@/lib/platform/kpi-snapshots/persistence", () => ({
      loadExistingSnapshotPeriodKeys: vi.fn().mockResolvedValue(new Set()),
      insertKpiSnapshotRows: insertRows,
    }));
    vi.doMock("@/lib/platform/activity", () => ({
      recordActivity: vi.fn().mockResolvedValue({ id: null }),
    }));

    const { backfillSnapshots } = await import("@/lib/platform/kpi-snapshots/capture");
    const result = await backfillSnapshots({} as never, {
      fromDate: "2026-07-01",
      toDate: "2026-07-03",
      recordActivityEvent: false,
    });

    expect(result.days).toHaveLength(3);
    expect(result.days.every((d) => d.mode === "backfill")).toBe(true);
    expect(result.totals.inserted).toBe(3);
    expect(getMetrics).toHaveBeenCalledTimes(3);
    expect(insertRows.mock.calls.map((c) => c[1][0].snapshot_date)).toEqual([
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
    ]);
  });
});
