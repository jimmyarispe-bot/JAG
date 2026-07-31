import type { FounderMetric, FounderMetricKey } from "@/lib/platform/founder/types";
import type { ForecastingHistoryBundle } from "@/lib/platform/intelligence/forecasting/types";
import {
  AutomationRepository,
  DecisionRepository,
} from "@/lib/platform/persistence";

function metricValue(
  metrics: FounderMetric[],
  key: FounderMetricKey
): number | null {
  const hit = metrics.find((m) => m.key === key);
  return typeof hit?.value === "number" ? hit.value : null;
}

/**
 * Build forecasting history from Founder metrics + Sprint 069 repositories.
 * Does not reimplement persistence queries — uses DecisionRepository / AutomationRepository.
 */
export function buildForecastingHistory(input: {
  organizationId?: string | null;
  metrics: FounderMetric[];
  observedAt: string;
  /** Optional prior-period values (when available from callers). */
  prior?: Partial<{
    activeStudents: number;
    activeStaff: number;
    newApplications: number;
    tuitionCollected: number;
    outstandingBalances: number;
    acceptanceRate: number;
  }>;
}): ForecastingHistoryBundle {
  const organizationId = input.organizationId ?? null;
  const decisions = DecisionRepository.list(
    organizationId === undefined ? undefined : organizationId
  );
  const runs = AutomationRepository.listRuns(100);

  const openDecisions = decisions.filter(
    (d) => d.status !== "completed" && d.status !== "dismissed"
  ).length;
  const completedDecisions = decisions.filter(
    (d) => d.status === "completed"
  ).length;
  const orgRuns = runs.filter((r) => {
    // Runs are global in memory; prefer all as operational context.
    void r;
    return true;
  });

  const activeStudents = metricValue(input.metrics, "active_students");
  const enrollmentTrendPct = metricValue(input.metrics, "enrollment_trend");
  const newApplications = metricValue(input.metrics, "new_applications");
  const tuitionCollected = metricValue(input.metrics, "tuition_collected");

  // Infer prior levels from current × trend when an explicit prior is not supplied.
  // Formula: prior = current / (1 + trendPct/100) — fully deterministic and disclosed in explanations.
  const inferredStudentPrior =
    input.prior?.activeStudents ??
    (activeStudents != null &&
    enrollmentTrendPct != null &&
    enrollmentTrendPct !== -100
      ? activeStudents / (1 + enrollmentTrendPct / 100)
      : null);

  return {
    organizationId,
    observedAt: input.observedAt,
    current: {
      activeStudents,
      activeStaff: metricValue(input.metrics, "active_staff"),
      newApplications,
      enrollmentTrendPct,
      attendance: metricValue(input.metrics, "attendance"),
      tuitionCollected,
      outstandingBalances: metricValue(input.metrics, "outstanding_balances"),
    },
    prior: {
      activeStudents: inferredStudentPrior,
      activeStaff: input.prior?.activeStaff ?? null,
      newApplications: input.prior?.newApplications ?? null,
      tuitionCollected: input.prior?.tuitionCollected ?? null,
      outstandingBalances: input.prior?.outstandingBalances ?? null,
      acceptanceRate: input.prior?.acceptanceRate ?? null,
    },
    operational: {
      openDecisions,
      completedDecisions,
      automationRuns: orgRuns.length,
      automationFailures: orgRuns.filter(
        (r) => r.status === "failed" || r.status === "partial"
      ).length,
    },
  };
}
