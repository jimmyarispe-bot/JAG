/**
 * Enterprise Financial Intelligence Engine — Payments.
 *
 * ACH, check, wire, card, Square (port abstraction), allocation, refunds.
 * Immutable: payments are reversed, not deleted.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type { FinanceAccountsReceivable } from "@/lib/platform/finance/ar";
import type { FinanceGeneralLedger } from "@/lib/platform/finance/ledger";
import type {
  FinanceDimensionalContext,
  FinanceMetadata,
  FinancePayment,
  FinancePaymentAllocation,
  FinancePaymentDirection,
  FinancePaymentMethod,
  FinancePaymentStatus,
} from "@/lib/platform/finance/types";

// ---------------------------------------------------------------------------
// Square port abstraction
// ---------------------------------------------------------------------------

export interface SquarePort {
  processPayment(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>
  ): Promise<{ id: string; status: string }>;
}

export class InMemorySquarePort implements SquarePort {
  async processPayment(
    _amount: number,
    _currency: string,
    _metadata: Record<string, unknown>
  ): Promise<{ id: string; status: string }> {
    return { id: `sq-${Date.now()}`, status: "completed" };
  }
}

// ---------------------------------------------------------------------------
// Payments service
// ---------------------------------------------------------------------------

export interface RecordPaymentInput {
  method: FinancePaymentMethod;
  direction: FinancePaymentDirection;
  amount: number;
  currency?: string;
  memo: string;
  bankAccountId?: string | null;
  referenceNumber?: string | null;
  dimensions: FinanceDimensionalContext;
  allocations?: FinancePaymentAllocation[];
  metadata?: FinanceMetadata;
}

export interface FinancePaymentsDependencies {
  gl?: FinanceGeneralLedger;
  ar?: FinanceAccountsReceivable;
  squarePort?: SquarePort;
  cashAccountCode?: string;
  arAccountCode?: string;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class FinancePayments {
  private readonly payments = new Map<string, FinancePayment>();
  private readonly gl: FinanceGeneralLedger | null;
  private readonly ar: FinanceAccountsReceivable | null;
  private readonly squarePort: SquarePort;
  private readonly cashAccountCode: string;
  private readonly arAccountCode: string;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private paymentSequence = 0;

  constructor(deps?: FinancePaymentsDependencies) {
    this.gl = deps?.gl ?? null;
    this.ar = deps?.ar ?? null;
    this.squarePort = deps?.squarePort ?? new InMemorySquarePort();
    this.cashAccountCode = deps?.cashAccountCode ?? "1000";
    this.arAccountCode = deps?.arAccountCode ?? "1100";
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  recordPayment(input: RecordPaymentInput): FinancePayment {
    this.paymentSequence += 1;
    const id = this.createId("pmt");
    const paymentNumber = `PMT-${String(this.paymentSequence).padStart(6, "0")}`;
    const currency = input.currency ?? "USD";

    const payment: FinancePayment = {
      id,
      paymentNumber,
      timestamp: this.now().toISOString(),
      dimensions: input.dimensions,
      amount: { amount: input.amount, currency },
      memo: input.memo,
      reversedById: null,
      reversesId: null,
      method: input.method,
      direction: input.direction,
      status: "completed",
      bankAccountId: input.bankAccountId ?? null,
      referenceNumber: input.referenceNumber ?? null,
      allocations: input.allocations ?? [],
      currency,
      refundedAmount: 0,
      metadata: input.metadata,
    };
    this.payments.set(id, payment);

    // Apply allocations to AR invoices if AR injected
    if (this.ar && input.allocations) {
      for (const alloc of input.allocations) {
        if (alloc.invoiceId) {
          this.ar.recordPayment(alloc.invoiceId, alloc.allocatedAmount, id);
        }
      }
    }

    // Post cash/AR journal if GL injected and it's an inbound payment
    if (this.gl && input.direction === "inbound") {
      const coa = this.gl.chartOfAccounts;
      const cashAccount = coa.findByCode(this.cashAccountCode);
      const arAccount = coa.findByCode(this.arAccountCode);
      if (cashAccount && arAccount) {
        this.gl.postJournal({
          memo: `Payment ${paymentNumber} — ${input.memo}`,
          currency,
          dimensions: input.dimensions,
          postings: [
            { accountId: cashAccount.id, debit: input.amount, credit: 0 },
            { accountId: arAccount.id, debit: 0, credit: input.amount },
          ],
        });
      }
    }

    return payment;
  }

  /**
   * Refund a payment (partial or full).
   * Immutable — creates a new outbound payment linked to the original.
   */
  refund(
    paymentId: string,
    amount: number,
    memo: string,
    dimensions: FinanceDimensionalContext
  ): FinancePayment {
    const original = this.payments.get(paymentId);
    if (!original) throw new Error(`Payment not found: ${paymentId}`);
    if (original.status === "refunded" || original.status === "voided") {
      throw new Error(`Payment ${paymentId} cannot be refunded`);
    }

    this.paymentSequence += 1;
    const refundId = this.createId("pmt");
    const refundPaymentNumber = `PMT-${String(this.paymentSequence).padStart(6, "0")}-REF`;

    const refund: FinancePayment = {
      id: refundId,
      paymentNumber: refundPaymentNumber,
      timestamp: this.now().toISOString(),
      dimensions,
      amount: { amount: amount, currency: original.currency },
      memo,
      reversedById: null,
      reversesId: paymentId,
      method: original.method,
      direction: "outbound",
      status: "completed",
      bankAccountId: original.bankAccountId,
      referenceNumber: null,
      allocations: [],
      currency: original.currency,
      refundedAmount: 0,
    };
    this.payments.set(refundId, refund);

    // Mark original as having refunded amount
    const updatedOriginal: FinancePayment = {
      ...original,
      refundedAmount: original.refundedAmount + amount,
      status:
        original.refundedAmount + amount >= original.amount.amount
          ? "refunded"
          : original.status,
      reversedById: refundId,
    };
    this.payments.set(paymentId, updatedOriginal);

    return refund;
  }

  getPayment(id: string): FinancePayment | undefined {
    return this.payments.get(id);
  }

  listPayments(): FinancePayment[] {
    return [...this.payments.values()].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
  }

  listByDirection(direction: FinancePaymentDirection): FinancePayment[] {
    return this.listPayments().filter((p) => p.direction === direction);
  }

  listByStatus(status: FinancePaymentStatus): FinancePayment[] {
    return this.listPayments().filter((p) => p.status === status);
  }

  /** Process a Square payment (async via port). */
  async processSquarePayment(
    input: RecordPaymentInput & { currency: string }
  ): Promise<FinancePayment> {
    const squareResult = await this.squarePort.processPayment(
      input.amount,
      input.currency,
      { memo: input.memo }
    );
    return this.recordPayment({
      ...input,
      method: "square",
      referenceNumber: squareResult.id,
      metadata: { ...input.metadata, squareId: squareResult.id },
    });
  }
}

export function createFinancePayments(
  deps?: FinancePaymentsDependencies
): FinancePayments {
  return new FinancePayments(deps);
}
