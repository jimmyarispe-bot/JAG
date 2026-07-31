/** Evidence Processing Pipeline™ — orchestration types only (no AI/OCR). */

export const PROCESSING_STAGES = [
  "Upload Complete",
  "File Validation",
  "Virus Scan",
  "Metadata Validation",
  "Classification",
  "Catalog Index",
  "Ready for Intelligence",
] as const;

export type ProcessingStage = (typeof PROCESSING_STAGES)[number];

export const PROCESSING_JOB_STATUSES = [
  "Pending",
  "Queued",
  "Running",
  "Completed",
  "Failed",
  "Cancelled",
] as const;

export type ProcessingJobStatus = (typeof PROCESSING_JOB_STATUSES)[number];

export type ProcessingStageCatalogEntry = {
  readonly id: string;
  readonly name: ProcessingStage;
  readonly sortOrder: number;
  readonly placeholder: boolean;
  readonly description: string;
};

export type EvidenceProcessingEvent = {
  readonly id: string;
  readonly jobId: string;
  readonly organizationId: string;
  readonly evidenceId: string;
  readonly stage: ProcessingStage | "Pipeline";
  readonly eventName: string;
  readonly message: string;
  readonly at: string;
};

export type EvidenceProcessingJob = {
  readonly id: string;
  readonly evidenceId: string;
  readonly organizationId: string;
  readonly currentStage: ProcessingStage;
  readonly status: ProcessingJobStatus;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly durationMs: number | null;
  readonly retryCount: number;
  readonly lastError: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly stageHistory: readonly {
    readonly stage: ProcessingStage;
    readonly at: string;
    readonly status: "completed" | "failed" | "running";
  }[];
};

export type PipelineMetrics = {
  readonly evidenceUploadedToday: number;
  readonly jobsWaiting: number;
  readonly jobsRunning: number;
  readonly jobsCompleted: number;
  readonly jobsFailed: number;
  readonly processingSuccessRate: number;
  readonly averageProcessingTimeMs: number;
  readonly largestQueue: number;
  readonly totalEvidenceProcessed: number;
};
