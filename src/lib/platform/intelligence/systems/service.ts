import type { SystemsDependencies, SystemsIntelligenceService as Contract, SystemsRepository as Repository } from "@/lib/platform/intelligence/systems/contracts";
import { SystemsIntelligenceEngineImpl } from "@/lib/platform/intelligence/systems/systems-engine";
import type { SystemsQueryRequest, SystemsQueryResult, SystemsRequest, SystemsResult } from "@/lib/platform/intelligence/systems/types";

export type SystemsServiceDependencies = SystemsDependencies;

export class SystemsIntelligenceServiceImpl implements Contract {
  private engine: SystemsIntelligenceEngineImpl;
  constructor(d: SystemsServiceDependencies = {}) {
    this.engine = (d.engine as SystemsIntelligenceEngineImpl | undefined) ?? new SystemsIntelligenceEngineImpl(d);
  }
  build(request: SystemsRequest): SystemsResult { return this.engine.build(request); }
  query(result: SystemsResult, request: SystemsQueryRequest): SystemsQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  SystemsIntelligenceServiceImpl as SystemsIntelligenceService,
  SystemsIntelligenceServiceImpl as SystemsService,
  SystemsIntelligenceServiceImpl as SystemsServiceImpl,
};
