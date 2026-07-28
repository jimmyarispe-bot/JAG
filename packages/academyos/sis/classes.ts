import { randomUUID } from "node:crypto";
import { recordStudentTimeline } from "./audit";
import { emitSisEvent } from "./events";
import {
  getStudent,
  listClassAssignments,
  upsertClassAssignment,
  upsertStudent,
} from "./store";
import type { ClassAssignment, ClassAssignmentKind } from "./types";
import { CLASS_ASSIGNMENT_KINDS } from "./types";

export function createClassEnrollmentService() {
  return {
    assign(input: {
      organizationId: string;
      studentId: string;
      classId: string;
      className: string;
      kind: ClassAssignmentKind;
      teacherId?: string | null;
      campusId?: string | null;
      startsOn: string;
      endsOn?: string | null;
      createdBy: string;
    }): ClassAssignment | { error: string } {
      const student = getStudent(input.organizationId, input.studentId);
      if (!student) return { error: "Student not found." };
      if (!(CLASS_ASSIGNMENT_KINDS as readonly string[]).includes(input.kind)) {
        return { error: "Invalid class assignment kind." };
      }
      if (!input.className.trim()) return { error: "className is required." };

      // Scheduling rule: no overlapping active assignment of same kind+classId
      const overlap = listClassAssignments(
        input.organizationId,
        input.studentId
      ).find(
        (c) =>
          c.classId === input.classId &&
          c.kind === input.kind &&
          c.endsOn == null
      );
      if (overlap) {
        return { error: "Student already assigned to this class/group." };
      }

      const now = new Date().toISOString();
      const assignment = upsertClassAssignment({
        id: randomUUID(),
        organizationId: input.organizationId,
        studentId: input.studentId,
        classId: input.classId,
        className: input.className.trim(),
        kind: input.kind,
        teacherId: input.teacherId ?? null,
        campusId: input.campusId ?? student.campusId,
        startsOn: input.startsOn.slice(0, 10),
        endsOn: input.endsOn ?? null,
        createdAt: now,
        createdBy: input.createdBy,
      });

      if (input.kind === "Class") {
        const courses = new Set(student.academic.currentCourseIds);
        courses.add(input.classId);
        upsertStudent({
          ...student,
          academic: {
            ...student.academic,
            currentCourseIds: Object.freeze([...courses]),
          },
          updatedAt: now,
        });
      }

      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: "schedule_change",
        message: `Assigned to ${input.kind}: ${assignment.className}.`,
        actor: input.createdBy,
      });
      emitSisEvent({
        organizationId: input.organizationId,
        entityType: "ClassAssignment",
        entityId: assignment.id,
        eventType: "class_assigned",
        actor: input.createdBy,
        metadata: {
          studentId: input.studentId,
          kind: input.kind,
          classId: input.classId,
        },
      });
      return assignment;
    },

    list: listClassAssignments,

    end(input: {
      organizationId: string;
      assignmentId: string;
      endsOn: string;
      actor: string;
    }): ClassAssignment | null {
      const current = listClassAssignments(input.organizationId).find(
        (c) => c.id === input.assignmentId
      );
      if (!current) return null;
      const next = upsertClassAssignment({
        ...current,
        endsOn: input.endsOn.slice(0, 10),
      });
      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: current.studentId,
        kind: "schedule_change",
        message: `Ended assignment: ${current.className}.`,
        actor: input.actor,
      });
      return next;
    },
  };
}
