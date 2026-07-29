/**
 * Application-facing PredictionService — Sprint 201.
 * Orchestrates engine runs and observability. Does not modify Core/Runtime.
 */

import { horizonLabel, type PredictionHorizon } from "./PredictionHorizon";
import { runPredictionEngine } from "./PredictionEngine";
import { PredictionRegistry } from "./PredictionRegistry";
import type { DecisionConsequenceForecast, PredictionResult } from "./PredictionResult";
import type { PredictionContext, PredictionKind } from "./PredictionTypes";
import { recordPredictionObservation } from "./observability";

export type PredictionServiceRequest = {
  readonly context: PredictionContext;
  readonly kinds?: readonly PredictionKind[];
  readonly horizon?: PredictionHorizon;
  /** When false, skip observability recording (e.g. list enrichment). Default true. */
  readonly observe?: boolean;
};

export type PredictionServiceResponse = {
  readonly predictions: readonly PredictionResult[];
  readonly observationId: string;
  readonly durationMs: number;
  readonly contributorsUsed: readonly string[];
};

let seq = 0;

export const PredictionService = {
  registry: PredictionRegistry,

  /**
   * Run advisory forecasts for an organization context built from contributor outputs.
   */
  forecast(request: PredictionServiceRequest): PredictionServiceResponse {
    const startedAt = new Date().toISOString();
    const run = runPredictionEngine({
      context: request.context,
      kinds: request.kinds,
      horizon: request.horizon,
    });
    const finishedAt = new Date().toISOString();
    const observationId = `pobs-${++seq}-${Date.now()}`;
    const horizonKey =
      request.horizon === undefined
        ? "per-kind-default"
        : typeof request.horizon === "string"
          ? request.horizon
          : `custom:${request.horizon.days}`;

    if (request.observe !== false) {
      recordPredictionObservation({
        id: observationId,
        organizationId: request.context.organizationId,
        kinds: (request.kinds ?? PredictionRegistry.listKinds()) as string[],
        horizon: horizonKey,
        startedAt,
        finishedAt,
        durationMs: run.durationMs,
        contributorsUsed: run.contributorsUsed,
        inputSummary: {
          signalCount: request.context.signals.length,
          openDecisions: request.context.openDecisionCount,
          overdueDecisions: request.context.overdueDecisionCount,
        },
        confidenceSummary: run.confidenceByKind,
        predictionIds: run.results.map((r) => r.id),
        insufficientCount: run.results.filter((r) => r.insufficientData).length,
      });
    }

    return {
      predictions: run.results,
      observationId: request.observe === false ? "" : observationId,
      durationMs: run.durationMs,
      contributorsUsed: run.contributorsUsed,
    };
  },

  /**
   * Predicted consequence if a decision remains open — advisory only.
   */
  consequenceIfNoAction(options: {
    readonly context: PredictionContext;
    readonly decisionId: string;
    readonly decisionTitle: string;
    readonly horizon?: PredictionHorizon;
    readonly relatedKind?: PredictionKind;
    readonly observe?: boolean;
  }): DecisionConsequenceForecast {
    const horizon = options.horizon ?? "30_days";
    const kind = options.relatedKind ?? "operational_readiness";
    const { predictions } = this.forecast({
      context: options.context,
      kinds: [kind],
      horizon,
      observe: options.observe,
    });
    const pred = predictions[0]!;
    const hLabel = horizonLabel(horizon);
    const declining =
      pred.trend === "declining" ||
      pred.predictedState.stance === "at_risk" ||
      pred.predictedState.stance === "critical";

    const statement = declining
      ? `If this decision remains open for another ${hLabel.toLowerCase()}, ${pred.title.toLowerCase()} is projected to decline.`
      : `If this decision remains open for another ${hLabel.toLowerCase()}, ${pred.title.toLowerCase()} is projected to stay near its current advisory stance (${pred.predictedState.stance.replace("_", " ")}).`;

    return {
      decisionId: options.decisionId,
      decisionTitle: options.decisionTitle,
      horizon,
      horizonLabel: hLabel,
      relatedPredictionKind: kind,
      statement,
      confidence: pred.confidence,
      riskLevel: pred.riskLevel,
      primaryDrivers: pred.primaryDrivers.map((d) => d.label),
      assumptions: pred.assumptions.map((a) => a.statement),
      advisoryNotice: pred.advisoryNotice,
    };
  },
} as const;
