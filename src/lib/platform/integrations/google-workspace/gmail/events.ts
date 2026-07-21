import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";

/**
 * Map a normalized Gmail message to EMAIL_* events.
 * Prefer direction / explicit updated flags — do not treat updatedAt presence as an update.
 */
export function gmailEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  if (payload.updated === true || Number(payload.version ?? 1) > 1) {
    return "EMAIL_UPDATED";
  }
  const direction = String(payload.direction ?? "received");
  if (direction === "sent") return "EMAIL_SENT";
  return "EMAIL_RECEIVED";
}

export function gmailThreadEventForRecord(
  payload: Record<string, unknown>
): PlatformEventType {
  void payload;
  return "THREAD_UPDATED";
}

export function eventTypeForGmailCanonical(
  record: GoogleWorkspaceCanonicalEntity
): PlatformEventType | null {
  // Derived umbrella Communication rows must not re-emit EMAIL_* events.
  if (
    record.attributes.kind === "Communication" ||
    String(record.externalId).startsWith("communication:")
  ) {
    return null;
  }
  switch (record.objectType) {
    case "message":
      return gmailEventForRecord(record.attributes);
    case "thread":
      return gmailThreadEventForRecord(record.attributes);
    default:
      return null;
  }
}
