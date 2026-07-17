/**
 * Innovation Registry — default signal publishers.
 */

import type { InnovationRegistry as InnovationRegistryContract } from "@/lib/platform/intelligence/innovation/contracts";
import type { InnovationPublisher } from "@/lib/platform/intelligence/innovation/types";
import { PublisherRegistryMap } from "@/lib/platform/intelligence/common";

const DEFAULT_PUBLISHERS: InnovationPublisher[] = [
  { domain: "organization-dna", capability: "innovation.dna_context" },
  { domain: "market", capability: "innovation.market_signals" },
  { domain: "opportunity", capability: "innovation.opportunity_density" },
  { domain: "knowledge", capability: "innovation.knowledge_contribution" },
  { domain: "document", capability: "innovation.document_coverage" },
  { domain: "business-model", capability: "innovation.business_model_fit" },
  { domain: "organizational-improvement", capability: "innovation.improvement_momentum" },
  { domain: "decision", capability: "innovation.decision_traceability" },
  { domain: "predictive", capability: "innovation.growth_signals" },
];

export class InnovationRegistryStore
  extends PublisherRegistryMap
  implements InnovationRegistryContract {
  constructor(seed = DEFAULT_PUBLISHERS) {
    super(seed);
  }
}

export { InnovationRegistryStore as InnovationRegistry };
