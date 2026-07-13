import type { ResilienceDependencies, ResilienceIntelligenceService as Contract, ResilienceRepository as Repository } from "@/lib/platform/intelligence/resilience/contracts";
import { ResilienceIntelligenceEngineImpl } from "@/lib/platform/intelligence/resilience/resilience-engine";
import type { ResilienceQueryRequest, ResilienceQueryResult, ResilienceRequest, ResilienceResult } from "@/lib/platform/intelligence/resilience/types";

export interface ResilienceServiceDependencies extends ResilienceDependencies {}

export class ResilienceIntelligenceServiceImpl implements Contract {
  private engine: ResilienceIntelligenceEngineImpl;
  constructor(d: ResilienceServiceDependencies = {}) {
    this.engine = (d.engine as ResilienceIntelligenceEngineImpl | undefined) ?? new ResilienceIntelligenceEngineImpl(d);
  }
  build(request: ResilienceRequest): ResilienceResult { return this.engine.build(request); }
  query(result: ResilienceResult, request: ResilienceQueryRequest): ResilienceQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  ResilienceIntelligenceServiceImpl as ResilienceIntelligenceService,
  ResilienceIntelligenceServiceImpl as ResilienceService,
  ResilienceIntelligenceServiceImpl as ResilienceServiceImpl,
};
