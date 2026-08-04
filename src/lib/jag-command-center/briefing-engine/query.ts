/**
 * Briefing Engine queries — list and detail for the Command Center UI.
 */

import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { resolveSessionOrganization } from "@/lib/jag-platform/data-plane";
import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
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
    resolveSessionOrganization(session, options?.organizationId)?.id ?? null;

  // Fail closed: never dump the global briefing store when org scope is null.
  const briefings = selectedOrganizationId
    ? listBriefings({ organizationId: selectedOrganizationId })
    : [];

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
  const allowed = briefing.organizationIds.some((id) =>
    sessionCanAccessOrganization(session, id)
  );
  if (!allowed) return null;
  return briefing;
}

export function getSharedBriefingDetail(
  token: string
): JagExecutiveBriefing | null {
  return getBriefingByShareToken(token);
}
