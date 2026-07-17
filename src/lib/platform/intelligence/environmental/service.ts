import type { EnvironmentalDependencies, EnvironmentalIntelligenceService as Contract, EnvironmentalRepository as Repository } from "@/lib/platform/intelligence/environmental/contracts";
import { EnvironmentalIntelligenceEngineImpl } from "@/lib/platform/intelligence/environmental/environmental-engine";
import type { EnvironmentalQueryRequest, EnvironmentalQueryResult, EnvironmentalRequest, EnvironmentalResult } from "@/lib/platform/intelligence/environmental/types";

export type EnvironmentalServiceDependencies = EnvironmentalDependencies;

export class EnvironmentalIntelligenceServiceImpl implements Contract {
  private engine: EnvironmentalIntelligenceEngineImpl;
  constructor(d: EnvironmentalServiceDependencies = {}) {
    this.engine = (d.engine as EnvironmentalIntelligenceEngineImpl | undefined) ?? new EnvironmentalIntelligenceEngineImpl(d);
  }
  build(request: EnvironmentalRequest): EnvironmentalResult { return this.engine.build(request); }
  query(result: EnvironmentalResult, request: EnvironmentalQueryRequest): EnvironmentalQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  EnvironmentalIntelligenceServiceImpl as EnvironmentalIntelligenceService,
  EnvironmentalIntelligenceServiceImpl as EnvironmentalService,
  EnvironmentalIntelligenceServiceImpl as EnvironmentalServiceImpl,
};
