/**
 * Portfolio Intelligence stack registration (Sprint 070 — after initiative-intelligence).
 */

import {
  createPortfolioIntelligence,
  type PortfolioIntelligenceStack,
} from "@/lib/platform/intelligence/portfolio-intelligence";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface PortfolioIntelligenceStacks {
  portfolioIntelligence: PortfolioIntelligenceStack;
}

export function registerPortfolioIntelligenceStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): PortfolioIntelligenceStacks {
  const portfolioIntelligence =
    options.portfolioIntelligence ??
    createPortfolioIntelligence({
      ...(options.portfolioIntelligenceOptions ?? {}),
    });

  return { portfolioIntelligence };
}
