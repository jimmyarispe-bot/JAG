import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../../audit";
import { requireFinancePermission } from "../../permissions";
import { listBanks, upsertTransfer } from "../../store";
import {
  getTransferRequest,
  listTransferRequests,
  upsertTransferRequest,
} from "../store";
import type {
  TreasuryTransferKind,
  TreasuryTransferRequest,
} from "../types";
import {
  assertDualAuthSegregation,
  requiresDualAuthorization,
  requiresTransferApproval,
} from "../security";
import { notifyBanking } from "../notifications";
import { adjustCashForTransfer } from "../cash";

export function requestTreasuryTransfer(input: {
  organizationId: string;
  userId: string;
  kind: TreasuryTransferKind;
  fromBankAccountId: string;
  toBankAccountId: string;
  amount: number;
  currency?: string;
  memo?: string | null;
}): TreasuryTransferRequest | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (input.amount <= 0) return { error: "Transfer amount must be positive." };
  if (input.fromBankAccountId === input.toBankAccountId) {
    return { error: "From and to accounts must differ." };
  }
  const banks = listBanks(input.organizationId);
  const from = banks.find((b) => b.id === input.fromBankAccountId);
  const to = banks.find((b) => b.id === input.toBankAccountId);
  if (!from || !to) return { error: "Both bank accounts must exist." };

  const needsApproval = requiresTransferApproval(
    input.organizationId,
    input.amount
  );
  const dual = requiresDualAuthorization(input.organizationId, input.amount);
  const intercompany =
    input.kind === "intercompany" ||
    (from.entityId && to.entityId && from.entityId !== to.entityId);

  const request = upsertTransferRequest({
    id: `txreq:${randomUUID()}`,
    organizationId: input.organizationId,
    kind: intercompany ? "intercompany" : input.kind,
    status: needsApproval ? "pending_approval" : "approved",
    fromBankAccountId: input.fromBankAccountId,
    toBankAccountId: input.toBankAccountId,
    fromEntityId: from.entityId,
    toEntityId: to.entityId,
    amount: input.amount,
    currency: (input.currency as TreasuryTransferRequest["currency"]) ?? from.currency,
    memo: input.memo ?? null,
    requiresDualAuth: dual,
    approvedBy: Object.freeze([]),
    createdBy: input.userId,
    createdAt: new Date().toISOString(),
    executedAt: null,
  });

  if (needsApproval) {
    notifyBanking({
      organizationId: input.organizationId,
      kind: "transfer_approval",
      message: `Transfer ${request.id} awaiting approval (${request.amount})`,
    });
  }

  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "treasury.transfer_request",
    recordType: "transfer_request",
    recordId: request.id,
    userId: input.userId,
    newValue: request,
  });
  return request;
}

export function approveTreasuryTransfer(input: {
  organizationId: string;
  userId: string;
  transferRequestId: string;
}): TreasuryTransferRequest | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "approve",
  });
  if ("error" in gate) return gate;
  const existing = getTransferRequest(input.transferRequestId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Transfer request not found." };
  }
  if (
    existing.status !== "pending_approval" &&
    existing.status !== "approved"
  ) {
    return { error: "Transfer is not awaiting approval." };
  }

  const segregation = assertDualAuthSegregation({
    createdBy: existing.createdBy,
    approverId: input.userId,
    approvedBy: existing.approvedBy,
  });
  if ("error" in segregation) return segregation;

  const approvedBy = Object.freeze([...existing.approvedBy, input.userId]);
  const dualSatisfied =
    !existing.requiresDualAuth || approvedBy.length >= 2;
  const updated = upsertTransferRequest({
    ...existing,
    approvedBy,
    status: dualSatisfied ? "approved" : "pending_approval",
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "treasury.transfer_approve",
    recordType: "transfer_request",
    recordId: updated.id,
    userId: input.userId,
    newValue: updated,
  });
  return updated;
}

export function executeTreasuryTransfer(input: {
  organizationId: string;
  userId: string;
  transferRequestId: string;
}): TreasuryTransferRequest | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "post",
  });
  if ("error" in gate) return gate;
  const existing = getTransferRequest(input.transferRequestId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Transfer request not found." };
  }
  if (existing.status !== "approved") {
    return { error: "Transfer must be approved before execution." };
  }
  if (
    existing.requiresDualAuth &&
    existing.approvedBy.length < 2
  ) {
    return { error: "Dual authorization required." };
  }

  const cash = adjustCashForTransfer({
    organizationId: input.organizationId,
    fromBankAccountId: existing.fromBankAccountId,
    toBankAccountId: existing.toBankAccountId,
    amount: existing.amount,
  });
  if ("error" in cash) {
    upsertTransferRequest({ ...existing, status: "failed" });
    return { error: cash.error };
  }

  // Mirror into P-008 simple transfer ledger
  upsertTransfer({
    id: existing.id,
    organizationId: input.organizationId,
    fromBankAccountId: existing.fromBankAccountId,
    toBankAccountId: existing.toBankAccountId,
    amount: existing.amount,
    currency: existing.currency,
    transferredAt: new Date().toISOString(),
    memo: existing.memo,
  });

  const executed = upsertTransferRequest({
    ...existing,
    status: "executed",
    executedAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "treasury.transfer_execute",
    recordType: "transfer_request",
    recordId: executed.id,
    userId: input.userId,
    newValue: executed,
  });
  return executed;
}

/** ACH / wire placeholders — same pipeline; settlement adapters later. */
export function describePaymentRails(): {
  readonly wire: "placeholder";
  readonly ach: "placeholder";
  readonly bank: true;
  readonly internal: true;
  readonly intercompany: true;
} {
  return Object.freeze({
    wire: "placeholder",
    ach: "placeholder",
    bank: true,
    internal: true,
    intercompany: true,
  });
}

export { listTransferRequests, getTransferRequest };
