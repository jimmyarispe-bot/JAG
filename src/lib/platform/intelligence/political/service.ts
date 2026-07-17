import type { PoliticalDependencies, PoliticalIntelligenceService as Contract, PoliticalRepository as Repository } from "@/lib/platform/intelligence/political/contracts";
import { PoliticalIntelligenceEngineImpl } from "@/lib/platform/intelligence/political/political-engine";
import type { PoliticalQueryRequest, PoliticalQueryResult, PoliticalRequest, PoliticalResult } from "@/lib/platform/intelligence/political/types";

export type PoliticalServiceDependencies = PoliticalDependencies;

export class PoliticalIntelligenceServiceImpl implements Contract {
  private engine: PoliticalIntelligenceEngineImpl;
  constructor(d: PoliticalServiceDependencies = {}) {
    this.engine = (d.engine as PoliticalIntelligenceEngineImpl | undefined) ?? new PoliticalIntelligenceEngineImpl(d);
  }
  build(request: PoliticalRequest): PoliticalResult { return this.engine.build(request); }
  query(result: PoliticalResult, request: PoliticalQueryRequest): PoliticalQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  PoliticalIntelligenceServiceImpl as PoliticalIntelligenceService,
  PoliticalIntelligenceServiceImpl as PoliticalService,
  PoliticalIntelligenceServiceImpl as PoliticalServiceImpl,
};
