import { buildMetric, trendFromPct } from "@/lib/platform/executive-metrics/metric";
import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type { ExecutiveMetricsSourceBundle } from "@/lib/platform/executive-metrics/sources";

/** Enrollment domain — Students / SIS + Command Center. */
export function provideEnrollmentMetrics(sources: ExecutiveMetricsSourceBundle): ExecutiveMetric[] {
  const now = sources.loadedAt;
  const home = sources.dashboard;
  const cc = sources.commandCenter;

  const enrollment = home?.enrollment ?? cc?.enrollment ?? null;
  const activeStudents = home?.activeStudents ?? null;
  const trendPct = cc?.enrollmentTrendPct ?? null;

  return [
    buildMetric({
      id: "enrollment.active_enrollments",
      name: "Active Enrollments",
      domain: "enrollment",
      source: "dashboard.metrics / command-center",
      value: enrollment,
      unit: "count",
      zeroIsValid: true,
      confidence: enrollment == null ? undefined : "High",
      trend: trendFromPct(trendPct),
      lastUpdated: now,
    }),
    buildMetric({
      id: "enrollment.active_students",
      name: "Active Students",
      domain: "enrollment",
      source: "dashboard.metrics",
      value: activeStudents,
      unit: "count",
      zeroIsValid: true,
      confidence: activeStudents == null ? undefined : "High",
      lastUpdated: now,
    }),
    buildMetric({
      id: "enrollment.trend_pct",
      name: "Enrollment Trend",
      domain: "enrollment",
      source: "command-center",
      value: trendPct,
      unit: "percent",
      zeroIsValid: true,
      confidence: trendPct == null ? undefined : "Medium",
      trend: trendFromPct(trendPct),
      lastUpdated: now,
    }),
  ];
}
