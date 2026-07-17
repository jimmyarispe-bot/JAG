/**
 * Plaid entity object types synchronized into JAG.
 * Plaid is the banking connectivity provider; FIs remain systems of record.
 */

export const PLAID_OBJECT_TYPES = [
  "institution",
  "account",
  "transaction",
  "transfer",
  "balance",
  "liability",
  "holding",
  "security",
  "investment_performance",
  "identity",
] as const;

export type PlaidObjectType = (typeof PLAID_OBJECT_TYPES)[number];

export type PlaidEnvironment = "sandbox" | "development" | "production";

export type PlaidRawEntity = {
  id: string;
  objectType: PlaidObjectType;
  organizationId: string;
  institutionId: string | null;
  accountId: string | null;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type PlaidCanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: "plaid";
  syncedAt: string;
  version: number;
  institutionId: string | null;
  accountId: string | null;
  objectType: PlaidObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};
