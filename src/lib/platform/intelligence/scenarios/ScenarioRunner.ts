/**
 * ScenarioRunner — executes one or more scenarios against a baseline.
 */

import { compareScenarios, type ScenarioComparison } from "./ScenarioComparison";
import { computeScenarioModel } from "./ScenarioModel";
import type { ScenarioResult } from "./ScenarioResult";
import type { ScenarioBaseline, ScenarioInputs, ScenarioKind } from "./ScenarioTypes";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function bandOf(c: number): "low" | "moderate" | "high" {
  if (c >= 0.7) return "high";
  if (c >= 0.45) return "moderate";
  return "low";
}

function confidenceFor(
  signalQuality: number,
  inputStrength: number,
  insufficientBaseline: boolean,
  timelineDays: number
): { confidence: number; band: "low" | "moderate" | "high"; explanation: string } {
  if (insufficientBaseline && signalQuality < 0.1) {
    const confidence = Number(clamp01(0.25 + inputStrength * 0.2).toFixed(3));
    return {
      confidence,
      band: bandOf(confidence),
      explanation:
        "Low–moderate confidence: inputs are clear but baseline contributor evidence is thin. Projection remains advisory.",
    };
  }
  const horizonPenalty = clamp01((timelineDays || 90) / 240);
  const raw =
    signalQuality * 0.4 +
    inputStrength * 0.25 +
    0.25 +
    (1 - horizonPenalty) * 0.15;
  const confidence = Number(clamp01(raw).toFixed(3));
  return {
    confidence,
    band: bandOf(confidence),
    explanation: [
      `Confidence ${bandOf(confidence)} (${(confidence * 100).toFixed(0)}%) from baseline signal quality`,
      `(${(signalQuality * 100).toFixed(0)}%), input strength (${(inputStrength * 100).toFixed(0)}%),`,
      `and timeline (${timelineDays} days). Confidence reflects evidence strength, not certainty of outcome.`,
    ].join(" "),
  };
}

export type ScenarioRunSpec = {
  readonly kind: ScenarioKind;
  readonly inputs: ScenarioInputs;
};

export type ScenarioRunnerOutput = {
  readonly results: readonly ScenarioResult[];
  readonly comparison: ScenarioComparison | null;
  readonly durationMs: number;
  readonly confidenceByScenario: Readonly<
    Record<string, { confidence: number; band: string }>
  >;
};

export function runScenarios(options: {
  readonly baseline: ScenarioBaseline;
  readonly specs: readonly ScenarioRunSpec[];
  readonly compare?: boolean;
}): ScenarioRunnerOutput {
  const started = Date.now();
  const results: ScenarioResult[] = [];
  const confidenceByScenario: Record<string, { confidence: number; band: string }> = {};

  for (const spec of options.specs) {
    const model = computeScenarioModel({
      kind: spec.kind,
      inputs: spec.inputs,
      baseline: options.baseline,
    });
    const conf = confidenceFor(
      model.signalQuality,
      model.inputStrength,
      model.insufficientBaseline,
      spec.inputs.timelineDays ?? 90
    );
    const id = `scn-${spec.inputs.organizationId}-${spec.kind}-${results.length}-${Date.now()}`;
    confidenceByScenario[id] = { confidence: conf.confidence, band: conf.band };
    results.push({
      id,
      kind: model.kind,
      title: model.title,
      advisoryNotice: model.advisoryNotice,
      organizationId: model.organizationId,
      organizationName: model.organizationName,
      generatedAt: new Date().toISOString(),
      inputs: model.inputs,
      currentState: model.currentState,
      scenarioState: model.scenarioState,
      projectedDifference: model.projectedDifference,
      confidence: conf.confidence,
      confidenceBand: conf.band,
      confidenceExplanation: conf.explanation,
      primaryDrivers: model.primaryDrivers,
      evidence: model.evidence,
      assumptions: model.assumptions,
      risks: model.risks,
      opportunities: model.opportunities,
      tradeOffs: model.tradeOffs,
      recommendedDecisions: model.recommendedDecisions,
      narrative: model.narrative,
      insufficientBaseline: model.insufficientBaseline,
    });
  }

  const comparison =
    options.compare && results.length > 0
      ? compareScenarios({
          organizationId: options.baseline.organizationId,
          results,
          includeCurrentBaseline: true,
        })
      : null;

  return {
    results,
    comparison,
    durationMs: Date.now() - started,
    confidenceByScenario,
  };
}
