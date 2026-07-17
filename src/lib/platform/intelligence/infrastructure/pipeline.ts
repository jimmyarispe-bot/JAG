/**
 * Intelligence Platform Infrastructure — IntelligencePipeline (Sprint 027).
 *
 * Executes registered modules in dependency order with timing, cache, metrics,
 * lifecycle, and telemetry hooks. Independent Kahn waves run concurrently
 * (Phase D) while preserving topological safety and failFast across waves.
 */

import type {
  IntelligenceCache,
  IntelligenceConfiguration,
  IntelligenceLifecycle,
  IntelligenceMetrics,
  IntelligenceModule,
  IntelligencePipeline as IntelligencePipelineContract,
  IntelligencePlatformClock,
  IntelligenceRegistry,
  IntelligenceTelemetry,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceExecutionRequest,
  IntelligenceModuleId,
  IntelligenceModuleResult,
  IntelligencePipelineResult,
  IntelligencePipelineStageTiming,
  IntelligencePipelineStatus,
} from "@/lib/platform/intelligence/infrastructure/types";
import { createDefaultClock } from "@/lib/platform/intelligence/infrastructure/clock";
import { createExecutionContext } from "@/lib/platform/intelligence/infrastructure/execution-context";

function cacheKey(
  moduleId: IntelligenceModuleId,
  runScope: string,
  input: unknown
): string {
  let inputHash = "none";
  try {
    inputHash = JSON.stringify(input ?? null) ?? "none";
  } catch {
    inputHash = "unserializable";
  }
  return `module:${moduleId}:${runScope}:${inputHash}`;
}

export class IntelligencePipelineImpl implements IntelligencePipelineContract {
  private readonly registry: IntelligenceRegistry;
  private readonly clock: IntelligencePlatformClock;
  private readonly cache: IntelligenceCache | null;
  private readonly metrics: IntelligenceMetrics | null;
  private readonly telemetry: IntelligenceTelemetry | null;
  private readonly lifecycle: IntelligenceLifecycle | null;
  private readonly configuration: IntelligenceConfiguration | null;

  constructor(options: {
    registry: IntelligenceRegistry;
    clock?: IntelligencePlatformClock;
    cache?: IntelligenceCache;
    metrics?: IntelligenceMetrics;
    telemetry?: IntelligenceTelemetry;
    lifecycle?: IntelligenceLifecycle;
    configuration?: IntelligenceConfiguration;
  }) {
    this.registry = options.registry;
    this.clock = options.clock ?? createDefaultClock();
    this.cache = options.cache ?? null;
    this.metrics = options.metrics ?? null;
    this.telemetry = options.telemetry ?? null;
    this.lifecycle = options.lifecycle ?? null;
    this.configuration = options.configuration ?? null;
  }

  async runModule(
    moduleId: IntelligenceModuleId,
    request: IntelligenceExecutionRequest = {}
  ): Promise<IntelligenceModuleResult> {
    const pipeline = await this.run({
      ...request,
      moduleIds: [moduleId],
    });
    const result = pipeline.results.find((item) => item.moduleId === moduleId);
    if (!result) {
      return {
        moduleId,
        ok: false,
        startedAt: pipeline.startedAt,
        completedAt: pipeline.completedAt,
        durationMs: pipeline.durationMs,
        error: `Module "${moduleId}" produced no result`,
      };
    }
    return result;
  }

  async run(
    request: IntelligenceExecutionRequest = {}
  ): Promise<IntelligencePipelineResult> {
    const context = createExecutionContext(request, this.clock);
    const started = this.clock.now();
    const startedAt = started.toISOString();
    this.telemetry?.emit("pipeline.started", { runId: context.runId });

    const waves = this.registry.resolveWaves(request.moduleIds);
    const order = waves.flat();
    const stages: IntelligencePipelineStageTiming[] = [];
    const results: IntelligenceModuleResult[] = [];
    const errors: Array<{ moduleId: IntelligenceModuleId; message: string }> = [];
    const cacheTtlMs =
      this.configuration?.get<number>("pipeline.cacheTtlMs", 60_000) ?? 60_000;
    const failFast =
      request.failFast ??
      this.configuration?.get<boolean>("pipeline.failFast", true) ??
      true;

    let abortRemaining = false;

    for (const wave of waves) {
      if (abortRemaining) break;

      const waveOutcomes = await Promise.all(
        wave.map((moduleId) =>
          this.runStage({
            moduleId,
            context,
            cacheTtlMs,
          })
        )
      );

      // Preserve deterministic moduleOrder within the wave (localeCompare sort).
      for (const outcome of waveOutcomes) {
        stages.push(outcome.stage);
        results.push(outcome.result);
        if (!outcome.result.ok) {
          errors.push({
            moduleId: outcome.moduleId,
            message: outcome.result.error ?? "Module execution failed",
          });
        }
      }

      if (failFast && waveOutcomes.some((o) => !o.result.ok)) {
        abortRemaining = true;
      }
    }

    const completed = this.clock.now();
    const durationMs = completed.getTime() - started.getTime();
    const abortedEarly =
      failFast && errors.length > 0 && results.length < order.length;
    let status: IntelligencePipelineStatus = "completed";
    if (errors.length === 0) status = "completed";
    else if (abortedEarly || results.every((r) => !r.ok)) status = "failed";
    else status = "partial";

    const pipelineResult: IntelligencePipelineResult = {
      runId: context.runId,
      status,
      startedAt,
      completedAt: completed.toISOString(),
      durationMs,
      moduleOrder: order,
      stages,
      results,
      errors,
      metadata: {
        ...context.metadata,
        contextKeys: context.keys(),
        waveCount: waves.length,
        maxWaveWidth: waves.reduce((max, w) => Math.max(max, w.length), 0),
      },
    };

    this.metrics?.timing("pipeline.duration", durationMs);
    this.metrics?.increment(
      status === "failed" ? "pipeline.failure" : "pipeline.success"
    );
    this.telemetry?.emit(status === "failed" ? "pipeline.failed" : "pipeline.completed", {
      runId: context.runId,
      payload: { status, durationMs, errorCount: errors.length },
    });

    return pipelineResult;
  }

  private async runStage(options: {
    moduleId: IntelligenceModuleId;
    context: ReturnType<typeof createExecutionContext>;
    cacheTtlMs: number;
  }): Promise<{
    moduleId: IntelligenceModuleId;
    result: IntelligenceModuleResult;
    stage: IntelligencePipelineStageTiming;
  }> {
    const { moduleId, context, cacheTtlMs } = options;
    const domainModule = this.registry.get(moduleId);
    if (!domainModule) {
      const now = this.clock.now();
      const result: IntelligenceModuleResult = {
        moduleId,
        ok: false,
        startedAt: now.toISOString(),
        completedAt: now.toISOString(),
        durationMs: 0,
        error: `Unknown module "${moduleId}"`,
      };
      return {
        moduleId,
        result,
        stage: {
          moduleId,
          startedAt: result.startedAt,
          completedAt: result.completedAt,
          durationMs: 0,
          ok: false,
          cached: false,
        },
      };
    }

    const stageStart = this.clock.now();
    this.lifecycle?.markRunning(moduleId);

    const scopeKey = `${context.scope.organizationId ?? "org"}:${context.scope.schoolId ?? "school"}`;
    const key = cacheKey(moduleId, scopeKey, context.input);
    let cached = false;
    let result: IntelligenceModuleResult;

    try {
      if (!context.bypassCache && this.cache) {
        const hit = this.cache.get<IntelligenceModuleResult>(key);
        if (hit) {
          cached = true;
          result = { ...hit, metadata: { ...hit.metadata, cached: true } };
          this.telemetry?.emit("cache.hit", {
            moduleId,
            runId: context.runId,
            payload: { key },
          });
        } else {
          this.telemetry?.emit("cache.miss", {
            moduleId,
            runId: context.runId,
            payload: { key },
          });
          result = await this.executeModule(domainModule, context);
          if (result.ok) {
            this.cache.set(key, result, cacheTtlMs, moduleId);
          }
        }
      } else {
        result = await this.executeModule(domainModule, context);
        if (result.ok && this.cache && !context.bypassCache) {
          this.cache.set(key, result, cacheTtlMs, moduleId);
        }
      }

      if (result.ok) {
        this.lifecycle?.markReady(moduleId);
        context.set(`result:${moduleId}`, result.data ?? result);
      } else {
        this.lifecycle?.markFailed(moduleId, result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const completed = this.clock.now();
      result = {
        moduleId,
        ok: false,
        startedAt: stageStart.toISOString(),
        completedAt: completed.toISOString(),
        durationMs: completed.getTime() - stageStart.getTime(),
        error: message,
      };
      this.lifecycle?.markFailed(moduleId, message);
    }

    const stageEnd = this.clock.now();
    const durationMs = stageEnd.getTime() - stageStart.getTime();
    const stage: IntelligencePipelineStageTiming = {
      moduleId,
      startedAt: stageStart.toISOString(),
      completedAt: stageEnd.toISOString(),
      durationMs,
      ok: result.ok,
      cached,
    };

    this.metrics?.timing("module.execute.duration", durationMs, undefined, moduleId);
    this.metrics?.increment(
      result.ok ? "module.execute.success" : "module.execute.failure",
      1,
      undefined,
      moduleId
    );
    this.telemetry?.emit("module.executed", {
      moduleId,
      runId: context.runId,
      payload: { ok: result.ok, durationMs, cached },
    });
    this.telemetry?.emit("metrics.recorded", {
      moduleId,
      runId: context.runId,
      payload: { durationMs },
    });

    return { moduleId, result, stage };
  }

  private async executeModule(
    domainModule: IntelligenceModule,
    context: ReturnType<typeof createExecutionContext>
  ): Promise<IntelligenceModuleResult> {
    return domainModule.execute(context, context.input);
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligencePipelineImpl as IntelligencePipeline };

export function createIntelligencePipeline(options: {
  registry: IntelligenceRegistry;
  clock?: IntelligencePlatformClock;
  cache?: IntelligenceCache;
  metrics?: IntelligenceMetrics;
  telemetry?: IntelligenceTelemetry;
  lifecycle?: IntelligenceLifecycle;
  configuration?: IntelligenceConfiguration;
}): IntelligencePipelineImpl {
  return new IntelligencePipelineImpl(options);
}
