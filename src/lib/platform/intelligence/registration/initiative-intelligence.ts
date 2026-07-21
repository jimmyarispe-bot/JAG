/**
 * Initiative Intelligence stack registration (Sprint 069 — after executive-command-center).
 */

import {
  createInitiativeIntelligence,
  type InitiativeIntelligenceStack,
} from "@/lib/platform/intelligence/initiative-intelligence";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface InitiativeIntelligenceStacks {
  initiativeIntelligence: InitiativeIntelligenceStack;
}

export function registerInitiativeIntelligenceStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): InitiativeIntelligenceStacks {
  const initiativeIntelligence =
    options.initiativeIntelligence ??
    createInitiativeIntelligence({
      ...(options.initiativeIntelligenceOptions ?? {}),
    });

  return { initiativeIntelligence };
}
