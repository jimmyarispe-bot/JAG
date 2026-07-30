/**
 * In-app notification store for the Executive Command Center.
 */

import { brandEmailForOrganization } from "@/lib/jag-command-center/branding/documents";
import type { JagNotification, JagNotificationKind } from "./types";

const items: JagNotification[] = [];
const MAX = 100;

export function resetJagNotificationStoreForTests(): void {
  items.length = 0;
}

function withBrandFooter(body: string, organizationId?: string | null): string {
  const email = brandEmailForOrganization(organizationId, {
    documentTitle: "Decision Notification",
  });
  if (body.includes(email.footerText)) return body;
  return `${body}\n\n— ${email.footerText}`;
}

export function pushJagNotification(input: {
  kind: JagNotificationKind;
  title: string;
  body: string;
  href?: string | null;
  organizationId?: string | null;
  decisionId?: string | null;
  briefingId?: string | null;
  at?: string;
}): JagNotification {
  const at = input.at ?? new Date().toISOString();
  const note: JagNotification = {
    id: `note:${at}:${items.length}:${input.kind}`,
    kind: input.kind,
    at,
    title: input.title,
    body: withBrandFooter(input.body, input.organizationId),
    href: input.href ?? null,
    organizationId: input.organizationId ?? null,
    decisionId: input.decisionId ?? null,
    briefingId: input.briefingId ?? null,
    read: false,
  };
  items.unshift(note);
  if (items.length > MAX) items.length = MAX;
  return note;
}

export function listJagNotifications(limit = 30): readonly JagNotification[] {
  return items.slice(0, limit);
}

export function countUnreadJagNotifications(): number {
  return items.filter((n) => !n.read).length;
}

export function markJagNotificationRead(id: string): void {
  const idx = items.findIndex((n) => n.id === id);
  if (idx < 0) return;
  const current = items[idx]!;
  items[idx] = { ...current, read: true };
}

export function markAllJagNotificationsRead(): void {
  for (let i = 0; i < items.length; i += 1) {
    const n = items[i]!;
    if (!n.read) items[i] = { ...n, read: true };
  }
}
