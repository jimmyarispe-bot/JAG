/**
 * Strategic Intelligence & Mission Alignment — Sprint 205.
 * Application layer only. No Core / Runtime changes.
 *
 * Import from this module (`…/strategy/index`) — avoid bare
 * `@/lib/platform/intelligence/strategy` if a sibling strategy.ts appears.
 */

export {
  STRATEGIC_PILLAR_KINDS,
  STRATEGIC_PILLAR_LABELS,
  GOAL_STATUSES,
  GOAL_PRIORITIES,
  GOAL_HEALTH_LEVELS,
  INITIATIVE_STATUSES,
  ALIGNMENT_IMPACTS,
  type StrategicPillarKind,
  type GoalStatus,
  type GoalPriority,
  type GoalHealthLevel,
  type InitiativeStatus,
  type AlignmentImpact,
  type StrategyEvidenceRef,
  type OrganizationalMission,
  type StrategicPillar,
  type StrategicGoal,
  type StrategicInitiative,
  type DecisionStrategicAlignment,
} from "./types";

export { MissionRegistry } from "./MissionRegistry";
export { StrategicPillarRegistry } from "./StrategicPillarRegistry";
export { GoalRegistry } from "./GoalRegistry";
export { InitiativeRegistry } from "./InitiativeRegistry";

export {
  evaluateGoalHealth,
  evaluateAllGoalHealth,
  type GoalHealthEvaluation,
} from "./GoalHealthEngine";

export {
  calculateDecisionAlignment,
  organizationAlignmentScore,
  type AlignmentQuery,
} from "./AlignmentEngine";

export {
  buildStrategyTimeline,
  type StrategyTimeline,
  type StrategyTimelineEntry,
} from "./StrategyTimeline";

export {
  forecastStrategy,
  type StrategyGoalForecast,
  type StrategyMissionForecast,
} from "./StrategyForecast";

export {
  buildStrategyScorecard,
  type StrategyScorecard,
} from "./StrategyScorecard";

export {
  StrategyService,
  resetStrategyServiceForTests,
  type StrategyWorkspaceBundle,
} from "./StrategyService";

export { ensureOrganizationStrategy, resetStrategySeedForTests } from "./seed";

export {
  recordStrategyObservation,
  listStrategyObservations,
  clearStrategyObservationsForTests,
  type StrategyObservation,
  type StrategyObservationKind,
} from "./observability";
