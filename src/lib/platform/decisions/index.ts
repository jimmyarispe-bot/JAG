export { DecisionService } from "@/lib/platform/decisions/service";
export type { DecisionServiceApi } from "@/lib/platform/decisions/service";

export type {
  AssignDecisionInput,
  CreateDecisionInput,
  DecisionHistoryAction,
  DecisionHistoryEntry,
  DecisionOwner,
  DecisionOwnerRole,
  DecisionPriority,
  DecisionQueue,
  DecisionStatus,
  EscalateDecisionPriorityInput,
  PlatformDecision,
  SyncRecommendationsInput,
  TransitionDecisionInput,
} from "@/lib/platform/decisions/types";

export {
  buildAutomationDecisionMergeKey,
  buildDecisionMergeKey,
  countByStatus,
  createDecisionId,
  defaultOwnerForPriority,
  dueDateFrom,
  emptyStatusCounts,
  isActiveDecision,
  priorityRank,
  sortDecisions,
} from "@/lib/platform/decisions/decision";

export {
  FUTURE_DECISION_OWNER_ROLES,
  SUPPORTED_DECISION_OWNER_ROLES,
  assertAssignableOwnerRole,
  buildOwner,
  isSupportedOwnerRole,
  ownerLabel,
} from "@/lib/platform/decisions/ownership";

export {
  canTransition,
  assertTransition,
  historyActionForTransition,
} from "@/lib/platform/decisions/workflow";

export { appendHistory, resetHistorySequenceForTests } from "@/lib/platform/decisions/history";

export {
  getDecisionQueue,
  getStoredDecision,
  listStoredDecisions,
  resetDecisionStoreForTests,
  syncRecommendationsToQueue,
  upsertStoredDecision,
} from "@/lib/platform/decisions/queue";

export {
  assignDecision,
  createDecision,
  escalateDecisionPriority,
  setDecisionDueDate,
  transitionDecision,
} from "@/lib/platform/decisions/actions";

export type { SetDecisionDueDateInput } from "@/lib/platform/decisions/types";
