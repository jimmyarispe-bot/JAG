/**
 * Knowledge Intelligence — KnowledgeIntelligenceService (Sprint 040).
 *
 * Public façade over KnowledgeIntelligenceEngine with repository accessors.
 */

import type {
  KnowledgeDependencies,
  KnowledgeIntelligenceService as KnowledgeIntelligenceServiceContract,
  KnowledgeRepository as KnowledgeRepositoryContract,
} from "@/lib/platform/intelligence/knowledge/contracts";
import {
  KnowledgeIntelligenceEngineImpl,
  type KnowledgeIntelligenceEngine,
} from "@/lib/platform/intelligence/knowledge/knowledge-engine";
import type {
  KnowledgeQueryRequest,
  KnowledgeQueryResult,
  KnowledgeRequest,
  KnowledgeResult,
} from "@/lib/platform/intelligence/knowledge/types";

export interface KnowledgeServiceDependencies extends KnowledgeDependencies {
  engine?: KnowledgeIntelligenceEngine;
}

/**
 * KnowledgeIntelligenceService — Sprint 040 service entry point.
 */
export class KnowledgeIntelligenceServiceImpl
  implements KnowledgeIntelligenceServiceContract
{
  private readonly engine: KnowledgeIntelligenceEngineImpl;

  constructor(dependencies: KnowledgeServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as KnowledgeIntelligenceEngineImpl | undefined) ??
      new KnowledgeIntelligenceEngineImpl(dependencies);
  }

  build(request: KnowledgeRequest): KnowledgeResult {
    return this.engine.build(request);
  }

  query(
    result: KnowledgeResult,
    request: KnowledgeQueryRequest
  ): KnowledgeQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): KnowledgeRepositoryContract {
    return this.engine.repository;
  }
}

/** Aliases matching Sprint naming. */
export { KnowledgeIntelligenceServiceImpl as KnowledgeIntelligenceService };
export { KnowledgeIntelligenceServiceImpl as KnowledgeService };
export { KnowledgeIntelligenceServiceImpl as KnowledgeServiceImpl };
