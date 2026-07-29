import type { RuntimePipelineStageId } from "../types/stages";
import type { RuntimeContext } from "./runtime-context";

/**
 * Pluggable pipeline stage. Stages must not contain domain business logic;
 * they coordinate and delegate to registered providers.
 */
export interface RuntimePipelineStage {
  id: RuntimePipelineStageId;
  /** Lower runs first. Defaults from RUNTIME_PIPELINE_STAGE_ORDER when omitted. */
  order?: number;
  /** When true, missing handler or skip signal does not fail the pipeline. */
  optional?: boolean;
  /**
   * Execute the stage. Mutate `ctx.state` / return value merged into stage bag.
   * Throw RuntimeError subclasses to fail; use AbortSignal for cancellation.
   */
  execute(
    ctx: RuntimeContext
  ): void | Promise<void> | Record<string, unknown> | Promise<Record<string, unknown>>;
}

export interface RuntimePipelineRunOptions {
  /** When true, skip action → twin unless explicitly requested. */
  composeOnly?: boolean;
  /** Limit execution to stages up to and including this id. */
  stopAfter?: RuntimePipelineStageId;
  /** Skip listed stages (still recorded as skipped). */
  skipStages?: readonly RuntimePipelineStageId[];
  /** Initial bag merged into execution state before identity. */
  initialData?: Readonly<Record<string, unknown>>;
  /** Trigger metadata for telemetry / events. */
  trigger?: RuntimePipelineTrigger;
}

export interface RuntimePipelineTrigger {
  kind: string;
  detail?: Readonly<Record<string, unknown>>;
}
