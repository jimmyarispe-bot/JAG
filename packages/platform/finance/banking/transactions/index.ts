import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../../audit";
import { requireFinancePermission } from "../../permissions";
import { listBanks } from "../../store";
import type { CurrencyCode } from "../../types";
import {
  appendTxnAudit,
  getTransaction,
  listTransactions,
  listTxnAudit,
  upsertTransaction,
} from "../store";
import type { BankTransaction, BankTransactionStatus } from "../types";
import { applyRulesToTransaction } from "../rules";
import { evaluateTransactionExceptions } from "../exceptions";
import { notifyBanking } from "../notifications";
import { getTreasuryApprovalPolicy } from "../security";

export function createBankTransaction(input: {
  organizationId: string;
  userId: string;
  bankAccountId: string;
  amount: number;
  direction: "in" | "out";
  description: string;
  status?: BankTransactionStatus;
  currency?: CurrencyCode;
  merchantName?: string | null;
  externalId?: string | null;
  importId?: string | null;
  entityId?: string | null;
}): BankTransaction | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (input.amount <= 0) return { error: "Amount must be positive." };
  const bank = listBanks(input.organizationId).find(
    (b) => b.id === input.bankAccountId
  );
  if (!bank) return { error: "Bank account not found." };

  const status = input.status ?? "manual";
  const now = new Date().toISOString();
  let txn = upsertTransaction({
    id: `btxn:${randomUUID()}`,
    organizationId: input.organizationId,
    bankAccountId: input.bankAccountId,
    entityId: input.entityId ?? bank.entityId,
    status,
    amount: input.amount,
    currency: input.currency ?? bank.currency,
    direction: input.direction,
    postedAt: status === "posted" ? now : null,
    pendingAt: status === "pending" ? now : null,
    description: input.description,
    merchantName: input.merchantName ?? null,
    category: null,
    vendorId: null,
    customerId: null,
    externalId: input.externalId ?? null,
    importId: input.importId ?? null,
    parentTransactionId: null,
    splitOfId: null,
    linkedRecordType: null,
    linkedRecordId: null,
    createdAt: now,
    createdBy: input.userId,
    correctedFromId: null,
  });

  txn = applyRulesToTransaction(txn);
  evaluateTransactionExceptions(txn);
  appendTxnAudit({
    transactionId: txn.id,
    at: now,
    action: `created:${txn.status}`,
    by: input.userId,
  });

  const policy = getTreasuryApprovalPolicy(input.organizationId);
  if (
    input.direction === "out" &&
    input.amount >= policy.largeTransactionThreshold
  ) {
    notifyBanking({
      organizationId: input.organizationId,
      kind: "large_withdrawal",
      message: `Large withdrawal ${input.amount} ${txn.currency} on ${bank.name}`,
    });
  }

  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "banking.transaction_create",
    recordType: "bank_transaction",
    recordId: txn.id,
    userId: input.userId,
    newValue: txn,
  });
  return txn;
}

export function setTransactionStatus(input: {
  organizationId: string;
  userId: string;
  transactionId: string;
  status: BankTransactionStatus;
}): BankTransaction | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const existing = getTransaction(input.transactionId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Transaction not found." };
  }
  const now = new Date().toISOString();
  const updated = upsertTransaction({
    ...existing,
    status: input.status,
    postedAt:
      input.status === "posted" ? existing.postedAt ?? now : existing.postedAt,
    pendingAt:
      input.status === "pending"
        ? existing.pendingAt ?? now
        : existing.pendingAt,
  });
  appendTxnAudit({
    transactionId: updated.id,
    at: now,
    action: `status:${input.status}`,
    by: input.userId,
  });
  return updated;
}

export function voidTransaction(input: {
  organizationId: string;
  userId: string;
  transactionId: string;
}): BankTransaction | { error: string } {
  return setTransactionStatus({ ...input, status: "voided" });
}

export function correctTransaction(input: {
  organizationId: string;
  userId: string;
  transactionId: string;
  amount: number;
  description?: string;
}): BankTransaction | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const existing = getTransaction(input.transactionId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Transaction not found." };
  }
  const now = new Date().toISOString();
  upsertTransaction({ ...existing, status: "corrected" });
  const corrected = upsertTransaction({
    ...existing,
    id: `btxn:${randomUUID()}`,
    status: "corrected",
    amount: input.amount,
    description: input.description ?? existing.description,
    correctedFromId: existing.id,
    createdAt: now,
    createdBy: input.userId,
    parentTransactionId: existing.id,
  });
  appendTxnAudit({
    transactionId: corrected.id,
    at: now,
    action: `corrected_from:${existing.id}`,
    by: input.userId,
  });
  return corrected;
}

export function splitTransaction(input: {
  organizationId: string;
  userId: string;
  transactionId: string;
  splits: readonly { amount: number; description: string }[];
}): BankTransaction[] | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const existing = getTransaction(input.transactionId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Transaction not found." };
  }
  const sum = input.splits.reduce((a, s) => a + s.amount, 0);
  if (Math.abs(sum - existing.amount) > 0.001) {
    return { error: "Split amounts must equal original amount." };
  }
  const now = new Date().toISOString();
  upsertTransaction({ ...existing, status: "split" });
  const children = input.splits.map((s) =>
    upsertTransaction({
      ...existing,
      id: `btxn:${randomUUID()}`,
      status: "split",
      amount: s.amount,
      description: s.description,
      splitOfId: existing.id,
      createdAt: now,
      createdBy: input.userId,
    })
  );
  appendTxnAudit({
    transactionId: existing.id,
    at: now,
    action: `split:${children.length}`,
    by: input.userId,
  });
  return children;
}

export function linkTransaction(input: {
  organizationId: string;
  userId: string;
  transactionId: string;
  recordType: string;
  recordId: string;
}): BankTransaction | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const existing = getTransaction(input.transactionId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Transaction not found." };
  }
  const updated = upsertTransaction({
    ...existing,
    status: "linked",
    linkedRecordType: input.recordType,
    linkedRecordId: input.recordId,
  });
  appendTxnAudit({
    transactionId: updated.id,
    at: new Date().toISOString(),
    action: `linked:${input.recordType}:${input.recordId}`,
    by: input.userId,
  });
  return updated;
}

export function transactionHistory(transactionId: string) {
  return listTxnAudit(transactionId);
}

export { listTransactions, getTransaction };
