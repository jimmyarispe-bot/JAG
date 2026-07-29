/** Opaque branded string helpers for Runtime correlation. */

export type RuntimeId = string;
export type CorrelationId = string;
export type SessionId = string;
export type EventId = string;

export function createRuntimeId(prefix = "rt"): RuntimeId {
  return `${prefix}_${randomId()}`;
}

export function createCorrelationId(): CorrelationId {
  return `corr_${randomId()}`;
}

export function createEventId(): EventId {
  return `evt_${randomId()}`;
}

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
