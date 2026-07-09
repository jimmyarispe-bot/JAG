import type {
  DecisionAuditEntry,
  DecisionResult,
  ExecuteDecisionInput,
} from "@/lib/platform/decision/types";

let auditSequence = 0;

/** Build a decision audit entry — persistence is delegated to consuming modules. */
export function buildDecisionAuditEntry(
  input: ExecuteDecisionInput,
  result: DecisionResult,
  summary: string
): DecisionAuditEntry {
  return {
    executionId: result.executionId,
    decisionType: result.decisionType,
    domain: input.metadata?.domain as string | undefined ?? "unknown",
    engineMode: result.engineMode,
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

/** In-memory audit buffer — canonical persistence via platform_decision_records (Wave 1). */
const DECISION_AUDIT_BUFFER: DecisionAuditEntry[] = [];

export function recordDecisionAuditEntry(entry: DecisionAuditEntry): void {
  DECISION_AUDIT_BUFFER.push(entry);
}

export function getDecisionAuditEntries(executionId?: string): DecisionAuditEntry[] {
  if (!executionId) return [...DECISION_AUDIT_BUFFER];
  return DECISION_AUDIT_BUFFER.filter((entry) => entry.executionId === executionId);
}

export function clearDecisionAuditBuffer(): void {
  DECISION_AUDIT_BUFFER.length = 0;
  auditSequence = 0;
}

export function nextDecisionExecutionId(prefix = "dec"): string {
  auditSequence += 1;
  return `${prefix}_${Date.now()}_${auditSequence}`;
}
