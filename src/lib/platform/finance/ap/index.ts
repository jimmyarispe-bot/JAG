/**
 * Enterprise Financial Intelligence Engine — Accounts Payable.
 *
 * Vendors, purchase requests, purchase orders, bills, approvals, payments.
 * Immutable: bills are never deleted.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type { FinanceGeneralLedger } from "@/lib/platform/finance/ledger";
import type {
  FinanceAgingBucket,
  FinanceBill,
  FinanceBillStatus,
  FinanceDimensionalContext,
  FinanceInvoiceItem,
  FinanceMoney,
  FinanceMetadata,
  FinancePOStatus,
  FinancePurchaseOrder,
  FinancePurchaseRequest,
  FinancePurchaseRequestStatus,
  FinanceVendor,
} from "@/lib/platform/finance/types";

export interface CreateVendorInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  paymentTermsDays?: number;
  dimensions: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface CreateBillInput {
  vendorId: string;
  poId?: string | null;
  dueDate: string;
  currency?: string;
  memo: string;
  dimensions: FinanceDimensionalContext;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    accountId?: string | null;
    dimensions?: FinanceDimensionalContext;
  }>;
  metadata?: FinanceMetadata;
}

export interface CreatePurchaseRequestInput {
  vendorId?: string | null;
  description: string;
  requestedBy: string;
  currency?: string;
  dimensions: FinanceDimensionalContext;
  memo: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    accountId?: string | null;
    dimensions?: FinanceDimensionalContext;
  }>;
  metadata?: FinanceMetadata;
}

export interface CreatePurchaseOrderInput {
  vendorId: string;
  requestId?: string | null;
  currency?: string;
  memo: string;
  dimensions: FinanceDimensionalContext;
  approvedBy?: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    accountId?: string | null;
    dimensions?: FinanceDimensionalContext;
  }>;
  metadata?: FinanceMetadata;
}

export interface FinanceAccountsPayableDependencies {
  gl?: FinanceGeneralLedger;
  apAccountCode?: string;
  expenseAccountCode?: string;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class FinanceAccountsPayable {
  private readonly vendors = new Map<string, FinanceVendor>();
  private readonly bills = new Map<string, FinanceBill>();
  private readonly purchaseRequests = new Map<string, FinancePurchaseRequest>();
  private readonly purchaseOrders = new Map<string, FinancePurchaseOrder>();
  private readonly gl: FinanceGeneralLedger | null;
  private readonly apAccountCode: string;
  private readonly expenseAccountCode: string;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private billSequence = 0;
  private poSequence = 0;
  private prSequence = 0;

  constructor(deps?: FinanceAccountsPayableDependencies) {
    this.gl = deps?.gl ?? null;
    this.apAccountCode = deps?.apAccountCode ?? "2000";
    this.expenseAccountCode = deps?.expenseAccountCode ?? "5300";
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  // ---------------------------------------------------------------------------
  // Vendors
  // ---------------------------------------------------------------------------

  createVendor(input: CreateVendorInput): FinanceVendor {
    const id = this.createId("vendor");
    const vendor: FinanceVendor = {
      id,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      taxId: input.taxId ?? null,
      isActive: true,
      paymentTermsDays: input.paymentTermsDays ?? 30,
      dimensions: input.dimensions,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.vendors.set(id, vendor);
    return vendor;
  }

  getVendor(id: string): FinanceVendor | undefined {
    return this.vendors.get(id);
  }

  listVendors(): FinanceVendor[] {
    return [...this.vendors.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  deactivateVendor(vendorId: string): FinanceVendor {
    const v = this.getVendorOrThrow(vendorId);
    const updated: FinanceVendor = { ...v, isActive: false };
    this.vendors.set(vendorId, updated);
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Purchase Requests
  // ---------------------------------------------------------------------------

  createPurchaseRequest(input: CreatePurchaseRequestInput): FinancePurchaseRequest {
    this.prSequence += 1;
    const id = this.createId("pr");
    const currency = input.currency ?? "USD";
    const items: FinanceInvoiceItem[] = input.lineItems.map((item) => ({
      id: this.createId("pr-item"),
      invoiceId: id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency,
      amount: item.quantity * item.unitPrice,
      accountId: item.accountId ?? null,
      dimensions: item.dimensions ?? input.dimensions,
    }));
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);

    const pr: FinancePurchaseRequest = {
      id,
      requestNumber: `PR-${String(this.prSequence).padStart(6, "0")}`,
      timestamp: this.now().toISOString(),
      dimensions: input.dimensions,
      amount: { amount: totalAmount, currency },
      memo: input.memo,
      reversedById: null,
      reversesId: null,
      vendorId: input.vendorId ?? null,
      status: "draft",
      requestedBy: input.requestedBy,
      description: input.description,
      lineItems: items,
      currency,
      metadata: input.metadata,
    };
    this.purchaseRequests.set(id, pr);
    return pr;
  }

  getPurchaseRequest(id: string): FinancePurchaseRequest | undefined {
    return this.purchaseRequests.get(id);
  }

  approvePurchaseRequest(id: string): FinancePurchaseRequest {
    return this.updatePRStatus(id, "approved");
  }

  // ---------------------------------------------------------------------------
  // Purchase Orders
  // ---------------------------------------------------------------------------

  createPurchaseOrder(input: CreatePurchaseOrderInput): FinancePurchaseOrder {
    this.poSequence += 1;
    const id = this.createId("po");
    const currency = input.currency ?? "USD";
    const items: FinanceInvoiceItem[] = input.items.map((item) => ({
      id: this.createId("po-item"),
      invoiceId: id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency,
      amount: item.quantity * item.unitPrice,
      accountId: item.accountId ?? null,
      dimensions: item.dimensions ?? input.dimensions,
    }));
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);

    const po: FinancePurchaseOrder = {
      id,
      poNumber: `PO-${String(this.poSequence).padStart(6, "0")}`,
      timestamp: this.now().toISOString(),
      dimensions: input.dimensions,
      amount: { amount: totalAmount, currency },
      memo: input.memo,
      reversedById: null,
      reversesId: null,
      vendorId: input.vendorId,
      status: "open",
      requestId: input.requestId ?? null,
      items,
      currency,
      approvedBy: input.approvedBy ?? null,
      receivedAmount: 0,
      metadata: input.metadata,
    };
    this.purchaseOrders.set(id, po);
    return po;
  }

  getPurchaseOrder(id: string): FinancePurchaseOrder | undefined {
    return this.purchaseOrders.get(id);
  }

  // ---------------------------------------------------------------------------
  // Bills
  // ---------------------------------------------------------------------------

  createBill(input: CreateBillInput): FinanceBill {
    this.billSequence += 1;
    const id = this.createId("bill");
    const currency = input.currency ?? "USD";
    const items: FinanceInvoiceItem[] = input.items.map((item) => ({
      id: this.createId("bill-item"),
      invoiceId: id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency,
      amount: item.quantity * item.unitPrice,
      accountId: item.accountId ?? null,
      dimensions: item.dimensions ?? input.dimensions,
    }));
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);

    const bill: FinanceBill = {
      id,
      billNumber: `BILL-${String(this.billSequence).padStart(6, "0")}`,
      timestamp: this.now().toISOString(),
      dimensions: input.dimensions,
      amount: { amount: totalAmount, currency },
      memo: input.memo,
      reversedById: null,
      reversesId: null,
      vendorId: input.vendorId,
      poId: input.poId ?? null,
      status: "received",
      dueDate: input.dueDate,
      items,
      paidAmount: 0,
      currency,
      metadata: input.metadata,
    };
    this.bills.set(id, bill);

    // Post AP/Expense journal if GL injected
    if (this.gl) {
      const coa = this.gl.chartOfAccounts;
      const apAccount = coa.findByCode(this.apAccountCode);
      const expAccount = coa.findByCode(this.expenseAccountCode);
      if (apAccount && expAccount) {
        this.gl.postJournal({
          memo: `Bill ${bill.billNumber} — ${input.memo}`,
          currency,
          dimensions: input.dimensions,
          postings: [
            { accountId: expAccount.id, debit: totalAmount, credit: 0 },
            { accountId: apAccount.id, debit: 0, credit: totalAmount },
          ],
        });
      }
    }

    return bill;
  }

  getBill(id: string): FinanceBill | undefined {
    return this.bills.get(id);
  }

  listBills(): FinanceBill[] {
    return [...this.bills.values()].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
  }

  listBillsByVendor(vendorId: string): FinanceBill[] {
    return this.listBills().filter((b) => b.vendorId === vendorId);
  }

  approveBill(billId: string): FinanceBill {
    return this.updateBillStatus(billId, "approved");
  }

  /** Record a payment against a bill. */
  recordBillPayment(
    billId: string,
    amount: number,
    paymentId: string
  ): FinanceBill {
    const bill = this.getBillOrThrow(billId);
    const newPaid = bill.paidAmount + amount;
    const totalDue = bill.amount.amount;
    let status: FinanceBillStatus;
    if (newPaid >= totalDue - 0.005) {
      status = "paid";
    } else if (newPaid > 0) {
      status = "partial";
    } else {
      status = bill.status;
    }

    const updated: FinanceBill = {
      ...bill,
      paidAmount: newPaid,
      status,
      metadata: { ...bill.metadata, lastPaymentId: paymentId },
    };
    this.bills.set(billId, updated);
    return updated;
  }

  voidBill(billId: string, memo: string): FinanceBill {
    const bill = this.getBillOrThrow(billId);
    const updated: FinanceBill = {
      ...bill,
      status: "void",
      memo: `${bill.memo} [VOID: ${memo}]`,
    };
    this.bills.set(billId, updated);
    return updated;
  }

  /** AP aging as of a date. */
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

    for (const bill of this.bills.values()) {
      if (bill.status === "paid" || bill.status === "void") continue;
      const outstanding = bill.amount.amount - bill.paidAmount;
      if (outstanding <= 0) continue;

      const dueMs = new Date(bill.dueDate).getTime();
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

  /** Total outstanding AP balance. */
  getTotalOutstanding(): FinanceMoney {
    const total = [...this.bills.values()]
      .filter((b) => b.status !== "paid" && b.status !== "void")
      .reduce((s, b) => s + (b.amount.amount - b.paidAmount), 0);
    return { amount: total, currency: "USD" };
  }

  private getBillOrThrow(id: string): FinanceBill {
    const b = this.bills.get(id);
    if (!b) throw new Error(`Bill not found: ${id}`);
    return b;
  }

  private getVendorOrThrow(id: string): FinanceVendor {
    const v = this.vendors.get(id);
    if (!v) throw new Error(`Vendor not found: ${id}`);
    return v;
  }

  private updateBillStatus(id: string, status: FinanceBillStatus): FinanceBill {
    const bill = this.getBillOrThrow(id);
    const updated: FinanceBill = { ...bill, status };
    this.bills.set(id, updated);
    return updated;
  }

  private updatePRStatus(
    id: string,
    status: FinancePurchaseRequestStatus
  ): FinancePurchaseRequest {
    const pr = this.purchaseRequests.get(id);
    if (!pr) throw new Error(`Purchase request not found: ${id}`);
    const updated: FinancePurchaseRequest = { ...pr, status };
    this.purchaseRequests.set(id, updated);
    return updated;
  }
}

export function createFinanceAccountsPayable(
  deps?: FinanceAccountsPayableDependencies
): FinanceAccountsPayable {
  return new FinanceAccountsPayable(deps);
}
