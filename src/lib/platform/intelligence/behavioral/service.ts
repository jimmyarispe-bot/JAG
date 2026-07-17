import type { BehavioralDependencies, BehavioralIntelligenceService as Contract, BehavioralRepository as Repository } from "@/lib/platform/intelligence/behavioral/contracts";
import { BehavioralIntelligenceEngineImpl } from "@/lib/platform/intelligence/behavioral/behavioral-engine";
import type { BehavioralQueryRequest, BehavioralQueryResult, BehavioralRequest, BehavioralResult } from "@/lib/platform/intelligence/behavioral/types";

export type BehavioralServiceDependencies = BehavioralDependencies;

export class BehavioralIntelligenceServiceImpl implements Contract {
  private engine: BehavioralIntelligenceEngineImpl;
  constructor(d: BehavioralServiceDependencies = {}) {
    this.engine = (d.engine as BehavioralIntelligenceEngineImpl | undefined) ?? new BehavioralIntelligenceEngineImpl(d);
  }
  build(request: BehavioralRequest): BehavioralResult { return this.engine.build(request); }
  query(result: BehavioralResult, request: BehavioralQueryRequest): BehavioralQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  BehavioralIntelligenceServiceImpl as BehavioralIntelligenceService,
  BehavioralIntelligenceServiceImpl as BehavioralService,
  BehavioralIntelligenceServiceImpl as BehavioralServiceImpl,
};
