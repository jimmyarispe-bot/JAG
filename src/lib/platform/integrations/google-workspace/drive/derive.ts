/**
 * Derive Owner / Permission / Revision from Drive Document & Folder records.
 * Downstream consumers only see these canonical entities — never raw Drive.
 */

import { createHash } from "crypto";
import type {
  GoogleWorkspaceCanonicalEntity,
  GoogleWorkspaceObjectType,
} from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type { DrivePermissionRef } from "@/lib/platform/integrations/google-workspace/drive/types";
import { parseDrivePermissions } from "@/lib/platform/integrations/google-workspace/drive/normalize";

function digestId(kind: string, key: string): string {
  const hash = createHash("sha1").update(`${kind}:${key}`).digest("hex").slice(0, 16);
  return `jag_${kind}_${hash}`;
}

function asPermissions(attrs: Record<string, unknown>): DrivePermissionRef[] {
  if (Array.isArray(attrs.permissions) && attrs.permissions.length) {
    if (typeof attrs.permissions[0] === "object") {
      return attrs.permissions as DrivePermissionRef[];
    }
  }
  return parseDrivePermissions(attrs);
}

/**
 * Expand normalized Drive records into Owner + Permission + Revision.
 * Document / Folder primaries remain; derived entities are appended.
 */
export function deriveDriveCanonicalEntities(
  records: readonly GoogleWorkspaceCanonicalEntity[]
): GoogleWorkspaceCanonicalEntity[] {
  const derived: GoogleWorkspaceCanonicalEntity[] = [];
  const seenOwner = new Set<string>();
  const seenPermission = new Set<string>();
  const seenRevision = new Set<string>();

  for (const record of records) {
    if (record.objectType !== "drive_file" && record.objectType !== "drive_folder") {
      continue;
    }

    const name = String(record.attributes.name ?? record.externalId);
    const ownerEmail = record.attributes.ownerEmail
      ? String(record.attributes.ownerEmail).toLowerCase()
      : null;
    const permissions = asPermissions(record.attributes);
    const revisionNumber = Number(
      record.attributes.revisionNumber ?? record.attributes.version ?? 1
    );

    if (ownerEmail && !seenOwner.has(ownerEmail)) {
      seenOwner.add(ownerEmail);
      derived.push({
        id: digestId("owner", ownerEmail),
        externalId: `owner:${ownerEmail}`,
        organizationId: record.organizationId,
        sourceSystem: "google-workspace",
        syncedAt: record.syncedAt,
        version: 1,
        workspaceDomain: record.workspaceDomain,
        userId: null,
        objectType: "contact" as GoogleWorkspaceObjectType,
        canonicalType: "person.owner",
        attributes: {
          kind: "Owner",
          name: ownerEmail,
          email: ownerEmail,
          source: "drive.owner",
        },
      });
    }

    // Per-document ownership link (even when Owner node already exists)
    if (ownerEmail) {
      const linkKey = `${record.externalId}:${ownerEmail}`;
      derived.push({
        id: digestId("owns", linkKey),
        externalId: `owns:${linkKey}`,
        organizationId: record.organizationId,
        sourceSystem: "google-workspace",
        syncedAt: record.syncedAt,
        version: 1,
        workspaceDomain: record.workspaceDomain,
        userId: null,
        objectType: record.objectType,
        canonicalType: "document.ownership",
        attributes: {
          kind: "Owner",
          name: ownerEmail,
          email: ownerEmail,
          documentId: record.externalId,
          documentName: name,
          ownerId: `owner:${ownerEmail}`,
          source: "drive.ownership",
        },
      });
    }

    for (const perm of permissions) {
      const key = `${record.externalId}:${perm.id}`;
      if (seenPermission.has(key)) continue;
      seenPermission.add(key);
      derived.push({
        id: digestId("permission", key),
        externalId: `permission:${key}`,
        organizationId: record.organizationId,
        sourceSystem: "google-workspace",
        syncedAt: record.syncedAt,
        version: 1,
        workspaceDomain: record.workspaceDomain,
        userId: null,
        objectType: record.objectType,
        canonicalType: "document.permission",
        attributes: {
          kind: "Permission",
          name: perm.email ?? `${perm.role}:${perm.type}`,
          email: perm.email,
          role: perm.role,
          type: perm.type,
          domain: perm.domain,
          documentId: record.externalId,
          documentName: name,
          source: "drive.permission",
        },
      });
    }

    const revKey = `${record.externalId}:v${revisionNumber}`;
    if (!seenRevision.has(revKey)) {
      seenRevision.add(revKey);
      derived.push({
        id: digestId("revision", revKey),
        externalId: `revision:${revKey}`,
        organizationId: record.organizationId,
        sourceSystem: "google-workspace",
        syncedAt: record.syncedAt,
        version: revisionNumber,
        workspaceDomain: record.workspaceDomain,
        userId: record.userId,
        objectType: record.objectType,
        canonicalType: "document.revision",
        attributes: {
          kind: "Revision",
          name: `${name} · r${revisionNumber}`,
          revisionNumber,
          documentId: record.externalId,
          documentName: name,
          lastModifiedAt: record.attributes.lastModifiedAt ?? null,
          activityCount: record.attributes.activityCount ?? 0,
          source: "drive.revision",
        },
      });
    }
  }

  return [...records, ...derived];
}
