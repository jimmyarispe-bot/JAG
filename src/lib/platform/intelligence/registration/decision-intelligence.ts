/**
 * Decision Intelligence stack registration (Sprint 064 — after executive-memory).
 */

import {
  createDecisionIntelligence,
  type DecisionIntelligenceStack,
} from "@/lib/platform/intelligence/decision-intelligence";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface DecisionIntelligenceStacks {
  decisionIntelligence: DecisionIntelligenceStack;
}

export function registerDecisionIntelligenceStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): DecisionIntelligenceStacks {
  const decisionIntelligence =
    options.decisionIntelligence ??
    createDecisionIntelligence({
      ...(options.decisionIntelligenceOptions ?? {}),
    });

  return { decisionIntelligence };
}
