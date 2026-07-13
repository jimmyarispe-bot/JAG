import type { EthicalForecastEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/ethical/models";
import { ETHICAL_AREAS, type EthicalForecastSuite } from "@/lib/platform/intelligence/ethical/types";

export class EthicalForecastEngine implements EthicalForecastEngineContract {
  assess(input: Parameters<EthicalForecastEngineContract["assess"]>[0]): EthicalForecastSuite {
    const forecasts = ETHICAL_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("eth-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: buildLens({
          valuesAlignment: `Forecast values alignment for ${area}.`,
          fairness: `Forecast fairness for ${area}.`,
          transparency: `Forecast transparency for ${area}.`,
          accountability: `Forecast accountability for ${area}.`,
          humanImpact: `Forecast human impact for ${area}.`,
          biasRisk: `Forecast bias risk for ${area}.`,
          governanceIntegrity: `Forecast governance integrity for ${area}.`,
          longTermEthicalOutlook: `Long-term ethical outlook forecast for ${area}.`,
        }),
        narrative: `${area} forecast ${Math.round(forecast)} from baseline ${Math.round(baseline)}.`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: `Ethical forecast maturity ${Math.round(maturityScore)}.`,
    };
  }
}
