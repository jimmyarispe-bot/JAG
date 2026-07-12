/**
 * Intelligence Platform Infrastructure — IntelligenceHealth (Sprint 027).
 */

import type {
  IntelligenceHealth as IntelligenceHealthContract,
  IntelligenceLifecycle,
  IntelligenceRegistry,
  IntelligenceTelemetry,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceHealthStatus,
  IntelligenceModuleHealth,
  IntelligenceModuleId,
  IntelligencePlatformHealth,
} from "@/lib/platform/intelligence/infrastructure/types";

function worstStatus(
  statuses: IntelligenceHealthStatus[]
): IntelligenceHealthStatus {
  if (statuses.includes("unhealthy")) return "unhealthy";
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.includes("unknown")) return "unknown";
  if (statuses.length === 0) return "unknown";
  return "healthy";
}

export class IntelligenceHealthImpl implements IntelligenceHealthContract {
  private readonly registry: IntelligenceRegistry;
  private readonly lifecycle: IntelligenceLifecycle | null;
  private readonly telemetry: IntelligenceTelemetry | null;
  private lastStatus: IntelligenceHealthStatus = "unknown";

  constructor(options: {
    registry: IntelligenceRegistry;
    lifecycle?: IntelligenceLifecycle;
    telemetry?: IntelligenceTelemetry;
  }) {
    this.registry = options.registry;
    this.lifecycle = options.lifecycle ?? null;
    this.telemetry = options.telemetry ?? null;
  }

  async checkModule(moduleId: IntelligenceModuleId): Promise<IntelligenceModuleHealth> {
    const module = this.registry.get(moduleId);
    const checkedAt = new Date().toISOString();
    if (!module) {
      return {
        moduleId,
        status: "unknown",
        phase: "uninitialized",
        message: `Module "${moduleId}" is not registered`,
        checkedAt,
      };
    }

    if (module.health) {
      const custom = await module.health();
      return custom;
    }

    const phase = this.lifecycle?.getPhase(moduleId) ?? "ready";
    let status: IntelligenceHealthStatus = "healthy";
    if (phase === "failed") status = "unhealthy";
    else if (phase === "degraded") status = "degraded";
    else if (phase === "uninitialized" || phase === "stopped") status = "unknown";

    return {
      moduleId,
      status,
      phase,
      message: `${module.name} is ${status}`,
      checkedAt,
      details: { version: module.version },
    };
  }

  async checkAll(): Promise<IntelligencePlatformHealth> {
    const modules: IntelligenceModuleHealth[] = [];
    for (const module of this.registry.list()) {
      modules.push(await this.checkModule(module.id));
    }
    const status = worstStatus(modules.map((m) => m.status));
    const checkedAt = new Date().toISOString();
    if (status !== this.lastStatus) {
      this.telemetry?.emit("health.changed", {
        payload: { previous: this.lastStatus, current: status },
      });
      this.lastStatus = status;
    }
    const healthyCount = modules.filter((m) => m.status === "healthy").length;
    return {
      status,
      checkedAt,
      modules,
      summary: `${healthyCount}/${modules.length} modules healthy (${status})`,
    };
  }

  status(): IntelligenceHealthStatus {
    return this.lastStatus;
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceHealthImpl as IntelligenceHealth };

export function createIntelligenceHealth(options: {
  registry: IntelligenceRegistry;
  lifecycle?: IntelligenceLifecycle;
  telemetry?: IntelligenceTelemetry;
}): IntelligenceHealthImpl {
  return new IntelligenceHealthImpl(options);
}
