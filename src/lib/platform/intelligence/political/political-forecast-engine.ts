import type { PoliticalForecastEngineContract } from "@/lib/platform/intelligence/political/contracts";
import { buildLens, clamp, levelFromValue, outlookFromScore } from "@/lib/platform/intelligence/political/models";
import { POLITICAL_AREAS, type PoliticalForecastSuite } from "@/lib/platform/intelligence/political/types";

export class PoliticalForecastEngine implements PoliticalForecastEngineContract {
  assess(input: Parameters<PoliticalForecastEngineContract["assess"]>[0]): PoliticalForecastSuite {
    const forecasts = POLITICAL_AREAS.map((area, index) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (index % 3) - 1 + input.baseline.forecastMaturity / 50);
      const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
      const horizon = index % 3 === 0 ? "near" as const : index % 3 === 1 ? "medium" as const : "long" as const;
      return {
        id: input.createId("pol-forecast"),
        area,
        horizon,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence,
        lenses: buildLens({
          legislativeImpact: `${area} legislative forecast ${Math.round(forecast)} over ${horizon} horizon.`,
          regulatoryRisk: `Regulatory path for ${area} band ${Math.round(forecast - 8)}–${Math.round(forecast + 8)}.`,
          governmentFundingOpportunity: `Funding outlook tied to ${area} forecast.`,
          taxExposure: `Fiscal exposure under ${area} ${horizon}-term path.`,
          politicalStability: `Stability implication of ${area} trajectory.`,
          tradeImpact: `Trade sensitivity to ${area} forecast.`,
          compliancePressure: `Compliance load under ${area} forecast path.`,
          strategicTiming: `Act on ${area} ${horizon}-horizon window.`,
        }),
        narrative: `${area} ${horizon}-term political forecast ${Math.round(forecast)}.`,
      };
    });
    const avg = forecasts.reduce((s, f) => s + f.forecast, 0) / forecasts.length;
    const volatility = Math.max(...forecasts.map(f => f.high - f.low)) - 8;
    return {
      forecasts,
      outlook: outlookFromScore(avg, volatility),
      maturityScore: input.baseline.forecastMaturity,
      narrative: `Political forecast suite covers ${forecasts.length} areas with near/medium/long horizons.`,
    };
  }
}
