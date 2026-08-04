/**
 * Organization isolation for Evidence Center on The JAG™ Platform Portal.
 */

import {
  listSessionAccessibleOrganizations,
  resolveSessionOrganization,
} from "@/lib/jag-platform/data-plane";
import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export function listAccessibleEvidenceOrganizations(
  session: JagPlatformSession
): readonly { id: string; name: string }[] {
  return listSessionAccessibleOrganizations(session);
}

export function canAccessEvidenceOrganization(
  session: JagPlatformSession,
  organizationId: string
): boolean {
  return sessionCanAccessOrganization(session, organizationId);
}

/**
 * Resolve evidence org scope. Invalid preferred ids fail closed (null) —
 * never soft-fallback to another tenant's first accessible org.
 */
export function resolveEvidenceOrganization(
  session: JagPlatformSession,
  preferredId?: string | null
): { id: string; name: string } | null {
  return resolveSessionOrganization(session, preferredId);
}
