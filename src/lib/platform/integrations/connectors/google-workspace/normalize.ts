/**
 * Google Workspace → JAG canonical normalization.
 * Metadata-only by default; never persists email bodies or document contents
 * unless organization privacy policy explicitly enables them.
 */

import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import {
  DEFAULT_GOOGLE_WORKSPACE_PRIVACY,
  type GoogleWorkspaceCanonicalEntity,
  type GoogleWorkspaceObjectType,
  type GoogleWorkspacePrivacyPolicy,
} from "./entities";

const CANONICAL_TYPE: Record<GoogleWorkspaceObjectType, string> = {
  message: "comms.message",
  label: "comms.label",
  thread: "comms.thread",
  calendar_event: "comms.event",
  drive_file: "document.file",
  drive_folder: "document.folder",
  doc: "document.doc",
  sheet: "document.sheet",
  meet: "comms.meeting",
  task_list: "work.task_list",
  task: "work.task",
  directory_user: "person.user",
  directory_group: "person.group",
  organizational_unit: "org.unit",
};

export function googleWorkspaceCanonicalType(objectType: string): string {
  return (
    CANONICAL_TYPE[objectType as GoogleWorkspaceObjectType] ?? `google-workspace.${objectType}`
  );
}

export function resolvePrivacyPolicy(
  settings: Record<string, unknown>
): GoogleWorkspacePrivacyPolicy {
  return {
    storeEmailBodies:
      settings.storeEmailBodies === true
        ? true
        : DEFAULT_GOOGLE_WORKSPACE_PRIVACY.storeEmailBodies,
    storeDocumentContents:
      settings.storeDocumentContents === true
        ? true
        : DEFAULT_GOOGLE_WORKSPACE_PRIVACY.storeDocumentContents,
  };
}

/** Strip bodies / contents unless policy allows — defense in depth at normalize. */
export function scrubPayloadForPrivacy(
  objectType: string,
  payload: Record<string, unknown>,
  privacy: GoogleWorkspacePrivacyPolicy
): Record<string, unknown> {
  const next = { ...payload };
  if (objectType === "message" && !privacy.storeEmailBodies) {
    delete next.body;
    delete next.bodyHtml;
    delete next.snippet;
    delete next.raw;
  }
  if (
    (objectType === "doc" || objectType === "sheet" || objectType === "drive_file") &&
    !privacy.storeDocumentContents
  ) {
    delete next.content;
    delete next.body;
    delete next.cells;
    delete next.rawContent;
  }
  return next;
}

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
      attributes: scrubbed,
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
        rawHash: hashPayload(scrubbed),
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
