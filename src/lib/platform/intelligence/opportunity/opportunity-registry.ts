/** Opportunity Registry — tracks which OIOS domains publish into the exchange (Sprint 035). */
import type * as C from "@/lib/platform/intelligence/opportunity/contracts";
import type { OpportunityOriginatingDomain } from "@/lib/platform/intelligence/opportunity/types";

const DEFAULT_PUBLISHERS: Array<{ domain: OpportunityOriginatingDomain; capability: string }> = [
  { domain: "organization-dna", capability: "opportunity.dna_alignment" },
  { domain: "oios-core", capability: "opportunity.improvement_loop" },
  { domain: "organization-health", capability: "opportunity.health_signals" },
  { domain: "human-capital", capability: "opportunity.workforce_capacity" },
  { domain: "revenue", capability: "opportunity.revenue_growth" },
  { domain: "funding", capability: "opportunity.funding_pipeline" },
  { domain: "executive-graph", capability: "opportunity.graph_paths" },
  { domain: "executive-decision", capability: "opportunity.decision_scenarios" },
  { domain: "predictive", capability: "opportunity.emerging_signals" },
  { domain: "board-governance", capability: "opportunity.governance_oversight" },
  { domain: "opportunity", capability: "opportunity.category_discovery" },
  { domain: "continuous-improvement", capability: "opportunity.improvement_cycle" },
];

export class OpportunityRegistryStore implements C.OpportunityRegistry {
  private readonly publishers = new Map<OpportunityOriginatingDomain, string>();

  constructor(seed = DEFAULT_PUBLISHERS) {
    for (const item of seed) this.register(item.domain, item.capability);
  }

  register(domain: OpportunityOriginatingDomain, capability: string): void {
    this.publishers.set(domain, capability);
  }

  list(): Array<{ domain: OpportunityOriginatingDomain; capability: string }> {
    return [...this.publishers.entries()].map(([domain, capability]) => ({ domain, capability }));
  }

  isRegistered(domain: OpportunityOriginatingDomain): boolean {
    return this.publishers.has(domain);
  }

  clear(): void {
    this.publishers.clear();
  }
}

export { OpportunityRegistryStore as OpportunityRegistry };
