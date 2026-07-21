/**
 * Portfolio Intelligence — Sprint 070 / 0.1.0
 *
 * Enterprise portfolio layer governing all strategic initiatives collectively.
 * Optimizes alignment, capacity, allocation, risk, and impact — advisory only.
 *
 * Distinct from frozen `innovation/innovation-portfolio-intelligence`.
 *
 * Module id: portfolio-intelligence
 * Hard DAG predecessor: initiative-intelligence
 */

export * from "@/lib/platform/intelligence/portfolio-intelligence/types";
export * from "@/lib/platform/intelligence/portfolio-intelligence/registry";
export * from "@/lib/platform/intelligence/portfolio-intelligence/scoring/strategic-alignment";
export * from "@/lib/platform/intelligence/portfolio-intelligence/scoring/roi-score";
export * from "@/lib/platform/intelligence/portfolio-intelligence/scoring/risk-score";
export * from "@/lib/platform/intelligence/portfolio-intelligence/scoring/urgency-score";
export * from "@/lib/platform/intelligence/portfolio-intelligence/scoring/confidence-score";
export * from "@/lib/platform/intelligence/portfolio-intelligence/planning/dependencies";
export * from "@/lib/platform/intelligence/portfolio-intelligence/planning/sequencing";
export * from "@/lib/platform/intelligence/portfolio-intelligence/planning/roadmap";
export * from "@/lib/platform/intelligence/portfolio-intelligence/planning/scenarios";
export * from "@/lib/platform/intelligence/portfolio-intelligence/engine/prioritization-engine";
export * from "@/lib/platform/intelligence/portfolio-intelligence/engine/capacity-engine";
export * from "@/lib/platform/intelligence/portfolio-intelligence/engine/allocation-engine";
export * from "@/lib/platform/intelligence/portfolio-intelligence/engine/portfolio-health";
export * from "@/lib/platform/intelligence/portfolio-intelligence/engine/optimization-engine";
export * from "@/lib/platform/intelligence/portfolio-intelligence/engine/portfolio-engine";
export * from "@/lib/platform/intelligence/portfolio-intelligence/services/portfolio-service";

import { PortfolioEngine } from "@/lib/platform/intelligence/portfolio-intelligence/engine/portfolio-engine";
import {
  PortfolioIntelligenceService,
  type PortfolioServiceDependencies,
} from "@/lib/platform/intelligence/portfolio-intelligence/services/portfolio-service";

export interface PortfolioIntelligenceStack {
  service: PortfolioIntelligenceService;
  engine: PortfolioEngine;
}

export interface CreatePortfolioIntelligenceOptions extends PortfolioServiceDependencies {}

export function createPortfolioIntelligence(
  options: CreatePortfolioIntelligenceOptions = {}
): PortfolioIntelligenceStack {
  const engine =
    options.engine ??
    new PortfolioEngine({
      createId: options.createId,
      now: options.now,
    });
  const service = new PortfolioIntelligenceService({ ...options, engine });
  return { service, engine };
}

export const createPortfolioIntelligenceStack = createPortfolioIntelligence;
