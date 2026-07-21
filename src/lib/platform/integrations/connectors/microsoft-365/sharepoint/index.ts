import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export const SHAREPOINT_OBJECT_TYPES = [
  "sharepoint_file",
  "sharepoint_site",
] as const satisfies readonly Microsoft365ObjectType[];

export function sharepointEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  if (payload.shared === true) return "DOCUMENT_SHARED";
  if (Number(payload.version ?? 1) > 1) return "DOCUMENT_CHANGED";
  return "DOCUMENT_CREATED";
}

export function normalizeSharePointAttributes(
  objectType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  if (objectType === "sharepoint_site") {
    return {
      name: payload.name ?? payload.title,
      path: payload.path ?? payload.webUrl ?? null,
      shared: true,
      ownerEmail: payload.ownerEmail ?? null,
    };
  }
  return {
    name: payload.name ?? payload.title,
    mimeType: payload.mimeType ?? null,
    ownerEmail: payload.ownerEmail ?? null,
    siteId: payload.siteId ?? null,
    shared: Boolean(payload.shared ?? true),
    lastModifiedAt: payload.lastModifiedAt ?? null,
  };
}
