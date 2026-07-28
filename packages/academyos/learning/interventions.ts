import { randomUUID } from "node:crypto";
import { recordStudentTimeline } from "../sis/audit";
import { getStudent } from "../sis/store";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitLearningEvent } from "./events";
import {
  getIntervention,
  listInterventions,
  upsertIntervention,
} from "./store";
import type {
  Intervention,
  InterventionKind,
  InterventionStatus,
} from "./types";
import { INTERVENTION_KINDS, INTERVENTION_STATUSES } from "./types";

export function createInterventionService() {
  return {
    create(input: {
      organizationId: string;
      studentId: string;
      kind: InterventionKind;
      goals: string;
      assignedStaffIds?: readonly string[];
      startsOn: string;
      endsOn?: string | null;
      reviewOn?: string | null;
      createdBy: string;
    }): Intervention | { error: string } {
      if (!getStudent(input.organizationId, input.studentId)) {
        return { error: "Student not found." };
      }
      if (!(INTERVENTION_KINDS as readonly string[]).includes(input.kind)) {
        return { error: "Invalid intervention kind." };
      }
      if (!input.goals.trim()) return { error: "goals are required." };

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Intervention",
        twinEntityType: "Document",
        id,
        label: `${input.kind} intervention`,
        kind: "intervention",
        actor: input.createdBy,
        metadata: { studentId: input.studentId },
      });

      const row = upsertIntervention({
        id,
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: input.kind,
        status: "Active",
        goals: input.goals.trim(),
        assignedStaffIds: Object.freeze([...(input.assignedStaffIds ?? [])]),
        startsOn: input.startsOn.slice(0, 10),
        endsOn: input.endsOn?.slice(0, 10) ?? null,
        reviewOn: input.reviewOn?.slice(0, 10) ?? null,
        outcome: "",
        progressNotes: "",
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: "iep_review",
        message: `${input.kind} intervention started.`,
        actor: input.createdBy,
      });

      emitLearningEvent({
        organizationId: input.organizationId,
        entityType: "Intervention",
        entityId: id,
        eventType: "intervention_created",
        actor: input.createdBy,
        metadata: { kind: input.kind, studentId: input.studentId },
      });
      return row;
    },

    get: getIntervention,
    list: listInterventions,

    patch(input: {
      organizationId: string;
      interventionId: string;
      status?: InterventionStatus;
      goals?: string;
      assignedStaffIds?: readonly string[];
      endsOn?: string | null;
      reviewOn?: string | null;
      outcome?: string;
      progressNotes?: string;
      actor: string;
    }): Intervention | { error: string } | null {
      const current = getIntervention(
        input.organizationId,
        input.interventionId
      );
      if (!current) return null;
      if (
        input.status &&
        !(INTERVENTION_STATUSES as readonly string[]).includes(input.status)
      ) {
        return { error: "Invalid intervention status." };
      }
      const next = upsertIntervention({
        ...current,
        status: input.status ?? current.status,
        goals: input.goals?.trim() || current.goals,
        assignedStaffIds: input.assignedStaffIds
          ? Object.freeze([...input.assignedStaffIds])
          : current.assignedStaffIds,
        endsOn:
          input.endsOn !== undefined
            ? input.endsOn?.slice(0, 10) ?? null
            : current.endsOn,
        reviewOn:
          input.reviewOn !== undefined
            ? input.reviewOn?.slice(0, 10) ?? null
            : current.reviewOn,
        outcome: input.outcome ?? current.outcome,
        progressNotes: input.progressNotes ?? current.progressNotes,
        updatedAt: new Date().toISOString(),
      });
      emitLearningEvent({
        organizationId: input.organizationId,
        entityType: "Intervention",
        entityId: next.id,
        eventType: "intervention_updated",
        actor: input.actor,
        metadata: { status: next.status },
      });
      return next;
    },

    needingIntervention(organizationId: string): readonly Intervention[] {
      return listInterventions(organizationId, {}).filter(
        (i) => i.status === "Active" || i.status === "Review Due"
      );
    },
  };
}
