/**
 * CapabilityHealth — Sprint 207.
 */

export const CAPABILITY_HEALTH_STATUSES = [
  "healthy",
  "warning",
  "unavailable",
  "initializing",
] as const;

export type CapabilityHealthStatus = (typeof CAPABILITY_HEALTH_STATUSES)[number];

export type CapabilityHealth = {
  readonly status: CapabilityHealthStatus;
  readonly checkedAt: string;
  readonly summary: string;
  readonly details?: readonly string[];
};

export type CapabilityHealthProvider = {
  readonly check: () => CapabilityHealth;
};
