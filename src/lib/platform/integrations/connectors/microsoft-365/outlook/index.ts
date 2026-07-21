import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export const OUTLOOK_OBJECT_TYPES = [
  "message",
  "thread",
  "attachment",
] as const satisfies readonly Microsoft365ObjectType[];

export function outlookEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  const direction = String(payload.direction ?? "received");
  if (direction === "sent") return "EMAIL_SENT";
  if (payload.updated === true || Number(payload.version ?? 1) > 1) return "EMAIL_UPDATED";
  return "EMAIL_RECEIVED";
}

/** Canonical Email / Conversation / Attachment attributes — no Graph-specific fields. */
export function normalizeOutlookAttributes(
  objectType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  if (objectType === "thread") {
    return {
      kind: "Conversation",
      name: payload.name ?? payload.subject ?? null,
      messageCount: payload.messageCount ?? 0,
      unread: Boolean(payload.unread),
      subject: payload.subject ?? payload.name ?? null,
    };
  }
  if (objectType === "attachment") {
    return {
      kind: "Attachment",
      name: payload.name ?? null,
      messageId: payload.messageId ?? null,
      mimeType: payload.mimeType ?? null,
      sizeBytes: payload.sizeBytes ?? null,
    };
  }
  const to = Array.isArray(payload.to) ? payload.to : [];
  const from = typeof payload.from === "string" ? payload.from : null;
  const participantEmails = [
    ...(from ? [from] : []),
    ...to.filter((e): e is string => typeof e === "string"),
  ];
  return {
    kind: "Email",
    subject: payload.subject ?? payload.name ?? null,
    name: payload.subject ?? payload.name ?? null,
    threadId: payload.threadId ?? null,
    from,
    to,
    direction: payload.direction ?? "received",
    unread: Boolean(payload.unread),
    hasAttachments: Boolean(payload.hasAttachments),
    attachmentCount: Number(payload.attachmentCount ?? 0),
    receivedAt: payload.receivedAt ?? null,
    sentAt: payload.sentAt ?? null,
    occurredAt: payload.receivedAt ?? payload.sentAt ?? null,
    participantEmails,
  };
}
