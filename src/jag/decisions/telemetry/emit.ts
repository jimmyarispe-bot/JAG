import type { DecisionId } from "@/jag/decisions/contracts/definitions";

export type DecisionTelemetryEvent =
  | {
      readonly kind: "evaluation";
      readonly decisionId: DecisionId;
      readonly mode: "evaluate" | "simulate";
      readonly outcome: string;
      readonly at: string;
      readonly durationMs: number;
    }
  | {
      readonly kind: "simulation";
      readonly decisionId: DecisionId;
      readonly outcome: string;
      readonly at: string;
    }
  | {
      readonly kind: "policy_change";
      readonly decisionId: DecisionId;
      readonly policyId: string;
      readonly at: string;
    }
  | {
      readonly kind: "rule_execution";
      readonly decisionId: DecisionId;
      readonly ruleId: string;
      readonly at: string;
    }
  | {
      readonly kind: "explanation";
      readonly decisionId: DecisionId;
      readonly outcome: string;
      readonly at: string;
    };

type Listener = (event: DecisionTelemetryEvent) => void;
const listeners = new Set<Listener>();

export function subscribeDecisionTelemetry(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(event: DecisionTelemetryEvent): void {
  for (const listener of listeners) listener(event);
}

export function trackDecisionEvaluation(input: {
  decisionId: DecisionId;
  mode: "evaluate" | "simulate";
  outcome: string;
  at: string;
  durationMs: number;
}): void {
  emit({
    kind: "evaluation",
    decisionId: input.decisionId,
    mode: input.mode,
    outcome: input.outcome,
    at: input.at,
    durationMs: input.durationMs,
  });
  if (input.mode === "simulate") {
    emit({
      kind: "simulation",
      decisionId: input.decisionId,
      outcome: input.outcome,
      at: input.at,
    });
  }
  emit({
    kind: "explanation",
    decisionId: input.decisionId,
    outcome: input.outcome,
    at: input.at,
  });
}

export function trackPolicyChange(input: {
  decisionId: DecisionId;
  policyId: string;
  at: string;
}): void {
  emit({
    kind: "policy_change",
    decisionId: input.decisionId,
    policyId: input.policyId,
    at: input.at,
  });
}

export function resetDecisionTelemetryForTests(): void {
  listeners.clear();
}
