import type { CulturalDependencies, CulturalIntelligenceService as Contract, CulturalRepository as Repository } from "@/lib/platform/intelligence/cultural/contracts";
import { CulturalIntelligenceEngineImpl } from "@/lib/platform/intelligence/cultural/cultural-engine";
import type { CulturalQueryRequest, CulturalQueryResult, CulturalRequest, CulturalResult } from "@/lib/platform/intelligence/cultural/types";

export type CulturalServiceDependencies = CulturalDependencies;

export class CulturalIntelligenceServiceImpl implements Contract {
  private engine: CulturalIntelligenceEngineImpl;
  constructor(d: CulturalServiceDependencies = {}) {
    this.engine = (d.engine as CulturalIntelligenceEngineImpl | undefined) ?? new CulturalIntelligenceEngineImpl(d);
  }
  build(request: CulturalRequest): CulturalResult { return this.engine.build(request); }
  query(result: CulturalResult, request: CulturalQueryRequest): CulturalQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  CulturalIntelligenceServiceImpl as CulturalIntelligenceService,
  CulturalIntelligenceServiceImpl as CulturalService,
  CulturalIntelligenceServiceImpl as CulturalServiceImpl,
};
