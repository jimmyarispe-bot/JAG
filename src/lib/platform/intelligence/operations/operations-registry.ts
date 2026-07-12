/**
 * Operations Registry — tracks which OIOS domains feed operations signals (Sprint 038).
 */

import type { OperationsRegistry as OperationsRegistryContract } from "@/lib/platform/intelligence/operations/contracts";
import type { OperationsPublisher } from "@/lib/platform/intelligence/operations/types";

const DEFAULT_PUBLISHERS: OperationsPublisher[] = [
  { domain: "organization-dna", capability: "operations.dna_operating_model" },
  { domain: "organization-health", capability: "operations.health_pillar" },
  { domain: "human-capital", capability: "operations.staffing_signals" },
  { domain: "business-model", capability: "operations.complexity_signals" },
  { domain: "oios-core", capability: "operations.execution_baseline" },
];

export class OperationsRegistryStore implements OperationsRegistryContract {
  private readonly publishers = new Map<string, string>();

  constructor(seed = DEFAULT_PUBLISHERS) {
    for (const item of seed) this.register(item.domain, item.capability);
  }

  register(domain: string, capability: string): void {
    this.publishers.set(domain, capability);
  }

  list(): OperationsPublisher[] {
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

export { OperationsRegistryStore as OperationsRegistry };
