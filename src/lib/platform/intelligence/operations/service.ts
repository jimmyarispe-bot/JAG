/**
 * Operations Intelligence — OperationsIntelligenceService (Sprint 038).
 *
 * Public façade over OperationsIntelligenceEngine with repository accessors.
 */

import type {
  OperationsDependencies,
  OperationsIntelligenceService as OperationsIntelligenceServiceContract,
  OperationsRepository as OperationsRepositoryContract,
} from "@/lib/platform/intelligence/operations/contracts";
import {
  OperationsIntelligenceEngineImpl,
  type OperationsIntelligenceEngine,
} from "@/lib/platform/intelligence/operations/operations-engine";
import type {
  OperationsQueryRequest,
  OperationsQueryResult,
  OperationsRequest,
  OperationsResult,
} from "@/lib/platform/intelligence/operations/types";

export interface OperationsServiceDependencies extends OperationsDependencies {
  engine?: OperationsIntelligenceEngine;
}

/**
 * OperationsIntelligenceService — Sprint 038 service entry point.
 */
export class OperationsIntelligenceServiceImpl
  implements OperationsIntelligenceServiceContract
{
  private readonly engine: OperationsIntelligenceEngineImpl;

  constructor(dependencies: OperationsServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as OperationsIntelligenceEngineImpl | undefined) ??
      new OperationsIntelligenceEngineImpl(dependencies);
  }

  build(request: OperationsRequest): OperationsResult {
    return this.engine.build(request);
  }

  query(
    result: OperationsResult,
    request: OperationsQueryRequest
  ): OperationsQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): OperationsRepositoryContract {
    return this.engine.repository;
  }
}

/** Aliases matching Sprint naming. */
export { OperationsIntelligenceServiceImpl as OperationsIntelligenceService };
export { OperationsIntelligenceServiceImpl as OperationsService };
export { OperationsIntelligenceServiceImpl as OperationsServiceImpl };
