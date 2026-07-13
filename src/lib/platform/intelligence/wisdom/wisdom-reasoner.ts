import type { WisdomReasonerContract } from "@/lib/platform/intelligence/wisdom/contracts";
import type { WisdomReasoningResult } from "@/lib/platform/intelligence/wisdom/types";

export class WisdomReasoner implements WisdomReasonerContract {
  reason(input: Parameters<WisdomReasonerContract["reason"]>[0]): WisdomReasoningResult {
    const connectedForces = input.trends.trends
      .slice()
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 6)
      .map(t => t.title);
    const evidenceGaps = input.forecasts.forecasts
      .filter(f => f.confidence === "low" || f.confidence === "unknown")
      .slice(0, 6)
      .map(f => f.narrative);
    return {
      answer: input.request.question ??
        `Wisdom intelligence outlook is ${input.forecasts.outlook} with primary scenario ${input.scenarios.primaryScenario.replaceAll("_", " ")}.`,
      connectedForces,
      evidenceGaps,
      confidence: input.confidence,
      narrative: `Reasoning used ${input.trends.trends.length} trends, ${input.forecasts.forecasts.length} forecasts, and ${input.scenarios.scenarios.length} scenarios.`,
    };
  }
}
