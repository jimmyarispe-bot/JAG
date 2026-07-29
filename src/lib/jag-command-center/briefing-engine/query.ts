/**
 * Briefing Engine queries — list and detail for the Command Center UI.
 */

import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { getBriefing, getBriefingByShareToken, listBriefings } from "./store";
import {
  JAG_BRIEFING_KINDS,
  JAG_BRIEFING_SCOPES,
  JAG_BRIEFING_TIMELINES,
} from "./types";
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
    scopes: JAG_BRIEFING_SCOPES,
    kinds: JAG_BRIEFING_KINDS,
  };
}

export function getBriefingDetail(
  session: JagPlatformSession,
  briefingId: string
): JagExecutiveBriefing | null {
  const briefing = getBriefing(briefingId);
  if (!briefing) return null;
  const orgs = listOrganizationsForSession(session);
  const allowed = new Set(orgs.map((o) => o.id));
  if (!briefing.organizationIds.some((id) => allowed.has(id))) {
    return null;
  }
  return briefing;
}

export function getSharedBriefingDetail(
  token: string
): JagExecutiveBriefing | null {
  return getBriefingByShareToken(token);
}
