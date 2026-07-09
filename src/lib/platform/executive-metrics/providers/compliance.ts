import {
  buildMetric,
  statusFromHigherIsBetter,
  statusFromLowerIsBetter,
} from "@/lib/platform/executive-metrics/metric";
import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type { ExecutiveMetricsSourceBundle } from "@/lib/platform/executive-metrics/sources";

/** Compliance domain — compliance dashboard + command-center alert count. */
export function provideComplianceMetrics(sources: ExecutiveMetricsSourceBundle): ExecutiveMetric[] {
  const now = sources.loadedAt;
  const stats = sources.compliance;
  const ccAlerts = sources.commandCenter?.complianceAlerts ?? null;

  const overdue = stats?.overdue ?? null;
  const compliancePct = stats?.compliancePct ?? null;
  const critical = stats?.criticalCount ?? null;
  const alertCount = stats ? overdue : ccAlerts;

  return [
    buildMetric({
      id: "compliance.overdue_obligations",
      name: "Overdue Obligations",
      domain: "compliance",
      source: "compliance.queries / command-center",
      value: alertCount,
      unit: "count",
      zeroIsValid: true,
      confidence: alertCount == null ? undefined : "High",
      status: statusFromLowerIsBetter(alertCount, 0, 2, 5),
      lastUpdated: now,
    }),
    buildMetric({
      id: "compliance.completion_pct",
      name: "Compliance Completion",
      domain: "compliance",
      source: "compliance.queries",
      value: compliancePct,
      unit: "percent",
      zeroIsValid: true,
      // Empty obligation set yields 100% in domain service — mark Medium when no rows context.
      confidence: stats ? "Medium" : undefined,
      status: statusFromHigherIsBetter(compliancePct, 95, 85, 70),
      lastUpdated: now,
    }),
    buildMetric({
      id: "compliance.critical_count",
      name: "Critical Compliance Items",
      domain: "compliance",
      source: "compliance.queries",
      value: critical,
      unit: "count",
      zeroIsValid: true,
      confidence: stats ? "High" : undefined,
      status: statusFromLowerIsBetter(critical, 0, 1, 3),
      lastUpdated: now,
    }),
    buildMetric({
      id: "compliance.upcoming_30d",
      name: "Upcoming Obligations (30d)",
      domain: "compliance",
      source: "compliance.queries",
      value: stats?.upcoming ?? null,
      unit: "count",
      zeroIsValid: true,
      confidence: stats ? "High" : undefined,
      lastUpdated: now,
    }),
  ];
}
