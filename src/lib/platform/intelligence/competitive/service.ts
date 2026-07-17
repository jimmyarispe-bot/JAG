import type { CompetitiveDependencies, CompetitiveIntelligenceService as Contract, CompetitiveRepository as Repository } from "@/lib/platform/intelligence/competitive/contracts";
import { CompetitiveIntelligenceEngineImpl } from "@/lib/platform/intelligence/competitive/competitive-engine";
import type { CompetitiveQueryRequest, CompetitiveQueryResult, CompetitiveRequest, CompetitiveResult } from "@/lib/platform/intelligence/competitive/types";

export type CompetitiveServiceDependencies = CompetitiveDependencies;

export class CompetitiveIntelligenceServiceImpl implements Contract {
  private engine: CompetitiveIntelligenceEngineImpl;
  constructor(d: CompetitiveServiceDependencies = {}) {
    this.engine = (d.engine as CompetitiveIntelligenceEngineImpl | undefined) ?? new CompetitiveIntelligenceEngineImpl(d);
  }
  build(request: CompetitiveRequest): CompetitiveResult { return this.engine.build(request); }
  query(result: CompetitiveResult, request: CompetitiveQueryRequest): CompetitiveQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  CompetitiveIntelligenceServiceImpl as CompetitiveIntelligenceService,
  CompetitiveIntelligenceServiceImpl as CompetitiveService,
  CompetitiveIntelligenceServiceImpl as CompetitiveServiceImpl,
};
