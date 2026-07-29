/**
 * Traceability for a single policy evaluation.
 */

export type EducationPolicyOutcome =
  | "satisfied"
  | "violated"
  | "unknown";

export interface EducationPolicyEvidenceRef {
  /** Stable evidence token for this evaluation. */
  id: string;
  /** Logical source (fact key, observation field, etc.). */
  source: string;
  /** Human-readable note. */
  detail?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface EducationPolicyTrace {
  policyId: string;
  policyName: string;
  outcome: EducationPolicyOutcome;
  explanation: string;
  supportingEvidence: readonly EducationPolicyEvidenceRef[];
  missingEvidence: readonly string[];
  evaluatedAt: string;
  /** Parameter values actually applied (metadata + overrides). */
  appliedParameters: Readonly<Record<string, unknown>>;
}

export function createPolicyEvidenceRef(input: {
  policyId: string;
  source: string;
  detail?: string;
  attributes?: Readonly<Record<string, unknown>>;
}): EducationPolicyEvidenceRef {
  return {
    id: `policy.evidence.${input.policyId}.${input.source}`,
    source: input.source,
    detail: input.detail,
    attributes: input.attributes,
  };
}
