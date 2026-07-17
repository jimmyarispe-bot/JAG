/**
 * Business Model Registry — tracks which OIOS domains feed business-model signals (Sprint 037).
 */

import type { BusinessModelRegistry as BusinessModelRegistryContract } from "@/lib/platform/intelligence/business-model/contracts";
import type { BusinessModelPublisher } from "@/lib/platform/intelligence/business-model/types";
import { PublisherRegistryMap } from "@/lib/platform/intelligence/common";

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
  extends PublisherRegistryMap
  implements BusinessModelRegistryContract {
  constructor(seed = DEFAULT_PUBLISHERS) {
    super(seed);
  }
}

export { BusinessModelRegistryStore as BusinessModelRegistry };
