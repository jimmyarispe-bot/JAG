import type {
  FinanceKgKind,
  FinanceObjectType,
} from "@/lib/platform/integrations/connectors/finance/entities";

/** Canonical strings aligned with B4 finance maps + Sprint 077 KG kinds. */
export const CANONICAL_TYPE: Record<FinanceObjectType, string> = {
  customer: "crm.contact",
  vendor: "crm.vendor",
  bill: "finance.bill",
  invoice: "finance.invoice",
  payment: "finance.payment",
  account: "finance.account",
  refund: "finance.refund",
  subscription: "finance.subscription",
  transaction: "finance.transaction",
  order: "commerce.order",
  catalog_item: "commerce.catalog_item",
  balance: "finance.balance",
  cash_flow: "finance.cash_flow",
};

export const KG_KIND_FOR_OBJECT: Partial<Record<FinanceObjectType, FinanceKgKind>> = {
  customer: "Customer",
  vendor: "Vendor",
  bill: "Invoice",
  invoice: "Invoice",
  payment: "Payment",
  account: "Account",
  refund: "Payment",
  subscription: "Subscription",
  transaction: "FinancialTransaction",
  order: "FinancialTransaction",
  catalog_item: "FinancialTransaction",
  balance: "Account",
  cash_flow: "FinancialTransaction",
};

export function financeCanonicalType(objectType: string): string {
  return CANONICAL_TYPE[objectType as FinanceObjectType] ?? `finance.${objectType}`;
}

export function financeKgKind(objectType: string): FinanceKgKind | null {
  return KG_KIND_FOR_OBJECT[objectType as FinanceObjectType] ?? null;
}
