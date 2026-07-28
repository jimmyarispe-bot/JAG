import { randomUUID } from "node:crypto";
import { createClassEnrollmentService } from "../sis/classes";
import { getStudent } from "../sis/store";
import { recordStudentTimeline } from "../sis/audit";
import { emitAcademicOpsEvent } from "./events";
import { slotOverlaps } from "./rules";
import {
  getClass,
  listEnrollments,
  listWaitlist,
  removeWaitlist,
  upsertClass,
  upsertEnrollment,
  upsertWaitlist,
} from "./store";
import type {
  StudentClassEnrollment,
  StudentScheduleKind,
  WaitlistEntry,
} from "./types";
import { STUDENT_SCHEDULE_KINDS } from "./types";

function mapKindToSis(
  kind: StudentScheduleKind
): "Class" | "Intervention" | "Therapy Group" | "Virtual Session" {
  switch (kind) {
    case "Intervention":
      return "Intervention";
    case "Therapy":
      return "Therapy Group";
    case "Virtual Tutoring":
      return "Virtual Session";
    default:
      return "Class";
  }
}

export function createStudentSchedulingService() {
  return {
    assign(input: {
      organizationId: string;
      classId: string;
      studentId: string;
      kind?: StudentScheduleKind;
      startsOn?: string;
      createdBy: string;
      allowWaitlist?: boolean;
    }):
      | { enrollment: StudentClassEnrollment }
      | { waitlist: WaitlistEntry }
      | { error: string } {
      const cls = getClass(input.organizationId, input.classId);
      if (!cls) return { error: "Class not found." };
      if (cls.status === "Cancelled" || cls.status === "Archived") {
        return { error: "Class is not open for enrollment." };
      }
      const student = getStudent(input.organizationId, input.studentId);
      if (!student) return { error: "Student not found." };

      const kind = input.kind ?? "Core";
      if (!(STUDENT_SCHEDULE_KINDS as readonly string[]).includes(kind)) {
        return { error: "Invalid schedule kind." };
      }

      // Campus eligibility
      if (
        cls.campusId &&
        student.campusId &&
        cls.campusId !== student.campusId
      ) {
        return { error: "Student campus does not match class campus." };
      }

      // Program eligibility (soft match when both set and non-General)
      if (
        cls.program &&
        student.program &&
        cls.program !== "General" &&
        student.program !== "General" &&
        cls.program !== student.program
      ) {
        return { error: "Student program is not eligible for this class." };
      }

      // Grade eligibility
      if (
        cls.gradeLevels.length > 0 &&
        !cls.gradeLevels.includes(student.gradeLevel)
      ) {
        return { error: "Student grade level is not eligible for this class." };
      }

      const existing = listEnrollments(input.organizationId, {
        studentId: input.studentId,
        classId: input.classId,
      }).find((e) => e.status === "Active");
      if (existing) {
        return { error: "Student already enrolled in this class." };
      }

      // Schedule conflict across active enrollments
      const active = listEnrollments(input.organizationId, {
        studentId: input.studentId,
      }).filter((e) => e.status === "Active");
      for (const en of active) {
        const other = getClass(input.organizationId, en.classId);
        if (!other || other.status !== "Active") continue;
        for (const a of cls.schedule) {
          for (const b of other.schedule) {
            if (slotOverlaps(a, b)) {
              return {
                error: `Schedule conflict with ${other.name}.`,
              };
            }
          }
        }
      }

      // Capacity / waitlist
      if (cls.currentEnrollment >= cls.capacity) {
        if (input.allowWaitlist === false) {
          return { error: "Class is at capacity." };
        }
        const position = listWaitlist(input.organizationId, cls.id).length + 1;
        const waitlist = upsertWaitlist({
          id: randomUUID(),
          organizationId: input.organizationId,
          classId: cls.id,
          studentId: input.studentId,
          position,
          createdAt: new Date().toISOString(),
        });
        upsertClass({
          ...cls,
          waitlistCount: position,
          status: "Waitlisted",
          updatedAt: new Date().toISOString(),
        });
        recordStudentTimeline({
          organizationId: input.organizationId,
          studentId: input.studentId,
          kind: "schedule_change",
          message: `Waitlisted for ${cls.name} (position ${position}).`,
          actor: input.createdBy,
        });
        emitAcademicOpsEvent({
          organizationId: input.organizationId,
          entityType: "WaitlistEntry",
          entityId: waitlist.id,
          eventType: "student_waitlisted",
          actor: input.createdBy,
          metadata: { classId: cls.id, studentId: input.studentId },
        });
        return { waitlist };
      }

      const now = new Date().toISOString();
      const enrollment = upsertEnrollment({
        id: randomUUID(),
        organizationId: input.organizationId,
        classId: cls.id,
        studentId: input.studentId,
        kind,
        status: "Active",
        startsOn: (input.startsOn ?? now).slice(0, 10),
        endsOn: null,
        createdAt: now,
        createdBy: input.createdBy,
      });

      upsertClass({
        ...cls,
        currentEnrollment: cls.currentEnrollment + 1,
        updatedAt: now,
      });

      // Sync SIS class assignment
      createClassEnrollmentService().assign({
        organizationId: input.organizationId,
        studentId: input.studentId,
        classId: cls.id,
        className: cls.name,
        kind: mapKindToSis(kind),
        teacherId: cls.teacherId,
        campusId: cls.campusId,
        startsOn: enrollment.startsOn,
        createdBy: input.createdBy,
      });

      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: "schedule_change",
        message: `Enrolled in ${kind}: ${cls.name}.`,
        actor: input.createdBy,
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "StudentClassEnrollment",
        entityId: enrollment.id,
        eventType: "student_scheduled",
        actor: input.createdBy,
        metadata: { classId: cls.id, studentId: input.studentId, kind },
      });
      return { enrollment };
    },

    list: listEnrollments,

    drop(input: {
      organizationId: string;
      enrollmentId: string;
      endsOn?: string;
      actor: string;
    }): StudentClassEnrollment | null {
      const current = listEnrollments(input.organizationId).find(
        (e) => e.id === input.enrollmentId
      );
      if (!current || current.status !== "Active") return null;
      const now = new Date().toISOString();
      const next = upsertEnrollment({
        ...current,
        status: "Dropped",
        endsOn: (input.endsOn ?? now).slice(0, 10),
      });
      const cls = getClass(input.organizationId, current.classId);
      if (cls) {
        upsertClass({
          ...cls,
          currentEnrollment: Math.max(0, cls.currentEnrollment - 1),
          updatedAt: now,
        });
        // Promote waitlist head if any
        const head = listWaitlist(input.organizationId, cls.id)[0];
        if (head) {
          removeWaitlist(input.organizationId, head.id);
          this.assign({
            organizationId: input.organizationId,
            classId: cls.id,
            studentId: head.studentId,
            createdBy: input.actor,
            allowWaitlist: false,
          });
          const remaining = listWaitlist(input.organizationId, cls.id);
          upsertClass({
            ...getClass(input.organizationId, cls.id)!,
            waitlistCount: remaining.length,
            status: remaining.length > 0 ? "Waitlisted" : "Active",
            updatedAt: new Date().toISOString(),
          });
        }
      }
      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: current.studentId,
        kind: "schedule_change",
        message: `Dropped from class ${current.classId}.`,
        actor: input.actor,
      });
      return next;
    },
  };
}
