/**
 * End-to-end data-plane tenant isolation for JAG portal surfaces.
 *
 * All loaders/mutations that touch organization-scoped data must resolve
 * through these helpers so org operators cannot read/write other tenants
 * via query params, form bodies, or soft first-org fallbacks.
 */

import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export type SessionOrganizationRef = {
  readonly id: string;
  readonly name: string;
};

/**
 * Organizations the session may list on data-plane surfaces.
 * Delegates to the hardened ACL source (`listOrganizationsForSession`).
 */
export function listSessionAccessibleOrganizations(
  session: JagPlatformSession
): readonly SessionOrganizationRef[] {
  return listOrganizationsForSession(session).map((o) => ({
    id: o.id,
    name: o.name,
  }));
}

/**
 * Resolve the organization scope for a loader/query.
 *
 * Fail-closed rules:
 * - Preferred id must pass `sessionCanAccessOrganization` (no soft fallback).
 * - Org operators always bind to `session.organizationId` when preferred is omitted.
 * - Platform stewards may omit preferred and use session binding, else first
 *   accessible org only when no preferred was requested.
 * - Invalid preferred → null (never silently rewrite to another tenant).
 */
export function resolveSessionOrganization(
  session: JagPlatformSession,
  preferredId?: string | null
): SessionOrganizationRef | null {
  const orgs = listSessionAccessibleOrganizations(session);
  if (orgs.length === 0) return null;

  const preferred = preferredId?.trim() || null;

  if (preferred) {
    if (!sessionCanAccessOrganization(session, preferred)) return null;
    const match = orgs.find((o) => o.id === preferred);
    if (match) return match;
    // Platform steward may access an id not in the soft demo card list.
    if (session.authority === "platform") {
      return { id: preferred, name: preferred };
    }
    return null;
  }

  if (session.authority === "organization") {
    if (!session.organizationId) return null;
    if (!sessionCanAccessOrganization(session, session.organizationId)) {
      return null;
    }
    return (
      orgs.find((o) => o.id === session.organizationId) ?? {
        id: session.organizationId,
        name: session.organizationId,
      }
    );
  }

  if (session.organizationId) {
    const bound = orgs.find((o) => o.id === session.organizationId);
    if (bound) return bound;
  }

  return orgs[0] ?? null;
}

/** Error message when the session cannot access `organizationId`; null when allowed. */
export function assertSessionCanAccessOrganization(
  session: JagPlatformSession,
  organizationId: string | null | undefined
): string | null {
  const id = organizationId?.trim() ?? "";
  if (!id) return "organizationId is required.";
  if (!sessionCanAccessOrganization(session, id)) {
    return "Organization access denied.";
  }
  return null;
}

/**
 * Filter a list of organization ids to those the session may access.
 * Used by multi-org briefings and similar aggregations.
 */
export function filterAccessibleOrganizationIds(
  session: JagPlatformSession,
  organizationIds: readonly string[]
): readonly string[] {
  return organizationIds.filter((id) =>
    sessionCanAccessOrganization(session, id)
  );
}

/**
 * Filter telemetry / observation rows by organization binding.
 * Unbound rows (null organizationId) are visible only to platform stewards.
 */
export function filterObservationsForSession<
  T extends { readonly organizationId?: string | null },
>(
  session: JagPlatformSession,
  items: readonly T[],
  limit = 50
): readonly T[] {
  return items
    .filter((item) => {
      const orgId = item.organizationId;
      if (!orgId) return session.authority === "platform";
      return sessionCanAccessOrganization(session, orgId);
    })
    .slice(0, limit);
}
