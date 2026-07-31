import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_ROOM_ENTITY_TYPE = "Room" as const;

export const AcademySchedulingRoomEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_ROOM_ENTITY_TYPE,
    label: "Room",
    metadataKeys: Object.freeze([
      "displayName",
      "code",
      "schoolId",
      "campusId",
      "capacity",
      "roomType",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Room",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "code",
        label: "Room code",
        type: "string" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm("read", ACADEMY_SCHEDULING_PERMISSIONS.viewSchedule),
      schedulingPerm("update", ACADEMY_SCHEDULING_PERMISSIONS.manageRooms),
      schedulingPerm("read", "academyos.scheduling.read"),
      schedulingPerm("update", "academyos.scheduling.update"),
    ]),
  });
