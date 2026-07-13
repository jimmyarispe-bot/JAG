import type { BehavioralForecastEngineContract } from "@/lib/platform/intelligence/behavioral/contracts";
import { buildLens, clamp, levelFromValue, outlookFromScore } from "@/lib/platform/intelligence/behavioral/models";
import { BEHAVIORAL_AREAS, type BehavioralForecastSuite } from "@/lib/platform/intelligence/behavioral/types";

export class BehavioralForecastEngine implements BehavioralForecastEngineContract {
  assess(input: Parameters<BehavioralForecastEngineContract["assess"]>[0]): BehavioralForecastSuite {
    const forecasts = BEHAVIORAL_AREAS.map((area, index) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (index % 3) - 1 + input.baseline.forecastMaturity / 50);
      const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
      const horizon = index % 3 === 0 ? "near" as const : index % 3 === 1 ? "medium" as const : "long" as const;
      return {
        id: input.createId("beh-forecast"),
        area,
        horizon,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence,
        lenses: buildLens({
          decisionConfidence: `${area} decision forecast ${Math.round(forecast)} over ${horizon} horizon.`,
          cognitiveBiasRisk: `Bias path for ${area} band ${Math.round(forecast - 8)}-${Math.round(forecast + 8)}.`,
          motivationAlignment: `Motivation outlook tied to ${area} forecast.`,
          adoptionProbability: `Adoption under ${area} ${horizon}-term path.`,
          collaborationImpact: `Collaboration implication of ${area} trajectory.`,
          changeResistance: `Resistance sensitivity to ${area} forecast.`,
          leadershipReadiness: `Leadership load under ${area} forecast path.`,
          longTermBehavioralOutlook: `Act on ${area} ${horizon}-horizon behavioral window.`,
        }),
        narrative: `${area} ${horizon}-term behavioral forecast ${Math.round(forecast)}.`,
      };
    });
    const avg = forecasts.reduce((s, f) => s + f.forecast, 0) / forecasts.length;
    const volatility = Math.max(...forecasts.map(f => f.high - f.low)) - 8;
    return {
      forecasts,
      outlook: outlookFromScore(avg, volatility),
      maturityScore: input.baseline.forecastMaturity,
      narrative: `Behavioral forecast suite covers ${forecasts.length} areas with near/medium/long horizons.`,
    };
  }
}
