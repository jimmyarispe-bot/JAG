import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type {
  FinanceCanonicalEntity,
  FinanceObjectType,
  FinanceProvider,
} from "@/lib/platform/integrations/connectors/finance/entities";
import { financeCanonicalType } from "@/lib/platform/integrations/connectors/finance/mapping";

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    provider: FinanceProvider;
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
      provider: row.provider,
      version: row.version,
      updatedAt: row.updatedAt,
    },
  }));
}

export function normalizeFinanceRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  provider: FinanceProvider,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ?? config.scope.organizationId;
    const attributes = { ...record.payload };
    delete attributes.body;
    delete attributes.cardNumber;
    delete attributes.routingNumber;
    delete attributes.accountNumber;
    const internalId = jagInternalId(provider, record.objectType, record.externalId);

    const data: FinanceCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: provider,
      syncedAt,
      version,
      objectType: record.objectType as FinanceObjectType,
      canonicalType: financeCanonicalType(record.objectType),
      attributes,
    };

    return {
      canonicalType: data.canonicalType,
      externalId: record.externalId,
      sourceSystem: provider,
      scope: {
        organizationId,
        schoolId: config.scope.schoolId ?? null,
      },
      data: data as unknown as Record<string, unknown>,
      lineage: {
        connectorId: provider,
        instanceId: config.instanceId,
        syncedAt,
        rawHash: hashPayload(attributes),
      },
    };
  });
}

function jagInternalId(provider: string, objectType: string, externalId: string): string {
  return createHash("sha256")
    .update(`finance:${provider}:${objectType}:${externalId}`)
    .digest("hex")
    .slice(0, 32);
}

function hashPayload(attributes: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(attributes)).digest("hex").slice(0, 16);
}
