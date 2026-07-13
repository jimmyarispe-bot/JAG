import type { WisdomForecastEngineContract } from "@/lib/platform/intelligence/wisdom/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/wisdom/models";
import { WISDOM_AREAS, type WisdomForecastSuite } from "@/lib/platform/intelligence/wisdom/types";

export class WisdomForecastEngine implements WisdomForecastEngineContract {
  assess(input: Parameters<WisdomForecastEngineContract["assess"]>[0]): WisdomForecastSuite {
    const forecasts = WISDOM_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("wis-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: buildLens({
            strategicValue: `Forecast strategic value for ${area}.`,
            longTermImpact: `Forecast long-term impact for ${area}.`,
            confidenceLevel: `Forecast confidence level for ${area}.`,
            evidenceQuality: `Forecast evidence quality for ${area}.`,
            tradeOffBalance: `Forecast trade-off balance for ${area}.`,
            organizationalAlignment: `Forecast organizational alignment for ${area}.`,
            ethicalIntegrity: `Forecast ethical integrity for ${area}.`,
            wisdomScore: `Wisdom score forecast for ${area}.`,
          }),
        narrative: `${area} forecast ${Math.round(forecast)} from baseline ${Math.round(baseline)}.`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: `Wisdom intelligence forecast maturity ${Math.round(maturityScore)}.`,
    };
  }
}
