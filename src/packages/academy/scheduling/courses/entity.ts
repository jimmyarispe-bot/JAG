import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_COURSE_ENTITY_TYPE = "Course" as const;

export const AcademySchedulingCourseEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_COURSE_ENTITY_TYPE,
    label: "Course",
    metadataKeys: Object.freeze([
      "displayName",
      "code",
      "subjectId",
      "programId",
      "credits",
      "gradeBand",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Course",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "code",
        label: "Code",
        type: "string" as const,
        filterable: true,
      }),
      Object.freeze({
        key: "programId",
        label: "Program",
        type: "string" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm("read", ACADEMY_SCHEDULING_PERMISSIONS.viewSchedule),
      schedulingPerm("create", ACADEMY_SCHEDULING_PERMISSIONS.createClass),
      schedulingPerm("read", "academyos.scheduling.read"),
      schedulingPerm("update", "academyos.scheduling.update"),
    ]),
  });
