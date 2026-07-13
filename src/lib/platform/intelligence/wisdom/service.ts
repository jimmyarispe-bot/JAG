import type { WisdomDependencies, WisdomIntelligenceService as Contract, WisdomRepository as Repository } from "@/lib/platform/intelligence/wisdom/contracts";
import { WisdomIntelligenceEngineImpl } from "@/lib/platform/intelligence/wisdom/wisdom-engine";
import type { WisdomQueryRequest, WisdomQueryResult, WisdomRequest, WisdomResult } from "@/lib/platform/intelligence/wisdom/types";

export interface WisdomServiceDependencies extends WisdomDependencies {}

export class WisdomIntelligenceServiceImpl implements Contract {
  private engine: WisdomIntelligenceEngineImpl;
  constructor(d: WisdomServiceDependencies = {}) {
    this.engine = (d.engine as WisdomIntelligenceEngineImpl | undefined) ?? new WisdomIntelligenceEngineImpl(d);
  }
  build(request: WisdomRequest): WisdomResult { return this.engine.build(request); }
  query(result: WisdomResult, request: WisdomQueryRequest): WisdomQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  WisdomIntelligenceServiceImpl as WisdomIntelligenceService,
  WisdomIntelligenceServiceImpl as WisdomService,
  WisdomIntelligenceServiceImpl as WisdomServiceImpl,
};
