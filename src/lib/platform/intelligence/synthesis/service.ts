/**
 * Sprint 061 — Executive Synthesis Intelligence service.
 */

import {
  SynthesisEngine,
  type SynthesisEngineDependencies,
} from "@/lib/platform/intelligence/synthesis/engine/synthesis-engine";
import type {
  SynthesisRequest,
  SynthesisResult,
} from "@/lib/platform/intelligence/synthesis/types";

export interface SynthesisServiceDependencies extends SynthesisEngineDependencies {
  engine?: SynthesisEngine;
}

export class SynthesisIntelligenceService {
  readonly engine: SynthesisEngine;

  constructor(deps: SynthesisServiceDependencies = {}) {
    this.engine = deps.engine ?? new SynthesisEngine(deps);
  }

  build(request: SynthesisRequest): SynthesisResult {
    return this.engine.build(request);
  }

  synthesize(request: SynthesisRequest): SynthesisResult {
    return this.engine.synthesize(request);
  }
}
