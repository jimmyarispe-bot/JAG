/**
 * Market Registry — default signal publishers.
 */

import type { MarketRegistry as MarketRegistryContract } from "@/lib/platform/intelligence/market/contracts";
import type { MarketPublisher } from "@/lib/platform/intelligence/market/types";
import { PublisherRegistryMap } from "@/lib/platform/intelligence/common";

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

export class MarketRegistryStore
  extends PublisherRegistryMap
  implements MarketRegistryContract {
  constructor(seed = DEFAULT_PUBLISHERS) {
    super(seed);
  }
}

export { MarketRegistryStore as MarketRegistry };
