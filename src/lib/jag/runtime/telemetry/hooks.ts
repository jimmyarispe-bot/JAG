import type { RuntimeResult } from "../contracts";
import type { RuntimeLifecycleState, RuntimePipelineStageId } from "../types/stages";

/**
 * Lightweight instrumentation hooks — no external telemetry provider.
 * Lifecycle events only.
 */

export interface RuntimeTelemetryEvent {
  type:
    | "runtime.lifecycle"
    | "pipeline.started"
    | "pipeline.finished"
    | "stage.started"
    | "stage.finished";
  at: string;
  runtimeId: string;
  correlationId?: string;
  lifecycle?: RuntimeLifecycleState;
  stageId?: RuntimePipelineStageId;
  status?: string;
  durationMs?: number;
  detail?: Readonly<Record<string, unknown>>;
}

export type RuntimeTelemetrySink = (event: RuntimeTelemetryEvent) => void;

export class RuntimeTelemetry {
  private readonly sinks = new Set<RuntimeTelemetrySink>();
  private readonly buffer: RuntimeTelemetryEvent[] = [];
  private readonly maxBuffer: number;

  constructor(options: { maxBuffer?: number } = {}) {
    this.maxBuffer = options.maxBuffer ?? 200;
  }

  subscribe(sink: RuntimeTelemetrySink): () => void {
    this.sinks.add(sink);
    return () => this.sinks.delete(sink);
  }

  emit(event: Omit<RuntimeTelemetryEvent, "at"> & { at?: string }): void {
    const full: RuntimeTelemetryEvent = {
      ...event,
      at: event.at ?? new Date().toISOString(),
    };
    this.buffer.push(full);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer.shift();
    }
    for (const sink of this.sinks) {
      sink(full);
    }
  }

  lifecycle(
    runtimeId: string,
    lifecycle: RuntimeLifecycleState,
    detail?: Readonly<Record<string, unknown>>
  ): void {
    this.emit({
      type: "runtime.lifecycle",
      runtimeId,
      lifecycle,
      detail,
    });
  }

  pipelineStarted(runtimeId: string, correlationId: string): void {
    this.emit({
      type: "pipeline.started",
      runtimeId,
      correlationId,
    });
  }

  pipelineFinished(runtimeId: string, result: RuntimeResult): void {
    this.emit({
      type: "pipeline.finished",
      runtimeId,
      correlationId: result.correlationId,
      status: result.status,
      durationMs: result.durationMs,
    });
  }

  stageStarted(
    runtimeId: string,
    correlationId: string,
    stageId: RuntimePipelineStageId
  ): void {
    this.emit({
      type: "stage.started",
      runtimeId,
      correlationId,
      stageId,
    });
  }

  stageFinished(
    runtimeId: string,
    correlationId: string,
    stageId: RuntimePipelineStageId,
    status: string,
    durationMs: number
  ): void {
    this.emit({
      type: "stage.finished",
      runtimeId,
      correlationId,
      stageId,
      status,
      durationMs,
    });
  }

  recent(): readonly RuntimeTelemetryEvent[] {
    return this.buffer;
  }

  clear(): void {
    this.buffer.length = 0;
    this.sinks.clear();
  }
}

export function createRuntimeTelemetry(
  options?: { maxBuffer?: number }
): RuntimeTelemetry {
  return new RuntimeTelemetry(options);
}
