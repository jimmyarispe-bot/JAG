import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type {
  CollaborationCanonicalEntity,
  CollaborationObjectType,
  CollaborationProvider,
} from "@/lib/platform/integrations/connectors/collaboration/entities";
import { collaborationCanonicalType } from "@/lib/platform/integrations/connectors/collaboration/mapping";

export function toSyncRecords(raw: Array<{
  id: string;
  objectType: string;
  updatedAt: string;
  version: number;
  organizationId: string;
  provider: CollaborationProvider;
  payload: Record<string, unknown>;
}>): SyncRecord[] {
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

export function normalizeCollaborationRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  provider: CollaborationProvider,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ?? config.scope.organizationId;
    // Metadata only — strip message/chat bodies unless explicitly enabled.
    const attributes = scrubBody(record.objectType, { ...record.payload }, config.settings);
    const internalId = jagInternalId(provider, record.objectType, record.externalId);

    const data: CollaborationCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: provider,
      syncedAt,
      version,
      objectType: record.objectType as CollaborationObjectType,
      canonicalType: collaborationCanonicalType(record.objectType),
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

function scrubBody(
  objectType: string,
  payload: Record<string, unknown>,
  settings: Record<string, unknown>
): Record<string, unknown> {
  const storeBodies = settings.storeMessageBodies === true;
  if (!storeBodies && (objectType === "message" || objectType === "chat" || objectType === "thread")) {
    delete payload.body;
    delete payload.text;
    delete payload.content;
    delete payload.raw;
  }
  return payload;
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
