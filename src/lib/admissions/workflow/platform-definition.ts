import { ADMISSIONS_PIPELINE_STAGES } from "@/lib/admissions/registry/stages";
import { getAllowedPipelineTransitions } from "@/lib/admissions/registry/pipeline";
import type { WorkflowDefinition } from "@/lib/platform/workflow/types";
import type { AdmissionsPipelineStageKey } from "@/lib/admissions/registry/types";

export const ADMISSIONS_CASE_WORKFLOW_KEY = "admissions_case_pipeline";
export const ADMISSIONS_CASE_DOMAIN = "admissions";
export const ADMISSIONS_CASE_ENTITY_TYPE = "admissions_lead";

/** Build the admissions case pipeline workflow definition from the OS registry. */
export function buildAdmissionsCaseWorkflowDefinition(): WorkflowDefinition {
  const states = ADMISSIONS_PIPELINE_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    stateType: (stage.key === "inquiry"
      ? "initial"
      : stage.isTerminal
        ? "terminal"
        : "intermediate") as "initial" | "intermediate" | "terminal",
    sortOrder: stage.order,
  }));

  const transitions: WorkflowDefinition["transitions"] = [];
  for (const [fromKey, targets] of Object.entries(
    buildAllowedTransitionMap()
  ) as [AdmissionsPipelineStageKey, AdmissionsPipelineStageKey[]][]) {
    for (const toKey of targets) {
      transitions.push({
        key: `${fromKey}__${toKey}`,
        label: `${fromKey} → ${toKey}`,
        fromStateKey: fromKey,
        toStateKey: toKey,
        sortOrder: transitions.length + 1,
        triggerKeys: ["manual", "stage_change"],
      });
    }
  }

  return {
    workflowKey: ADMISSIONS_CASE_WORKFLOW_KEY,
    name: "Admissions Case Pipeline",
    description: "Orchestrates admissions case pipeline stages for lead/case entities",
    domain: ADMISSIONS_CASE_DOMAIN,
    version: 1,
    status: "active",
    entityType: ADMISSIONS_CASE_ENTITY_TYPE,
    initialStateKey: "inquiry",
    states,
    transitions,
    triggers: [
      { key: "manual", label: "Manual", triggerType: "manual" },
      {
        key: "stage_change",
        label: "Stage Change",
        triggerType: "event",
        eventKey: "admissions.stage_changed",
      },
    ],
    sortOrder: 10,
    tags: ["admissions", "case", "pipeline"],
  };
}

function buildAllowedTransitionMap(): Partial<
  Record<AdmissionsPipelineStageKey, AdmissionsPipelineStageKey[]>
> {
  const map: Partial<Record<AdmissionsPipelineStageKey, AdmissionsPipelineStageKey[]>> = {};
  for (const stage of ADMISSIONS_PIPELINE_STAGES) {
    map[stage.key] = getAllowedPipelineTransitions(stage.key);
  }
  return map;
}

/** Resolve a transition key for a pipeline stage change, if one exists in the graph. */
export function resolveAdmissionsPipelineTransitionKey(
  fromStage: AdmissionsPipelineStageKey | null,
  toStage: AdmissionsPipelineStageKey | null
): string | null {
  if (!fromStage || !toStage || fromStage === toStage) return null;
  return `${fromStage}__${toStage}`;
}
