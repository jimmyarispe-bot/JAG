/**
 * PredictionEngine — composes forecast + confidence models — Sprint 201.
 */

import { computeConfidence } from "./ConfidenceModel";
import { computeForecast } from "./ForecastModel";
import { horizonLabel, type PredictionHorizon } from "./PredictionHorizon";
import { PredictionRegistry } from "./PredictionRegistry";
import type { PredictionResult } from "./PredictionResult";
import type { PredictionContext, PredictionKind } from "./PredictionTypes";
import { PREDICTION_KIND_LABELS } from "./PredictionTypes";

const ADVISORY =
  "Advisory forecast — not a fact. Review evidence, assumptions, and confidence before acting.";

export type PredictionEngineRun = {
  readonly results: readonly PredictionResult[];
  readonly contributorsUsed: readonly string[];
  readonly confidenceByKind: Readonly<
    Record<string, { confidence: number; band: string; factors: Record<string, number> }>
  >;
  readonly durationMs: number;
};

function avgConfidence(context: PredictionContext, contributorIds: readonly string[]): number {
  const set = new Set(contributorIds);
  const matched = context.signals.filter((s) => set.has(s.contributorId));
  if (matched.length === 0) {
    if (context.signals.length === 0) return 0;
    return context.signals.reduce((a, s) => a + s.confidence, 0) / context.signals.length;
  }
  return matched.reduce((a, s) => a + s.confidence, 0) / matched.length;
}

export function runPredictionEngine(options: {
  readonly context: PredictionContext;
  readonly kinds?: readonly PredictionKind[];
  readonly horizon?: PredictionHorizon;
}): PredictionEngineRun {
  const started = Date.now();
  const kinds = options.kinds ?? PredictionRegistry.listKinds();
  const results: PredictionResult[] = [];
  const contributors = new Set<string>();
  const confidenceByKind: Record<
    string,
    { confidence: number; band: string; factors: Record<string, number> }
  > = {};

  for (const kind of kinds) {
    const horizon = options.horizon ?? PredictionRegistry.defaultHorizonFor(kind);
    const forecast = computeForecast({ kind, horizon, context: options.context });
    forecast.supportingContributors.forEach((c) => contributors.add(c));

    const conf = computeConfidence({
      signalQuality: forecast.signalQuality,
      evidenceCount: forecast.evidence.length,
      contributorCount: forecast.supportingContributors.length,
      averageContributorConfidence: avgConfidence(options.context, forecast.supportingContributors),
      horizon,
      insufficientData: forecast.insufficientData,
      pressureScore: forecast.pressureScore,
    });

    confidenceByKind[kind] = {
      confidence: conf.confidence,
      band: conf.band,
      factors: { ...conf.factors },
    };

    results.push({
      id: `pred-${options.context.organizationId}-${kind}-${typeof horizon === "string" ? horizon : `custom-${horizon.days}`}`,
      kind,
      title: PREDICTION_KIND_LABELS[kind],
      advisoryNotice: ADVISORY,
      horizon,
      horizonLabel: horizonLabel(horizon),
      organizationId: options.context.organizationId,
      organizationName: options.context.organizationName,
      generatedAt: new Date().toISOString(),
      currentState: forecast.currentState,
      predictedState: forecast.predictedState,
      trend: forecast.trend,
      confidence: conf.confidence,
      confidenceBand: conf.band,
      confidenceExplanation: conf.explanation,
      riskLevel: forecast.riskLevel,
      primaryDrivers: forecast.primaryDrivers,
      supportingContributors: forecast.supportingContributors,
      evidence: forecast.evidence,
      assumptions: forecast.assumptions,
      recommendedPreventiveActions: forecast.recommendedPreventiveActions,
      narrative: forecast.narrative,
      insufficientData: forecast.insufficientData,
    });
  }

  return {
    results,
    contributorsUsed: [...contributors],
    confidenceByKind,
    durationMs: Date.now() - started,
  };
}
