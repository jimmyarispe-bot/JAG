/**
 * Portfolio Intelligence service facade (Sprint 070).
 */

import { PortfolioEngine } from "@/lib/platform/intelligence/portfolio-intelligence/engine/portfolio-engine";
import type {
  PortfolioRequest,
  PortfolioResult,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

export interface PortfolioServiceDependencies {
  engine?: PortfolioEngine;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class PortfolioIntelligenceService {
  private readonly engine: PortfolioEngine;

  constructor(deps: PortfolioServiceDependencies = {}) {
    this.engine =
      deps.engine ??
      new PortfolioEngine({
        createId: deps.createId,
        now: deps.now,
      });
  }

  build(request: PortfolioRequest): PortfolioResult {
    return this.engine.build(request);
  }
}
