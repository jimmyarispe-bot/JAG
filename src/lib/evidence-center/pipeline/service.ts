/**
 * Evidence Processing Pipeline™ service — independent of UI.
 * Orchestrates placeholder processors only (no AI/OCR/parsing).
 */

import { randomUUID } from "node:crypto";
import {
  getEvidenceDocument,
  listEvidenceForOrganization,
  updateEvidenceDocument,
} from "@/lib/evidence-center/store";
import { DEFAULT_PROCESSOR_CHAIN } from "@/lib/evidence-center/pipeline/processors";
import {
  getProcessingJob,
  listProcessingEventsForJob,
  listProcessingJobsForOrganization,
  saveProcessingEvent,
  saveProcessingJob,
} from "@/lib/evidence-center/pipeline/store";
import type {
  EvidenceProcessingEvent,
  EvidenceProcessingJob,
  PipelineMetrics,
  ProcessingStage,
} from "@/lib/evidence-center/pipeline/types";

function appendEvidenceTimeline(
  evidenceId: string,
  label: string
): void {
  const doc = getEvidenceDocument(evidenceId);
  if (!doc) return;
  updateEvidenceDocument(evidenceId, {
    timeline: Object.freeze([
      ...doc.timeline,
      {
        id: randomUUID(),
        kind: "pipeline" as const,
        at: new Date().toISOString(),
        label,
      },
    ]),
  });
}

function emitEvent(input: {
  jobId: string;
  organizationId: string;
  evidenceId: string;
  stage: EvidenceProcessingEvent["stage"];
  eventName: string;
  message: string;
}): EvidenceProcessingEvent {
  const event: EvidenceProcessingEvent = {
    id: randomUUID(),
    jobId: input.jobId,
    organizationId: input.organizationId,
    evidenceId: input.evidenceId,
    stage: input.stage,
    eventName: input.eventName,
    message: input.message,
    at: new Date().toISOString(),
  };
  saveProcessingEvent(event);
  appendEvidenceTimeline(input.evidenceId, input.eventName);
  return event;
}

function patchJob(
  jobId: string,
  patch: Partial<EvidenceProcessingJob>
): EvidenceProcessingJob {
  const current = getProcessingJob(jobId);
  if (!current) {
    throw new Error(`Processing job not found: ${jobId}`);
  }
  const next: EvidenceProcessingJob = {
    ...current,
    ...patch,
    id: current.id,
    evidenceId: current.evidenceId,
    organizationId: current.organizationId,
    updatedAt: new Date().toISOString(),
  };
  saveProcessingJob(next);
  return next;
}

/**
 * Create a job for uploaded evidence and run the placeholder pipeline.
 * Called from the evidence service — never from React components.
 */
export function createAndRunProcessingJob(input: {
  readonly evidenceId: string;
  readonly organizationId: string;
}): EvidenceProcessingJob {
  const now = new Date().toISOString();
  const job: EvidenceProcessingJob = {
    id: randomUUID(),
    evidenceId: input.evidenceId,
    organizationId: input.organizationId,
    currentStage: "Upload Complete",
    status: "Pending",
    startedAt: null,
    completedAt: null,
    durationMs: null,
    retryCount: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    stageHistory: Object.freeze([
      { stage: "Upload Complete", at: now, status: "completed" as const },
    ]),
  };
  saveProcessingJob(job);
  emitEvent({
    jobId: job.id,
    organizationId: input.organizationId,
    evidenceId: input.evidenceId,
    stage: "Upload Complete",
    eventName: "Upload Received",
    message: "Evidence upload received by the processing pipeline.",
  });

  updateEvidenceDocument(input.evidenceId, { status: "queued" });
  return runProcessingJob(job.id);
}

export function runProcessingJob(jobId: string): EvidenceProcessingJob {
  let job = getProcessingJob(jobId);
  if (!job) {
    throw new Error(`Processing job not found: ${jobId}`);
  }
  if (job.status === "Cancelled") {
    return job;
  }

  const startedAt = job.startedAt ?? new Date().toISOString();
  job = patchJob(jobId, {
    status: "Queued",
    startedAt,
    lastError: null,
  });
  updateEvidenceDocument(job.evidenceId, { status: "processing" });

  job = patchJob(jobId, { status: "Running" });

  const history = [...job.stageHistory];

  for (const module of DEFAULT_PROCESSOR_CHAIN) {
    const stage = module.stage;
    history.push({
      stage,
      at: new Date().toISOString(),
      status: "running",
    });
    job = patchJob(jobId, {
      currentStage: stage,
      status: "Running",
      stageHistory: Object.freeze([...history]),
    });

    const result = module.run({
      jobId,
      evidenceId: job.evidenceId,
      organizationId: job.organizationId,
      stage,
    });

    if (!result.ok) {
      history[history.length - 1] = {
        stage,
        at: new Date().toISOString(),
        status: "failed",
      };
      const failed = patchJob(jobId, {
        status: "Failed",
        currentStage: stage,
        lastError: result.error,
        completedAt: new Date().toISOString(),
        durationMs:
          Date.now() - new Date(startedAt).getTime(),
        stageHistory: Object.freeze([...history]),
      });
      updateEvidenceDocument(job.evidenceId, { status: "failed" });
      emitEvent({
        jobId,
        organizationId: job.organizationId,
        evidenceId: job.evidenceId,
        stage,
        eventName: "Stage Failed",
        message: result.error,
      });
      return failed;
    }

    history[history.length - 1] = {
      stage,
      at: new Date().toISOString(),
      status: "completed",
    };
    emitEvent({
      jobId,
      organizationId: job.organizationId,
      evidenceId: job.evidenceId,
      stage,
      eventName: result.eventName,
      message: result.message,
    });
  }

  const readyStage: ProcessingStage = "Ready for Intelligence";
  if (!history.some((h) => h.stage === readyStage)) {
    history.push({
      stage: readyStage,
      at: new Date().toISOString(),
      status: "completed",
    });
  }

  const completedAt = new Date().toISOString();
  const completed = patchJob(jobId, {
    status: "Completed",
    currentStage: readyStage,
    completedAt,
    durationMs: Date.now() - new Date(startedAt).getTime(),
    stageHistory: Object.freeze([...history]),
    lastError: null,
  });

  updateEvidenceDocument(job.evidenceId, { status: "completed" });
  emitEvent({
    jobId,
    organizationId: job.organizationId,
    evidenceId: job.evidenceId,
    stage: readyStage,
    eventName: "Ready for Intelligence",
    message: "Pipeline complete — evidence ready for future intelligence.",
  });

  return completed;
}

export function retryProcessingJob(input: {
  readonly organizationId: string;
  readonly jobId: string;
}):
  | { readonly ok: true; readonly job: EvidenceProcessingJob }
  | { readonly ok: false; readonly error: string } {
  const job = getProcessingJob(input.jobId);
  if (!job || job.organizationId !== input.organizationId) {
    return { ok: false, error: "Processing job not found." };
  }
  if (job.status !== "Failed" && job.status !== "Cancelled") {
    return { ok: false, error: "Only failed or cancelled jobs can be retried." };
  }

  const reset: EvidenceProcessingJob = {
    ...job,
    status: "Pending",
    currentStage: "Upload Complete",
    startedAt: null,
    completedAt: null,
    durationMs: null,
    lastError: null,
    retryCount: job.retryCount + 1,
    updatedAt: new Date().toISOString(),
    stageHistory: Object.freeze([
      {
        stage: "Upload Complete" as const,
        at: new Date().toISOString(),
        status: "completed" as const,
      },
    ]),
  };
  saveProcessingJob(reset);
  emitEvent({
    jobId: job.id,
    organizationId: job.organizationId,
    evidenceId: job.evidenceId,
    stage: "Pipeline",
    eventName: "Retry Started",
    message: `Retry #${reset.retryCount} started.`,
  });

  return { ok: true, job: runProcessingJob(job.id) };
}

export function getProcessingJobForOrganization(
  organizationId: string,
  jobId: string
): EvidenceProcessingJob | undefined {
  const job = getProcessingJob(jobId);
  if (!job || job.organizationId !== organizationId) return undefined;
  return job;
}

export function listJobsForOrganization(
  organizationId: string
): readonly EvidenceProcessingJob[] {
  return listProcessingJobsForOrganization(organizationId);
}

export function listEventsForJob(
  organizationId: string,
  jobId: string
): readonly EvidenceProcessingEvent[] {
  return listProcessingEventsForJob(organizationId, jobId);
}

/** Test helper — mark a completed job failed so retry can be exercised. */
export function forceFailProcessingJobForTests(jobId: string, error: string): void {
  const job = getProcessingJob(jobId);
  if (!job) return;
  saveProcessingJob({
    ...job,
    status: "Failed",
    lastError: error,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  updateEvidenceDocument(job.evidenceId, { status: "failed" });
}

export function pipelineDashboardMetrics(
  organizationId: string
): PipelineMetrics {
  const jobs = listProcessingJobsForOrganization(organizationId);
  const docs = listEvidenceForOrganization(organizationId);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayIso = startOfDay.toISOString();

  const waiting = jobs.filter(
    (j) => j.status === "Pending" || j.status === "Queued"
  ).length;
  const running = jobs.filter((j) => j.status === "Running").length;
  const completed = jobs.filter((j) => j.status === "Completed");
  const failed = jobs.filter((j) => j.status === "Failed");
  const finished = completed.length + failed.length;
  const durations = completed
    .map((j) => j.durationMs)
    .filter((d): d is number => typeof d === "number");
  const averageProcessingTimeMs =
    durations.length === 0
      ? 0
      : Math.round(
          durations.reduce((sum, d) => sum + d, 0) / durations.length
        );

  return {
    evidenceUploadedToday: docs.filter((d) => d.createdAt >= dayIso).length,
    jobsWaiting: waiting,
    jobsRunning: running,
    jobsCompleted: completed.length,
    jobsFailed: failed.length,
    processingSuccessRate:
      finished === 0
        ? 100
        : Math.round((completed.length / finished) * 1000) / 10,
    averageProcessingTimeMs,
    largestQueue: waiting,
    totalEvidenceProcessed: completed.length,
  };
}
