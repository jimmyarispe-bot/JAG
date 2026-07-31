export {
  WorkflowService,
  resetWorkflowFrameworkForTests,
} from "@/lib/platform/workflows/framework/service";
export type { WorkflowServiceApi } from "@/lib/platform/workflows/framework/service";

export {
  WorkflowRegistry,
  registerWorkflow,
  unregisterWorkflow,
  getWorkflowDefinition,
  listWorkflowDefinitions,
  assertWorkflowRegistered,
  resetWorkflowRegistryForTests,
} from "@/lib/platform/workflows/framework/registry";

export {
  startWorkflowInstance,
  getWorkflowInstance,
  listWorkflowInstances,
  upsertWorkflowInstance,
  resetWorkflowInstancesForTests,
} from "@/lib/platform/workflows/framework/instance";

export { transitionWorkflow } from "@/lib/platform/workflows/framework/transition";

export {
  startWorkflowForEntity,
  listWorkflowsForEntity,
} from "@/lib/platform/workflows/framework/entity-integration";

export {
  getInitialState,
  getState,
  listTransitionsFrom,
  findTransition,
  isTerminalState,
  validateWorkflowDefinition,
} from "@/lib/platform/workflows/framework/definition";

export {
  evaluateConditions,
  evaluateCondition,
  getFactValue,
} from "@/lib/platform/workflows/framework/conditions";

export {
  listAllowedTransitions,
  getInstanceStateLabel,
  instanceIsComplete,
} from "@/lib/platform/workflows/framework/state";

export {
  WORKFLOW_PARTICIPANT_ROLES,
  bindParticipant,
  hasParticipantRole,
  listRequiredParticipants,
  assertRequiredParticipants,
} from "@/lib/platform/workflows/framework/participants";

export {
  appendWorkflowHistory,
  resetWorkflowHistorySequenceForTests,
} from "@/lib/platform/workflows/framework/history";

export {
  canFireTransition,
  assertCanFireTransition,
  canPerformWorkflowAction,
  resolveWorkflowPermission,
} from "@/lib/platform/workflows/framework/permissions";

export {
  executeWorkflowAction,
  executeWorkflowActions,
} from "@/lib/platform/workflows/framework/actions";
export type { WorkflowActionResult } from "@/lib/platform/workflows/framework/actions";

export type {
  StartWorkflowInput,
  TransitionWorkflowInput,
  WorkflowAction,
  WorkflowActionType,
  WorkflowCondition,
  WorkflowConditionGroup,
  WorkflowConditionOperator,
  WorkflowDefinition,
  WorkflowHistoryEntry,
  WorkflowInstance,
  WorkflowInstanceStatus,
  WorkflowParticipantBinding,
  WorkflowParticipantDefinition,
  WorkflowParticipantRole,
  WorkflowStateDefinition,
  WorkflowTransitionDefinition,
} from "@/lib/platform/workflows/framework/types";
