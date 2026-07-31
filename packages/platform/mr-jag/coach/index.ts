export type {
  CoachAnalyticsSnapshot,
  CoachDashboard,
  CoachEventKind,
  CoachGoal,
  CoachGoalHorizon,
  CoachObservationEvent,
  CoachRecommendation,
  CoachRisk,
  CoachRiskKind,
  CoachRiskSeverity,
  CoachTimelineEntry,
  CoachingTone,
  CoachingType,
  CustomEventRegistration,
  TimelineEntryStatus,
} from "./types";
export {
  resetCoachEngineStoreForTests,
  listEvents,
  listRisks,
  listGoals,
  listTimeline,
  buildCoachAnalytics,
} from "./store";
export { BUILT_IN_COACH_EVENTS, findBuiltInEvent } from "./events/catalog";
export {
  observeCoachEvent,
  registerCoachEvent,
  listRegisteredCoachEvents,
} from "./events/observe";
export { syncHelpIncidentsIntoCoach } from "./events/help-bridge";
export { scoreRecommendation } from "./recommendations/priority";
export { generateCoachRecommendations } from "./recommendations/engine";
export { detectCoachRisks, closeCoachRisk } from "./risk/detector";
export { bestPracticeRecommendations } from "./best-practices/engine";
export {
  createCoachGoal,
  listCoachGoals,
  seedDefaultGoals,
  incrementGoalProgress,
} from "./goals/service";
export { MrJagCoachEngine, createMrJagCoachEngine } from "./engine";
/** P-001 compatibility */
export { MrJagCoachService, createMrJagCoachService } from "./service";
