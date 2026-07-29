/**
 * Unified event model for The JAG™ portal modules.
 */

import { randomUUID } from "node:crypto";

export type JagEventSourceModule =
  | "identity"
  | "organizations"
  | "provisioning"
  | "evidence"
  | "evidence-catalog"
  | "evidence-pipeline"
  | "connectors"
  | "quickbooks"
  | "knowledge-graph"
  | "executive-intelligence"
  | "decisions"
  | "digital-twin"
  | "connector-orchestrator"
  | "goals"
  | "risk"
  | "work"
  | "memory"
  | "platform";

export type JagPlatformEvent = {
  readonly eventId: string;
  readonly organizationId: string;
  readonly sourceModule: JagEventSourceModule;
  readonly entityType: string;
  readonly entityId: string;
  readonly eventType: string;
  readonly actor: string;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly metadata: Readonly<Record<string, string>>;
};

type EventStore = {
  events: JagPlatformEvent[];
};

const g = globalThis as typeof globalThis & {
  __jagPlatformEventStore?: EventStore;
};

function store(): EventStore {
  if (!g.__jagPlatformEventStore) {
    g.__jagPlatformEventStore = { events: [] };
  }
  return g.__jagPlatformEventStore;
}

export function resetJagPlatformEventsForTests(): void {
  g.__jagPlatformEventStore = { events: [] };
}

export function emitJagPlatformEvent(input: {
  organizationId: string;
  sourceModule: JagEventSourceModule;
  entityType: string;
  entityId: string;
  eventType: string;
  actor: string;
  correlationId?: string;
  metadata?: Record<string, string>;
  timestamp?: string;
}): JagPlatformEvent {
  const event: JagPlatformEvent = {
    eventId: randomUUID(),
    organizationId: input.organizationId,
    sourceModule: input.sourceModule,
    entityType: input.entityType,
    entityId: input.entityId,
    eventType: input.eventType,
    actor: input.actor,
    timestamp: input.timestamp ?? new Date().toISOString(),
    correlationId: input.correlationId ?? randomUUID(),
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
  };
  store().events.push(event);
  if (store().events.length > 2000) {
    g.__jagPlatformEventStore = { events: store().events.slice(-1500) };
  }
  return event;
}

export function listJagPlatformEvents(input?: {
  organizationId?: string;
  sourceModule?: JagEventSourceModule;
  limit?: number;
}): readonly JagPlatformEvent[] {
  let rows = store().events;
  if (input?.organizationId) {
    rows = rows.filter((e) => e.organizationId === input.organizationId);
  }
  if (input?.sourceModule) {
    rows = rows.filter((e) => e.sourceModule === input.sourceModule);
  }
  const limit = input?.limit ?? 100;
  return Object.freeze(rows.slice(-limit).reverse());
}

export function eventThroughputLastHour(): number {
  const since = Date.now() - 60 * 60 * 1000;
  return store().events.filter((e) => Date.parse(e.timestamp) >= since).length;
}
