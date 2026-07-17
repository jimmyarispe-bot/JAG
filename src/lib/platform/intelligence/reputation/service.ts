import type { ReputationDependencies, ReputationIntelligenceService as Contract, ReputationRepository as Repository } from "@/lib/platform/intelligence/reputation/contracts";
import { ReputationIntelligenceEngineImpl } from "@/lib/platform/intelligence/reputation/reputation-engine";
import type { ReputationQueryRequest, ReputationQueryResult, ReputationRequest, ReputationResult } from "@/lib/platform/intelligence/reputation/types";

export type ReputationServiceDependencies = ReputationDependencies;

export class ReputationIntelligenceServiceImpl implements Contract {
  private engine: ReputationIntelligenceEngineImpl;
  constructor(d: ReputationServiceDependencies = {}) {
    this.engine = (d.engine as ReputationIntelligenceEngineImpl | undefined) ?? new ReputationIntelligenceEngineImpl(d);
  }
  build(request: ReputationRequest): ReputationResult { return this.engine.build(request); }
  query(result: ReputationResult, request: ReputationQueryRequest): ReputationQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  ReputationIntelligenceServiceImpl as ReputationIntelligenceService,
  ReputationIntelligenceServiceImpl as ReputationService,
  ReputationIntelligenceServiceImpl as ReputationServiceImpl,
};
