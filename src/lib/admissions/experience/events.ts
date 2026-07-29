/**
 * Admissions Experience → Digital Twin, Evidence Ledger, Organizational Memory.
 * Complements pack `emitAdmissionsEvent` and legacy communications triggers.
 */

import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "@academyos";
import { createKnowledgeEngine } from "@knowledge";
import { createMemoryService } from "@/lib/memory";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type AdmissionsExperienceEventType =
  | "admissions.inquiry_submitted"
  | "admissions.discovery_requested"
  | "admissions.assessment_requested"
  | "admissions.application_draft_saved"
  | "admissions.application_submitted"
  | "admissions.document_uploaded"
  | "admissions.interview_scheduled"
  | "admissions.offer_generated"
  | "admissions.offer_responded"
  | "admissions.contract_signed"
  | "admissions.scholarship_updated"
  | "admissions.tuition_setup"
  | "admissions.parent_onboarding";

export type AdmissionsExperienceEvent = {
  readonly id: string;
  readonly type: AdmissionsExperienceEventType;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly actorUserId: string | null;
  readonly occurredAt: string;
  readonly payload: Readonly<Record<string, unknown>>;
};

type Ops = {
  events: AdmissionsExperienceEvent[];
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
    kind: "admissions_experience";
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

const g = globalThis as typeof globalThis & {
  __jagAdmissionsExperienceOps?: Ops;
};

function store(): Ops {
  if (!g.__jagAdmissionsExperienceOps) {
    g.__jagAdmissionsExperienceOps = {
      events: [],
      twin: [],
      evidence: [],
      memory: [],
    };
  }
  return g.__jagAdmissionsExperienceOps;
}

export function resetAdmissionsExperienceOpsForTests(): void {
  g.__jagAdmissionsExperienceOps = {
    events: [],
    twin: [],
    evidence: [],
    memory: [],
  };
}

export function listAdmissionsExperienceEvents(
  organizationId?: string
): readonly AdmissionsExperienceEvent[] {
  const events = store().events;
  if (!organizationId) return events;
  return events.filter((e) => e.organizationId === organizationId);
}

export function listAdmissionsExperienceTwin(organizationId: string) {
  return store().twin.filter((t) => t.organizationId === organizationId);
}

export function listAdmissionsExperienceEvidence(organizationId: string) {
  return store().evidence.filter((e) => e.organizationId === organizationId);
}

export function listAdmissionsExperienceMemory(organizationId: string) {
  return store().memory.filter((m) => m.organizationId === organizationId);
}

export function publishAdmissionsExperienceEvent(input: {
  type: AdmissionsExperienceEventType;
  organizationId: string;
  recordType: string;
  recordId: string;
  actorUserId?: string | null;
  payload?: Readonly<Record<string, unknown>>;
  /** When false, skip live twin/memory/knowledge side-effects (tests). */
  projectLive?: boolean;
}): AdmissionsExperienceEvent {
  const event: AdmissionsExperienceEvent = {
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

  const twinRow = {
    id: randomUUID(),
    organizationId: input.organizationId,
    eventId: event.id,
    entityHint: `${input.recordType}:${input.recordId}`,
    projectedAt: event.occurredAt,
  };
  s.twin.unshift(twinRow);

  const evidenceRow = {
    id: randomUUID(),
    organizationId: input.organizationId,
    eventId: event.id,
    kind: "admissions_experience" as const,
    summary: `${input.type} on ${input.recordType} ${input.recordId}`,
    recordedAt: event.occurredAt,
  };
  s.evidence.unshift(evidenceRow);

  const memoryRow = {
    id: randomUUID(),
    organizationId: input.organizationId,
    eventId: event.id,
    title: input.type.replace(/^admissions\./, "Admissions: ").replace(/_/g, " "),
    rememberedAt: event.occurredAt,
  };
  s.memory.unshift(memoryRow);

  emitJagPlatformEvent({
    organizationId: input.organizationId,
    sourceModule: "platform",
    entityType: input.recordType,
    entityId: input.recordId,
    eventType: input.type,
    actor: input.actorUserId ?? "admissions-experience",
    metadata: Object.fromEntries(
      Object.entries(input.payload ?? {}).map(([k, v]) => [k, String(v)])
    ),
  });

  if (input.projectLive !== false && input.organizationId) {
    try {
      projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "admissions_experience_event",
        twinEntityType: "Event",
        id: event.id,
        label: memoryRow.title,
        description: evidenceRow.summary,
        kind: input.type,
        actor: input.actorUserId ?? "admissions-experience",
        metadata: {
          recordType: input.recordType,
          recordId: input.recordId,
        },
      });
    } catch {
      /* twin optional in constrained environments */
    }

    try {
      const memory = createMemoryService();
      memory.create({
        organizationId: input.organizationId,
        title: memoryRow.title,
        summary: evidenceRow.summary,
        source: "Evidence",
        category: "Operational",
        confidence: "system",
        status: "Draft",
        createdBy: input.actorUserId ?? "admissions-experience",
      });
    } catch {
      /* memory optional */
    }

    try {
      const knowledge = createKnowledgeEngine();
      knowledge.recordEvidenceFact({
        organizationId: input.organizationId,
        userId: input.actorUserId ?? "admissions-experience",
        documentId: `admissions-event:${event.id}`,
        versionId: `admissions-event:${event.id}:v1`,
        location: input.type,
        statement: evidenceRow.summary,
        confidence: 0.9,
        method: "manual",
      });
    } catch {
      /* evidence ledger optional when no document context */
    }
  }

  return event;
}
