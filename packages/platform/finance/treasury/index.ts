/**
 * Treasury — cash accounts, transfers, balances.
 * Future cash forecasting hooks only (no forecasting engine).
 */

import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import { listBanks, listTransfers, upsertTransfer } from "../store";
import type { TreasuryTransfer } from "../types";

export function transferCash(input: {
  organizationId: string;
  userId: string;
  fromBankAccountId: string;
  toBankAccountId: string;
  amount: number;
  currency?: string;
  memo?: string | null;
}): TreasuryTransfer | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const banks = listBanks(input.organizationId);
  if (
    !banks.some((b) => b.id === input.fromBankAccountId) ||
    !banks.some((b) => b.id === input.toBankAccountId)
  ) {
    return { error: "Both bank accounts must exist." };
  }
  if (input.amount <= 0) return { error: "Transfer amount must be positive." };

  const transfer = upsertTransfer({
    id: `xfer:${randomUUID()}`,
    organizationId: input.organizationId,
    fromBankAccountId: input.fromBankAccountId,
    toBankAccountId: input.toBankAccountId,
    amount: input.amount,
    currency: input.currency ?? "USD",
    transferredAt: new Date().toISOString(),
    memo: input.memo ?? null,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "treasury.transfer",
    recordType: "transfer",
    recordId: transfer.id,
    userId: input.userId,
    newValue: transfer,
  });
  return transfer;
}

const CASH_LIKE = new Set([
  "bank",
  "checking",
  "savings",
  "money_market",
  "cash",
  "petty_cash",
  "escrow",
  "trust",
  "restricted_cash",
]);

export function cashBalances(organizationId: string): readonly {
  readonly bankAccountId: string;
  readonly name: string;
  readonly kind: string;
  readonly currency: string;
  /** Operational balance — recon/forecast later. */
  readonly balanceHint: number;
  readonly forecastingHookReady: true;
}[] {
  return Object.freeze(
    listBanks(organizationId)
      .filter((b) => b.active && CASH_LIKE.has(b.kind))
      .map((b) =>
        Object.freeze({
          bankAccountId: b.id,
          name: b.name,
          kind: b.kind,
          currency: b.currency,
          balanceHint: b.currentBalance ?? 0,
          forecastingHookReady: true as const,
        })
      )
  );
}

export { listTransfers };
