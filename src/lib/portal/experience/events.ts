/**
 * Parent Experience → Digital Twin, Evidence Ledger, Organizational Memory.
 */

import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "@academyos";
import { createKnowledgeEngine } from "@knowledge";
import { createMemoryService } from "@/lib/memory";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type ParentExperienceEventType =
  | "parent.dashboard_viewed"
  | "parent.message_sent"
  | "parent.form_signed"
  | "parent.document_viewed"
  | "parent.payment_initiated"
  | "parent.attendance_excuse_requested"
  | "parent.support_ticket_opened"
  | "parent.profile_updated"
  | "parent.learning_summary_viewed"
  | "parent.contract_acknowledged";

export type ParentExperienceEvent = {
  readonly id: string;
  readonly type: ParentExperienceEventType;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly actorUserId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

type Ops = {
  events: ParentExperienceEvent[];
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
    kind: "parent_experience";
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

const g = globalThis as typeof globalThis & { __jagParentExperienceOps?: Ops };

function store(): Ops {
  if (!g.__jagParentExperienceOps) {
    g.__jagParentExperienceOps = {
      events: [],
      twin: [],
      evidence: [],
      memory: [],
    };
  }
  return g.__jagParentExperienceOps;
}

export function resetParentExperienceOpsForTests(): void {
  g.__jagParentExperienceOps = {
    events: [],
    twin: [],
    evidence: [],
    memory: [],
  };
}

export function listParentExperienceEvents(organizationId?: string) {
  const events = store().events;
  if (!organizationId) return events;
  return events.filter((e) => e.organizationId === organizationId);
}

export function listParentExperienceTwin(organizationId: string) {
  return store().twin.filter((t) => t.organizationId === organizationId);
}

export function listParentExperienceEvidence(organizationId: string) {
  return store().evidence.filter((e) => e.organizationId === organizationId);
}

export function listParentExperienceMemory(organizationId: string) {
  return store().memory.filter((m) => m.organizationId === organizationId);
}

export function publishParentExperienceEvent(input: {
  type: ParentExperienceEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
  projectLive?: boolean;
}): ParentExperienceEvent {
  const event: ParentExperienceEvent = {
    id: randomUUID(),
    type: input.type,
    organizationId: input.organizationId,
    recordType: input.recordType,
    recordId: input.recordId,
    actorUserId: input.actorUserId ?? null,
    occurredAt: new Date().toISOString(),
    payload: input.payload ?? {},
  };

  const s = store();
  s.events.unshift(event);
  if (s.events.length > 5000) s.events.length = 5000;

  s.twin.unshift({
    id: randomUUID(),
    organizationId: input.organizationId,
    eventId: event.id,
    entityHint: `${input.recordType}:${input.recordId}`,
    projectedAt: event.occurredAt,
  });

  const summary = `${input.type} on ${input.recordType} ${input.recordId}`;
  s.evidence.unshift({
    id: randomUUID(),
    organizationId: input.organizationId,
    eventId: event.id,
    kind: "parent_experience",
    summary,
    recordedAt: event.occurredAt,
  });

  const title = input.type.replace(/^parent\./, "Parent: ").replace(/_/g, " ");
  s.memory.unshift({
    id: randomUUID(),
    organizationId: input.organizationId,
    eventId: event.id,
    title,
    rememberedAt: event.occurredAt,
  });

  emitJagPlatformEvent({
    organizationId: input.organizationId,
    sourceModule: "platform",
    entityType: input.recordType,
    entityId: input.recordId,
    eventType: input.type,
    actor: input.actorUserId ?? "parent-experience",
    metadata: Object.fromEntries(
      Object.entries(input.payload ?? {}).map(([k, v]) => [k, String(v)])
    ),
  });

  if (input.projectLive !== false && input.organizationId) {
    try {
      projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "parent_experience_event",
        twinEntityType: "Event",
        id: event.id,
        label: title,
        description: summary,
        kind: input.type,
        actor: input.actorUserId ?? "parent-experience",
        metadata: {
          recordType: input.recordType,
          recordId: input.recordId,
        },
      });
    } catch {
      /* optional */
    }

    try {
      createMemoryService().create({
        organizationId: input.organizationId,
        title,
        summary,
        source: "Evidence",
        category: "Operational",
        confidence: "system",
        status: "Draft",
        createdBy: input.actorUserId ?? "parent-experience",
      });
    } catch {
      /* optional */
    }

    try {
      createKnowledgeEngine().recordEvidenceFact({
        organizationId: input.organizationId,
        userId: input.actorUserId ?? "parent-experience",
        documentId: `parent-event:${event.id}`,
        versionId: `parent-event:${event.id}:v1`,
        location: input.type,
        statement: summary,
        confidence: 0.9,
        method: "manual",
      });
    } catch {
      /* optional */
    }
  }

  return event;
}
