/**
 * Deterministic pipeline executor — invokes stages in order.
 */

import {
  recordStageDuration,
} from "@/jag/intelligence/orchestrator/execution-context";
import { orchestratorFailure } from "@/jag/intelligence/orchestrator/failures";
import type {
  PipelineStage,
  PipelineStageResult,
  PipelineState,
} from "@/jag/intelligence/orchestrator/types";

export type PipelineExecutor = {
  readonly stages: readonly PipelineStage[];
  run(state: PipelineState): Promise<PipelineStageResult>;
};

export function createPipelineExecutor(
  stages: readonly PipelineStage[],
  now: () => Date = () => new Date()
): PipelineExecutor {
  const ordered = Object.freeze([...stages]);

  return {
    stages: ordered,
    async run(state) {
      for (const stage of ordered) {
        const started = now();
        const startedAt = started.toISOString();
        let result: PipelineStageResult;
        try {
          result = await stage.run(state);
        } catch (error) {
          result = {
            ok: false,
            failure: orchestratorFailure(
              "provider_execution_error",
              error instanceof Error
                ? error.message
                : `Stage ${stage.id} threw`,
              { stageId: stage.id }
            ),
          };
        }
        const completed = now();
        recordStageDuration(state.execution, {
          stageId: stage.id,
          startedAt,
          completedAt: completed.toISOString(),
          durationMs: Math.max(0, completed.getTime() - started.getTime()),
          ok: result.ok,
        });
        if (!result.ok) {
          state.failure = result.failure;
          state.execution.diagnostics.failure = result.failure;
          return result;
        }
      }
      return { ok: true };
    },
  };
}
