/**
 * Core deterministic evaluation — no AI, no package imports.
 */

import type {
  DecisionContext,
  DecisionDefinition,
  DecisionExplanation,
  DecisionInput,
  DecisionMetrics,
  DecisionResult,
} from "@/jag/decisions/contracts/definitions";
import { getDecisionExtensions } from "@/jag/decisions/contracts/extensions";
import {
  cacheKey,
  getCachedContext,
  mergeFacts,
  putCachedContext,
} from "@/jag/decisions/context";
import {
  evaluatePolicy,
  orderPolicies,
  type PolicyEvaluation,
} from "@/jag/decisions/policies";
import { buildExplanation } from "@/jag/decisions/results";
import { assertDecisionRegistered } from "@/jag/decisions/registry";
import { decisionNow } from "@/jag/decisions/runtime/clock";
import { emitDecisionEvent } from "@/jag/decisions/telemetry/events";
import { trackDecisionEvaluation } from "@/jag/decisions/telemetry/emit";

export type EvaluationBundle = {
  readonly result: DecisionResult;
  readonly explanation: DecisionExplanation;
  readonly context: DecisionContext;
  readonly evaluations: readonly PolicyEvaluation[];
};

async function enrichFacts(
  definition: DecisionDefinition,
  context: DecisionContext
): Promise<Readonly<Record<string, unknown>>> {
  let facts = context.facts;
  const ports = getDecisionExtensions();

  for (const formId of definition.extensions?.formDefinitionIds ?? []) {
    if (!ports.forms?.readFormFacts) continue;
    const res = await ports.forms.readFormFacts({
      formDefinitionId: formId,
      context,
    });
    if (res.ok && res.data) {
      facts = mergeFacts(facts, res.data);
    }
  }

  for (const processId of definition.extensions?.processDefinitionIds ?? []) {
    if (!ports.processes?.enrichFromProcess) continue;
    const res = await ports.processes.enrichFromProcess({
      processDefinitionId: processId,
      context: { ...context, facts },
    });
    if (res.ok && res.data) {
      facts = mergeFacts(facts, res.data);
    }
  }

  for (const workflowId of definition.extensions?.workflowDefinitionIds ?? []) {
    if (!ports.workflows?.enrichFromWorkflow) continue;
    const res = await ports.workflows.enrichFromWorkflow({
      workflowDefinitionId: workflowId,
      context: { ...context, facts },
    });
    if (res.ok && res.data) {
      facts = mergeFacts(facts, res.data);
    }
  }

  return facts;
}

function selectOutcome(
  definition: DecisionDefinition,
  evaluations: readonly PolicyEvaluation[]
): {
  outcome: string;
  defaultApplied: boolean;
  selectedPolicyId?: string;
  selectedRuleId?: string;
} {
  // Walk policies in precedence order; first policy with a selected rule wins.
  for (const ev of evaluations) {
    if (ev.selected) {
      return {
        outcome: ev.selected.rule.outcome,
        defaultApplied: false,
        selectedPolicyId: ev.selected.policyId,
        selectedRuleId: ev.selected.rule.id,
      };
    }
  }
  return {
    outcome: definition.defaultOutcome,
    defaultApplied: true,
  };
}

export async function runDecisionEvaluation(
  input: DecisionInput,
  options?: { useCache?: boolean }
): Promise<EvaluationBundle> {
  const started = decisionNow();
  const definition = assertDecisionRegistered(input.decisionId);
  const mode = input.mode ?? "evaluate";
  const useCache = options?.useCache !== false;

  const key = cacheKey({
    decisionId: input.decisionId,
    organizationId: input.organizationId,
    mode,
    facts: input.facts,
  });

  let cacheHit = false;
  let baseContext = useCache ? getCachedContext(key) : null;
  if (baseContext) {
    cacheHit = true;
  } else {
    baseContext = {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      decisionId: input.decisionId,
      facts: Object.freeze({ ...input.facts }),
      now: decisionNow,
      mode,
    };
    if (useCache) putCachedContext(key, baseContext);
  }

  const enrichedFacts = await enrichFacts(definition, baseContext);
  const context: DecisionContext = {
    ...baseContext,
    facts: enrichedFacts,
  };

  const policies = orderPolicies(definition.policies);
  const evaluations: PolicyEvaluation[] = [];
  let rulesEvaluated = 0;
  let rulesMatched = 0;

  for (const policy of policies) {
    const ev = evaluatePolicy(policy, context.facts);
    evaluations.push(ev);
    rulesEvaluated += ev.rulesEvaluated;
    rulesMatched += ev.matched.length;

    for (const m of ev.matched) {
      emitDecisionEvent({
        type: "rule.executed",
        decisionId: definition.id,
        occurredAt: decisionNow().toISOString(),
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        data: {
          policyId: m.policyId,
          ruleId: m.rule.id,
          outcome: m.rule.outcome,
        },
      });
    }
  }

  const selected = selectOutcome(definition, evaluations);
  const explanation = buildExplanation({
    definition,
    evaluations,
    outcome: selected.outcome,
    defaultApplied: selected.defaultApplied,
    selectedPolicyId: selected.selectedPolicyId,
    selectedRuleId: selected.selectedRuleId,
  });

  emitDecisionEvent({
    type: "explanation.generated",
    decisionId: definition.id,
    occurredAt: decisionNow().toISOString(),
    organizationId: input.organizationId,
    data: { outcome: explanation.outcome },
  });

  const ended = decisionNow();
  const durationMs = Math.max(0, ended.getTime() - started.getTime());
  const metrics: DecisionMetrics = {
    decisionId: definition.id,
    evaluatedAt: ended.toISOString(),
    durationMs,
    policiesEvaluated: evaluations.length,
    rulesEvaluated,
    rulesMatched,
    cacheHit,
  };

  const eventType =
    mode === "simulate" ? "decision.simulated" : "decision.evaluated";
  const event = emitDecisionEvent({
    type: eventType,
    decisionId: definition.id,
    occurredAt: ended.toISOString(),
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    data: { outcome: selected.outcome, simulated: mode === "simulate" },
  });

  trackDecisionEvaluation({
    decisionId: definition.id,
    mode,
    outcome: selected.outcome,
    at: ended.toISOString(),
    durationMs,
  });

  const result: DecisionResult = {
    ok: true,
    outcome: selected.outcome,
    explanation,
    metrics,
    simulated: mode === "simulate",
    events: [event],
  };

  const ports = getDecisionExtensions();
  if (ports.telemetry?.forward) {
    await ports.telemetry.forward({
      context,
      eventType,
      data: { outcome: selected.outcome },
    });
  }

  return { result, explanation, context, evaluations };
}
