/**
 * ExplainabilityObservability — Sprint 208.
 */

export type ExplainObservationKind =
  | "explanation_generation"
  | "graph_query"
  | "reasoning_traversal"
  | "evidence_lookup"
  | "dependency_resolution";

export type ExplainObservation = {
  readonly id: string;
  readonly kind: ExplainObservationKind;
  readonly organizationId: string | null;
  readonly at: string;
  readonly durationMs: number;
  readonly detail: string;
  readonly subjectId?: string;
  readonly metadata?: Readonly<Record<string, string>>;
};

const MAX = 300;
const observations: ExplainObservation[] = [];
let seq = 0;

export function recordExplainObservation(
  input: Omit<ExplainObservation, "id" | "at"> & { at?: string }
): ExplainObservation {
  const obs: ExplainObservation = {
    id: `exobs-${++seq}-${Date.now()}`,
    at: input.at ?? new Date().toISOString(),
    kind: input.kind,
    organizationId: input.organizationId,
    durationMs: input.durationMs,
    detail: input.detail,
    subjectId: input.subjectId,
    metadata: input.metadata,
  };
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
  return obs;
}

export function listExplainObservations(limit = 50): readonly ExplainObservation[] {
  return observations.slice(0, limit);
}

export function clearExplainObservationsForTests(): void {
  observations.length = 0;
  seq = 0;
}
