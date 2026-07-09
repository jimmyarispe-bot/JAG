import { describe, expect, it } from "vitest";
import {
  assembleExecutiveAggregateMetrics,
  buildMetric,
  EXECUTIVE_METRIC_DOMAIN_ORDER,
  getMetricById,
  getMetricsByDomain,
  normalizeMetricValue,
  provideEnrollmentMetrics,
  provideFinanceMetrics,
  resolveConfidence,
  resolveExecutiveMetricsScope,
  resolveSchoolScopeId,
  resolveTrend,
  statusFromHigherIsBetter,
  trendFromPct,
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
    dashboard: null,
    commandCenter: null,
    admissions: null,
    finance: null,
    workforce: null,
    missionControl: null,
    compliance: null,
    scheduling: null,
    operationalLoop: null,
    activityRecentCount: null,
    financialIntelligence: null,
    founderOps: null,
    ...overrides,
  };
}

describe("normalizeMetricValue", () => {
  it("returns null for missing values instead of 0", () => {
    expect(normalizeMetricValue(null)).toBeNull();
    expect(normalizeMetricValue(undefined)).toBeNull();
    expect(normalizeMetricValue(Number.NaN)).toBeNull();
    expect(normalizeMetricValue(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("preserves finite numbers including 0", () => {
    expect(normalizeMetricValue(0)).toBe(0);
    expect(normalizeMetricValue(42)).toBe(42);
  });
});

describe("buildMetric", () => {
  it("emits Unknown confidence and null value when data is missing", () => {
    const metric = buildMetric({
      id: "enrollment.active_enrollments",
      name: "Active Enrollments",
      domain: "enrollment",
      source: "test",
      value: null,
    });

    expect(metric.value).toBeNull();
    expect(metric.confidence).toBe("Unknown");
    expect(metric.status).toBe("unknown");
    expect(metric.trend).toEqual({ direction: "unknown", pct: null });
  });

  it("does not coerce undefined to 0", () => {
    const metric = buildMetric({
      id: "attendance.rate",
      name: "Attendance Rate",
      domain: "attendance",
      source: "test",
      value: undefined,
    });
    expect(metric.value).toBeNull();
    expect(metric.confidence).toBe("Unknown");
  });

  it("keeps explicit 0 when observed", () => {
    const metric = buildMetric({
      id: "operations.scheduling_conflicts",
      name: "Open Scheduling Conflicts",
      domain: "operations",
      source: "test",
      value: 0,
      zeroIsValid: true,
      confidence: "High",
    });
    expect(metric.value).toBe(0);
    expect(metric.confidence).toBe("High");
  });
});

describe("resolveConfidence / resolveTrend / status helpers", () => {
  it("defaults confidence to Unknown when value is null", () => {
    expect(resolveConfidence(null)).toBe("Unknown");
    expect(resolveConfidence(10)).toBe("High");
    expect(resolveConfidence(10, "Low")).toBe("Low");
  });

  it("derives trend direction from pct", () => {
    expect(trendFromPct(5)).toEqual({ direction: "up", pct: 5 });
    expect(trendFromPct(-3)).toEqual({ direction: "down", pct: -3 });
    expect(trendFromPct(0)).toEqual({ direction: "flat", pct: 0 });
    expect(trendFromPct(null)).toEqual({ direction: "unknown", pct: null });
  });

  it("resolves partial trend objects", () => {
    expect(resolveTrend({ pct: 2 }, 100)).toEqual({ direction: "up", pct: 2 });
    expect(resolveTrend(null, null)).toEqual({ direction: "unknown", pct: null });
  });

  it("scores higher-is-better thresholds", () => {
    expect(statusFromHigherIsBetter(96, 95, 90, 85)).toBe("healthy");
    expect(statusFromHigherIsBetter(92, 95, 90, 85)).toBe("watch");
    expect(statusFromHigherIsBetter(87, 95, 90, 85)).toBe("at_risk");
    expect(statusFromHigherIsBetter(80, 95, 90, 85)).toBe("critical");
    expect(statusFromHigherIsBetter(null, 95, 90, 85)).toBe("unknown");
  });
});

describe("scope filters", () => {
  it("normalizes network/region/campus/program/organization filters", () => {
    const scope = resolveExecutiveMetricsScope({
      networkId: "net-1",
      regionId: "reg-1",
      campusId: "camp-1",
      programId: "prog-1",
      program: "Virtual",
      organizationId: "org-1",
      schoolId: "school-1",
    });
    expect(scope.networkId).toBe("net-1");
    expect(scope.regionId).toBe("reg-1");
    expect(scope.campusId).toBe("camp-1");
    expect(scope.programId).toBe("prog-1");
    expect(scope.program).toBe("Virtual");
    expect(scope.organizationId).toBe("org-1");
    expect(scope.schoolId).toBe("school-1");
  });

  it("uses campusId as school scope alias when schoolId is absent", () => {
    expect(resolveSchoolScopeId(resolveExecutiveMetricsScope({ campusId: "c-1" }))).toBe("c-1");
    expect(resolveSchoolScopeId(resolveExecutiveMetricsScope({ schoolId: "s-1", campusId: "c-1" }))).toBe(
      "s-1"
    );
  });
});

describe("providers — missing sources yield Unknown", () => {
  it("enrollment provider returns Unknown when dashboard/command center missing", () => {
    const metrics = provideEnrollmentMetrics(emptySources());
    expect(metrics.length).toBeGreaterThan(0);
    for (const m of metrics) {
      expect(m.value).toBeNull();
      expect(m.confidence).toBe("Unknown");
      expect(m.status).toBe("unknown");
    }
  });

  it("finance provider keeps FI metrics Unknown without school FI payload", () => {
    const metrics = provideFinanceMetrics(
      emptySources({
        finance: {
          totalBilled: 1000,
          totalCollected: 900,
          outstanding: 100,
          scholarshipsAwarded: 0,
          stateFundingApplied: 0,
          revenueByProgram: {},
          aging: { current: 100, days30: 0, days60: 0, days90plus: 0 },
          collectionRate: 90,
          tuitionYield: 85,
          forecastAccuracy: null,
          forecast: null,
          invoiceCount: 5,
          overdueCount: 1,
        },
        financialIntelligence: null,
      })
    );

    const collection = metrics.find((m) => m.id === "finance.collection_rate");
    const ebitda = metrics.find((m) => m.id === "finance.ebitda");
    expect(collection?.value).toBe(90);
    expect(collection?.confidence).toBe("High");
    expect(ebitda?.value).toBeNull();
    expect(ebitda?.confidence).toBe("Unknown");
  });

  it("treats empty invoice set as Unknown collection rate (not 0)", () => {
    const metrics = provideFinanceMetrics(
      emptySources({
        finance: {
          totalBilled: 0,
          totalCollected: 0,
          outstanding: 0,
          scholarshipsAwarded: 0,
          stateFundingApplied: 0,
          revenueByProgram: {},
          aging: { current: 0, days30: 0, days60: 0, days90plus: 0 },
          collectionRate: 0,
          tuitionYield: 0,
          forecastAccuracy: null,
          forecast: null,
          invoiceCount: 0,
          overdueCount: 0,
        },
      })
    );
    const collection = metrics.find((m) => m.id === "finance.collection_rate");
    expect(collection?.value).toBeNull();
    expect(collection?.confidence).toBe("Unknown");
  });
});

describe("assembleExecutiveAggregateMetrics", () => {
  it("aggregates all domains in canonical order", () => {
    const aggregate = assembleExecutiveAggregateMetrics(
      emptySources({
        dashboard: {
          enrollment: 120,
          activeStudents: 118,
          admissionsPipeline: 40,
          scholarshipsAwarded: 5,
          employees: 22,
          revenue: 50000,
        },
        commandCenter: {
          enrollment: 120,
          enrollmentTrendPct: 4,
          admissionsPipeline: 40,
          revenue: 50000,
          cashFlow: 12000,
          accountsReceivable: 3000,
          scholarships: 5,
          stateFunding: 2000,
          avgSuccessScore: 81,
          attendanceRate: 94,
          academicGrowthPct: 6,
          interventionEffectiveness: 70,
          staffingLevels: 22,
          payrollYtd: 200000,
          complianceAlerts: 1,
          missionControlOpen: 8,
          missionControlCritical: 2,
        },
      })
    );

    expect(Object.keys(aggregate.domains)).toEqual(EXECUTIVE_METRIC_DOMAIN_ORDER);
    expect(aggregate.metrics.length).toBeGreaterThan(10);
    expect(getMetricById(aggregate, "enrollment.active_enrollments")?.value).toBe(120);
    expect(getMetricById(aggregate, "enrollment.trend_pct")?.trend.direction).toBe("up");
    expect(getMetricById(aggregate, "attendance.rate")?.value).toBe(94);
    expect(getMetricsByDomain(aggregate, "attendance").length).toBeGreaterThanOrEqual(1);

    // Missing admissions source → Unknown, not 0
    expect(getMetricById(aggregate, "admissions.acceptance_rate")?.confidence).toBe("Unknown");
    expect(getMetricById(aggregate, "admissions.acceptance_rate")?.value).toBeNull();
  });

  it("supports domain subset filtering", () => {
    const aggregate = assembleExecutiveAggregateMetrics(emptySources(), ["attendance", "compliance"]);
    expect(aggregate.metrics.every((m) => m.domain === "attendance" || m.domain === "compliance")).toBe(
      true
    );
    expect(aggregate.domains.enrollment).toEqual([]);
  });

  it("exposes required metric fields on every row", () => {
    const aggregate = assembleExecutiveAggregateMetrics(emptySources());
    for (const metric of aggregate.metrics) {
      expect(metric).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          status: expect.any(String),
          lastUpdated: expect.any(String),
          source: expect.any(String),
          confidence: expect.any(String),
        })
      );
      expect(metric.trend).toEqual(
        expect.objectContaining({
          direction: expect.any(String),
        })
      );
      expect(["High", "Medium", "Low", "Unknown"]).toContain(metric.confidence);
    }
  });
});
