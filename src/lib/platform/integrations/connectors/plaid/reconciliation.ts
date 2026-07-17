/**
 * Cross-system cash reconciliation: Plaid (bank) ↔ Square (commerce) ↔ QuickBooks (GL).
 * Composition only — no intelligence package or Integration Platform architecture changes.
 */

import { quickbooksStore, type QuickBooksStoreSnapshot } from "@/lib/platform/integrations/connectors/quickbooks/store";
import { squareStore, type SquareStoreSnapshot } from "@/lib/platform/integrations/connectors/square/store";
import { plaidStore, type PlaidStoreSnapshot } from "./store";

export type CashReconciliationKind =
  | "square_deposit_to_bank"
  | "quickbooks_cash_to_bank"
  | "outstanding_deposit"
  | "duplicate_deposit"
  | "missing_deposit"
  | "ach_timing"
  | "returned_payment"
  | "bank_fee"
  | "merchant_deposit";

export type CashReconciliationSeverity = "info" | "warning" | "critical";

export type CashReconciliationDiscrepancy = {
  id: string;
  kind: CashReconciliationKind;
  severity: CashReconciliationSeverity;
  title: string;
  detail: string;
  plaidAmountDollars: number | null;
  squareAmountDollars: number | null;
  quickbooksAmountDollars: number | null;
  differenceDollars: number | null;
};

export type PlaidCashReconciliation = {
  organizationId: string;
  comparedAt: string;
  systemsConnected: {
    plaid: boolean;
    square: boolean;
    quickbooks: boolean;
  };
  multiSystem: boolean;
  discrepancies: CashReconciliationDiscrepancy[];
  summaryBullets: string[];
  riskPressure: number;
};

function dollars(n: number): number {
  return Math.round(n * 100) / 100;
}

function centsToDollars(cents: unknown): number {
  return dollars(Number(cents ?? 0) / 100);
}

function num(v: unknown): number {
  return Number(v ?? 0);
}

/**
 * Reconcile bank cash against Square merchant deposits and QuickBooks cash accounts
 * when two or more of the three systems have synced data (prefer all three).
 */
export function reconcilePlaidCash(
  organizationId: string,
  options?: {
    plaid?: PlaidStoreSnapshot | null;
    square?: SquareStoreSnapshot | null;
    quickbooks?: QuickBooksStoreSnapshot | null;
  }
): PlaidCashReconciliation {
  const plaid = options?.plaid ?? plaidStore.get(organizationId);
  const square = options?.square ?? squareStore.get(organizationId);
  const qb = options?.quickbooks ?? quickbooksStore.get(organizationId);
  const comparedAt = new Date().toISOString();

  const systemsConnected = {
    plaid: Boolean(plaid?.records.length),
    square: Boolean(square?.records.length),
    quickbooks: Boolean(qb?.records.length),
  };
  const connectedCount = Object.values(systemsConnected).filter(Boolean).length;
  const multiSystem = systemsConnected.plaid && connectedCount >= 2;

  if (!multiSystem || !plaid) {
    return {
      organizationId,
      comparedAt,
      systemsConnected,
      multiSystem: false,
      discrepancies: [],
      summaryBullets: [],
      riskPressure: 0,
    };
  }

  const discrepancies: CashReconciliationDiscrepancy[] = [];
  const txns = plaid.byType.transaction ?? [];
  const balances = plaid.byType.balance ?? [];
  const accounts = plaid.byType.account ?? [];

  const depositoryCurrent = balances
    .filter((b) => {
      const acct = accounts.find((a) => a.externalId === b.accountId);
      return acct?.attributes.type === "depository" && acct?.attributes.subtype === "checking";
    })
    .reduce((s, b) => s + Math.max(0, num(b.attributes.current)), 0);
  const bankCurrent =
    depositoryCurrent ||
    balances.reduce((s, b) => s + Math.max(0, num(b.attributes.current)), 0);
  const merchantDeposits = txns.filter(
    (t) =>
      String(t.attributes.merchantName ?? "").toLowerCase().includes("square") ||
      String(t.attributes.name ?? "").toLowerCase().includes("square")
  );
  const merchantDepositTotal = merchantDeposits
    .filter((t) => !t.attributes.pending && num(t.attributes.amount) > 0)
    .reduce((s, t) => s + num(t.attributes.amount), 0);

  if (systemsConnected.square && square) {
    const squareCompleted = (square.byType.deposit ?? [])
      .filter((d) => d.attributes.status === "COMPLETED")
      .reduce((s, d) => s + centsToDollars(d.attributes.amountCents), 0);
    const squarePending = (square.byType.deposit ?? [])
      .filter((d) => d.attributes.status === "PENDING")
      .reduce((s, d) => s + centsToDollars(d.attributes.amountCents), 0);
    const gap = dollars(squareCompleted - merchantDepositTotal);

    if (Math.abs(gap) >= 0.01) {
      discrepancies.push({
        id: "plaid-sq-merchant",
        kind: "square_deposit_to_bank",
        severity: Math.abs(gap) >= 500 ? "critical" : "warning",
        title: "Square deposits vs bank merchant deposits",
        detail: `Square completed $${squareCompleted.toLocaleString()} vs Plaid Square deposits $${merchantDepositTotal.toLocaleString()} (Δ $${gap.toLocaleString()}).`,
        plaidAmountDollars: merchantDepositTotal,
        squareAmountDollars: squareCompleted,
        quickbooksAmountDollars: null,
        differenceDollars: gap,
      });
      if (gap > 0) {
        discrepancies.push({
          id: "plaid-sq-missing",
          kind: "missing_deposit",
          severity: "warning",
          title: "Missing Square deposit in bank",
          detail: `$${gap.toLocaleString()} of Square completed deposits not yet matched in bank activity.`,
          plaidAmountDollars: merchantDepositTotal,
          squareAmountDollars: squareCompleted,
          quickbooksAmountDollars: null,
          differenceDollars: gap,
        });
      }
    }

    if (squarePending > 0) {
      discrepancies.push({
        id: "plaid-sq-outstanding",
        kind: "outstanding_deposit",
        severity: "info",
        title: "Outstanding Square deposits",
        detail: `Square pending deposits $${squarePending.toLocaleString()} awaiting bank settlement.`,
        plaidAmountDollars: null,
        squareAmountDollars: squarePending,
        quickbooksAmountDollars: null,
        differenceDollars: null,
      });
    }

    discrepancies.push({
      id: "plaid-sq-merchant-label",
      kind: "merchant_deposit",
      severity: "info",
      title: "Merchant deposit activity",
      detail: `${merchantDeposits.length} Square-related bank transaction(s) totaling $${merchantDepositTotal.toLocaleString()}.`,
      plaidAmountDollars: merchantDepositTotal,
      squareAmountDollars: squareCompleted,
      quickbooksAmountDollars: null,
      differenceDollars: dollars(squareCompleted - merchantDepositTotal),
    });
  }

  if (systemsConnected.quickbooks && qb) {
    const qbCash = (qb.byType.account ?? [])
      .filter((a) => String(a.attributes.accountType) === "Bank")
      .reduce((s, a) => s + num(a.attributes.balance), 0);
    const cashGap = dollars(qbCash - bankCurrent);
    if (Math.abs(cashGap) >= 0.01) {
      discrepancies.push({
        id: "plaid-qb-cash",
        kind: "quickbooks_cash_to_bank",
        severity: Math.abs(cashGap) >= 500 ? "critical" : "warning",
        title: "QuickBooks cash accounts vs bank balances",
        detail: `QuickBooks Bank $${qbCash.toLocaleString()} vs Plaid current $${bankCurrent.toLocaleString()} (Δ $${cashGap.toLocaleString()}).`,
        plaidAmountDollars: bankCurrent,
        squareAmountDollars: null,
        quickbooksAmountDollars: qbCash,
        differenceDollars: cashGap,
      });
    }
  }

  const depositAmounts = txns
    .filter((t) => num(t.attributes.amount) > 0 && String(t.attributes.category) === "deposit")
    .map((t) => ({
      amount: num(t.attributes.amount),
      date: String(t.attributes.date ?? ""),
      name: String(t.attributes.name ?? ""),
    }));
  const seen = new Map<string, number>();
  for (const d of depositAmounts) {
    const key = `${d.amount}|${d.date}|${d.name}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [key, count] of seen) {
    if (count > 1) {
      const [amount] = key.split("|");
      discrepancies.push({
        id: `plaid-dup-${amount}`,
        kind: "duplicate_deposit",
        severity: "warning",
        title: "Duplicate bank deposits",
        detail: `${count} deposits of $${Number(amount).toLocaleString()} on the same day — review for duplicate settlement.`,
        plaidAmountDollars: Number(amount),
        squareAmountDollars: null,
        quickbooksAmountDollars: null,
        differenceDollars: null,
      });
    }
  }

  const pendingAch = txns.filter(
    (t) => t.attributes.pending && String(t.attributes.channel) === "ach"
  );
  if (pendingAch.length > 0) {
    const pendingAmt = pendingAch.reduce((s, t) => s + num(t.attributes.amount), 0);
    discrepancies.push({
      id: "plaid-ach-timing",
      kind: "ach_timing",
      severity: "info",
      title: "ACH timing / settlement lag",
      detail: `${pendingAch.length} pending ACH item(s) totaling $${pendingAmt.toLocaleString()}.`,
      plaidAmountDollars: pendingAmt,
      squareAmountDollars: null,
      quickbooksAmountDollars: null,
      differenceDollars: null,
    });
  }

  const returned = txns.filter((t) => String(t.attributes.category) === "returned_payment");
  if (returned.length > 0) {
    const returnedAmt = returned.reduce((s, t) => s + Math.abs(num(t.attributes.amount)), 0);
    discrepancies.push({
      id: "plaid-returned",
      kind: "returned_payment",
      severity: "warning",
      title: "Returned payments",
      detail: `${returned.length} returned payment(s) totaling $${returnedAmt.toLocaleString()}.`,
      plaidAmountDollars: returnedAmt,
      squareAmountDollars: null,
      quickbooksAmountDollars: null,
      differenceDollars: null,
    });
  }

  const fees = txns.filter((t) => String(t.attributes.category) === "bank_fee");
  if (fees.length > 0) {
    const feeAmt = fees.reduce((s, t) => s + Math.abs(num(t.attributes.amount)), 0);
    discrepancies.push({
      id: "plaid-fees",
      kind: "bank_fee",
      severity: "info",
      title: "Bank fees",
      detail: `${fees.length} bank fee(s) totaling $${feeAmt.toLocaleString()}.`,
      plaidAmountDollars: feeAmt,
      squareAmountDollars: null,
      quickbooksAmountDollars: null,
      differenceDollars: null,
    });
  }

  const summaryBullets = discrepancies.map((d) => d.detail);
  const riskPressure = Math.min(
    100,
    discrepancies.reduce((sum, d) => {
      if (d.severity === "critical") return sum + 26;
      if (d.severity === "warning") return sum + 12;
      return sum + 5;
    }, 0)
  );

  return {
    organizationId,
    comparedAt,
    systemsConnected,
    multiSystem: true,
    discrepancies,
    summaryBullets,
    riskPressure,
  };
}
