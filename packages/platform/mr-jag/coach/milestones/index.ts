/**
 * Milestone coaching helpers.
 */

import { isMilestoneHit, listEvents, milestoneCount } from "../store";
import { BUILT_IN_COACH_EVENTS } from "../events/catalog";
import type { CoachEventKind } from "../types";

export function listHitMilestones(input: {
  organizationId: string;
  userId: string;
}): readonly CoachEventKind[] {
  return Object.freeze(
    BUILT_IN_COACH_EVENTS.filter(
      (e) =>
        e.isMilestone &&
        isMilestoneHit(input.organizationId, input.userId, e.kind)
    ).map((e) => e.kind)
  );
}

export function onboardingCompletionPercent(input: {
  organizationId: string;
  userId: string;
  persona: string;
}): number {
  const relevant = BUILT_IN_COACH_EVENTS.filter(
    (e) =>
      e.isMilestone &&
      e.personas.some((p) => p.toLowerCase() === input.persona.toLowerCase())
  );
  if (relevant.length === 0) return 100;
  const hit = relevant.filter((e) =>
    isMilestoneHit(input.organizationId, input.userId, e.kind)
  ).length;
  return Math.round((hit / relevant.length) * 100);
}

export function recentMilestoneEvents(input: {
  organizationId: string;
  userId: string;
  limit?: number;
}) {
  return listEvents({
    organizationId: input.organizationId,
    userId: input.userId,
    limit: input.limit ?? 10,
  }).filter((e) => String(e.kind).startsWith("first_"));
}

export { milestoneCount };
