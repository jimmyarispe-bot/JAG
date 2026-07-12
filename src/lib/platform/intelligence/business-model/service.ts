/**
 * Business Model Intelligence — BusinessModelIntelligenceService (Sprint 037).
 *
 * Public façade over BusinessModelIntelligenceEngine with repository accessors.
 */

import type {
  BusinessModelDependencies,
  BusinessModelIntelligenceService as BusinessModelIntelligenceServiceContract,
  BusinessModelRepository as BusinessModelRepositoryContract,
} from "@/lib/platform/intelligence/business-model/contracts";
import {
  BusinessModelIntelligenceEngineImpl,
  type BusinessModelIntelligenceEngine,
} from "@/lib/platform/intelligence/business-model/business-model-engine";
import type {
  BusinessModelQueryRequest,
  BusinessModelQueryResult,
  BusinessModelRequest,
  BusinessModelResult,
} from "@/lib/platform/intelligence/business-model/types";

export interface BusinessModelServiceDependencies
  extends BusinessModelDependencies {
  engine?: BusinessModelIntelligenceEngine;
}

/**
 * BusinessModelIntelligenceService — Sprint 037 service entry point.
 */
export class BusinessModelIntelligenceServiceImpl
  implements BusinessModelIntelligenceServiceContract
{
  private readonly engine: BusinessModelIntelligenceEngineImpl;

  constructor(dependencies: BusinessModelServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as BusinessModelIntelligenceEngineImpl | undefined) ??
      new BusinessModelIntelligenceEngineImpl(dependencies);
  }

  build(request: BusinessModelRequest): BusinessModelResult {
    return this.engine.build(request);
  }

  query(
    result: BusinessModelResult,
    request: BusinessModelQueryRequest
  ): BusinessModelQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): BusinessModelRepositoryContract {
    return this.engine.repository;
  }
}

/** Aliases matching Sprint naming. */
export { BusinessModelIntelligenceServiceImpl as BusinessModelIntelligenceService };
export { BusinessModelIntelligenceServiceImpl as BusinessModelService };
export { BusinessModelIntelligenceServiceImpl as BusinessModelServiceImpl };
