import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type {
  EnterpriseCanonicalEntity,
  EnterpriseObjectType,
  EnterpriseProvider,
} from "@/lib/platform/integrations/connectors/enterprise/entities";
import { enterpriseCanonicalType } from "@/lib/platform/integrations/connectors/enterprise/mapping";

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    provider: EnterpriseProvider;
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

export function normalizeEnterpriseRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  provider: EnterpriseProvider,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ?? config.scope.organizationId;
    const attributes = { ...record.payload };
    delete attributes.ssn;
    delete attributes.taxId;
    delete attributes.bankAccount;
    delete attributes.medicalNotes;
    const internalId = jagInternalId(provider, record.objectType, record.externalId);

    const data: EnterpriseCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: provider,
      syncedAt,
      version,
      objectType: record.objectType as EnterpriseObjectType,
      canonicalType: enterpriseCanonicalType(record.objectType),
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
    .update(`enterprise:${provider}:${objectType}:${externalId}`)
    .digest("hex")
    .slice(0, 32);
}

function hashPayload(attributes: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(attributes)).digest("hex").slice(0, 16);
}
