/**
 * Organizational memory observability — Sprint 204.
 */

export type MemoryObservationKind =
  | "memory_created"
  | "pattern_detection"
  | "similarity_search"
  | "memory_retrieval";

export type MemoryObservation = {
  readonly id: string;
  readonly kind: MemoryObservationKind;
  readonly organizationId: string | null;
  readonly at: string;
  readonly durationMs: number;
  readonly detail: string;
  readonly memoryIds: readonly string[];
  readonly metadata?: Readonly<Record<string, string>>;
};

const MAX = 300;
const observations: MemoryObservation[] = [];

export function recordMemoryObservation(obs: MemoryObservation): void {
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
}

export function listMemoryObservations(limit = 50): readonly MemoryObservation[] {
  return observations.slice(0, limit);
}

export function clearMemoryObservationsForTests(): void {
  observations.length = 0;
}
