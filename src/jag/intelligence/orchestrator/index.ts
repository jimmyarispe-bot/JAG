/**
 * Executive Intelligence Orchestrator v1
 *
 * Coordinates EI end-to-end. No business logic. No provider-specific logic.
 */

export { EXECUTIVE_INTELLIGENCE_ORCHESTRATOR_VERSION } from "@/jag/intelligence/orchestrator/version";

export {
  ORCHESTRATOR_FAILURE_CODES,
  orchestratorFailure,
  type OrchestratorFailureCode,
  type OrchestratorFailure,
} from "@/jag/intelligence/orchestrator/failures";

export {
  createExecutionContext,
  noteExecution,
  recordStageDuration,
  type StageDuration,
  type ExecutionDiagnostics,
  type ExecutionMetadata,
  type ExecutionContext,
  type CreateExecutionContextInput,
} from "@/jag/intelligence/orchestrator/execution-context";

export type {
  Question,
  Answer,
  OrchestratorSuccess,
  OrchestratorErrorResult,
  PipelineState,
  PipelineStageResult,
  PipelineStage,
  OrchestratorHostBindings,
} from "@/jag/intelligence/orchestrator/types";

export { assembleExecutiveAnswer } from "@/jag/intelligence/orchestrator/assemble-answer";

export {
  ORCHESTRATOR_STAGE_IDS,
  createDefaultOrchestratorStages,
  type OrchestratorStageId,
} from "@/jag/intelligence/orchestrator/stages";

export {
  createPipelineExecutor,
  type PipelineExecutor,
} from "@/jag/intelligence/orchestrator/pipeline-executor";

export {
  ExecutiveIntelligenceOrchestrator,
  createExecutiveIntelligenceOrchestrator,
  type ExecutiveIntelligenceOrchestratorApi,
} from "@/jag/intelligence/orchestrator/orchestrator";
