/**
 * Revenue Intelligence — RevenueIntelligenceService (Sprint 033).
 *
 * Public façade over RevenueIntelligenceEngine with repository accessors.
 */

import type {
  RevenueDependencies,
  RevenueIntelligenceService as RevenueIntelligenceServiceContract,
  RevenueRepository as RevenueRepositoryContract,
} from "@/lib/platform/intelligence/revenue/contracts";
import {
  RevenueIntelligenceEngineImpl,
  type RevenueIntelligenceEngine,
} from "@/lib/platform/intelligence/revenue/revenue-engine";
import type {
  RevenueQueryRequest,
  RevenueQueryResult,
  RevenueRequest,
  RevenueResult,
} from "@/lib/platform/intelligence/revenue/types";

export interface RevenueServiceDependencies extends RevenueDependencies {
  engine?: RevenueIntelligenceEngine;
}

/**
 * RevenueIntelligenceService — Sprint 033 service entry point.
 */
export class RevenueIntelligenceServiceImpl
  implements RevenueIntelligenceServiceContract
{
  private readonly engine: RevenueIntelligenceEngineImpl;

  constructor(dependencies: RevenueServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as RevenueIntelligenceEngineImpl | undefined) ??
      new RevenueIntelligenceEngineImpl(dependencies);
  }

  build(request: RevenueRequest): RevenueResult {
    return this.engine.build(request);
  }

  query(
    result: RevenueResult,
    request: RevenueQueryRequest
  ): RevenueQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): RevenueRepositoryContract {
    return this.engine.repository;
  }
}

/** Aliases matching Sprint naming. */
export { RevenueIntelligenceServiceImpl as RevenueIntelligenceService };
export { RevenueIntelligenceServiceImpl as RevenueService };
export { RevenueIntelligenceServiceImpl as RevenueServiceImpl };
