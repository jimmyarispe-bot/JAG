/**
 * Unified output of the Education Intelligence Orchestrator.
 */

import type { EducationContributorResult } from "../framework";
import type { EducationGraphResult } from "../graph";
import type {
  EducationExecutionMetrics,
  EducationExecutionSnapshot,
  EducationExecutionTimeline,
  EducationExecutionTrace,
} from "../observability";
import type {
  EducationExecutionPlan,
  EducationPlanResult,
  EducationPlanValidationIssue,
} from "../planner";
import type { EducationExecutionTelemetry } from "./EducationExecutionTelemetry";

export interface EducationContributorExecutionRecord {
  contributorId: string;
  status: "executed" | "skipped" | "failed" | "skipped_dependent";
  reason?: string;
  result?: EducationContributorResult;
  durationMs?: number;
  stage?: number;
}

/**
 * Orchestrator execute() return value.
 * Exposes result + telemetry + observability surfaces without changing
 * intelligence pipeline behavior.
 */
export interface EducationExecutionResult {
  /** True when the plan validated, no failures, and at least one contributor executed. */
  ok: boolean;
  plan: EducationExecutionPlan;
  planValidation: readonly EducationPlanValidationIssue[];
  /** Per-contributor execution records (includes skips/failures). */
  contributorRecords: readonly EducationContributorExecutionRecord[];
  /** Successful contributor results only (graph inputs). */
  contributorResults: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  /** Unified graph aggregation (may be empty if nothing executed). */
  graphResult: EducationGraphResult;
  telemetry: EducationExecutionTelemetry;
  /** Full planner result for hosts that need selection diagnostics. */
  planResult: EducationPlanResult;

  // --- Observability (D2.7) ---
  /** Self-reference for hosts that destructure `{ result, telemetry, … }`. */
  result: EducationExecutionResult;
  trace: EducationExecutionTrace;
  timeline: EducationExecutionTimeline;
  metrics: EducationExecutionMetrics;
  /** Immutable frozen snapshot for replay / debugging. */
  snapshot: EducationExecutionSnapshot;
}
