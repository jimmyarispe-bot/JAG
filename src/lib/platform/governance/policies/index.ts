/**
 * Enterprise Governance — policies.
 */

import type {
  GovernanceAuthorityDomain,
  GovernancePolicy,
} from "@/lib/platform/governance/types";

export interface GovernancePoliciesDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/** Default enterprise policies across authority domains. */
export const DEFAULT_GOVERNANCE_POLICIES: readonly Omit<
  GovernancePolicy,
  "policyId" | "createdAt" | "updatedAt"
>[] = [
  {
    title: "Financial approval thresholds",
    description: "Defines spend approval limits by role",
    domain: "financial",
    version: "1.0.0",
    active: true,
    rules: [
      "CEO may approve up to configured financial max",
      "Board approval required above CEO financial max",
    ],
  },
  {
    title: "HR authority",
    description: "Hiring, separation, and compensation approvals",
    domain: "hr",
    version: "1.0.0",
    active: true,
    rules: ["Executive Team approves senior hires", "Board approves CEO compensation"],
  },
  {
    title: "Academic program changes",
    description: "Curriculum and academic standing governance",
    domain: "academic",
    version: "1.0.0",
    active: true,
    rules: ["Academic committee reviews material program changes"],
  },
  {
    title: "Operational continuity",
    description: "Day-to-day operational decision rights",
    domain: "operational",
    version: "1.0.0",
    active: true,
    rules: ["Operators may act within delegated operational scope"],
  },
  {
    title: "Strategic initiatives",
    description: "Strategic plan and major initiative approvals",
    domain: "strategic",
    version: "1.0.0",
    active: true,
    rules: ["Board approves multi-year strategic goals"],
  },
  {
    title: "Mission alignment",
    description: "Ensures decisions remain mission-aligned",
    domain: "mission",
    version: "1.0.0",
    active: true,
    rules: ["Mission impact must be documented for board-level decisions"],
  },
];

export class GovernancePolicies {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernancePolicy>();

  constructor(dependencies: GovernancePoliciesDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    this.seedDefaults();
  }

  private seedDefaults(): void {
    const ts = this.now().toISOString();
    for (const def of DEFAULT_GOVERNANCE_POLICIES) {
      const policy: GovernancePolicy = {
        ...def,
        policyId: this.createId("policy"),
        createdAt: ts,
        updatedAt: ts,
      };
      this.store.set(policy.policyId, policy);
    }
  }

  list(domain?: GovernanceAuthorityDomain): readonly GovernancePolicy[] {
    const all = Array.from(this.store.values());
    return domain ? all.filter((p) => p.domain === domain) : all;
  }

  get(policyId: string): GovernancePolicy | null {
    return this.store.get(policyId) ?? null;
  }

  upsert(
    input: Omit<GovernancePolicy, "policyId" | "createdAt" | "updatedAt"> & {
      policyId?: string;
    }
  ): GovernancePolicy {
    const ts = this.now().toISOString();
    const existing = input.policyId ? this.store.get(input.policyId) : null;
    const policy: GovernancePolicy = {
      policyId: existing?.policyId ?? input.policyId ?? this.createId("policy"),
      title: input.title,
      description: input.description,
      domain: input.domain,
      version: input.version,
      active: input.active,
      rules: [...input.rules],
      createdAt: existing?.createdAt ?? ts,
      updatedAt: ts,
      metadata: input.metadata,
    };
    this.store.set(policy.policyId, policy);
    return policy;
  }
}
