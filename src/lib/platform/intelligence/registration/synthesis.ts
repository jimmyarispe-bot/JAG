/**
 * Executive Synthesis stack registration (Sprint 061 — after wisdom).
 */

import {
  createSynthesisIntelligence,
  type SynthesisStack,
} from "@/lib/platform/intelligence/synthesis";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface SynthesisStacks {
  synthesis: SynthesisStack;
}

export function registerSynthesisStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): SynthesisStacks {
  const synthesis =
    options.synthesis ??
    createSynthesisIntelligence({
      ...(options.synthesisOptions ?? {}),
    });

  return { synthesis };
}
