import {
  canAccessEvidenceOrganization,
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center/access";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export function listAccessibleConnectorOrganizations(
  session: JagPlatformSession
) {
  return listAccessibleEvidenceOrganizations(session);
}

export function canAccessConnectorOrganization(
  session: JagPlatformSession,
  organizationId: string
): boolean {
  return canAccessEvidenceOrganization(session, organizationId);
}

export function resolveConnectorOrganization(
  session: JagPlatformSession,
  preferredId?: string | null
) {
  return resolveEvidenceOrganization(session, preferredId);
}
