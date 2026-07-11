/**
 * Decision Intelligence — scenarios.
 */

import {
  DECISION_SCENARIO_KINDS,
  type DecisionAlternative,
  type DecisionAlternativesResult,
  type DecisionRequest,
  type DecisionScenario,
  type DecisionScenarioKind,
  type DecisionScenariosResult,
} from "@/lib/platform/intelligence/decision/types";

/**
 * Generates best / expected / worst / most-likely scenarios.
 */
export class DecisionScenarios {
  generate(
    request: DecisionRequest,
    alternatives: DecisionAlternativesResult
  ): DecisionScenariosResult {
    const top = alternatives.alternatives[0] ?? null;
    const scenarios = DECISION_SCENARIO_KINDS.map((kind) =>
      this.buildScenario(request, kind, top)
    );

    return {
      requestId: request.requestId,
      scenarios,
      summary: `Projected ${scenarios.length} scenarios around "${top?.title ?? request.subject}".`,
      metadata: request.metadata,
    };
  }

  private buildScenario(
    request: DecisionRequest,
    kind: DecisionScenarioKind,
    top: DecisionAlternative | null
  ): DecisionScenario {
    const baseValue = top?.score ?? 0.5;
    const config = scenarioConfig(kind, baseValue);

    return {
      scenarioId: `${request.requestId}:scenario:${kind}`,
      kind,
      title: config.title,
      narrative: config.narrative(request.subject, top?.title ?? "the recommended option"),
      probability: config.probability,
      outcomeValue: config.outcomeValue,
      linkedAlternativeId: top?.alternativeId,
    };
  }
}

function scenarioConfig(
  kind: DecisionScenarioKind,
  baseValue: number
): {
  title: string;
  probability: number;
  outcomeValue: number;
  narrative: (subject: string, option: string) => string;
} {
  switch (kind) {
    case "best_case":
      return {
        title: "Best Case",
        probability: 0.15,
        outcomeValue: Math.min(1, baseValue + 0.25),
        narrative: (subject, option) =>
          `Best case for "${subject}": ${option} exceeds expected value with smooth approval and rapid realization.`,
      };
    case "expected_case":
      return {
        title: "Expected Case",
        probability: 0.4,
        outcomeValue: baseValue,
        narrative: (subject, option) =>
          `Expected case for "${subject}": ${option} delivers planned impact within estimated timeline and budget.`,
      };
    case "worst_case":
      return {
        title: "Worst Case",
        probability: 0.15,
        outcomeValue: Math.max(0, baseValue - 0.35),
        narrative: (subject, option) =>
          `Worst case for "${subject}": ${option} faces delays, cost overruns, or diluted impact.`,
      };
    case "most_likely":
      return {
        title: "Most Likely",
        probability: 0.3,
        outcomeValue: Number((baseValue * 0.95).toFixed(4)),
        narrative: (subject, option) =>
          `Most likely case for "${subject}": ${option} succeeds with moderate friction and partial schedule slip.`,
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
