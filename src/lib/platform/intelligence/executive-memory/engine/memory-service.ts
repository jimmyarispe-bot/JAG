/**
 * Sprint 063 — Executive Memory Intelligence service façade.
 */

import {
  ExecutiveMemoryEngine,
  type MemoryEngineDependencies,
} from "@/lib/platform/intelligence/executive-memory/engine/memory-engine";
import type {
  ExecutiveMemoryRequest,
  ExecutiveMemoryResult,
  MemoryRecallQuery,
  MemoryRecallResult,
} from "@/lib/platform/intelligence/executive-memory/types";

export interface MemoryServiceDependencies extends MemoryEngineDependencies {
  engine?: ExecutiveMemoryEngine;
}

export class ExecutiveMemoryIntelligenceService {
  readonly engine: ExecutiveMemoryEngine;

  constructor(deps: MemoryServiceDependencies = {}) {
    this.engine = deps.engine ?? new ExecutiveMemoryEngine(deps);
  }

  build(request: ExecutiveMemoryRequest): ExecutiveMemoryResult {
    return this.engine.build(request);
  }

  recall(query: MemoryRecallQuery): MemoryRecallResult {
    return this.engine.recall(query);
  }
}
