import type { ResilienceForecastEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_AREAS, type ResilienceForecastSuite } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceForecastEngine implements ResilienceForecastEngineContract {
  assess(input: Parameters<ResilienceForecastEngineContract["assess"]>[0]): ResilienceForecastSuite {
    const forecasts = RESILIENCE_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("rsl-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: buildLens({
            organizationalReadiness: `Forecast organizational readiness for ${area}.`,
            recoveryCapability: `Forecast recovery capability for ${area}.`,
            operationalStability: `Forecast operational stability for ${area}.`,
            financialStability: `Forecast financial stability for ${area}.`,
            workforceStability: `Forecast workforce stability for ${area}.`,
            infrastructureReadiness: `Forecast infrastructure readiness for ${area}.`,
            adaptiveCapacity: `Forecast adaptive capacity for ${area}.`,
            longTermResilienceOutlook: `Long-term resilience outlook forecast for ${area}.`,
          }),
        narrative: `${area} forecast ${Math.round(forecast)} from baseline ${Math.round(baseline)}.`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: `Resilience forecast maturity ${Math.round(maturityScore)}.`,
    };
  }
}
