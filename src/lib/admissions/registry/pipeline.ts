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
/**
 * Allowed forward transitions between OS pipeline stages.
 *
 * REORDERED 24 September 2026. The application now comes BEFORE the shadow
 * days, which is how The Academy Way actually admits a child and how the
 * emails have always fired: invited to apply after the tour or interest
 * meeting, invited to shadow days once the application is submitted, accepted
 * or denied once the shadow days are done. Jimmy, 24 Sep: "the application
 * started comes before the shadow days scheduled. after the shadow days
 * completed, then the decision needs to be made."
 *
 * `documents_pending` and `committee_review` are gone from every list here.
 * They are off the board (see stages.ts) and nothing should route a family
 * into a column nobody can see. The keys remain valid so an existing lead
 * carrying one still resolves; they are simply no longer a destination.
 */
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
  // Gate 1 (invite_to_apply) opens here and at tour_conducted.
  interest_meeting_held: [
    "tour_requested",
    "application_started",
    "declined",
    "not_returning",
  ],
  tour_requested: ["tour_scheduled", "declined", "not_returning"],
  tour_scheduled: ["tour_conducted", "declined", "not_returning"],
  tour_conducted: ["application_started", "declined", "not_returning"],
  application_started: ["application_submitted", "declined", "not_returning"],
  // Gate 2 (invite_to_shadow_days) opens here.
  application_submitted: ["shadow_day_scheduled", "declined", "not_returning"],
  shadow_day_scheduled: ["shadow_day_completed", "declined", "not_returning"],
  // Gate 3 (accept_or_deny) opens here. This is the Decision column on the
  // board, and answering it is what moves the family on.
  shadow_day_completed: ["accepted", "waitlisted", "declined", "not_returning"],
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
