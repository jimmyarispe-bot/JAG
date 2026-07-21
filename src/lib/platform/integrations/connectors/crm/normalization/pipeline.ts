import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type {
  CrmCanonicalEntity,
  CrmObjectType,
  CrmProvider,
} from "@/lib/platform/integrations/connectors/crm/entities";
import { crmCanonicalType } from "@/lib/platform/integrations/connectors/crm/mapping";

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    provider: CrmProvider;
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

function scrub(payload: Record<string, unknown>): Record<string, unknown> {
  const attributes = { ...payload };
  delete attributes.provider;
  delete attributes.organizationId;
  delete attributes.version;
  delete attributes.updatedAt;
  return attributes;
}

/** Normalize every provider object into canonical CRM entities with kind tags. */
export function domainAttributes(
  objectType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const base = scrub(payload);
  switch (objectType) {
    case "lead":
      return {
        ...base,
        kind: "Lead",
        name: base.name ?? null,
        email: base.email ?? null,
        companyId: base.companyId ?? null,
        status: base.status ?? "open",
        source: base.source ?? null,
        ownerId: base.ownerId ?? null,
        convertedContactId: base.convertedContactId ?? null,
        convertedDealId: base.convertedDealId ?? null,
      };
    case "contact":
      return {
        ...base,
        kind: "Contact",
        name: base.name ?? null,
        email: base.email ?? null,
        companyId: base.companyId ?? null,
        title: base.title ?? null,
        ownerId: base.ownerId ?? null,
      };
    case "company":
      return {
        ...base,
        kind: "Company",
        name: base.name ?? null,
        industry: base.industry ?? null,
        domain: base.domain ?? null,
        ownerId: base.ownerId ?? null,
      };
    case "deal":
    case "opportunity":
      return {
        ...base,
        kind: "Opportunity",
        name: base.name ?? null,
        companyId: base.companyId ?? null,
        contactId: base.contactId ?? null,
        pipelineId: base.pipelineId ?? null,
        amount: Number(base.amount ?? 0),
        stage: base.stage ?? null,
        probability: Number(base.probability ?? 0),
        ownerId: base.ownerId ?? null,
        source: base.source ?? null,
        closedAt: base.closedAt ?? null,
      };
    case "activity":
      return {
        ...base,
        kind: "Activity",
        name: base.name ?? null,
        contactId: base.contactId ?? null,
        dealId: base.dealId ?? null,
        opportunityId: base.opportunityId ?? null,
        companyId: base.companyId ?? null,
        activityType: base.activityType ?? "note",
        ownerId: base.ownerId ?? null,
      };
    case "pipeline":
      return {
        ...base,
        kind: "Pipeline",
        name: base.name ?? null,
        stages: base.stages ?? [],
      };
    default:
      return base;
  }
}

export function normalizeCrmRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  provider: CrmProvider,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ??
      config.scope.organizationId;
    const objectType = record.objectType as CrmObjectType;
    const attributes = domainAttributes(objectType, record.payload);
    const internalId = jagInternalId(provider, objectType, record.externalId);

    const data: CrmCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: provider,
      syncedAt,
      version,
      objectType,
      canonicalType: crmCanonicalType(objectType),
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
    .update(`crm:${provider}:${objectType}:${externalId}`)
    .digest("hex")
    .slice(0, 32);
}

function hashPayload(attributes: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(attributes)).digest("hex").slice(0, 16);
}
