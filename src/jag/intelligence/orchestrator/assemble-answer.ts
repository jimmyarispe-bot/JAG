/**
 * Assemble ExecutiveAnswer from plan + provider artifacts + curated evidence.
 * No business logic — structural merge only.
 */

import type { DecisionTrace } from "@/jag/intelligence/contracts/decision-trace";
import type { ExecutiveAnswer } from "@/jag/intelligence/contracts/answer";
import type { Evidence } from "@/jag/intelligence/contracts/evidence";
import type { ExecutiveQuestion } from "@/jag/intelligence/contracts/question";
import type { ReasoningPipelinePlan } from "@/jag/intelligence/pipeline/compose";
import type { IntelligenceProviderResponse } from "@/jag/intelligence/providers/response";

export function assembleExecutiveAnswer(input: {
  readonly requestId: string;
  readonly question: ExecutiveQuestion;
  readonly plan: ReasoningPipelinePlan;
  readonly evidence: readonly Evidence[];
  readonly providerResponse: IntelligenceProviderResponse;
}): ExecutiveAnswer {
  const { artifacts } = input.providerResponse;
  const skeleton = input.plan.decisionTraceSkeleton;
  const providerSteps = artifacts.decisionTraceSteps ?? [];

  const steps = skeleton.steps.map((step) => {
    if (step.kind !== "reasoning" || providerSteps.length === 0) return step;
    const overlay = providerSteps.find((s) => s.kind === "reasoning") ?? providerSteps[0]!;
    return {
      ...step,
      summary: overlay.summary || step.summary,
      inputRefs: overlay.inputRefs ?? step.inputRefs,
      outputRefs: overlay.outputRefs ?? step.outputRefs,
      at: overlay.at ?? step.at,
    };
  });

  const decisionTrace: DecisionTrace = {
    id: skeleton.id,
    questionId: skeleton.questionId,
    steps: Object.freeze(steps),
  };

  const summary =
    artifacts.explanation.narrative.trim() ||
    artifacts.findings[0]?.statement ||
    "Executive answer assembled from validated provider artifacts";

  return {
    id: `answer.${input.question.id}.${input.requestId}`,
    questionId: input.question.id,
    summary,
    findings: artifacts.findings,
    evidence: input.evidence,
    recommendations: artifacts.recommendations,
    explanation: artifacts.explanation,
    decisionTrace,
    confidence: artifacts.confidence,
    ...(artifacts.assumptions
      ? { assumptions: artifacts.assumptions }
      : {}),
  };
}
