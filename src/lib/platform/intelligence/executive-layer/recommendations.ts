import type {
  IntelligenceRecommendation,
  IntelligenceSignal,
  PrioritizedInsight,
} from "@/lib/platform/intelligence/executive-layer/types";

function actionForInsight(
  insight: PrioritizedInsight,
  signals: IntelligenceSignal[]
): string | null {
  const signal = signals.find((s) => insight.signalIds.includes(s.id));
  if (!signal || signal.value == null) return null;

  switch (signal.key) {
    case "admissions.stalled_applications":
      return `Review ${signal.value} application${signal.value === 1 ? "" : "s"} awaiting approval.`;
    case "admissions.new_applications":
      return signal.previousValue != null && signal.value > signal.previousValue
        ? `Allocate admissions capacity for ${signal.value} new application${signal.value === 1 ? "" : "s"}.`
        : `Monitor admissions intake (${signal.value} new application${signal.value === 1 ? "" : "s"}).`;
    case "finance.outstanding_balances":
      return `Follow up on outstanding tuition balances (${signal.value}).`;
    case "finance.tuition_collection_rate":
      return `Review tuition collection performance (rate ${signal.value}%).`;
    case "staff.missing_timesheets":
      return `Follow up on ${signal.value} missing timesheet${signal.value === 1 ? "" : "s"}.`;
    case "staff.open_positions":
      return `Advance hiring for ${signal.value} open position${signal.value === 1 ? "" : "s"}.`;
    case "technology.failed_jobs":
      return `Investigate ${signal.value} failed background job${signal.value === 1 ? "" : "s"}.`;
    case "technology.auth_failures":
      return `Investigate ${signal.value} authentication failure${signal.value === 1 ? "" : "s"}.`;
    case "platform.migration_pending":
      return `Schedule application of ${signal.value} pending migration${signal.value === 1 ? "" : "s"}.`;
    case "platform.background_job_health":
      return `Inspect background job health (score ${signal.value}).`;
    case "students.attendance_rate":
      return `Review attendance patterns (rate ${signal.value}%).`;
    case "students.enrollment_change":
      return `Review enrollment change (active students ${signal.value}).`;
    case "admissions.acceptance_rate":
      return `Review admissions acceptance rate (${signal.value}%).`;
    default:
      return null;
  }
}

/**
 * Produce recommended next actions.
 * Every recommendation is traceable to underlying signal + insight ids.
 */
export function generateRecommendations(
  priorities: PrioritizedInsight[],
  signals: IntelligenceSignal[]
): IntelligenceRecommendation[] {
  const recommendations: IntelligenceRecommendation[] = [];
  const seenActions = new Set<string>();

  for (const insight of priorities) {
    if (insight.priority === "low" && priorities.length > 5) {
      // Keep output concise when many lows exist — still include critical/high/medium.
      continue;
    }
    const action = actionForInsight(insight, signals);
    if (!action || seenActions.has(action)) continue;
    seenActions.add(action);

    recommendations.push({
      id: `rec:${insight.id}`,
      action,
      priority: insight.priority,
      signalIds: [...insight.signalIds],
      insightIds: [insight.id],
      domain: insight.domain,
    });
  }

  return recommendations.sort((a, b) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 };
    if (rank[b.priority] !== rank[a.priority]) {
      return rank[b.priority] - rank[a.priority];
    }
    return a.id.localeCompare(b.id);
  });
}
