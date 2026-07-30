/**
 * Sprint 211 — Branding observability (in-memory).
 */

import type { BrandObservation, BrandObservationKind } from "./types";

const MAX = 200;
const observations: BrandObservation[] = [];
let seq = 0;

export function recordBrandObservation(input: {
  kind: BrandObservationKind;
  organizationId: string;
  detail: string;
  at?: string;
}): BrandObservation {
  const obs: BrandObservation = {
    id: `brand-${++seq}-${Date.now()}`,
    at: input.at ?? new Date().toISOString(),
    kind: input.kind,
    organizationId: input.organizationId,
    detail: input.detail,
  };
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
  return obs;
}

export function listBrandObservations(
  limit = 50
): readonly BrandObservation[] {
  return observations.slice(0, limit);
}

export function clearBrandObservationsForTests(): void {
  observations.length = 0;
  seq = 0;
}
