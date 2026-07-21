/**
 * Sprint 062 — Executive Briefing Intelligence service.
 */

import {
  BriefingEngine,
  type BriefingEngineDependencies,
} from "@/lib/platform/intelligence/briefing/engine/briefing-engine";
import type {
  BriefingRequest,
  BriefingResult,
} from "@/lib/platform/intelligence/briefing/types";

export interface BriefingServiceDependencies extends BriefingEngineDependencies {
  engine?: BriefingEngine;
}

export class BriefingIntelligenceService {
  readonly engine: BriefingEngine;

  constructor(deps: BriefingServiceDependencies = {}) {
    this.engine = deps.engine ?? new BriefingEngine(deps);
  }

  build(request: BriefingRequest): BriefingResult {
    return this.engine.build(request);
  }
}
