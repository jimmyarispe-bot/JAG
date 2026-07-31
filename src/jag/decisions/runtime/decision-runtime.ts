/**
 * DecisionRuntime — deterministic evaluate / simulate / explain / validate / compare.
 */

import type {
  DecisionDefinition,
  DecisionExplanation,
  DecisionInput,
  DecisionResult,
} from "@/jag/decisions/contracts/definitions";
import { getDecisionExtensions } from "@/jag/decisions/contracts/extensions";
import { runDecisionEvaluation } from "@/jag/decisions/evaluation";
import {
  assertDecisionRegistered,
  getDecisionDefinition,
  registerDecision,
  unregisterDecision,
} from "@/jag/decisions/registry";
import { decisionNow } from "@/jag/decisions/runtime/clock";
import {
  emitDecisionEvent,
  trackPolicyChange,
} from "@/jag/decisions/telemetry";

function fail(code: string, message: string): DecisionResult {
  return { ok: false, error: { code, message } };
}

export async function evaluateDecision(
  input: DecisionInput
): Promise<DecisionResult> {
  try {
    const { result } = await runDecisionEvaluation({
      ...input,
      mode: "evaluate",
    });

    const ports = getDecisionExtensions();
    const def = assertDecisionRegistered(input.decisionId);
    if (
      ports.communications?.notifyOutcome &&
      result.outcome &&
      def.extensions?.communicationTemplateIds?.length
    ) {
      await ports.communications.notifyOutcome({
        templateId: def.extensions.communicationTemplateIds[0],
        context: {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          decisionId: input.decisionId,
          facts: input.facts,
          now: decisionNow,
          mode: "evaluate",
        },
        outcome: result.outcome,
      });
    }

    return result;
  } catch (err) {
    return fail(
      "evaluation_failed",
      err instanceof Error ? err.message : "Evaluation failed"
    );
  }
}

export async function simulateDecision(
  input: Omit<DecisionInput, "mode">
): Promise<DecisionResult> {
  try {
    const { result } = await runDecisionEvaluation(
      { ...input, mode: "simulate" },
      { useCache: false }
    );
    return result;
  } catch (err) {
    return fail(
      "simulation_failed",
      err instanceof Error ? err.message : "Simulation failed"
    );
  }
}

export async function explainDecision(
  input: Omit<DecisionInput, "mode">
): Promise<DecisionResult & { explanation: DecisionExplanation }> {
  const { result, explanation } = await runDecisionEvaluation({
    ...input,
    mode: "evaluate",
  });
  emitDecisionEvent({
    type: "decision.explained",
    decisionId: input.decisionId,
    occurredAt: decisionNow().toISOString(),
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    data: { outcome: explanation.outcome },
  });
  return { ...result, explanation };
}

export function validateDecision(decisionId: string): DecisionResult {
  const def = getDecisionDefinition(decisionId);
  if (!def) {
    return fail("not_registered", `Decision "${decisionId}" is not registered`);
  }
  // Structural validation already enforced at register; re-check emptiness.
  if (!def.policies.length) {
    return fail("invalid_definition", "Decision has no policies");
  }
  emitDecisionEvent({
    type: "decision.validated",
    decisionId,
    occurredAt: decisionNow().toISOString(),
    data: { version: def.version },
  });
  return {
    ok: true,
    outcome: "valid",
    explanation: {
      outcome: "valid",
      defaultApplied: false,
      contributingRules: [],
      unmetConditions: [],
      rationaleChain: [
        {
          code: "decision.valid",
          message: `Decision "${decisionId}" definition is valid`,
        },
      ],
    },
  };
}

export async function compareDecisions(input: {
  decisionId: string;
  organizationId: string;
  actorUserId?: string;
  leftFacts: Readonly<Record<string, unknown>>;
  rightFacts: Readonly<Record<string, unknown>>;
}): Promise<
  DecisionResult & {
    left?: DecisionResult;
    right?: DecisionResult;
    sameOutcome?: boolean;
  }
> {
  const left = await evaluateDecision({
    decisionId: input.decisionId,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    facts: input.leftFacts,
  });
  const right = await evaluateDecision({
    decisionId: input.decisionId,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    facts: input.rightFacts,
  });

  emitDecisionEvent({
    type: "decision.compared",
    decisionId: input.decisionId,
    occurredAt: decisionNow().toISOString(),
    organizationId: input.organizationId,
    data: {
      leftOutcome: left.outcome ?? null,
      rightOutcome: right.outcome ?? null,
    },
  });

  return {
    ok: left.ok && right.ok,
    outcome:
      left.outcome === right.outcome ? left.outcome : "outcomes_differ",
    left,
    right,
    sameOutcome: left.outcome === right.outcome,
    explanation: {
      outcome:
        left.outcome === right.outcome
          ? (left.outcome ?? "unknown")
          : "outcomes_differ",
      defaultApplied: false,
      contributingRules: [],
      unmetConditions: [],
      rationaleChain: [
        {
          code: "compare.result",
          message:
            left.outcome === right.outcome
              ? `Both evaluations produced "${left.outcome}"`
              : `Left="${left.outcome}" Right="${right.outcome}"`,
        },
      ],
    },
  };
}

/**
 * Replace a registered decision (policy change signal).
 * Used by packages/org config loaders — not for ad-hoc business logic.
 */
export function replaceDecisionDefinition(
  definition: DecisionDefinition
): DecisionDefinition {
  const existing = getDecisionDefinition(definition.id);
  if (existing) {
    unregisterDecision(definition.id);
  }
  const registered = registerDecision(definition);
  const at = decisionNow().toISOString();
  for (const policy of registered.policies) {
    trackPolicyChange({
      decisionId: registered.id,
      policyId: policy.id,
      at,
    });
    emitDecisionEvent({
      type: "policy.changed",
      decisionId: registered.id,
      occurredAt: at,
      data: { policyId: policy.id },
    });
  }
  return registered;
}

export const DecisionRuntime = {
  evaluate: evaluateDecision,
  simulate: simulateDecision,
  explain: explainDecision,
  validate: validateDecision,
  compare: compareDecisions,
  replaceDefinition: replaceDecisionDefinition,
} as const;
