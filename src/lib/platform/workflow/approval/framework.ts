import type {
  WorkflowApprovalGate,
  WorkflowApprovalRequest,
  WorkflowInstanceContext,
  WorkflowTransitionDefinition,
} from "@/lib/platform/workflow/types";
import { buildWorkflowAuditEntry, recordSkeletonAuditEntry } from "@/lib/platform/workflow/engine/audit";

const PENDING_APPROVALS = new Map<string, WorkflowApprovalRequest>();

export interface WorkflowApprovalEvaluation {
  required: boolean;
  gate?: WorkflowApprovalGate;
  reason?: string;
}

/** Determine whether a transition requires approval before proceeding. */
export function evaluateTransitionApprovalGate(
  transition: WorkflowTransitionDefinition
): WorkflowApprovalEvaluation {
  if (!transition.approvalGate) {
    return { required: false };
  }
  return {
    required: true,
    gate: transition.approvalGate,
    reason: `Transition "${transition.key}" requires approval gate "${transition.approvalGate.key}"`,
  };
}

export interface CreateWorkflowApprovalInput {
  context: WorkflowInstanceContext;
  transition: WorkflowTransitionDefinition;
  requestedBy?: string | null;
}

/** Create a pending approval request for a gated transition (skeleton — in-memory). */
export function createWorkflowApprovalRequest(
  input: CreateWorkflowApprovalInput
): WorkflowApprovalRequest {
  const gate = input.transition.approvalGate;
  if (!gate) {
    throw new Error(`Transition "${input.transition.key}" has no approval gate`);
  }

  const requestId = `approval_${input.context.instanceId}_${gate.key}_${Date.now()}`;
  const request: WorkflowApprovalRequest = {
    requestId,
    workflowKey: input.context.workflowKey,
    instanceId: input.context.instanceId,
    transitionKey: input.transition.key,
    gateKey: gate.key,
    status: "pending",
    requestedBy: input.requestedBy ?? input.context.actorUserId ?? null,
    metadata: {
      approverRoles: gate.approverRoles ?? [],
      approverCount: gate.approverCount ?? 1,
      entityType: input.context.entityType,
      entityId: input.context.entityId,
      schoolId: input.context.schoolId ?? null,
    },
  };

  PENDING_APPROVALS.set(requestId, request);

  recordSkeletonAuditEntry(
    buildWorkflowAuditEntry(input.context, {
      eventType: "approval_requested",
      summary: `Approval requested for transition "${input.transition.label}" (${gate.label})`,
      transitionKey: input.transition.key,
      metadata: { requestId, gateKey: gate.key },
    })
  );

  return request;
}

export function getWorkflowApprovalRequest(
  requestId: string
): WorkflowApprovalRequest | undefined {
  return PENDING_APPROVALS.get(requestId);
}

export function getPendingWorkflowApprovals(
  instanceId?: string
): WorkflowApprovalRequest[] {
  const pending = [...PENDING_APPROVALS.values()].filter((req) => req.status === "pending");
  if (!instanceId) return pending;
  return pending.filter((req) => req.instanceId === instanceId);
}

export interface DecideWorkflowApprovalInput {
  requestId: string;
  decision: "approved" | "rejected" | "escalated";
  decidedBy?: string | null;
  notes?: string;
}

/** Resolve a pending approval request (skeleton — in-memory). */
export function decideWorkflowApproval(
  input: DecideWorkflowApprovalInput
): { success: boolean; request?: WorkflowApprovalRequest; error?: string } {
  const request = PENDING_APPROVALS.get(input.requestId);
  if (!request) {
    return { success: false, error: `Approval request "${input.requestId}" not found` };
  }
  if (request.status !== "pending") {
    return { success: false, error: `Approval request "${input.requestId}" is already ${request.status}` };
  }

  request.status = input.decision;
  request.metadata = {
    ...request.metadata,
    decidedBy: input.decidedBy ?? null,
    decisionNotes: input.notes ?? null,
    decidedAt: new Date().toISOString(),
  };

  PENDING_APPROVALS.set(input.requestId, request);
  return { success: true, request };
}

/** Merge approval decision into facts for subsequent condition evaluation. */
export function approvalFactsFromDecision(
  decision: "approved" | "rejected" | "escalated"
): Record<string, unknown> {
  return {
    approvalStatus: decision === "escalated" ? "rejected" : decision,
    approvalEscalated: decision === "escalated",
  };
}

export function clearWorkflowApprovalBuffer(): void {
  PENDING_APPROVALS.clear();
}

/** Check whether approver roles satisfy gate requirements (skeleton role check). */
export function satisfiesApprovalGate(
  gate: WorkflowApprovalGate,
  approverRoles: string[]
): boolean {
  const required = gate.approverCount ?? 1;
  const gateRoles = gate.approverRoles ?? [];
  if (gateRoles.length === 0) {
    return approverRoles.length >= required;
  }
  const matches = approverRoles.filter((role) => gateRoles.includes(role));
  return matches.length >= required;
}
