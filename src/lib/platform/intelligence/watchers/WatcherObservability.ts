/**
 * WatcherObservability — Sprint 206.
 */

export type WatcherObservationKind =
  | "watcher_execution"
  | "alert_generation"
  | "alert_acknowledged"
  | "alert_dismissed"
  | "alert_resolved"
  | "digest_generated";

export type WatcherObservation = {
  readonly id: string;
  readonly kind: WatcherObservationKind;
  readonly organizationId: string | null;
  readonly at: string;
  readonly durationMs: number;
  readonly detail: string;
  readonly alertIds: readonly string[];
  readonly metadata?: Readonly<Record<string, string>>;
};

const MAX = 300;
const observations: WatcherObservation[] = [];

export function recordWatcherObservation(obs: WatcherObservation): void {
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
}

export function listWatcherObservations(
  limit = 50
): readonly WatcherObservation[] {
  return observations.slice(0, limit);
}

export function clearWatcherObservationsForTests(): void {
  observations.length = 0;
}
