/**
 * StrategyForecast — advisory goal / mission progress forecasts — Sprint 205.
 */

import type { GoalHealthEvaluation } from "./GoalHealthEngine";
import type { OrganizationalMission, StrategicGoal } from "./types";

export type StrategyGoalForecast = {
  readonly goalId: string;
  readonly title: string;
  readonly achievementProbability: number;
  readonly projectedProgress: number;
  readonly risk: "low" | "moderate" | "high";
  readonly summary: string;
  readonly advisoryNotice: string;
};

export type StrategyMissionForecast = {
  readonly organizationId: string;
  readonly missionProgressTrend: "improving" | "stable" | "declining" | "unknown";
  readonly strategicRisks: readonly string[];
  readonly goalForecasts: readonly StrategyGoalForecast[];
  readonly confidence: number;
  readonly advisoryNotice: string;
};

const ADVISORY =
  "Advisory strategic forecast — not certainty. Goal achievement probability is modeled from current health and pace.";

export function forecastStrategy(input: {
  readonly organizationId: string;
  readonly mission: OrganizationalMission | null;
  readonly goals: readonly StrategicGoal[];
  readonly evaluations: readonly GoalHealthEvaluation[];
}): StrategyMissionForecast {
  const evalById = new Map(input.evaluations.map((e) => [e.goalId, e]));

  const goalForecasts: StrategyGoalForecast[] = input.goals.map((g) => {
    const ev = evalById.get(g.id);
    let probability = 0.45 + g.progress * 0.4 + g.confidence * 0.15;
    if (ev?.blocked) probability -= 0.35;
    else if (ev?.health === "at_risk") probability -= 0.2;
    else if (ev?.health === "watch") probability -= 0.08;
    else if (ev?.health === "on_track") probability += 0.1;
    else if (ev?.health === "achieved") probability = 0.95;
    probability = Math.max(0.05, Math.min(0.95, probability));

    const projected = Math.min(
      1,
      g.progress + Math.max(0.05, (1 - g.progress) * probability * 0.5)
    );

    const risk: StrategyGoalForecast["risk"] =
      probability >= 0.7 ? "low" : probability >= 0.45 ? "moderate" : "high";

    return {
      goalId: g.id,
      title: g.title,
      achievementProbability: Number(probability.toFixed(3)),
      projectedProgress: Number(projected.toFixed(3)),
      risk,
      summary: `${g.title}: ~${(probability * 100).toFixed(0)}% chance of hitting target (${risk} risk).`,
      advisoryNotice: ADVISORY,
    };
  });

  const avgProb =
    goalForecasts.length === 0
      ? 0
      : goalForecasts.reduce((a, f) => a + f.achievementProbability, 0) /
        goalForecasts.length;

  const atRisk = goalForecasts.filter((f) => f.risk === "high").length;
  const onTrack = goalForecasts.filter((f) => f.risk === "low").length;

  let trend: StrategyMissionForecast["missionProgressTrend"] = "unknown";
  if (goalForecasts.length > 0) {
    if (onTrack >= atRisk && avgProb >= 0.6) trend = "improving";
    else if (atRisk > onTrack || avgProb < 0.45) trend = "declining";
    else trend = "stable";
  }

  const strategicRisks = [
    ...goalForecasts
      .filter((f) => f.risk === "high")
      .slice(0, 4)
      .map((f) => `Goal at risk: ${f.title}`),
    ...input.goals
      .filter((g) => g.health === "blocked")
      .slice(0, 2)
      .map((g) => `Blocked goal: ${g.title}`),
  ];

  return {
    organizationId: input.organizationId,
    missionProgressTrend: trend,
    strategicRisks,
    goalForecasts,
    confidence: Number(
      Math.min(0.9, 0.4 + goalForecasts.length * 0.05 + avgProb * 0.3).toFixed(3)
    ),
    advisoryNotice: ADVISORY,
  };
}
