/**
 * Application-facing StrategyService — Sprint 205.
 */

import {
  calculateDecisionAlignment,
  organizationAlignmentScore,
  type AlignmentQuery,
} from "./AlignmentEngine";
import {
  evaluateAllGoalHealth,
  type GoalHealthEvaluation,
} from "./GoalHealthEngine";
import { GoalRegistry } from "./GoalRegistry";
import { InitiativeRegistry } from "./InitiativeRegistry";
import { MissionRegistry } from "./MissionRegistry";
import { recordStrategyObservation } from "./observability";
import {
  ensureOrganizationStrategy,
  resetStrategySeedForTests,
} from "./seed";
import { StrategicPillarRegistry } from "./StrategicPillarRegistry";
import {
  forecastStrategy,
  type StrategyMissionForecast,
} from "./StrategyForecast";
import {
  buildStrategyScorecard,
  type StrategyScorecard,
} from "./StrategyScorecard";
import {
  buildStrategyTimeline,
  type StrategyTimeline,
} from "./StrategyTimeline";
import type {
  DecisionStrategicAlignment,
  OrganizationalMission,
  StrategicGoal,
  StrategicInitiative,
  StrategicPillar,
} from "./types";

export type StrategyWorkspaceBundle = {
  readonly mission: OrganizationalMission | null;
  readonly pillars: readonly StrategicPillar[];
  readonly goals: readonly StrategicGoal[];
  readonly initiatives: readonly StrategicInitiative[];
  readonly evaluations: readonly GoalHealthEvaluation[];
  readonly alignmentScore: number;
  readonly scorecard: StrategyScorecard;
  readonly forecast: StrategyMissionForecast;
  readonly timeline: StrategyTimeline;
  readonly observationId: string;
  readonly durationMs: number;
  readonly advisoryNotice: string;
};

let obsSeq = 0;

function ensure(organizationId: string, organizationName: string): void {
  ensureOrganizationStrategy({ organizationId, organizationName });
}

export const StrategyService = {
  ensureOrganization(
    organizationId: string,
    organizationName: string
  ): void {
    ensure(organizationId, organizationName);
  },

  getMission(organizationId: string): OrganizationalMission | null {
    return MissionRegistry.get(organizationId);
  },

  updateMission(
    patch: OrganizationalMission
  ): OrganizationalMission {
    const started = Date.now();
    const mission = MissionRegistry.upsert(patch);
    const observationId = `stobs-${++obsSeq}-${Date.now()}`;
    recordStrategyObservation({
      id: observationId,
      kind: "mission_update",
      organizationId: mission.organizationId,
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      detail: `Mission updated for ${mission.organizationName}`,
      entityIds: [mission.id],
    });
    return mission;
  },

  listPillars(organizationId: string): readonly StrategicPillar[] {
    return StrategicPillarRegistry.list(organizationId);
  },

  listGoals(organizationId: string): readonly StrategicGoal[] {
    return GoalRegistry.list(organizationId);
  },

  listInitiatives(organizationId: string): readonly StrategicInitiative[] {
    return InitiativeRegistry.list(organizationId);
  },

  evaluateGoals(organizationId: string): readonly GoalHealthEvaluation[] {
    const started = Date.now();
    const goals = GoalRegistry.list(organizationId);
    const initiatives = InitiativeRegistry.list(organizationId);
    const evaluations = evaluateAllGoalHealth(goals, initiatives);

    // Persist refreshed health onto goals
    for (const ev of evaluations) {
      const g = GoalRegistry.get(ev.goalId);
      if (g && g.health !== ev.health) {
        GoalRegistry.upsert({ ...g, health: ev.health, updatedAt: new Date().toISOString() });
      }
    }

    const observationId = `stobs-${++obsSeq}-${Date.now()}`;
    recordStrategyObservation({
      id: observationId,
      kind: "goal_evaluation",
      organizationId,
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      detail: `Evaluated ${evaluations.length} strategic goal(s).`,
      entityIds: evaluations.map((e) => e.goalId),
    });
    return evaluations;
  },

  alignDecision(query: AlignmentQuery): DecisionStrategicAlignment {
    const started = Date.now();
    const mission = MissionRegistry.get(query.organizationId);
    const pillars = StrategicPillarRegistry.list(query.organizationId);
    const goals = GoalRegistry.list(query.organizationId);
    const alignment = calculateDecisionAlignment({
      query,
      mission,
      pillars,
      goals,
    });

    // Link decision onto matched goals
    for (const goalId of alignment.goalIds) {
      const g = GoalRegistry.get(goalId);
      if (!g) continue;
      if (!g.relatedDecisionIds.includes(query.decisionId)) {
        GoalRegistry.upsert({
          ...g,
          relatedDecisionIds: [...g.relatedDecisionIds, query.decisionId],
          updatedAt: new Date().toISOString(),
        });
      }
    }

    recordStrategyObservation({
      id: `stobs-${++obsSeq}-${Date.now()}`,
      kind: "alignment_calculation",
      organizationId: query.organizationId,
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      detail: `Aligned decision ${query.decisionId}: impact ${alignment.impact}, mission ${(alignment.missionAlignment * 100).toFixed(0)}%.`,
      entityIds: [query.decisionId, ...alignment.goalIds],
      metadata: { impact: alignment.impact },
    });
    return alignment;
  },

  forecast(organizationId: string): StrategyMissionForecast {
    const goals = GoalRegistry.list(organizationId);
    const evaluations = evaluateAllGoalHealth(
      goals,
      InitiativeRegistry.list(organizationId)
    );
    return forecastStrategy({
      organizationId,
      mission: MissionRegistry.get(organizationId),
      goals,
      evaluations,
    });
  },

  scorecard(
    organizationId: string,
    organizationName: string
  ): StrategyScorecard {
    const started = Date.now();
    ensure(organizationId, organizationName);
    const evaluations = this.evaluateGoals(organizationId);
    const goals = GoalRegistry.list(organizationId);
    const initiatives = InitiativeRegistry.list(organizationId);
    const forecast = forecastStrategy({
      organizationId,
      mission: MissionRegistry.get(organizationId),
      goals,
      evaluations,
    });
    const alignmentScore = organizationAlignmentScore({ goals });
    const card = buildStrategyScorecard({
      organizationId,
      organizationName,
      mission: MissionRegistry.get(organizationId),
      pillars: StrategicPillarRegistry.list(organizationId),
      goals,
      initiatives,
      evaluations,
      alignmentScore,
      forecast,
    });
    recordStrategyObservation({
      id: `stobs-${++obsSeq}-${Date.now()}`,
      kind: "scorecard_generation",
      organizationId,
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      detail: `Scorecard generated — alignment ${(alignmentScore * 100).toFixed(0)}%.`,
      entityIds: goals.map((g) => g.id).slice(0, 20),
    });
    return card;
  },

  workspace(
    organizationId: string,
    organizationName: string
  ): StrategyWorkspaceBundle {
    const started = Date.now();
    ensure(organizationId, organizationName);
    const evaluations = this.evaluateGoals(organizationId);
    const mission = MissionRegistry.get(organizationId);
    const pillars = StrategicPillarRegistry.list(organizationId);
    const goals = GoalRegistry.list(organizationId);
    const initiatives = InitiativeRegistry.list(organizationId);
    const forecast = forecastStrategy({
      organizationId,
      mission,
      goals,
      evaluations,
    });
    const alignmentScore = organizationAlignmentScore({ goals });
    const scorecard = buildStrategyScorecard({
      organizationId,
      organizationName,
      mission,
      pillars,
      goals,
      initiatives,
      evaluations,
      alignmentScore,
      forecast,
    });
    const timeline = buildStrategyTimeline({
      organizationId,
      mission,
      goals,
      initiatives,
    });
    const observationId = `stobs-${++obsSeq}-${Date.now()}`;
    recordStrategyObservation({
      id: observationId,
      kind: "scorecard_generation",
      organizationId,
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      detail: `Strategy workspace loaded for ${organizationName}.`,
      entityIds: goals.map((g) => g.id).slice(0, 20),
    });
    return {
      mission,
      pillars,
      goals,
      initiatives,
      evaluations,
      alignmentScore,
      scorecard,
      forecast,
      timeline,
      observationId,
      durationMs: Date.now() - started,
      advisoryNotice:
        "Strategic intelligence connects today's decisions to mission, pillars, and goals. Advisory — not a substitute for executive judgment.",
    };
  },
} as const;

export function resetStrategyServiceForTests(): void {
  MissionRegistry.resetForTests();
  StrategicPillarRegistry.resetForTests();
  GoalRegistry.resetForTests();
  InitiativeRegistry.resetForTests();
  resetStrategySeedForTests();
}
