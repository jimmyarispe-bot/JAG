/**
 * Adapters from Sprint 002 aggregate metrics → legacy CommandCenterMetrics shape.
 * Keeps existing UI components working without duplicate domain queries.
 */
import type { CommandCenterMetrics } from "@/lib/executive/types";
import type { ExecutiveAggregateMetrics } from "@/lib/platform/executive-metrics";

function num(aggregate: ExecutiveAggregateMetrics | null, id: string): number {
  const v = aggregate?.byId[id]?.value;
  return v == null || Number.isNaN(v) ? 0 : v;
}

function numOrNull(aggregate: ExecutiveAggregateMetrics | null, id: string): number | null {
  const v = aggregate?.byId[id]?.value;
  return v == null || Number.isNaN(v) ? null : v;
}

/**
 * Map Executive Aggregate Metrics into the legacy Command Center DTO.
 * Prefer this over calling getCommandCenterMetrics when aggregate is already loaded.
 */
export function aggregateToCommandCenterMetrics(
  aggregate: ExecutiveAggregateMetrics | null,
  extras?: {
    missionControlOpen?: number;
    missionControlCritical?: number;
    enrollmentTrendPct?: number | null;
  }
): CommandCenterMetrics {
  return {
    enrollment: num(aggregate, "enrollment.active_enrollments"),
    enrollmentTrendPct:
      extras?.enrollmentTrendPct ??
      aggregate?.byId["enrollment.active_enrollments"]?.trend.pct ??
      null,
    admissionsPipeline: num(aggregate, "admissions.pipeline_active"),
    revenue: num(aggregate, "finance.total_collected"),
    cashFlow: num(aggregate, "finance.cash_position"),
    accountsReceivable: num(aggregate, "finance.accounts_receivable"),
    scholarships: 0,
    stateFunding: 0,
    avgSuccessScore: null,
    attendanceRate: numOrNull(aggregate, "attendance.rate"),
    academicGrowthPct: null,
    interventionEffectiveness: null,
    staffingLevels: num(aggregate, "staffing.headcount_active"),
    payrollYtd: num(aggregate, "staffing.payroll_ytd"),
    complianceAlerts: num(aggregate, "compliance.overdue_obligations"),
    missionControlOpen:
      extras?.missionControlOpen ?? num(aggregate, "operations.mission_control_open"),
    missionControlCritical:
      extras?.missionControlCritical ??
      num(aggregate, "operations.mission_control_overdue"),
  };
}
