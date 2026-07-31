/**
 * Learning Intelligence events → Digital Twin, Evidence Ledger, Organizational Memory.
 * Complements AcademyOS `emitLearningEvent` (platform bus) with OIOS sinks.
 */

import { randomUUID } from "node:crypto";

export type LearningIntelEventType =
  | "learning.mastery_updated"
  | "learning.assessment_recorded"
  | "learning.intervention_changed"
  | "learning.curriculum_published"
  | "learning.progress_snapshot"
  | "learning.evidence_linked";

export type LearningIntelEvent = {
  readonly id: string;
  readonly type: LearningIntelEventType;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly actorUserId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

type Ops = {
  events: LearningIntelEvent[];
  twin: {
    id: string;
    organizationId: string;
    eventId: string;
    entityHint: string;
    projectedAt: string;
  }[];
  evidence: {
    id: string;
    organizationId: string;
    eventId: string;
    kind: "learning_intelligence";
    summary: string;
    recordedAt: string;
  }[];
  memory: {
    id: string;
    organizationId: string;
    eventId: string;
    title: string;
    rememberedAt: string;
  }[];
};

const g = globalThis as typeof globalThis & { __jagLearningIntelOps?: Ops };

function store(): Ops {
  if (!g.__jagLearningIntelOps) {
    g.__jagLearningIntelOps = {
      events: [],
      twin: [],
      evidence: [],
      memory: [],
    };
  }
  return g.__jagLearningIntelOps;
}

export function resetLearningIntelOpsStoreForTests(): void {
  g.__jagLearningIntelOps = {
    events: [],
    twin: [],
    evidence: [],
    memory: [],
  };
}

export function publishLearningIntelEvent(input: {
  type: LearningIntelEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
}): LearningIntelEvent {
  const event: LearningIntelEvent = {
    id: `lievt:${randomUUID()}`,
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
    id: `litwin:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    entityHint: `${input.recordType}:${input.recordId}`,
    projectedAt: event.occurredAt,
  });
  s.evidence.unshift({
    id: `lievid:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    kind: "learning_intelligence",
    summary: `${input.type} on ${input.recordType} ${input.recordId}`,
    recordedAt: event.occurredAt,
  });
  s.memory.unshift({
    id: `limem:${randomUUID()}`,
    organizationId: input.organizationId,
    eventId: event.id,
    title: input.type,
    rememberedAt: event.occurredAt,
  });
  return event;
}

export function listLearningIntelEvents(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .events.filter((e) => e.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function listLearningIntelTwin(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .twin.filter((t) => t.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function listLearningIntelEvidence(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .evidence.filter((e) => e.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function listLearningIntelMemory(organizationId: string, limit = 100) {
  return Object.freeze(
    store()
      .memory.filter((m) => m.organizationId === organizationId)
      .slice(0, limit)
  );
}

export const LEARNING_INTELLIGENCE_SINKS = Object.freeze({
  digitalTwin: true,
  evidenceLedger: true,
  organizationalMemory: true,
  academyOsLearningBus: true,
});
