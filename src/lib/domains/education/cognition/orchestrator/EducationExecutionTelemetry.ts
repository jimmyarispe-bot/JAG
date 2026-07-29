/**
 * Execution telemetry for the Education Intelligence Orchestrator.
 */

export interface EducationContributorFailure {
  contributorId: string;
  reason: string;
  stage?: number;
}

export interface EducationSkippedDependent {
  contributorId: string;
  /** Upstream contributor ids that failed. */
  dueToFailures: readonly string[];
  reason: string;
}

export interface EducationExecutionTelemetry {
  /** Contributors that ran successfully. */
  executedContributorIds: readonly string[];
  /** Plan-level skips (not relevant / unavailable) plus runtime skips. */
  skippedContributorIds: readonly string[];
  /** Contributors that threw or returned unusable results. */
  failedContributorIds: readonly string[];
  failures: readonly EducationContributorFailure[];
  skippedDependents: readonly EducationSkippedDependent[];
  /** Wall-clock duration of the full pipeline. */
  durationMs: number;
  evidenceCount: number;
  recommendationCount: number;
  actionProposalCount: number;
  stageCount: number;
  planOk: boolean;
  analyzedAt: string;
}

export function emptyEducationExecutionTelemetry(
  now: string
): EducationExecutionTelemetry {
  return {
    executedContributorIds: [],
    skippedContributorIds: [],
    failedContributorIds: [],
    failures: [],
    skippedDependents: [],
    durationMs: 0,
    evidenceCount: 0,
    recommendationCount: 0,
    actionProposalCount: 0,
    stageCount: 0,
    planOk: false,
    analyzedAt: now,
  };
}

export function buildEducationExecutionTelemetry(input: {
  executedContributorIds: readonly string[];
  skippedContributorIds: readonly string[];
  failures: readonly EducationContributorFailure[];
  skippedDependents: readonly EducationSkippedDependent[];
  durationMs: number;
  evidenceCount: number;
  recommendationCount: number;
  actionProposalCount: number;
  stageCount: number;
  planOk: boolean;
  now: string;
}): EducationExecutionTelemetry {
  return {
    executedContributorIds: [...input.executedContributorIds],
    skippedContributorIds: [...input.skippedContributorIds],
    failedContributorIds: input.failures.map((f) => f.contributorId),
    failures: [...input.failures],
    skippedDependents: [...input.skippedDependents],
    durationMs: input.durationMs,
    evidenceCount: input.evidenceCount,
    recommendationCount: input.recommendationCount,
    actionProposalCount: input.actionProposalCount,
    stageCount: input.stageCount,
    planOk: input.planOk,
    analyzedAt: input.now,
  };
}
