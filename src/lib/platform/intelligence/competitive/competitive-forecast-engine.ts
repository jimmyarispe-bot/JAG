import type { CompetitiveForecastEngineContract } from "@/lib/platform/intelligence/competitive/contracts";
import { buildLens, clamp, levelFromValue, outlookFromScore } from "@/lib/platform/intelligence/competitive/models";
import { COMPETITIVE_AREAS, type CompetitiveForecastSuite } from "@/lib/platform/intelligence/competitive/types";

export class CompetitiveForecastEngine implements CompetitiveForecastEngineContract {
  assess(input: Parameters<CompetitiveForecastEngineContract["assess"]>[0]): CompetitiveForecastSuite {
    const forecasts = COMPETITIVE_AREAS.map((area, index) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (index % 3) - 1 + input.baseline.forecastMaturity / 50);
      const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
      const horizon = index % 3 === 0 ? "near" as const : index % 3 === 1 ? "medium" as const : "long" as const;
      return {
        id: input.createId("cmp-forecast"),
        area,
        horizon,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence,
        lenses: buildLens({
          competitiveThreatExists: `${area} competitive forecast ${Math.round(forecast)} over ${horizon} horizon.`,
          evidenceSupports: input.areas[area].narrative,
          competitorsInvolved: `Peer institutions active in ${area}.`,
          ourDifferentiation: `Differentiation tracking ${area} forecast trajectory.`,
          enrollmentOrRevenueImpact: `Enrollment impact band ${Math.round(forecast - 8)}–${Math.round(forecast + 8)}.`,
          responseOptions: `Scenario-plan around ${area} competitive low/base/high paths.`,
          organizationalCapabilitiesRequired: `Strategy, marketing, admissions, and academic planning.`,
          signalsToMonitor: `${area} competitive downside break and upside acceleration.`,
        }),
        narrative: `${area} ${horizon}-term competitive forecast ${Math.round(forecast)}.`,
      };
    });
    const avg = forecasts.reduce((s, f) => s + f.forecast, 0) / forecasts.length;
    const volatility = Math.max(...forecasts.map(f => f.high - f.low)) - 8;
    return {
      forecasts,
      outlook: outlookFromScore(avg, volatility),
      maturityScore: input.baseline.forecastMaturity,
      narrative: `Competitive forecast suite covers ${forecasts.length} areas with near/medium/long horizons.`,
    };
  }
}
