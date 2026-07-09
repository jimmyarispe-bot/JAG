/** Executive Decision Queue — Sprint 002 Task 4 */

export type {
  BuildExecutiveDecisionQueueInput,
  ExecutiveDecision,
  ExecutiveDecisionConfidence,
  ExecutiveDecisionDraft,
  ExecutiveDecisionHistoryEntry,
  ExecutiveDecisionQueue,
  ExecutiveDecisionSeverity,
  ExecutiveDecisionSourceKind,
  ExecutiveDecisionSourceRef,
  ExecutiveDecisionStatus,
  ExecutiveDecisionType,
  ExecutiveDecisionsFilters,
  ExecutiveDecisionsScope,
  GetExecutiveDecisionQueueOptions,
} from "@/lib/platform/executive-decisions/types";

export {
  DECISION_SEVERITY_RANK,
  DECISION_SOURCE_PRECEDENCE,
  EXECUTIVE_DECISION_STATUSES,
  EXECUTIVE_DECISION_TYPES,
} from "@/lib/platform/executive-decisions/types";

export {
  buildDecisionMergeKey,
  decisionIdFromMergeKey,
  hashString,
  normalizeToken,
} from "@/lib/platform/executive-decisions/hash";

export {
  maxDecisionConfidence,
  maxDecisionSeverity,
  normalizeDecisionSeverity,
  scoreDecision,
} from "@/lib/platform/executive-decisions/score";

export { mergeDecisionSources } from "@/lib/platform/executive-decisions/merge";

export { buildExecutiveDecisionQueue } from "@/lib/platform/executive-decisions/build";

export {
  acknowledgeDecision,
  completeDecision,
  delegateDecision,
  dismissDecision,
  markDecisionWaiting,
  scheduleFollowUp,
  setDecisionDueDate,
} from "@/lib/platform/executive-decisions/lifecycle";

export {
  adaptActivityDecisions,
  adaptExecutiveAlerts,
  adaptJagWorkDecisions,
  adaptKpiSnapshotDecisions,
  adaptMissionControlDecisions,
  adaptWorkflowApprovals,
} from "@/lib/platform/executive-decisions/adapters";

export {
  loadExecutiveDecisionSources,
  loadPendingWorkflowApprovals,
  resolveExecutiveDecisionsScope,
  type ExecutiveDecisionSourceBundle,
  type LoadExecutiveDecisionSourcesOptions,
} from "@/lib/platform/executive-decisions/sources";

export {
  collectDecisionDrafts,
  getExecutiveDecisionQueue,
  type GetExecutiveDecisionQueueExtra,
} from "@/lib/platform/executive-decisions/get";
