import type { EnvironmentalForecastEngineContract } from "@/lib/platform/intelligence/environmental/contracts";
import { buildLens, clamp, levelFromValue, outlookFromScore } from "@/lib/platform/intelligence/environmental/models";
import { ENVIRONMENTAL_AREAS, type EnvironmentalForecastSuite } from "@/lib/platform/intelligence/environmental/types";

export class EnvironmentalForecastEngine implements EnvironmentalForecastEngineContract {
  assess(input: Parameters<EnvironmentalForecastEngineContract["assess"]>[0]): EnvironmentalForecastSuite {
    const forecasts = ENVIRONMENTAL_AREAS.map((area, index) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (index % 3) - 1 + input.baseline.forecastMaturity / 50);
      const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
      const horizon = index % 3 === 0 ? "near" as const : index % 3 === 1 ? "medium" as const : "long" as const;
      return {
        id: input.createId("env-forecast"),
        area,
        horizon,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence,
        lenses: buildLens({
          climateRisk: `${area} climate forecast ${Math.round(forecast)} over ${horizon} horizon.`,
          facilityExposure: `Facility exposure path for ${area} band ${Math.round(forecast - 8)}–${Math.round(forecast + 8)}.`,
          infrastructureResilience: `Infrastructure outlook tied to ${area} forecast.`,
          resourceAvailability: `Resource availability under ${area} ${horizon}-term path.`,
          sustainabilityImpact: `Sustainability implication of ${area} trajectory.`,
          regulatoryExposure: `Regulatory sensitivity to ${area} forecast.`,
          insuranceRisk: `Insurance load under ${area} forecast path.`,
          longTermEnvironmentalOutlook: `Act on ${area} ${horizon}-horizon environmental window.`,
        }),
        narrative: `${area} ${horizon}-term environmental forecast ${Math.round(forecast)}.`,
      };
    });
    const avg = forecasts.reduce((s, f) => s + f.forecast, 0) / forecasts.length;
    const volatility = Math.max(...forecasts.map(f => f.high - f.low)) - 8;
    return {
      forecasts,
      outlook: outlookFromScore(avg, volatility),
      maturityScore: input.baseline.forecastMaturity,
      narrative: `Environmental forecast suite covers ${forecasts.length} areas with near/medium/long horizons.`,
    };
  }
}
