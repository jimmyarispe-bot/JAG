import type {
  EvidenceProcessingEvent,
  EvidenceProcessingJob,
} from "@/lib/evidence-center/pipeline/types";

const globalStore = globalThis as typeof globalThis & {
  __jagEvidenceJobs?: Map<string, EvidenceProcessingJob>;
  __jagEvidenceJobEvents?: Map<string, EvidenceProcessingEvent>;
};

function jobs(): Map<string, EvidenceProcessingJob> {
  if (!globalStore.__jagEvidenceJobs) {
    globalStore.__jagEvidenceJobs = new Map();
  }
  return globalStore.__jagEvidenceJobs;
}

function events(): Map<string, EvidenceProcessingEvent> {
  if (!globalStore.__jagEvidenceJobEvents) {
    globalStore.__jagEvidenceJobEvents = new Map();
  }
  return globalStore.__jagEvidenceJobEvents;
}

export function resetPipelineStoreForTests(): void {
  jobs().clear();
  events().clear();
}

export function saveProcessingJob(job: EvidenceProcessingJob): void {
  jobs().set(job.id, job);
}

export function getProcessingJob(
  jobId: string
): EvidenceProcessingJob | undefined {
  return jobs().get(jobId);
}

export function listProcessingJobsForOrganization(
  organizationId: string
): readonly EvidenceProcessingJob[] {
  return Object.freeze(
    [...jobs().values()]
      .filter((j) => j.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function listProcessingJobsForEvidence(
  organizationId: string,
  evidenceId: string
): readonly EvidenceProcessingJob[] {
  return Object.freeze(
    listProcessingJobsForOrganization(organizationId).filter(
      (j) => j.evidenceId === evidenceId
    )
  );
}

export function saveProcessingEvent(event: EvidenceProcessingEvent): void {
  events().set(event.id, event);
}

export function listProcessingEventsForJob(
  organizationId: string,
  jobId: string
): readonly EvidenceProcessingEvent[] {
  return Object.freeze(
    [...events().values()]
      .filter((e) => e.organizationId === organizationId && e.jobId === jobId)
      .sort((a, b) => a.at.localeCompare(b.at))
  );
}
