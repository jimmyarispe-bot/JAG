/**
 * Per-contributor diagnostic metrics.
 */

export interface EducationContributorMetrics {
  contributorId: string;
  status: "executed" | "skipped" | "failed" | "skipped_dependent";
  durationMs: number;
  evidenceCount: number;
  recommendationCount: number;
  actionProposalCount: number;
  warningCount: number;
  blockingIssueCount: number;
  stage?: number;
  reason?: string;
}

export function buildEducationContributorMetrics(
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
  }>
): EducationContributorMetrics[] {
  return records.map((r) => ({
    contributorId: r.contributorId,
    status: r.status,
    durationMs: r.durationMs ?? 0,
    evidenceCount: r.result?.evidence.length ?? 0,
    recommendationCount: r.result?.recommendations.length ?? 0,
    actionProposalCount: r.result?.suggestedActions.length ?? 0,
    warningCount: r.result?.warnings.length ?? 0,
    blockingIssueCount: r.result?.blockingIssues.length ?? 0,
    stage: r.stage,
    reason: r.reason,
  }));
}
