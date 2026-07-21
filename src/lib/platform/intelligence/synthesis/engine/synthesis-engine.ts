/**
 * Sprint 061 — Executive Synthesis Intelligence engine facade.
 */

import { createBuiltinAnalyzers } from "@/lib/platform/intelligence/synthesis/analyzers";
import {
  createDefaultAnalyzerRegistry,
  type SynthesisAnalyzerRegistry,
} from "@/lib/platform/intelligence/synthesis/registry";
import { SynthesisOrchestrator } from "@/lib/platform/intelligence/synthesis/engine/synthesis-orchestrator";
import type {
  SynthesisAnalyzer,
  SynthesisRequest,
  SynthesisResult,
} from "@/lib/platform/intelligence/synthesis/types";

export interface SynthesisEngineDependencies {
  registry?: SynthesisAnalyzerRegistry;
  analyzers?: SynthesisAnalyzer[];
  createId?: (prefix: string) => string;
  now?: () => Date;
}

let idSeq = 0;

function defaultCreateId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

export class SynthesisEngine {
  readonly registry: SynthesisAnalyzerRegistry;
  private readonly orchestrator: SynthesisOrchestrator;

  constructor(deps: SynthesisEngineDependencies = {}) {
    this.registry =
      deps.registry ??
      createDefaultAnalyzerRegistry(deps.analyzers ?? createBuiltinAnalyzers());
    this.orchestrator = new SynthesisOrchestrator({
      registry: this.registry,
      createId: deps.createId ?? defaultCreateId,
      now: deps.now ?? (() => new Date()),
    });
  }

  registerAnalyzer(analyzer: SynthesisAnalyzer): void {
    this.registry.register(analyzer);
  }

  synthesize(request: SynthesisRequest): SynthesisResult {
    return this.orchestrator.synthesize(request);
  }

  build(request: SynthesisRequest): SynthesisResult {
    return this.synthesize(request);
  }
}

export function resetSynthesisIdSeqForTests(): void {
  idSeq = 0;
}
