/**
 * Deterministic demo SoR catalogs for QuickBooks, Stripe, Square, and Plaid.
 */

import type {
  FinanceObjectType,
  FinanceProvider,
  FinanceRawEntity,
} from "@/lib/platform/integrations/connectors/finance/entities";

function entity(
  provider: FinanceProvider,
  objectType: FinanceObjectType,
  id: string,
  organizationId: string,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): FinanceRawEntity {
  return {
    id,
    objectType,
    provider,
    organizationId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? payload.displayName ?? id },
  };
}

export function buildQuickBooksCatalog(
  organizationId = "org-finance-demo"
): FinanceRawEntity[] {
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";
  return [
    entity("quickbooks", "customer", "qb-cust-1", organizationId, 1, {
      name: "Northside Family",
      balance: 4200,
      email: "family@example.edu",
    }, earlier),
    entity("quickbooks", "customer", "qb-cust-2", organizationId, 1, {
      name: "West Campus Donor",
      balance: 0,
      email: "donor@example.org",
    }, earlier),
    entity("quickbooks", "vendor", "qb-vend-1", organizationId, 1, {
      name: "Campus Supplies Co",
      balance: 1800,
    }, earlier),
    entity("quickbooks", "vendor", "qb-vend-2", organizationId, 1, {
      name: "Facilities Partners",
      balance: 950,
    }, earlier),
    entity("quickbooks", "account", "qb-acct-cash", organizationId, 1, {
      name: "Operating Cash",
      accountType: "Bank",
      balance: 185000,
    }, now),
    entity("quickbooks", "account", "qb-acct-ar", organizationId, 1, {
      name: "Accounts Receivable",
      accountType: "Accounts Receivable",
      balance: 42000,
    }, now),
    entity("quickbooks", "account", "qb-acct-ap", organizationId, 1, {
      name: "Accounts Payable",
      accountType: "Accounts Payable",
      balance: 27500,
    }, now),
    entity("quickbooks", "invoice", "qb-inv-1", organizationId, 1, {
      name: "Tuition Q3",
      customerId: "qb-cust-1",
      totalAmt: 12000,
      balance: 4200,
      status: "OVERDUE",
    }, earlier),
    entity("quickbooks", "invoice", "qb-inv-2", organizationId, 1, {
      name: "Activity fees",
      customerId: "qb-cust-2",
      totalAmt: 800,
      balance: 0,
      status: "PAID",
    }, now),
    entity("quickbooks", "bill", "qb-bill-1", organizationId, 1, {
      name: "July supplies",
      vendorId: "qb-vend-1",
      totalAmt: 1800,
      balance: 1800,
      status: "OPEN",
    }, earlier),
    entity("quickbooks", "bill", "qb-bill-2", organizationId, 1, {
      name: "HVAC service",
      vendorId: "qb-vend-2",
      totalAmt: 950,
      balance: 950,
      status: "OVERDUE",
    }, mid(now)),
    entity("quickbooks", "payment", "qb-pay-1", organizationId, 1, {
      name: "Tuition payment",
      customerId: "qb-cust-1",
      invoiceId: "qb-inv-1",
      totalAmt: 7800,
      accountId: "qb-acct-cash",
    }, now),
  ];
}

function mid(now: string): string {
  return now.replace("16:00", "10:00");
}

export function buildStripeCatalog(organizationId = "org-finance-demo"): FinanceRawEntity[] {
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";
  return [
    entity("stripe", "customer", "stripe-cust-1", organizationId, 1, {
      name: "Enrollment Portal Family",
      email: "enroll@example.edu",
    }, earlier),
    entity("stripe", "customer", "stripe-cust-2", organizationId, 1, {
      name: "Alumni Association",
      email: "alumni@example.edu",
    }, earlier),
    entity("stripe", "payment", "stripe-pay-1", organizationId, 1, {
      name: "Application fee",
      customerId: "stripe-cust-1",
      totalAmt: 150,
      status: "succeeded",
      currency: "usd",
    }, now),
    entity("stripe", "payment", "stripe-pay-2", organizationId, 1, {
      name: "Monthly tuition",
      customerId: "stripe-cust-1",
      subscriptionId: "stripe-sub-1",
      totalAmt: 1850,
      status: "succeeded",
      currency: "usd",
    }, earlier),
    entity("stripe", "refund", "stripe-ref-1", organizationId, 1, {
      name: "Partial application refund",
      paymentId: "stripe-pay-1",
      customerId: "stripe-cust-1",
      totalAmt: 50,
      status: "succeeded",
    }, now),
    entity("stripe", "subscription", "stripe-sub-1", organizationId, 1, {
      name: "Tuition subscription",
      customerId: "stripe-cust-1",
      status: "active",
      mrr: 1850,
      interval: "month",
    }, earlier),
    entity("stripe", "subscription", "stripe-sub-2", organizationId, 1, {
      name: "Aftercare plan",
      customerId: "stripe-cust-2",
      status: "active",
      mrr: 320,
      interval: "month",
    }, now),
    entity("stripe", "invoice", "stripe-inv-1", organizationId, 1, {
      name: "July tuition invoice",
      customerId: "stripe-cust-1",
      subscriptionId: "stripe-sub-1",
      totalAmt: 1850,
      balance: 0,
      status: "PAID",
    }, earlier),
  ];
}

export function buildSquareCatalog(organizationId = "org-finance-demo"): FinanceRawEntity[] {
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";
  return [
    entity("square", "customer", "sq-cust-1", organizationId, 1, {
      name: "Walk-in Cafe Guest",
      email: "guest@example.com",
    }, earlier),
    entity("square", "catalog_item", "sq-cat-1", organizationId, 1, {
      name: "Campus Hoodie",
      price: 48,
      category: "Merch",
    }, earlier),
    entity("square", "catalog_item", "sq-cat-2", organizationId, 1, {
      name: "Coffee",
      price: 3.5,
      category: "Cafe",
    }, earlier),
    entity("square", "order", "sq-ord-1", organizationId, 1, {
      name: "Merch order",
      customerId: "sq-cust-1",
      totalAmt: 48,
      status: "COMPLETED",
    }, earlier),
    entity("square", "order", "sq-ord-2", organizationId, 1, {
      name: "Cafe tickets",
      totalAmt: 42,
      status: "COMPLETED",
    }, now),
    entity("square", "transaction", "sq-txn-1", organizationId, 1, {
      name: "Card sale",
      orderId: "sq-ord-1",
      customerId: "sq-cust-1",
      totalAmt: 48,
      status: "COMPLETED",
    }, earlier),
    entity("square", "transaction", "sq-txn-2", organizationId, 1, {
      name: "Cafe batch",
      orderId: "sq-ord-2",
      totalAmt: 42,
      status: "COMPLETED",
    }, now),
    entity("square", "payment", "sq-pay-1", organizationId, 1, {
      name: "POS payment",
      customerId: "sq-cust-1",
      totalAmt: 48,
      status: "COMPLETED",
    }, earlier),
  ];
}

export function buildPlaidCatalog(organizationId = "org-finance-demo"): FinanceRawEntity[] {
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";
  return [
    entity("plaid", "account", "plaid-acct-ops", organizationId, 1, {
      name: "Operating Checking",
      accountType: "depository",
      subtype: "checking",
      balance: 162400,
      available: 158000,
    }, now),
    entity("plaid", "account", "plaid-acct-reserve", organizationId, 1, {
      name: "Reserve Savings",
      accountType: "depository",
      subtype: "savings",
      balance: 92000,
      available: 92000,
    }, now),
    entity("plaid", "balance", "plaid-bal-ops", organizationId, 1, {
      name: "Operating balance",
      accountId: "plaid-acct-ops",
      current: 162400,
      available: 158000,
      pending: 4400,
    }, now),
    entity("plaid", "balance", "plaid-bal-reserve", organizationId, 1, {
      name: "Reserve balance",
      accountId: "plaid-acct-reserve",
      current: 92000,
      available: 92000,
      pending: 0,
    }, now),
    entity("plaid", "transaction", "plaid-txn-1", organizationId, 1, {
      name: "Payroll ACH",
      accountId: "plaid-acct-ops",
      totalAmt: -48000,
      category: "payroll",
    }, earlier),
    entity("plaid", "transaction", "plaid-txn-2", organizationId, 1, {
      name: "Tuition ACH inbound",
      accountId: "plaid-acct-ops",
      totalAmt: 36000,
      category: "income",
    }, now),
    entity("plaid", "transaction", "plaid-txn-3", organizationId, 1, {
      name: "Vendor wire",
      accountId: "plaid-acct-ops",
      totalAmt: -6200,
      category: "transfer",
    }, now),
    entity("plaid", "cash_flow", "plaid-cf-1", organizationId, 1, {
      name: "30-day cash flow",
      inflows: 92000,
      outflows: 78000,
      net: 14000,
      burnRateMonthly: 52000,
      forecast30d: 170000,
    }, now),
  ];
}

export function catalogForProvider(
  provider: FinanceProvider,
  organizationId?: string
): FinanceRawEntity[] {
  if (provider === "quickbooks") return buildQuickBooksCatalog(organizationId);
  if (provider === "stripe") return buildStripeCatalog(organizationId);
  if (provider === "square") return buildSquareCatalog(organizationId);
  return buildPlaidCatalog(organizationId);
}

export function objectTypesForProvider(provider: FinanceProvider): FinanceObjectType[] {
  if (provider === "quickbooks") {
    return ["customer", "vendor", "bill", "invoice", "payment", "account"];
  }
  if (provider === "stripe") {
    return ["customer", "payment", "refund", "subscription", "invoice"];
  }
  if (provider === "square") {
    return ["customer", "transaction", "order", "catalog_item", "payment"];
  }
  return ["account", "transaction", "balance", "cash_flow"];
}
