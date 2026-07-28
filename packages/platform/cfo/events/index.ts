/**
 * CFO events → Digital Twin, Evidence Ledger, Organizational Memory.
 */

import { randomUUID } from "node:crypto";

export type CfoEventType =
  | "cfo.insight_generated"
  | "cfo.recommendation_issued"
  | "cfo.valuation_computed"
  | "cfo.scenario_analyzed"
  | "cfo.board_report_built"
  | "cfo.ebitda_computed"
  | "cfo.runway_computed"
  | "cfo.qoe_computed"
  | "cfo.analysis_completed"
  | "cfo.assistant_answered"
  | "cfo.adjustment_recorded";

export type CfoEvent = {
  readonly id: string;
  readonly type: CfoEventType;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly actorUserId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

type Twin = {
  readonly id: string;
  readonly organizationId: string;
  readonly eventId: string;
  readonly entityHint: string;
  readonly projectedAt: string;
};
type Evidence = {
  readonly id: string;
  readonly organizationId: string;
  readonly eventId: string;
  readonly kind: "cfo_intelligence";
  readonly summary: string;
  readonly recordedAt: string;
};
type Memory = {
  readonly id: string;
  readonly organizationId: string;
  readonly eventId: string;
  readonly title: string;
  readonly rememberedAt: string;
};

type CfoOpsStore = {
  events: CfoEvent[];
  twin: Twin[];
  evidence: Evidence[];
  memory: Memory[];
};

const g = globalThis as typeof globalThis & { __jagCfoOpsStore?: CfoOpsStore };

function store(): CfoOpsStore {
  if (!g.__jagCfoOpsStore) {
    g.__jagCfoOpsStore = { events: [], twin: [], evidence: [], memory: [] };
  }
  return g.__jagCfoOpsStore;
}

export function resetCfoOpsStoreForTests(): void {
  g.__jagCfoOpsStore = { events: [], twin: [], evidence: [], memory: [] };
}

export function publishCfoEvent(input: {
  type: CfoEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
}): CfoEvent {
  const event: CfoEvent = {
    id: `cfoevt:${randomUUID()}`,
    type: input.type,
    organizationId: input.organizationId,
    recordType: input.recordType,
    recordId: input.recordId,
    actorUserId: input.actorUserId ?? null,
    occurredAt: new Date().toISOString(),
    payload: Object.freeze({ ...(input.payload ?? {}) }),
  };
  const s = store();
  s.events.unshift(event);
  if (s.events.length > 5000) s.events.length = 5000;
  s.twin.unshift({
    id: `cfotwin:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    entityHint: `${input.recordType}:${input.recordId}`,
    projectedAt: event.occurredAt,
  });
  if (s.twin.length > 5000) s.twin.length = 5000;
  s.evidence.unshift({
    id: `cfoevid:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    kind: "cfo_intelligence",
    summary: `${input.type} on ${input.recordType} ${input.recordId}`,
    recordedAt: event.occurredAt,
  });
  if (s.evidence.length > 5000) s.evidence.length = 5000;
  s.memory.unshift({
    id: `cfomem:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    title: input.type,
    rememberedAt: event.occurredAt,
  });
  if (s.memory.length > 5000) s.memory.length = 5000;
  return event;
}

export function listCfoEvents(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .events.filter((e) => e.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function listCfoTwin(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .twin.filter((t) => t.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function listCfoEvidence(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .evidence.filter((e) => e.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function listCfoMemory(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .memory.filter((m) => m.organizationId === organizationId)
      .slice(0, limit)
  );
}

export const CFO_SINKS = Object.freeze({
  digitalTwin: true,
  evidenceLedger: true,
  organizationalMemory: true,
});
