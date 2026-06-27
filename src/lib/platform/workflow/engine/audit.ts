import type {
  WorkflowAuditEntry,
  WorkflowInstanceContext,
} from "@/lib/platform/workflow/types";

let auditSequence = 0;

/** Build a workflow audit entry — persistence is delegated to consuming modules. */
export function buildWorkflowAuditEntry(
  context: WorkflowInstanceContext,
  input: Omit<WorkflowAuditEntry, "workflowKey" | "instanceId" | "domain" | "entityType" | "entityId">
): WorkflowAuditEntry {
  return {
    workflowKey: context.workflowKey,
    instanceId: context.instanceId,
    domain: context.domain,
    entityType: context.entityType,
    entityId: context.entityId,
    actorUserId: input.actorUserId ?? context.actorUserId ?? null,
    ...input,
  };
}

/** In-memory audit buffer for skeleton execution — replaced by DB persistence in Phase 2+. */
const SKELETON_AUDIT_BUFFER: WorkflowAuditEntry[] = [];

export function recordSkeletonAuditEntry(entry: WorkflowAuditEntry): void {
  SKELETON_AUDIT_BUFFER.push(entry);
}

export function getSkeletonAuditEntries(instanceId?: string): WorkflowAuditEntry[] {
  if (!instanceId) return [...SKELETON_AUDIT_BUFFER];
  return SKELETON_AUDIT_BUFFER.filter((entry) => entry.instanceId === instanceId);
}

export function clearSkeletonAuditBuffer(): void {
  SKELETON_AUDIT_BUFFER.length = 0;
  auditSequence = 0;
}

export function nextSkeletonInstanceId(prefix = "wf"): string {
  auditSequence += 1;
  return `${prefix}_${Date.now()}_${auditSequence}`;
}
