/**
 * Autonomous Executive Intelligence — Sprint 206.
 * Proactive watchers surface findings. JAG never executes decisions.
 *
 * Import from `…/watchers/index` to avoid bare-path collisions.
 */

export {
  WATCHER_TYPES,
  WATCHER_TYPE_LABELS,
  WATCHER_PRIORITIES,
  WATCHER_SCHEDULE_KINDS,
  DIGEST_KINDS,
  ALERT_STATUSES,
  type WatcherType,
  type WatcherPriority,
  type WatcherRule,
  type WatcherScheduleKind,
  type DigestKind,
  type AlertStatus,
} from "./WatcherRule";

export {
  type WatcherEvidenceRef,
  type WatcherExplanation,
  type WatcherAlert,
  type WatcherDigest,
} from "./WatcherAlert";

export {
  priorityRank,
  maxPriority,
  priorityFromScore,
  sortByPriorityDesc,
} from "./WatcherPriority";

export {
  WATCHER_SCHEDULES,
  digestLabel,
  digestMinPriority,
  type WatcherSchedule,
} from "./WatcherSchedule";

export { WatcherRegistry } from "./WatcherRegistry";

export {
  type WatcherSignal,
  type WatcherEvaluationContext,
  type WatcherCandidate,
  type WatcherEvaluationResult,
} from "./WatcherEvaluation";

export { evaluateWatchers } from "./WatcherEngine";

export {
  WatcherService,
  resetWatcherServiceForTests,
  seedWatcherAlertForTests,
} from "./WatcherService";

export {
  recordWatcherObservation,
  listWatcherObservations,
  clearWatcherObservationsForTests,
  type WatcherObservation,
  type WatcherObservationKind,
} from "./WatcherObservability";
