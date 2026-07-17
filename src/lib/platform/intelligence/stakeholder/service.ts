import type { StakeholderDependencies, StakeholderIntelligenceService as Contract, StakeholderRepository as Repository } from "@/lib/platform/intelligence/stakeholder/contracts";
import { StakeholderIntelligenceEngineImpl } from "@/lib/platform/intelligence/stakeholder/stakeholder-engine";
import type { StakeholderQueryRequest, StakeholderQueryResult, StakeholderRequest, StakeholderResult } from "@/lib/platform/intelligence/stakeholder/types";

export type StakeholderServiceDependencies = StakeholderDependencies;

export class StakeholderIntelligenceServiceImpl implements Contract {
  private engine: StakeholderIntelligenceEngineImpl;
  constructor(d: StakeholderServiceDependencies = {}) {
    this.engine = (d.engine as StakeholderIntelligenceEngineImpl | undefined) ?? new StakeholderIntelligenceEngineImpl(d);
  }
  build(request: StakeholderRequest): StakeholderResult { return this.engine.build(request); }
  query(result: StakeholderResult, request: StakeholderQueryRequest): StakeholderQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  StakeholderIntelligenceServiceImpl as StakeholderIntelligenceService,
  StakeholderIntelligenceServiceImpl as StakeholderService,
  StakeholderIntelligenceServiceImpl as StakeholderServiceImpl,
};
