/**
 * Knowledge events → Digital Twin, Evidence Ledger, Organizational Memory.
 */

import { randomUUID } from "node:crypto";

export type KnowledgeEventType =
  | "knowledge.document_uploaded"
  | "knowledge.version_created"
  | "knowledge.classified"
  | "knowledge.ocr_completed"
  | "knowledge.entities_extracted"
  | "knowledge.evidence_recorded"
  | "knowledge.relationship_created"
  | "knowledge.summary_created"
  | "knowledge.workflow_updated"
  | "knowledge.citation_created"
  | "knowledge.graph_updated"
  | "knowledge.indexed"
  | "knowledge.shared"
  | "knowledge.retention_applied"
  | "knowledge.permission_granted";

export type KnowledgeEvent = {
  readonly id: string;
  readonly type: KnowledgeEventType;
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
  readonly kind: "knowledge_intelligence";
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

type Ops = {
  events: KnowledgeEvent[];
  twin: Twin[];
  evidence: Evidence[];
  memory: Memory[];
};

const g = globalThis as typeof globalThis & { __jagKnowledgeOps?: Ops };

function store(): Ops {
  if (!g.__jagKnowledgeOps) {
    g.__jagKnowledgeOps = { events: [], twin: [], evidence: [], memory: [] };
  }
  return g.__jagKnowledgeOps;
}

export function resetKnowledgeOpsStoreForTests(): void {
  g.__jagKnowledgeOps = { events: [], twin: [], evidence: [], memory: [] };
}

export function publishKnowledgeEvent(input: {
  type: KnowledgeEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
}): KnowledgeEvent {
  const event: KnowledgeEvent = {
    id: `kevt:${randomUUID()}`,
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
    id: `ktwin:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    entityHint: `${input.recordType}:${input.recordId}`,
    projectedAt: event.occurredAt,
  });
  if (s.twin.length > 5000) s.twin.length = 5000;
  s.evidence.unshift({
    id: `kevid:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    kind: "knowledge_intelligence",
    summary: `${input.type} on ${input.recordType} ${input.recordId}`,
    recordedAt: event.occurredAt,
  });
  if (s.evidence.length > 5000) s.evidence.length = 5000;
  s.memory.unshift({
    id: `kmem:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    title: input.type,
    rememberedAt: event.occurredAt,
  });
  if (s.memory.length > 5000) s.memory.length = 5000;
  return event;
}

export function listKnowledgeEvents(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .events.filter((e) => e.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function listKnowledgeTwin(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .twin.filter((t) => t.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function listKnowledgeEvidenceLedger(
  organizationId: string,
  limit = 100
) {
  return Object.freeze(
    store()
      .evidence.filter((e) => e.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function listKnowledgeMemory(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .memory.filter((m) => m.organizationId === organizationId)
      .slice(0, limit)
  );
}

export const KNOWLEDGE_SINKS = Object.freeze({
  digitalTwin: true,
  evidenceLedger: true,
  organizationalMemory: true,
});
