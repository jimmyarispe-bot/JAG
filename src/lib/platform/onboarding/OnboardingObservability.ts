/**
 * Sprint 212 — Onboarding observability (in-memory).
 */

import type { OnboardingObservation, OnboardingObservationKind, OnboardingStepId } from "./types";

const MAX = 300;
const observations: OnboardingObservation[] = [];
let seq = 0;

export function recordOnboardingObservation(input: {
  kind: OnboardingObservationKind;
  sessionId: string;
  detail: string;
  stepId?: OnboardingStepId;
  metadata?: Readonly<Record<string, string>>;
  at?: string;
}): OnboardingObservation {
  const obs: OnboardingObservation = {
    id: `onb-${++seq}-${Date.now()}`,
    at: input.at ?? new Date().toISOString(),
    kind: input.kind,
    sessionId: input.sessionId,
    stepId: input.stepId,
    detail: input.detail,
    metadata: input.metadata,
  };
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
  return obs;
}

export function listOnboardingObservations(
  limit = 50,
  sessionId?: string
): readonly OnboardingObservation[] {
  const items = sessionId
    ? observations.filter((o) => o.sessionId === sessionId)
    : observations;
  return items.slice(0, limit);
}

/** Drop-off = last step_entered without matching step_completed / completed. */
export function summarizeDropOffPoints(): Readonly<
  Record<string, number>
> {
  const entered = new Map<string, number>();
  const completed = new Map<string, number>();
  for (const o of observations) {
    if (o.kind === "step_entered" && o.stepId) {
      entered.set(o.stepId, (entered.get(o.stepId) ?? 0) + 1);
    }
    if (o.kind === "step_completed" && o.stepId) {
      completed.set(o.stepId, (completed.get(o.stepId) ?? 0) + 1);
    }
  }
  const drop: Record<string, number> = {};
  for (const [step, count] of entered) {
    const done = completed.get(step) ?? 0;
    if (count > done) drop[step] = count - done;
  }
  return drop;
}

export function clearOnboardingObservationsForTests(): void {
  observations.length = 0;
  seq = 0;
}
