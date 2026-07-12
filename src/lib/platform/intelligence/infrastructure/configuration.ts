/**
 * Intelligence Platform Infrastructure — IntelligenceConfiguration (Sprint 027).
 */

import type {
  IntelligenceConfiguration as IntelligenceConfigurationContract,
  IntelligencePlatformClock,
  IntelligenceTelemetry,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type { IntelligenceConfigurationSnapshot } from "@/lib/platform/intelligence/infrastructure/types";
import { createDefaultClock } from "@/lib/platform/intelligence/infrastructure/clock";

const DEFAULTS: Record<string, unknown> = {
  "pipeline.failFast": true,
  "pipeline.cacheTtlMs": 60_000,
  "pipeline.defaultModuleIds": null,
  "metrics.enabled": true,
  "telemetry.enabled": true,
  "scheduler.enabled": true,
  "health.checkOnStart": true,
};

export class IntelligenceConfigurationImpl
  implements IntelligenceConfigurationContract
{
  private values: Record<string, unknown>;
  private updatedAt: string;
  private readonly clock: IntelligencePlatformClock;
  private readonly telemetry: IntelligenceTelemetry | null;

  constructor(options: {
    clock?: IntelligencePlatformClock;
    telemetry?: IntelligenceTelemetry;
    initial?: Record<string, unknown>;
  } = {}) {
    this.clock = options.clock ?? createDefaultClock();
    this.telemetry = options.telemetry ?? null;
    this.values = { ...DEFAULTS, ...(options.initial ?? {}) };
    this.updatedAt = this.clock.now().toISOString();
  }

  get<T = unknown>(key: string, fallback?: T): T | undefined {
    if (Object.prototype.hasOwnProperty.call(this.values, key)) {
      return this.values[key] as T;
    }
    return fallback;
  }

  set(key: string, value: unknown): void {
    this.values[key] = value;
    this.updatedAt = this.clock.now().toISOString();
    this.telemetry?.emit("config.updated", { payload: { key, value } });
  }

  has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.values, key);
  }

  delete(key: string): boolean {
    if (!this.has(key)) return false;
    delete this.values[key];
    this.updatedAt = this.clock.now().toISOString();
    this.telemetry?.emit("config.updated", { payload: { key, deleted: true } });
    return true;
  }

  snapshot(): IntelligenceConfigurationSnapshot {
    return {
      updatedAt: this.updatedAt,
      values: { ...this.values },
    };
  }

  merge(values: Record<string, unknown>): void {
    this.values = { ...this.values, ...values };
    this.updatedAt = this.clock.now().toISOString();
    this.telemetry?.emit("config.updated", {
      payload: { mergedKeys: Object.keys(values) },
    });
  }

  reset(): void {
    this.values = { ...DEFAULTS };
    this.updatedAt = this.clock.now().toISOString();
    this.telemetry?.emit("config.updated", { payload: { reset: true } });
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceConfigurationImpl as IntelligenceConfiguration };

export function createIntelligenceConfiguration(options?: {
  clock?: IntelligencePlatformClock;
  telemetry?: IntelligenceTelemetry;
  initial?: Record<string, unknown>;
}): IntelligenceConfigurationImpl {
  return new IntelligenceConfigurationImpl(options);
}
