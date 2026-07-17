/**
 * Intelligence Platform Infrastructure — IntelligenceLifecycle (Sprint 027).
 */

import type {
  IntelligenceExecutionContext,
  IntelligenceLifecycle as IntelligenceLifecycleContract,
  IntelligenceRegistry,
  IntelligenceTelemetry,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceLifecyclePhase,
  IntelligenceModuleId,
} from "@/lib/platform/intelligence/infrastructure/types";

export class IntelligenceLifecycleImpl implements IntelligenceLifecycleContract {
  private readonly phases = new Map<string, IntelligenceLifecyclePhase>();
  private platformPhase: IntelligenceLifecyclePhase = "uninitialized";
  private readonly registry: IntelligenceRegistry | null;
  private readonly telemetry: IntelligenceTelemetry | null;

  constructor(options: {
    registry?: IntelligenceRegistry;
    telemetry?: IntelligenceTelemetry;
  } = {}) {
    this.registry = options.registry ?? null;
    this.telemetry = options.telemetry ?? null;
  }

  getPhase(moduleId?: IntelligenceModuleId): IntelligenceLifecyclePhase {
    if (!moduleId) return this.platformPhase;
    return this.phases.get(moduleId) ?? "uninitialized";
  }

  setPhase(moduleId: IntelligenceModuleId, phase: IntelligenceLifecyclePhase): void {
    this.phases.set(moduleId, phase);
  }

  markRunning(moduleId: IntelligenceModuleId): void {
    this.setPhase(moduleId, "running");
  }

  markReady(moduleId: IntelligenceModuleId): void {
    this.setPhase(moduleId, "ready");
  }

  markFailed(moduleId: IntelligenceModuleId, message?: string): void {
    this.setPhase(moduleId, "failed");
    this.telemetry?.emit("module.failed", {
      moduleId,
      payload: message ? { message } : undefined,
    });
  }

  async initializeAll(context: IntelligenceExecutionContext): Promise<void> {
    if (!this.registry) {
      this.platformPhase = "ready";
      return;
    }
    this.platformPhase = "initializing";
    const order = this.registry.resolveOrder();
    for (const moduleId of order) {
      const domainModule = this.registry.get(moduleId);
      if (!domainModule) continue;
      this.setPhase(moduleId, "initializing");
      try {
        if (domainModule.initialize) {
          await domainModule.initialize(context);
        }
        this.setPhase(moduleId, "ready");
        this.telemetry?.emit("module.initialized", {
          moduleId,
          runId: context.runId,
        });
      } catch (error) {
        this.markFailed(
          moduleId,
          error instanceof Error ? error.message : String(error)
        );
        throw error;
      }
    }
    this.platformPhase = "ready";
  }

  async shutdownAll(): Promise<void> {
    if (!this.registry) {
      this.platformPhase = "stopped";
      return;
    }
    this.platformPhase = "shutting_down";
    const order = [...this.registry.resolveOrder()].reverse();
    for (const moduleId of order) {
      const domainModule = this.registry.get(moduleId);
      if (!domainModule) continue;
      this.setPhase(moduleId, "shutting_down");
      try {
        if (domainModule.shutdown) {
          await domainModule.shutdown();
        }
        this.setPhase(moduleId, "stopped");
        this.telemetry?.emit("module.shutdown", { moduleId });
      } catch (error) {
        this.markFailed(
          moduleId,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
    this.platformPhase = "stopped";
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceLifecycleImpl as IntelligenceLifecycle };

export function createIntelligenceLifecycle(options?: {
  registry?: IntelligenceRegistry;
  telemetry?: IntelligenceTelemetry;
}): IntelligenceLifecycleImpl {
  return new IntelligenceLifecycleImpl(options);
}
