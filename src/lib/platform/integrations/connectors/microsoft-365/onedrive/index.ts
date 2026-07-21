import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export const ONEDRIVE_OBJECT_TYPES = [
  "onedrive_file",
  "onedrive_folder",
] as const satisfies readonly Microsoft365ObjectType[];

export function onedriveEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  if (payload.shared === true) return "DOCUMENT_SHARED";
  if (Number(payload.version ?? 1) > 1) return "DOCUMENT_CHANGED";
  return "DOCUMENT_CREATED";
}

export function normalizeOneDriveAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    name: payload.name ?? payload.title,
    mimeType: payload.mimeType ?? null,
    ownerEmail: payload.ownerEmail ?? null,
    ownership: {
      ownerEmail: payload.ownerEmail ?? null,
      owners: payload.owners ?? (payload.ownerEmail ? [payload.ownerEmail] : []),
    },
    parentId: payload.parentId ?? null,
    path: payload.path ?? null,
    shared: Boolean(payload.shared),
    permissions: payload.permissions ?? [],
    permissionCount: payload.permissionCount ?? 0,
    lastModifiedAt: payload.lastModifiedAt ?? null,
  };
}
