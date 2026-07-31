import { runForecastEngine } from "@/lib/platform/intelligence/forecasting/engine";
import { buildForecastingHistory } from "@/lib/platform/intelligence/forecasting/history";
import { listScenarios } from "@/lib/platform/intelligence/forecasting/scenarios";
import type {
  ForecastingResult,
  RunForecastInput,
  ScenarioId,
} from "@/lib/platform/intelligence/forecasting/types";
import type { FounderMetric } from "@/lib/platform/founder/types";

/**
 * Forecasting Service — deterministic projections from operational history.
 * Does not modify Executive Intelligence, Decisions, Notifications, or Automation.
 */
export const ForecastingService = {
  scenarios: listScenarios,

  buildHistory: buildForecastingHistory,

  analyze(input: RunForecastInput): ForecastingResult {
    return runForecastEngine(input);
  },

  /**
   * Convenience: Founder metrics (+ optional priors) → history → forecasts.
   * Reads Sprint 069 repositories for decision/automation supporting context.
   */
  analyzeFromFounderMetrics(input: {
    organizationId?: string | null;
    metrics: FounderMetric[];
    observedAt?: string;
    scenarioId?: ScenarioId;
    prior?: Parameters<typeof buildForecastingHistory>[0]["prior"];
    horizonDays?: number;
    includeAllScenarios?: boolean;
  }): ForecastingResult {
    const observedAt = input.observedAt ?? new Date().toISOString();
    const history = buildForecastingHistory({
      organizationId: input.organizationId,
      metrics: input.metrics,
      observedAt,
      prior: input.prior,
    });
    return runForecastEngine({
      history,
      scenarioId: input.scenarioId ?? "baseline",
      horizonDays: input.horizonDays,
      includeAllScenarios: input.includeAllScenarios,
    });
  },
} as const;

export type ForecastingServiceApi = typeof ForecastingService;
