import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../../audit";
import { requireFinancePermission } from "../../permissions";
import { listBanks, upsertImport } from "../../store";
import {
  getStatementBatch,
  listStatementBatches,
  listTransactions,
  upsertStatementBatch,
  upsertTransaction,
} from "../store";
import type { StatementImportBatch } from "../types";
import { notifyBanking } from "../notifications";
import { raiseBankingException } from "../exceptions";

export type PreviewRow = {
  externalId: string;
  amount: number;
  description: string;
  date: string;
  direction?: "in" | "out";
};

export function previewStatementImport(input: {
  organizationId: string;
  userId: string;
  bankAccountId: string;
  format: StatementImportBatch["format"];
  fileName: string;
  rows?: readonly PreviewRow[];
}): StatementImportBatch | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const bank = listBanks(input.organizationId).find(
    (b) => b.id === input.bankAccountId
  );
  if (!bank) return { error: "Bank account not found." };

  const metadataOnly = input.format === "pdf";
  const rows = metadataOnly ? [] : [...(input.rows ?? [])];
  const existingExt = new Set(
    listTransactions(input.organizationId)
      .filter((t) => t.bankAccountId === input.bankAccountId && t.externalId)
      .map((t) => t.externalId as string)
  );
  let duplicateCount = 0;
  for (const r of rows) {
    if (existingExt.has(r.externalId)) duplicateCount += 1;
  }

  const batch = upsertStatementBatch({
    id: `sbatch:${randomUUID()}`,
    organizationId: input.organizationId,
    bankAccountId: input.bankAccountId,
    format: input.format,
    fileName: input.fileName,
    status: "preview",
    rowCount: rows.length,
    duplicateCount,
    metadataOnly,
    ocrHookReady: input.format === "pdf",
    previewRows: Object.freeze(
      rows.map((r) =>
        Object.freeze({
          externalId: r.externalId,
          amount: r.amount,
          description: r.description,
          date: r.date,
        })
      )
    ),
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
    committedAt: null,
    rolledBackAt: null,
  });
  return batch;
}

export function validateStatementImport(input: {
  organizationId: string;
  userId: string;
  batchId: string;
}): StatementImportBatch | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const batch = getStatementBatch(input.batchId);
  if (!batch || batch.organizationId !== input.organizationId) {
    return { error: "Import batch not found." };
  }
  if (batch.status !== "preview") {
    return { error: "Only preview batches can be validated." };
  }
  if (!batch.metadataOnly && batch.rowCount === 0) {
    notifyBanking({
      organizationId: input.organizationId,
      kind: "failed_import",
      message: `Import ${batch.fileName} has no rows`,
    });
    return upsertStatementBatch({ ...batch, status: "failed" });
  }
  return upsertStatementBatch({ ...batch, status: "validated" });
}

export function commitStatementImport(input: {
  organizationId: string;
  userId: string;
  batchId: string;
}): StatementImportBatch | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const batch = getStatementBatch(input.batchId);
  if (!batch || batch.organizationId !== input.organizationId) {
    return { error: "Import batch not found." };
  }
  if (batch.status !== "validated" && batch.status !== "preview") {
    return { error: "Batch must be preview or validated to commit." };
  }

  const bank = listBanks(input.organizationId).find(
    (b) => b.id === batch.bankAccountId
  );
  if (!bank) return { error: "Bank account not found." };

  const existingExt = new Set(
    listTransactions(input.organizationId)
      .filter((t) => t.bankAccountId === batch.bankAccountId && t.externalId)
      .map((t) => t.externalId as string)
  );

  if (!batch.metadataOnly) {
    for (const row of batch.previewRows) {
      if (existingExt.has(row.externalId)) {
        raiseBankingException({
          organizationId: input.organizationId,
          kind: "duplicate",
          severity: "medium",
          message: `Skipped duplicate ${row.externalId}`,
          relatedRecordType: "statement_batch",
          relatedRecordId: batch.id,
        });
        continue;
      }
      upsertTransaction({
        id: `btxn:${randomUUID()}`,
        organizationId: input.organizationId,
        bankAccountId: batch.bankAccountId,
        entityId: bank.entityId,
        status: "imported",
        amount: Math.abs(row.amount),
        currency: bank.currency,
        direction: row.amount < 0 ? "out" : "in",
        postedAt: row.date,
        pendingAt: null,
        description: row.description,
        merchantName: null,
        category: null,
        vendorId: null,
        customerId: null,
        externalId: row.externalId,
        importId: batch.id,
        parentTransactionId: null,
        splitOfId: null,
        linkedRecordType: null,
        linkedRecordId: null,
        createdAt: new Date().toISOString(),
        createdBy: input.userId,
        correctedFromId: null,
      });
    }
  }

  // Keep P-008 import list in sync
  upsertImport({
    id: batch.id,
    organizationId: input.organizationId,
    bankAccountId: batch.bankAccountId,
    format: batch.format,
    fileName: batch.fileName,
    rowCount: batch.rowCount,
    metadataOnly: batch.metadataOnly,
    importedAt: new Date().toISOString(),
    importedBy: input.userId,
  });

  const committed = upsertStatementBatch({
    ...batch,
    status: "committed",
    committedAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "banking.statement_commit",
    recordType: "statement_batch",
    recordId: committed.id,
    userId: input.userId,
    newValue: committed,
  });
  return committed;
}

export function rollbackStatementImport(input: {
  organizationId: string;
  userId: string;
  batchId: string;
}): StatementImportBatch | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "financial_administrator",
  });
  if ("error" in gate) return gate;
  const batch = getStatementBatch(input.batchId);
  if (!batch || batch.organizationId !== input.organizationId) {
    return { error: "Import batch not found." };
  }
  if (batch.status !== "committed") {
    return { error: "Only committed imports can be rolled back." };
  }
  for (const txn of listTransactions(input.organizationId)) {
    if (txn.importId === batch.id) {
      upsertTransaction({ ...txn, status: "voided" });
    }
  }
  const rolled = upsertStatementBatch({
    ...batch,
    status: "rolled_back",
    rolledBackAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "banking.statement_rollback",
    recordType: "statement_batch",
    recordId: rolled.id,
    userId: input.userId,
    newValue: rolled,
  });
  return rolled;
}

export { listStatementBatches, getStatementBatch };
