export {
  PROCESSING_STAGES,
  PROCESSING_JOB_STATUSES,
  type ProcessingStage,
  type ProcessingJobStatus,
  type ProcessingStageCatalogEntry,
  type EvidenceProcessingJob,
  type EvidenceProcessingEvent,
  type PipelineMetrics,
} from "@/lib/evidence-center/pipeline/types";

export { PROCESSING_STAGE_CATALOG } from "@/lib/evidence-center/pipeline/stage-catalog";

export {
  DEFAULT_PROCESSOR_CHAIN,
  validationModule,
  virusScanModule,
  metadataValidationModule,
  classificationModule,
  indexModule,
  ocrModulePlaceholder,
  extractionModulePlaceholder,
  executiveIntelligenceModulePlaceholder,
  type EvidenceProcessorModule,
  type ProcessorContext,
  type ProcessorResult,
} from "@/lib/evidence-center/pipeline/processors";

export { resetPipelineStoreForTests } from "@/lib/evidence-center/pipeline/store";

export {
  createAndRunProcessingJob,
  runProcessingJob,
  retryProcessingJob,
  getProcessingJobForOrganization,
  listJobsForOrganization,
  listEventsForJob,
  pipelineDashboardMetrics,
  forceFailProcessingJobForTests,
} from "@/lib/evidence-center/pipeline/service";
