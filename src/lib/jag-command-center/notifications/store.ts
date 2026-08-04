/**
 * In-app notification store for the Executive Command Center.
 * Reads/mutations are session-scoped — never dump the global process store.
 */

import { brandEmailForOrganization } from "@/lib/jag-command-center/branding/documents";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { sessionCanAccessNotification } from "./access";
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

/** Load by id without ACL — callers must authorize before exposing/mutating. */
export function getJagNotification(id: string): JagNotification | null {
  return items.find((n) => n.id === id) ?? null;
}

/** Accessible notification or null (fail closed). */
export function getAccessibleJagNotification(
  session: JagPlatformSession,
  id: string
): JagNotification | null {
  const note = getJagNotification(id);
  if (!note) return null;
  if (!sessionCanAccessNotification(session, note)) return null;
  return note;
}

/**
 * Session-scoped list. Organization authority never sees foreign or null-org
 * notifications. Missing/null customer org context → empty (fail closed).
 */
export function listJagNotifications(
  session: JagPlatformSession,
  limit = 30
): readonly JagNotification[] {
  if (
    session.authority === "organization" &&
    !session.organizationId?.trim()
  ) {
    return [];
  }
  return items
    .filter((n) => sessionCanAccessNotification(session, n))
    .slice(0, limit);
}

/**
 * Metrics helper: exact organization match only (null-org never counted).
 * Does not grant session authority — use only for known-tenant aggregates.
 */
export function listJagNotificationsForOrganization(
  organizationId: string,
  limit = 30
): readonly JagNotification[] {
  const id = organizationId.trim();
  if (!id) return [];
  return items
    .filter((n) => n.organizationId === id)
    .slice(0, limit);
}

export function countUnreadJagNotifications(
  session: JagPlatformSession
): number {
  if (
    session.authority === "organization" &&
    !session.organizationId?.trim()
  ) {
    return 0;
  }
  return items.filter(
    (n) => !n.read && sessionCanAccessNotification(session, n)
  ).length;
}

/**
 * Mark one notification read after stored-resource ACL.
 * Returns false when missing or unauthorized (no mutation).
 */
export function markJagNotificationRead(
  session: JagPlatformSession,
  id: string
): boolean {
  const idx = items.findIndex((n) => n.id === id);
  if (idx < 0) return false;
  const current = items[idx]!;
  if (!sessionCanAccessNotification(session, current)) return false;
  if (current.read) return true;
  items[idx] = { ...current, read: true };
  return true;
}

/** Mark all notifications readable by this session as read. */
export function markAllJagNotificationsRead(
  session: JagPlatformSession
): void {
  if (
    session.authority === "organization" &&
    !session.organizationId?.trim()
  ) {
    return;
  }
  for (let i = 0; i < items.length; i += 1) {
    const n = items[i]!;
    if (n.read) continue;
    if (!sessionCanAccessNotification(session, n)) continue;
    items[i] = { ...n, read: true };
  }
}
