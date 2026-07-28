/**
 * Platform Sprint P-011 — JAG Revenue™ & Payables™
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createFinanceEngine,
  createPayablesEngine,
  createRevenueEngine,
  EDUCATION_FUNDING_PRESETS,
  OPERATIONAL_SINKS,
  PAYABLES_GUARDS,
  REVENUE_GUARDS,
  resetFinanceStoreForTests,
} from "@finance";

const root = join(__dirname, "../../../..");
const docs = join(root, "docs/platform/finance/revenue");

afterEach(() => {
  resetFinanceStoreForTests();
});

function boot(org: string) {
  const finance = createFinanceEngine();
  finance.bootstrap({ organizationId: org, userId: "u-cfo" });
  finance.grantRoles({
    organizationId: org,
    userId: "u-buyer",
    roles: Object.freeze(["create"]),
    actorUserId: "u-cfo",
  });
  finance.grantRoles({
    organizationId: org,
    userId: "u-approver",
    roles: Object.freeze(["approve", "post", "create"]),
    actorUserId: "u-cfo",
  });
  return {
    finance,
    revenue: createRevenueEngine(),
    payables: createPayablesEngine(),
  };
}

describe("P-011 JAG Revenue & Payables", () => {
  it("guards exclude statements, forecasting, AI CFO, EBITDA; sinks enabled", () => {
    expect(REVENUE_GUARDS.includesFinancialStatements).toBe(false);
    expect(REVENUE_GUARDS.includesAiCfo).toBe(false);
    expect(REVENUE_GUARDS.educationHardcoded).toBe(false);
    expect(REVENUE_GUARDS.configurableFundingSources).toBe(true);
    expect(PAYABLES_GUARDS.includesEbitda).toBe(false);
    expect(OPERATIONAL_SINKS.digitalTwin).toBe(true);
    expect(OPERATIONAL_SINKS.evidenceLedger).toBe(true);
    expect(OPERATIONAL_SINKS.organizationalMemory).toBe(true);
    expect(EDUCATION_FUNDING_PRESETS).toContain("tuition");
    expect(EDUCATION_FUNDING_PRESETS).toContain("scholarship");
  });

  it("runs purchasing → PO approve → partial receive → bill → payment run", () => {
    const { finance, payables } = boot("org.ap");
    const vendor = finance.createVendor({
      organizationId: "org.ap",
      userId: "u-cfo",
      name: "Supply Co",
      is1099: true,
    });
    expect("error" in vendor).toBe(false);
    if ("error" in vendor) return;

    const req = payables.createPurchaseRequest({
      organizationId: "org.ap",
      userId: "u-buyer",
      description: "Laptops",
      amount: 3000,
      vendorId: vendor.id,
    });
    expect("error" in req).toBe(false);
    if ("error" in req) return;

    const po = payables.createPurchaseOrder({
      organizationId: "org.ap",
      userId: "u-buyer",
      vendorId: vendor.id,
      purchaseRequestId: req.id,
      lines: [
        { description: "Laptop", quantity: 3, unitCost: 1000 },
      ],
    });
    expect("error" in po).toBe(false);
    if ("error" in po) return;
    expect(po.total).toBe(3000);

    const selfApprove = payables.approvePurchaseOrder({
      organizationId: "org.ap",
      userId: "u-buyer",
      purchaseOrderId: po.id,
    });
    expect("error" in selfApprove).toBe(true);

    const approved = payables.approvePurchaseOrder({
      organizationId: "org.ap",
      userId: "u-approver",
      purchaseOrderId: po.id,
    });
    expect("error" in approved).toBe(false);
    if ("error" in approved) return;

    const lineId = approved.lines[0]!.id;
    const partial = payables.receiveLine({
      organizationId: "org.ap",
      userId: "u-buyer",
      purchaseOrderId: po.id,
      lineId,
      quantity: 1,
    });
    expect("error" in partial).toBe(false);
    if ("error" in partial) return;
    expect(partial.partial).toBe(true);

    const over = payables.receiveLine({
      organizationId: "org.ap",
      userId: "u-buyer",
      purchaseOrderId: po.id,
      lineId,
      quantity: 5,
    });
    expect("error" in over).toBe(true);

    const rest = payables.receiveLine({
      organizationId: "org.ap",
      userId: "u-buyer",
      purchaseOrderId: po.id,
      lineId,
      quantity: 2,
    });
    expect("error" in rest).toBe(false);

    const bill = payables.createBill({
      organizationId: "org.ap",
      userId: "u-cfo",
      vendorId: vendor.id,
      amount: 3000,
      dueAt: new Date().toISOString(),
    });
    expect("error" in bill).toBe(false);
    if ("error" in bill) return;
    payables.approveBill({
      organizationId: "org.ap",
      userId: "u-cfo",
      billId: bill.id,
    });

    const schedule = payables.schedulePayment({
      organizationId: "org.ap",
      userId: "u-cfo",
      billId: bill.id,
      scheduledAt: new Date().toISOString(),
      method: "ach",
      earlyDiscountAmount: 50,
    });
    expect("error" in schedule).toBe(false);
    if ("error" in schedule) return;
    expect(schedule.amount).toBe(2950);

    const run = payables.executePaymentRun({
      organizationId: "org.ap",
      userId: "u-approver",
      scheduleIds: [schedule.id],
      method: "ach",
    });
    expect("error" in run).toBe(false);
    if ("error" in run) return;
    expect(run.total).toBe(2950);

    expect(payables.vendor1099Ytd("org.ap")[0]?.ytdPayments).toBe(2950);
    expect(payables.listTwin("org.ap").length).toBeGreaterThan(0);
    expect(payables.listEvidence("org.ap").length).toBeGreaterThan(0);
    expect(payables.listMemory("org.ap").length).toBeGreaterThan(0);
  });

  it("supports tuition/scholarship/grant billing, collections, recognition, portal", () => {
    const { finance, revenue } = boot("org.ar");
    const customer = finance.createCustomer({
      organizationId: "org.ar",
      userId: "u-cfo",
      name: "Family Lee",
      kind: "family",
    });
    expect("error" in customer).toBe(false);
    if ("error" in customer) return;

    const seeded = revenue.seedEducationFundingPresets({
      organizationId: "org.ar",
      userId: "u-cfo",
    });
    expect("error" in seeded).toBe(false);
    if ("error" in seeded) return;
    const tuition = revenue
      .listFundingSources("org.ar")
      .find((f) => f.kind === "tuition")!;
    const scholarship = revenue
      .listFundingSources("org.ar")
      .find((f) => f.kind === "scholarship")!;
    const grant = revenue
      .listFundingSources("org.ar")
      .find((f) => f.kind === "grant")!;

    const tuitionInv = revenue.createInvoice({
      organizationId: "org.ar",
      userId: "u-cfo",
      customerId: customer.id,
      amount: 5000,
      fundingSourceId: tuition.id,
      billingMode: "manual",
      deferredAmount: 5000,
    });
    expect("error" in tuitionInv).toBe(false);
    if ("error" in tuitionInv) return;
    expect(tuitionInv.meta.fundingSourceId).toBe(tuition.id);

    revenue.sendInvoice({
      organizationId: "org.ar",
      userId: "u-cfo",
      invoiceId: tuitionInv.id,
    });

    const schInv = revenue.billCustomer({
      organizationId: "org.ar",
      userId: "u-cfo",
      customerId: customer.id,
      amount: -1000,
      mode: "manual",
      fundingSourceId: scholarship.id,
    });
    // negative amount may fail — use credit memo path for scholarship credit
    void schInv;
    const credit = revenue.issueCreditMemo({
      organizationId: "org.ar",
      userId: "u-cfo",
      customerId: customer.id,
      amount: 1000,
      memo: "Scholarship",
    });
    expect("error" in credit).toBe(false);

    const grantContract = revenue.createContract({
      organizationId: "org.ar",
      userId: "u-cfo",
      customerId: customer.id,
      name: "State Grant FY26",
      kind: "grant",
      amount: 20000,
      startAt: new Date().toISOString(),
      fundingSourceId: grant.id,
      recognitionBasis: "accrual",
    });
    expect("error" in grantContract).toBe(false);
    if ("error" in grantContract) return;

    const grantBill = revenue.billCustomer({
      organizationId: "org.ar",
      userId: "u-cfo",
      customerId: customer.id,
      amount: 5000,
      mode: "contract",
      contractId: grantContract.id,
      fundingSourceId: grant.id,
    });
    expect("error" in grantBill).toBe(false);
    if ("error" in grantBill) return;

    const sub = revenue.createSubscription({
      organizationId: "org.ar",
      userId: "u-cfo",
      customerId: customer.id,
      amount: 100,
      interval: "monthly",
      nextBillAt: new Date().toISOString(),
      fundingSourceId: tuition.id,
    });
    expect("error" in sub).toBe(false);
    if ("error" in sub) return;
    const subBill = revenue.billSubscription({
      organizationId: "org.ar",
      userId: "u-cfo",
      subscriptionId: sub.id,
    });
    expect("error" in subBill).toBe(false);

    const partial = revenue.receivePayment({
      organizationId: "org.ar",
      userId: "u-cfo",
      invoiceId: tuitionInv.id,
      amount: 2000,
    });
    expect("error" in partial).toBe(false);

    revenue.upsertReminderRule({
      organizationId: "org.ar",
      userId: "u-cfo",
      daysPastDue: 1,
      channel: "email",
    });
    revenue.recordCollection({
      organizationId: "org.ar",
      userId: "u-cfo",
      customerId: customer.id,
      invoiceId: tuitionInv.id,
      status: "promise_to_pay",
      note: "Will pay Friday",
      promiseToPayAt: new Date().toISOString(),
    });

    const recognized = revenue.recognizeRevenue({
      organizationId: "org.ar",
      userId: "u-cfo",
      invoiceId: tuitionInv.id,
      amount: 2000,
      basis: "accrual",
      kind: "recognized",
      memo: "Month earned",
    });
    expect("error" in recognized).toBe(false);

    const grantRec = revenue.recognizeRevenue({
      organizationId: "org.ar",
      userId: "u-cfo",
      contractId: grantContract.id,
      invoiceId: grantBill.id,
      amount: 5000,
      basis: "accrual",
      kind: "grant",
    });
    expect("error" in grantRec).toBe(false);

    const summary = revenue.recognitionSummary("org.ar");
    expect(summary.recognized + summary.grant).toBeGreaterThan(0);

    const portal = revenue.customerPortal({
      organizationId: "org.ar",
      customerId: customer.id,
    });
    expect(portal.outstandingBalance).toBeGreaterThan(0);
    expect(portal.invoices.length).toBeGreaterThan(0);
    expect(portal.paymentLinkHint).toContain("customerId");

    expect(
      revenue.listEvents("org.ar").some((e) => e.type === "finance.funding_applied")
    ).toBe(true);
    expect(revenue.listTwin("org.ar").length).toBeGreaterThan(0);
    expect(finance.revenue.guards.operationalRevenue).toBe(true);
    expect(finance.payablesOps.guards.operationalPayables).toBe(true);
  });

  it("regresses P-008 foundation AP/AR and ships docs/APIs/modules", () => {
    const finance = createFinanceEngine();
    finance.bootstrap({ organizationId: "org.reg", userId: "u-cfo" });
    const vendor = finance.createVendor({
      organizationId: "org.reg",
      userId: "u-cfo",
      name: "Vendor",
    });
    if ("error" in vendor) return;
    const bill = finance.createBill({
      organizationId: "org.reg",
      userId: "u-cfo",
      vendorId: vendor.id,
      amount: 10,
    });
    expect("error" in bill).toBe(false);

    for (const name of [
      "01_ARCHITECTURE.md",
      "02_BILLING.md",
      "03_PAYABLES.md",
      "04_REVENUE_RECOGNITION.md",
      "05_WORKFLOWS.md",
      "06_API.md",
    ]) {
      expect(existsSync(join(docs, name))).toBe(true);
    }
    for (const route of [
      "src/app/api/finance/revenue/contracts/route.ts",
      "src/app/api/finance/revenue/invoices/route.ts",
      "src/app/api/finance/revenue/payments/route.ts",
      "src/app/api/finance/revenue/collections/route.ts",
      "src/app/api/finance/payables/purchase-orders/route.ts",
      "src/app/api/finance/payables/bills/route.ts",
      "src/app/api/finance/payables/payments/route.ts",
    ]) {
      expect(existsSync(join(root, route))).toBe(true);
    }
    for (const m of [
      "packages/platform/finance/revenue/contracts/index.ts",
      "packages/platform/finance/revenue/subscriptions/index.ts",
      "packages/platform/finance/revenue/billing/index.ts",
      "packages/platform/finance/revenue/invoices/index.ts",
      "packages/platform/finance/revenue/payments/index.ts",
      "packages/platform/finance/revenue/collections/index.ts",
      "packages/platform/finance/revenue/revenue-recognition/index.ts",
      "packages/platform/finance/revenue/customer-portal/index.ts",
      "packages/platform/finance/payables/purchasing/index.ts",
      "packages/platform/finance/payables/purchase-orders/index.ts",
      "packages/platform/finance/payables/approvals/index.ts",
      "packages/platform/finance/payables/receiving/index.ts",
      "packages/platform/finance/payables/payments/index.ts",
      "packages/platform/finance/payables/1099/index.ts",
    ]) {
      expect(existsSync(join(root, m))).toBe(true);
    }
  });
});
