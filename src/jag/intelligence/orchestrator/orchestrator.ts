/**
 * ExecutiveIntelligenceOrchestrator — end-to-end composition only.
 * No business logic. No provider-specific logic. Providers are injected.
 */

import {
  createExecutionContext,
} from "@/jag/intelligence/orchestrator/execution-context";
import {
  createDefaultOrchestratorStages,
  ORCHESTRATOR_STAGE_IDS,
} from "@/jag/intelligence/orchestrator/stages";
import { createPipelineExecutor } from "@/jag/intelligence/orchestrator/pipeline-executor";
import type {
  Answer,
  OrchestratorHostBindings,
  PipelineState,
  Question,
} from "@/jag/intelligence/orchestrator/types";

export type ExecutiveIntelligenceOrchestratorApi = {
  answer(question: Question): Promise<Answer>;
};

let seq = 0;

function defaultId(): string {
  seq += 1;
  return `ei-${Date.now().toString(36)}-${seq.toString(36)}`;
}

export function createExecutiveIntelligenceOrchestrator(
  bindings: OrchestratorHostBindings
): ExecutiveIntelligenceOrchestratorApi {
  const now = bindings.now ?? (() => new Date());
  const createId = bindings.createId ?? defaultId;
  const stages =
    bindings.stages ?? createDefaultOrchestratorStages(bindings);
  const executor = createPipelineExecutor(stages, now);

  return {
    async answer(question: Question): Promise<Answer> {
      const requestId = createId();
      const started = now();
      const organizationId =
        bindings.organizationId ??
        question.organizationId ??
        "unknown.organization";

      const execution = createExecutionContext({
        requestId,
        organizationId,
        userId: bindings.userId,
        sessionId: bindings.sessionId,
        correlationId: requestId,
        startedAt: started.toISOString(),
        stageOrder: stages.map((s) => s.id),
      });

      const state: PipelineState = {
        question,
        execution,
      };

      const result = await executor.run(state);
      execution.completedAt = now().toISOString();

      if (!result.ok || state.failure || !state.answer) {
        return {
          ok: false,
          failure:
            state.failure ??
            result.failure ?? {
              code: "provider_execution_error",
              message: "Orchestration failed without structured failure",
            },
          execution,
        };
      }

      return {
        ok: true,
        answer: state.answer,
        execution,
      };
    },
  };
}

/** Class facade matching the sprint deliverable name. */
export class ExecutiveIntelligenceOrchestrator
  implements ExecutiveIntelligenceOrchestratorApi
{
  private readonly inner: ExecutiveIntelligenceOrchestratorApi;

  constructor(bindings: OrchestratorHostBindings) {
    this.inner = createExecutiveIntelligenceOrchestrator(bindings);
  }

  answer(question: Question): Promise<Answer> {
    return this.inner.answer(question);
  }
}

export { ORCHESTRATOR_STAGE_IDS };
