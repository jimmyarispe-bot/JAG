import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_SECTION_ENTITY_TYPE = "Section" as const;

export const AcademySchedulingSectionEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_SECTION_ENTITY_TYPE,
    label: "Section",
    metadataKeys: Object.freeze([
      "displayName",
      "classId",
      "courseId",
      "sectionCode",
      "roomId",
      "timeSlotId",
      "bellScheduleId",
      "primaryTeacherId",
      "capacity",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Section",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "sectionCode",
        label: "Section code",
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
      schedulingPerm("read", ACADEMY_SCHEDULING_PERMISSIONS.viewSchedule),
      schedulingPerm("create", ACADEMY_SCHEDULING_PERMISSIONS.createClass),
      schedulingPerm("update", ACADEMY_SCHEDULING_PERMISSIONS.editSchedule),
      schedulingPerm(
        "administer",
        ACADEMY_SCHEDULING_PERMISSIONS.publishSchedule,
        "Publish Schedule"
      ),
      schedulingPerm("read", "academyos.scheduling.read"),
      schedulingPerm("update", "academyos.scheduling.update"),
    ]),
  });
