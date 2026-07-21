/**
 * Google Workspace normalization pipeline.
 * Provider payload → privacy scrub → domain attributes → canonical entity.
 * Never exposes raw Google objects downstream.
 */

import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type {
  GoogleWorkspaceCanonicalEntity,
  GoogleWorkspaceObjectType,
} from "@/lib/platform/integrations/connectors/google-workspace/entities";
import { normalizeContactAttributes } from "@/lib/platform/integrations/connectors/google-workspace/contacts";
import { normalizeDirectoryAttributes } from "@/lib/platform/integrations/connectors/google-workspace/directory";
import { normalizeDocAttributes } from "@/lib/platform/integrations/connectors/google-workspace/docs";
import { googleWorkspaceCanonicalType } from "@/lib/platform/integrations/connectors/google-workspace/mapping";
import {
  resolvePrivacyPolicy,
  scrubPayloadForPrivacy,
} from "@/lib/platform/integrations/connectors/google-workspace/normalization/privacy";
import { normalizeSheetAttributes } from "@/lib/platform/integrations/connectors/google-workspace/sheets";
import { normalizeSlideAttributes } from "@/lib/platform/integrations/connectors/google-workspace/slides";
import { normalizeCalendarAttributes } from "@/lib/platform/integrations/google-workspace/calendar/normalize";
import { isCalendarObjectType } from "@/lib/platform/integrations/google-workspace/calendar/object-types";
import { normalizeDriveAttributes } from "@/lib/platform/integrations/google-workspace/drive/normalize";
import { isDriveObjectType } from "@/lib/platform/integrations/google-workspace/drive/object-types";
import { normalizeGmailAttributes } from "@/lib/platform/integrations/google-workspace/gmail/normalize";
import { isGmailObjectType } from "@/lib/platform/integrations/google-workspace/gmail/object-types";

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    workspaceDomain: string;
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
      workspaceDomain: row.workspaceDomain,
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
  if (isGmailObjectType(objectType)) {
    return normalizeGmailAttributes(objectType, payload);
  }
  if (isCalendarObjectType(objectType)) {
    return normalizeCalendarAttributes(objectType, payload);
  }
  if (isDriveObjectType(objectType)) {
    return normalizeDriveAttributes(objectType, payload);
  }
  switch (objectType) {
    case "doc":
      return normalizeDocAttributes(payload);
    case "sheet":
      return normalizeSheetAttributes(payload);
    case "slide":
      return normalizeSlideAttributes(payload);
    case "contact":
      return normalizeContactAttributes(payload);
    case "directory_user":
    case "directory_group":
    case "organizational_unit":
      return normalizeDirectoryAttributes(objectType, payload);
    default:
      return payload;
  }
}

export function normalizeGoogleWorkspaceRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  const privacy = resolvePrivacyPolicy(config.settings);
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ?? config.scope.organizationId;
    const workspaceDomain =
      (record.payload.workspaceDomain as string | undefined) ??
      (config.settings.domain as string | undefined) ??
      "unknown.domain";
    const userId = (record.payload.userId as string | null | undefined) ?? null;
    const scrubbed = scrubPayloadForPrivacy(record.objectType, record.payload, privacy);
    const attributes = domainAttributes(record.objectType, scrubbed);
    const internalId = jagInternalId("google-workspace", record.objectType, record.externalId);

    const data: GoogleWorkspaceCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: "google-workspace",
      syncedAt,
      version,
      workspaceDomain: String(workspaceDomain),
      userId: userId ? String(userId) : null,
      objectType: record.objectType as GoogleWorkspaceObjectType,
      canonicalType: googleWorkspaceCanonicalType(record.objectType),
      attributes,
    };

    return {
      canonicalType: data.canonicalType,
      externalId: record.externalId,
      sourceSystem: "google-workspace",
      scope: {
        organizationId,
        schoolId: config.scope.schoolId ?? null,
      },
      data: data as unknown as Record<string, unknown>,
      lineage: {
        connectorId: "google",
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
