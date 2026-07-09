import type { RuleAuditEntry, RuleEvaluationResult } from "@/lib/platform/rules/types";

export interface PlatformRuleEvaluationRecordRow {
  id: string;
  evaluation_id: string;
  rule_set_key: string;
  domain: string;
  evaluation_mode: "first_match" | "all_match" | "weighted";
  entity_type: string | null;
  entity_id: string | null;
  organization_id: string | null;
  school_id: string | null;
  actor_user_id: string | null;
  summary: string;
  facts: Record<string, unknown>;
  matched_rule_keys: string[];
  primary_outcome_key: string | null;
  outcome_effects: Record<string, unknown> | null;
  rule_results: RuleEvaluationResult["rulesEvaluated"];
  explanation: RuleEvaluationResult["explanation"];
  result: RuleEvaluationResult;
  metadata: Record<string, unknown>;
  evaluated_at: string;
  recorded_at: string;
}

export interface ListPlatformRuleEvaluationRecordsFilters {
  evaluationId?: string;
  ruleSetKey?: string;
  domain?: string;
  entityType?: string;
  entityId?: string;
  schoolId?: string;
  organizationId?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
}

export function ruleAuditEntryToRow(
  entry: RuleAuditEntry
): Omit<PlatformRuleEvaluationRecordRow, "id" | "recorded_at"> {
  const result = entry.result;
  return {
    evaluation_id: entry.evaluationId,
    rule_set_key: entry.ruleSetKey,
    domain: entry.domain,
    evaluation_mode: entry.evaluationMode,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    organization_id: coerceUuid(entry.organizationId),
    school_id: coerceUuid(entry.schoolId),
    actor_user_id: coerceUuid(entry.actorUserId),
    summary: entry.summary,
    facts: result.facts,
    matched_rule_keys: result.matchedRules.map((rule) => rule.ruleKey),
    primary_outcome_key: result.primaryOutcome?.outcomeKey ?? null,
    outcome_effects: result.primaryOutcome?.effects ?? null,
    rule_results: result.rulesEvaluated,
    explanation: result.explanation,
    result,
    metadata: {
      ...(entry.metadata ?? {}),
    },
    evaluated_at: result.evaluatedAt,
  };
}

export function rowToRuleAuditEntry(row: PlatformRuleEvaluationRecordRow): RuleAuditEntry {
  return {
    evaluationId: row.evaluation_id,
    ruleSetKey: row.rule_set_key,
    domain: row.domain,
    evaluationMode: row.evaluation_mode,
    actorUserId: row.actor_user_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    schoolId: row.school_id,
    organizationId: row.organization_id,
    summary: row.summary,
    result: row.result,
    metadata: row.metadata,
    recordedAt: row.recorded_at,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function coerceUuid(value: string | null | undefined): string | null {
  if (!value) return null;
  return UUID_RE.test(value) ? value : null;
}
