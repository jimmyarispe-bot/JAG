import type { CollectiveDependencies, CollectiveIntelligenceService as Contract, CollectiveRepository as Repository } from "@/lib/platform/intelligence/collective/contracts";
import { CollectiveIntelligenceEngineImpl } from "@/lib/platform/intelligence/collective/collective-engine";
import type { CollectiveQueryRequest, CollectiveQueryResult, CollectiveRequest, CollectiveResult } from "@/lib/platform/intelligence/collective/types";

export type CollectiveServiceDependencies = CollectiveDependencies;

export class CollectiveIntelligenceServiceImpl implements Contract {
  private engine: CollectiveIntelligenceEngineImpl;
  constructor(d: CollectiveServiceDependencies = {}) {
    this.engine = (d.engine as CollectiveIntelligenceEngineImpl | undefined) ?? new CollectiveIntelligenceEngineImpl(d);
  }
  build(request: CollectiveRequest): CollectiveResult { return this.engine.build(request); }
  query(result: CollectiveResult, request: CollectiveQueryRequest): CollectiveQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  CollectiveIntelligenceServiceImpl as CollectiveIntelligenceService,
  CollectiveIntelligenceServiceImpl as CollectiveService,
  CollectiveIntelligenceServiceImpl as CollectiveServiceImpl,
};
