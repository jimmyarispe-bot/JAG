import type { ImpactDependencies, ImpactIntelligenceService as Contract, ImpactRepository as Repository } from "@/lib/platform/intelligence/impact/contracts";
import { ImpactIntelligenceEngineImpl } from "@/lib/platform/intelligence/impact/impact-engine";
import type { ImpactQueryRequest, ImpactQueryResult, ImpactRequest, ImpactResult } from "@/lib/platform/intelligence/impact/types";
export type ImpactServiceDependencies = ImpactDependencies;
export class ImpactIntelligenceServiceImpl implements Contract {
  private engine: ImpactIntelligenceEngineImpl;
  constructor(d: ImpactServiceDependencies={}) { this.engine=(d.engine as ImpactIntelligenceEngineImpl|undefined)??new ImpactIntelligenceEngineImpl(d); }
  build(request:ImpactRequest):ImpactResult{return this.engine.build(request);} query(result:ImpactResult,request:ImpactQueryRequest):ImpactQueryResult{return this.engine.queries.ask(result,request);} repository():Repository{return this.engine.repository;}
}
export { ImpactIntelligenceServiceImpl as ImpactIntelligenceService, ImpactIntelligenceServiceImpl as ImpactService, ImpactIntelligenceServiceImpl as ImpactServiceImpl };
