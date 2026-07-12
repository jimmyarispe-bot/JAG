/**
 * Customer Registry — tracks which OIOS domains feed customer signals (Sprint 039).
 */

import type { CustomerRegistry as CustomerRegistryContract } from "@/lib/platform/intelligence/customer/contracts";
import type { CustomerPublisher } from "@/lib/platform/intelligence/customer/types";

const DEFAULT_PUBLISHERS: CustomerPublisher[] = [
  { domain: "organization-dna", capability: "customer.dna_personas" },
  { domain: "organization-health", capability: "customer.enrollment_health" },
  { domain: "operations", capability: "customer.support_signals" },
  { domain: "revenue", capability: "customer.retention_proxies" },
  { domain: "oios-core", capability: "customer.execution_baseline" },
];

export class CustomerRegistryStore implements CustomerRegistryContract {
  private readonly publishers = new Map<string, string>();

  constructor(seed = DEFAULT_PUBLISHERS) {
    for (const item of seed) this.register(item.domain, item.capability);
  }

  register(domain: string, capability: string): void {
    this.publishers.set(domain, capability);
  }

  list(): CustomerPublisher[] {
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

export { CustomerRegistryStore as CustomerRegistry };
