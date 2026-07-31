/**
 * Decision Trace — auditable steps from question to answer.
 * Deterministic pipeline stages only in Foundation v1.
 */

export type DecisionTraceStepKind =
  | "intent_classification"
  | "capability_discovery"
  | "evidence_collection"
  | "cross_capability_correlation"
  | "reasoning"
  | "explanation"
  | "recommendation";

export type DecisionTraceStep = {
  readonly id: string;
  readonly kind: DecisionTraceStepKind;
  readonly summary: string;
  readonly inputRefs?: readonly string[];
  readonly outputRefs?: readonly string[];
  readonly at?: string;
};

export type DecisionTrace = {
  readonly id: string;
  readonly questionId: string;
  readonly steps: readonly DecisionTraceStep[];
};

export function isDecisionTraceStep(
  value: unknown
): value is DecisionTraceStep {
  if (!value || typeof value !== "object") return false;
  const v = value as DecisionTraceStep;
  return (
    typeof v.id === "string" &&
    typeof v.kind === "string" &&
    typeof v.summary === "string"
  );
}

export function isDecisionTrace(value: unknown): value is DecisionTrace {
  if (!value || typeof value !== "object") return false;
  const v = value as DecisionTrace;
  return (
    typeof v.id === "string" &&
    typeof v.questionId === "string" &&
    Array.isArray(v.steps) &&
    v.steps.every(isDecisionTraceStep)
  );
}
