/**
 * Enterprise Governance — delegations.
 */

import type {
  GovernanceApproverRole,
  GovernanceAuthorityDomain,
  GovernanceDelegation,
} from "@/lib/platform/governance/types";

export interface GovernanceDelegationsDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceDelegations {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceDelegation>();

  constructor(dependencies: GovernanceDelegationsDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  grant(input: {
    fromRole: GovernanceApproverRole;
    toRole: GovernanceApproverRole | string;
    domain: GovernanceAuthorityDomain;
    scope: string;
    rationale: string;
    effectiveTo?: string | null;
  }): GovernanceDelegation {
    const delegation: GovernanceDelegation = {
      delegationId: this.createId("delegation"),
      fromRole: input.fromRole,
      toRole: input.toRole,
      domain: input.domain,
      scope: input.scope,
      effectiveFrom: this.now().toISOString(),
      effectiveTo: input.effectiveTo ?? null,
      active: true,
      rationale: input.rationale,
    };
    this.store.set(delegation.delegationId, delegation);
    return delegation;
  }

  revoke(delegationId: string): GovernanceDelegation {
    const existing = this.store.get(delegationId);
    if (!existing) {
      throw new Error(`Delegation not found: ${delegationId}`);
    }
    const updated: GovernanceDelegation = {
      ...existing,
      active: false,
      effectiveTo: this.now().toISOString(),
    };
    this.store.set(delegationId, updated);
    return updated;
  }

  listActive(domain?: GovernanceAuthorityDomain): readonly GovernanceDelegation[] {
    return Array.from(this.store.values()).filter(
      (d) => d.active && (!domain || d.domain === domain)
    );
  }

  list(): readonly GovernanceDelegation[] {
    return Array.from(this.store.values());
  }
}
