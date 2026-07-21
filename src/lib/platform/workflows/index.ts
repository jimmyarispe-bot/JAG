/**
 * RC-7 — Workflow Automation Studio
 *
 * Visual workflow engine with nodes:
 * Trigger · Condition · Action · Approval · Delay · Notification ·
 * Integration · AI Step · Graph Update
 *
 * Soft-reads knowledge-graph + domain feeds + Copilot 2.0.
 * Does not call connector vendor APIs from Integration nodes.
 * Approvals always require humans. Default execution is dry-run.
 *
 * Legacy executive workflows: `@/lib/platform/executive-workflows`.
 */

export {
  WORKFLOW_STUDIO_VERSION,
  STUDIO_NODE_TYPES,
  EXAMPLE_WORKFLOW_KEYS,
  type StudioNodeType,
  type StudioWorkflowStatus,
  type StudioRunStatus,
  type StudioNode,
  type StudioEdge,
  type StudioWorkflowDefinition,
  type StudioNodeResult,
  type StudioRunResult,
  type ExampleWorkflowKey,
} from "./types";

export {
  validateStudioWorkflow,
  type StudioValidationResult,
} from "./engine/validate";

export {
  executeStudioWorkflow,
  type ExecuteStudioWorkflowInput,
} from "./engine/execute";

export {
  createWorkflowStudioEngine,
} from "./engine/studio-engine";

export {
  getStudioNodeCatalog,
  type StudioNodeCatalogEntry,
} from "./catalog/node-catalog";

export {
  defineWorkflow,
  n,
  e,
  resetStudioIdSeqForTests,
} from "./catalog/builders";

export {
  getExampleWorkflow,
  listExampleWorkflows,
  getExampleWorkflowCatalog,
  employeeOnboardingWorkflow,
  budgetApprovalWorkflow,
} from "./examples/catalog";
