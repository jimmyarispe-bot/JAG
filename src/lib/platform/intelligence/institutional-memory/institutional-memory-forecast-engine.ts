import type { InstitutionalMemoryForecastEngineContract } from "@/lib/platform/intelligence/institutional-memory/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/institutional-memory/models";
import { INSTITUTIONAL_MEMORY_AREAS, type InstitutionalMemoryForecastSuite } from "@/lib/platform/intelligence/institutional-memory/types";

export class InstitutionalMemoryForecastEngine implements InstitutionalMemoryForecastEngineContract {
  assess(input: Parameters<InstitutionalMemoryForecastEngineContract["assess"]>[0]): InstitutionalMemoryForecastSuite {
    const forecasts = INSTITUTIONAL_MEMORY_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("imm-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: buildLens({
            knowledgeConfidence: `Forecast knowledge confidence for ${area}.`,
            evidenceStrength: `Forecast evidence strength for ${area}.`,
            institutionalMemoryCoverage: `Forecast institutional memory coverage for ${area}.`,
            knowledgeFreshness: `Forecast knowledge freshness for ${area}.`,
            expertiseAvailability: `Forecast expertise availability for ${area}.`,
            knowledgeGaps: `Forecast knowledge gaps for ${area}.`,
            knowledgeQuality: `Forecast knowledge quality for ${area}.`,
            longTermLearningValue: `Long-term learning value forecast for ${area}.`,
          }),
        narrative: `${area} forecast ${Math.round(forecast)} from baseline ${Math.round(baseline)}.`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: `Institutional memory forecast maturity ${Math.round(maturityScore)}.`,
    };
  }
}
