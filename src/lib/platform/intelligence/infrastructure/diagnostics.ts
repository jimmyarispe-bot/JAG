/**
 * Intelligence Platform Infrastructure — IntelligenceDiagnostics (Sprint 027).
 */

import type {
  IntelligenceCache,
  IntelligenceConfiguration,
  IntelligenceDiagnostics as IntelligenceDiagnosticsContract,
  IntelligenceHealth,
  IntelligenceMetrics,
  IntelligenceTelemetry,
  IntelligenceVersioning,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type { IntelligenceDiagnosticsReport } from "@/lib/platform/intelligence/infrastructure/types";
import { INTELLIGENCE_PLATFORM_VERSION } from "@/lib/platform/intelligence/infrastructure/types";

export class IntelligenceDiagnosticsImpl
  implements IntelligenceDiagnosticsContract
{
  private readonly health: IntelligenceHealth;
  private readonly versioning: IntelligenceVersioning;
  private readonly metrics: IntelligenceMetrics;
  private readonly telemetry: IntelligenceTelemetry;
  private readonly cache: IntelligenceCache;
  private readonly configuration: IntelligenceConfiguration;

  constructor(options: {
    health: IntelligenceHealth;
    versioning: IntelligenceVersioning;
    metrics: IntelligenceMetrics;
    telemetry: IntelligenceTelemetry;
    cache: IntelligenceCache;
    configuration: IntelligenceConfiguration;
  }) {
    this.health = options.health;
    this.versioning = options.versioning;
    this.metrics = options.metrics;
    this.telemetry = options.telemetry;
    this.cache = options.cache;
    this.configuration = options.configuration;
  }

  async collect(): Promise<IntelligenceDiagnosticsReport> {
    const health = await this.health.checkAll();
    const cacheStats = this.cache.stats();
    const report: IntelligenceDiagnosticsReport = {
      collectedAt: new Date().toISOString(),
      platformVersion: INTELLIGENCE_PLATFORM_VERSION,
      health,
      versions: this.versioning.list(),
      metrics: this.metrics.snapshot().slice(-100),
      recentEvents: this.telemetry.recent(50),
      cache: {
        size: cacheStats.size,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
      },
      configuration: this.configuration.snapshot().values,
      notes: [
        `Platform ${INTELLIGENCE_PLATFORM_VERSION}`,
        health.summary,
        `Cache hits/misses: ${cacheStats.hits}/${cacheStats.misses}`,
      ],
    };
    this.telemetry.emit("diagnostics.collected", {
      payload: {
        status: health.status,
        moduleCount: health.modules.length,
      },
    });
    return report;
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceDiagnosticsImpl as IntelligenceDiagnostics };

export function createIntelligenceDiagnostics(options: {
  health: IntelligenceHealth;
  versioning: IntelligenceVersioning;
  metrics: IntelligenceMetrics;
  telemetry: IntelligenceTelemetry;
  cache: IntelligenceCache;
  configuration: IntelligenceConfiguration;
}): IntelligenceDiagnosticsImpl {
  return new IntelligenceDiagnosticsImpl(options);
}
