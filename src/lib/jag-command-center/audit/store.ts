/**
 * Append-only executive audit log (in-memory application store).
 */

import type { JagAuditAction, JagAuditEvent } from "./types";

const events: JagAuditEvent[] = [];
const MAX = 500;

export function resetJagAuditStoreForTests(): void {
  events.length = 0;
}

export function recordJagAuditEvent(input: {
  action: JagAuditAction;
  actorUserId: string;
  actorLabel: string;
  organizationId?: string | null;
  decisionId?: string | null;
  briefingId?: string | null;
  detail: string;
  metadata?: Readonly<Record<string, string>>;
  at?: string;
}): JagAuditEvent {
  const at = input.at ?? new Date().toISOString();
  const event: JagAuditEvent = {
    id: `audit:${at}:${events.length}:${input.action}`,
    at,
    action: input.action,
    actorUserId: input.actorUserId,
    actorLabel: input.actorLabel,
    organizationId: input.organizationId ?? null,
    decisionId: input.decisionId ?? null,
    briefingId: input.briefingId ?? null,
    detail: input.detail,
    metadata: input.metadata,
  };
  events.unshift(event);
  if (events.length > MAX) events.length = MAX;
  return event;
}

export function listJagAuditEvents(
  limit = 50,
  options?: {
    /** When set, only events for accessible orgs (and unbound when allowUnbound). */
    readonly canAccessOrganization?: (organizationId: string) => boolean;
    /** Platform stewards may see events with null organizationId. */
    readonly allowUnbound?: boolean;
  }
): readonly JagAuditEvent[] {
  const canAccess = options?.canAccessOrganization;
  const filtered = canAccess
    ? events.filter((e) => {
        if (!e.organizationId) return options?.allowUnbound === true;
        return canAccess(e.organizationId);
      })
    : events;
  return filtered.slice(0, limit);
}
