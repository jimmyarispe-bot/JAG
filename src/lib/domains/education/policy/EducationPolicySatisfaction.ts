/**
 * Policy satisfaction record — evaluation outcome only.
 */

export interface EducationPolicySatisfaction {
  policyId: string;
  code: string;
  message: string;
  parameterKeys?: readonly string[];
  attributes?: Readonly<Record<string, unknown>>;
}
