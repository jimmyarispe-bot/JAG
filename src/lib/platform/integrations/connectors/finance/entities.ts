/**
 * Financial Intelligence Connectors (Sprint 077) — shared entity types.
 */

export const FINANCE_PROVIDERS = ["quickbooks", "stripe", "square", "plaid"] as const;
export type FinanceProvider = (typeof FINANCE_PROVIDERS)[number];

/** Provider-scoped object types normalized by the finance package. */
export const FINANCE_OBJECT_TYPES = [
  // QuickBooks
  "customer",
  "vendor",
  "bill",
  "invoice",
  "payment",
  "account",
  // Stripe
  "refund",
  "subscription",
  // Square
  "transaction",
  "order",
  "catalog_item",
  // Plaid
  "balance",
  "cash_flow",
] as const;

export type FinanceObjectType = (typeof FINANCE_OBJECT_TYPES)[number];

/** Knowledge Graph canonical entity kinds (Sprint 077). */
export const FINANCE_KG_KINDS = [
  "FinancialTransaction",
  "Customer",
  "Vendor",
  "Account",
  "Payment",
  "Invoice",
  "Subscription",
] as const;

export type FinanceKgKind = (typeof FINANCE_KG_KINDS)[number];

export type FinanceRawEntity = {
  id: string;
  objectType: FinanceObjectType;
  provider: FinanceProvider;
  organizationId: string;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type FinanceCanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: FinanceProvider;
  syncedAt: string;
  version: number;
  objectType: FinanceObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};
