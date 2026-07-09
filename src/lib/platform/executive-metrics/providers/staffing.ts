import {
  buildMetric,
  statusFromHigherIsBetter,
  statusFromLowerIsBetter,
} from "@/lib/platform/executive-metrics/metric";
import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type { ExecutiveMetricsSourceBundle } from "@/lib/platform/executive-metrics/sources";

/** Staffing domain — HR workforce analytics. */
export function provideStaffingMetrics(sources: ExecutiveMetricsSourceBundle): ExecutiveMetric[] {
  const now = sources.loadedAt;
  const hr = sources.workforce;
  const cc = sources.commandCenter;
  const home = sources.dashboard;

  const staffingLevels = hr?.staffingLevels ?? cc?.staffingLevels ?? home?.employees ?? null;
  const turnover = hr?.turnoverRate ?? null;
  const retention =
    turnover == null ? null : Math.max(0, Math.min(100, 100 - turnover));

  return [
    buildMetric({
      id: "staffing.headcount_active",
      name: "Active Staff Headcount",
      domain: "staffing",
      source: "hr.analytics / command-center",
      value: staffingLevels,
      unit: "count",
      zeroIsValid: true,
      confidence: staffingLevels == null ? undefined : "High",
      lastUpdated: now,
    }),
    buildMetric({
      id: "staffing.vacancies",
      name: "Open Vacancies",
      domain: "staffing",
      source: "hr.analytics",
      value: hr?.vacancies ?? null,
      unit: "count",
      zeroIsValid: true,
      confidence: hr ? "Medium" : undefined,
      status: statusFromLowerIsBetter(hr?.vacancies ?? null, 2, 5, 10),
      lastUpdated: now,
    }),
    buildMetric({
      id: "staffing.turnover_rate",
      name: "Turnover Rate",
      domain: "staffing",
      source: "hr.analytics",
      value: turnover,
      unit: "percent",
      zeroIsValid: true,
      confidence: hr ? "Medium" : undefined,
      status: statusFromLowerIsBetter(turnover, 10, 20, 30),
      lastUpdated: now,
    }),
    buildMetric({
      id: "staffing.retention_rate",
      name: "Staff Retention Rate",
      domain: "staffing",
      source: "hr.analytics",
      value: retention,
      unit: "percent",
      zeroIsValid: true,
      confidence: retention == null ? undefined : "Medium",
      status: statusFromHigherIsBetter(retention, 90, 80, 70),
      lastUpdated: now,
    }),
    buildMetric({
      id: "staffing.expiring_certifications",
      name: "Expiring Certifications (90d)",
      domain: "staffing",
      source: "hr.analytics",
      value: hr?.expiringCertifications ?? null,
      unit: "count",
      zeroIsValid: true,
      confidence: hr ? "High" : undefined,
      status: statusFromLowerIsBetter(hr?.expiringCertifications ?? null, 0, 3, 8),
      lastUpdated: now,
    }),
    buildMetric({
      id: "staffing.payroll_ytd",
      name: "Payroll YTD",
      domain: "staffing",
      source: "hr.analytics / command-center",
      value: hr?.payrollCostsYtd ?? cc?.payrollYtd ?? null,
      unit: "currency",
      zeroIsValid: true,
      confidence: hr || cc ? "High" : undefined,
      lastUpdated: now,
    }),
  ];
}
