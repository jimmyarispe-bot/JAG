/**
 * Innovation Registry — default signal publishers.
 */

import type { InnovationRegistry as InnovationRegistryContract } from "@/lib/platform/intelligence/innovation/contracts";
import type { InnovationPublisher } from "@/lib/platform/intelligence/innovation/types";

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

export class InnovationRegistryStore implements InnovationRegistryContract {
  private readonly publishers = new Map<string, string>();

  constructor(seed = DEFAULT_PUBLISHERS) {
    for (const publisher of seed) this.register(publisher.domain, publisher.capability);
  }

  register(domain: string, capability: string): void {
    this.publishers.set(domain, capability);
  }

  list(): InnovationPublisher[] {
    return [...this.publishers.entries()].map(([domain, capability]) => ({ domain, capability }));
  }

  isRegistered(domain: string): boolean {
    return this.publishers.has(domain);
  }

  clear(): void {
    this.publishers.clear();
  }
}

export { InnovationRegistryStore as InnovationRegistry };
