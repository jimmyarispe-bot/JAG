import type { EcosystemForecastEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_AREAS, type EcosystemForecastSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemForecastEngine implements EcosystemForecastEngineContract {
  assess(input: Parameters<EcosystemForecastEngineContract["assess"]>[0]): EcosystemForecastSuite {
    const forecasts = ECOSYSTEM_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("esm-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: buildLens({
            networkStrength: `Forecast network strength for ${area}.`,
            strategicPartnerships: `Forecast strategic partnerships for ${area}.`,
            ecosystemHealth: `Forecast ecosystem health for ${area}.`,
            collaborationPotential: `Forecast collaboration potential for ${area}.`,
            dependencyRisk: `Forecast dependency risk for ${area}.`,
            networkEffects: `Forecast network effects for ${area}.`,
            strategicPosition: `Forecast strategic position for ${area}.`,
            longTermEcosystemOutlook: `Long-term ecosystem outlook forecast for ${area}.`,
          }),
        narrative: `${area} forecast ${Math.round(forecast)} from baseline ${Math.round(baseline)}.`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: `Ecosystem forecast maturity ${Math.round(maturityScore)}.`,
    };
  }
}
