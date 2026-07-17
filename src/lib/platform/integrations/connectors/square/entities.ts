/**
 * Square entity object types synchronized into JAG.
 * Square remains the payment system of record.
 */

export const SQUARE_OBJECT_TYPES = [
  "payment",
  "refund",
  "deposit",
  "fee",
  "tip",
  "tax",
  "customer",
  "customer_group",
  "catalog_item",
  "catalog_category",
  "catalog_variation",
  "order",
  "order_line_item",
  "invoice",
  "subscription",
  "gift_card",
  "employee",
  "location",
  "device",
  "register",
] as const;

export type SquareObjectType = (typeof SQUARE_OBJECT_TYPES)[number];

export type SquareEnvironment = "sandbox" | "production";

export type SquareRawEntity = {
  id: string;
  objectType: SquareObjectType;
  organizationId: string;
  locationId?: string | null;
  merchantId?: string | null;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type SquareCanonicalEntity = {
  /** JAG internal id */
  id: string;
  externalId: string;
  sourceSystem: "square";
  syncedAt: string;
  version: number;
  organizationId: string;
  locationId: string | null;
  merchantId: string | null;
  objectType: SquareObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};
