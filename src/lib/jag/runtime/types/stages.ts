/**
 * Canonical Runtime pipeline stage identifiers.
 * Order is fixed by the Runtime Specification (Ω-0B / Ω-1).
 */

export const RUNTIME_PIPELINE_STAGE_IDS = [
  "identity",
  "context",
  "intent",
  "cognition",
  "experience",
  "action",
  "domain",
  "evidence",
  "memory",
  "twin",
] as const;

export type RuntimePipelineStageId =
  (typeof RUNTIME_PIPELINE_STAGE_IDS)[number];

/** Default ordinal for each stage (lower runs first). */
export const RUNTIME_PIPELINE_STAGE_ORDER: Record<
  RuntimePipelineStageId,
  number
> = {
  identity: 10,
  context: 20,
  intent: 30,
  cognition: 40,
  experience: 50,
  action: 60,
  domain: 70,
  evidence: 80,
  memory: 90,
  twin: 100,
};

export type RuntimeLifecycleState =
  | "created"
  | "starting"
  | "ready"
  | "running"
  | "stopping"
  | "stopped"
  | "failed";
