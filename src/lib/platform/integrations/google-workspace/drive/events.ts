import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export function driveEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  if (payload.shared === true) return "DOCUMENT_SHARED";
  if (Number(payload.version ?? 1) > 1 || payload.updated === true) {
    return "DOCUMENT_CHANGED";
  }
  return "DOCUMENT_CREATED";
}

export function eventTypeForDriveCanonical(
  record: GoogleWorkspaceCanonicalEntity
): PlatformEventType | null {
  const kind = String(record.attributes.kind ?? "");
  // Derived Owner / Permission / Revision must not re-emit document events.
  if (kind === "Owner" || kind === "Permission" || kind === "Revision") {
    return null;
  }
  if (
    String(record.externalId).startsWith("owner:") ||
    String(record.externalId).startsWith("permission:") ||
    String(record.externalId).startsWith("revision:")
  ) {
    return null;
  }

  switch (record.objectType) {
    case "drive_file":
    case "drive_folder":
      return driveEventForRecord(record.attributes);
    default:
      return null;
  }
}
