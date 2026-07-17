/**
 * Plaid → JAG canonical normalization.
 * Every record carries internal id, external id, source=plaid, sync timestamp,
 * version, organization id, institution id, and account id.
 */

import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type { PlaidCanonicalEntity, PlaidObjectType } from "./entities";

const CANONICAL_TYPE: Record<PlaidObjectType, string> = {
  institution: "finance.institution",
  account: "finance.bank_account",
  transaction: "finance.bank_transaction",
  transfer: "finance.bank_transfer",
  balance: "finance.bank_balance",
  liability: "finance.liability",
  holding: "finance.holding",
  security: "finance.security",
  investment_performance: "finance.investment_performance",
  identity: "finance.account_identity",
};

export function plaidCanonicalType(objectType: string): string {
  return CANONICAL_TYPE[objectType as PlaidObjectType] ?? `plaid.${objectType}`;
}

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    institutionId?: string | null;
    accountId?: string | null;
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
      institutionId: row.institutionId ?? null,
      accountId: row.accountId ?? null,
      version: row.version,
      updatedAt: row.updatedAt,
    },
  }));
}

export function normalizePlaidRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ?? config.scope.organizationId;
    const institutionId =
      (record.payload.institutionId as string | null | undefined) ??
      (config.settings.institutionId as string | undefined) ??
      null;
    const accountId = (record.payload.accountId as string | null | undefined) ?? null;
    const internalId = jagInternalId("plaid", record.objectType, record.externalId);

    const data: PlaidCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: "plaid",
      syncedAt,
      version,
      institutionId: institutionId ? String(institutionId) : null,
      accountId: accountId ? String(accountId) : null,
      objectType: record.objectType as PlaidObjectType,
      canonicalType: plaidCanonicalType(record.objectType),
      attributes: { ...record.payload },
    };

    return {
      canonicalType: data.canonicalType,
      externalId: record.externalId,
      sourceSystem: "plaid",
      scope: {
        organizationId,
        schoolId: config.scope.schoolId ?? null,
      },
      data: data as unknown as Record<string, unknown>,
      lineage: {
        connectorId: "plaid",
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
