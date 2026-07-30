/**
 * StrategyTimeline — chronological strategic events — Sprint 205.
 */

import type {
  OrganizationalMission,
  StrategicGoal,
  StrategicInitiative,
} from "./types";

export type StrategyTimelineEntry = {
  readonly id: string;
  readonly at: string;
  readonly kind: "mission" | "goal" | "initiative" | "review";
  readonly title: string;
  readonly summary: string;
  readonly entityId: string;
};

export type StrategyTimeline = {
  readonly organizationId: string;
  readonly entries: readonly StrategyTimelineEntry[];
};

export function buildStrategyTimeline(input: {
  readonly organizationId: string;
  readonly mission: OrganizationalMission | null;
  readonly goals: readonly StrategicGoal[];
  readonly initiatives: readonly StrategicInitiative[];
}): StrategyTimeline {
  const entries: StrategyTimelineEntry[] = [];

  if (input.mission) {
    entries.push({
      id: `tl-mission-${input.mission.id}`,
      at: input.mission.updatedAt,
      kind: "mission",
      title: "Mission updated",
      summary: input.mission.mission.slice(0, 160),
      entityId: input.mission.id,
    });
    entries.push({
      id: `tl-review-${input.mission.id}`,
      at: input.mission.nextReviewAt,
      kind: "review",
      title: "Upcoming strategic review",
      summary: `Cadence: ${input.mission.reviewCadence}. Horizon: ${input.mission.planningHorizon}.`,
      entityId: input.mission.id,
    });
  }

  for (const g of input.goals) {
    entries.push({
      id: `tl-goal-${g.id}`,
      at: g.updatedAt,
      kind: "goal",
      title: g.title,
      summary: `${g.status} · ${(g.progress * 100).toFixed(0)}% · health ${g.health}`,
      entityId: g.id,
    });
  }

  for (const i of input.initiatives) {
    entries.push({
      id: `tl-init-${i.id}`,
      at: i.updatedAt,
      kind: "initiative",
      title: i.title,
      summary: `${i.status} · ${(i.progress * 100).toFixed(0)}% · impact ${i.impactScore.toFixed(2)}`,
      entityId: i.id,
    });
  }

  entries.sort((a, b) => b.at.localeCompare(a.at));

  return {
    organizationId: input.organizationId,
    entries: entries.slice(0, 40),
  };
}
