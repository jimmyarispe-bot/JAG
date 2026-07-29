/**
 * Decision execution metrics for the Executive Overview dashboard.
 * Derived from projected cards + application execution metadata only.
 */

import {
  getDecisionCompletedAt,
  getDecisionOutcome,
  isDecisionOverdue,
} from "./execution-store";
import type {
  JagDecisionCard,
  JagDecisionExecutionMetrics,
} from "./types";

const OPEN_STATUSES = new Set([
  "New",
  "Reviewing",
  "Approved",
  "Assigned",
  "In Progress",
  "Deferred",
]);

const ASSIGNED_STATUSES = new Set(["Assigned", "In Progress"]);

function startOfWeekUtc(now: Date): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const day = d.getUTCDay(); // 0 Sun
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

export function computeDecisionExecutionMetrics(
  decisions: readonly JagDecisionCard[],
  now = new Date()
): JagDecisionExecutionMetrics {
  const weekStart = startOfWeekUtc(now).getTime();
  let openDecisions = 0;
  let assigned = 0;
  let overdue = 0;
  let completedThisWeek = 0;
  let successes = 0;
  let failures = 0;
  let outcomeReviewedCount = 0;

  for (const d of decisions) {
    if (OPEN_STATUSES.has(d.status)) openDecisions += 1;

    if (ASSIGNED_STATUSES.has(d.status) || d.assignment) {
      assigned += 1;
    }

    if (isDecisionOverdue(d.id, d.status, now) || d.isOverdue) {
      overdue += 1;
    }

    if (d.status === "Completed" || d.status === "Outcome Reviewed") {
      const completedAt = getDecisionCompletedAt(d.id);
      if (completedAt) {
        const t = Date.parse(completedAt);
        if (!Number.isNaN(t) && t >= weekStart) completedThisWeek += 1;
      }
    }

    const outcome = getDecisionOutcome(d.id);
    if (outcome) {
      outcomeReviewedCount += 1;
      if (outcome.result === "success") successes += 1;
      else failures += 1;
    } else if (d.outcomeResult) {
      outcomeReviewedCount += 1;
      if (d.outcomeResult === "success") successes += 1;
      else failures += 1;
    }
  }

  const reviewed = successes + failures;
  return {
    openDecisions,
    assigned,
    overdue,
    completedThisWeek,
    outcomeSuccessRate: reviewed === 0 ? null : successes / reviewed,
    outcomeReviewedCount,
  };
}
