/**
 * Sprint 019 — Enterprise Financial Intelligence Engine
 * Comprehensive unit tests.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createEnterpriseFinance } from "@/lib/platform/finance/engine";
import { FinanceAuditService } from "@/lib/platform/finance/audit";
import {
  FinanceChartOfAccounts,
  FinanceGeneralLedger,
} from "@/lib/platform/finance/ledger";
import { FinanceAccountsReceivable } from "@/lib/platform/finance/ar";
import { FinanceAccountsPayable } from "@/lib/platform/finance/ap";
import { FinanceBanking } from "@/lib/platform/finance/banking";
import { FinancePayments } from "@/lib/platform/finance/payments";
import { FinanceCashManagement } from "@/lib/platform/finance/cash";
import { FinanceBudgeting } from "@/lib/platform/finance/budgeting";
import { FinanceAssets } from "@/lib/platform/finance/assets";
import { FinanceDebt } from "@/lib/platform/finance/debt";
import { FinanceGrants } from "@/lib/platform/finance/grants";
import { FinanceScholarships } from "@/lib/platform/finance/scholarships";
import { FinanceTax } from "@/lib/platform/finance/tax";
import { FinanceQuickBooksExport } from "@/lib/platform/finance/quickbooks";
import { FinanceCpaWorkpapers } from "@/lib/platform/finance/cpa";
import { FinanceExecutiveIntelligence } from "@/lib/platform/finance/executive";
import {
  emptyDimensions,
  ENTERPRISE_FINANCE_VERSION,
} from "@/lib/platform/finance/types";
import type {
  FinanceDimensionalContext,
  FinancialSnapshot,
} from "@/lib/platform/finance/types";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let _id = 0;
function testId(prefix: string): string {
  _id += 1;
  return `${prefix}-${_id}`;
}

const testNow = (): Date => new Date("2025-06-15T00:00:00Z");

const dims: FinanceDimensionalContext = {
  organizationId: "org-1",
  schoolId: "school-1",
  campusId: "campus-1",
  departmentId: "dept-1",
  programId: "prog-1",
  employeeId: null,
  studentId: null,
  vendorId: null,
  customerId: null,
  fundingSourceId: null,
  grantId: null,
  scholarshipId: null,
  projectId: null,
  workflowRef: null,
  evidenceRef: null,
  approvalRef: null,
  auditRef: null,
};

function makeDeps() {
  return { createId: testId, now: testNow };
}

// ---------------------------------------------------------------------------
// ENTERPRISE_FINANCE_VERSION
// ---------------------------------------------------------------------------

describe("ENTERPRISE_FINANCE_VERSION", () => {
  it("should be 0.1.0", () => {
    expect(ENTERPRISE_FINANCE_VERSION).toBe("0.1.0");
  });
});

// ---------------------------------------------------------------------------
// Dimensional context
// ---------------------------------------------------------------------------

describe("emptyDimensions", () => {
  it("should create all-null context", () => {
    const ctx = emptyDimensions();
    expect(ctx.organizationId).toBeNull();
    expect(ctx.auditRef).toBeNull();
  });

  it("should merge overrides", () => {
    const ctx = emptyDimensions({ organizationId: "org-x", schoolId: "sch-x" });
    expect(ctx.organizationId).toBe("org-x");
    expect(ctx.schoolId).toBe("sch-x");
    expect(ctx.campusId).toBeNull();
  });

  it("transaction base includes all dimensional fields", () => {
    const ctx = emptyDimensions({ organizationId: "org-1" });
    const fields = [
      "organizationId", "schoolId", "campusId", "departmentId",
      "programId", "employeeId", "studentId", "vendorId",
      "customerId", "fundingSourceId", "grantId", "scholarshipId",
      "projectId", "workflowRef", "evidenceRef", "approvalRef", "auditRef",
    ];
    for (const f of fields) {
      expect(f in ctx).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Audit service
// ---------------------------------------------------------------------------

describe("FinanceAuditService", () => {
  let audit: FinanceAuditService;

  beforeEach(() => {
    _id = 0;
    audit = new FinanceAuditService(makeDeps());
  });

  it("records an event and returns it", () => {
    const ev = audit.record({
      kind: "invoice",
      entityId: "inv-1",
      entityType: "FinanceInvoice",
      action: "create",
      dimensions: dims,
    });
    expect(ev.id).toBeDefined();
    expect(ev.kind).toBe("invoice");
    expect(ev.entityId).toBe("inv-1");
    expect(ev.timestamp).toBe("2025-06-15T00:00:00.000Z");
  });

  it("never deletes events — list grows monotonically", () => {
    audit.record({ kind: "invoice", entityId: "a", entityType: "T", action: "create", dimensions: dims });
    audit.record({ kind: "payment", entityId: "b", entityType: "T", action: "create", dimensions: dims });
    expect(audit.list()).toHaveLength(2);
    expect(audit.count()).toBe(2);
  });

  it("listByKind filters correctly", () => {
    audit.record({ kind: "invoice", entityId: "a", entityType: "T", action: "c", dimensions: dims });
    audit.record({ kind: "journal", entityId: "b", entityType: "T", action: "c", dimensions: dims });
    audit.record({ kind: "invoice", entityId: "c", entityType: "T", action: "c", dimensions: dims });
    expect(audit.listByKind("invoice")).toHaveLength(2);
    expect(audit.listByKind("journal")).toHaveLength(1);
    expect(audit.listByKind("payment")).toHaveLength(0);
  });

  it("listByEntity returns all events for an entity", () => {
    audit.record({ kind: "invoice", entityId: "inv-99", entityType: "T", action: "create", dimensions: dims });
    audit.record({ kind: "payment", entityId: "inv-99", entityType: "T", action: "pay", dimensions: dims });
    audit.record({ kind: "invoice", entityId: "inv-00", entityType: "T", action: "create", dimensions: dims });
    expect(audit.listByEntity("inv-99")).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Chart of accounts + General ledger
// ---------------------------------------------------------------------------

describe("FinanceChartOfAccounts", () => {
  let coa: FinanceChartOfAccounts;

  beforeEach(() => {
    _id = 0;
    coa = new FinanceChartOfAccounts(makeDeps());
  });

  it("seeds default accounts", () => {
    const accounts = coa.listAccounts();
    expect(accounts.length).toBeGreaterThan(10);
  });

  it("can add a custom account", () => {
    const acct = coa.addAccount({
      code: "9000",
      name: "Special Reserve",
      type: "equity",
      description: "Board reserve",
    });
    expect(acct.id).toBeDefined();
    expect(acct.code).toBe("9000");
    expect(coa.findByCode("9000")).toEqual(acct);
  });

  it("findByCode returns undefined for unknown code", () => {
    expect(coa.findByCode("0000")).toBeUndefined();
  });

  it("listByType filters correctly", () => {
    const assets = coa.listByType("asset");
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.every((a) => a.type === "asset")).toBe(true);
  });
});

describe("FinanceGeneralLedger", () => {
  let gl: FinanceGeneralLedger;
  let cashAccountId: string;
  let revenueAccountId: string;

  beforeEach(() => {
    _id = 0;
    gl = new FinanceGeneralLedger(makeDeps());
    cashAccountId = gl.chartOfAccounts.findByCode("1000")!.id;
    revenueAccountId = gl.chartOfAccounts.findByCode("4000")!.id;
  });

  it("posts a balanced journal entry", () => {
    const je = gl.postJournal({
      memo: "Tuition collected",
      currency: "USD",
      dimensions: dims,
      postings: [
        { accountId: cashAccountId, debit: 1000, credit: 0 },
        { accountId: revenueAccountId, debit: 0, credit: 1000 },
      ],
    });
    expect(je.id).toBeDefined();
    expect(je.journalNumber).toMatch(/^JE-/);
    expect(je.status).toBe("posted");
    expect(je.postings).toHaveLength(2);
  });

  it("throws when journal does not balance", () => {
    expect(() =>
      gl.postJournal({
        memo: "Unbalanced",
        dimensions: dims,
        postings: [
          { accountId: cashAccountId, debit: 1000, credit: 0 },
          { accountId: revenueAccountId, debit: 0, credit: 900 },
        ],
      })
    ).toThrow(/balance/i);
  });

  it("reverses a journal entry — original is never deleted", () => {
    const je = gl.postJournal({
      memo: "Original",
      dimensions: dims,
      postings: [
        { accountId: cashAccountId, debit: 500, credit: 0 },
        { accountId: revenueAccountId, debit: 0, credit: 500 },
      ],
    });

    const reversal = gl.reverseJournal(je.id, "Reversal", dims);
    expect(reversal.reversesId).toBe(je.id);
    expect(reversal.postings[0].debit).toBe(0);
    expect(reversal.postings[0].credit).toBe(500);

    // Original still exists and is marked reversed
    const original = gl.getJournal(je.id);
    expect(original).toBeDefined();
    expect(original!.status).toBe("reversed");
    expect(original!.reversedById).toBe(reversal.id);

    // Total journals = 2 (original + reversal)
    expect(gl.listJournals()).toHaveLength(2);
  });

  it("cannot reverse an already-reversed entry", () => {
    const je = gl.postJournal({
      memo: "Original",
      dimensions: dims,
      postings: [
        { accountId: cashAccountId, debit: 200, credit: 0 },
        { accountId: revenueAccountId, debit: 0, credit: 200 },
      ],
    });
    gl.reverseJournal(je.id, "First reversal");
    expect(() => gl.reverseJournal(je.id, "Second reversal")).toThrow();
  });

  it("getBalance returns correct debit/credit totals", () => {
    gl.postJournal({
      memo: "Entry 1",
      dimensions: dims,
      postings: [
        { accountId: cashAccountId, debit: 1000, credit: 0 },
        { accountId: revenueAccountId, debit: 0, credit: 1000 },
      ],
    });
    gl.postJournal({
      memo: "Entry 2",
      dimensions: dims,
      postings: [
        { accountId: cashAccountId, debit: 500, credit: 0 },
        { accountId: revenueAccountId, debit: 0, credit: 500 },
      ],
    });

    const cashBalance = gl.getBalance(cashAccountId);
    expect(cashBalance.debitBalance).toBe(1500);
    expect(cashBalance.normalBalance).toBe(1500);
  });

  it("getTrialBalance balances after valid journal", () => {
    gl.postJournal({
      memo: "Test",
      dimensions: dims,
      postings: [
        { accountId: cashAccountId, debit: 750, credit: 0 },
        { accountId: revenueAccountId, debit: 0, credit: 750 },
      ],
    });
    const tb = gl.getTrialBalance("2025-12-31");
    expect(tb.isBalanced).toBe(true);
    expect(tb.totalDebits).toBe(tb.totalCredits);
  });

  it("dimensions are carried on journal entries", () => {
    const je = gl.postJournal({
      memo: "With dimensions",
      dimensions: dims,
      postings: [
        { accountId: cashAccountId, debit: 100, credit: 0 },
        { accountId: revenueAccountId, debit: 0, credit: 100 },
      ],
    });
    expect(je.dimensions.organizationId).toBe("org-1");
    expect(je.dimensions.schoolId).toBe("school-1");
  });
});

// ---------------------------------------------------------------------------
// Accounts Receivable
// ---------------------------------------------------------------------------

describe("FinanceAccountsReceivable", () => {
  let ar: FinanceAccountsReceivable;

  beforeEach(() => {
    _id = 0;
    ar = new FinanceAccountsReceivable(makeDeps());
  });

  it("creates an invoice with dimensional context", () => {
    const inv = ar.createInvoice({
      customerId: "cust-1",
      dueDate: "2025-07-15",
      memo: "Tuition Q3",
      dimensions: dims,
      items: [
        { description: "Tuition", quantity: 1, unitPrice: 5000 },
      ],
    });
    expect(inv.id).toBeDefined();
    expect(inv.invoiceNumber).toMatch(/^INV-/);
    expect(inv.amount.amount).toBe(5000);
    expect(inv.paidAmount).toBe(0);
    expect(inv.status).toBe("draft");
    expect(inv.dimensions.organizationId).toBe("org-1");
    expect(inv.reversedById).toBeNull();
    expect(inv.reversesId).toBeNull();
  });

  it("records payment and updates status to paid", () => {
    const inv = ar.createInvoice({
      customerId: "cust-1",
      dueDate: "2025-07-15",
      memo: "Fee",
      dimensions: dims,
      items: [{ description: "Fee", quantity: 1, unitPrice: 200 }],
    });
    const updated = ar.recordPayment(inv.id, 200, "pmt-1");
    expect(updated.paidAmount).toBe(200);
    expect(updated.status).toBe("paid");
  });

  it("partial payment sets status to partial", () => {
    const inv = ar.createInvoice({
      customerId: "cust-1",
      dueDate: "2025-07-15",
      memo: "Fee",
      dimensions: dims,
      items: [{ description: "Fee", quantity: 1, unitPrice: 1000 }],
    });
    const updated = ar.recordPayment(inv.id, 400, "pmt-1");
    expect(updated.paidAmount).toBe(400);
    expect(updated.status).toBe("partial");
  });

  it("calculates aging buckets correctly", () => {
    // Invoice due 25 days ago (should be in days30 bucket, 1-30 days overdue)
    const pastDue = new Date("2025-06-15");
    pastDue.setDate(pastDue.getDate() - 25);
    const dueDate = pastDue.toISOString().split("T")[0];

    ar.createInvoice({
      customerId: "cust-1",
      dueDate,
      memo: "Overdue",
      dimensions: dims,
      items: [{ description: "Tuition", quantity: 1, unitPrice: 3000 }],
    });

    // Invoice due in the future (current bucket)
    ar.createInvoice({
      customerId: "cust-2",
      dueDate: "2025-07-01",
      memo: "Current",
      dimensions: dims,
      items: [{ description: "Tuition", quantity: 1, unitPrice: 2000 }],
    });

    const aging = ar.getAging("2025-06-15");
    expect(aging.total.amount).toBe(5000);
    expect(aging.current.amount).toBe(2000);
    expect(aging.days30.amount).toBe(3000);
  });

  it("write-off marks invoice as written_off (not deleted)", () => {
    const inv = ar.createInvoice({
      customerId: "cust-1",
      dueDate: "2025-01-01",
      memo: "Bad debt",
      dimensions: dims,
      items: [{ description: "Fee", quantity: 1, unitPrice: 500 }],
    });
    const written = ar.writeOff(inv.id, "Uncollectable", dims);
    expect(written.status).toBe("written_off");
    // Original record still exists
    expect(ar.getInvoice(inv.id)).toBeDefined();
  });

  it("void invoice is immutable — still retrievable", () => {
    const inv = ar.createInvoice({
      customerId: "cust-1",
      dueDate: "2025-01-01",
      memo: "Void test",
      dimensions: dims,
      items: [{ description: "Fee", quantity: 1, unitPrice: 100 }],
    });
    ar.voidInvoice(inv.id, "Duplicate");
    const voided = ar.getInvoice(inv.id);
    expect(voided!.status).toBe("void");
    expect(ar.listInvoices()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Accounts Payable
// ---------------------------------------------------------------------------

describe("FinanceAccountsPayable", () => {
  let ap: FinanceAccountsPayable;

  beforeEach(() => {
    _id = 0;
    ap = new FinanceAccountsPayable(makeDeps());
  });

  it("creates a vendor and bill", () => {
    const vendor = ap.createVendor({
      name: "Acme Supplies",
      email: "vendor@acme.com",
      taxId: "12-3456789",
      dimensions: dims,
    });
    expect(vendor.id).toBeDefined();
    expect(vendor.name).toBe("Acme Supplies");

    const bill = ap.createBill({
      vendorId: vendor.id,
      dueDate: "2025-07-30",
      memo: "Office supplies",
      dimensions: dims,
      items: [
        { description: "Paper", quantity: 10, unitPrice: 20 },
        { description: "Pens", quantity: 50, unitPrice: 2 },
      ],
    });
    expect(bill.id).toBeDefined();
    expect(bill.billNumber).toMatch(/^BILL-/);
    expect(bill.amount.amount).toBe(300);
    expect(bill.vendorId).toBe(vendor.id);
    expect(bill.dimensions.organizationId).toBe("org-1");
    expect(bill.reversedById).toBeNull();
  });

  it("records bill payment and updates status", () => {
    const vendor = ap.createVendor({ name: "Vendor A", dimensions: dims });
    const bill = ap.createBill({
      vendorId: vendor.id,
      dueDate: "2025-07-01",
      memo: "Monthly fee",
      dimensions: dims,
      items: [{ description: "Service", quantity: 1, unitPrice: 1000 }],
    });
    const updated = ap.recordBillPayment(bill.id, 1000, "pmt-1");
    expect(updated.paidAmount).toBe(1000);
    expect(updated.status).toBe("paid");
  });

  it("creates purchase request and order", () => {
    const vendor = ap.createVendor({ name: "Vendor B", dimensions: dims });

    const pr = ap.createPurchaseRequest({
      description: "Lab equipment",
      requestedBy: "teacher-1",
      memo: "Lab equipment purchase",
      dimensions: dims,
      lineItems: [{ description: "Microscope", quantity: 2, unitPrice: 500 }],
    });
    expect(pr.requestNumber).toMatch(/^PR-/);
    expect(pr.amount.amount).toBe(1000);

    const po = ap.createPurchaseOrder({
      vendorId: vendor.id,
      memo: "Lab equipment PO",
      dimensions: dims,
      items: [{ description: "Microscope", quantity: 2, unitPrice: 500 }],
    });
    expect(po.poNumber).toMatch(/^PO-/);
    expect(po.status).toBe("open");
  });

  it("AP aging buckets are calculated correctly", () => {
    const vendor = ap.createVendor({ name: "Vendor C", dimensions: dims });
    // 50 days ago → in 31-60 days overdue bucket (days60)
    const past50Days = new Date("2025-06-15");
    past50Days.setDate(past50Days.getDate() - 50);

    ap.createBill({
      vendorId: vendor.id,
      dueDate: past50Days.toISOString().split("T")[0],
      memo: "Old bill",
      dimensions: dims,
      items: [{ description: "Service", quantity: 1, unitPrice: 800 }],
    });

    const aging = ap.getAging("2025-06-15");
    expect(aging.total.amount).toBe(800);
    expect(aging.days60.amount).toBe(800);
  });
});

// ---------------------------------------------------------------------------
// Banking
// ---------------------------------------------------------------------------

describe("FinanceBanking", () => {
  let banking: FinanceBanking;

  beforeEach(() => {
    _id = 0;
    banking = new FinanceBanking(makeDeps());
  });

  it("creates a bank account", () => {
    const acct = banking.createBankAccount({
      name: "Operating Checking",
      type: "checking",
      bankName: "First National",
      accountNumber: "123456789",
      openingBalance: 10000,
    });
    expect(acct.id).toBeDefined();
    expect(acct.currentBalance).toBe(10000);
    expect(acct.isActive).toBe(true);
  });

  it("deposit increases balance", () => {
    const acct = banking.createBankAccount({
      name: "Checking",
      type: "checking",
      bankName: "Test Bank",
      accountNumber: "111",
      openingBalance: 5000,
    });
    banking.deposit({
      bankAccountId: acct.id,
      amount: 3000,
      memo: "Tuition deposit",
      dimensions: dims,
    });
    const updated = banking.getBankAccount(acct.id);
    expect(updated!.currentBalance).toBe(8000);
  });

  it("withdrawal decreases balance", () => {
    const acct = banking.createBankAccount({
      name: "Checking",
      type: "checking",
      bankName: "Test Bank",
      accountNumber: "222",
      openingBalance: 5000,
    });
    banking.withdraw({
      bankAccountId: acct.id,
      amount: 1500,
      memo: "Rent payment",
      dimensions: dims,
    });
    expect(banking.getBankAccount(acct.id)!.currentBalance).toBe(3500);
  });

  it("reconciles a transaction and updates account", () => {
    const acct = banking.createBankAccount({
      name: "Savings",
      type: "savings",
      bankName: "Bank X",
      accountNumber: "333",
      openingBalance: 0,
    });
    const txn = banking.deposit({
      bankAccountId: acct.id,
      amount: 500,
      memo: "Interest",
      dimensions: dims,
    });
    expect(txn.isReconciled).toBe(false);

    const reconciled = banking.reconcile(acct.id, txn.id);
    expect(reconciled.isReconciled).toBe(true);
    expect(reconciled.reconciledAt).not.toBeNull();
    expect(banking.getBankAccount(acct.id)!.lastReconciledDate).not.toBeNull();
  });

  it("getOutstandingItems returns unreconciled transactions", () => {
    const acct = banking.createBankAccount({
      name: "Op",
      type: "checking",
      bankName: "B",
      accountNumber: "444",
    });
    banking.deposit({ bankAccountId: acct.id, amount: 100, memo: "D1", dimensions: dims });
    const txn2 = banking.deposit({ bankAccountId: acct.id, amount: 200, memo: "D2", dimensions: dims });
    banking.reconcile(acct.id, txn2.id);

    const outstanding = banking.getOutstandingItems(acct.id);
    expect(outstanding).toHaveLength(1);
    expect(outstanding[0].amount.amount).toBe(100);
  });

  it("transfer creates debit and credit transactions", () => {
    const from = banking.createBankAccount({
      name: "From",
      type: "checking",
      bankName: "B",
      accountNumber: "555",
      openingBalance: 1000,
    });
    const to = banking.createBankAccount({
      name: "To",
      type: "savings",
      bankName: "B",
      accountNumber: "666",
      openingBalance: 0,
    });
    const { debit, credit } = banking.transfer({
      fromBankAccountId: from.id,
      toBankAccountId: to.id,
      amount: 400,
      memo: "Internal transfer",
      dimensions: dims,
    });
    expect(debit.transactionType).toBe("transfer");
    expect(credit.transactionType).toBe("transfer");
    expect(banking.getBankAccount(from.id)!.currentBalance).toBe(600);
    expect(banking.getBankAccount(to.id)!.currentBalance).toBe(400);
  });

  it("bank transaction carries dimensional context and immutable fields", () => {
    const acct = banking.createBankAccount({
      name: "Checking",
      type: "checking",
      bankName: "B",
      accountNumber: "777",
    });
    const txn = banking.deposit({
      bankAccountId: acct.id,
      amount: 750,
      memo: "Grant receipt",
      dimensions: dims,
    });
    expect(txn.dimensions.organizationId).toBe("org-1");
    expect(txn.reversedById).toBeNull();
    expect(txn.reversesId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

describe("FinancePayments", () => {
  let payments: FinancePayments;
  let ar: FinanceAccountsReceivable;

  beforeEach(() => {
    _id = 0;
    ar = new FinanceAccountsReceivable(makeDeps());
    payments = new FinancePayments({ ...makeDeps(), ar });
  });

  it("records a payment with dimensional context", () => {
    const pmt = payments.recordPayment({
      method: "ach",
      direction: "inbound",
      amount: 2000,
      memo: "Tuition payment",
      dimensions: dims,
    });
    expect(pmt.id).toBeDefined();
    expect(pmt.paymentNumber).toMatch(/^PMT-/);
    expect(pmt.method).toBe("ach");
    expect(pmt.status).toBe("completed");
    expect(pmt.dimensions.organizationId).toBe("org-1");
    expect(pmt.reversedById).toBeNull();
  });

  it("allocates payment to invoice and updates AR", () => {
    const inv = ar.createInvoice({
      customerId: "cust-1",
      dueDate: "2025-08-01",
      memo: "Q4 tuition",
      dimensions: dims,
      items: [{ description: "Tuition", quantity: 1, unitPrice: 3000 }],
    });

    payments.recordPayment({
      method: "check",
      direction: "inbound",
      amount: 3000,
      memo: "Full payment",
      dimensions: dims,
      allocations: [
        { invoiceId: inv.id, billId: null, allocatedAmount: 3000, currency: "USD" },
      ],
    });

    const updatedInv = ar.getInvoice(inv.id);
    expect(updatedInv!.paidAmount).toBe(3000);
    expect(updatedInv!.status).toBe("paid");
  });

  it("refund creates a new outbound payment linked to original", () => {
    const pmt = payments.recordPayment({
      method: "card",
      direction: "inbound",
      amount: 500,
      memo: "Activity fee",
      dimensions: dims,
    });

    const refund = payments.refund(pmt.id, 500, "Full refund", dims);
    expect(refund.reversesId).toBe(pmt.id);
    expect(refund.direction).toBe("outbound");
    expect(refund.amount.amount).toBe(500);

    // Original still exists
    const original = payments.getPayment(pmt.id);
    expect(original).toBeDefined();
    expect(original!.status).toBe("refunded");
    expect(original!.reversedById).toBe(refund.id);

    // Total payments = 2 (original + refund)
    expect(payments.listPayments()).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Cash management
// ---------------------------------------------------------------------------

describe("FinanceCashManagement", () => {
  let cash: FinanceCashManagement;

  beforeEach(() => {
    _id = 0;
    cash = new FinanceCashManagement(makeDeps());
  });

  it("records cash flow items", () => {
    const item = cash.recordCashFlow({
      category: "operating",
      description: "Tuition income",
      amount: 50000,
      date: "2025-07-01",
    });
    expect(item.id).toBeDefined();
    expect(item.amount).toBe(50000);
    expect(item.category).toBe("operating");
  });

  it("calculates cash runway correctly", () => {
    const runway = cash.getCashRunway(60000, 30000);
    expect(runway).toBe(60); // 60000 / 1000 per day
  });

  it("returns infinite runway when burn is zero", () => {
    expect(cash.getCashRunway(100000, 0)).toBe(99999);
  });

  it("calculates days cash on hand", () => {
    const dcoh = cash.getDaysCashOnHand(365000, 1000);
    expect(dcoh).toBe(365);
  });

  it("generates forecast with inflows/outflows", () => {
    const nowDate = testNow();
    const tomorrow = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000);
    const in10Days = new Date(nowDate.getTime() + 10 * 24 * 60 * 60 * 1000);

    cash.recordCashFlow({
      category: "operating",
      description: "Revenue",
      amount: 20000,
      date: tomorrow.toISOString().split("T")[0],
    });
    cash.recordCashFlow({
      category: "operating",
      description: "Expenses",
      amount: -8000,
      date: in10Days.toISOString().split("T")[0],
    });

    const forecast = cash.generateForecast(50000, 30, "USD");
    expect(forecast.projectedInflows).toBe(20000);
    expect(forecast.projectedOutflows).toBe(8000);
    expect(forecast.projectedEndBalance).toBe(62000);
    expect(forecast.runwayDays).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Budgeting
// ---------------------------------------------------------------------------

describe("FinanceBudgeting", () => {
  let budgeting: FinanceBudgeting;

  beforeEach(() => {
    _id = 0;
    budgeting = new FinanceBudgeting(makeDeps());
  });

  it("creates a budget with lines", () => {
    const budget = budgeting.createBudget({
      name: "FY2025 Operating Budget",
      fiscalYear: 2025,
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      lines: [
        { accountId: "acct-1", description: "Payroll", budgetedAmount: 500000 },
        { accountId: "acct-2", description: "Facilities", budgetedAmount: 100000 },
      ],
    });
    expect(budget.id).toBeDefined();
    expect(budget.totalBudgeted).toBe(600000);
    expect(budget.lines).toHaveLength(2);
    expect(budget.status).toBe("draft");
  });

  it("updates actuals and calculates variance", () => {
    const budget = budgeting.createBudget({
      name: "FY2025",
      fiscalYear: 2025,
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      lines: [
        { accountId: "acct-1", description: "Payroll", budgetedAmount: 100000 },
      ],
    });

    const updated = budgeting.updateActuals(budget.id, "acct-1", 85000);
    const line = updated.lines[0];
    expect(line.actualAmount).toBe(85000);
    expect(line.variance).toBe(15000);
    expect(line.variancePercent).toBeCloseTo(15, 0);
    expect(updated.totalActual).toBe(85000);
    expect(updated.totalVariance).toBe(15000);
  });

  it("over-budget lines are detected", () => {
    const budget = budgeting.createBudget({
      name: "FY2025",
      fiscalYear: 2025,
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      lines: [
        { accountId: "acct-1", description: "Travel", budgetedAmount: 5000 },
        { accountId: "acct-2", description: "Supplies", budgetedAmount: 3000 },
      ],
    });
    budgeting.updateActuals(budget.id, "acct-1", 6000);
    budgeting.updateActuals(budget.id, "acct-2", 2000);
    const overBudget = budgeting.getOverBudgetLines(budget.id);
    expect(overBudget).toHaveLength(1);
    expect(overBudget[0].accountId).toBe("acct-1");
  });
});

// ---------------------------------------------------------------------------
// Fixed assets + depreciation
// ---------------------------------------------------------------------------

describe("FinanceAssets", () => {
  let assets: FinanceAssets;

  beforeEach(() => {
    _id = 0;
    assets = new FinanceAssets(makeDeps());
  });

  it("adds an asset with correct initial values", () => {
    const asset = assets.addAsset({
      name: "Computer Lab Equipment",
      acquisitionDate: "2024-01-01",
      acquisitionCost: 50000,
      salvageValue: 5000,
      usefulLifeYears: 5,
      depreciationMethod: "straight_line",
    });
    expect(asset.id).toBeDefined();
    expect(asset.bookValue).toBe(50000);
    expect(asset.accumulatedDepreciation).toBe(0);
    expect(asset.status).toBe("active");
  });

  it("calculates straight-line depreciation", () => {
    const asset = assets.addAsset({
      name: "Furniture",
      acquisitionDate: "2020-01-01",
      acquisitionCost: 10000,
      salvageValue: 1000,
      usefulLifeYears: 5,
      depreciationMethod: "straight_line",
    });
    const entry = assets.calculateDepreciation(asset.id, "2020-12-31");
    expect(entry.depreciationAmount).toBeCloseTo(1800, 0); // (10000-1000)/5
    expect(entry.currency).toBe("USD");
  });

  it("generates full depreciation schedule", () => {
    const asset = assets.addAsset({
      name: "Vehicle",
      acquisitionDate: "2025-01-01",
      acquisitionCost: 30000,
      salvageValue: 0,
      usefulLifeYears: 3,
      depreciationMethod: "straight_line",
    });
    const schedule = assets.getDepreciationSchedule(asset.id);
    expect(schedule).toHaveLength(3);
    expect(schedule.every((e) => e.depreciationAmount > 0)).toBe(true);
    const finalEntry = schedule[schedule.length - 1];
    expect(finalEntry.bookValue).toBeCloseTo(0, 1);
  });

  it("disposes asset — record retained immutably", () => {
    const asset = assets.addAsset({
      name: "Projector",
      acquisitionDate: "2023-01-01",
      acquisitionCost: 2000,
      salvageValue: 0,
      usefulLifeYears: 4,
    });
    const disposed = assets.disposeAsset(asset.id, "2025-06-01", 500);
    expect(disposed.status).toBe("disposed");
    expect(disposed.disposalProceeds).toBe(500);
    expect(disposed.disposedAt).toBe("2025-06-01");
    // Record still accessible
    expect(assets.getAsset(asset.id)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Debt / Loans
// ---------------------------------------------------------------------------

describe("FinanceDebt", () => {
  let debt: FinanceDebt;

  beforeEach(() => {
    _id = 0;
    debt = new FinanceDebt(makeDeps());
  });

  it("adds a loan and generates amortization schedule", () => {
    const loan = debt.addLoan({
      lenderName: "Community Bank",
      principalAmount: 120000,
      interestRate: 0.06,
      termMonths: 12,
      startDate: "2025-01-01",
    });
    expect(loan.id).toBeDefined();
    expect(loan.status).toBe("active");
    expect(loan.schedule).toHaveLength(12);
    expect(loan.outstandingBalance).toBe(120000);
    // Each payment should be positive
    expect(loan.schedule.every((e) => e.totalPayment > 0)).toBe(true);
  });

  it("records a loan payment and updates balance", () => {
    const loan = debt.addLoan({
      lenderName: "Bank X",
      principalAmount: 24000,
      interestRate: 0.0,
      termMonths: 12,
      startDate: "2025-01-01",
    });
    const firstPayment = loan.schedule[0];
    expect(firstPayment.paymentNumber).toBe(1);

    const updated = debt.recordLoanPayment(loan.id, 1);
    expect(updated.schedule[0].isPaid).toBe(true);
    expect(updated.schedule[0].paidDate).toBe("2025-06-15");
    expect(updated.outstandingBalance).toBeLessThan(24000);
  });

  it("marks loan as paid_off when all payments are made", () => {
    const loan = debt.addLoan({
      lenderName: "Micro Lender",
      principalAmount: 1000,
      interestRate: 0.0,
      termMonths: 2,
      startDate: "2025-01-01",
    });
    debt.recordLoanPayment(loan.id, 1);
    const final = debt.recordLoanPayment(loan.id, 2);
    expect(final.status).toBe("paid_off");
  });

  it("covenant breach is detected", () => {
    const loan = debt.addLoan({
      lenderName: "Lender Y",
      principalAmount: 50000,
      interestRate: 0.05,
      termMonths: 24,
      startDate: "2025-01-01",
      covenants: [
        {
          name: "Current Ratio",
          description: "Must maintain current ratio >= 1.2",
          threshold: 1.2,
        },
      ],
    });

    const updated = debt.checkCovenants(loan.id, { "Current Ratio": 0.9 });
    expect(updated.covenants[0].isBreached).toBe(true);
    expect(updated.covenants[0].currentValue).toBe(0.9);
  });

  it("getPaymentSchedule returns full schedule", () => {
    const loan = debt.addLoan({
      lenderName: "L",
      principalAmount: 12000,
      interestRate: 0.12,
      termMonths: 12,
      startDate: "2025-01-01",
    });
    const schedule = debt.getPaymentSchedule(loan.id);
    expect(schedule).toHaveLength(12);
  });
});

// ---------------------------------------------------------------------------
// Grants
// ---------------------------------------------------------------------------

describe("FinanceGrants", () => {
  let grants: FinanceGrants;

  beforeEach(() => {
    _id = 0;
    grants = new FinanceGrants(makeDeps());
  });

  it("adds a grant and tracks utilization", () => {
    const grant = grants.addGrant({
      name: "Title I Grant",
      grantorName: "US Dept of Education",
      restriction: "restricted",
      totalAmount: 100000,
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      dimensions: dims,
    });
    expect(grant.id).toBeDefined();
    expect(grant.utilizedAmount).toBe(0);
    expect(grant.remainingAmount).toBe(100000);

    const util = grants.getUtilization(grant.id);
    expect(util.percent).toBe(0);
  });

  it("records and approves a drawdown", () => {
    const grant = grants.addGrant({
      name: "STEM Grant",
      grantorName: "NSF",
      restriction: "restricted",
      totalAmount: 50000,
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
    });

    const dd = grants.recordDrawdown({
      grantId: grant.id,
      requestedAmount: 20000,
      memo: "Q1 expenses",
    });
    expect(dd.status).toBe("submitted");
    expect(dd.dimensions.organizationId).toBeNull(); // inherits from grant

    const approved = grants.approveDrawdown(dd.id);
    expect(approved.status).toBe("approved");

    const updatedGrant = grants.getGrant(grant.id);
    expect(updatedGrant!.utilizedAmount).toBe(20000);
    expect(updatedGrant!.remainingAmount).toBe(30000);

    const util = grants.getUtilization(grant.id);
    expect(util.percent).toBeCloseTo(40, 0);
  });

  it("drawdown is immutable — carries transaction base fields", () => {
    const grant = grants.addGrant({
      name: "G1",
      grantorName: "Grantor",
      restriction: "unrestricted",
      totalAmount: 10000,
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
    });
    const dd = grants.recordDrawdown({
      grantId: grant.id,
      requestedAmount: 5000,
      memo: "Test",
    });
    expect(dd.reversedById).toBeNull();
    expect(dd.reversesId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Scholarships
// ---------------------------------------------------------------------------

describe("FinanceScholarships", () => {
  let scholarships: FinanceScholarships;

  beforeEach(() => {
    _id = 0;
    scholarships = new FinanceScholarships(makeDeps());
  });

  it("adds a scholarship and tracks utilization", () => {
    const s = scholarships.addScholarship({
      name: "Need-Based Aid",
      fundingSourceId: "fund-1",
      totalFunding: 200000,
      dimensions: dims,
    });
    expect(s.id).toBeDefined();
    expect(s.awardedAmount).toBe(0);
    expect(s.remainingBalance).toBe(200000);
    expect(s.status).toBe("active");
  });

  it("awards scholarship to a student and updates balance", () => {
    const s = scholarships.addScholarship({
      name: "Merit Award",
      fundingSourceId: "fund-2",
      totalFunding: 50000,
    });
    const award = scholarships.awardScholarship({
      scholarshipId: s.id,
      studentId: "student-1",
      awardAmount: 10000,
      academicPeriod: "2025-Fall",
      memo: "Merit scholarship",
    });
    expect(award.awardAmount).toBe(10000);
    expect(award.studentId).toBe("student-1");
    expect(award.reversedById).toBeNull();

    const updated = scholarships.getScholarship(s.id);
    expect(updated!.awardedAmount).toBe(10000);
    expect(updated!.remainingBalance).toBe(40000);

    const util = scholarships.getUtilization(s.id);
    expect(util.percent).toBeCloseTo(20, 0);
  });

  it("scholarship becomes exhausted when fully awarded", () => {
    const s = scholarships.addScholarship({
      name: "Small Fund",
      fundingSourceId: "fund-3",
      totalFunding: 1000,
    });
    scholarships.awardScholarship({
      scholarshipId: s.id,
      studentId: "student-2",
      awardAmount: 1000,
      academicPeriod: "2025-Spring",
      memo: "Full award",
    });
    const updated = scholarships.getScholarship(s.id);
    expect(updated!.status).toBe("exhausted");
  });

  it("throws when award exceeds remaining balance", () => {
    const s = scholarships.addScholarship({
      name: "Small",
      fundingSourceId: "f",
      totalFunding: 500,
    });
    expect(() =>
      scholarships.awardScholarship({
        scholarshipId: s.id,
        studentId: "s1",
        awardAmount: 600,
        academicPeriod: "2025",
        memo: "Over limit",
      })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tax records
// ---------------------------------------------------------------------------

describe("FinanceTax", () => {
  let tax: FinanceTax;

  beforeEach(() => {
    _id = 0;
    tax = new FinanceTax(makeDeps());
  });

  it("generates a 1099 record", () => {
    const record = tax.generate1099({
      taxYear: 2025,
      recipientId: "vendor-1",
      recipientName: "John Contractor",
      recipientTaxId: "555-66-7777",
      nonemployeeCompensation: 15000,
    });
    expect(record.id).toBeDefined();
    expect(record.type).toBe("form_1099");
    expect(record.amounts["nonemployeeCompensation"]).toBe(15000);
    expect(record.taxYear).toBe(2025);
  });

  it("generates a W2 record", () => {
    const record = tax.generateW2({
      taxYear: 2025,
      employeeId: "emp-1",
      employeeName: "Jane Teacher",
      employeeTaxId: "111-22-3333",
      grossWages: 60000,
      federalWithholding: 9000,
      stateWithholding: 3600,
    });
    expect(record.type).toBe("form_w2");
    expect(record.amounts["grossWages"]).toBe(60000);
    expect(record.amounts["federalWithholding"]).toBe(9000);
    expect(record.recipientId).toBe("emp-1");
  });

  it("listTaxRecords filters by year", () => {
    tax.generate1099({
      taxYear: 2024,
      recipientId: "v1",
      recipientName: "V1",
      nonemployeeCompensation: 5000,
    });
    tax.generateW2({
      taxYear: 2025,
      employeeId: "e1",
      employeeName: "E1",
      grossWages: 50000,
      federalWithholding: 7500,
    });
    tax.generateW2({
      taxYear: 2025,
      employeeId: "e2",
      employeeName: "E2",
      grossWages: 40000,
      federalWithholding: 6000,
    });

    expect(tax.listTaxRecords(2025)).toHaveLength(2);
    expect(tax.listTaxRecords(2024)).toHaveLength(1);
    expect(tax.listTaxRecords()).toHaveLength(3);
  });

  it("calculates total W2 wages for a year", () => {
    tax.generateW2({ taxYear: 2025, employeeId: "e1", employeeName: "E1", grossWages: 50000, federalWithholding: 5000 });
    tax.generateW2({ taxYear: 2025, employeeId: "e2", employeeName: "E2", grossWages: 40000, federalWithholding: 4000 });
    expect(tax.getTotalW2Wages(2025)).toBe(90000);
  });

  it("calculates total 1099 compensation for a year", () => {
    tax.generate1099({ taxYear: 2025, recipientId: "v1", recipientName: "V1", nonemployeeCompensation: 12000 });
    tax.generate1099({ taxYear: 2025, recipientId: "v2", recipientName: "V2", nonemployeeCompensation: 8000 });
    expect(tax.getTotal1099Compensation(2025)).toBe(20000);
  });
});

// ---------------------------------------------------------------------------
// QuickBooks export
// ---------------------------------------------------------------------------

describe("FinanceQuickBooksExport", () => {
  let qb: FinanceQuickBooksExport;
  let ar: FinanceAccountsReceivable;
  let ap: FinanceAccountsPayable;

  beforeEach(() => {
    _id = 0;
    qb = new FinanceQuickBooksExport(makeDeps());
    ar = new FinanceAccountsReceivable(makeDeps());
    ap = new FinanceAccountsPayable(makeDeps());
  });

  it("exports a customer", () => {
    const customer = qb.exportCustomer({
      id: "cust-1",
      displayName: "Springfield Academy",
      email: "billing@academy.edu",
    });
    expect(customer.id).toBe("cust-1");
    expect(customer.displayName).toBe("Springfield Academy");
    expect(customer.email).toBe("billing@academy.edu");
  });

  it("exports a vendor", () => {
    const vendor = ap.createVendor({
      name: "Office Pro",
      email: "ap@officepro.com",
      taxId: "99-1234567",
      dimensions: dims,
    });
    const qbVendor = qb.exportVendor(vendor);
    expect(qbVendor.id).toBe(vendor.id);
    expect(qbVendor.displayName).toBe("Office Pro");
    expect(qbVendor.taxId).toBe("99-1234567");
  });

  it("exports an invoice", () => {
    const inv = ar.createInvoice({
      customerId: "cust-1",
      dueDate: "2025-08-01",
      memo: "Q3 tuition",
      dimensions: dims,
      items: [{ description: "Tuition", quantity: 1, unitPrice: 4000 }],
    });
    const qbInv = qb.exportInvoice(inv);
    expect(qbInv.invoiceNumber).toBe(inv.invoiceNumber);
    expect(qbInv.totalAmount).toBe(4000);
    expect(qbInv.balance).toBe(4000);
    expect(qbInv.lines).toHaveLength(1);
  });

  it("exports a bill", () => {
    const vendor = ap.createVendor({ name: "Vendor Z", dimensions: dims });
    const bill = ap.createBill({
      vendorId: vendor.id,
      dueDate: "2025-07-01",
      memo: "Service",
      dimensions: dims,
      items: [{ description: "Consulting", quantity: 5, unitPrice: 200 }],
    });
    const qbBill = qb.exportBill(bill);
    expect(qbBill.totalAmount).toBe(1000);
    expect(qbBill.balance).toBe(1000);
  });

  it("builds a full export package", () => {
    const coa = new FinanceChartOfAccounts(makeDeps());
    const pkg = qb.exportPackage({
      accounts: coa.listAccounts(),
      customers: [{ id: "c1", displayName: "Parent 1" }],
      vendors: [],
      invoices: [],
      bills: [],
      payments: [],
      journalEntries: [],
    });
    expect(pkg.exportedAt).toBeDefined();
    expect(pkg.accounts.length).toBeGreaterThan(0);
    expect(pkg.customers).toHaveLength(1);
    expect(pkg.accounts.every((a) => typeof a.type === "string")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CPA workpapers
// ---------------------------------------------------------------------------

describe("FinanceCpaWorkpapers", () => {
  let cpa: FinanceCpaWorkpapers;

  beforeEach(() => {
    _id = 0;
    cpa = new FinanceCpaWorkpapers(makeDeps());
  });

  it("builds year-end workpapers package with all sections", () => {
    const gl = new FinanceGeneralLedger(makeDeps());
    const ar = new FinanceAccountsReceivable({ ...makeDeps(), gl });
    const ap = new FinanceAccountsPayable({ ...makeDeps(), gl });
    const banking = new FinanceBanking(makeDeps());
    const assets = new FinanceAssets(makeDeps());
    const tax = new FinanceTax(makeDeps());
    const grants = new FinanceGrants(makeDeps());
    const scholarships = new FinanceScholarships(makeDeps());
    const debt = new FinanceDebt(makeDeps());

    // Add some data
    ar.createInvoice({
      customerId: "c1",
      dueDate: "2025-12-31",
      memo: "Tuition",
      dimensions: dims,
      items: [{ description: "Tuition", quantity: 1, unitPrice: 10000 }],
    });
    const vendor = ap.createVendor({ name: "V1", dimensions: dims });
    ap.createBill({
      vendorId: vendor.id,
      dueDate: "2025-12-31",
      memo: "Bill",
      dimensions: dims,
      items: [{ description: "Service", quantity: 1, unitPrice: 2000 }],
    });
    assets.addAsset({
      name: "Computer",
      acquisitionDate: "2025-01-01",
      acquisitionCost: 5000,
      salvageValue: 500,
      usefulLifeYears: 5,
    });
    tax.generateW2({ taxYear: 2025, employeeId: "e1", employeeName: "Teacher 1", grossWages: 50000, federalWithholding: 7500 });
    const grant = grants.addGrant({ name: "G1", grantorName: "DOE", restriction: "restricted", totalAmount: 20000, periodStart: "2025-01-01", periodEnd: "2025-12-31" });
    const schol = scholarships.addScholarship({ name: "S1", fundingSourceId: "f1", totalFunding: 10000 });

    const workpapers = cpa.buildWorkpapers({
      fiscalYear: 2025,
      organizationName: "Springfield Academy",
      gl,
      ar,
      ap,
      banking,
      assets,
      tax,
      grants,
      scholarships,
      debt,
    });

    expect(workpapers.title).toContain("FY 2025");
    expect(workpapers.fiscalYear).toBe(2025);
    expect(workpapers.generatedAt).toBeDefined();
    expect(workpapers.sections["trialBalance"]).toBeDefined();
    expect(workpapers.sections["arAging"]).toBeDefined();
    expect(workpapers.sections["apAging"]).toBeDefined();
    expect(workpapers.sections["depreciationSchedule"]).toBeDefined();
    expect(workpapers.sections["payrollSummary"]).toBeDefined();
    expect(workpapers.sections["grantSchedule"]).toBeDefined();
    expect(workpapers.sections["scholarshipSchedule"]).toBeDefined();
  });

  it("workpapers work with minimal services", () => {
    const workpapers = cpa.buildWorkpapers({ fiscalYear: 2025 });
    expect(workpapers.title).toContain("2025");
    expect(Object.keys(workpapers.sections)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Executive intelligence / KPIs
// ---------------------------------------------------------------------------

describe("FinanceExecutiveIntelligence", () => {
  let exec: FinanceExecutiveIntelligence;
  let snapshot: FinancialSnapshot;

  beforeEach(() => {
    _id = 0;
    exec = new FinanceExecutiveIntelligence(makeDeps());
    const zeroAging = {
      current: { amount: 0, currency: "USD" },
      days30: { amount: 0, currency: "USD" },
      days60: { amount: 0, currency: "USD" },
      days90: { amount: 0, currency: "USD" },
      days120Plus: { amount: 0, currency: "USD" },
      total: { amount: 0, currency: "USD" },
    };
    snapshot = {
      asOfDate: "2025-06-15",
      currency: "USD",
      totalRevenue: 2000000,
      totalExpenses: 1600000,
      grossProfit: 400000,
      ebitda: 350000,
      netIncome: 250000,
      totalAssets: 5000000,
      currentAssets: 1000000,
      cash: 600000,
      accountsReceivable: 300000,
      inventory: 50000,
      totalLiabilities: 2000000,
      currentLiabilities: 400000,
      accountsPayable: 150000,
      shortTermDebt: 100000,
      longTermDebt: 1500000,
      totalEquity: 3000000,
      payrollExpense: 900000,
      interestExpense: 75000,
      depreciationAmortization: 50000,
      tuitionRevenue: 1500000,
      grantRevenue: 300000,
      instructionExpense: 700000,
      administrativeExpense: 400000,
      facilityExpense: 300000,
      fundraisingExpense: 100000,
      priorPeriodRevenue: 1800000,
      priorPeriodExpenses: 1500000,
      budgetedRevenue: 1900000,
      budgetedExpenses: 1550000,
      arAging: zeroAging,
      apAging: zeroAging,
      monthlyBurnRate: 133333,
      overdueReceivables: 30000,
      totalReceivables: 300000,
      activeVendorCount: 20,
      criticalVendorCount: 2,
    };
  });

  it("calculates EBITDA from snapshot", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.ebitda).toBe(350000);
  });

  it("calculates operating margin", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.operatingMargin).toBeCloseTo(20, 0); // (2M-1.6M)/2M = 20%
  });

  it("calculates cash runway days", () => {
    const kpis = exec.calculateKPIs(snapshot);
    // 600000 / (133333/30) ≈ 135 days
    expect(kpis.cashRunwayDays).toBeGreaterThan(100);
  });

  it("calculates current ratio and quick ratio", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.currentRatio).toBeCloseTo(2.5, 1); // 1M/400K
    expect(kpis.quickRatio).toBeCloseTo(2.375, 1); // (1M-50K)/400K
  });

  it("calculates revenue and expense growth", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.revenueGrowth).toBeCloseTo(11.1, 0); // (2M-1.8M)/1.8M
    expect(kpis.expenseGrowth).toBeCloseTo(6.7, 0); // (1.6M-1.5M)/1.5M
  });

  it("calculates grant dependency", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.grantDependency).toBeCloseTo(15, 0); // 300K/2M = 15%
  });

  it("calculates expense ratios", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.payrollPercent).toBeCloseTo(56.25, 0);
    expect(kpis.instructionPercent).toBeCloseTo(43.75, 0);
  });

  it("calculates budget variance", () => {
    const kpis = exec.calculateKPIs(snapshot);
    // (2M-1.9M)/1.9M = 5.26% above budget
    expect(kpis.budgetVariance).toBeCloseTo(5.26, 0);
  });

  it("enrollment revenue equals tuition revenue", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.enrollmentRevenue).toBe(1500000);
  });

  it("assesses liquidity risk as low when runway is good", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.liquidityRisk).toBe("low");
  });

  it("assesses collections risk from overdue receivables", () => {
    const kpis = exec.calculateKPIs(snapshot);
    // 30K/300K = 10% overdue → medium
    expect(["low", "medium"]).toContain(kpis.collectionsRisk);
  });

  it("assesses vendor risk", () => {
    const kpis = exec.calculateKPIs(snapshot);
    // 2 critical out of 20 active = 10% → medium
    expect(["low", "medium"]).toContain(kpis.vendorRisk);
  });

  it("assesses grant risk from grant dependency", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.grantRisk).toBe("low"); // 15% dependency = low
  });

  it("getRiskSummary returns sorted risk areas", () => {
    const risks = exec.getRiskSummary(snapshot);
    expect(risks).toHaveLength(4);
    const levels: Array<string> = ["critical", "high", "medium", "low"];
    // Each subsequent level should be >= the previous in severity
    for (let i = 0; i < risks.length - 1; i++) {
      expect(levels.indexOf(risks[i].level)).toBeLessThanOrEqual(
        levels.indexOf(risks[i + 1].level)
      );
    }
  });

  it("forecastAccuracy approaches 100 for near-budget performance", () => {
    const kpis = exec.calculateKPIs(snapshot);
    expect(kpis.forecastAccuracy).toBeGreaterThan(90);
  });
});

// ---------------------------------------------------------------------------
// FinanceEngine (façade)
// ---------------------------------------------------------------------------

describe("FinanceEngine — createEnterpriseFinance", () => {
  it("creates all services without errors", () => {
    const engine = createEnterpriseFinance({ createId: testId, now: testNow });
    expect(engine.audit).toBeDefined();
    expect(engine.gl).toBeDefined();
    expect(engine.ar).toBeDefined();
    expect(engine.ap).toBeDefined();
    expect(engine.banking).toBeDefined();
    expect(engine.payments).toBeDefined();
    expect(engine.cash).toBeDefined();
    expect(engine.budgeting).toBeDefined();
    expect(engine.assets).toBeDefined();
    expect(engine.debt).toBeDefined();
    expect(engine.grants).toBeDefined();
    expect(engine.scholarships).toBeDefined();
    expect(engine.tax).toBeDefined();
    expect(engine.quickbooks).toBeDefined();
    expect(engine.cpa).toBeDefined();
    expect(engine.executive).toBeDefined();
  });

  it("runCycle processes all modules and records audit events", () => {
    const engine = createEnterpriseFinance({ createId: testId, now: testNow });
    const result = engine.runCycle();
    expect(result.cycleId).toBeDefined();
    expect(result.ranAt).toBe("2025-06-15T00:00:00.000Z");
    expect(result.modulesProcessed).toHaveLength(16);
    expect(result.auditEvents).toBe(16);
    expect(engine.audit.count()).toBe(16);
  });

  it("services are wired so AR invoice posts to GL", () => {
    const engine = createEnterpriseFinance({ createId: testId, now: testNow });
    const journalsBefore = engine.gl.listJournals().length;

    engine.ar.createInvoice({
      customerId: "cust-1",
      dueDate: "2025-08-01",
      memo: "Tuition",
      dimensions: dims,
      items: [{ description: "Tuition", quantity: 1, unitPrice: 5000 }],
    });

    const journalsAfter = engine.gl.listJournals().length;
    expect(journalsAfter).toBe(journalsBefore + 1);
  });

  it("audit trail records invoice/payment/journal/reversal events", () => {
    const engine = createEnterpriseFinance({ createId: testId, now: testNow });

    // Invoice
    engine.audit.record({
      kind: "invoice",
      entityId: "inv-1",
      entityType: "FinanceInvoice",
      action: "create",
      dimensions: dims,
    });

    // Payment
    engine.audit.record({
      kind: "payment",
      entityId: "pmt-1",
      entityType: "FinancePayment",
      action: "record",
      dimensions: dims,
    });

    // Journal
    const cashId = engine.gl.chartOfAccounts.findByCode("1000")!.id;
    const revId = engine.gl.chartOfAccounts.findByCode("4000")!.id;
    const je = engine.gl.postJournal({
      memo: "Test",
      dimensions: dims,
      postings: [
        { accountId: cashId, debit: 1000, credit: 0 },
        { accountId: revId, debit: 0, credit: 1000 },
      ],
    });
    engine.audit.record({
      kind: "journal",
      entityId: je.id,
      entityType: "FinanceJournalEntry",
      action: "post",
      dimensions: dims,
    });

    // Reversal
    const reversal = engine.gl.reverseJournal(je.id, "Reverse test");
    engine.audit.record({
      kind: "reversal",
      entityId: reversal.id,
      entityType: "FinanceJournalEntry",
      action: "reverse",
      dimensions: dims,
      details: { originalId: je.id },
    });

    // Export
    engine.audit.record({
      kind: "export",
      entityId: "export-1",
      entityType: "QBExportPackage",
      action: "export",
      dimensions: dims,
    });

    expect(engine.audit.listByKind("invoice")).toHaveLength(1);
    expect(engine.audit.listByKind("payment")).toHaveLength(1);
    expect(engine.audit.listByKind("journal")).toHaveLength(1);
    expect(engine.audit.listByKind("reversal")).toHaveLength(1);
    expect(engine.audit.listByKind("export")).toHaveLength(1);
  });
});
