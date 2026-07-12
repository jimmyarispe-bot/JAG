/**
 * Business Model Registry — tracks which OIOS domains feed business-model signals (Sprint 037).
 */

import type { BusinessModelRegistry as BusinessModelRegistryContract } from "@/lib/platform/intelligence/business-model/contracts";
import type { BusinessModelPublisher } from "@/lib/platform/intelligence/business-model/types";

const DEFAULT_PUBLISHERS: BusinessModelPublisher[] = [
  { domain: "organization-dna", capability: "business-model.dna_archetype" },
  { domain: "revenue", capability: "business-model.revenue_capture" },
  { domain: "funding", capability: "business-model.capital_requirements" },
  { domain: "opportunity", capability: "business-model.growth_options" },
  {
    domain: "organizational-improvement",
    capability: "business-model.improvement_levers",
  },
  { domain: "executive-decision", capability: "business-model.decision_tradeoffs" },
  { domain: "predictive", capability: "business-model.future_signals" },
];

export class BusinessModelRegistryStore
  implements BusinessModelRegistryContract
{
  private readonly publishers = new Map<string, string>();

  constructor(seed = DEFAULT_PUBLISHERS) {
    for (const item of seed) this.register(item.domain, item.capability);
  }

  register(domain: string, capability: string): void {
    this.publishers.set(domain, capability);
  }

  list(): BusinessModelPublisher[] {
    return [...this.publishers.entries()].map(([domain, capability]) => ({
      domain,
      capability,
    }));
  }

  isRegistered(domain: string): boolean {
    return this.publishers.has(domain);
  }

  clear(): void {
    this.publishers.clear();
  }
}

export { BusinessModelRegistryStore as BusinessModelRegistry };
