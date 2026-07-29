/**
 * Planner output — plan plus validation / selection diagnostics.
 */

import type { EducationExecutionPlan } from "./EducationExecutionPlan";

export type EducationPlanValidationSeverity = "error" | "warning";

export interface EducationPlanValidationIssue {
  code: string;
  message: string;
  severity: EducationPlanValidationSeverity;
  contributorId?: string;
}

export interface EducationSelectionDecision {
  contributorId: string;
  decision: "include" | "skip";
  reason: string;
}

export interface EducationPlanResult {
  ok: boolean;
  plan: EducationExecutionPlan;
  selections: readonly EducationSelectionDecision[];
  validationIssues: readonly EducationPlanValidationIssue[];
}
