import { randomUUID } from "node:crypto";
import { listExceptions, listTransactions, upsertException } from "../store";
import type { BankTransaction, BankingException } from "../types";
import { getTreasuryApprovalPolicy } from "../security";

export function raiseBankingException(input: {
  organizationId: string;
  kind: BankingException["kind"];
  severity: BankingException["severity"];
  message: string;
  relatedRecordType: string;
  relatedRecordId: string;
}): BankingException {
  return upsertException({
    id: `bex:${randomUUID()}`,
    organizationId: input.organizationId,
    kind: input.kind,
    severity: input.severity,
    message: input.message,
    relatedRecordType: input.relatedRecordType,
    relatedRecordId: input.relatedRecordId,
    open: true,
    createdAt: new Date().toISOString(),
  });
}

export function evaluateTransactionExceptions(
  txn: BankTransaction
): readonly BankingException[] {
  const raised: BankingException[] = [];
  const policy = getTreasuryApprovalPolicy(txn.organizationId);

  if (!txn.category && !txn.vendorId && !txn.customerId) {
    raised.push(
      raiseBankingException({
        organizationId: txn.organizationId,
        kind: "unknown_transaction",
        severity: "medium",
        message: `Uncategorized transaction: ${txn.description}`,
        relatedRecordType: "bank_transaction",
        relatedRecordId: txn.id,
      })
    );
  }

  if (!txn.externalId && txn.status === "imported") {
    raised.push(
      raiseBankingException({
        organizationId: txn.organizationId,
        kind: "missing_reference",
        severity: "low",
        message: "Imported transaction missing external reference",
        relatedRecordType: "bank_transaction",
        relatedRecordId: txn.id,
      })
    );
  }

  if (txn.amount >= policy.largeTransactionThreshold) {
    raised.push(
      raiseBankingException({
        organizationId: txn.organizationId,
        kind: "large_transaction",
        severity: "high",
        message: `Large transaction ${txn.amount} ${txn.currency}`,
        relatedRecordType: "bank_transaction",
        relatedRecordId: txn.id,
      })
    );
  }

  if (txn.externalId) {
    const dup = listTransactions(txn.organizationId).find(
      (t) =>
        t.id !== txn.id &&
        t.externalId === txn.externalId &&
        t.bankAccountId === txn.bankAccountId
    );
    if (dup) {
      raised.push(
        raiseBankingException({
          organizationId: txn.organizationId,
          kind: "duplicate",
          severity: "high",
          message: `Duplicate external id ${txn.externalId}`,
          relatedRecordType: "bank_transaction",
          relatedRecordId: txn.id,
        })
      );
    }
  }

  return Object.freeze(raised);
}

export function closeException(input: {
  organizationId: string;
  exceptionId: string;
}): BankingException | { error: string } {
  const existing = listExceptions(input.organizationId).find(
    (e) => e.id === input.exceptionId
  );
  if (!existing) return { error: "Exception not found." };
  return upsertException({ ...existing, open: false });
}

export { listExceptions };
