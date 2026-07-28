import { randomUUID } from "node:crypto";
import { emitWorkforceEvent } from "./events";
import { getEmployee, listAssignments, upsertAssignment } from "./store";
import type { AssignmentKind, StaffAssignment } from "./types";
import { ASSIGNMENT_KINDS } from "./types";

export function createAssignmentService() {
  return {
    assign(input: {
      organizationId: string;
      employeeId: string;
      kind: AssignmentKind;
      targetId: string;
      targetName: string;
      startsOn: string;
      endsOn?: string | null;
      createdBy: string;
    }): StaffAssignment | { error: string } {
      if (!getEmployee(input.organizationId, input.employeeId)) {
        return { error: "Employee not found." };
      }
      if (!(ASSIGNMENT_KINDS as readonly string[]).includes(input.kind)) {
        return { error: "Invalid assignment kind." };
      }
      if (!input.targetName.trim()) {
        return { error: "targetName is required." };
      }

      const overlap = listAssignments(
        input.organizationId,
        input.employeeId
      ).find(
        (a) =>
          a.kind === input.kind &&
          a.targetId === input.targetId &&
          a.endsOn == null
      );
      if (overlap) {
        return { error: "Active assignment already exists for this target." };
      }

      const assignment = upsertAssignment({
        id: randomUUID(),
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        kind: input.kind,
        targetId: input.targetId,
        targetName: input.targetName.trim(),
        startsOn: input.startsOn.slice(0, 10),
        endsOn: input.endsOn?.slice(0, 10) ?? null,
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
      });

      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "StaffAssignment",
        entityId: assignment.id,
        eventType: "assignment_created",
        actor: input.createdBy,
        metadata: { kind: input.kind, employeeId: input.employeeId },
      });
      return assignment;
    },

    list: listAssignments,

    end(input: {
      organizationId: string;
      assignmentId: string;
      endsOn: string;
      actor: string;
    }): StaffAssignment | null {
      const current = listAssignments(input.organizationId).find(
        (a) => a.id === input.assignmentId
      );
      if (!current) return null;
      const next = upsertAssignment({
        ...current,
        endsOn: input.endsOn.slice(0, 10),
      });
      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "StaffAssignment",
        entityId: next.id,
        eventType: "assignment_ended",
        actor: input.actor,
      });
      return next;
    },

    history(organizationId: string, employeeId: string) {
      return listAssignments(organizationId, employeeId);
    },
  };
}
