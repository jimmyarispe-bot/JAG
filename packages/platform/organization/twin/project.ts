/**
 * Digital Twin link — reference projection only (does not replace twin registry).
 */

import { getOrganization, upsertOrganization } from "../store";
import type { OrgTwinLink } from "../types";

export function linkDigitalTwin(input: {
  organizationId: string;
  twinEntityId: string;
}): OrgTwinLink | { error: string } {
  const org = getOrganization(input.organizationId);
  if (!org) return { error: "Organization not found." };
  const twin: OrgTwinLink = {
    organizationId: input.organizationId,
    twinEntityId: input.twinEntityId,
    lastProjectedAt: new Date().toISOString(),
    notes: "Projected from Universal Organization Model identity + constitution.",
  };
  upsertOrganization({
    ...org,
    twin,
    updatedAt: twin.lastProjectedAt!,
  });
  return twin;
}
