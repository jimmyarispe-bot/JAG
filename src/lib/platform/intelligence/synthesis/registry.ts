/**
 * Sprint 061 — plug-in analyzer registry (extensible without engine edits).
 */

import type {
  AnalyzerOutput,
  SynthesisAnalyzer,
  SynthesisAnalyzerContext,
} from "@/lib/platform/intelligence/synthesis/types";

export class SynthesisAnalyzerRegistry {
  private readonly analyzers = new Map<string, SynthesisAnalyzer>();

  register(analyzer: SynthesisAnalyzer): void {
    this.analyzers.set(analyzer.id, analyzer);
  }

  unregister(id: string): boolean {
    return this.analyzers.delete(id);
  }

  get(id: string): SynthesisAnalyzer | undefined {
    return this.analyzers.get(id);
  }

  list(): SynthesisAnalyzer[] {
    return [...this.analyzers.values()];
  }

  /** Synchronous merge — built-in analyzers are sync; async plugins use runAllAsync. */
  runAll(context: SynthesisAnalyzerContext): AnalyzerOutput {
    const merged: AnalyzerOutput = {
      correlations: [],
      contradictions: [],
      trends: [],
      opportunities: [],
      risks: [],
    };

    for (const analyzer of this.analyzers.values()) {
      const partial = analyzer.analyze(context);
      if (partial instanceof Promise) {
        throw new Error(
          `Analyzer "${analyzer.id}" returned a Promise; use runAllAsync() for async analyzers.`
        );
      }
      mergePartial(merged, partial);
    }

    return merged;
  }

  async runAllAsync(context: SynthesisAnalyzerContext): Promise<AnalyzerOutput> {
    const merged: AnalyzerOutput = {
      correlations: [],
      contradictions: [],
      trends: [],
      opportunities: [],
      risks: [],
    };

    for (const analyzer of this.analyzers.values()) {
      const partial = await analyzer.analyze(context);
      mergePartial(merged, partial);
    }

    return merged;
  }
}

function mergePartial(
  merged: AnalyzerOutput,
  partial: Partial<AnalyzerOutput>
): void {
  if (partial.correlations) merged.correlations.push(...partial.correlations);
  if (partial.contradictions) merged.contradictions.push(...partial.contradictions);
  if (partial.trends) merged.trends.push(...partial.trends);
  if (partial.opportunities) merged.opportunities.push(...partial.opportunities);
  if (partial.risks) merged.risks.push(...partial.risks);
}

export function createDefaultAnalyzerRegistry(
  builtins: SynthesisAnalyzer[]
): SynthesisAnalyzerRegistry {
  const registry = new SynthesisAnalyzerRegistry();
  for (const analyzer of builtins) registry.register(analyzer);
  return registry;
}
