/**
 * Unified output of the Education Intelligence Orchestrator.
 */

import type { EducationContributorResult } from "../framework";
import type { EducationGraphResult } from "../graph";
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

export interface EducationExecutionResult {
  /** True when the plan validated and at least one contributor executed (or graph ran empty-safe). */
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
}
