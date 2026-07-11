/**
 * End-to-End Executive Workflow Engine — public API (Sprint 018).
 */

export {
  EXECUTIVE_WORKFLOW_ENGINE_VERSION,
  WORKFLOW_DOMAINS,
  WORKFLOW_RUN_STATUSES,
  WORKFLOW_STAGES,
  type WorkflowDomain,
  type WorkflowDomainConfig,
  type WorkflowMetadata,
  type WorkflowRecommendationRef,
  type WorkflowRunRequest,
  type WorkflowRunResult,
  type WorkflowRunStatus,
  type WorkflowStage,
  type WorkflowStageRecord,
} from "@/lib/platform/workflows/types";

export {
  WORKFLOW_DOMAIN_CONFIGS,
  getWorkflowDomainConfig,
} from "@/lib/platform/workflows/domain-configs";

export {
  WorkflowPipeline,
  type WorkflowPipelineDependencies,
} from "@/lib/platform/workflows/pipeline";

export {
  DomainWorkflow,
  createDomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/workflows/domain-workflow";

export {
  ExecutiveWorkflowEngine,
  createExecutiveWorkflowEngine,
  type ExecutiveWorkflowEngineDependencies,
} from "@/lib/platform/workflows/engine";

export { createExecutiveWorkflow } from "@/lib/platform/workflows/executive";
export { createStrategicWorkflow } from "@/lib/platform/workflows/strategic";
export { createGovernanceWorkflow } from "@/lib/platform/workflows/governance";
export { createFinanceWorkflow } from "@/lib/platform/workflows/finance";
export { createHrWorkflow } from "@/lib/platform/workflows/hr";
export { createOperationsWorkflow } from "@/lib/platform/workflows/operations";
export { createEnrollmentWorkflow } from "@/lib/platform/workflows/enrollment";
export { createAcademicsWorkflow } from "@/lib/platform/workflows/academics";
export { createComplianceWorkflow } from "@/lib/platform/workflows/compliance";
export { createBoardWorkflow } from "@/lib/platform/workflows/board";
