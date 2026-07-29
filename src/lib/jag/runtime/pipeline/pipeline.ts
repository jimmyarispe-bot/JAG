import type {
  RuntimePipelineRunOptions,
  RuntimePipelineStage,
  RuntimeResult,
  RuntimeStageOutcome,
} from "../contracts";
import { RUNTIME_KERNEL_EVENT_TYPES } from "../contracts/event";
import { createRuntimeContext, setCurrentStage } from "../context";
import {
  isRuntimeError,
  RuntimeCancellationError,
  RuntimeFatalError,
  RuntimePipelineError,
  toRuntimeError,
} from "../errors";
import type { RuntimeEventBus } from "../events";
import type { RuntimeRegistry } from "../registry";
import type { RuntimeTelemetry } from "../telemetry";
import type { RuntimeId } from "../types/ids";
import {
  RUNTIME_PIPELINE_STAGE_ORDER,
  type RuntimePipelineStageId,
} from "../types/stages";
import { createDefaultPipelineStages } from "./default-stages";

export interface RuntimePipelineOptions {
  runtimeId: RuntimeId;
  registry: RuntimeRegistry;
  events: RuntimeEventBus;
  telemetry: RuntimeTelemetry;
}

export class RuntimePipeline {
  private readonly runtimeId: RuntimeId;
  private readonly registry: RuntimeRegistry;
  private readonly events: RuntimeEventBus;
  private readonly telemetry: RuntimeTelemetry;

  constructor(options: RuntimePipelineOptions) {
    this.runtimeId = options.runtimeId;
    this.registry = options.registry;
    this.events = options.events;
    this.telemetry = options.telemetry;
  }

  async run(
    options: RuntimePipelineRunOptions = {},
    runControls: { signal?: AbortSignal; sessionId?: string } = {}
  ): Promise<RuntimeResult> {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    const ctx = createRuntimeContext({
      runtimeId: this.runtimeId,
      sessionId: runControls.sessionId,
      signal: runControls.signal,
      trigger: options.trigger,
      initialData: options.initialData,
      lifecycle: "running",
    });

    this.telemetry.pipelineStarted(this.runtimeId, ctx.correlationId);
    await this.events.publish(
      RUNTIME_KERNEL_EVENT_TYPES.PIPELINE_STARTED,
      {
        correlationId: ctx.correlationId,
        trigger: options.trigger ?? null,
      },
      { correlationId: ctx.correlationId, sessionId: ctx.sessionId }
    );

    const stages = this.resolveStages(options);
    const outcomes: RuntimeStageOutcome[] = [];
    let fatalError: ReturnType<typeof toRuntimeError> | undefined;

    for (const stage of stages) {
      if (runControls.signal?.aborted || ctx.signal.aborted) {
        fatalError = new RuntimeCancellationError();
        break;
      }

      if (options.skipStages?.includes(stage.id)) {
        outcomes.push({
          stageId: stage.id,
          status: "skipped",
          durationMs: 0,
        });
        this.telemetry.stageFinished(
          this.runtimeId,
          ctx.correlationId,
          stage.id,
          "skipped",
          0
        );
        await this.events.publish(
          RUNTIME_KERNEL_EVENT_TYPES.STAGE_SKIPPED,
          { stageId: stage.id },
          { correlationId: ctx.correlationId }
        );
        continue;
      }

      if (
        options.composeOnly &&
        isPostComposeStage(stage.id)
      ) {
        outcomes.push({
          stageId: stage.id,
          status: "skipped",
          durationMs: 0,
        });
        continue;
      }

      setCurrentStage(ctx, stage.id);
      const stageStarted = Date.now();
      this.telemetry.stageStarted(
        this.runtimeId,
        ctx.correlationId,
        stage.id
      );
      await this.events.publish(
        RUNTIME_KERNEL_EVENT_TYPES.STAGE_STARTED,
        { stageId: stage.id },
        { correlationId: ctx.correlationId }
      );

      try {
        const result = await stage.execute(ctx);
        if (result && typeof result === "object") {
          Object.assign(ctx.state.data, result);
        }
        const durationMs = Date.now() - stageStarted;
        outcomes.push({
          stageId: stage.id,
          status: "completed",
          durationMs,
        });
        this.telemetry.stageFinished(
          this.runtimeId,
          ctx.correlationId,
          stage.id,
          "completed",
          durationMs
        );
        await this.events.publish(
          RUNTIME_KERNEL_EVENT_TYPES.STAGE_COMPLETED,
          { stageId: stage.id, durationMs },
          { correlationId: ctx.correlationId }
        );
      } catch (error) {
        const runtimeError = toRuntimeError(error, stage.id);
        const durationMs = Date.now() - stageStarted;
        outcomes.push({
          stageId: stage.id,
          status:
            runtimeError instanceof RuntimeCancellationError
              ? "cancelled"
              : "failed",
          durationMs,
          error: {
            name: runtimeError.name,
            message: runtimeError.message,
            code: runtimeError.code,
          },
        });
        this.telemetry.stageFinished(
          this.runtimeId,
          ctx.correlationId,
          stage.id,
          outcomes[outcomes.length - 1]!.status,
          durationMs
        );
        await this.events.publish(
          RUNTIME_KERNEL_EVENT_TYPES.STAGE_FAILED,
          {
            stageId: stage.id,
            code: runtimeError.code,
            message: runtimeError.message,
          },
          { correlationId: ctx.correlationId }
        );

        if (
          stage.optional &&
          runtimeError.recoverable &&
          !(runtimeError instanceof RuntimeCancellationError)
        ) {
          continue;
        }

        fatalError = runtimeError;
        break;
      }

      if (options.stopAfter === stage.id) {
        break;
      }
    }

    setCurrentStage(ctx, undefined);
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startedMs;

    const status = resolveResultStatus(fatalError, runControls.signal);
    const result: RuntimeResult = {
      status,
      correlationId: ctx.correlationId,
      runtimeId: this.runtimeId,
      startedAt,
      finishedAt,
      durationMs,
      stages: outcomes,
      identity: ctx.state.identity,
      organizationalContext: ctx.state.organizationalContext,
      intent: ctx.state.intent,
      cognition: ctx.state.cognition,
      experience: ctx.state.experience,
      action: ctx.state.action,
      domain: ctx.state.domain,
      evidence: [...ctx.state.evidence],
      memory: [...ctx.state.memory],
      twin: [...ctx.state.twin],
      data: { ...ctx.state.data },
      error: fatalError
        ? {
            name: fatalError.name,
            message: fatalError.message,
            code: fatalError.code,
            stageId: fatalError.stageId,
          }
        : undefined,
    };

    this.telemetry.pipelineFinished(this.runtimeId, result);
    const terminalType =
      status === "completed"
        ? RUNTIME_KERNEL_EVENT_TYPES.PIPELINE_COMPLETED
        : RUNTIME_KERNEL_EVENT_TYPES.PIPELINE_ABORTED;
    await this.events.publish(
      terminalType,
      {
        status,
        durationMs,
        stages: outcomes.map((o) => o.stageId),
        error: result.error ?? null,
      },
      { correlationId: ctx.correlationId, sessionId: ctx.sessionId }
    );

    return result;
  }

  private resolveStages(
    options: RuntimePipelineRunOptions
  ): RuntimePipelineStage[] {
    const defaults = createDefaultPipelineStages(this.registry);
    const overrides = new Map(
      this.registry.listPipelineStages().map((s) => [s.id, s])
    );
    const merged = defaults.map((d) => overrides.get(d.id) ?? d);

    // Include any extra registered stages not in the canonical list (extension).
    for (const stage of overrides.values()) {
      if (!merged.some((m) => m.id === stage.id)) {
        merged.push(stage);
      }
    }

    merged.sort(
      (a, b) =>
        (a.order ?? RUNTIME_PIPELINE_STAGE_ORDER[a.id] ?? 500) -
        (b.order ?? RUNTIME_PIPELINE_STAGE_ORDER[b.id] ?? 500)
    );

    if (options.stopAfter) {
      const idx = merged.findIndex((s) => s.id === options.stopAfter);
      if (idx >= 0) return merged.slice(0, idx + 1);
    }

    return merged;
  }
}

function isPostComposeStage(id: RuntimePipelineStageId): boolean {
  return (
    id === "action" ||
    id === "domain" ||
    id === "evidence" ||
    id === "memory" ||
    id === "twin"
  );
}

function resolveResultStatus(
  error: ReturnType<typeof toRuntimeError> | undefined,
  signal?: AbortSignal
): RuntimeResult["status"] {
  if (!error && !signal?.aborted) return "completed";
  if (
    error instanceof RuntimeCancellationError ||
    signal?.aborted
  ) {
    return "cancelled";
  }
  if (error && isRuntimeError(error) && error.recoverable) {
    return "aborted";
  }
  if (error instanceof RuntimeFatalError || error instanceof RuntimePipelineError) {
    return "failed";
  }
  return error ? "failed" : "completed";
}

export function createRuntimePipeline(
  options: RuntimePipelineOptions
): RuntimePipeline {
  return new RuntimePipeline(options);
}
