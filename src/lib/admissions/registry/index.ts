export type {
  AdmissionsEntityDefinition,
  AdmissionsEntityStatus,
  AdmissionsIntegrationDefinition,
  AdmissionsIntegrationStatus,
  AdmissionsPipelineStageKey,
  AdmissionsRegistrySnapshot,
  AdmissionsWorkflowCatalogEntry,
  AdmissionsDashboardTileDefinition,
  AdmissionsFunnelStepDefinition,
  PipelineStageDefinition,
} from "@/lib/admissions/registry/types";

export {
  ADMISSIONS_ENTITIES,
} from "@/lib/admissions/registry/entities";

export {
  ADMISSIONS_INTEGRATIONS,
} from "@/lib/admissions/registry/integrations";

export {
  ADMISSIONS_PIPELINE_STAGES,
  ADMISSIONS_PIPELINE_STAGE_KEYS,
  ACTIVE_ADMISSIONS_PIPELINE_STAGES,
  ACTIVE_PIPELINE_LEGACY_STAGES,
  getPipelineStageDefinition,
  groupLeadCountsByPipelineStage,
  pipelineStageColor,
  pipelineStageLabel,
  resolveLegacyLeadStagesForPipelineStage,
  resolvePipelineStageFromLeadStage,
} from "@/lib/admissions/registry/stages";

export {
  getAllowedPipelineTransitions,
  getActiveOrderedPipelineStages,
  getOrderedPipelineStages,
  getPipelineStageAutomatedTask,
  isActivePipelineStage,
  isPipelineTransitionAllowed,
  isTerminalPipelineStage,
  resolvePipelineStageForTrigger,
} from "@/lib/admissions/registry/pipeline";

export {
  ADMISSIONS_WORKFLOW_CATALOG,
  getAdmissionsWorkflowCatalog,
  getAdmissionsWorkflowCatalogEntry,
  getAdmissionsWorkflowsByTrigger,
} from "@/lib/admissions/registry/workflows";

export {
  ADMISSIONS_DASHBOARD_TILES,
  ADMISSIONS_FUNNEL_STEPS,
  getAdmissionsDashboardTiles,
  getAdmissionsFunnelSteps,
} from "@/lib/admissions/registry/dashboard";

export {
  getAdmissionsEntity,
  getAdmissionsIntegration,
  getAdmissionsRegistrySnapshot,
  isAdmissionsRegistryRegistered,
  registerAdmissionsCatalog,
} from "@/lib/admissions/registry/registry";

export {
  validateAdmissionsRegistry,
  type AdmissionsRegistryValidationIssue,
  type AdmissionsRegistryValidationResult,
} from "@/lib/admissions/registry/validate";
