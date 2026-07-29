/**
 * In-app notification store for the Executive Command Center.
 */

import type { JagNotification, JagNotificationKind } from "./types";

const items: JagNotification[] = [];
const MAX = 100;

export function resetJagNotificationStoreForTests(): void {
  items.length = 0;
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
    body: input.body,
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
