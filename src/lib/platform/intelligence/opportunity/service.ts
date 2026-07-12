/** Public Opportunity Intelligence service façade (Sprint 035). */
import type * as C from "@/lib/platform/intelligence/opportunity/contracts";
import { OpportunityIntelligenceEngineImpl } from "@/lib/platform/intelligence/opportunity/opportunity-engine";
import type * as T from "@/lib/platform/intelligence/opportunity/types";

export interface OpportunityServiceDependencies extends C.OpportunityDependencies {
  engine?: C.OpportunityIntelligenceEngine;
}

export class OpportunityIntelligenceServiceImpl implements C.OpportunityIntelligenceService {
  private readonly engine: OpportunityIntelligenceEngineImpl;

  constructor(dependencies: OpportunityServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as OpportunityIntelligenceEngineImpl | undefined) ??
      new OpportunityIntelligenceEngineImpl(dependencies);
  }

  build(request: T.OpportunityRequest): T.OpportunityResult {
    return this.engine.build(request);
  }

  query(
    result: T.OpportunityResult,
    request: T.OpportunityQueryRequest
  ): T.OpportunityQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): C.OpportunityRepository {
    return this.engine.repository;
  }
}

export {
  OpportunityIntelligenceServiceImpl as OpportunityIntelligenceService,
  OpportunityIntelligenceServiceImpl as OpportunityService,
  OpportunityIntelligenceServiceImpl as OpportunityServiceImpl,
};
