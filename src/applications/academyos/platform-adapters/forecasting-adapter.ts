import { ForecastingService } from "@/lib/platform/intelligence/forecasting/service";
import type { FounderMetric } from "@/lib/platform/founder/types";

/**
 * Isolates AcademyOS from Forecasting Service details.
 * Academy domain KPIs feed metrics; platform runs projections.
 */
export const ForecastingPlatformAdapter = {
  listScenarios() {
    return ForecastingService.scenarios();
  },

  analyzeFromMetrics(input: {
    organizationId?: string | null;
    metrics: FounderMetric[];
    observedAt?: string;
    horizonDays?: number;
  }) {
    return ForecastingService.analyzeFromFounderMetrics({
      organizationId: input.organizationId,
      metrics: input.metrics,
      observedAt: input.observedAt,
      horizonDays: input.horizonDays,
      scenarioId: "baseline",
    });
  },
};
