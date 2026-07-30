/**
 * GA certification observability — Sprint 210.
 * In-memory record of certification runs for the readiness surface.
 */

export type CertificationObservationKind = "full_certification";

export type CertificationObservation = {
  readonly id: string;
  readonly kind: CertificationObservationKind;
  readonly at: string;
  readonly durationMs: number;
  readonly ok: boolean;
  readonly overallScore: number;
  readonly recommendation: string;
  readonly findingCount: number;
  readonly blockerCount: number;
  readonly detail: string;
};

const MAX = 200;
const observations: CertificationObservation[] = [];
let seq = 0;

export function recordCertificationObservation(
  input: Omit<CertificationObservation, "id" | "at"> & { at?: string }
): CertificationObservation {
  const obs: CertificationObservation = {
    id: `gacert-${++seq}-${Date.now()}`,
    at: input.at ?? new Date().toISOString(),
    kind: input.kind,
    durationMs: input.durationMs,
    ok: input.ok,
    overallScore: input.overallScore,
    recommendation: input.recommendation,
    findingCount: input.findingCount,
    blockerCount: input.blockerCount,
    detail: input.detail,
  };
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
  return obs;
}

export function listCertificationObservations(
  limit = 50
): readonly CertificationObservation[] {
  return observations.slice(0, limit);
}

export function clearCertificationObservationsForTests(): void {
  observations.length = 0;
  seq = 0;
}
