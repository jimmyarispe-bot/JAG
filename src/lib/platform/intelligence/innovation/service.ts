/**
 * Innovation Intelligence — service façade.
 */

import type {
  InnovationDependencies,
  InnovationIntelligenceService as InnovationIntelligenceServiceContract,
  InnovationRepository as InnovationRepositoryContract,
} from "@/lib/platform/intelligence/innovation/contracts";
import {
  InnovationIntelligenceEngineImpl,
  type InnovationIntelligenceEngine,
} from "@/lib/platform/intelligence/innovation/innovation-engine";
import type {
  InnovationQueryRequest,
  InnovationQueryResult,
  InnovationRequest,
  InnovationResult,
} from "@/lib/platform/intelligence/innovation/types";

export interface InnovationServiceDependencies extends InnovationDependencies {
  engine?: InnovationIntelligenceEngine;
}

export class InnovationIntelligenceServiceImpl implements InnovationIntelligenceServiceContract {
  private readonly engine: InnovationIntelligenceEngineImpl;

  constructor(dependencies: InnovationServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as InnovationIntelligenceEngineImpl | undefined) ??
      new InnovationIntelligenceEngineImpl(dependencies);
  }

  build(request: InnovationRequest): InnovationResult {
    return this.engine.build(request);
  }

  query(result: InnovationResult, request: InnovationQueryRequest): InnovationQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): InnovationRepositoryContract {
    return this.engine.repository;
  }
}

export { InnovationIntelligenceServiceImpl as InnovationIntelligenceService };
export { InnovationIntelligenceServiceImpl as InnovationService };
export { InnovationIntelligenceServiceImpl as InnovationServiceImpl };
