import type { InstitutionalMemoryDependencies, InstitutionalMemoryIntelligenceService as Contract, InstitutionalMemoryRepository as Repository } from "@/lib/platform/intelligence/institutional-memory/contracts";
import { InstitutionalMemoryIntelligenceEngineImpl } from "@/lib/platform/intelligence/institutional-memory/institutional-memory-engine";
import type { InstitutionalMemoryQueryRequest, InstitutionalMemoryQueryResult, InstitutionalMemoryRequest, InstitutionalMemoryResult } from "@/lib/platform/intelligence/institutional-memory/types";

export type InstitutionalMemoryServiceDependencies = InstitutionalMemoryDependencies;

export class InstitutionalMemoryIntelligenceServiceImpl implements Contract {
  private engine: InstitutionalMemoryIntelligenceEngineImpl;
  constructor(d: InstitutionalMemoryServiceDependencies = {}) {
    this.engine = (d.engine as InstitutionalMemoryIntelligenceEngineImpl | undefined) ?? new InstitutionalMemoryIntelligenceEngineImpl(d);
  }
  build(request: InstitutionalMemoryRequest): InstitutionalMemoryResult { return this.engine.build(request); }
  query(result: InstitutionalMemoryResult, request: InstitutionalMemoryQueryRequest): InstitutionalMemoryQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  InstitutionalMemoryIntelligenceServiceImpl as InstitutionalMemoryIntelligenceService,
  InstitutionalMemoryIntelligenceServiceImpl as InstitutionalMemoryService,
  InstitutionalMemoryIntelligenceServiceImpl as InstitutionalMemoryServiceImpl,
};
