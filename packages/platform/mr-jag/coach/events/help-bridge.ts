/**
 * Help Center → Coach bridge (read-only consumption; does not modify Help APIs).
 */

import { listIncidents } from "../../help/intelligence";
import { observeCoachEvent } from "./observe";
import type { CoachObservationEvent } from "../types";

/** Mirror recent Help incidents into Coach observation events for risk/coaching. */
export function syncHelpIncidentsIntoCoach(input: {
  organizationId: string;
  userId?: string;
  limit?: number;
}): readonly CoachObservationEvent[] {
  const incidents = listIncidents({
    organizationId: input.organizationId,
    limit: input.limit ?? 10,
  }).filter((i) => !input.userId || i.userId === input.userId);

  return Object.freeze(
    incidents.map((incident) =>
      observeCoachEvent({
        kind: "help_request",
        organizationId: incident.organizationId,
        userId: incident.userId,
        persona: incident.persona,
        allowRepeat: true,
        metadata: {
          incidentId: incident.id,
          status: incident.status,
          helpRepeat: true,
        },
      })
    )
  );
}
