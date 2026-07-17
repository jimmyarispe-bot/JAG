/**
 * Operations Registry — tracks which OIOS domains feed operations signals (Sprint 038).
 */

import type { OperationsRegistry as OperationsRegistryContract } from "@/lib/platform/intelligence/operations/contracts";
import type { OperationsPublisher } from "@/lib/platform/intelligence/operations/types";
import { PublisherRegistryMap } from "@/lib/platform/intelligence/common";

const DEFAULT_PUBLISHERS: OperationsPublisher[] = [
  { domain: "organization-dna", capability: "operations.dna_operating_model" },
  { domain: "organization-health", capability: "operations.health_pillar" },
  { domain: "human-capital", capability: "operations.staffing_signals" },
  { domain: "business-model", capability: "operations.complexity_signals" },
  { domain: "oios-core", capability: "operations.execution_baseline" },
];

export class OperationsRegistryStore
  extends PublisherRegistryMap
  implements OperationsRegistryContract {
  constructor(seed = DEFAULT_PUBLISHERS) {
    super(seed);
  }
}

export { OperationsRegistryStore as OperationsRegistry };
