/** Improvement Registry — tracks which OIOS domains publish improvements (Sprint 036). */
import type * as C from "@/lib/platform/intelligence/organizational-improvement/contracts";
import type { ImprovementSourceDomain } from "@/lib/platform/intelligence/organizational-improvement/types";

const DEFAULT_PUBLISHERS: Array<{ domain: ImprovementSourceDomain; capability: string }> = [
  { domain: "organization-health", capability: "improvement.health_signals" },
  { domain: "executive-graph", capability: "improvement.graph_paths" },
  { domain: "executive-decision", capability: "improvement.decision_actions" },
  { domain: "predictive", capability: "improvement.emerging_signals" },
  { domain: "human-capital", capability: "improvement.workforce_capacity" },
  { domain: "revenue", capability: "improvement.revenue_growth" },
  { domain: "funding", capability: "improvement.funding_pipeline" },
  { domain: "opportunity", capability: "improvement.opportunity_exchange" },
  { domain: "board-governance", capability: "improvement.governance_oversight" },
  { domain: "future-domains", capability: "improvement.future_adapters" },
];

export class ImprovementRegistryStore implements C.ImprovementRegistry {
  private readonly publishers = new Map<ImprovementSourceDomain, string>();

  constructor(seed = DEFAULT_PUBLISHERS) {
    for (const item of seed) this.register(item.domain, item.capability);
  }

  register(domain: ImprovementSourceDomain, capability: string): void {
    this.publishers.set(domain, capability);
  }

  list(): Array<{ domain: ImprovementSourceDomain; capability: string }> {
    return [...this.publishers.entries()].map(([domain, capability]) => ({ domain, capability }));
  }

  isRegistered(domain: ImprovementSourceDomain): boolean {
    return this.publishers.has(domain);
  }

  clear(): void {
    this.publishers.clear();
  }
}

export { ImprovementRegistryStore as ImprovementRegistry };
