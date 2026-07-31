import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_CLASS_ENTITY_TYPE = "Class" as const;

export const AcademySchedulingClassEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_CLASS_ENTITY_TYPE,
    label: "Class",
    metadataKeys: Object.freeze([
      "displayName",
      "courseId",
      "programId",
      "campusId",
      "academicTermId",
      "primaryTeacherId",
      "capacity",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Class",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "programId",
        label: "Program",
        type: "string" as const,
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
      schedulingPerm(
        "read",
        ACADEMY_SCHEDULING_PERMISSIONS.viewSchedule,
        "View Schedule"
      ),
      schedulingPerm(
        "create",
        ACADEMY_SCHEDULING_PERMISSIONS.createClass,
        "Create Class"
      ),
      schedulingPerm("update", ACADEMY_SCHEDULING_PERMISSIONS.editSchedule),
      schedulingPerm("read", "academyos.scheduling.read"),
      schedulingPerm("create", "academyos.scheduling.create"),
      schedulingPerm("update", "academyos.scheduling.update"),
    ]),
  });
