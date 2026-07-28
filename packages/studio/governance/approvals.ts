/**
 * Release approval workflow — auditable role-based decisions.
 */

import { randomUUID } from "node:crypto";
import type {
  ApprovalDecision,
  ApprovalRole,
  StudioProductId,
} from "../types";
import { APPROVAL_ROLES } from "../types";

export type ApprovalRecord = {
  readonly id: string;
  readonly productId: string;
  readonly releaseId: string | null;
  readonly role: ApprovalRole;
  readonly approver: string;
  readonly decision: ApprovalDecision;
  readonly comments: string;
  readonly timestamp: string;
};

export type ApprovalWorkflowState = {
  readonly productId: string;
  readonly releaseId: string | null;
  readonly steps: readonly {
    readonly role: ApprovalRole;
    readonly status: ApprovalDecision;
    readonly latest: ApprovalRecord | null;
  }[];
  readonly complete: boolean;
  readonly blocked: boolean;
  readonly nextRole: ApprovalRole | null;
};

const g = globalThis as typeof globalThis & {
  __jagStudioApprovals?: ApprovalRecord[];
};

function approvals(): ApprovalRecord[] {
  if (!g.__jagStudioApprovals) g.__jagStudioApprovals = [];
  return g.__jagStudioApprovals;
}

export function clearApprovalsForTests(): void {
  g.__jagStudioApprovals = [];
}

export function listApprovals(input?: {
  productId?: string;
  releaseId?: string;
}): readonly ApprovalRecord[] {
  return Object.freeze(
    approvals()
      .filter((a) => {
        if (input?.productId && a.productId !== input.productId) return false;
        if (input?.releaseId && a.releaseId !== input.releaseId) return false;
        return true;
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  );
}

export function recordApproval(input: {
  productId: StudioProductId | string;
  releaseId?: string | null;
  role: ApprovalRole;
  approver: string;
  decision: ApprovalDecision;
  comments?: string;
}): ApprovalRecord | { error: string } {
  if (!(APPROVAL_ROLES as readonly string[]).includes(input.role)) {
    return { error: "Invalid approval role." };
  }
  if (!input.approver.trim()) return { error: "approver is required." };
  if (
    input.decision !== "Approved" &&
    input.decision !== "Rejected" &&
    input.decision !== "Pending"
  ) {
    return { error: "Invalid decision." };
  }

  const record: ApprovalRecord = {
    id: randomUUID(),
    productId: input.productId,
    releaseId: input.releaseId ?? null,
    role: input.role,
    approver: input.approver.trim(),
    decision: input.decision,
    comments: input.comments?.trim() ?? "",
    timestamp: new Date().toISOString(),
  };
  approvals().push(record);
  return record;
}

export function getApprovalWorkflow(input: {
  productId: string;
  releaseId?: string | null;
}): ApprovalWorkflowState {
  const records = listApprovals({
    productId: input.productId,
    releaseId: input.releaseId ?? undefined,
  });

  const steps = APPROVAL_ROLES.map((role) => {
    const latest =
      records.find((r) => r.role === role && r.decision !== "Pending") ??
      records.find((r) => r.role === role) ??
      null;
    return {
      role,
      status: (latest?.decision ?? "Pending") as ApprovalDecision,
      latest,
    };
  });

  const blocked = steps.some((s) => s.status === "Rejected");
  const complete =
    !blocked && steps.every((s) => s.status === "Approved");
  const nextRole =
    blocked || complete
      ? null
      : steps.find((s) => s.status === "Pending")?.role ?? null;

  return {
    productId: input.productId,
    releaseId: input.releaseId ?? null,
    steps: Object.freeze(steps),
    complete,
    blocked,
    nextRole,
  };
}

export function createApprovalService() {
  return {
    list: listApprovals,
    record: recordApproval,
    workflow: getApprovalWorkflow,
  };
}
