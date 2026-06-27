import type { AdmissionsPipelineStageKey } from "@/lib/admissions/registry/types";
import {
  ADMISSIONS_PIPELINE_STAGES,
  getPipelineStageDefinition,
} from "@/lib/admissions/registry/stages";

export {
  daysBetween,
  daysInCurrentStage,
  pipelineAgingClasses,
  pipelineAgingDotClass,
  totalDaysInPipeline,
} from "@/lib/admissions/workflow";

/** Allowed forward transitions between OS pipeline stages. */
const ALLOWED_TRANSITIONS: Partial<
  Record<AdmissionsPipelineStageKey, AdmissionsPipelineStageKey[]>
> = {
  inquiry: ["information_requested", "application_started", "declined"],
  information_requested: ["application_started", "declined"],
  application_started: ["application_submitted", "declined"],
  application_submitted: ["documents_pending", "committee_review", "declined"],
  documents_pending: ["documents_complete", "declined"],
  documents_complete: ["interview_scheduled", "assessment_scheduled", "committee_review", "declined"],
  interview_scheduled: ["assessment_scheduled", "committee_review", "declined"],
  assessment_scheduled: ["assessment_complete", "declined"],
  assessment_complete: ["committee_review", "declined"],
  committee_review: ["accepted", "waitlisted", "declined"],
  accepted: ["enrollment_complete", "declined"],
  waitlisted: ["accepted", "declined", "enrollment_complete"],
};

export function getAllowedPipelineTransitions(
  from: AdmissionsPipelineStageKey
): AdmissionsPipelineStageKey[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}

export function isPipelineTransitionAllowed(
  from: AdmissionsPipelineStageKey,
  to: AdmissionsPipelineStageKey
): boolean {
  const allowed = getAllowedPipelineTransitions(from);
  return allowed.includes(to);
}

export function isTerminalPipelineStage(key: AdmissionsPipelineStageKey): boolean {
  return getPipelineStageDefinition(key)?.isTerminal ?? false;
}

export function isActivePipelineStage(key: AdmissionsPipelineStageKey): boolean {
  return getPipelineStageDefinition(key)?.isActivePipeline ?? false;
}

export function getPipelineStageAutomatedTask(key: AdmissionsPipelineStageKey) {
  return getPipelineStageDefinition(key)?.automatedTask;
}

/** Ordered pipeline stages for kanban-style displays. */
export function getOrderedPipelineStages() {
  return [...ADMISSIONS_PIPELINE_STAGES].sort((a, b) => a.order - b.order);
}

export function getActiveOrderedPipelineStages() {
  return getOrderedPipelineStages().filter((stage) => stage.isActivePipeline);
}

/** Resolve the next recommended OS stage after a workflow trigger. */
export function resolvePipelineStageForTrigger(
  triggerEvent: string
): AdmissionsPipelineStageKey | null {
  const triggerToStage: Partial<Record<string, AdmissionsPipelineStageKey>> = {
    inquiry_submitted: "inquiry",
    application_started: "application_started",
    application_submitted: "application_submitted",
    documents_uploaded: "documents_complete",
    missing_documents: "documents_pending",
    interview_scheduled: "interview_scheduled",
    interview_completed: "committee_review",
    accepted: "accepted",
    waitlisted: "waitlisted",
    declined: "declined",
    enrollment_completed: "enrollment_complete",
  };
  return triggerToStage[triggerEvent] ?? null;
}
