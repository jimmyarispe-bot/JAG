/**
 * Education Policy Engine — evaluates Knowledge policy definitions
 * against normalized observations. Produces evaluation results only.
 */

import type { EducationPolicyDefinition } from "../knowledge";
import type {
  EducationPolicyContext,
  EducationPolicyEvaluationRequest,
} from "./EducationPolicyContext";
import { evaluateEducationPolicy } from "./EducationPolicyEvaluator";
import type {
  EducationPolicyEvaluationPort,
  EducationPolicyResult,
  EducationPolicyValidationIssue,
} from "./EducationPolicyResult";
import {
  createEducationPolicyRegistry,
  type EducationPolicyRegistry,
  validateEducationPolicyRegistry,
} from "./EducationPolicyRegistry";

export interface EducationPolicyEngineOptions {
  registry?: EducationPolicyRegistry;
  policies?: readonly EducationPolicyDefinition[];
}

export interface EducationPolicyEngine extends EducationPolicyEvaluationPort {
  /** Evaluate policies for the given context. */
  evaluate(input: EducationPolicyContext): EducationPolicyResult;
  /** Evaluate with an explicit request object. */
  evaluateRequest(request: EducationPolicyEvaluationRequest): EducationPolicyResult;
  registry(): EducationPolicyRegistry;
}

export function createEducationPolicyEngine(
  options: EducationPolicyEngineOptions = {}
): EducationPolicyEngine {
  const registry =
    options.registry ??
    createEducationPolicyRegistry(options.policies);

  return {
    registry() {
      return registry;
    },
    evaluate(input) {
      return runEvaluation(input, registry.list(), registry.validate());
    },
    evaluateRequest(request) {
      const policies = request.policies ?? registry.list();
      const validation = validateEducationPolicyRegistry(policies);
      return runEvaluation(request.context, policies, validation);
    },
  };
}

/** One-shot helper using the default Knowledge policy catalog. */
export function evaluateEducationPolicies(
  context: EducationPolicyContext,
  options?: EducationPolicyEngineOptions
): EducationPolicyResult {
  return createEducationPolicyEngine(options).evaluate(context);
}

function runEvaluation(
  context: EducationPolicyContext,
  policies: readonly EducationPolicyDefinition[],
  registryIssues: readonly EducationPolicyValidationIssue[]
): EducationPolicyResult {
  const evaluatedAt = context.now ?? new Date().toISOString();
  const validationIssues: EducationPolicyValidationIssue[] = [
    ...registryIssues,
  ];

  let selected = policies;
  if (context.policyIds && context.policyIds.length > 0) {
    const byId = new Map(policies.map((p) => [p.id, p] as const));
    const resolved: EducationPolicyDefinition[] = [];
    for (const id of context.policyIds) {
      const policy = byId.get(id);
      if (!policy) {
        validationIssues.push({
          code: "UNKNOWN_POLICY",
          message: `Unknown policy id: ${id}`,
          severity: "error",
          policyId: id,
        });
        continue;
      }
      resolved.push(policy);
    }
    selected = resolved;
  }

  const evaluations = selected.map((policy) =>
    evaluateEducationPolicy(policy, context)
  );

  const satisfied = evaluations
    .filter((e) => e.outcome === "satisfied" && e.satisfaction)
    .map((e) => e.satisfaction!);
  const violated = evaluations
    .filter((e) => e.outcome === "violated" && e.violation)
    .map((e) => e.violation!);
  const unknown = evaluations.filter((e) => e.outcome === "unknown");
  const traces = evaluations.map((e) => e.trace);

  // Consistency: every evaluation has a trace with matching policy id + outcome
  for (const item of evaluations) {
    if (item.trace.policyId !== item.policyId) {
      validationIssues.push({
        code: "EVALUATION_INCONSISTENCY",
        message: `Trace policyId mismatch for ${item.policyId}`,
        severity: "error",
        policyId: item.policyId,
      });
    }
    if (item.trace.outcome !== item.outcome) {
      validationIssues.push({
        code: "EVALUATION_INCONSISTENCY",
        message: `Trace outcome mismatch for ${item.policyId}`,
        severity: "error",
        policyId: item.policyId,
      });
    }
  }

  const hasErrors = validationIssues.some((i) => i.severity === "error");

  return {
    ok: !hasErrors,
    subjectId: context.subjectId,
    organizationId: context.organizationId,
    evaluatedAt,
    satisfied,
    violated,
    unknown,
    evaluations,
    traces,
    validationIssues,
  };
}
