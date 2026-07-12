/**
 * Document Intelligence — service façade.
 */

import type {
  DocumentDependencies,
  DocumentIntelligenceService as DocumentIntelligenceServiceContract,
  DocumentRepository as DocumentRepositoryContract,
} from "@/lib/platform/intelligence/document/contracts";
import {
  DocumentIntelligenceEngineImpl,
  type DocumentIntelligenceEngine,
} from "@/lib/platform/intelligence/document/document-engine";
import type {
  DocumentQueryRequest,
  DocumentQueryResult,
  DocumentRequest,
  DocumentResult,
} from "@/lib/platform/intelligence/document/types";

export interface DocumentServiceDependencies extends DocumentDependencies {
  engine?: DocumentIntelligenceEngine;
}

export class DocumentIntelligenceServiceImpl implements DocumentIntelligenceServiceContract {
  private readonly engine: DocumentIntelligenceEngineImpl;

  constructor(dependencies: DocumentServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as DocumentIntelligenceEngineImpl | undefined) ??
      new DocumentIntelligenceEngineImpl(dependencies);
  }

  build(request: DocumentRequest): DocumentResult {
    return this.engine.build(request);
  }

  query(result: DocumentResult, request: DocumentQueryRequest): DocumentQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): DocumentRepositoryContract {
    return this.engine.repository;
  }
}

export { DocumentIntelligenceServiceImpl as DocumentIntelligenceService };
export { DocumentIntelligenceServiceImpl as DocumentService };
export { DocumentIntelligenceServiceImpl as DocumentServiceImpl };
