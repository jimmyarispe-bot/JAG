/**
 * School Leader Workspace → Digital Twin, Evidence Ledger, Organizational Memory.
 */

import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "@academyos";
import { createKnowledgeEngine } from "@knowledge";
import { createMemoryService } from "@/lib/memory";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type SchoolLeaderExperienceEventType =
  | "school_leader.dashboard_viewed"
  | "school_leader.enrollment_reviewed"
  | "school_leader.students_reviewed"
  | "school_leader.teachers_reviewed"
  | "school_leader.academics_reviewed"
  | "school_leader.scheduling_reviewed"
  | "school_leader.compliance_reviewed"
  | "school_leader.finance_reviewed"
  | "school_leader.hr_reviewed"
  | "school_leader.communications_viewed"
  | "school_leader.report_exported"
  | "school_leader.profile_updated";

export type SchoolLeaderExperienceEvent = {
  readonly id: string;
  readonly type: SchoolLeaderExperienceEventType;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly actorUserId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

type Ops = {
  events: SchoolLeaderExperienceEvent[];
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
    kind: "school_leader_experience";
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

const g = globalThis as typeof globalThis & { __jagSchoolLeaderExperienceOps?: Ops };

function store(): Ops {
  if (!g.__jagSchoolLeaderExperienceOps) {
    g.__jagSchoolLeaderExperienceOps = {
      events: [],
      twin: [],
      evidence: [],
      memory: [],
    };
  }
  return g.__jagSchoolLeaderExperienceOps;
}

export function resetSchoolLeaderExperienceOpsForTests(): void {
  g.__jagSchoolLeaderExperienceOps = {
    events: [],
    twin: [],
    evidence: [],
    memory: [],
  };
}

export function listSchoolLeaderExperienceEvents(organizationId?: string) {
  const events = store().events;
  if (!organizationId) return events;
  return events.filter((e) => e.organizationId === organizationId);
}

export function listSchoolLeaderExperienceTwin(organizationId: string) {
  return store().twin.filter((t) => t.organizationId === organizationId);
}

export function listSchoolLeaderExperienceEvidence(organizationId: string) {
  return store().evidence.filter((e) => e.organizationId === organizationId);
}

export function listSchoolLeaderExperienceMemory(organizationId: string) {
  return store().memory.filter((m) => m.organizationId === organizationId);
}

export function publishSchoolLeaderExperienceEvent(input: {
  type: SchoolLeaderExperienceEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
  projectLive?: boolean;
}): SchoolLeaderExperienceEvent {
  const event: SchoolLeaderExperienceEvent = {
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
    kind: "school_leader_experience",
    summary,
    recordedAt: event.occurredAt,
  });

  const title = input.type.replace(/^school_leader\./, "School leader: ").replace(/_/g, " ");
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
    actor: input.actorUserId ?? "school-leader-experience",
    metadata: Object.fromEntries(
      Object.entries(input.payload ?? {}).map(([k, v]) => [k, String(v)])
    ),
  });

  if (input.projectLive !== false && input.organizationId) {
    try {
      projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "school_leader_experience_event",
        twinEntityType: "Event",
        id: event.id,
        label: title,
        description: summary,
        kind: input.type,
        actor: input.actorUserId ?? "school-leader-experience",
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
        createdBy: input.actorUserId ?? "school-leader-experience",
      });
    } catch {
      /* optional */
    }
    try {
      createKnowledgeEngine().recordEvidenceFact({
        organizationId: input.organizationId,
        userId: input.actorUserId ?? "school-leader-experience",
        documentId: `school-leader-event:${event.id}`,
        versionId: `school-leader-event:${event.id}:v1`,
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
