/**
 * Briefing Engine queries — list and detail for the Command Center UI.
 */

import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { getBriefing, listBriefings } from "./store";
import { JAG_BRIEFING_TIMELINES } from "./types";
import type {
  JagBriefingListModel,
  JagExecutiveBriefing,
} from "./types";

export function loadBriefingList(
  session: JagPlatformSession,
  options?: { organizationId?: string }
): JagBriefingListModel {
  const organizations = listOrganizationsForSession(session);
  const selectedOrganizationId =
    options?.organizationId &&
    organizations.some((o) => o.id === options.organizationId)
      ? options.organizationId
      : organizations[0]?.id ?? null;

  const briefings = listBriefings(
    selectedOrganizationId
      ? { organizationId: selectedOrganizationId }
      : undefined
  );

  return {
    briefings,
    organizations: organizations.map((o) => ({ id: o.id, label: o.name })),
    selectedOrganizationId,
    timelines: JAG_BRIEFING_TIMELINES,
  };
}

export function getBriefingDetail(
  session: JagPlatformSession,
  briefingId: string
): JagExecutiveBriefing | null {
  const briefing = getBriefing(briefingId);
  if (!briefing) return null;
  const orgs = listOrganizationsForSession(session);
  if (!orgs.some((o) => o.id === briefing.organizationId)) {
    return null;
  }
  return briefing;
}
