/**
 * Normalize Drive SoR payloads into canonical attribute bags.
 * Downstream never sees raw Google Drive API shapes — metadata only.
 */

import type { DriveObjectType } from "@/lib/platform/integrations/google-workspace/drive/object-types";
import type { DrivePermissionRef } from "@/lib/platform/integrations/google-workspace/drive/types";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

function domainOf(email: string): string | null {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : null;
}

export function parseDrivePermissions(
  payload: Record<string, unknown>
): DrivePermissionRef[] {
  const raw = payload.permissions;
  if (Array.isArray(raw) && raw.length) {
    const out: DrivePermissionRef[] = [];
    for (let i = 0; i < raw.length; i++) {
      const entry = raw[i];
      if (typeof entry === "string") {
        const email = entry.trim().toLowerCase();
        out.push({
          id: `perm-${i}-${email}`,
          email,
          role: "reader",
          type: "user",
          domain: domainOf(email),
        });
        continue;
      }
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      const email = row.emailAddress
        ? String(row.emailAddress).toLowerCase()
        : row.email
          ? String(row.email).toLowerCase()
          : null;
      out.push({
        id: String(row.id ?? `perm-${i}`),
        email,
        role: String(row.role ?? "reader"),
        type: String(row.type ?? (email ? "user" : "anyone")),
        domain: email ? domainOf(email) : row.domain ? String(row.domain) : null,
      });
    }
    return out;
  }

  // Synthesize from permissionCount when shared (demo catalog often omits ACL rows).
  const count = Number(payload.permissionCount ?? 0);
  if (!payload.shared && count <= 0) return [];
  const owner = payload.ownerEmail ?? payload.owner;
  const synthesized: DrivePermissionRef[] = [];
  if (owner) {
    synthesized.push({
      id: "perm-owner",
      email: String(owner).toLowerCase(),
      role: "owner",
      type: "user",
      domain: domainOf(String(owner)),
    });
  }
  const extras = Math.max(0, count - synthesized.length);
  for (let i = 0; i < extras; i++) {
    synthesized.push({
      id: `perm-shared-${i + 1}`,
      email: null,
      role: i === 0 ? "writer" : "reader",
      type: "user",
      domain: null,
    });
  }
  return synthesized;
}

function commonDriveAttrs(payload: Record<string, unknown>): Record<string, unknown> {
  const ownerEmail = payload.ownerEmail
    ? String(payload.ownerEmail).toLowerCase()
    : payload.owner
      ? String(payload.owner).toLowerCase()
      : null;
  const owners = asStringArray(payload.owners).map((e) => e.toLowerCase());
  if (ownerEmail && !owners.includes(ownerEmail)) owners.unshift(ownerEmail);
  const permissions = parseDrivePermissions(payload);
  const version = Number(payload.version ?? 1);

  return {
    name: String(payload.name ?? payload.title ?? "Untitled"),
    mimeType: payload.mimeType ?? null,
    ownerEmail,
    owners,
    ownership: {
      ownerEmail,
      owners,
    },
    parentId: payload.parentId ?? null,
    path: payload.path ?? null,
    shared: Boolean(payload.shared),
    permissions,
    permissionCount: Number(payload.permissionCount ?? permissions.length),
    lastModifiedAt: payload.lastModifiedAt ?? payload.updatedAt ?? null,
    activityCount: Number(payload.activityCount ?? 0),
    revisionNumber: version,
    updated: Boolean(payload.updated),
    version,
    // Never persist file contents
    content: undefined,
    bytes: undefined,
    body: undefined,
  };
}

export function normalizeDriveFileAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...commonDriveAttrs(payload),
    kind: "Document",
    documentKind: "file",
  };
}

export function normalizeDriveFolderAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...commonDriveAttrs(payload),
    kind: "Folder",
    documentKind: "folder",
    mimeType: payload.mimeType ?? "application/vnd.google-apps.folder",
  };
}

export function normalizeDriveAttributes(
  objectType: DriveObjectType | string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  switch (objectType) {
    case "drive_folder":
      return normalizeDriveFolderAttributes(payload);
    case "drive_file":
      return normalizeDriveFileAttributes(payload);
    default:
      return normalizeDriveFileAttributes(payload);
  }
}
