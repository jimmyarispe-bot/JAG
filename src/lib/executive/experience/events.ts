/**
 * Executive Workspace → Digital Twin, Evidence Ledger, Organizational Memory.
 */

import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "@academyos";
import { createKnowledgeEngine } from "@knowledge";
import { createMemoryService } from "@/lib/memory";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type ExecutiveExperienceEventType =
  | "executive.dashboard_viewed"
  | "executive.multi_school_reviewed"
  | "executive.academics_reviewed"
  | "executive.operations_reviewed"
  | "executive.finance_reviewed"
  | "executive.people_reviewed"
  | "executive.strategy_reviewed"
  | "executive.innovation_reviewed"
  | "executive.intelligence_reviewed"
  | "executive.report_exported"
  | "executive.communications_viewed"
  | "executive.profile_updated";

export type ExecutiveExperienceEvent = {
  readonly id: string;
  readonly type: ExecutiveExperienceEventType;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly actorUserId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

type Ops = {
  events: ExecutiveExperienceEvent[];
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
    kind: "executive_experience";
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

const g = globalThis as typeof globalThis & { __jagExecutiveExperienceOps?: Ops };

function store(): Ops {
  if (!g.__jagExecutiveExperienceOps) {
    g.__jagExecutiveExperienceOps = {
      events: [],
      twin: [],
      evidence: [],
      memory: [],
    };
  }
  return g.__jagExecutiveExperienceOps;
}

export function resetExecutiveExperienceOpsForTests(): void {
  g.__jagExecutiveExperienceOps = {
    events: [],
    twin: [],
    evidence: [],
    memory: [],
  };
}

export function listExecutiveExperienceEvents(organizationId?: string) {
  const events = store().events;
  if (!organizationId) return events;
  return events.filter((e) => e.organizationId === organizationId);
}

export function listExecutiveExperienceTwin(organizationId: string) {
  return store().twin.filter((t) => t.organizationId === organizationId);
}

export function listExecutiveExperienceEvidence(organizationId: string) {
  return store().evidence.filter((e) => e.organizationId === organizationId);
}

export function listExecutiveExperienceMemory(organizationId: string) {
  return store().memory.filter((m) => m.organizationId === organizationId);
}

export function publishExecutiveExperienceEvent(input: {
  type: ExecutiveExperienceEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
  projectLive?: boolean;
}): ExecutiveExperienceEvent {
  const event: ExecutiveExperienceEvent = {
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
    kind: "executive_experience",
    summary,
    recordedAt: event.occurredAt,
  });

  const title = input.type.replace(/^executive\./, "Executive: ").replace(/_/g, " ");
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
    actor: input.actorUserId ?? "executive-experience",
    metadata: Object.fromEntries(
      Object.entries(input.payload ?? {}).map(([k, v]) => [k, String(v)])
    ),
  });

  if (input.projectLive !== false && input.organizationId) {
    try {
      projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "executive_experience_event",
        twinEntityType: "Event",
        id: event.id,
        label: title,
        description: summary,
        kind: input.type,
        actor: input.actorUserId ?? "executive-experience",
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
        createdBy: input.actorUserId ?? "executive-experience",
      });
    } catch {
      /* optional */
    }
    try {
      createKnowledgeEngine().recordEvidenceFact({
        organizationId: input.organizationId,
        userId: input.actorUserId ?? "executive-experience",
        documentId: `executive-event:${event.id}`,
        versionId: `executive-event:${event.id}:v1`,
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
