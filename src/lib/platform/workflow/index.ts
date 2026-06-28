/** Platform Workflow Engine — B-04 Phase 1 foundation */
import "@/lib/platform/workflow/registry/register";

export * from "@/lib/platform/workflow/types";
export * from "@/lib/platform/workflow/catalog/actions";
export * from "@/lib/platform/workflow/catalog/triggers";
export * from "@/lib/platform/workflow/catalog/reference-definitions";
export * from "@/lib/platform/workflow/conditions/evaluator";
export * from "@/lib/platform/workflow/registry/registry";
export * from "@/lib/platform/workflow/registry/validate";
export * from "@/lib/platform/workflow/engine/context";
export * from "@/lib/platform/workflow/engine/audit";
export * from "@/lib/platform/workflow/engine/skeleton";
export * from "@/lib/platform/workflow/engine/execute";
export * from "@/lib/platform/workflow/persistence/types";
export {
  getPublishedWorkflowVersion,
  getWorkflowVersionById,
  listWorkflowVersions,
} from "@/lib/platform/workflow/persistence/definitions";
export {
  getActiveWorkflowInstance,
  getOrCreateWorkflowInstance,
  updateWorkflowInstanceState,
  getWorkflowInstanceById,
} from "@/lib/platform/workflow/persistence/instances";
export {
  persistWorkflowStateChange,
  listWorkflowStateHistory,
} from "@/lib/platform/workflow/persistence/history";
export {
  createWorkflowTask,
  listWorkflowTasks,
} from "@/lib/platform/workflow/persistence/tasks";
export {
  createPersistedWorkflowApproval,
  decidePersistedWorkflowApproval,
  listPendingWorkflowApprovals,
} from "@/lib/platform/workflow/persistence/approvals";
export {
  createWorkflowTimer,
  listPendingWorkflowTimers,
  cancelWorkflowTimers,
} from "@/lib/platform/workflow/persistence/timers";
export * from "@/lib/platform/workflow/approval/framework";
