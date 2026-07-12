/**
 * Market Intelligence — service façade.
 */

import type {
  MarketDependencies,
  MarketIntelligenceService as MarketIntelligenceServiceContract,
  MarketRepository as MarketRepositoryContract,
} from "@/lib/platform/intelligence/market/contracts";
import {
  MarketIntelligenceEngineImpl,
  type MarketIntelligenceEngine,
} from "@/lib/platform/intelligence/market/market-engine";
import type {
  MarketQueryRequest,
  MarketQueryResult,
  MarketRequest,
  MarketResult,
} from "@/lib/platform/intelligence/market/types";

export interface MarketServiceDependencies extends MarketDependencies {
  engine?: MarketIntelligenceEngine;
}

export class MarketIntelligenceServiceImpl implements MarketIntelligenceServiceContract {
  private readonly engine: MarketIntelligenceEngineImpl;

  constructor(dependencies: MarketServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as MarketIntelligenceEngineImpl | undefined) ??
      new MarketIntelligenceEngineImpl(dependencies);
  }

  build(request: MarketRequest): MarketResult {
    return this.engine.build(request);
  }

  query(result: MarketResult, request: MarketQueryRequest): MarketQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): MarketRepositoryContract {
    return this.engine.repository;
  }
}

export { MarketIntelligenceServiceImpl as MarketIntelligenceService };
export { MarketIntelligenceServiceImpl as MarketService };
export { MarketIntelligenceServiceImpl as MarketServiceImpl };
