/**
 * Production readiness observability — Sprint 209.
 * Records validation runs for the Observability surface.
 */

export type ReadinessObservationKind =
  | "workflow_validation"
  | "capability_validation"
  | "full_validation";

export type ReadinessObservation = {
  readonly id: string;
  readonly kind: ReadinessObservationKind;
  readonly at: string;
  readonly durationMs: number;
  readonly ok: boolean;
  readonly passCount: number;
  readonly failCount: number;
  readonly detail: string;
};

const MAX = 200;
const observations: ReadinessObservation[] = [];
let seq = 0;

export function recordReadinessObservation(
  input: Omit<ReadinessObservation, "id" | "at"> & { at?: string }
): ReadinessObservation {
  const obs: ReadinessObservation = {
    id: `readyobs-${++seq}-${Date.now()}`,
    at: input.at ?? new Date().toISOString(),
    kind: input.kind,
    durationMs: input.durationMs,
    ok: input.ok,
    passCount: input.passCount,
    failCount: input.failCount,
    detail: input.detail,
  };
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
  return obs;
}

export function listReadinessObservations(
  limit = 50
): readonly ReadinessObservation[] {
  return observations.slice(0, limit);
}

export function clearReadinessObservationsForTests(): void {
  observations.length = 0;
  seq = 0;
}
