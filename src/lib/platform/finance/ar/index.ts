/**
 * Enterprise Financial Intelligence Engine — Accounts Receivable.
 *
 * Invoices, payment plans, recurring billing, collections, aging, write-offs.
 * Immutable: invoices are never deleted — only voided or written off.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type { FinanceGeneralLedger } from "@/lib/platform/finance/ledger";
import type {
  FinanceAgingBucket,
  FinanceDimensionalContext,
  FinanceInvoice,
  FinanceInvoiceItem,
  FinanceInvoiceStatus,
  FinanceMoney,
  FinanceMetadata,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface CreateInvoiceInput {
  customerId: string;
  dueDate: string;
  currency?: string;
  memo: string;
  dimensions: FinanceDimensionalContext;
  isRecurring?: boolean;
  recurringIntervalDays?: number | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    accountId?: string | null;
    dimensions?: FinanceDimensionalContext;
    metadata?: FinanceMetadata;
  }>;
  metadata?: FinanceMetadata;
}

export interface FinanceAccountsReceivableDependencies {
  gl?: FinanceGeneralLedger;
  arAccountCode?: string;
  revenueAccountCode?: string;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class FinanceAccountsReceivable {
  private readonly invoices = new Map<string, FinanceInvoice>();
  private readonly gl: FinanceGeneralLedger | null;
  private readonly arAccountCode: string;
  private readonly revenueAccountCode: string;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private invoiceSequence = 0;

  constructor(deps?: FinanceAccountsReceivableDependencies) {
    this.gl = deps?.gl ?? null;
    this.arAccountCode = deps?.arAccountCode ?? "1100";
    this.revenueAccountCode = deps?.revenueAccountCode ?? "4000";
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  createInvoice(input: CreateInvoiceInput): FinanceInvoice {
    this.invoiceSequence += 1;
    const id = this.createId("inv");
    const invoiceNumber = `INV-${String(this.invoiceSequence).padStart(6, "0")}`;
    const currency = input.currency ?? "USD";
    const timestamp = this.now().toISOString();

    const items: FinanceInvoiceItem[] = input.items.map((item) => {
      const amount = item.quantity * item.unitPrice;
      return {
        id: this.createId("inv-item"),
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency,
        amount,
        accountId: item.accountId ?? null,
        dimensions: item.dimensions ?? input.dimensions,
        metadata: item.metadata,
      };
    });

    const totalAmount = items.reduce((s, i) => s + i.amount, 0);

    const invoice: FinanceInvoice = {
      id,
      invoiceNumber,
      timestamp,
      dimensions: input.dimensions,
      amount: { amount: totalAmount, currency },
      memo: input.memo,
      reversedById: null,
      reversesId: null,
      status: "draft",
      customerId: input.customerId,
      dueDate: input.dueDate,
      items,
      paidAmount: 0,
      currency,
      isRecurring: input.isRecurring ?? false,
      recurringIntervalDays: input.recurringIntervalDays ?? null,
      metadata: input.metadata,
    };

    this.invoices.set(id, invoice);

    // Post AR/Revenue journal if GL injected
    if (this.gl) {
      const coa = this.gl.chartOfAccounts;
      const arAccount = coa.findByCode(this.arAccountCode);
      const revenueAccount = coa.findByCode(this.revenueAccountCode);
      if (arAccount && revenueAccount) {
        this.gl.postJournal({
          memo: `Invoice ${invoiceNumber} — ${input.memo}`,
          currency,
          dimensions: input.dimensions,
          postings: [
            { accountId: arAccount.id, debit: totalAmount, credit: 0 },
            { accountId: revenueAccount.id, debit: 0, credit: totalAmount },
          ],
        });
      }
    }

    return invoice;
  }

  /** Send (move from draft → sent). */
  sendInvoice(invoiceId: string): FinanceInvoice {
    return this.updateStatus(invoiceId, "sent");
  }

  /** Record a payment against an invoice. Updates paidAmount and status. */
  recordPayment(
    invoiceId: string,
    amount: number,
    paymentId: string
  ): FinanceInvoice {
    const inv = this.getInvoiceOrThrow(invoiceId);
    const newPaid = inv.paidAmount + amount;
    const totalDue = inv.amount.amount;
    let status: FinanceInvoiceStatus;
    if (newPaid >= totalDue - 0.005) {
      status = "paid";
    } else if (newPaid > 0) {
      status = "partial";
    } else {
      status = inv.status;
    }

    const updated: FinanceInvoice = {
      ...inv,
      paidAmount: newPaid,
      status,
      metadata: {
        ...inv.metadata,
        lastPaymentId: paymentId,
      },
    };
    this.invoices.set(invoiceId, updated);
    return updated;
  }

  /** Void an invoice (immutable — creates a void record). */
  voidInvoice(invoiceId: string, memo: string): FinanceInvoice {
    const inv = this.getInvoiceOrThrow(invoiceId);
    const updated: FinanceInvoice = {
      ...inv,
      status: "void",
      memo: `${inv.memo} [VOID: ${memo}]`,
    };
    this.invoices.set(invoiceId, updated);
    return updated;
  }

  /** Write off a bad debt (marks as written_off; no deletion). */
  writeOff(
    invoiceId: string,
    memo: string,
    dimensions: FinanceDimensionalContext
  ): FinanceInvoice {
    const inv = this.getInvoiceOrThrow(invoiceId);
    const updated: FinanceInvoice = {
      ...inv,
      status: "written_off",
      memo: `${inv.memo} [WRITE-OFF: ${memo}]`,
      dimensions,
    };
    this.invoices.set(invoiceId, updated);
    return updated;
  }

  getInvoice(id: string): FinanceInvoice | undefined {
    return this.invoices.get(id);
  }

  listInvoices(): FinanceInvoice[] {
    return [...this.invoices.values()].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
  }

  listByCustomer(customerId: string): FinanceInvoice[] {
    return this.listInvoices().filter((i) => i.customerId === customerId);
  }

  listByStatus(status: FinanceInvoiceStatus): FinanceInvoice[] {
    return this.listInvoices().filter((i) => i.status === status);
  }

  /**
   * Calculate AR aging as of a given date (ISO date string).
   * Only includes outstanding (non-paid, non-void, non-written-off) invoices.
   */
  getAging(asOfDate: string): FinanceAgingBucket {
    const asOf = new Date(asOfDate).getTime();
    const currency = "USD";

    const bucket: FinanceAgingBucket = {
      current: { amount: 0, currency },
      days30: { amount: 0, currency },
      days60: { amount: 0, currency },
      days90: { amount: 0, currency },
      days120Plus: { amount: 0, currency },
      total: { amount: 0, currency },
    };

    for (const inv of this.invoices.values()) {
      if (
        inv.status === "paid" ||
        inv.status === "void" ||
        inv.status === "written_off"
      ) {
        continue;
      }
      const outstanding = inv.amount.amount - inv.paidAmount;
      if (outstanding <= 0) continue;

      const dueMs = new Date(inv.dueDate).getTime();
      const daysOverdue = Math.floor((asOf - dueMs) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
        bucket.current.amount += outstanding;
      } else if (daysOverdue <= 30) {
        bucket.days30.amount += outstanding;
      } else if (daysOverdue <= 60) {
        bucket.days60.amount += outstanding;
      } else if (daysOverdue <= 90) {
        bucket.days90.amount += outstanding;
      } else {
        bucket.days120Plus.amount += outstanding;
      }
      bucket.total.amount += outstanding;
    }

    return bucket;
  }

  /** Outstanding balance for a customer. */
  getCustomerBalance(customerId: string): FinanceMoney {
    const outstanding = this.listByCustomer(customerId)
      .filter(
        (i) =>
          i.status !== "paid" &&
          i.status !== "void" &&
          i.status !== "written_off"
      )
      .reduce((s, i) => s + (i.amount.amount - i.paidAmount), 0);
    return { amount: outstanding, currency: "USD" };
  }

  private getInvoiceOrThrow(id: string): FinanceInvoice {
    const inv = this.invoices.get(id);
    if (!inv) throw new Error(`Invoice not found: ${id}`);
    return inv;
  }

  private updateStatus(id: string, status: FinanceInvoiceStatus): FinanceInvoice {
    const inv = this.getInvoiceOrThrow(id);
    const updated: FinanceInvoice = { ...inv, status };
    this.invoices.set(id, updated);
    return updated;
  }
}

export function createFinanceAccountsReceivable(
  deps?: FinanceAccountsReceivableDependencies
): FinanceAccountsReceivable {
  return new FinanceAccountsReceivable(deps);
}

export { emptyDimensions };
