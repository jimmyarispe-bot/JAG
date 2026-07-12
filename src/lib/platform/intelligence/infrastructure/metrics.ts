/**
 * Intelligence Platform Infrastructure — IntelligenceMetrics (Sprint 027).
 */

import type {
  IntelligenceMetrics as IntelligenceMetricsContract,
  IntelligencePlatformClock,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceMetricSample,
  IntelligenceModuleId,
} from "@/lib/platform/intelligence/infrastructure/types";
import { createDefaultClock } from "@/lib/platform/intelligence/infrastructure/clock";

export class IntelligenceMetricsImpl implements IntelligenceMetricsContract {
  private readonly samples: IntelligenceMetricSample[] = [];
  private readonly clock: IntelligencePlatformClock;

  constructor(clock: IntelligencePlatformClock = createDefaultClock()) {
    this.clock = clock;
  }

  increment(
    name: string,
    value = 1,
    tags?: Record<string, string>,
    moduleId?: IntelligenceModuleId
  ): void {
    this.record(name, value, "count", tags, moduleId);
  }

  gauge(
    name: string,
    value: number,
    tags?: Record<string, string>,
    moduleId?: IntelligenceModuleId
  ): void {
    this.record(name, value, "gauge", tags, moduleId);
  }

  timing(
    name: string,
    durationMs: number,
    tags?: Record<string, string>,
    moduleId?: IntelligenceModuleId
  ): void {
    this.record(name, durationMs, "ms", tags, moduleId);
  }

  list(filter?: {
    name?: string;
    moduleId?: IntelligenceModuleId;
  }): IntelligenceMetricSample[] {
    return this.samples.filter((sample) => {
      if (filter?.name && sample.name !== filter.name) return false;
      if (filter?.moduleId && sample.moduleId !== filter.moduleId) return false;
      return true;
    });
  }

  snapshot(): IntelligenceMetricSample[] {
    return [...this.samples];
  }

  clear(): void {
    this.samples.length = 0;
  }

  private record(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>,
    moduleId?: IntelligenceModuleId
  ): void {
    this.samples.push({
      name,
      value,
      unit,
      moduleId,
      tags,
      recordedAt: this.clock.now().toISOString(),
    });
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceMetricsImpl as IntelligenceMetrics };

export function createIntelligenceMetrics(
  clock?: IntelligencePlatformClock
): IntelligenceMetricsImpl {
  return new IntelligenceMetricsImpl(clock);
}
