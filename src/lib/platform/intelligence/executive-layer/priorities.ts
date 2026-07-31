import { findSignal, pctChange } from "@/lib/platform/intelligence/executive-layer/signals";
import type {
  IntelligenceInsight,
  IntelligencePriorityLevel,
  IntelligenceSignal,
  PrioritizedInsight,
} from "@/lib/platform/intelligence/executive-layer/types";

const LEVEL_SCORE: Record<IntelligencePriorityLevel, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

function levelFromRules(
  insight: IntelligenceInsight,
  signals: IntelligenceSignal[]
): { level: IntelligencePriorityLevel; reason: string } {
  const primary = insight.signalIds[0]
    ? signals.find((s) => s.id === insight.signalIds[0])
    : undefined;

  if (!primary || primary.value == null) {
    return { level: "low", reason: "Insufficient signal value for elevated priority." };
  }

  // Critical rules
  if (
    primary.key === "admissions.stalled_applications" &&
    primary.value >= 3
  ) {
    return {
      level: "critical",
      reason: "Three or more applications stalled beyond seven days.",
    };
  }
  if (primary.key === "technology.auth_failures" && primary.value >= 10) {
    return {
      level: "critical",
      reason: "Authentication failures at or above 10.",
    };
  }
  if (primary.key === "technology.failed_jobs" && primary.value >= 5) {
    return {
      level: "critical",
      reason: "Failed jobs at or above 5.",
    };
  }
  if (
    primary.key === "finance.outstanding_balances" &&
    primary.previousValue != null &&
    pctChange(primary.value, primary.previousValue) >= 20
  ) {
    return {
      level: "critical",
      reason: "Outstanding balances increased by 20% or more.",
    };
  }
  if (
    primary.key === "platform.background_job_health" &&
    primary.value < 50
  ) {
    return {
      level: "critical",
      reason: "Background job health below 50.",
    };
  }

  // High rules
  if (
    primary.key === "admissions.stalled_applications" &&
    primary.value >= 1
  ) {
    return {
      level: "high",
      reason: "One or more applications stalled beyond seven days.",
    };
  }
  if (
    primary.key === "finance.outstanding_balances" &&
    primary.previousValue != null &&
    pctChange(primary.value, primary.previousValue) >= 8
  ) {
    return {
      level: "high",
      reason: "Outstanding balances increased by 8% or more.",
    };
  }
  if (primary.key === "staff.missing_timesheets" && primary.value >= 5) {
    return {
      level: "high",
      reason: "Five or more missing timesheets.",
    };
  }
  if (primary.key === "technology.failed_jobs" && primary.value >= 1) {
    return {
      level: "high",
      reason: "One or more failed jobs observed.",
    };
  }
  if (primary.key === "platform.migration_pending" && primary.value >= 1) {
    return {
      level: "high",
      reason: "Pending migrations observed.",
    };
  }

  // Medium rules
  if (
    primary.previousValue != null &&
    Math.abs(pctChange(primary.value, primary.previousValue)) >= 10
  ) {
    return {
      level: "medium",
      reason: "Period-over-period change of 10% or more.",
    };
  }
  if (primary.key === "staff.open_positions" && primary.value >= 1) {
    return {
      level: "medium",
      reason: "Open positions observed.",
    };
  }
  if (
    primary.key === "students.attendance_rate" &&
    primary.value < 90
  ) {
    return {
      level: "medium",
      reason: "Attendance rate below 90%.",
    };
  }

  return { level: "low", reason: "Informational observation within normal thresholds." };
}

/**
 * Rank insights deterministically by severity rules.
 */
export function prioritizeInsights(
  insights: IntelligenceInsight[],
  signals: IntelligenceSignal[]
): PrioritizedInsight[] {
  const ranked = insights.map((insight) => {
    const { level, reason } = levelFromRules(insight, signals);
    return {
      ...insight,
      priority: level,
      priorityScore: LEVEL_SCORE[level],
      priorityReason: reason,
    };
  });

  return ranked.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.id.localeCompare(b.id);
  });
}

export function highestPriority(
  priorities: PrioritizedInsight[]
): IntelligencePriorityLevel | null {
  return priorities[0]?.priority ?? null;
}

/** Re-export helper for recommendation engine. */
export { findSignal };
