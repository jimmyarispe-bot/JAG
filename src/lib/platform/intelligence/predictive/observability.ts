/**
 * Prediction execution observability — Sprint 201.
 * Records execution, inputs, contributors, confidence calc, duration.
 */

export type PredictionObservation = {
  readonly id: string;
  readonly organizationId: string;
  readonly kinds: readonly string[];
  readonly horizon: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly contributorsUsed: readonly string[];
  readonly inputSummary: {
    readonly signalCount: number;
    readonly openDecisions: number;
    readonly overdueDecisions: number;
  };
  readonly confidenceSummary: Readonly<
    Record<string, { confidence: number; band: string; factors: Record<string, number> }>
  >;
  readonly predictionIds: readonly string[];
  readonly insufficientCount: number;
};

const MAX = 200;
const observations: PredictionObservation[] = [];

export function recordPredictionObservation(obs: PredictionObservation): void {
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
}

export function listPredictionObservations(limit = 50): readonly PredictionObservation[] {
  return observations.slice(0, limit);
}

export function clearPredictionObservationsForTests(): void {
  observations.length = 0;
}
