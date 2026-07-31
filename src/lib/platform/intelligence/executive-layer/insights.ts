import { pctChange } from "@/lib/platform/intelligence/executive-layer/signals";
import type {
  IntelligenceAnomaly,
  IntelligenceInsight,
  IntelligenceSignal,
} from "@/lib/platform/intelligence/executive-layer/types";

function metricFromSignal(signal: IntelligenceSignal) {
  return {
    key: signal.key,
    label: signal.label,
    value: signal.value,
    unit: signal.unit,
  };
}

function deltaStatement(signal: IntelligenceSignal): string | null {
  if (signal.value == null || signal.previousValue == null) return null;
  const pct = pctChange(signal.value, signal.previousValue);
  const rounded = Math.abs(Math.round(pct));
  const direction = pct >= 0 ? "increased" : "decreased";
  const unitNote =
    signal.unit === "%"
      ? ` to ${signal.value}%`
      : signal.unit === "USD"
        ? ` to ${signal.value}`
        : ` to ${signal.value}`;

  if (signal.key === "admissions.new_applications") {
    return `Admissions applications ${direction} ${rounded}% compared with the prior period${unitNote}.`;
  }
  if (signal.key === "finance.outstanding_balances") {
    return `Outstanding tuition balances ${direction} by ${rounded}%.`;
  }
  if (signal.key === "students.enrollment_change") {
    return `Active student enrollment ${direction} ${rounded}% compared with the prior period${unitNote}.`;
  }
  if (signal.key === "students.attendance_rate") {
    return `Attendance rate ${direction} ${rounded}% compared with the prior period (now ${signal.value}%).`;
  }
  if (signal.key === "finance.tuition_collection_rate") {
    return `Tuition collection rate ${direction} ${rounded}% compared with the prior period (now ${signal.value}%).`;
  }
  if (signal.key === "admissions.acceptance_rate") {
    return `Acceptance rate ${direction} ${rounded}% compared with the prior period (now ${signal.value}%).`;
  }

  return `${signal.label} ${direction} ${rounded}% compared with the prior period.`;
}

function countStatement(signal: IntelligenceSignal): string | null {
  if (signal.value == null || signal.value <= 0) return null;

  switch (signal.key) {
    case "admissions.stalled_applications":
      return `${signal.value} application${signal.value === 1 ? " has" : "s have"} remained in Review for more than seven days.`;
    case "staff.open_positions":
      return `${signal.value} open staff position${signal.value === 1 ? " is" : "s are"} currently unfilled.`;
    case "staff.missing_timesheets":
      return `${signal.value} missing timesheet${signal.value === 1 ? "" : "s"} observed.`;
    case "technology.failed_jobs":
      return `${signal.value} failed background job${signal.value === 1 ? "" : "s"} observed.`;
    case "technology.auth_failures":
      return `${signal.value} authentication failure${signal.value === 1 ? "" : "s"} observed.`;
    case "platform.migration_pending":
      return `${signal.value} pending database migration${signal.value === 1 ? "" : "s"} observed.`;
    default:
      return null;
  }
}

/**
 * Convert signals (+ anomalies) into readable executive statements.
 * Template-driven — no LLM, no speculation.
 */
export function generateInsights(
  signals: IntelligenceSignal[],
  anomalies: IntelligenceAnomaly[] = []
): IntelligenceInsight[] {
  const anomaliesBySignal = new Map<string, IntelligenceAnomaly[]>();
  for (const a of anomalies) {
    const list = anomaliesBySignal.get(a.signalId) ?? [];
    list.push(a);
    anomaliesBySignal.set(a.signalId, list);
  }

  const insights: IntelligenceInsight[] = [];

  for (const signal of signals) {
    const statements: string[] = [];
    const delta = deltaStatement(signal);
    if (delta) statements.push(delta);
    const count = countStatement(signal);
    if (count) statements.push(count);

    if (
      signal.key === "platform.background_job_health" &&
      signal.value != null
    ) {
      statements.push(`Background job health score is ${signal.value}.`);
    }

    if (
      signal.key === "admissions.acceptance_rate" &&
      signal.value != null &&
      signal.previousValue == null
    ) {
      statements.push(`Acceptance rate is ${signal.value}%.`);
    }

    // Deduplicate while preserving order
    const unique = [...new Set(statements)];
    for (let i = 0; i < unique.length; i++) {
      const related = anomaliesBySignal.get(signal.id) ?? [];
      insights.push({
        id: `insight:${signal.key}:${i}`,
        domain: signal.domain,
        statement: unique[i]!,
        signalIds: [signal.id],
        anomalyIds: related.map((a) => a.id),
        supportingMetrics: [metricFromSignal(signal)],
      });
    }
  }

  return insights.sort((a, b) => a.id.localeCompare(b.id));
}
