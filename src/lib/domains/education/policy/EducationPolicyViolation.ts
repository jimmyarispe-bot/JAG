/**
 * Policy violation record — evaluation outcome only.
 */

export interface EducationPolicyViolation {
  policyId: string;
  code: string;
  message: string;
  /** Parameter keys that failed. */
  parameterKeys?: readonly string[];
  attributes?: Readonly<Record<string, unknown>>;
}
