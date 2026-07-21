/**
 * Ecosystem Intelligence stack registration (Sprint 072 — after digital-twin).
 */

import {
  createEcosystemFederation,
  type EcosystemFederationStack,
} from "@/lib/platform/intelligence/ecosystem-intelligence";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface EcosystemIntelligenceStacks {
  ecosystemIntelligence: EcosystemFederationStack;
}

export function registerEcosystemIntelligenceStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): EcosystemIntelligenceStacks {
  const ecosystemIntelligence =
    options.ecosystemIntelligence ??
    createEcosystemFederation({
      ...(options.ecosystemIntelligenceOptions ?? {}),
    });

  return { ecosystemIntelligence };
}
