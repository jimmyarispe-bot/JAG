/**
 * Opportunity scoring — value, feasibility, alignment, risk, confidence.
 */

import type { InnovationPattern, OpportunityScores } from "../types";

function clamp(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

export function scoreOpportunity(input: {
  pattern: InnovationPattern;
  signalCount: number;
  hasFinancialSignal: boolean;
  hasPerfSignal: boolean;
}): OpportunityScores {
  const businessValue = clamp(
    input.pattern.strength * 0.7 + Math.min(30, input.signalCount * 5)
  );
  const technicalFeasibility = clamp(
    input.pattern.kind === "training_gap" ||
      input.pattern.kind === "frequently_requested"
      ? 75
      : input.pattern.kind === "performance_degradation"
        ? 55
        : input.pattern.kind === "emerging_opportunity"
          ? 45
          : 60
  );
  const strategicAlignment = clamp(
    input.pattern.kind === "operational_inefficiency" ||
      input.pattern.kind === "workflow_bottleneck"
      ? 80
      : input.pattern.kind === "emerging_opportunity"
        ? 70
        : 60
  );
  const risk = clamp(
    input.pattern.kind === "performance_degradation"
      ? 70
      : input.pattern.kind === "feature_abandonment"
        ? 55
        : 35
  );
  const confidence = clamp(
    input.pattern.strength * 0.55 +
      Math.min(35, input.signalCount * 6) +
      (input.hasFinancialSignal ? 8 : 0) +
      (input.hasPerfSignal ? 5 : 0)
  );
  const total = clamp(
    businessValue * 0.28 +
      technicalFeasibility * 0.18 +
      strategicAlignment * 0.2 +
      (100 - risk) * 0.12 +
      confidence * 0.22
  );
  return {
    businessValue,
    technicalFeasibility,
    strategicAlignment,
    risk,
    confidence,
    total,
  };
}
