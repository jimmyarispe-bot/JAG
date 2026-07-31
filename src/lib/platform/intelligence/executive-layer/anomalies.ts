import { pctChange } from "@/lib/platform/intelligence/executive-layer/signals";
import type {
  IntelligenceAnomaly,
  IntelligenceSignal,
  IntelligenceSignalKey,
} from "@/lib/platform/intelligence/executive-layer/types";

/** Absolute percent-change thresholds that qualify as anomalies (factual). */
const DELTA_THRESHOLDS: Partial<Record<IntelligenceSignalKey, number>> = {
  "admissions.new_applications": 10,
  "admissions.acceptance_rate": 5,
  "students.enrollment_change": 5,
  "students.attendance_rate": 3,
  "finance.outstanding_balances": 8,
  "finance.tuition_collection_rate": 5,
};

const COUNT_THRESHOLDS: Partial<Record<IntelligenceSignalKey, number>> = {
  "admissions.stalled_applications": 1,
  "staff.open_positions": 1,
  "staff.missing_timesheets": 1,
  "technology.failed_jobs": 1,
  "technology.auth_failures": 3,
  "platform.migration_pending": 1,
};

/**
 * Detect threshold-based anomalies from signals.
 * Observations only — no causal speculation.
 */
export function detectAnomalies(signals: IntelligenceSignal[]): IntelligenceAnomaly[] {
  const anomalies: IntelligenceAnomaly[] = [];

  for (const signal of signals) {
    if (signal.value == null) continue;

    const deltaThreshold = DELTA_THRESHOLDS[signal.key];
    if (
      deltaThreshold != null &&
      signal.previousValue != null
    ) {
      const magnitudePct = pctChange(signal.value, signal.previousValue);
      if (Math.abs(magnitudePct) >= deltaThreshold) {
        const direction = magnitudePct >= 0 ? "increased" : "decreased";
        anomalies.push({
          id: `anomaly:${signal.id}:delta`,
          signalId: signal.id,
          signalKey: signal.key,
          observation: `${signal.label} ${direction} by ${Math.abs(Math.round(magnitudePct))}% versus the prior period (threshold ${deltaThreshold}%).`,
          magnitudePct: Math.round(magnitudePct * 10) / 10,
          thresholdPct: deltaThreshold,
        });
      }
    }

    const countThreshold = COUNT_THRESHOLDS[signal.key];
    if (countThreshold != null && signal.value >= countThreshold) {
      anomalies.push({
        id: `anomaly:${signal.id}:count`,
        signalId: signal.id,
        signalKey: signal.key,
        observation: `${signal.label} observed at ${signal.value}${signal.unit === "count" ? "" : signal.unit ? ` ${signal.unit}` : ""} (threshold ${countThreshold}).`,
        magnitudePct: null,
        thresholdPct: countThreshold,
      });
    }

    if (
      signal.key === "platform.background_job_health" &&
      signal.value < 70
    ) {
      anomalies.push({
        id: `anomaly:${signal.id}:health`,
        signalId: signal.id,
        signalKey: signal.key,
        observation: `Background job health score is ${signal.value} (below 70).`,
        magnitudePct: null,
        thresholdPct: 70,
      });
    }
  }

  return anomalies.sort((a, b) => a.id.localeCompare(b.id));
}
