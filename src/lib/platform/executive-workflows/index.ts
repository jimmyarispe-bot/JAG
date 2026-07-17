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
} from "@/lib/platform/executive-workflows/types";

export {
  WORKFLOW_DOMAIN_CONFIGS,
  getWorkflowDomainConfig,
} from "@/lib/platform/executive-workflows/domain-configs";

export {
  WorkflowPipeline,
  type WorkflowPipelineDependencies,
} from "@/lib/platform/executive-workflows/pipeline";

export {
  DomainWorkflow,
  createDomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/executive-workflows/domain-workflow";

export {
  ExecutiveWorkflowEngine,
  createExecutiveWorkflowEngine,
  type ExecutiveWorkflowEngineDependencies,
} from "@/lib/platform/executive-workflows/engine";

export { createExecutiveWorkflow } from "@/lib/platform/executive-workflows/executive";
export { createStrategicWorkflow } from "@/lib/platform/executive-workflows/strategic";
export { createGovernanceWorkflow } from "@/lib/platform/executive-workflows/governance";
export { createFinanceWorkflow } from "@/lib/platform/executive-workflows/finance";
export { createHrWorkflow } from "@/lib/platform/executive-workflows/hr";
export { createOperationsWorkflow } from "@/lib/platform/executive-workflows/operations";
export { createEnrollmentWorkflow } from "@/lib/platform/executive-workflows/enrollment";
export { createAcademicsWorkflow } from "@/lib/platform/executive-workflows/academics";
export { createComplianceWorkflow } from "@/lib/platform/executive-workflows/compliance";
export { createBoardWorkflow } from "@/lib/platform/executive-workflows/board";
