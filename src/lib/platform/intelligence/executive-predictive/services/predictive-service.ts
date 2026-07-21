/**
 * Predictive Intelligence service facade (Sprint 065).
 */

import { PredictiveEngine } from "@/lib/platform/intelligence/executive-predictive/engine/predictive-engine";
import type {
  ExecutivePredictiveRequest,
  ExecutivePredictiveResult,
} from "@/lib/platform/intelligence/executive-predictive/types";

export interface PredictiveServiceDependencies {
  engine?: PredictiveEngine;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class ExecutivePredictiveService {
  private readonly engine: PredictiveEngine;

  constructor(deps: PredictiveServiceDependencies = {}) {
    this.engine =
      deps.engine ??
      new PredictiveEngine({
        createId: deps.createId,
        now: deps.now,
      });
  }

  build(request: ExecutivePredictiveRequest): ExecutivePredictiveResult {
    return this.engine.predict(request);
  }

  /** Alias for pipeline / DI callers. */
  predict(request: ExecutivePredictiveRequest): ExecutivePredictiveResult {
    return this.build(request);
  }
}
