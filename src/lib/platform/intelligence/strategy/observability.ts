/**
 * Strategic intelligence observability — Sprint 205.
 */

export type StrategyObservationKind =
  | "goal_evaluation"
  | "alignment_calculation"
  | "scorecard_generation"
  | "mission_update";

export type StrategyObservation = {
  readonly id: string;
  readonly kind: StrategyObservationKind;
  readonly organizationId: string | null;
  readonly at: string;
  readonly durationMs: number;
  readonly detail: string;
  readonly entityIds: readonly string[];
  readonly metadata?: Readonly<Record<string, string>>;
};

const MAX = 300;
const observations: StrategyObservation[] = [];

export function recordStrategyObservation(obs: StrategyObservation): void {
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
}

export function listStrategyObservations(
  limit = 50
): readonly StrategyObservation[] {
  return observations.slice(0, limit);
}

export function clearStrategyObservationsForTests(): void {
  observations.length = 0;
}
