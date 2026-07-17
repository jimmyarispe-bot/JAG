/**
 * Wisdom stack registration (terminal domain).
 */

import {
  createWisdomIntelligence,
  type WisdomStack,
} from "@/lib/platform/intelligence/wisdom";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface WisdomStacks {
  wisdom: WisdomStack;
}

export function registerWisdomStacks(
  options: CreateIntelligenceServiceOptions,
  wiring: DnaOiosWiring
): WisdomStacks {
  const { organizationDna, oios } = wiring;

  const wisdom =
    options.wisdom ??
    createWisdomIntelligence({
      ...(options.wisdomOptions ?? {}),
      organizationDna: options.wisdomOptions?.organizationDna ?? organizationDna,
      oios: options.wisdomOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });

  return { wisdom };
}
