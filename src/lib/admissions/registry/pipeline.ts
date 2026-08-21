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
  inquiry: ["interest_meeting_requested", "declined", "not_returning"],
  interest_meeting_requested: [
    "interest_call_scheduled",
    "interest_meeting_held",
    "tour_requested",
    "declined",
    "not_returning",
  ],
  interest_call_scheduled: ["interest_meeting_held", "declined", "not_returning"],
  interest_meeting_held: [
    "tour_requested",
    "shadow_day_scheduled",
    "application_started",
    "declined",
    "not_returning",
  ],
  tour_requested: ["tour_scheduled", "declined", "not_returning"],
  tour_scheduled: ["tour_conducted", "declined", "not_returning"],
  tour_conducted: ["shadow_day_scheduled", "application_started", "declined", "not_returning"],
  shadow_day_scheduled: [
    "application_started",
    "committee_review",
    "declined",
    "not_returning",
  ],
  application_started: ["application_submitted", "declined", "not_returning"],
  application_submitted: ["documents_pending", "committee_review", "declined"],
  documents_pending: ["committee_review", "declined"],
  committee_review: ["accepted", "waitlisted", "declined"],
  accepted: ["enrollment_complete", "declined", "not_returning"],
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
    documents_uploaded: "documents_pending",
    missing_documents: "documents_pending",
    interview_scheduled: "interest_call_scheduled",
    interview_completed: "committee_review",
    accepted: "accepted",
    waitlisted: "waitlisted",
    declined: "declined",
    enrollment_completed: "enrollment_complete",
  };
  return triggerToStage[triggerEvent] ?? null;
}
