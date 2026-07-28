import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../../audit";
import { requireFinancePermission } from "../../permissions";
import { listBanks, upsertBank } from "../../store";
import type { BankAccount, BankingAccountKind, CurrencyCode } from "../../types";
import { getConnection } from "../store";
import { maskAccountNumber } from "../security";

export const TREASURY_ACCOUNT_KINDS: readonly BankingAccountKind[] =
  Object.freeze([
    "bank",
    "checking",
    "savings",
    "money_market",
    "credit_card",
    "loan",
    "line_of_credit",
    "investment",
    "cash",
    "petty_cash",
    "escrow",
    "trust",
    "restricted_cash",
  ]);

export function createTreasuryBankAccount(input: {
  organizationId: string;
  userId: string;
  name: string;
  kind: BankingAccountKind;
  entityId?: string | null;
  currency?: CurrencyCode;
  mask?: string | null;
  ledgerAccountId?: string | null;
  plaidItemId?: string | null;
  institutionId?: string | null;
  connectionId?: string | null;
  departmentId?: string | null;
  programId?: string | null;
  restricted?: boolean;
  currentBalance?: number;
  availableBalance?: number;
}): BankAccount | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  if (!TREASURY_ACCOUNT_KINDS.includes(input.kind)) {
    return { error: `Unsupported account kind: ${input.kind}` };
  }

  if (input.connectionId) {
    const conn = getConnection(input.connectionId);
    if (!conn || conn.organizationId !== input.organizationId) {
      return { error: "Connection not found." };
    }
  }

  const restricted =
    input.restricted ??
    (input.kind === "restricted_cash" ||
      input.kind === "escrow" ||
      input.kind === "trust");

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
    institutionId: input.institutionId ?? null,
    connectionId: input.connectionId ?? null,
    departmentId: input.departmentId ?? null,
    programId: input.programId ?? null,
    restricted,
    currentBalance: input.currentBalance ?? 0,
    availableBalance: input.availableBalance ?? input.currentBalance ?? 0,
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

export function updateBankAccountBalances(input: {
  organizationId: string;
  userId: string;
  bankAccountId: string;
  currentBalance?: number;
  availableBalance?: number;
}): BankAccount | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const existing = listBanks(input.organizationId).find(
    (b) => b.id === input.bankAccountId
  );
  if (!existing) return { error: "Bank account not found." };
  const updated = upsertBank({
    ...existing,
    currentBalance: input.currentBalance ?? existing.currentBalance ?? 0,
    availableBalance:
      input.availableBalance ??
      input.currentBalance ??
      existing.availableBalance ??
      0,
  });
  return updated;
}

export function listTreasuryAccounts(organizationId: string): readonly BankAccount[] {
  return listBanks(organizationId);
}

export { TREASURY_ACCOUNT_KINDS as ACCOUNT_KINDS };
