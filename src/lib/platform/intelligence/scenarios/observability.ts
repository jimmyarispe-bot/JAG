/**
 * Scenario execution observability — Sprint 202.
 */

export type ScenarioObservation = {
  readonly id: string;
  readonly organizationId: string;
  readonly kinds: readonly string[];
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly inputSummary: Readonly<Record<string, string>>;
  readonly confidenceByScenario: Readonly<
    Record<string, { confidence: number; band: string }>
  >;
  readonly comparisonId: string | null;
  readonly scenarioIds: readonly string[];
  readonly mode: "single" | "compare" | "decision_what_if";
};

const MAX = 200;
const observations: ScenarioObservation[] = [];

export function recordScenarioObservation(obs: ScenarioObservation): void {
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
}

export function listScenarioObservations(limit = 50): readonly ScenarioObservation[] {
  return observations.slice(0, limit);
}

export function clearScenarioObservationsForTests(): void {
  observations.length = 0;
}
