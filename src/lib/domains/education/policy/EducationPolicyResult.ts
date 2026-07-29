/**
 * Aggregated Education Policy Engine output.
 * No recommendations. No actions.
 */

import type { EducationPolicySatisfaction } from "./EducationPolicySatisfaction";
import type { EducationPolicyTrace } from "./EducationPolicyTrace";
import type { EducationPolicyViolation } from "./EducationPolicyViolation";

export interface EducationPolicyEvaluationItem {
  policyId: string;
  outcome: "satisfied" | "violated" | "unknown";
  satisfaction?: EducationPolicySatisfaction;
  violation?: EducationPolicyViolation;
  trace: EducationPolicyTrace;
}

export interface EducationPolicyResult {
  ok: boolean;
  subjectId?: string;
  organizationId?: string;
  evaluatedAt: string;
  /** Policies that passed. */
  satisfied: readonly EducationPolicySatisfaction[];
  /** Policies that failed. */
  violated: readonly EducationPolicyViolation[];
  /** Policies that could not be determined (insufficient data). */
  unknown: readonly EducationPolicyEvaluationItem[];
  /** Full per-policy evaluation items. */
  evaluations: readonly EducationPolicyEvaluationItem[];
  /** Flattened traces for every evaluated policy. */
  traces: readonly EducationPolicyTrace[];
  /** Registry / request validation issues (non-fatal unless ok=false). */
  validationIssues: readonly EducationPolicyValidationIssue[];
}

export interface EducationPolicyValidationIssue {
  code: string;
  message: string;
  severity: "error" | "warning";
  policyId?: string;
}

/** Interface contributors may consume in later phases. */
export interface EducationPolicyEvaluationPort {
  evaluate(input: {
    subjectId?: string;
    organizationId?: string;
    facts: import("./EducationPolicyContext").EducationPolicyFacts;
    policyIds?: readonly string[];
    now?: string;
  }): EducationPolicyResult;
}
