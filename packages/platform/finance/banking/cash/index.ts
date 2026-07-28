import { listBanks, upsertBank } from "../../store";
import { listTransactions } from "../store";
import type { CashPosition } from "../types";
import { maskAccountNumber } from "../security";

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

export function adjustCashForTransfer(input: {
  organizationId: string;
  fromBankAccountId: string;
  toBankAccountId: string;
  amount: number;
}): { ok: true } | { error: string } {
  const banks = listBanks(input.organizationId);
  const from = banks.find((b) => b.id === input.fromBankAccountId);
  const to = banks.find((b) => b.id === input.toBankAccountId);
  if (!from || !to) return { error: "Accounts not found." };
  const fromBal = from.currentBalance ?? 0;
  if (fromBal < input.amount) {
    return { error: "Insufficient available balance for transfer." };
  }
  upsertBank({
    ...from,
    currentBalance: fromBal - input.amount,
    availableBalance: (from.availableBalance ?? fromBal) - input.amount,
  });
  upsertBank({
    ...to,
    currentBalance: (to.currentBalance ?? 0) + input.amount,
    availableBalance: (to.availableBalance ?? to.currentBalance ?? 0) + input.amount,
  });
  return { ok: true };
}

export function cashPosition(organizationId: string): CashPosition {
  const accounts = listBanks(organizationId).filter(
    (b) => b.active && CASH_LIKE.has(b.kind)
  );
  const txns = listTransactions(organizationId);
  const pendingByAccount = new Map<string, number>();
  for (const t of txns) {
    if (t.status !== "pending") continue;
    const signed = t.direction === "in" ? t.amount : -t.amount;
    pendingByAccount.set(
      t.bankAccountId,
      (pendingByAccount.get(t.bankAccountId) ?? 0) + signed
    );
  }

  const byAccount = accounts.map((a) => {
    const current = a.currentBalance ?? 0;
    const available = a.availableBalance ?? current;
    const restricted =
      a.restricted === true ||
      a.kind === "restricted_cash" ||
      a.kind === "escrow" ||
      a.kind === "trust"
        ? current
        : 0;
    const pending = pendingByAccount.get(a.id) ?? 0;
    return Object.freeze({
      bankAccountId: a.id,
      name: a.name,
      kind: a.kind,
      entityId: a.entityId,
      departmentId: a.departmentId ?? null,
      programId: a.programId ?? null,
      current,
      available: a.restricted ? 0 : available,
      restricted,
      pending,
      currency: a.currency,
      masked: maskAccountNumber(a.mask),
    });
  });

  const consolidated = {
    current: byAccount.reduce((s, a) => s + a.current, 0),
    available: byAccount.reduce((s, a) => s + a.available, 0),
    restricted: byAccount.reduce((s, a) => s + a.restricted, 0),
    pending: byAccount.reduce((s, a) => s + a.pending, 0),
    currency: (byAccount[0]?.currency ?? "USD") as CashPosition["consolidated"]["currency"],
  };

  const entityMap = new Map<
    string | null,
    { current: number; available: number; restricted: number }
  >();
  for (const a of byAccount) {
    const key = a.entityId;
    const prev = entityMap.get(key) ?? {
      current: 0,
      available: 0,
      restricted: 0,
    };
    entityMap.set(key, {
      current: prev.current + a.current,
      available: prev.available + a.available,
      restricted: prev.restricted + a.restricted,
    });
  }

  return Object.freeze({
    organizationId,
    generatedAt: new Date().toISOString(),
    consolidated: Object.freeze(consolidated),
    byEntity: Object.freeze(
      [...entityMap.entries()].map(([entityId, v]) =>
        Object.freeze({ entityId, ...v })
      )
    ),
    byAccount: Object.freeze(byAccount),
    forecastingHookReady: true as const,
  });
}

/** Cash concentration: move surplus to a concentration account (request-level). */
export function planCashConcentration(input: {
  organizationId: string;
  concentrationAccountId: string;
  minimumRetain?: number;
}): readonly {
  fromBankAccountId: string;
  amount: number;
}[] {
  const min = input.minimumRetain ?? 0;
  const position = cashPosition(input.organizationId);
  return Object.freeze(
    position.byAccount
      .filter(
        (a) =>
          a.bankAccountId !== input.concentrationAccountId &&
          !a.restricted &&
          a.available > min
      )
      .map((a) =>
        Object.freeze({
          fromBankAccountId: a.bankAccountId,
          amount: a.available - min,
        })
      )
  );
}
