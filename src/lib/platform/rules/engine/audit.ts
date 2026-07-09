import type { EvaluateRuleSetInput, RuleAuditEntry, RuleEvaluationResult } from "@/lib/platform/rules/types";

let auditSequence = 0;

export function nextRuleEvaluationId(prefix = "ruleval"): string {
  auditSequence += 1;
  return `${prefix}_${Date.now()}_${auditSequence}`;
}

export function buildRuleAuditEntry(
  input: EvaluateRuleSetInput,
  result: RuleEvaluationResult,
  summary: string
): RuleAuditEntry {
  return {
    evaluationId: result.evaluationId,
    ruleSetKey: result.ruleSetKey,
    domain: result.domain,
    evaluationMode: result.evaluationMode,
    actorUserId: input.actorUserId ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    schoolId: input.schoolId ?? null,
    organizationId: input.organizationId ?? null,
    summary,
    result,
    metadata: input.metadata,
    recordedAt: new Date().toISOString(),
  };
}

/** In-memory audit buffer — canonical persistence via platform_rule_evaluation_records. */
const RULE_AUDIT_BUFFER: RuleAuditEntry[] = [];

export function recordRuleAuditEntry(entry: RuleAuditEntry): void {
  RULE_AUDIT_BUFFER.push(entry);
}

export function getRuleAuditEntries(evaluationId?: string): RuleAuditEntry[] {
  if (!evaluationId) return [...RULE_AUDIT_BUFFER];
  return RULE_AUDIT_BUFFER.filter((entry) => entry.evaluationId === evaluationId);
}

export function clearRuleAuditBuffer(): void {
  RULE_AUDIT_BUFFER.length = 0;
  auditSequence = 0;
}
