/**
 * Aggregate diagnostic metrics for one Education intelligence run.
 */

import type { EducationContributorMetrics } from "./EducationContributorMetrics";
import { buildEducationContributorMetrics } from "./EducationContributorMetrics";

export interface EducationExecutionMetrics {
  executionDurationMs: number;
  contributorDurations: Readonly<Record<string, number>>;
  contributors: readonly EducationContributorMetrics[];
  recommendationCount: number;
  evidenceCount: number;
  actionProposalCount: number;
  failureCount: number;
  warningCount: number;
  skippedContributorCount: number;
  executedContributorCount: number;
  stageCount: number;
  graphRecommendationCount: number;
  graphEvidenceCount: number;
  graphActionProposalCount: number;
  graphWarningCount: number;
  graphConflictCount: number;
}

export function buildEducationExecutionMetrics(input: {
  durationMs: number;
  stageCount: number;
  records: ReadonlyArray<{
    contributorId: string;
    status: "executed" | "skipped" | "failed" | "skipped_dependent";
    reason?: string;
    durationMs?: number;
    stage?: number;
    result?: {
      evidence: readonly unknown[];
      recommendations: readonly unknown[];
      suggestedActions: readonly unknown[];
      warnings: readonly unknown[];
      blockingIssues: readonly unknown[];
    };
  }>;
  graph: {
    recommendations: readonly unknown[];
    evidence: readonly unknown[];
    suggestedActions: readonly unknown[];
    warnings: readonly unknown[];
    conflicts: readonly unknown[];
  };
}): EducationExecutionMetrics {
  const contributors = buildEducationContributorMetrics(input.records);
  const contributorDurations: Record<string, number> = {};
  for (const c of contributors) {
    if (c.status === "executed" || c.status === "failed") {
      contributorDurations[c.contributorId] = c.durationMs;
    }
  }

  const executed = contributors.filter((c) => c.status === "executed");
  const skipped = contributors.filter(
    (c) => c.status === "skipped" || c.status === "skipped_dependent"
  );
  const failed = contributors.filter((c) => c.status === "failed");

  return {
    executionDurationMs: input.durationMs,
    contributorDurations,
    contributors,
    recommendationCount: executed.reduce(
      (n, c) => n + c.recommendationCount,
      0
    ),
    evidenceCount: executed.reduce((n, c) => n + c.evidenceCount, 0),
    actionProposalCount: executed.reduce(
      (n, c) => n + c.actionProposalCount,
      0
    ),
    failureCount: failed.length,
    warningCount: executed.reduce((n, c) => n + c.warningCount, 0),
    skippedContributorCount: skipped.length,
    executedContributorCount: executed.length,
    stageCount: input.stageCount,
    graphRecommendationCount: input.graph.recommendations.length,
    graphEvidenceCount: input.graph.evidence.length,
    graphActionProposalCount: input.graph.suggestedActions.length,
    graphWarningCount: input.graph.warnings.length,
    graphConflictCount: input.graph.conflicts.length,
  };
}
