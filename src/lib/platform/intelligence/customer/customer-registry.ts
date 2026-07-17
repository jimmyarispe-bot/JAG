/**
 * Customer Registry — tracks which OIOS domains feed customer signals (Sprint 039).
 */

import type { CustomerRegistry as CustomerRegistryContract } from "@/lib/platform/intelligence/customer/contracts";
import type { CustomerPublisher } from "@/lib/platform/intelligence/customer/types";
import { PublisherRegistryMap } from "@/lib/platform/intelligence/common";

const DEFAULT_PUBLISHERS: CustomerPublisher[] = [
  { domain: "organization-dna", capability: "customer.dna_personas" },
  { domain: "organization-health", capability: "customer.enrollment_health" },
  { domain: "operations", capability: "customer.support_signals" },
  { domain: "revenue", capability: "customer.retention_proxies" },
  { domain: "oios-core", capability: "customer.execution_baseline" },
];

export class CustomerRegistryStore
  extends PublisherRegistryMap
  implements CustomerRegistryContract {
  constructor(seed = DEFAULT_PUBLISHERS) {
    super(seed);
  }
}

export { CustomerRegistryStore as CustomerRegistry };
