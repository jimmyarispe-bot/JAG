/** Public Organizational Improvement service façade (Sprint 036). */
import type * as C from "@/lib/platform/intelligence/organizational-improvement/contracts";
import { OrganizationalImprovementEngineImpl } from "@/lib/platform/intelligence/organizational-improvement/improvement-engine";
import type * as T from "@/lib/platform/intelligence/organizational-improvement/types";

export interface ImprovementServiceDependencies extends C.ImprovementDependencies {
  engine?: C.OrganizationalImprovementEngine;
}

export class ImprovementIntelligenceServiceImpl implements C.ImprovementIntelligenceService {
  private readonly engine: OrganizationalImprovementEngineImpl;

  constructor(dependencies: ImprovementServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as OrganizationalImprovementEngineImpl | undefined) ??
      new OrganizationalImprovementEngineImpl(dependencies);
  }

  build(request: T.ImprovementRequest): T.ImprovementResult {
    return this.engine.build(request);
  }

  query(
    result: T.ImprovementResult,
    request: T.ImprovementQueryRequest
  ): T.ImprovementQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): C.ImprovementRepository {
    return this.engine.repository;
  }
}

export {
  ImprovementIntelligenceServiceImpl as ImprovementIntelligenceService,
  ImprovementIntelligenceServiceImpl as ImprovementService,
  ImprovementIntelligenceServiceImpl as ImprovementServiceImpl,
};
