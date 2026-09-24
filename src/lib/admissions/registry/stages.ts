import type {
  AdmissionsPipelineStageKey,
  PipelineStageDefinition,
} from "@/lib/admissions/registry/types";

/**
 * Canonical Admissions OS pipeline (B-03), aligned to The Academy Way's operating
 * process. Ordered from inquiry to enrollment.
 *
 * Design rule: a stage describes where the *family* is. Staff to-dos — send the
 * application, send the acceptance email, countersign the contract — are open
 * tasks on the lead, not stages, so nothing can sit in a column indefinitely
 * with no signal of age. `automatedTask` below creates those follow-ups.
 */
export const ADMISSIONS_PIPELINE_STAGES: PipelineStageDefinition[] = [
  {
    key: "inquiry",
    label: "Inquiry Received",
    color: "bg-slate-100 text-slate-700",
    order: 0,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["new_inquiry"],
    automatedTask: { taskName: "Request interest meeting", dueDays: 2 },
  },
  {
    key: "interest_meeting_requested",
    label: "Interest Meeting Requested",
    color: "bg-blue-100 text-blue-700",
    order: 10,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["information_sent"],
    automatedTask: { taskName: "Follow up on interest meeting request", dueDays: 3 },
  },
  {
    key: "interest_call_scheduled",
    label: "Interest Call Scheduled",
    color: "bg-sky-100 text-sky-700",
    order: 20,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["interview_scheduled"],
  },
  {
    key: "interest_meeting_held",
    label: "Interest Meeting Held",
    color: "bg-cyan-100 text-cyan-700",
    order: 30,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["interest_meeting_held"],
    automatedTask: { taskName: "Send application to family", dueDays: 2 },
  },
  {
    key: "tour_requested",
    label: "Tour Requested",
    color: "bg-teal-100 text-teal-700",
    order: 40,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["tour_requested"],
    automatedTask: { taskName: "Follow up on tour request", dueDays: 3 },
  },
  {
    key: "tour_scheduled",
    label: "School Tour Scheduled",
    color: "bg-emerald-100 text-emerald-700",
    order: 50,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["tour_scheduled"],
  },
  {
    key: "tour_conducted",
    label: "Tour Conducted",
    color: "bg-green-100 text-green-700",
    order: 60,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["tour_completed"],
    automatedTask: { taskName: "Follow up after tour", dueDays: 3 },
  },
  {
    key: "shadow_day_scheduled",
    label: "Shadow Days Scheduled",
    color: "bg-lime-100 text-lime-700",
    order: 90,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["shadow_day_scheduled", "assessment_scheduled"],
  },
  {
    /**
     * THE STAGE THAT ERASED A CHILD.
     *
     * 15 September 2026. Heather Badger-Brown clicked "finished shadow day"
     * for Julian Oubre Towa, which is the correct action - it is what opens
     * gate 3, the accept-or-deny decision. He then vanished from the pipeline
     * board completely.
     *
     * `shadow_day_completed` is a real lead stage. It is in LEAD_STAGES, so it
     * sits in the dropdown on every card. shadow-days-actions.ts writes it.
     * gates/definitions.ts opens the final decision at it. It arrived in
     * migration 246 and THIS REGISTRY WAS NEVER TOLD.
     *
     * With no stage claiming it, resolvePipelineStageFromLeadStage returned
     * null, the card matched no column, and it was simply not drawn. No error,
     * no empty state, no "1 hidden" - the exact failure this codebase keeps
     * producing: a silent disappearance that looks like data loss.
     *
     * It was not only the board. ACTIVE_PIPELINE_LEGACY_STAGES is built by
     * flat-mapping the legacyLeadStages of active stages, and executive/kpis.ts
     * and dashboard/metrics.ts both count from it. So every family who
     * completed a shadow day was missing from the network's own numbers too -
     * the ones furthest down the funnel, closest to enrolling, uncounted.
     *
     * Its own column rather than folding into Shadow Days Scheduled, because
     * "the shadow day happened and a decision is waiting on a human" is the
     * single most actionable state in the pipeline, and labelling it
     * "Scheduled" would hide that under a word that says the opposite.
     */
    key: "shadow_day_completed",
    label: "Shadow Days Completed",
    color: "bg-lime-200 text-lime-900",
    order: 100,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["shadow_day_completed"],
    automatedTask: { taskName: "Answer the accept or deny decision", dueDays: 2 },
  },
  {
    key: "application_started",
    label: "Application Started",
    color: "bg-indigo-100 text-indigo-700",
    order: 70,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["application_started"],
    automatedTask: { taskName: "Follow up on application progress", dueDays: 7 },
  },
  {
    key: "application_submitted",
    label: "Application Submitted",
    color: "bg-violet-100 text-violet-700",
    order: 80,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["application_submitted"],
  },
  {
    /**
     * OFF THE BOARD, 24 September 2026, and its neighbour below with it.
     *
     * Jimmy: "i have no idea what those are or where those came from. documents
     * are included in the application so why would there be a documents pending
     * column. we don't have a committee so where did that come from."
     *
     * Both arrived with a generic admissions template and neither describes how
     * The Academy Way actually admits a child. Documents come in with the
     * application; there is no committee - the school leader answers the
     * accept-or-deny gate.
     *
     * DEACTIVATED RATHER THAN DELETED. The stage keys are still valid values in
     * the type union, in ALLOWED_TRANSITIONS and in resolvePipelineStageForTrigger,
     * and a lead somewhere could still carry `records_requested` or
     * `admissions_review`. Deleting the definition would make such a lead resolve
     * to no column and vanish silently - precisely the bug documented on
     * shadow_day_completed above. isActivePipeline:false takes the column off the
     * board and leaves the stage interpretable.
     *
     * Verified empty before this change: zero leads at `records_requested`, zero
     * at `admissions_review`
     * (supabase/diagnostics/who_is_in_the_two_columns_2026_09_24.sql).
     */
    key: "documents_pending",
    label: "Documents Pending",
    color: "bg-purple-100 text-purple-700",
    order: 100,
    isTerminal: false,
    isActivePipeline: false,
    legacyLeadStages: ["records_requested"],
    automatedTask: { taskName: "Follow up on records request", dueDays: 5 },
  },
  {
    key: "committee_review",
    label: "Committee Review",
    color: "bg-fuchsia-100 text-fuchsia-700",
    order: 110,
    isTerminal: false,
    isActivePipeline: false,
    legacyLeadStages: ["admissions_review"],
  },
  {
    key: "accepted",
    label: "Accepted",
    color: "bg-amber-100 text-amber-800",
    order: 120,
    isTerminal: true,
    isActivePipeline: false,
    legacyLeadStages: ["accepted"],
  },
  {
    key: "waitlisted",
    label: "Waitlisted",
    color: "bg-orange-100 text-orange-800",
    order: 130,
    isTerminal: true,
    isActivePipeline: false,
    legacyLeadStages: ["waitlisted"],
  },
  {
    key: "declined",
    label: "Declined to Enroll",
    color: "bg-rose-100 text-rose-700",
    order: 140,
    isTerminal: true,
    isActivePipeline: false,
    legacyLeadStages: ["declined"],
  },
  {
    key: "not_returning",
    label: "Not Returning",
    color: "bg-stone-100 text-stone-700",
    order: 150,
    isTerminal: true,
    isActivePipeline: false,
    legacyLeadStages: ["not_returning"],
  },
  {
    key: "enrollment_complete",
    label: "Enrolled",
    color: "bg-green-200 text-green-900",
    order: 160,
    isTerminal: true,
    isActivePipeline: false,
    legacyLeadStages: ["enrolled"],
  },
];

export const ADMISSIONS_PIPELINE_STAGE_KEYS = ADMISSIONS_PIPELINE_STAGES.map((s) => s.key);

export const ACTIVE_ADMISSIONS_PIPELINE_STAGES = ADMISSIONS_PIPELINE_STAGES.filter(
  (s) => s.isActivePipeline
);

/** Legacy lead stages that represent active (non-terminal) pipeline positions. */
export const ACTIVE_PIPELINE_LEGACY_STAGES = ADMISSIONS_PIPELINE_STAGES.filter(
  (s) => s.isActivePipeline
).flatMap((s) => s.legacyLeadStages);

const legacyToPipeline = new Map<string, AdmissionsPipelineStageKey>();
for (const stage of ADMISSIONS_PIPELINE_STAGES) {
  for (const legacy of stage.legacyLeadStages) {
    legacyToPipeline.set(legacy, stage.key);
  }
}

const pipelineStageByKey = new Map(
  ADMISSIONS_PIPELINE_STAGES.map((stage) => [stage.key, stage])
);

export function getPipelineStageDefinition(
  key: AdmissionsPipelineStageKey
): PipelineStageDefinition | undefined {
  return pipelineStageByKey.get(key);
}

export function pipelineStageLabel(key: AdmissionsPipelineStageKey | string): string {
  return getPipelineStageDefinition(key as AdmissionsPipelineStageKey)?.label ?? key;
}

export function pipelineStageColor(key: AdmissionsPipelineStageKey | string): string {
  return (
    getPipelineStageDefinition(key as AdmissionsPipelineStageKey)?.color ??
    "bg-slate-100 text-slate-700"
  );
}

/** Map a legacy `admissions_leads.lead_stage` value to the canonical OS pipeline stage. */
export function resolvePipelineStageFromLeadStage(
  leadStage: string | null | undefined
): AdmissionsPipelineStageKey | null {
  if (!leadStage) return null;
  return legacyToPipeline.get(leadStage) ?? null;
}

/** Reverse lookup: legacy lead stages that roll up to an OS pipeline stage. */
export function resolveLegacyLeadStagesForPipelineStage(
  pipelineStage: AdmissionsPipelineStageKey
): string[] {
  return getPipelineStageDefinition(pipelineStage)?.legacyLeadStages ?? [];
}

/** Group lead counts by OS pipeline stage label. */
export function groupLeadCountsByPipelineStage(
  stageCounts: Record<string, number>
): { key: AdmissionsPipelineStageKey; label: string; count: number; legacyValues: string[] }[] {
  const grouped = new Map<AdmissionsPipelineStageKey, number>();

  for (const [legacyStage, count] of Object.entries(stageCounts)) {
    const pipelineKey = resolvePipelineStageFromLeadStage(legacyStage);
    if (!pipelineKey) continue;
    grouped.set(pipelineKey, (grouped.get(pipelineKey) ?? 0) + count);
  }

  return ADMISSIONS_PIPELINE_STAGES.filter((stage) => grouped.has(stage.key)).map((stage) => ({
    key: stage.key,
    label: stage.label,
    count: grouped.get(stage.key) ?? 0,
    legacyValues: stage.legacyLeadStages,
  }));
}
