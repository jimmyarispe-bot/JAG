/**
 * Market Registry — default signal publishers.
 */

import type { MarketRegistry as MarketRegistryContract } from "@/lib/platform/intelligence/market/contracts";
import type { MarketPublisher } from "@/lib/platform/intelligence/market/types";

const DEFAULT_PUBLISHERS: MarketPublisher[] = [
  { domain: "organization-dna", capability: "market.dna_context" },
  { domain: "knowledge", capability: "market.knowledge_contribution" },
  { domain: "document", capability: "market.document_market_coverage" },
  { domain: "legal-compliance-risk", capability: "market.regulatory_pressure" },
  { domain: "revenue", capability: "market.pricing_revenue_signals" },
  { domain: "funding", capability: "market.funding_capacity" },
  { domain: "customer", capability: "market.demand_signals" },
  { domain: "business-model", capability: "market.business_model_fit" },
  { domain: "operations", capability: "market.operations_capacity" },
  { domain: "opportunity", capability: "market.opportunity_density" },
  { domain: "predictive", capability: "market.growth_signals" },
];

export class MarketRegistryStore implements MarketRegistryContract {
  private readonly publishers = new Map<string, string>();

  constructor(seed = DEFAULT_PUBLISHERS) {
    for (const publisher of seed) this.register(publisher.domain, publisher.capability);
  }

  register(domain: string, capability: string): void {
    this.publishers.set(domain, capability);
  }

  list(): MarketPublisher[] {
    return [...this.publishers.entries()].map(([domain, capability]) => ({ domain, capability }));
  }

  isRegistered(domain: string): boolean {
    return this.publishers.has(domain);
  }

  clear(): void {
    this.publishers.clear();
  }
}

export { MarketRegistryStore as MarketRegistry };
