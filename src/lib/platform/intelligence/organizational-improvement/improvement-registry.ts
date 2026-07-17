/** Improvement Registry — tracks which OIOS domains publish improvements (Sprint 036). */

import type * as C from "@/lib/platform/intelligence/organizational-improvement/contracts";
import type { ImprovementSourceDomain } from "@/lib/platform/intelligence/organizational-improvement/types";
import { PublisherRegistryMap } from "@/lib/platform/intelligence/common";

const DEFAULT_PUBLISHERS: Array<{ domain: ImprovementSourceDomain; capability: string }> = [
  { domain: "organization-health", capability: "improvement.health_signals" },
  { domain: "executive-graph", capability: "improvement.graph_paths" },
  { domain: "executive-decision", capability: "improvement.decision_actions" },
  { domain: "predictive", capability: "improvement.emerging_signals" },
  { domain: "human-capital", capability: "improvement.workforce_capacity" },
  { domain: "revenue", capability: "improvement.revenue_growth" },
  { domain: "funding", capability: "improvement.funding_pipeline" },
  { domain: "opportunity", capability: "improvement.opportunity_exchange" },
  { domain: "board-governance", capability: "improvement.governance_oversight" },
  { domain: "future-domains", capability: "improvement.future_adapters" },
];

export class ImprovementRegistryStore
  extends PublisherRegistryMap<ImprovementSourceDomain>
  implements C.ImprovementRegistry {
  constructor(seed = DEFAULT_PUBLISHERS) {
    super(seed);
  }
}

export { ImprovementRegistryStore as ImprovementRegistry };
