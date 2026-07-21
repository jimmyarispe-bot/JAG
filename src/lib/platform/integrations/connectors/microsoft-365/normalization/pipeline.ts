import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type {
  Microsoft365CanonicalEntity,
  Microsoft365ObjectType,
} from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import { normalizeCalendarAttributes } from "@/lib/platform/integrations/connectors/microsoft-365/calendar";
import { normalizeGroupAttributes } from "@/lib/platform/integrations/connectors/microsoft-365/groups";
import { microsoft365CanonicalType } from "@/lib/platform/integrations/connectors/microsoft-365/mapping";
import {
  resolvePrivacyPolicy,
  scrubPayloadForPrivacy,
} from "@/lib/platform/integrations/connectors/microsoft-365/normalization/privacy";
import { normalizeOneDriveAttributes } from "@/lib/platform/integrations/connectors/microsoft-365/onedrive";
import { normalizeOutlookAttributes } from "@/lib/platform/integrations/connectors/microsoft-365/outlook";
import { normalizePeopleAttributes } from "@/lib/platform/integrations/connectors/microsoft-365/people";
import { normalizeSharePointAttributes } from "@/lib/platform/integrations/connectors/microsoft-365/sharepoint";
import {
  normalizeChatAttributes,
  normalizeMeetAttributes,
} from "@/lib/platform/integrations/connectors/microsoft-365/teams";

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    tenantDomain: string;
    userId?: string | null;
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
      tenantDomain: row.tenantDomain,
      userId: row.userId ?? null,
      version: row.version,
      updatedAt: row.updatedAt,
    },
  }));
}

function domainAttributes(
  objectType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  switch (objectType) {
    case "message":
    case "thread":
    case "attachment":
      return normalizeOutlookAttributes(objectType, payload);
    case "calendar_event":
      return normalizeCalendarAttributes(payload);
    case "onedrive_file":
    case "onedrive_folder":
      return normalizeOneDriveAttributes(payload);
    case "sharepoint_file":
    case "sharepoint_site":
      return normalizeSharePointAttributes(objectType, payload);
    case "meet":
      return normalizeMeetAttributes(payload);
    case "chat":
      return normalizeChatAttributes(payload);
    case "contact":
    case "directory_user":
      return normalizePeopleAttributes(objectType, payload);
    case "directory_group":
    case "team":
    case "channel":
      return normalizeGroupAttributes(objectType, payload);
    default:
      return payload;
  }
}

export function normalizeMicrosoft365Records(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  const privacy = resolvePrivacyPolicy(config.settings);
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ?? config.scope.organizationId;
    const tenantDomain =
      (record.payload.tenantDomain as string | undefined) ??
      (config.settings.tenantDomain as string | undefined) ??
      "unknown.tenant";
    const userId = (record.payload.userId as string | null | undefined) ?? null;
    const scrubbed = scrubPayloadForPrivacy(record.objectType, record.payload, privacy);
    const attributes = domainAttributes(record.objectType, scrubbed);
    const internalId = jagInternalId("microsoft-365", record.objectType, record.externalId);

    const data: Microsoft365CanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: "microsoft-365",
      syncedAt,
      version,
      tenantDomain: String(tenantDomain),
      userId: userId ? String(userId) : null,
      objectType: record.objectType as Microsoft365ObjectType,
      canonicalType: microsoft365CanonicalType(record.objectType),
      attributes,
    };

    return {
      canonicalType: data.canonicalType,
      externalId: record.externalId,
      sourceSystem: "microsoft-365",
      scope: {
        organizationId,
        schoolId: config.scope.schoolId ?? null,
      },
      data: data as unknown as Record<string, unknown>,
      lineage: {
        connectorId: "microsoft",
        instanceId: config.instanceId,
        syncedAt,
        rawHash: hashPayload(attributes),
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
