/**
 * Teacher assignment definitions — no runtime assignment engine.
 */

import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_TEACHER_ASSIGNMENT_ENTITY_TYPE =
  "TeacherAssignment" as const;

export const ACADEMY_SCHEDULING_TEACHER_ASSIGNMENT_METADATA_KEYS = Object.freeze([
  "teacherId",
  "employeeId",
  "sectionId",
  "classId",
  "campusId",
  "programId",
  "assignmentRole",
  "isPrimaryTeacher",
  "substituteEligible",
  "instructionalRole",
  "effectiveFrom",
  "effectiveTo",
  "status",
] as const);

export const AcademySchedulingTeacherAssignmentEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_TEACHER_ASSIGNMENT_ENTITY_TYPE,
    label: "Teacher Assignment",
    metadataKeys: ACADEMY_SCHEDULING_TEACHER_ASSIGNMENT_METADATA_KEYS,
    searchableFields: Object.freeze([
      Object.freeze({
        key: "teacherId",
        label: "Teacher",
        type: "string" as const,
        filterable: true,
      }),
      Object.freeze({
        key: "isPrimaryTeacher",
        label: "Primary teacher",
        type: "boolean" as const,
        filterable: true,
      }),
      Object.freeze({
        key: "substituteEligible",
        label: "Substitute eligible",
        type: "boolean" as const,
        filterable: true,
      }),
      Object.freeze({
        key: "instructionalRole",
        label: "Instructional role",
        type: "enum" as const,
        filterable: true,
      }),
      Object.freeze({
        key: "campusId",
        label: "Campus",
        type: "string" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm(
        "read",
        ACADEMY_SCHEDULING_PERMISSIONS.viewSchedule,
        "View Schedule"
      ),
      schedulingPerm(
        "update",
        ACADEMY_SCHEDULING_PERMISSIONS.assignTeacher,
        "Assign Teacher"
      ),
      schedulingPerm("read", "academyos.scheduling.read"),
      schedulingPerm("update", "academyos.scheduling.update"),
      schedulingPerm("read", "academyos.staff.read"),
    ]),
  });
