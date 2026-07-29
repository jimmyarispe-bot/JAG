/**
 * Bind Command Center stores → ScenarioBaseline.
 */

import type {
  ScenarioBaseline,
  ScenarioBaselineSignal,
} from "@/lib/platform/intelligence/scenarios";
import type { JagDecisionCard } from "../decision-center/types";
import {
  getStoredSchoolHealth,
  listStoredExecutions,
} from "../intelligence-store";

const CLOSED = new Set([
  "Completed",
  "Outcome Reviewed",
  "Dismissed",
  "Deferred",
]);

export function buildScenarioBaseline(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly decisions?: readonly JagDecisionCard[];
}): ScenarioBaseline {
  const executions = listStoredExecutions(input.organizationId, 40);
  const health = getStoredSchoolHealth(input.organizationId);
  const signals: ScenarioBaselineSignal[] = [];

  for (const e of executions) {
    signals.push({
      id: e.id,
      contributorId: e.contributorId,
      label: e.label,
      confidence: e.confidence,
      summary: e.resultSummary,
      score:
        typeof e.detail?.attributes?.healthScore === "number"
          ? e.detail.attributes.healthScore
          : typeof e.detail?.attributes?.score === "number"
            ? e.detail.attributes.score
            : undefined,
      readiness: e.detail?.readiness,
      warnings: e.detail?.warnings ?? [],
      blockingIssues: e.detail?.blockingIssues ?? [],
    });
  }

  if (health) {
    signals.unshift({
      id: `health-${health.organizationId}`,
      contributorId: "education.cognition.school_health",
      label: "School Health",
      confidence: health.confidence,
      summary: health.explanation,
      score: health.healthScore,
      warnings: [],
      blockingIssues: [],
    });
  }

  const open = (input.decisions ?? []).filter(
    (d) =>
      d.organizationId === input.organizationId && !CLOSED.has(d.status)
  );

  return {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    capturedAt: new Date().toISOString(),
    signals,
    openDecisionCount: open.length,
    healthScore: health?.healthScore,
    healthStance: health?.stance != null ? String(health.stance) : undefined,
  };
}
