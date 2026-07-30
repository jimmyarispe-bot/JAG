/**
 * CapabilityLifecycle — Sprint 207.
 */

export const CAPABILITY_LIFECYCLE_STATES = [
  "registered",
  "initializing",
  "ready",
  "degraded",
  "disabled",
  "failed",
] as const;

export type CapabilityLifecycleState =
  (typeof CAPABILITY_LIFECYCLE_STATES)[number];

export type CapabilityLifecycle = {
  readonly state: CapabilityLifecycleState;
  readonly registeredAt: string;
  readonly initializedAt?: string;
  readonly lastTransitionAt: string;
  readonly message?: string;
};
