/**
 * Teacher Workspace → Digital Twin, Evidence Ledger, Organizational Memory.
 */

import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "@academyos";
import { createKnowledgeEngine } from "@knowledge";
import { createMemoryService } from "@/lib/memory";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type TeacherExperienceEventType =
  | "teacher.dashboard_viewed"
  | "teacher.attendance_taken"
  | "teacher.session_completed"
  | "teacher.progress_reviewed"
  | "teacher.assistant_consulted"
  | "teacher.parent_message"
  | "teacher.lesson_planned"
  | "teacher.timesheet_submitted"
  | "teacher.document_viewed"
  | "teacher.profile_updated";

export type TeacherExperienceEvent = {
  readonly id: string;
  readonly type: TeacherExperienceEventType;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly actorUserId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

type Ops = {
  events: TeacherExperienceEvent[];
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
    kind: "teacher_experience";
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

const g = globalThis as typeof globalThis & { __jagTeacherExperienceOps?: Ops };

function store(): Ops {
  if (!g.__jagTeacherExperienceOps) {
    g.__jagTeacherExperienceOps = {
      events: [],
      twin: [],
      evidence: [],
      memory: [],
    };
  }
  return g.__jagTeacherExperienceOps;
}

export function resetTeacherExperienceOpsForTests(): void {
  g.__jagTeacherExperienceOps = {
    events: [],
    twin: [],
    evidence: [],
    memory: [],
  };
}

export function listTeacherExperienceEvents(organizationId?: string) {
  const events = store().events;
  if (!organizationId) return events;
  return events.filter((e) => e.organizationId === organizationId);
}

export function listTeacherExperienceTwin(organizationId: string) {
  return store().twin.filter((t) => t.organizationId === organizationId);
}

export function listTeacherExperienceEvidence(organizationId: string) {
  return store().evidence.filter((e) => e.organizationId === organizationId);
}

export function listTeacherExperienceMemory(organizationId: string) {
  return store().memory.filter((m) => m.organizationId === organizationId);
}

export function publishTeacherExperienceEvent(input: {
  type: TeacherExperienceEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
  projectLive?: boolean;
}): TeacherExperienceEvent {
  const event: TeacherExperienceEvent = {
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
    kind: "teacher_experience",
    summary,
    recordedAt: event.occurredAt,
  });

  const title = input.type.replace(/^teacher\./, "Teacher: ").replace(/_/g, " ");
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
    actor: input.actorUserId ?? "teacher-experience",
    metadata: Object.fromEntries(
      Object.entries(input.payload ?? {}).map(([k, v]) => [k, String(v)])
    ),
  });

  if (input.projectLive !== false && input.organizationId) {
    try {
      projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "teacher_experience_event",
        twinEntityType: "Event",
        id: event.id,
        label: title,
        description: summary,
        kind: input.type,
        actor: input.actorUserId ?? "teacher-experience",
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
        createdBy: input.actorUserId ?? "teacher-experience",
      });
    } catch {
      /* optional */
    }
    try {
      createKnowledgeEngine().recordEvidenceFact({
        organizationId: input.organizationId,
        userId: input.actorUserId ?? "teacher-experience",
        documentId: `teacher-event:${event.id}`,
        versionId: `teacher-event:${event.id}:v1`,
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
