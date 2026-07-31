/**
 * Student schedule definitions — enrolled / active / future / historical.
 * No runtime scheduling.
 */

import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_STUDENT_SCHEDULE_ENTITY_TYPE =
  "StudentSchedule" as const;

export type StudentScheduleHorizon =
  | "enrolled"
  | "active"
  | "future"
  | "historical";

export const ACADEMY_STUDENT_SCHEDULE_HORIZONS: readonly StudentScheduleHorizon[] =
  Object.freeze(["enrolled", "active", "future", "historical"]);

export const AcademySchedulingStudentScheduleEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_STUDENT_SCHEDULE_ENTITY_TYPE,
    label: "Student Schedule",
    metadataKeys: Object.freeze([
      "studentId",
      "academicTermId",
      "sectionIds",
      "classIds",
      "horizon",
      "effectiveFrom",
      "effectiveTo",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "studentId",
        label: "Student",
        type: "string" as const,
        filterable: true,
      }),
      Object.freeze({
        key: "horizon",
        label: "Schedule horizon",
        type: "enum" as const,
        filterable: true,
      }),
      Object.freeze({
        key: "status",
        label: "Status",
        type: "enum" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm("read", ACADEMY_SCHEDULING_PERMISSIONS.viewSchedule),
      schedulingPerm("update", ACADEMY_SCHEDULING_PERMISSIONS.editSchedule),
      schedulingPerm("read", "academyos.scheduling.read"),
      schedulingPerm("update", "academyos.scheduling.update"),
      schedulingPerm("read", "academyos.students.read"),
    ]),
  });
