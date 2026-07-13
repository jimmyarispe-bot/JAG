import type { EthicalDependencies, EthicalIntelligenceService as Contract, EthicalRepository as Repository } from "@/lib/platform/intelligence/ethical/contracts";
import { EthicalIntelligenceEngineImpl } from "@/lib/platform/intelligence/ethical/ethical-engine";
import type { EthicalQueryRequest, EthicalQueryResult, EthicalRequest, EthicalResult } from "@/lib/platform/intelligence/ethical/types";

export interface EthicalServiceDependencies extends EthicalDependencies {}

export class EthicalIntelligenceServiceImpl implements Contract {
  private engine: EthicalIntelligenceEngineImpl;
  constructor(d: EthicalServiceDependencies = {}) {
    this.engine = (d.engine as EthicalIntelligenceEngineImpl | undefined) ?? new EthicalIntelligenceEngineImpl(d);
  }
  build(request: EthicalRequest): EthicalResult { return this.engine.build(request); }
  query(result: EthicalResult, request: EthicalQueryRequest): EthicalQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  EthicalIntelligenceServiceImpl as EthicalIntelligenceService,
  EthicalIntelligenceServiceImpl as EthicalService,
  EthicalIntelligenceServiceImpl as EthicalServiceImpl,
};
