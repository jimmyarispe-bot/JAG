import type {
  CollectedEvidence,
  ConfidenceScore,
  DecisionAuditEntry,
  DecisionExplanation,
  DecisionResult,
  Recommendation,
} from "@/lib/platform/decision/types";

export interface PlatformDecisionRecordRow {
  id: string;
  execution_id: string;
  decision_type: string;
  domain: string;
  engine_mode: "rule" | "ai_assisted" | "hybrid";
  entity_type: string | null;
  entity_id: string | null;
  organization_id: string | null;
  school_id: string | null;
  actor_user_id: string | null;
  summary: string;
  inputs: Record<string, unknown>;
  result: DecisionResult;
  collected_evidence: CollectedEvidence;
  recommendation: Recommendation;
  confidence: ConfidenceScore;
  explanation: DecisionExplanation;
  metadata: Record<string, unknown>;
  executed_at: string;
  recorded_at: string;
}

export interface ListPlatformDecisionRecordsFilters {
  executionId?: string;
  decisionType?: string;
  entityType?: string;
  entityId?: string;
  schoolId?: string;
  organizationId?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
}

export function decisionAuditEntryToRow(
  entry: DecisionAuditEntry
): Omit<PlatformDecisionRecordRow, "id" | "recorded_at"> {
  const result = entry.result;
  return {
    execution_id: entry.executionId,
    decision_type: entry.decisionType,
    domain: entry.domain,
    engine_mode: entry.engineMode,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    organization_id: coerceUuid(entry.organizationId),
    school_id: coerceUuid(entry.schoolId),
    actor_user_id: coerceUuid(entry.actorUserId),
    summary: entry.summary,
    inputs: result.inputs,
    result,
    collected_evidence: result.collectedEvidence,
    recommendation: result.recommendation,
    confidence: result.confidence,
    explanation: result.explanation,
    metadata: {
      ...(entry.metadata ?? {}),
    },
    executed_at: result.executionTimestamp,
  };
}

export function rowToDecisionAuditEntry(row: PlatformDecisionRecordRow): DecisionAuditEntry {
  return {
    executionId: row.execution_id,
    decisionType: row.decision_type,
    domain: row.domain,
    engineMode: row.engine_mode,
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
