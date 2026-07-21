/**
 * Sprint 061 — ordered synthesis execution stages.
 */

export const SYNTHESIS_PIPELINE_STAGES = [
  "ingest",
  "analyze",
  "root_cause",
  "score",
  "recommend",
  "brief",
  "explain",
] as const;

export type SynthesisPipelineStage = (typeof SYNTHESIS_PIPELINE_STAGES)[number];

export interface PipelineStageResult {
  stage: SynthesisPipelineStage;
  ok: boolean;
  error?: string;
}

export function runPipelineStages<TContext>(
  context: TContext,
  stages: Array<{
    stage: SynthesisPipelineStage;
    run: (ctx: TContext) => TContext;
  }>
): { context: TContext; results: PipelineStageResult[] } {
  const results: PipelineStageResult[] = [];
  let current = context;

  for (const { stage, run } of stages) {
    try {
      current = run(current);
      results.push({ stage, ok: true });
    } catch (error) {
      results.push({
        stage,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  return { context: current, results };
}
