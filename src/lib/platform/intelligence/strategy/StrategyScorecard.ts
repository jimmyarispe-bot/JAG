/**
 * StrategyScorecard — executive scorecard — Sprint 205.
 */

import type { GoalHealthEvaluation } from "./GoalHealthEngine";
import type { StrategyMissionForecast } from "./StrategyForecast";
import type {
  OrganizationalMission,
  StrategicGoal,
  StrategicInitiative,
  StrategicPillar,
} from "./types";

export type StrategyScorecard = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly missionSummary: string;
  readonly visionSummary: string;
  readonly alignmentScore: number;
  readonly goalsImproving: readonly string[];
  readonly goalsDeclining: readonly string[];
  readonly goalsAtRisk: readonly string[];
  readonly blockedGoals: readonly string[];
  readonly initiativesBehind: readonly string[];
  readonly upcomingReviews: readonly string[];
  readonly pillarSummaries: readonly {
    readonly pillarId: string;
    readonly label: string;
    readonly goalCount: number;
    readonly avgProgress: number;
  }[];
  readonly forecastTrend: string;
  readonly advisoryNotice: string;
};

export function buildStrategyScorecard(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly mission: OrganizationalMission | null;
  readonly pillars: readonly StrategicPillar[];
  readonly goals: readonly StrategicGoal[];
  readonly initiatives: readonly StrategicInitiative[];
  readonly evaluations: readonly GoalHealthEvaluation[];
  readonly alignmentScore: number;
  readonly forecast: StrategyMissionForecast;
}): StrategyScorecard {
  const evalById = new Map(input.evaluations.map((e) => [e.goalId, e]));

  const goalsImproving = input.goals
    .filter((g) => {
      const h = evalById.get(g.id)?.health ?? g.health;
      return h === "on_track" || h === "achieved";
    })
    .map((g) => g.title);

  const goalsDeclining = input.goals
    .filter((g) => (evalById.get(g.id)?.behindSchedule ?? false) && g.progress < 0.7)
    .map((g) => g.title);

  const goalsAtRisk = input.goals
    .filter((g) => {
      const h = evalById.get(g.id)?.health ?? g.health;
      return h === "at_risk" || h === "watch";
    })
    .map((g) => g.title);

  const blockedGoals = input.goals
    .filter((g) => evalById.get(g.id)?.blocked || g.health === "blocked")
    .map((g) => g.title);

  const initiativesBehind = input.initiatives
    .filter((i) => i.status === "behind" || i.status === "blocked")
    .map((i) => i.title);

  const upcomingReviews = input.mission
    ? [
        `Next review ${input.mission.nextReviewAt.slice(0, 10)} (${input.mission.reviewCadence})`,
      ]
    : [];

  const pillarSummaries = input.pillars.map((p) => {
    const pg = input.goals.filter((g) => g.pillarId === p.id);
    const avgProgress =
      pg.length === 0
        ? 0
        : pg.reduce((a, g) => a + g.progress, 0) / pg.length;
    return {
      pillarId: p.id,
      label: p.label,
      goalCount: pg.length,
      avgProgress: Number(avgProgress.toFixed(3)),
    };
  });

  return {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    missionSummary: input.mission?.mission ?? "Mission not defined.",
    visionSummary: input.mission?.vision ?? "Vision not defined.",
    alignmentScore: input.alignmentScore,
    goalsImproving,
    goalsDeclining,
    goalsAtRisk,
    blockedGoals,
    initiativesBehind,
    upcomingReviews,
    pillarSummaries,
    forecastTrend: input.forecast.missionProgressTrend,
    advisoryNotice:
      "Strategy scorecard is advisory — connect decisions and outcomes to keep alignment current.",
  };
}
