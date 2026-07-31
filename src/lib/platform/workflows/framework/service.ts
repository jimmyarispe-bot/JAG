import {
  evaluateCondition,
  evaluateConditions,
  getFactValue,
} from "@/lib/platform/workflows/framework/conditions";
import {
  findTransition,
  getInitialState,
  getState,
  isTerminalState,
  listTransitionsFrom,
  validateWorkflowDefinition,
} from "@/lib/platform/workflows/framework/definition";
import {
  listWorkflowsForEntity,
  startWorkflowForEntity,
} from "@/lib/platform/workflows/framework/entity-integration";
import { resetWorkflowHistorySequenceForTests } from "@/lib/platform/workflows/framework/history";
import {
  getWorkflowInstance,
  listWorkflowInstances,
  resetWorkflowInstancesForTests,
  startWorkflowInstance,
} from "@/lib/platform/workflows/framework/instance";
import {
  bindParticipant,
  hasParticipantRole,
  listRequiredParticipants,
  WORKFLOW_PARTICIPANT_ROLES,
} from "@/lib/platform/workflows/framework/participants";
import {
  canFireTransition,
  canPerformWorkflowAction,
  resolveWorkflowPermission,
} from "@/lib/platform/workflows/framework/permissions";
import {
  WorkflowRegistry,
  resetWorkflowRegistryForTests,
} from "@/lib/platform/workflows/framework/registry";
import {
  getInstanceStateLabel,
  instanceIsComplete,
  listAllowedTransitions,
} from "@/lib/platform/workflows/framework/state";
import { transitionWorkflow } from "@/lib/platform/workflows/framework/transition";

export function resetWorkflowFrameworkForTests(): void {
  resetWorkflowRegistryForTests();
  resetWorkflowInstancesForTests();
  resetWorkflowHistorySequenceForTests();
}

/**
 * Universal Workflow Framework service.
 * Applications register definitions; platform executes transitions.
 */
export const WorkflowService = {
  registry: WorkflowRegistry,
  register: WorkflowRegistry.register,
  unregister: WorkflowRegistry.unregister,
  getDefinition: WorkflowRegistry.get,
  listDefinitions: WorkflowRegistry.list,

  validateDefinition: validateWorkflowDefinition,
  getInitialState,
  getState,
  listTransitionsFrom,
  findTransition,
  isTerminalState,

  start: startWorkflowInstance,
  startForEntity: startWorkflowForEntity,
  getInstance: getWorkflowInstance,
  listInstances: listWorkflowInstances,
  listForEntity: listWorkflowsForEntity,
  transition: transitionWorkflow,

  listAllowedTransitions,
  getStateLabel: getInstanceStateLabel,
  isComplete: instanceIsComplete,

  evaluateConditions,
  evaluateCondition,
  getFactValue,

  participantRoles: WORKFLOW_PARTICIPANT_ROLES,
  bindParticipant,
  hasParticipantRole,
  listRequiredParticipants,

  canFireTransition,
  canPerform: canPerformWorkflowAction,
  resolvePermission: resolveWorkflowPermission,

  resetForTests: resetWorkflowFrameworkForTests,
} as const;

export type WorkflowServiceApi = typeof WorkflowService;
