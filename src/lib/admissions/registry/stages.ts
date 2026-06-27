import type {
  AdmissionsPipelineStageKey,
  PipelineStageDefinition,
} from "@/lib/admissions/registry/types";

/** Canonical Admissions OS pipeline (B-03). Ordered from inquiry to enrollment. */
export const ADMISSIONS_PIPELINE_STAGES: PipelineStageDefinition[] = [
  {
    key: "inquiry",
    label: "Inquiry",
    color: "bg-slate-100 text-slate-700",
    order: 0,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["new_inquiry"],
  },
  {
    key: "information_requested",
    label: "Information Requested",
    color: "bg-blue-100 text-blue-700",
    order: 10,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["information_sent", "tour_scheduled", "tour_completed"],
    automatedTask: { taskName: "Follow up on information sent", dueDays: 3 },
  },
  {
    key: "application_started",
    label: "Application Started",
    color: "bg-indigo-100 text-indigo-700",
    order: 20,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["application_started"],
    automatedTask: { taskName: "Follow up on application progress", dueDays: 7 },
  },
  {
    key: "application_submitted",
    label: "Application Submitted",
    color: "bg-violet-100 text-violet-700",
    order: 30,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["application_submitted"],
  },
  {
    key: "documents_pending",
    label: "Documents Pending",
    color: "bg-purple-100 text-purple-700",
    order: 40,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["records_requested"],
    automatedTask: { taskName: "Follow up on records request", dueDays: 5 },
  },
  {
    key: "documents_complete",
    label: "Documents Complete",
    color: "bg-fuchsia-100 text-fuchsia-700",
    order: 50,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: [],
  },
  {
    key: "interview_scheduled",
    label: "Interview Scheduled",
    color: "bg-sky-100 text-sky-700",
    order: 60,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: [],
  },
  {
    key: "assessment_scheduled",
    label: "Assessment Scheduled",
    color: "bg-cyan-100 text-cyan-700",
    order: 70,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: [],
  },
  {
    key: "assessment_complete",
    label: "Assessment Complete",
    color: "bg-teal-100 text-teal-700",
    order: 80,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: [],
  },
  {
    key: "committee_review",
    label: "Committee Review",
    color: "bg-amber-100 text-amber-700",
    order: 90,
    isTerminal: false,
    isActivePipeline: true,
    legacyLeadStages: ["admissions_review"],
  },
  {
    key: "accepted",
    label: "Accepted",
    color: "bg-emerald-100 text-emerald-700",
    order: 100,
    isTerminal: true,
    isActivePipeline: false,
    legacyLeadStages: ["accepted"],
    automatedTask: { taskName: "Enrollment follow-up", dueDays: 3 },
  },
  {
    key: "waitlisted",
    label: "Waitlisted",
    color: "bg-orange-100 text-orange-700",
    order: 110,
    isTerminal: true,
    isActivePipeline: false,
    legacyLeadStages: ["waitlisted"],
  },
  {
    key: "declined",
    label: "Declined",
    color: "bg-red-100 text-red-700",
    order: 120,
    isTerminal: true,
    isActivePipeline: false,
    legacyLeadStages: ["declined"],
  },
  {
    key: "enrollment_complete",
    label: "Enrollment Complete",
    color: "bg-green-100 text-green-800",
    order: 130,
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
