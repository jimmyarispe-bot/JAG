import type { EconomicDependencies, EconomicIntelligenceService as Contract, EconomicRepository as Repository } from "@/lib/platform/intelligence/economic/contracts";
import { EconomicIntelligenceEngineImpl } from "@/lib/platform/intelligence/economic/economic-engine";
import type { EconomicQueryRequest, EconomicQueryResult, EconomicRequest, EconomicResult } from "@/lib/platform/intelligence/economic/types";

export interface EconomicServiceDependencies extends EconomicDependencies {}

export class EconomicIntelligenceServiceImpl implements Contract {
  private engine: EconomicIntelligenceEngineImpl;
  constructor(d: EconomicServiceDependencies = {}) {
    this.engine = (d.engine as EconomicIntelligenceEngineImpl | undefined) ?? new EconomicIntelligenceEngineImpl(d);
  }
  build(request: EconomicRequest): EconomicResult { return this.engine.build(request); }
  query(result: EconomicResult, request: EconomicQueryRequest): EconomicQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  EconomicIntelligenceServiceImpl as EconomicIntelligenceService,
  EconomicIntelligenceServiceImpl as EconomicService,
  EconomicIntelligenceServiceImpl as EconomicServiceImpl,
};
