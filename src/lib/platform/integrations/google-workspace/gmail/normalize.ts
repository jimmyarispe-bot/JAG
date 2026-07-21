/**
 * Normalize Gmail SoR payloads into canonical attribute bags.
 * Downstream never sees raw Gmail API shapes.
 */

import type { GmailObjectType } from "@/lib/platform/integrations/google-workspace/gmail/object-types";
import type { GmailParticipant } from "@/lib/platform/integrations/google-workspace/gmail/types";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

function domainOf(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "";
}

export function parseGmailParticipants(
  payload: Record<string, unknown>,
  workspaceDomain: string
): GmailParticipant[] {
  const internalDomain = workspaceDomain.toLowerCase();
  const out: GmailParticipant[] = [];
  const seen = new Set<string>();

  const push = (emailRaw: unknown, role: GmailParticipant["role"]) => {
    const email = String(emailRaw ?? "")
      .trim()
      .toLowerCase();
    if (!email || !email.includes("@")) return;
    const key = `${role}:${email}`;
    if (seen.has(key)) return;
    seen.add(key);
    const domain = domainOf(email);
    out.push({
      email,
      displayName: null,
      role,
      domain,
      isInternal: Boolean(domain && domain === internalDomain),
    });
  };

  push(payload.from, "from");
  for (const addr of asStringArray(payload.to)) push(addr, "to");
  for (const addr of asStringArray(payload.cc)) push(addr, "cc");
  for (const addr of asStringArray(payload.bcc)) push(addr, "bcc");
  return out;
}

export function normalizeGmailMessageAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const workspaceDomain = String(payload.workspaceDomain ?? "");
  const participants = parseGmailParticipants(payload, workspaceDomain);
  const direction =
    payload.direction === "sent" || payload.sentAt
      ? "sent"
      : "received";
  const subject = String(payload.subject ?? payload.name ?? "");

  return {
    // Canonical Email / Communication fields
    kind: "Email",
    communicationKind: "email",
    subject,
    name: subject,
    threadId: payload.threadId ?? null,
    labelIds: asStringArray(payload.labelIds),
    from: payload.from ? String(payload.from).toLowerCase() : null,
    to: asStringArray(payload.to).map((e) => e.toLowerCase()),
    cc: asStringArray(payload.cc).map((e) => e.toLowerCase()),
    bcc: asStringArray(payload.bcc).map((e) => e.toLowerCase()),
    participants,
    participantEmails: participants.map((p) => p.email),
    participantCount: participants.length,
    direction,
    unread: Boolean(payload.unread),
    priority: payload.priority ?? "normal",
    hasAttachments: Boolean(payload.hasAttachments),
    attachmentCount: Number(payload.attachmentCount ?? 0),
    attachmentNames: asStringArray(payload.attachmentNames),
    receivedAt: payload.receivedAt ?? null,
    sentAt: payload.sentAt ?? null,
    occurredAt: payload.sentAt ?? payload.receivedAt ?? payload.updatedAt ?? null,
    updated: Boolean(payload.updated),
    version: Number(payload.version ?? 1),
    // Never persist bodies — strip even if present upstream
    body: undefined,
    bodyHtml: undefined,
    snippet: undefined,
  };
}

export function normalizeGmailThreadAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const name = String(payload.name ?? payload.subject ?? "Conversation");
  return {
    kind: "Conversation",
    communicationKind: "conversation",
    name,
    subject: name,
    messageCount: Number(payload.messageCount ?? 0),
    unread: Boolean(payload.unread),
    labelIds: asStringArray(payload.labelIds),
    lastMessageAt: payload.lastMessageAt ?? payload.updatedAt ?? null,
    updated: Boolean(payload.updated),
    version: Number(payload.version ?? 1),
  };
}

export function normalizeGmailLabelAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    kind: "Communication",
    communicationKind: "label",
    name: String(payload.name ?? "Label"),
    labelType: payload.type ?? "user",
    messagesUnread: Number(payload.messagesUnread ?? 0),
    messagesTotal: Number(payload.messagesTotal ?? 0),
  };
}

export function normalizeGmailAttachmentAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    kind: "Attachment",
    communicationKind: "attachment",
    name: String(payload.name ?? "attachment"),
    messageId: payload.messageId ?? null,
    mimeType: payload.mimeType ?? null,
    sizeBytes: Number(payload.sizeBytes ?? 0),
    // Metadata only — never file bytes
    bytes: undefined,
    content: undefined,
  };
}

export function normalizeGmailAttributes(
  objectType: GmailObjectType | string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  switch (objectType) {
    case "message":
      return normalizeGmailMessageAttributes(payload);
    case "thread":
      return normalizeGmailThreadAttributes(payload);
    case "label":
      return normalizeGmailLabelAttributes(payload);
    case "attachment":
      return normalizeGmailAttachmentAttributes(payload);
    default:
      return payload;
  }
}
