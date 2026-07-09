import { HIERARCHY_PIPELINE_STEP_IDS } from "@/lib/platform/hierarchy/types";

/** Canonical JAG Workspace Execution Pipeline — aligned with hierarchy runtime. */
export const WDS_EXECUTION_PIPELINE_STEPS = [
  { id: "read-hierarchy", label: "Read Hierarchy", phase: "prepare" as const },
  { id: "load-standard", label: "Load Standard", phase: "prepare" as const },
  { id: "load-protocol", label: "Load Protocol", phase: "prepare" as const },
  { id: "load-process", label: "Load Process", phase: "prepare" as const },
  { id: "load-procedure", label: "Load Procedure", phase: "prepare" as const },
  { id: "evaluate-rules", label: "Evaluate Rules", phase: "decide" as const },
  { id: "read-parameters", label: "Read Parameters", phase: "decide" as const },
  { id: "execute", label: "Execute", phase: "act" as const },
  { id: "collect-evidence", label: "Collect Evidence", phase: "act" as const },
  { id: "update-knowledge", label: "Update Knowledge", phase: "learn" as const },
  { id: "recommend-improvements", label: "Recommend Improvements", phase: "learn" as const },
  { id: "done", label: "Done", phase: "complete" as const },
] as const;

/** Runtime step ids — must match hierarchy pipeline. */
export const WDS_PIPELINE_STEP_IDS = HIERARCHY_PIPELINE_STEP_IDS;

export type WdsExecutionStepId = (typeof WDS_EXECUTION_PIPELINE_STEPS)[number]["id"];

export type WdsExecutionPipelineOrientation = "vertical" | "horizontal";

export type WdsExecutionStepStatus = "pending" | "active" | "complete" | "skipped" | "error";

export interface WdsExecutionStepState {
  id: WdsExecutionStepId;
  status: WdsExecutionStepStatus;
  detail?: string;
}
