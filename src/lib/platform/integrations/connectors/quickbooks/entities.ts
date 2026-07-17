/**
 * QuickBooks Online entity object types synchronized into JAG.
 * QuickBooks remains the accounting system of record.
 */

export const QUICKBOOKS_OBJECT_TYPES = [
  "company",
  "account",
  "customer",
  "vendor",
  "item",
  "invoice",
  "bill",
  "payment",
  "bill_payment",
  "journal_entry",
  "expense",
  "deposit",
  "transfer",
  "credit_memo",
  "budget",
  "class",
  "location",
  "attachment",
] as const;

export type QuickBooksObjectType = (typeof QUICKBOOKS_OBJECT_TYPES)[number];

export type QuickBooksEnvironment = "sandbox" | "production";

export type QuickBooksRawEntity = {
  id: string;
  objectType: QuickBooksObjectType;
  organizationId: string;
  companyId: string;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type QuickBooksCanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: "quickbooks";
  syncedAt: string;
  version: number;
  companyId: string;
  objectType: QuickBooksObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};
