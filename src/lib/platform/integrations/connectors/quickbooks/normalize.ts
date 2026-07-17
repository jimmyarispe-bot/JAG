/**
 * QuickBooks Online → JAG canonical normalization.
 */

import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type { QuickBooksCanonicalEntity, QuickBooksObjectType } from "./entities";

const CANONICAL_TYPE: Record<QuickBooksObjectType, string> = {
  company: "org.company",
  account: "finance.account",
  customer: "crm.contact",
  vendor: "crm.vendor",
  item: "commerce.item",
  invoice: "finance.invoice",
  bill: "finance.bill",
  payment: "finance.payment",
  bill_payment: "finance.bill_payment",
  journal_entry: "finance.journal_entry",
  expense: "finance.expense",
  deposit: "finance.deposit",
  transfer: "finance.transfer",
  credit_memo: "finance.credit_memo",
  budget: "finance.budget",
  class: "finance.class",
  location: "org.location",
  attachment: "document.file",
};

export function quickbooksCanonicalType(objectType: string): string {
  return CANONICAL_TYPE[objectType as QuickBooksObjectType] ?? `quickbooks.${objectType}`;
}

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    companyId: string;
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
      companyId: row.companyId,
      version: row.version,
      updatedAt: row.updatedAt,
    },
  }));
}

export function normalizeQuickBooksRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ?? config.scope.organizationId;
    const companyId =
      (record.payload.companyId as string | undefined) ??
      (config.settings.companyId as string | undefined) ??
      organizationId;
    const internalId = jagInternalId("quickbooks", record.objectType, record.externalId);

    const data: QuickBooksCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: "quickbooks",
      syncedAt,
      version,
      companyId: String(companyId),
      objectType: record.objectType as QuickBooksObjectType,
      canonicalType: quickbooksCanonicalType(record.objectType),
      attributes: { ...record.payload },
    };

    return {
      canonicalType: data.canonicalType,
      externalId: record.externalId,
      sourceSystem: "quickbooks",
      scope: {
        organizationId,
        schoolId: config.scope.schoolId ?? null,
      },
      data: data as unknown as Record<string, unknown>,
      lineage: {
        connectorId: "quickbooks",
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
