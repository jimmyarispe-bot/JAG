import type { StakeholderForecastEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import { buildLens, clamp, levelFromValue, outlookFromScore } from "@/lib/platform/intelligence/stakeholder/models";
import { STAKEHOLDER_AREAS, type StakeholderForecastSuite } from "@/lib/platform/intelligence/stakeholder/types";

export class StakeholderForecastEngine implements StakeholderForecastEngineContract {
  assess(input: Parameters<StakeholderForecastEngineContract["assess"]>[0]): StakeholderForecastSuite {
    const forecasts = STAKEHOLDER_AREAS.map((area, index) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (index % 3) - 1 + input.baseline.forecastMaturity / 50);
      const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
      const horizon = index % 3 === 0 ? "near" as const : index % 3 === 1 ? "medium" as const : "long" as const;
      return {
        id: input.createId("stk-forecast"),
        area,
        horizon,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence,
        lenses: buildLens({
          influence: `${area} influence forecast ${Math.round(forecast)} over ${horizon} horizon.`,
          interest: `Interest path for ${area} band ${Math.round(forecast - 8)}–${Math.round(forecast + 8)}.`,
          trust: `Trust outlook tied to ${area} forecast.`,
          engagement: `Engagement quality under ${area} ${horizon}-term path.`,
          satisfaction: `Satisfaction implication of ${area} trajectory.`,
          relationshipStrength: `Relationship sensitivity to ${area} forecast.`,
          collaborationOpportunity: `Collaboration load under ${area} forecast path.`,
          strategicImportance: `Act on ${area} ${horizon}-horizon stakeholder window.`,
        }),
        narrative: `${area} ${horizon}-term stakeholder forecast ${Math.round(forecast)}.`,
      };
    });
    const avg = forecasts.reduce((s, f) => s + f.forecast, 0) / forecasts.length;
    const volatility = Math.max(...forecasts.map(f => f.high - f.low)) - 8;
    return {
      forecasts,
      outlook: outlookFromScore(avg, volatility),
      maturityScore: input.baseline.forecastMaturity,
      narrative: `Stakeholder forecast suite covers ${forecasts.length} areas with near/medium/long horizons.`,
    };
  }
}
