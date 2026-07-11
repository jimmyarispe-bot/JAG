/**
 * Enterprise Governance — committees.
 */

import type {
  GovernanceCommittee,
  GovernanceCommitteeKind,
} from "@/lib/platform/governance/types";

export interface GovernanceCommitteesDependencies {
  createId?: (prefix: string) => string;
}

const DEFAULT_COMMITTEES: readonly Omit<GovernanceCommittee, "committeeId">[] = [
  {
    name: "Executive Committee",
    kind: "executive",
    chair: "Board Chair",
    members: ["CEO", "President", "Board Chair"],
    active: true,
    charter: "Acts on board matters between meetings within delegated authority",
  },
  {
    name: "Finance Committee",
    kind: "finance",
    chair: "Treasurer",
    members: ["Treasurer", "CFO", "Board Member"],
    active: true,
    charter: "Oversees financial stewardship and budget recommendations",
  },
  {
    name: "Audit Committee",
    kind: "audit",
    chair: "Audit Chair",
    members: ["Audit Chair", "Independent Member"],
    active: true,
    charter: "Oversees audit integrity and compliance accountability",
  },
  {
    name: "Academic Committee",
    kind: "academic",
    chair: "Academic Chair",
    members: ["Academic Chair", "Head of School"],
    active: true,
    charter: "Reviews academic program quality and learning outcomes",
  },
];

export class GovernanceCommittees {
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceCommittee>();

  constructor(dependencies: GovernanceCommitteesDependencies = {}) {
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    for (const def of DEFAULT_COMMITTEES) {
      const committee: GovernanceCommittee = {
        ...def,
        committeeId: this.createId("committee"),
      };
      this.store.set(committee.committeeId, committee);
    }
  }

  create(input: {
    name: string;
    kind: GovernanceCommitteeKind;
    chair: string;
    members: readonly string[];
    charter: string;
  }): GovernanceCommittee {
    const committee: GovernanceCommittee = {
      committeeId: this.createId("committee"),
      name: input.name,
      kind: input.kind,
      chair: input.chair,
      members: [...input.members],
      active: true,
      charter: input.charter,
    };
    this.store.set(committee.committeeId, committee);
    return committee;
  }

  list(kind?: GovernanceCommitteeKind): readonly GovernanceCommittee[] {
    const all = Array.from(this.store.values());
    return kind ? all.filter((c) => c.kind === kind) : all;
  }

  get(committeeId: string): GovernanceCommittee | null {
    return this.store.get(committeeId) ?? null;
  }
}
