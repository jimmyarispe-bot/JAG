import type { EconomicForecastEngineContract } from "@/lib/platform/intelligence/economic/contracts";
import { buildLens, clamp, levelFromValue, outlookFromScore } from "@/lib/platform/intelligence/economic/models";
import { ECONOMIC_AREAS, type EconomicForecastSuite } from "@/lib/platform/intelligence/economic/types";

export class EconomicForecastEngine implements EconomicForecastEngineContract {
  assess(input: Parameters<EconomicForecastEngineContract["assess"]>[0]): EconomicForecastSuite {
    const forecasts = ECONOMIC_AREAS.map((area, index) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (index % 3) - 1 + input.baseline.forecastMaturity / 50);
      const confidence = levelFromValue(input.baseline.evidenceCoverage / 100);
      const horizon = index % 3 === 0 ? "near" as const : index % 3 === 1 ? "medium" as const : "long" as const;
      return {
        id: input.createId("eco-forecast"),
        area,
        horizon,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence,
        lenses: buildLens({
          economicForces: `${area} forecast ${Math.round(forecast)} over ${horizon} horizon.`,
          evidenceSupports: input.areas[area].narrative,
          confidenceLevel: confidence,
          organizationalAreas: "Pricing, staffing, funding, and capital planning.",
          financialImplications: `Budget planning band ${Math.round(forecast - 8)}–${Math.round(forecast + 8)}.`,
          operationalImplications: `Capacity planning follows ${horizon}-term ${area} outlook.`,
          strategicOptions: `Scenario-plan around ${area} low/base/high paths.`,
          scenariosToMonitor: `${area} downside break and upside acceleration.`,
        }),
        narrative: `${area} ${horizon}-term forecast ${Math.round(forecast)}.`,
      };
    });
    const avg = forecasts.reduce((s, f) => s + f.forecast, 0) / forecasts.length;
    const volatility = Math.max(...forecasts.map(f => f.high - f.low)) - 8;
    return {
      forecasts,
      outlook: outlookFromScore(avg, volatility),
      maturityScore: input.baseline.forecastMaturity,
      narrative: `Economic forecast suite covers ${forecasts.length} areas with near/medium/long horizons.`,
    };
  }
}
