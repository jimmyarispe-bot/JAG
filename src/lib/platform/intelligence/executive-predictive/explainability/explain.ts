/**
 * Prediction explainability (Sprint 065).
 */

import {
  clamp01,
  forecastConfidence,
  hasContradictorySignals,
  signalAgreement,
} from "@/lib/platform/intelligence/executive-predictive/confidence/confidence";
import type {
  ForecastAssumption,
  HistoricalSignal,
  PredictionEvidence,
  PredictionExplainability,
} from "@/lib/platform/intelligence/executive-predictive/types";

export function buildExplainability(input: {
  subject: string;
  horizon: string;
  why: string;
  historical: HistoricalSignal[];
  current: PredictionEvidence[];
  assumptions: ForecastAssumption[];
  baseConfidence?: number;
}): PredictionExplainability {
  const historicalEvidence: PredictionEvidence[] = input.historical.map((h, i) => ({
    id: `hist-${h.id || i}`,
    statement:
      h.narrative ??
      `${h.subject} signal at ${h.at}: value ${h.value} (${h.direction})`,
    source: "history",
    supporting: h.direction !== "down" || input.subject.includes("risk"),
    weight: 0.7,
    domain: h.domain,
  }));

  const agreement = signalAgreement(input.historical);
  const contradictory = hasContradictorySignals(input.historical);
  const confidence =
    input.baseConfidence ??
    forecastConfidence({
      historyCount: input.historical.length,
      horizon: input.horizon,
      signalAgreement: agreement,
      contradictory,
    });

  const invalidating = input.assumptions
    .filter((a) => a.critical)
    .map((a) => a.statement);
  if (contradictory) {
    invalidating.push(
      "Historical signals disagree on direction — a regime change would invalidate the trend extrapolation."
    );
  }
  if (input.historical.length === 0) {
    invalidating.push(
      "No historical series available — forecast rests on current signals and decision context only."
    );
  }

  return {
    why: input.why,
    historicalEvidence,
    currentSignals: input.current,
    invalidatingAssumptions:
      invalidating.length > 0
        ? invalidating
        : ["Material policy or funding changes outside modeled assumptions."],
    confidenceGuidance:
      confidence >= 0.7
        ? "Executives may treat this as a planning-grade signal with routine monitoring."
        : confidence >= 0.45
          ? "Use for contingency planning; verify with domain owners before committing resources."
          : "Low confidence — treat as a directional hypothesis, not a plan baseline.",
    confidence: clamp01(confidence),
  };
}
