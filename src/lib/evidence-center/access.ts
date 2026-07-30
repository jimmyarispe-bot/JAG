/**
 * Organization isolation for Evidence Center on The JAG™ Platform Portal.
 */

import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export function listAccessibleEvidenceOrganizations(
  session: JagPlatformSession
): readonly { id: string; name: string }[] {
  return listOrganizationsForSession(session).map((o) => ({
    id: o.id,
    name: o.name,
  }));
}

export function canAccessEvidenceOrganization(
  session: JagPlatformSession,
  organizationId: string
): boolean {
  return listAccessibleEvidenceOrganizations(session).some(
    (o) => o.id === organizationId
  );
}

export function resolveEvidenceOrganization(
  session: JagPlatformSession,
  preferredId?: string | null
): { id: string; name: string } | null {
  const orgs = listAccessibleEvidenceOrganizations(session);
  if (orgs.length === 0) return null;
  if (preferredId) {
    const match = orgs.find((o) => o.id === preferredId);
    if (match) return match;
  }
  return orgs[0] ?? null;
}
