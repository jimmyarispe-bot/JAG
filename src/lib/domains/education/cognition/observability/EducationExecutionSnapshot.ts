/**
 * Immutable diagnostic snapshot of a full Education intelligence run.
 * Useful for replay, debugging, and testing — never mutates pipeline state.
 */

import type { EducationContributorResult } from "../framework";
import type { EducationGraphResult } from "../graph";
import type {
  EducationExecutionPlan,
  EducationPlanResult,
  EducationPlanValidationIssue,
  EducationSelectionDecision,
} from "../planner";
import { buildEducationEvidenceAudit } from "./EducationEvidenceAudit";
import type { EducationEvidenceAudit } from "./EducationEvidenceAudit";
import { buildEducationExecutionMetrics } from "./EducationExecutionMetrics";
import type { EducationExecutionMetrics } from "./EducationExecutionMetrics";
import { buildEducationExecutionTrace } from "./EducationExecutionTrace";
import type { EducationExecutionTrace } from "./EducationExecutionTrace";
import { buildEducationExecutionTimeline } from "./EducationExecutionTimeline";
import type { EducationExecutionTimeline } from "./EducationExecutionTimeline";
import { buildEducationRecommendationAudit } from "./EducationRecommendationAudit";
import type { EducationRecommendationAudit } from "./EducationRecommendationAudit";

/** Minimal record shape (avoids circular import with orchestrator). */
export interface EducationSnapshotContributorRecord {
  contributorId: string;
  status: "executed" | "skipped" | "failed" | "skipped_dependent";
  reason?: string;
  result?: EducationContributorResult;
  durationMs?: number;
  stage?: number;
}

export interface EducationSnapshotTelemetry {
  executedContributorIds: readonly string[];
  skippedContributorIds: readonly string[];
  failedContributorIds: readonly string[];
  failures: readonly {
    contributorId: string;
    reason: string;
    stage?: number;
  }[];
  skippedDependents: readonly {
    contributorId: string;
    dueToFailures: readonly string[];
    reason: string;
  }[];
  durationMs: number;
  evidenceCount: number;
  recommendationCount: number;
  actionProposalCount: number;
  stageCount: number;
  planOk: boolean;
  analyzedAt: string;
}

export interface EducationExecutionSnapshot {
  readonly snapshotId: string;
  readonly capturedAt: string;
  readonly ok: boolean;
  readonly intentId: string;
  readonly subjectId?: string;
  readonly organizationId?: string;
  readonly plan: EducationExecutionPlan;
  readonly planValidation: readonly EducationPlanValidationIssue[];
  readonly selections: readonly EducationSelectionDecision[];
  readonly contributorRecords: readonly EducationSnapshotContributorRecord[];
  readonly contributorResults: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  readonly graphResult: EducationGraphResult;
  readonly telemetry: EducationSnapshotTelemetry;
  readonly trace: EducationExecutionTrace;
  readonly timeline: EducationExecutionTimeline;
  readonly metrics: EducationExecutionMetrics;
  readonly recommendationAudit: EducationRecommendationAudit;
  readonly evidenceAudit: EducationEvidenceAudit;
}

export interface BuildEducationExecutionSnapshotInput {
  ok: boolean;
  planResult: EducationPlanResult;
  planValidation: readonly EducationPlanValidationIssue[];
  contributorRecords: readonly EducationSnapshotContributorRecord[];
  contributorResults: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  graphResult: EducationGraphResult;
  telemetry: EducationSnapshotTelemetry;
  intentLabel?: string;
  subjectId?: string;
  organizationId?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

/**
 * Build a deep-frozen diagnostic snapshot from pipeline artifacts.
 */
export function buildEducationExecutionSnapshot(
  input: BuildEducationExecutionSnapshotInput
): EducationExecutionSnapshot {
  const skippedContributorIds = unique([
    ...input.planResult.plan.skippedContributorIds,
    ...input.telemetry.skippedContributorIds,
  ]);

  const trace = buildEducationExecutionTrace({
    plan: input.planResult.plan,
    selections: input.planResult.selections,
    skippedContributorIds,
    planOk: input.planResult.ok,
    intentLabel: input.intentLabel,
    completed: true,
    completedAt: input.completedAt,
  });

  const timeline = buildEducationExecutionTimeline({
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    planId: input.planResult.plan.planId,
    intentId: input.planResult.plan.intentId,
    records: input.contributorRecords,
    recommendationCount: input.graphResult.recommendations.length,
    graphSubjectId: input.graphResult.subjectId,
  });

  const metrics = buildEducationExecutionMetrics({
    durationMs: input.durationMs,
    stageCount: input.planResult.plan.stages.length,
    records: input.contributorRecords,
    graph: input.graphResult,
  });

  const recommendationAudit = buildEducationRecommendationAudit({
    contributorResults: input.contributorResults,
    graphRecommendations: input.graphResult.recommendations,
  });

  const evidenceAudit = buildEducationEvidenceAudit({
    contributorResults: input.contributorResults,
    graphEvidence: input.graphResult.evidence,
  });

  const snapshot: EducationExecutionSnapshot = {
    snapshotId: `snap.${input.planResult.plan.planId}`,
    capturedAt: input.completedAt,
    ok: input.ok,
    intentId: input.planResult.plan.intentId,
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    plan: input.planResult.plan,
    planValidation: input.planValidation,
    selections: input.planResult.selections,
    contributorRecords: input.contributorRecords,
    contributorResults: input.contributorResults,
    graphResult: input.graphResult,
    telemetry: input.telemetry,
    trace,
    timeline,
    metrics,
    recommendationAudit,
    evidenceAudit,
  };

  return deepFreeze(snapshot);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.keys(value as object)) {
    const child = (value as Record<string, unknown>)[key];
    if (
      child !== null &&
      typeof child === "object" &&
      !Object.isFrozen(child)
    ) {
      deepFreeze(child);
    }
  }
  return value;
}
