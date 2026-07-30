/**
 * Capability SDK observability — Sprint 207.
 */

export type CapabilityObservationKind =
  | "capability_registration"
  | "capability_initialization"
  | "health_change"
  | "version_change"
  | "dependency_failure";

export type CapabilityObservation = {
  readonly id: string;
  readonly kind: CapabilityObservationKind;
  readonly capabilityId: string | null;
  readonly at: string;
  readonly detail: string;
  readonly metadata?: Readonly<Record<string, string>>;
};

const MAX = 300;
const observations: CapabilityObservation[] = [];
let seq = 0;

export function recordCapabilityObservation(
  input: Omit<CapabilityObservation, "id" | "at"> & { at?: string }
): CapabilityObservation {
  const obs: CapabilityObservation = {
    id: `capobs-${++seq}-${Date.now()}`,
    at: input.at ?? new Date().toISOString(),
    kind: input.kind,
    capabilityId: input.capabilityId,
    detail: input.detail,
    metadata: input.metadata,
  };
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
  return obs;
}

export function listCapabilityObservations(
  limit = 50
): readonly CapabilityObservation[] {
  return observations.slice(0, limit);
}

export function clearCapabilityObservationsForTests(): void {
  observations.length = 0;
  seq = 0;
}
