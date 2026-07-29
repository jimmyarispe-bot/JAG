import type {
  RuntimePipelineRunOptions,
  RuntimeResult,
} from "../contracts";
import { RUNTIME_KERNEL_EVENT_TYPES } from "../contracts/event";
import { RuntimeFatalError, RuntimePipelineError } from "../errors";
import { createRuntimeEventBus, type RuntimeEventBus } from "../events";
import { createRuntimePipeline, type RuntimePipeline } from "../pipeline";
import { createRuntimeRegistry, type RuntimeRegistry } from "../registry";
import { createRuntimeTelemetry, type RuntimeTelemetry } from "../telemetry";
import { createRuntimeId, type RuntimeId, type SessionId } from "../types/ids";
import type { RuntimeLifecycleState } from "../types/stages";

export interface CreateJagRuntimeOptions {
  runtimeId?: RuntimeId;
  sessionId?: SessionId;
  events?: RuntimeEventBus;
  telemetry?: RuntimeTelemetry;
}

export interface JagRuntime {
  readonly id: RuntimeId;
  readonly state: RuntimeLifecycleState;
  readonly registry: RuntimeRegistry;
  readonly events: RuntimeEventBus;
  readonly telemetry: RuntimeTelemetry;
  readonly pipeline: RuntimePipeline;
  start(): Promise<void>;
  stop(): Promise<void>;
  run(options?: RuntimePipelineRunOptions): Promise<RuntimeResult>;
  /** Cancel in-flight run (if any). */
  cancel(): void;
}

class JagRuntimeImpl implements JagRuntime {
  readonly id: RuntimeId;
  readonly registry: RuntimeRegistry;
  readonly events: RuntimeEventBus;
  readonly telemetry: RuntimeTelemetry;
  readonly pipeline: RuntimePipeline;

  private lifecycle: RuntimeLifecycleState = "created";
  private readonly sessionId?: SessionId;
  private runController: AbortController | null = null;

  constructor(options: CreateJagRuntimeOptions = {}) {
    this.id = options.runtimeId ?? createRuntimeId("jag");
    this.sessionId = options.sessionId;
    this.events = options.events ?? createRuntimeEventBus();
    this.telemetry = options.telemetry ?? createRuntimeTelemetry();
    this.registry = createRuntimeRegistry({
      events: this.events,
      runtimeRef: () => this,
    });
    this.pipeline = createRuntimePipeline({
      runtimeId: this.id,
      registry: this.registry,
      events: this.events,
      telemetry: this.telemetry,
    });
  }

  get state(): RuntimeLifecycleState {
    return this.lifecycle;
  }

  async start(): Promise<void> {
    if (this.lifecycle === "ready" || this.lifecycle === "running") {
      return;
    }
    if (this.lifecycle === "stopped" || this.lifecycle === "failed") {
      throw new RuntimeFatalError(
        `Cannot start runtime in state: ${this.lifecycle}`,
        { code: "RUNTIME_INVALID_LIFECYCLE" }
      );
    }
    this.lifecycle = "starting";
    this.telemetry.lifecycle(this.id, "starting");
    this.lifecycle = "ready";
    this.telemetry.lifecycle(this.id, "ready");
    await this.events.publish(RUNTIME_KERNEL_EVENT_TYPES.RUNTIME_STARTED, {
      runtimeId: this.id,
    });
  }

  async stop(): Promise<void> {
    if (this.lifecycle === "stopped") return;
    this.lifecycle = "stopping";
    this.telemetry.lifecycle(this.id, "stopping");
    this.cancel();
    this.registry.clear();
    this.events.clear();
    this.lifecycle = "stopped";
    this.telemetry.lifecycle(this.id, "stopped");
    // Event bus cleared — emit via a one-shot would be lost; telemetry covers stop.
  }

  cancel(): void {
    this.runController?.abort();
    this.runController = null;
  }

  async run(options: RuntimePipelineRunOptions = {}): Promise<RuntimeResult> {
    if (this.lifecycle === "created") {
      await this.start();
    }
    if (this.lifecycle !== "ready" && this.lifecycle !== "running") {
      throw new RuntimePipelineError(
        `Cannot run pipeline in state: ${this.lifecycle}`,
        { code: "RUNTIME_NOT_READY" }
      );
    }

    this.lifecycle = "running";
    this.telemetry.lifecycle(this.id, "running");
    this.runController = new AbortController();

    try {
      const result = await this.pipeline.run(options, {
        signal: this.runController.signal,
        sessionId: this.sessionId,
      });
      this.lifecycle = "ready";
      this.telemetry.lifecycle(this.id, "ready");
      return result;
    } catch (error) {
      this.lifecycle = "failed";
      this.telemetry.lifecycle(this.id, "failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      this.runController = null;
    }
  }
}

/** Create a JAG Runtime Kernel instance. */
export function createJagRuntime(
  options?: CreateJagRuntimeOptions
): JagRuntime {
  return new JagRuntimeImpl(options);
}
