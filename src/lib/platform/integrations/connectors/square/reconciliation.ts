/**
 * Cross-system reconciliation: Square (commerce/payments SoR) ↔ QuickBooks (GL SoR).
 * Composition only — does not modify intelligence packages or Integration Platform architecture.
 */

import { quickbooksStore, type QuickBooksStoreSnapshot } from "@/lib/platform/integrations/connectors/quickbooks/store";
import { squareStore, type SquareStoreSnapshot } from "./store";

export type ReconciliationKind =
  | "deposit_mismatch"
  | "payment_vs_invoice"
  | "refund_vs_credit_memo"
  | "revenue_timing"
  | "missing_posting"
  | "duplicate_transaction";

export type ReconciliationSeverity = "info" | "warning" | "critical";

export type ReconciliationDiscrepancy = {
  id: string;
  kind: ReconciliationKind;
  severity: ReconciliationSeverity;
  title: string;
  detail: string;
  squareAmountDollars: number | null;
  quickbooksAmountDollars: number | null;
  differenceDollars: number | null;
};

export type SquareQuickBooksReconciliation = {
  organizationId: string;
  comparedAt: string;
  bothConnected: boolean;
  squareSyncedAt: string | null;
  quickbooksSyncedAt: string | null;
  discrepancies: ReconciliationDiscrepancy[];
  summaryBullets: string[];
  riskPressure: number;
};

function dollars(n: number): number {
  return Math.round(n * 100) / 100;
}

function centsToDollars(cents: unknown): number {
  return dollars(Number(cents ?? 0) / 100);
}

function qbDollars(v: unknown): number {
  return dollars(Number(v ?? 0));
}

function sumSquareCents(
  rows: SquareStoreSnapshot["records"] | undefined,
  field = "amountCents"
): number {
  return (rows ?? []).reduce((s, r) => s + Number(r.attributes[field] ?? 0), 0);
}

function sumQb(
  rows: QuickBooksStoreSnapshot["records"] | undefined,
  field = "totalAmt"
): number {
  return (rows ?? []).reduce((s, r) => s + Number(r.attributes[field] ?? 0), 0);
}

/**
 * Compare Square and QuickBooks caches for an organization when both have data.
 */
export function reconcileSquareQuickBooks(
  organizationId: string,
  options?: {
    square?: SquareStoreSnapshot | null;
    quickbooks?: QuickBooksStoreSnapshot | null;
  }
): SquareQuickBooksReconciliation {
  const square = options?.square ?? squareStore.get(organizationId);
  const qb = options?.quickbooks ?? quickbooksStore.get(organizationId);
  const comparedAt = new Date().toISOString();
  const bothConnected = Boolean(square?.records.length && qb?.records.length);

  if (!bothConnected || !square || !qb) {
    return {
      organizationId,
      comparedAt,
      bothConnected: false,
      squareSyncedAt: square?.syncedAt ?? null,
      quickbooksSyncedAt: qb?.syncedAt ?? null,
      discrepancies: [],
      summaryBullets: [],
      riskPressure: 0,
    };
  }

  const discrepancies: ReconciliationDiscrepancy[] = [];

  const squareDepositsCompleted = (square.byType.deposit ?? [])
    .filter((d) => d.attributes.status === "COMPLETED")
    .reduce((s, d) => s + centsToDollars(d.attributes.amountCents), 0);
  const qbDeposits = sumQb(qb.byType.deposit);
  const depositDiff = dollars(squareDepositsCompleted - qbDeposits);
  if (Math.abs(depositDiff) >= 0.01) {
    discrepancies.push({
      id: "sq-qb-deposit",
      kind: "deposit_mismatch",
      severity: Math.abs(depositDiff) >= 500 ? "critical" : "warning",
      title: "Square deposits vs QuickBooks deposits",
      detail: `Square completed deposits $${squareDepositsCompleted.toLocaleString()} vs QuickBooks $${qbDeposits.toLocaleString()} (Δ $${depositDiff.toLocaleString()}).`,
      squareAmountDollars: squareDepositsCompleted,
      quickbooksAmountDollars: qbDeposits,
      differenceDollars: depositDiff,
    });
  }

  const squarePaymentVolume = centsToDollars(sumSquareCents(square.byType.payment));
  const qbInvoices = sumQb(qb.byType.invoice);
  const qbPayments = sumQb(qb.byType.payment);
  const invoicePaymentGap = dollars(squarePaymentVolume - qbPayments);
  if (Math.abs(invoicePaymentGap) >= 1) {
    discrepancies.push({
      id: "sq-qb-payments",
      kind: "payment_vs_invoice",
      severity: Math.abs(invoicePaymentGap) >= 1000 ? "warning" : "info",
      title: "Square payments vs QuickBooks payment receipts",
      detail: `Square POS volume $${squarePaymentVolume.toLocaleString()} vs QB receipts $${qbPayments.toLocaleString()} (invoices billed $${qbInvoices.toLocaleString()}).`,
      squareAmountDollars: squarePaymentVolume,
      quickbooksAmountDollars: qbPayments,
      differenceDollars: invoicePaymentGap,
    });
  }

  const squareRefunds = centsToDollars(sumSquareCents(square.byType.refund));
  const qbCreditMemos = sumQb(qb.byType.credit_memo);
  const refundDiff = dollars(squareRefunds - qbCreditMemos);
  if (Math.abs(refundDiff) >= 0.01) {
    discrepancies.push({
      id: "sq-qb-refunds",
      kind: "refund_vs_credit_memo",
      severity: Math.abs(refundDiff) >= 100 ? "warning" : "info",
      title: "Square refunds vs QuickBooks credit memos",
      detail: `Square refunds $${squareRefunds.toLocaleString()} vs QB credit memos $${qbCreditMemos.toLocaleString()} (Δ $${refundDiff.toLocaleString()}).`,
      squareAmountDollars: squareRefunds,
      quickbooksAmountDollars: qbCreditMemos,
      differenceDollars: refundDiff,
    });
  }

  const squareLatestPayment = (square.byType.payment ?? [])
    .map((p) => String(p.attributes.createdAt ?? p.syncedAt))
    .sort()
    .at(-1);
  const qbLatestPayment = (qb.byType.payment ?? [])
    .map((p) => String(p.attributes.txnDate ?? p.syncedAt))
    .sort()
    .at(-1);
  if (squareLatestPayment && qbLatestPayment) {
    const sqDay = squareLatestPayment.slice(0, 10);
    const qbDay = qbLatestPayment.slice(0, 10);
    if (sqDay !== qbDay) {
      discrepancies.push({
        id: "sq-qb-timing",
        kind: "revenue_timing",
        severity: "info",
        title: "Revenue timing difference",
        detail: `Latest Square payment day ${sqDay} vs latest QuickBooks payment day ${qbDay} — posting lag may affect period close.`,
        squareAmountDollars: null,
        quickbooksAmountDollars: null,
        differenceDollars: null,
      });
    }
  }

  const sqCompletedDepositIds = (square.byType.deposit ?? [])
    .filter((d) => d.attributes.status === "COMPLETED")
    .map((d) => d.externalId);
  if (sqCompletedDepositIds.length > 0 && (qb.byType.deposit ?? []).length === 0) {
    discrepancies.push({
      id: "sq-qb-missing-deposit",
      kind: "missing_posting",
      severity: "critical",
      title: "Missing QuickBooks deposit posting",
      detail: `Square has ${sqCompletedDepositIds.length} completed deposit(s) with no QuickBooks deposit records.`,
      squareAmountDollars: squareDepositsCompleted,
      quickbooksAmountDollars: 0,
      differenceDollars: squareDepositsCompleted,
    });
  }

  const qbPaymentAmounts = (qb.byType.payment ?? []).map((p) => qbDollars(p.attributes.totalAmt));
  const duplicates = qbPaymentAmounts.filter(
    (amt, idx) => qbPaymentAmounts.indexOf(amt) !== idx && amt > 0
  );
  if (duplicates.length > 0) {
    discrepancies.push({
      id: "sq-qb-dup-qb",
      kind: "duplicate_transaction",
      severity: "warning",
      title: "Duplicate QuickBooks payment amounts",
      detail: `${duplicates.length} QuickBooks payment(s) share identical amounts — review for duplicate postings.`,
      squareAmountDollars: null,
      quickbooksAmountDollars: duplicates[0] ?? null,
      differenceDollars: null,
    });
  }

  const summaryBullets = discrepancies.map((d) => d.detail);
  const riskPressure = Math.min(
    100,
    discrepancies.reduce((sum, d) => {
      if (d.severity === "critical") return sum + 28;
      if (d.severity === "warning") return sum + 14;
      return sum + 6;
    }, 0)
  );

  return {
    organizationId,
    comparedAt,
    bothConnected: true,
    squareSyncedAt: square.syncedAt,
    quickbooksSyncedAt: qb.syncedAt,
    discrepancies,
    summaryBullets,
    riskPressure,
  };
}
