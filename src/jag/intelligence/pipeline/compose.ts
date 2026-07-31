/**
 * Compose a deterministic reasoning pipeline plan from contracts.
 * Foundation v1 records stages — it does not invoke models or engines.
 */

import type { DecisionTrace } from "@/jag/intelligence/contracts/decision-trace";
import type { ExecutiveQuestion } from "@/jag/intelligence/contracts/question";
import type { IntelligenceContext } from "@/jag/intelligence/contracts/context";
import {
  REASONING_PIPELINE_STAGES,
  type ReasoningPipelineStage,
} from "@/jag/intelligence/pipeline/stages";

export type ReasoningPipelinePlan = {
  readonly questionId: string;
  readonly organizationId: string;
  readonly stages: readonly ReasoningPipelineStage[];
  readonly decisionTraceSkeleton: DecisionTrace;
};

/**
 * Build an ordered pipeline plan and an empty decision-trace skeleton
 * for a question + context. Deterministic and side-effect free.
 */
export function composeReasoningPipeline(
  question: ExecutiveQuestion,
  context: IntelligenceContext
): ReasoningPipelinePlan {
  const stages = REASONING_PIPELINE_STAGES;
  const decisionTraceSkeleton: DecisionTrace = Object.freeze({
    id: `trace.${question.id}`,
    questionId: question.id,
    steps: Object.freeze(
      stages.map((stage) =>
        Object.freeze({
          id: `step.${question.id}.${stage.id}`,
          kind: stage.id,
          summary: `${stage.label}: pending`,
          inputRefs: Object.freeze([] as string[]),
          outputRefs: Object.freeze([] as string[]),
        })
      )
    ),
  });

  return Object.freeze({
    questionId: question.id,
    organizationId: context.organizationId,
    stages,
    decisionTraceSkeleton,
  });
}

export function listReasoningPipelineStageIds(): readonly string[] {
  return Object.freeze(REASONING_PIPELINE_STAGES.map((s) => s.id));
}
