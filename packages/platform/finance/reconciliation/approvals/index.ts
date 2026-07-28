import { randomUUID } from "node:crypto";
import {
  hasFinancePermission,
  requireFinancePermission,
} from "../../permissions";
import type { FinanceRole } from "../../types";
import {
  getPeriod,
  listApprovals,
  upsertApproval,
  upsertPeriod,
} from "../store";
import type { ApproverStage, ReconciliationApproval } from "../types";
import { recordReconciliationHistory } from "../history";

const STAGE_ROLE: Record<ApproverStage, FinanceRole> = {
  reconciler: "reconcile",
  controller: "controller",
  finance_manager: "approve",
  cfo: "cfo",
};

const STAGE_ORDER: ApproverStage[] = [
  "reconciler",
  "controller",
  "finance_manager",
  "cfo",
];

export function canApproveStage(input: {
  organizationId: string;
  userId: string;
  stage: ApproverStage;
}): boolean {
  if (
    hasFinancePermission({
      organizationId: input.organizationId,
      userId: input.userId,
      role: "auditor",
    }) &&
    !hasFinancePermission({
      organizationId: input.organizationId,
      userId: input.userId,
      role: STAGE_ROLE[input.stage],
    })
  ) {
    // Auditor is read-only unless they also hold the stage role
    const grantRoles = ["reconcile", "controller", "approve", "cfo"] as const;
    const hasOp = grantRoles.some((r) =>
      hasFinancePermission({
        organizationId: input.organizationId,
        userId: input.userId,
        role: r,
      })
    );
    if (!hasOp) return false;
  }
  return hasFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: STAGE_ROLE[input.stage],
  });
}

export function approveReconciliation(input: {
  organizationId: string;
  userId: string;
  periodId: string;
  stage: ApproverStage;
  note?: string | null;
}):
  | {
      approval: ReconciliationApproval;
      period: ReturnType<typeof getPeriod>;
    }
  | { error: string } {
  const period = getPeriod(input.periodId);
  if (!period || period.organizationId !== input.organizationId) {
    return { error: "Period not found." };
  }
  if (period.status === "closed") return { error: "Period is closed." };
  if (period.openedBy === input.userId && input.stage !== "reconciler") {
    return {
      error:
        "Segregation of duties: period opener cannot approve at controller+ stages.",
    };
  }
  if (!canApproveStage(input)) {
    return { error: `Missing permission for approval stage: ${input.stage}` };
  }

  const existing = listApprovals(input.organizationId, input.periodId);
  if (existing.some((a) => a.stage === input.stage)) {
    return { error: `Stage ${input.stage} already approved.` };
  }
  if (existing.some((a) => a.approvedBy === input.userId)) {
    return { error: "Segregation of duties: user already approved this period." };
  }

  // Enforce sequential stages
  const idx = STAGE_ORDER.indexOf(input.stage);
  for (let i = 0; i < idx; i++) {
    const need = STAGE_ORDER[i]!;
    if (!existing.some((a) => a.stage === need)) {
      return { error: `Prior stage required: ${need}` };
    }
  }

  const approval = upsertApproval({
    id: `rappr:${randomUUID()}`,
    organizationId: input.organizationId,
    periodId: input.periodId,
    stage: input.stage,
    approvedBy: input.userId,
    approvedAt: new Date().toISOString(),
    note: input.note ?? null,
  });

  const after = listApprovals(input.organizationId, input.periodId);
  const allStagesDone = STAGE_ORDER.every((s) =>
    after.some((a) => a.stage === s)
  );

  const updated = upsertPeriod({
    ...period,
    status: allStagesDone ? "finalized" : "pending_approval",
    finalizedAt: allStagesDone ? new Date().toISOString() : period.finalizedAt,
  });

  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: input.periodId,
    action: `approved_${input.stage}`,
    actorUserId: input.userId,
    previousState: period,
    currentState: { approval, period: updated },
  });

  return { approval, period: updated };
}

export function requireClosePermission(input: {
  organizationId: string;
  userId: string;
}): { ok: true } | { error: string } {
  return requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "close_period",
  });
}

export function requireReopenPermission(input: {
  organizationId: string;
  userId: string;
}): { ok: true } | { error: string } {
  return requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "financial_administrator",
  });
}

export { listApprovals, STAGE_ORDER };
