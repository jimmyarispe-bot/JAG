/**
 * Student Experience → Digital Twin, Evidence Ledger, Organizational Memory.
 */

import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "@academyos";
import { createKnowledgeEngine } from "@knowledge";
import { createMemoryService } from "@/lib/memory";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type StudentExperienceEventType =
  | "student.dashboard_viewed"
  | "student.learning_viewed"
  | "student.assignment_viewed"
  | "student.assessment_viewed"
  | "student.coach_consulted"
  | "student.document_viewed"
  | "student.goal_viewed"
  | "student.profile_updated"
  | "student.message_sent";

export type StudentExperienceEvent = {
  readonly id: string;
  readonly type: StudentExperienceEventType;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly actorUserId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

type Ops = {
  events: StudentExperienceEvent[];
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
    kind: "student_experience";
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

const g = globalThis as typeof globalThis & { __jagStudentExperienceOps?: Ops };

function store(): Ops {
  if (!g.__jagStudentExperienceOps) {
    g.__jagStudentExperienceOps = {
      events: [],
      twin: [],
      evidence: [],
      memory: [],
    };
  }
  return g.__jagStudentExperienceOps;
}

export function resetStudentExperienceOpsForTests(): void {
  g.__jagStudentExperienceOps = {
    events: [],
    twin: [],
    evidence: [],
    memory: [],
  };
}

export function listStudentExperienceEvents(organizationId?: string) {
  const events = store().events;
  if (!organizationId) return events;
  return events.filter((e) => e.organizationId === organizationId);
}

export function listStudentExperienceTwin(organizationId: string) {
  return store().twin.filter((t) => t.organizationId === organizationId);
}

export function listStudentExperienceEvidence(organizationId: string) {
  return store().evidence.filter((e) => e.organizationId === organizationId);
}

export function listStudentExperienceMemory(organizationId: string) {
  return store().memory.filter((m) => m.organizationId === organizationId);
}

export function publishStudentExperienceEvent(input: {
  type: StudentExperienceEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
  projectLive?: boolean;
}): StudentExperienceEvent {
  const event: StudentExperienceEvent = {
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
    kind: "student_experience",
    summary,
    recordedAt: event.occurredAt,
  });

  const title = input.type.replace(/^student\./, "Student: ").replace(/_/g, " ");
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
    actor: input.actorUserId ?? "student-experience",
    metadata: Object.fromEntries(
      Object.entries(input.payload ?? {}).map(([k, v]) => [k, String(v)])
    ),
  });

  if (input.projectLive !== false && input.organizationId) {
    try {
      projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "student_experience_event",
        twinEntityType: "Event",
        id: event.id,
        label: title,
        description: summary,
        kind: input.type,
        actor: input.actorUserId ?? "student-experience",
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
        createdBy: input.actorUserId ?? "student-experience",
      });
    } catch {
      /* optional */
    }
    try {
      createKnowledgeEngine().recordEvidenceFact({
        organizationId: input.organizationId,
        userId: input.actorUserId ?? "student-experience",
        documentId: `student-event:${event.id}`,
        versionId: `student-event:${event.id}:v1`,
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
