import type { SystemsForecastEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_AREAS, type SystemsForecastSuite } from "@/lib/platform/intelligence/systems/types";

export class SystemsForecastEngine implements SystemsForecastEngineContract {
  assess(input: Parameters<SystemsForecastEngineContract["assess"]>[0]): SystemsForecastSuite {
    const forecasts = SYSTEMS_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("sys-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: buildLens({
            dependencyImpact: `Forecast dependency impact for ${area}.`,
            bottleneckRisk: `Forecast bottleneck risk for ${area}.`,
            feedbackStability: `Forecast feedback stability for ${area}.`,
            systemComplexity: `Forecast system complexity for ${area}.`,
            resourceFlow: `Forecast resource flow for ${area}.`,
            cascadingRisk: `Forecast cascading risk for ${area}.`,
            adaptability: `Forecast adaptability for ${area}.`,
            longTermSystemHealth: `Long-term system health forecast for ${area}.`,
          }),
        narrative: `${area} forecast ${Math.round(forecast)} from baseline ${Math.round(baseline)}.`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: `Systems forecast maturity ${Math.round(maturityScore)}.`,
    };
  }
}
