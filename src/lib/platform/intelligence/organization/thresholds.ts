/**
 * Organizational Intelligence — thresholds.
 */

import type {
  OrganizationMetricSample,
  OrganizationMonitorKey,
  OrganizationThreshold,
  OrganizationAlertSeverity,
} from "@/lib/platform/intelligence/organization/types";

/** Default thresholds for common organizational metrics. */
export const DEFAULT_ORGANIZATION_THRESHOLDS: readonly OrganizationThreshold[] = [
  { monitor: "enrollment", metricKey: "enrollment_count", warnBelow: 0.95, criticalBelow: 0.9 },
  { monitor: "attendance", metricKey: "attendance_rate", warnBelow: 92, criticalBelow: 88 },
  { monitor: "academics", metricKey: "proficiency_rate", warnBelow: 70, criticalBelow: 60 },
  { monitor: "finance", metricKey: "budget_variance_pct", warnAbove: 8, criticalAbove: 15 },
  { monitor: "cash_flow", metricKey: "days_cash", warnBelow: 60, criticalBelow: 45 },
  { monitor: "hr", metricKey: "vacancy_rate", warnAbove: 8, criticalAbove: 12 },
  { monitor: "operations", metricKey: "cycle_time_days", warnAbove: 10, criticalAbove: 14 },
  { monitor: "compliance", metricKey: "open_findings", warnAbove: 2, criticalAbove: 5 },
  {
    monitor: "customer_satisfaction",
    metricKey: "satisfaction_score",
    warnBelow: 3.8,
    criticalBelow: 3.4,
  },
  { monitor: "mission", metricKey: "mission_index", warnBelow: 70, criticalBelow: 55 },
  { monitor: "partnerships", metricKey: "active_partners", warnBelow: 3, criticalBelow: 1 },
  { monitor: "board_goals", metricKey: "board_goal_progress", warnBelow: 50, criticalBelow: 30 },
  {
    monitor: "strategic_goals",
    metricKey: "strategic_goal_progress",
    warnBelow: 50,
    criticalBelow: 30,
  },
  { monitor: "executive_kpis", metricKey: "kpi_on_track_pct", warnBelow: 70, criticalBelow: 55 },
  {
    monitor: "goal_execution",
    metricKey: "execution_health",
    warnBelow: 60,
    criticalBelow: 40,
  },
];

export interface OrganizationThresholdsDependencies {
  defaults?: readonly OrganizationThreshold[];
}

/**
 * Configurable threshold evaluation.
 */
export class OrganizationThresholds {
  private readonly defaults: readonly OrganizationThreshold[];

  constructor(dependencies: OrganizationThresholdsDependencies = {}) {
    this.defaults = dependencies.defaults ?? DEFAULT_ORGANIZATION_THRESHOLDS;
  }

  resolve(
    monitor: OrganizationMonitorKey,
    metricKey: string,
    overrides: readonly OrganizationThreshold[] = []
  ): OrganizationThreshold | null {
    const fromOverride = overrides.find(
      (t) => t.monitor === monitor && t.metricKey === metricKey
    );
    if (fromOverride) return fromOverride;
    return (
      this.defaults.find((t) => t.monitor === monitor && t.metricKey === metricKey) ??
      null
    );
  }

  evaluate(
    monitor: OrganizationMonitorKey,
    sample: OrganizationMetricSample,
    overrides: readonly OrganizationThreshold[] = []
  ): OrganizationAlertSeverity {
    const threshold = this.resolve(monitor, sample.key, overrides);
    if (!threshold) return "informational";

    const value = sample.value;
    if (
      (threshold.criticalBelow !== undefined && value < threshold.criticalBelow) ||
      (threshold.criticalAbove !== undefined && value > threshold.criticalAbove) ||
      (threshold.min !== undefined && value < threshold.min) ||
      (threshold.max !== undefined && value > threshold.max)
    ) {
      return "critical";
    }
    if (
      (threshold.warnBelow !== undefined && value < threshold.warnBelow) ||
      (threshold.warnAbove !== undefined && value > threshold.warnAbove)
    ) {
      return "high";
    }
    return "informational";
  }

  listDefaults(): readonly OrganizationThreshold[] {
    return this.defaults;
  }
}
