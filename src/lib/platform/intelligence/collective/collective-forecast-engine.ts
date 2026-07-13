import type { CollectiveForecastEngineContract } from "@/lib/platform/intelligence/collective/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/collective/models";
import { COLLECTIVE_AREAS, type CollectiveForecastSuite } from "@/lib/platform/intelligence/collective/types";

export class CollectiveForecastEngine implements CollectiveForecastEngineContract {
  assess(input: Parameters<CollectiveForecastEngineContract["assess"]>[0]): CollectiveForecastSuite {
    const forecasts = COLLECTIVE_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("col-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: buildLens({
            consensusStrength: `Forecast consensus strength for ${area}.`,
            expertiseCoverage: `Forecast expertise coverage for ${area}.`,
            perspectiveDiversity: `Forecast perspective diversity for ${area}.`,
            crossDomainAgreement: `Forecast cross-domain agreement for ${area}.`,
            organizationalAlignment: `Forecast organizational alignment for ${area}.`,
            collaborationQuality: `Forecast collaboration quality for ${area}.`,
            collectiveConfidence: `Forecast collective confidence for ${area}.`,
            longTermCollectiveValue: `Long-term collective value forecast for ${area}.`,
          }),
        narrative: `${area} forecast ${Math.round(forecast)} from baseline ${Math.round(baseline)}.`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: `Collective intelligence forecast maturity ${Math.round(maturityScore)}.`,
    };
  }
}
