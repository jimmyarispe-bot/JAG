import { buildRuleExplanation } from "@/lib/platform/rules/engine/explanation";
import { evaluateRulesForSet } from "@/lib/platform/rules/engine/evaluator";
import {
  buildRuleAuditEntry,
  nextRuleEvaluationId,
  recordRuleAuditEntry,
} from "@/lib/platform/rules/engine/audit";
import { mergeEvidenceIntoFacts } from "@/lib/platform/rules/integration/context";
import { publishRuleEvaluationEvent } from "@/lib/platform/rules/integration/events";
import { persistRuleAuditEntry } from "@/lib/platform/rules/persistence/records";
import { syncRuleEvaluationGraphEdges } from "@/lib/platform/intelligence-graph/integration/rules";
import { getRuleSet } from "@/lib/platform/rules/registry/registry";
import type { PlatformEvidenceRecord } from "@/lib/platform/evidence/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { EvaluateRuleSetInput, RuleEvaluationResult } from "@/lib/platform/rules/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface EvaluateRuleSetOptions {
  recordAudit?: boolean;
  persist?: { supabase: AuthClient };
  publishEvent?: {
    supabase: AuthClient;
    actorId?: string;
  };
  evidenceRecords?: PlatformEvidenceRecord[];
}

/**
 * Evaluate a registered rule set against supplied facts.
 * Deterministic, explainable, auditable — the unified Rules Engine API.
 */
export async function evaluateRuleSet(
  input: EvaluateRuleSetInput,
  options: EvaluateRuleSetOptions = {}
): Promise<RuleEvaluationResult> {
  const definition = getRuleSet(input.ruleSetKey);
  if (!definition) {
    throw new Error(`Unknown rule set "${input.ruleSetKey}"`);
  }
  if (definition.status !== "active") {
    throw new Error(`Rule set "${input.ruleSetKey}" is not active`);
  }

  const evaluationId = nextRuleEvaluationId();
  const facts =
    options.evidenceRecords?.length ?
      mergeEvidenceIntoFacts(input.facts, options.evidenceRecords)
    : input.facts;

  let result = evaluateRulesForSet({
    definition,
    facts,
    evaluationId,
  });

  const explanation = buildRuleExplanation(result);
  result = { ...result, explanation };

  if (options.recordAudit !== false) {
    const auditEntry = buildRuleAuditEntry(input, result, explanation.summary);
    recordRuleAuditEntry(auditEntry);

    if (options.persist?.supabase) {
      const { error } = await persistRuleAuditEntry(options.persist.supabase, auditEntry);
      if (error) {
        throw new Error(`Failed to persist rule evaluation "${evaluationId}": ${error}`);
      }
      await syncRuleEvaluationGraphEdges(options.persist.supabase, auditEntry);
    }
  }

  if (options.publishEvent?.supabase) {
    await publishRuleEvaluationEvent({
      supabase: options.publishEvent.supabase,
      result,
      organizationId: input.organizationId,
      schoolId: input.schoolId,
      actorId: options.publishEvent.actorId ?? input.actorUserId ?? undefined,
      entityType: input.entityType,
      entityId: input.entityId,
    });
  }

  return result;
}
