/**
 * Bind Command Center stores → PredictionContext.
 * Application adapter only — no Core/Runtime changes.
 */

import {
  type PredictionContext,
  type PredictionSignal,
} from "@/lib/platform/intelligence/predictive";
import type { JagDecisionCard } from "../decision-center/types";
import {
  getStoredSchoolHealth,
  listStoredExecutions,
  type JagStoredExecution,
} from "../intelligence-store";

const CLOSED = new Set([
  "Completed",
  "Outcome Reviewed",
  "Dismissed",
  "Deferred",
]);

export function buildPredictionContext(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly decisions?: readonly JagDecisionCard[];
}): PredictionContext {
  const executions = listStoredExecutions(input.organizationId, 40);
  const health = getStoredSchoolHealth(input.organizationId);
  const signals = mergeSignals(executions, health);

  const orgDecisions = (input.decisions ?? []).filter(
    (d) => d.organizationId === input.organizationId
  );
  const open = orgDecisions.filter((d) => !CLOSED.has(d.status));
  const overdue = open.filter((d) => d.isOverdue);
  const p1 = open.filter((d) => d.priority === "P1");
  const completed = orgDecisions.filter(
    (d) => d.status === "Completed" || d.status === "Outcome Reviewed"
  );

  return {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    capturedAt: new Date().toISOString(),
    signals,
    openDecisionCount: open.length,
    overdueDecisionCount: overdue.length,
    p1DecisionCount: p1.length,
    completedDecisionCount: completed.length,
  };
}

function mergeSignals(
  executions: readonly JagStoredExecution[],
  health: ReturnType<typeof getStoredSchoolHealth>
): PredictionSignal[] {
  const byContributor = new Map<string, PredictionSignal>();

  for (const e of executions) {
    const existing = byContributor.get(e.contributorId);
    if (existing && existing.analyzedAt >= e.analyzedAt) continue;
    byContributor.set(e.contributorId, {
      id: e.id,
      contributorId: e.contributorId,
      label: e.label,
      readiness: e.detail?.readiness,
      confidence: e.confidence,
      summary: e.resultSummary,
      warnings: e.detail?.warnings ?? [],
      blockingIssues: e.detail?.blockingIssues ?? [],
      analyzedAt: e.analyzedAt,
      score:
        typeof e.detail?.attributes?.healthScore === "number"
          ? e.detail.attributes.healthScore
          : typeof e.detail?.attributes?.score === "number"
            ? e.detail.attributes.score
            : undefined,
      attributes: e.detail?.attributes,
    });
  }

  if (health) {
    const id = "education.cognition.school_health";
    byContributor.set(id, {
      id: `health-${health.organizationId}`,
      contributorId: id,
      label: "School Health",
      confidence: health.confidence,
      summary: health.explanation,
      warnings: [],
      blockingIssues: [],
      analyzedAt: health.capturedAt,
      score: health.healthScore,
      attributes: {
        stance: health.stance,
        riskLevel: health.riskLevel,
        trend: health.trend,
      },
    });
  }

  return [...byContributor.values()].sort((a, b) =>
    b.analyzedAt.localeCompare(a.analyzedAt)
  );
}
