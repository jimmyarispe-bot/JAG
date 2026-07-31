import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_TIME_SLOT_ENTITY_TYPE = "TimeSlot" as const;

export const AcademySchedulingTimeSlotEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_TIME_SLOT_ENTITY_TYPE,
    label: "Time Slot",
    metadataKeys: Object.freeze([
      "displayName",
      "dayOfWeek",
      "startTime",
      "endTime",
      "periodLabel",
      "bellScheduleId",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Time slot",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "dayOfWeek",
        label: "Day of week",
        type: "enum" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm("read", ACADEMY_SCHEDULING_PERMISSIONS.viewSchedule),
      schedulingPerm("update", ACADEMY_SCHEDULING_PERMISSIONS.editSchedule),
      schedulingPerm("read", "academyos.scheduling.read"),
      schedulingPerm("update", "academyos.scheduling.update"),
    ]),
  });
