import type { CulturalForecastEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import { buildLens, clamp, levelFromValue, outlookFromScore } from "@/lib/platform/intelligence/cultural/models";
import { CULTURAL_AREAS, type CulturalForecastSuite } from "@/lib/platform/intelligence/cultural/types";

export class CulturalForecastEngine implements CulturalForecastEngineContract {
  assess(input: Parameters<CulturalForecastEngineContract["assess"]>[0]): CulturalForecastSuite {
    const forecasts = CULTURAL_AREAS.map((area, index) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (index % 3) - 1 + input.baseline.forecastMaturity / 50);
      const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
      const horizon = index % 3 === 0 ? "near" as const : index % 3 === 1 ? "medium" as const : "long" as const;
      return {
        id: input.createId("cul-forecast"),
        area,
        horizon,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence,
        lenses: buildLens({
          missionAlignment: `${area} mission forecast ${Math.round(forecast)} over ${horizon} horizon.`,
          valuesAlignment: `Values path for ${area} band ${Math.round(forecast - 8)}-${Math.round(forecast + 8)}.`,
          culturalHealth: `Cultural health outlook tied to ${area} forecast.`,
          collaborationQuality: `Collaboration under ${area} ${horizon}-term path.`,
          innovationReadiness: `Innovation implication of ${area} trajectory.`,
          psychologicalSafety: `Safety sensitivity to ${area} forecast.`,
          engagement: `Engagement load under ${area} forecast path.`,
          longTermCulturalOutlook: `Act on ${area} ${horizon}-horizon cultural window.`,
        }),
        narrative: `${area} ${horizon}-term cultural forecast ${Math.round(forecast)}.`,
      };
    });
    const avg = forecasts.reduce((s, f) => s + f.forecast, 0) / forecasts.length;
    const volatility = Math.max(...forecasts.map(f => f.high - f.low)) - 8;
    return {
      forecasts,
      outlook: outlookFromScore(avg, volatility),
      maturityScore: input.baseline.forecastMaturity,
      narrative: `Cultural forecast suite covers ${forecasts.length} areas with near/medium/long horizons.`,
    };
  }
}
