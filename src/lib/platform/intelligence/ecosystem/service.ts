import type { EcosystemDependencies, EcosystemIntelligenceService as Contract, EcosystemRepository as Repository } from "@/lib/platform/intelligence/ecosystem/contracts";
import { EcosystemIntelligenceEngineImpl } from "@/lib/platform/intelligence/ecosystem/ecosystem-engine";
import type { EcosystemQueryRequest, EcosystemQueryResult, EcosystemRequest, EcosystemResult } from "@/lib/platform/intelligence/ecosystem/types";

export interface EcosystemServiceDependencies extends EcosystemDependencies {}

export class EcosystemIntelligenceServiceImpl implements Contract {
  private engine: EcosystemIntelligenceEngineImpl;
  constructor(d: EcosystemServiceDependencies = {}) {
    this.engine = (d.engine as EcosystemIntelligenceEngineImpl | undefined) ?? new EcosystemIntelligenceEngineImpl(d);
  }
  build(request: EcosystemRequest): EcosystemResult { return this.engine.build(request); }
  query(result: EcosystemResult, request: EcosystemQueryRequest): EcosystemQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  EcosystemIntelligenceServiceImpl as EcosystemIntelligenceService,
  EcosystemIntelligenceServiceImpl as EcosystemService,
  EcosystemIntelligenceServiceImpl as EcosystemServiceImpl,
};
