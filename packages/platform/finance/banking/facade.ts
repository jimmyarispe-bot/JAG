/**
 * P-008 banking facade — kept for FinanceEngine compatibility.
 * P-009 depth lives in TreasuryEngine + banking/* modules.
 */

import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import { listBanks, listImports, upsertBank, upsertImport } from "../store";
import type {
  BankAccount,
  BankingAccountKind,
  BankStatementImport,
} from "../types";
import { maskAccountNumber } from "./security";

export function createBankAccount(input: {
  organizationId: string;
  userId: string;
  name: string;
  kind: BankingAccountKind;
  entityId?: string | null;
  currency?: string;
  mask?: string | null;
  ledgerAccountId?: string | null;
  /** Plaid-ready placeholder */
  plaidItemId?: string | null;
}): BankAccount | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const account = upsertBank({
    id: `bank:${randomUUID()}`,
    organizationId: input.organizationId,
    entityId: input.entityId ?? null,
    name: input.name,
    kind: input.kind,
    currency: input.currency ?? "USD",
    mask: maskAccountNumber(input.mask),
    plaidItemId: input.plaidItemId ?? null,
    openBankingReady: true,
    ledgerAccountId: input.ledgerAccountId ?? null,
    active: true,
    currentBalance: 0,
    availableBalance: 0,
    restricted: input.kind === "restricted_cash",
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "banking.account_create",
    recordType: "bank_account",
    recordId: account.id,
    userId: input.userId,
    newValue: account,
  });
  return account;
}

export function importBankStatement(input: {
  organizationId: string;
  userId: string;
  bankAccountId: string;
  format: BankStatementImport["format"];
  fileName: string;
  rowCount?: number;
}): BankStatementImport | { error: string } {
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
  const imp = upsertImport({
    id: `bimp:${randomUUID()}`,
    organizationId: input.organizationId,
    bankAccountId: input.bankAccountId,
    format: input.format,
    fileName: input.fileName,
    rowCount: metadataOnly ? 0 : (input.rowCount ?? 0),
    metadataOnly,
    importedAt: new Date().toISOString(),
    importedBy: input.userId,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "banking.statement_import",
    recordType: "bank_import",
    recordId: imp.id,
    userId: input.userId,
    newValue: imp,
  });
  return imp;
}

/** Plaid-ready interface stub — adapters consume in later connectivity sprint. */
export function describePlaidInterface(): {
  readonly ready: true;
  readonly connects: readonly string[];
  readonly note: string;
} {
  return {
    ready: true,
    connects: Object.freeze(["link_token", "item", "accounts", "transactions"]),
    note: "Plaid/Open Banking adapters consume this interface; Open Banking remains future-ready.",
  };
}

export { listBanks, listImports };
