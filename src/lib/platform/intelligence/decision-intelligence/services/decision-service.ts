/**
 * Sprint 064 — Decision Intelligence service façade.
 */

import {
  DecisionIntelligenceEngine,
  type DecisionEngineDependencies,
} from "@/lib/platform/intelligence/decision-intelligence/engine/decision-engine";
import type {
  DecisionIntelligenceRequest,
  DecisionIntelligenceResult,
} from "@/lib/platform/intelligence/decision-intelligence/types";

export interface DecisionServiceDependencies extends DecisionEngineDependencies {
  engine?: DecisionIntelligenceEngine;
}

export class DecisionIntelligenceService {
  readonly engine: DecisionIntelligenceEngine;

  constructor(deps: DecisionServiceDependencies = {}) {
    this.engine = deps.engine ?? new DecisionIntelligenceEngine(deps);
  }

  build(request: DecisionIntelligenceRequest): DecisionIntelligenceResult {
    return this.engine.build(request);
  }
}
