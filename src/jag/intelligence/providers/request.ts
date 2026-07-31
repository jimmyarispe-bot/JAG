/**
 * Provider request — curated organizational inputs only.
 * Providers must not receive unrestricted runtime access.
 */

import type { Evidence } from "@/jag/intelligence/contracts/evidence";
import type { ExecutiveQuestion } from "@/jag/intelligence/contracts/question";
import type { IntelligenceContext } from "@/jag/intelligence/contracts/context";
import type { ReasoningPipelinePlan } from "@/jag/intelligence/pipeline/compose";

/**
 * Inputs a provider may receive for a reasoning turn.
 * Organizational model remains source of truth via curated evidence.
 */
export type IntelligenceProviderRequest = {
  readonly question: ExecutiveQuestion;
  readonly context: IntelligenceContext;
  /** Curated evidence already grounded in organizational kinds. */
  readonly evidence: readonly Evidence[];
  readonly plan: ReasoningPipelinePlan;
  /** Opaque correlation id for traces — not a runtime handle. */
  readonly correlationId?: string;
};

export function isIntelligenceProviderRequest(
  value: unknown
): value is IntelligenceProviderRequest {
  if (!value || typeof value !== "object") return false;
  const v = value as IntelligenceProviderRequest;
  return (
    v.question !== undefined &&
    v.context !== undefined &&
    Array.isArray(v.evidence) &&
    v.plan !== undefined &&
    typeof v.plan.questionId === "string" &&
    Array.isArray(v.plan.stages)
  );
}
