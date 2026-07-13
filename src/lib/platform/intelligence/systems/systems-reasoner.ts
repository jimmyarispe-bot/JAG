import type { SystemsReasonerContract } from "@/lib/platform/intelligence/systems/contracts";
import type { SystemsReasoningResult } from "@/lib/platform/intelligence/systems/types";

export class SystemsReasoner implements SystemsReasonerContract {
  reason(input: Parameters<SystemsReasonerContract["reason"]>[0]): SystemsReasoningResult {
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
        `Systems outlook is ${input.forecasts.outlook} with primary scenario ${input.scenarios.primaryScenario.replaceAll("_", " ")}.`,
      connectedForces,
      evidenceGaps,
      confidence: input.confidence,
      narrative: `Reasoning used ${input.trends.trends.length} trends, ${input.forecasts.forecasts.length} forecasts, and ${input.scenarios.scenarios.length} scenarios.`,
    };
  }
}
