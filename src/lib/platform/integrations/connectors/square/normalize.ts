/**
 * Square → JAG canonical normalization.
 * Every record carries internal id, external id, source=square, sync timestamp,
 * version, organization id, and location id.
 */

import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type { SquareCanonicalEntity, SquareObjectType } from "./entities";

const CANONICAL_TYPE: Record<SquareObjectType, string> = {
  payment: "finance.payment",
  refund: "finance.refund",
  deposit: "finance.deposit",
  fee: "finance.fee",
  tip: "finance.tip",
  tax: "finance.tax",
  customer: "crm.contact",
  customer_group: "crm.group",
  catalog_item: "commerce.catalog_item",
  catalog_category: "commerce.catalog_category",
  catalog_variation: "commerce.catalog_variation",
  order: "commerce.order",
  order_line_item: "commerce.order_line_item",
  invoice: "finance.invoice",
  subscription: "finance.subscription",
  gift_card: "finance.gift_card",
  employee: "person.employee",
  location: "org.location",
  device: "ops.device",
  register: "ops.register",
};

export function squareCanonicalType(objectType: string): string {
  return CANONICAL_TYPE[objectType as SquareObjectType] ?? `square.${objectType}`;
}

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    locationId?: string | null;
    merchantId?: string | null;
    payload: Record<string, unknown>;
  }>
): SyncRecord[] {
  return raw.map((row) => ({
    externalId: row.id,
    objectType: row.objectType,
    updatedAt: row.updatedAt,
    payload: {
      ...row.payload,
      organizationId: row.organizationId,
      locationId: row.locationId ?? null,
      merchantId: row.merchantId ?? null,
      version: row.version,
      updatedAt: row.updatedAt,
    },
  }));
}

export function normalizeSquareRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const locationId =
      (record.payload.locationId as string | null | undefined) ??
      (config.scope.schoolId ?? null);
    const organizationId =
      (record.payload.organizationId as string | undefined) ?? config.scope.organizationId;
    const merchantId = (record.payload.merchantId as string | null | undefined) ?? null;
    const internalId = jagInternalId("square", record.objectType, record.externalId);

    const data: SquareCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      sourceSystem: "square",
      syncedAt,
      version,
      organizationId,
      locationId: locationId ? String(locationId) : null,
      merchantId: merchantId ? String(merchantId) : null,
      objectType: record.objectType as SquareObjectType,
      canonicalType: squareCanonicalType(record.objectType),
      attributes: { ...record.payload },
    };

    return {
      canonicalType: data.canonicalType,
      externalId: record.externalId,
      sourceSystem: "square",
      scope: {
        organizationId,
        schoolId: locationId,
      },
      data: data as unknown as Record<string, unknown>,
      lineage: {
        connectorId: "square",
        instanceId: config.instanceId,
        syncedAt,
        rawHash: hashPayload(record.payload),
      },
    };
  });
}

export function jagInternalId(source: string, objectType: string, externalId: string): string {
  const digest = createHash("sha1")
    .update(`${source}:${objectType}:${externalId}`)
    .digest("hex")
    .slice(0, 16);
  return `jag_${objectType}_${digest}`;
}

function hashPayload(payload: Record<string, unknown>): string {
  return createHash("sha1").update(JSON.stringify(payload)).digest("hex").slice(0, 12);
}

export { CANONICAL_TYPE };
