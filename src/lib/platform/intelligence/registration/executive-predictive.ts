/**
 * Predictive Intelligence stack registration (Sprint 065 — after decision-intelligence).
 */

import {
  createExecutivePredictiveIntelligence,
  type ExecutivePredictiveStack,
} from "@/lib/platform/intelligence/executive-predictive";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface ExecutivePredictiveStacks {
  executivePredictive: ExecutivePredictiveStack;
}

export function registerExecutivePredictiveStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): ExecutivePredictiveStacks {
  const executivePredictive =
    options.executivePredictive ??
    createExecutivePredictiveIntelligence({
      ...(options.executivePredictiveOptions ?? {}),
    });

  return { executivePredictive };
}
