/**
 * Organizational Intelligence — monitors.
 */

import type { OrganizationThresholds } from "@/lib/platform/intelligence/organization/thresholds";
import {
  ORGANIZATION_MONITOR_KEYS,
  type OrganizationAlertSeverity,
  type OrganizationMetricSample,
  type OrganizationMonitorKey,
  type OrganizationMonitorReading,
  type OrganizationObservationRequest,
  type OrganizationThreshold,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationMonitorsDependencies {
  thresholds: OrganizationThresholds;
}

const MONITOR_METRIC_HINTS: Readonly<
  Record<OrganizationMonitorKey, readonly string[]>
> = {
  enrollment: ["enrollment", "admit", "funnel"],
  attendance: ["attendance"],
  academics: ["academic", "proficiency", "learning"],
  finance: ["finance", "budget", "revenue"],
  cash_flow: ["cash", "runway", "liquidity"],
  hr: ["hr", "staff", "vacancy", "retention", "hiring"],
  operations: ["operations", "cycle", "throughput"],
  compliance: ["compliance", "audit", "finding"],
  customer_satisfaction: ["satisfaction", "nps", "family", "customer"],
  mission: ["mission", "impact", "equity"],
  partnerships: ["partner", "partnership"],
  board_goals: ["board"],
  strategic_goals: ["strategic"],
  executive_kpis: ["kpi", "executive"],
  goal_execution: ["execution", "initiative", "goal_health"],
};

/**
 * Evaluates organizational monitors from metric samples + integrations.
 */
export class OrganizationMonitors {
  private readonly thresholds: OrganizationThresholds;

  constructor(dependencies: OrganizationMonitorsDependencies) {
    this.thresholds = dependencies.thresholds;
  }

  listKeys(): readonly OrganizationMonitorKey[] {
    return ORGANIZATION_MONITOR_KEYS;
  }

  evaluate(request: OrganizationObservationRequest): OrganizationMonitorReading[] {
    const samples = this.collectSamples(request);
    const overrides = request.thresholds ?? [];

    return ORGANIZATION_MONITOR_KEYS.map((monitor) => {
      const metrics = samples.filter((sample) =>
        this.belongsToMonitor(monitor, sample, overrides)
      );
      const severities = metrics.map((metric) =>
        this.thresholds.evaluate(monitor, metric, overrides)
      );
      const status = worstSeverity(severities);
      const score = scoreFromMetrics(metrics, severities);
      const notes =
        metrics.length === 0
          ? [`No direct metrics for ${monitor}; using neutral baseline`]
          : metrics.map(
              (m) =>
                `${m.label}: ${m.value}${m.unit ? ` ${m.unit}` : ""} (${this.thresholds.evaluate(monitor, m, overrides)})`
            );

      return {
        monitor,
        status,
        score,
        metrics,
        notes,
      };
    });
  }

  private collectSamples(
    request: OrganizationObservationRequest
  ): OrganizationMetricSample[] {
    const observedAt = request.observedAt ?? new Date().toISOString();
    const samples: OrganizationMetricSample[] = [...(request.metrics ?? [])];

    for (const progress of request.executionProgress ?? []) {
      samples.push({
        key: "execution_health",
        label: `Execution ${progress.subjectKind}`,
        value: progress.healthScore,
        previousValue: undefined,
        unit: "score",
        observedAt: progress.calculatedAt,
        metadata: { subjectId: progress.subjectId },
      });
      samples.push({
        key: "execution_completion",
        label: "Execution completion",
        value: progress.completionPercent,
        unit: "%",
        observedAt: progress.calculatedAt,
      });
    }

    if (request.strategic?.goals.length) {
      const avg =
        request.strategic.goals.reduce((sum, g) => sum + g.confidence.value, 0) /
        request.strategic.goals.length;
      samples.push({
        key: "strategic_goal_progress",
        label: "Strategic goal confidence",
        value: Math.round(avg * 100),
        unit: "%",
        observedAt,
      });
    }

    if (request.executive) {
      samples.push({
        key: "kpi_on_track_pct",
        label: "Executive classification confidence",
        value: Math.round(request.executive.classification.confidence.value * 100),
        unit: "%",
        observedAt,
      });
    }

    if (request.collaboration) {
      samples.push({
        key: "collaboration_confidence",
        label: "Collaboration confidence",
        value: Math.round(request.collaboration.confidence.score.value * 100),
        unit: "%",
        observedAt,
      });
    }

    if (request.sharedContext?.finance?.cashPosition != null) {
      samples.push({
        key: "days_cash",
        label: "Cash position proxy",
        value: request.sharedContext.finance.cashPosition,
        unit: "USD",
        observedAt,
      });
    }

    if (request.sharedContext?.student?.attendanceRate != null) {
      samples.push({
        key: "attendance_rate",
        label: "Attendance rate",
        value: request.sharedContext.student.attendanceRate,
        unit: "%",
        observedAt,
      });
    }

    if (request.sharedContext?.student?.enrollmentCount != null) {
      samples.push({
        key: "enrollment_count",
        label: "Enrollment count",
        value: request.sharedContext.student.enrollmentCount,
        observedAt,
      });
    }

    return samples;
  }

  private belongsToMonitor(
    monitor: OrganizationMonitorKey,
    sample: OrganizationMetricSample,
    overrides: readonly OrganizationThreshold[]
  ): boolean {
    if (
      overrides.some((t) => t.monitor === monitor && t.metricKey === sample.key) ||
      this.thresholds.resolve(monitor, sample.key, overrides)
    ) {
      return true;
    }
    const hints = MONITOR_METRIC_HINTS[monitor];
    const corpus = `${sample.key} ${sample.label}`.toLowerCase();
    return hints.some((hint) => corpus.includes(hint));
  }
}

function worstSeverity(
  severities: readonly OrganizationAlertSeverity[]
): OrganizationAlertSeverity {
  const order: OrganizationAlertSeverity[] = [
    "critical",
    "high",
    "medium",
    "low",
    "informational",
  ];
  for (const severity of order) {
    if (severities.includes(severity)) return severity;
  }
  return "informational";
}

function scoreFromMetrics(
  metrics: readonly OrganizationMetricSample[],
  severities: readonly OrganizationAlertSeverity[]
): number {
  if (metrics.length === 0) return 70;
  const penalty = severities.reduce((sum, severity) => {
    switch (severity) {
      case "critical":
        return sum + 25;
      case "high":
        return sum + 15;
      case "medium":
        return sum + 8;
      case "low":
        return sum + 3;
      default:
        return sum;
    }
  }, 0);
  return Math.max(0, Math.min(100, 100 - Math.round(penalty / Math.max(1, metrics.length))));
}
