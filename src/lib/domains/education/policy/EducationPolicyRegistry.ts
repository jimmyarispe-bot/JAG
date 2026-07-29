/**
 * Registry of Knowledge policy definitions for evaluation.
 */

import {
  EDUCATION_POLICY_CATALOG,
  type EducationPolicyDefinition,
} from "../knowledge";
import type { EducationPolicyValidationIssue } from "./EducationPolicyResult";

export interface EducationPolicyRegistry {
  list(): readonly EducationPolicyDefinition[];
  get(policyId: string): EducationPolicyDefinition | undefined;
  has(policyId: string): boolean;
  register(policy: EducationPolicyDefinition): void;
  validate(): EducationPolicyValidationIssue[];
}

export function createEducationPolicyRegistry(
  policies: readonly EducationPolicyDefinition[] = EDUCATION_POLICY_CATALOG
): EducationPolicyRegistry {
  const byId = new Map<string, EducationPolicyDefinition>();
  for (const policy of policies) {
    byId.set(policy.id, policy);
  }

  return {
    list() {
      return [...byId.values()];
    },
    get(policyId) {
      return byId.get(policyId);
    },
    has(policyId) {
      return byId.has(policyId);
    },
    register(policy) {
      byId.set(policy.id, policy);
    },
    validate() {
      return validateEducationPolicyRegistry([...byId.values()]);
    },
  };
}

export function validateEducationPolicyRegistry(
  policies: readonly EducationPolicyDefinition[]
): EducationPolicyValidationIssue[] {
  const issues: EducationPolicyValidationIssue[] = [];
  const seen = new Set<string>();

  for (const policy of policies) {
    if (!policy.id || !policy.id.startsWith("education.policy.")) {
      issues.push({
        code: "INVALID_POLICY_ID",
        message: `Policy id must be a non-empty education.policy.* id: ${policy.id}`,
        severity: "error",
        policyId: policy.id,
      });
    }
    if (seen.has(policy.id)) {
      issues.push({
        code: "DUPLICATE_POLICY_ID",
        message: `Duplicate policy id: ${policy.id}`,
        severity: "error",
        policyId: policy.id,
      });
    } else {
      seen.add(policy.id);
    }

    if (!policy.name?.trim()) {
      issues.push({
        code: "INVALID_POLICY_METADATA",
        message: `Policy ${policy.id} missing name`,
        severity: "error",
        policyId: policy.id,
      });
    }
    if (!policy.kind) {
      issues.push({
        code: "INVALID_POLICY_METADATA",
        message: `Policy ${policy.id} missing kind`,
        severity: "error",
        policyId: policy.id,
      });
    }
    if (!policy.parameters || policy.parameters.length === 0) {
      issues.push({
        code: "INVALID_POLICY_METADATA",
        message: `Policy ${policy.id} declares no parameters`,
        severity: "warning",
        policyId: policy.id,
      });
    } else {
      const paramKeys = new Set<string>();
      for (const param of policy.parameters) {
        if (!param.key) {
          issues.push({
            code: "INVALID_POLICY_METADATA",
            message: `Policy ${policy.id} has a parameter without key`,
            severity: "error",
            policyId: policy.id,
          });
          continue;
        }
        if (paramKeys.has(param.key)) {
          issues.push({
            code: "INVALID_POLICY_METADATA",
            message: `Policy ${policy.id} duplicate parameter key: ${param.key}`,
            severity: "error",
            policyId: policy.id,
          });
        }
        paramKeys.add(param.key);
        if (!param.valueType) {
          issues.push({
            code: "INVALID_POLICY_METADATA",
            message: `Policy ${policy.id} parameter ${param.key} missing valueType`,
            severity: "error",
            policyId: policy.id,
          });
        }
      }
    }
  }

  return issues;
}
