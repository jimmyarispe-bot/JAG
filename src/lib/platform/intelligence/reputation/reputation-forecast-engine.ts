import type { ReputationForecastEngineContract } from "@/lib/platform/intelligence/reputation/contracts";
import { buildLens, clamp, levelFromValue, outlookFromScore } from "@/lib/platform/intelligence/reputation/models";
import { REPUTATION_AREAS, type ReputationForecastSuite } from "@/lib/platform/intelligence/reputation/types";

export class ReputationForecastEngine implements ReputationForecastEngineContract {
  assess(input: Parameters<ReputationForecastEngineContract["assess"]>[0]): ReputationForecastSuite {
    const forecasts = REPUTATION_AREAS.map((area, index) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (index % 3) - 1 + input.baseline.forecastMaturity / 50);
      const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
      const horizon = index % 3 === 0 ? "near" as const : index % 3 === 1 ? "medium" as const : "long" as const;
      return {
        id: input.createId("rep-forecast"),
        area,
        horizon,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence,
        lenses: buildLens({
          trustLevel: `${area} trust forecast ${Math.round(forecast)} over ${horizon} horizon.`,
          publicPerception: `Perception path for ${area} band ${Math.round(forecast - 8)}–${Math.round(forecast + 8)}.`,
          brandStrength: `Brand outlook tied to ${area} forecast.`,
          mediaExposure: `Media exposure under ${area} ${horizon}-term path.`,
          crisisRisk: `Crisis implication of ${area} trajectory.`,
          narrativeMomentum: `Narrative sensitivity to ${area} forecast.`,
          credibility: `Credibility load under ${area} forecast path.`,
          longTermReputationOutlook: `Act on ${area} ${horizon}-horizon reputation window.`,
        }),
        narrative: `${area} ${horizon}-term reputation forecast ${Math.round(forecast)}.`,
      };
    });
    const avg = forecasts.reduce((s, f) => s + f.forecast, 0) / forecasts.length;
    const volatility = Math.max(...forecasts.map(f => f.high - f.low)) - 8;
    return {
      forecasts,
      outlook: outlookFromScore(avg, volatility),
      maturityScore: input.baseline.forecastMaturity,
      narrative: `Reputation forecast suite covers ${forecasts.length} areas with near/medium/long horizons.`,
    };
  }
}
