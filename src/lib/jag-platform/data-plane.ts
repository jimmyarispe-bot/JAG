/**
 * End-to-end data-plane tenant isolation for JAG portal surfaces.
 *
 * All loaders/mutations that touch organization-scoped data must resolve
 * through these helpers so org operators cannot read/write other tenants
 * via query params, form bodies, or soft first-org fallbacks.
 */

import { resolveOrganizationDisplayName } from "@/lib/jag-business/organization-display";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { JAG_PLATFORM_DEMO_ACCOUNTS } from "@/lib/jag-platform/auth";
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
    name: resolveOrganizationDisplayName(o.id, o.name),
  }));
}

/** Normalize legacy fixtures that omit authority for seeded demo accounts. */
function sessionForDataPlane(session: JagPlatformSession): JagPlatformSession {
  if (session.authority) return session;
  const isDemo = JAG_PLATFORM_DEMO_ACCOUNTS.some(
    (a) => a.email === session.email.trim().toLowerCase()
  );
  if (isDemo) {
    return { ...session, authority: "platform" };
  }
  return session;
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
  const effective = sessionForDataPlane(session);
  const orgs = listSessionAccessibleOrganizations(effective);
  if (orgs.length === 0) return null;

  const preferred = preferredId?.trim() || null;

  if (preferred) {
    if (!sessionCanAccessOrganization(effective, preferred)) return null;
    const match = orgs.find((o) => o.id === preferred);
    if (match) {
      return {
        id: match.id,
        name: resolveOrganizationDisplayName(match.id, match.name),
      };
    }
    // Platform steward may access an id not in the soft demo card list.
    if (effective.authority === "platform") {
      return {
        id: preferred,
        name: resolveOrganizationDisplayName(preferred),
      };
    }
    return null;
  }

  if (effective.authority === "organization") {
    if (!effective.organizationId) return null;
    if (!sessionCanAccessOrganization(effective, effective.organizationId)) {
      return null;
    }
    const bound =
      orgs.find((o) => o.id === effective.organizationId) ?? {
        id: effective.organizationId,
        name: resolveOrganizationDisplayName(effective.organizationId),
      };
    return {
      id: bound.id,
      name: resolveOrganizationDisplayName(bound.id, bound.name),
    };
  }

  if (effective.organizationId) {
    const bound = orgs.find((o) => o.id === effective.organizationId);
    if (bound) {
      return {
        id: bound.id,
        name: resolveOrganizationDisplayName(bound.id, bound.name),
      };
    }
  }

  const first = orgs[0];
  if (!first) return null;
  return {
    id: first.id,
    name: resolveOrganizationDisplayName(first.id, first.name),
  };
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
