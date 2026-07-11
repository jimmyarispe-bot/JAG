/**
 * Enterprise Governance — authority.
 *
 * Defines approval authority across financial, HR, academic, operational,
 * strategic, and mission domains.
 */

import type {
  GovernanceApproverRole,
  GovernanceAuthorityDomain,
  GovernanceAuthorityGrant,
} from "@/lib/platform/governance/types";
import { GOVERNANCE_AUTHORITY_DOMAINS } from "@/lib/platform/governance/types";

export interface GovernanceAuthorityDependencies {
  createId?: (prefix: string) => string;
}

const DEFAULT_GRANTS: readonly {
  role: GovernanceApproverRole;
  domain: GovernanceAuthorityDomain;
  maxAmount: number | null;
  canApprove: boolean;
  canDelegate: boolean;
  canEscalate: boolean;
  description: string;
}[] = [
  {
    role: "ceo",
    domain: "financial",
    maxAmount: 250000,
    canApprove: true,
    canDelegate: true,
    canEscalate: true,
    description: "CEO financial approval authority",
  },
  {
    role: "board",
    domain: "financial",
    maxAmount: null,
    canApprove: true,
    canDelegate: false,
    canEscalate: false,
    description: "Board unlimited financial authority",
  },
  {
    role: "president",
    domain: "academic",
    maxAmount: null,
    canApprove: true,
    canDelegate: true,
    canEscalate: true,
    description: "President academic authority",
  },
  {
    role: "executive_team",
    domain: "operational",
    maxAmount: 50000,
    canApprove: true,
    canDelegate: true,
    canEscalate: true,
    description: "Executive Team operational authority",
  },
  {
    role: "ceo",
    domain: "hr",
    maxAmount: null,
    canApprove: true,
    canDelegate: true,
    canEscalate: true,
    description: "CEO HR authority",
  },
  {
    role: "board",
    domain: "strategic",
    maxAmount: null,
    canApprove: true,
    canDelegate: false,
    canEscalate: false,
    description: "Board strategic authority",
  },
  {
    role: "board",
    domain: "mission",
    maxAmount: null,
    canApprove: true,
    canDelegate: false,
    canEscalate: false,
    description: "Board mission authority",
  },
  {
    role: "committee",
    domain: "financial",
    maxAmount: 100000,
    canApprove: true,
    canDelegate: false,
    canEscalate: true,
    description: "Finance committee recommendation authority",
  },
];

export class GovernanceAuthority {
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceAuthorityGrant>();

  constructor(dependencies: GovernanceAuthorityDependencies = {}) {
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    for (const def of DEFAULT_GRANTS) {
      this.grant({
        ...def,
        currency: def.maxAmount != null ? "USD" : null,
      });
    }
  }

  grant(input: {
    role: GovernanceApproverRole | string;
    domain: GovernanceAuthorityDomain;
    maxAmount?: number | null;
    currency?: string | null;
    canApprove?: boolean;
    canDelegate?: boolean;
    canEscalate?: boolean;
    description: string;
  }): GovernanceAuthorityGrant {
    const grant: GovernanceAuthorityGrant = {
      grantId: this.createId("grant"),
      role: input.role,
      domain: input.domain,
      maxAmount: input.maxAmount ?? null,
      currency: input.currency ?? null,
      canApprove: input.canApprove ?? true,
      canDelegate: input.canDelegate ?? false,
      canEscalate: input.canEscalate ?? true,
      description: input.description,
    };
    this.store.set(grant.grantId, grant);
    return grant;
  }

  canApprove(
    role: GovernanceApproverRole | string,
    domain: GovernanceAuthorityDomain,
    amount?: number
  ): boolean {
    const grants = this.list().filter(
      (g) => g.role === role && g.domain === domain && g.canApprove
    );
    if (grants.length === 0) return false;
    if (amount == null) return true;
    return grants.some(
      (g) => g.maxAmount == null || amount <= g.maxAmount
    );
  }

  list(domain?: GovernanceAuthorityDomain): readonly GovernanceAuthorityGrant[] {
    const all = Array.from(this.store.values());
    return domain ? all.filter((g) => g.domain === domain) : all;
  }

  domains(): readonly GovernanceAuthorityDomain[] {
    return GOVERNANCE_AUTHORITY_DOMAINS;
  }
}
