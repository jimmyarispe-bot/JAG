/**
 * Sprint 064 — policy / option-template registry (extensible).
 */

import type { OrganizationalPolicy } from "@/lib/platform/intelligence/decision-intelligence/types";
import { DEFAULT_POLICIES } from "@/lib/platform/intelligence/decision-intelligence/policies/policy-engine";

export class DecisionIntelligenceRegistry {
  private readonly policies = new Map<string, OrganizationalPolicy>();

  constructor(policies: OrganizationalPolicy[] = DEFAULT_POLICIES) {
    for (const policy of policies) this.registerPolicy(policy);
  }

  registerPolicy(policy: OrganizationalPolicy): void {
    this.policies.set(policy.id, policy);
  }

  listPolicies(): OrganizationalPolicy[] {
    return [...this.policies.values()];
  }
}

export function createDefaultDecisionRegistry(
  policies?: OrganizationalPolicy[]
): DecisionIntelligenceRegistry {
  return new DecisionIntelligenceRegistry(policies);
}
