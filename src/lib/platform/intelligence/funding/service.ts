/** Public Funding Intelligence service façade. */
import type * as C from "@/lib/platform/intelligence/funding/contracts";
import { FundingIntelligenceEngineImpl } from "@/lib/platform/intelligence/funding/funding-engine";
import type * as T from "@/lib/platform/intelligence/funding/types";
export interface FundingServiceDependencies extends C.FundingDependencies { engine?: C.FundingIntelligenceEngine; }
export class FundingIntelligenceServiceImpl implements C.FundingIntelligenceService {
  private readonly engine: FundingIntelligenceEngineImpl;
  constructor(dependencies: FundingServiceDependencies = {}) { this.engine = (dependencies.engine as FundingIntelligenceEngineImpl | undefined) ?? new FundingIntelligenceEngineImpl(dependencies); }
  build(request: T.FundingRequest): T.FundingResult { return this.engine.build(request); }
  query(result: T.FundingResult, request: T.FundingQueryRequest): T.FundingQueryResult { return this.engine.queries.ask(result, request); }
  repository(): C.FundingRepository { return this.engine.repository; }
}
export { FundingIntelligenceServiceImpl as FundingIntelligenceService, FundingIntelligenceServiceImpl as FundingService, FundingIntelligenceServiceImpl as FundingServiceImpl };
